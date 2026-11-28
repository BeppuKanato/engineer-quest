import OpenAI from "openai";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

/**
 * AI 相談機能（ステージ1）。
 *
 * 学習者が学習プレイヤーから常駐で開ける相談。相談相手は答え・解法コード・
 * 最終チャレンジの解答を絶対に出さない。担保は二重にする。
 *  1. システムプロンプトで禁止を明示する（buildAiConsultationMessages）。
 *  2. 応答の事後チェック（guardAiConsultationReply）で、コードブロック等の
 *     解法コードらしい内容を含む応答は丸ごと安全な差し替え文へ置き換える。
 * 相談は単元に紐づけて AiConsultation に保存し、後段（フィードバック入力・
 * 実績判定）の入力になる。
 *
 * 凍結範囲（feedbackV1.* / feedbackV2.* 等）には触らず、LLM 呼び出しの流儀
 * （OpenAI クライアント生成・モデル環境変数・タイムアウト）だけを合わせる。
 */

import {
  AI_CONSULTATION_CODE_MAX_LENGTH,
  AI_CONSULTATION_HISTORY_LIMIT,
  AI_CONSULTATION_MESSAGE_MAX_LENGTH,
  AI_CONSULTATION_PROMPT_VERSION,
  AI_CONSULTATION_TEST_SUMMARY_MAX_LENGTH,
  buildAiConsultationMessages,
  guardAiConsultationReply,
  truncate,
  type AiConsultationContext,
  type AiConsultationMessage,
} from "./aiConsultation.guard";

export type { AiConsultationContext, AiConsultationHistoryEntry, AiConsultationMessage } from "./aiConsultation.guard";

export type AiConsultationLlmCaller = (
  messages: AiConsultationMessage[]
) => Promise<string>;

const defaultLlmCaller: AiConsultationLlmCaller = async (messages) => {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 120_000,
    maxRetries: 0,
  });
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-6-luna",
    messages,
  });
  const content = response.choices[0]?.message.content;
  if (!content?.trim()) {
    throw new AppError(502, "AI_CONSULTATION_EMPTY", "相談の応答が生成できませんでした。");
  }
  return content;
};

export type AiConsultationRecord = {
  id: string;
  courseId: string;
  phaseKey: string | null;
  userMessage: string;
  assistantMessage: string;
  blocked: boolean;
  createdAt: string;
};

const recordView = (record: {
  id: string;
  courseId: string;
  phaseKey: string | null;
  userMessage: string;
  assistantMessage: string;
  blocked: boolean;
  createdAt: Date;
}): AiConsultationRecord => ({
  id: record.id,
  courseId: record.courseId,
  phaseKey: record.phaseKey,
  userMessage: record.userMessage,
  assistantMessage: record.assistantMessage,
  blocked: record.blocked,
  createdAt: record.createdAt.toISOString(),
});

const requireNonEmptyString = (value: unknown, code: string, message: string): string => {
  if (typeof value !== "string" || !value.trim()) throw new AppError(400, code, message);
  return value.trim();
};

export const createAiConsultation = async (
  userId: string,
  input: {
    courseId?: unknown;
    phaseKey?: unknown;
    message?: unknown;
    context?: { code?: unknown; testSummary?: unknown } | null;
  },
  llmCaller: AiConsultationLlmCaller = defaultLlmCaller
): Promise<{ consultation: AiConsultationRecord; reply: string; blocked: boolean }> => {
  const courseId = requireNonEmptyString(input.courseId, "INVALID_COURSE_ID", "単元を指定してください。");
  const message = requireNonEmptyString(input.message, "INVALID_MESSAGE", "相談内容を入力してください。");
  if (message.length > AI_CONSULTATION_MESSAGE_MAX_LENGTH) {
    throw new AppError(400, "MESSAGE_TOO_LONG", "相談内容が長すぎます。短く分けて送ってください。");
  }
  const phaseKey =
    typeof input.phaseKey === "string" && input.phaseKey.trim() ? input.phaseKey.trim().slice(0, 100) : null;
  const context: AiConsultationContext = {
    code: typeof input.context?.code === "string" ? input.context.code : undefined,
    testSummary: typeof input.context?.testSummary === "string" ? input.context.testSummary : undefined,
  };

  const recent = await prisma.aiConsultation.findMany({
    where: { userId, courseId },
    orderBy: { createdAt: "desc" },
    take: AI_CONSULTATION_HISTORY_LIMIT,
    select: { userMessage: true, assistantMessage: true },
  });
  const messages = buildAiConsultationMessages({
    courseId,
    phaseKey,
    message,
    context,
    history: recent.reverse(),
  });

  const rawReply = await llmCaller(messages);
  const guarded = guardAiConsultationReply(rawReply);

  const saved = await prisma.aiConsultation.create({
    data: {
      userId,
      courseId,
      phaseKey,
      userMessage: message,
      assistantMessage: guarded.text,
      blocked: guarded.blocked,
      context: {
        hasCode: Boolean(context.code?.trim()),
        code: context.code ? truncate(context.code, AI_CONSULTATION_CODE_MAX_LENGTH) : undefined,
        testSummary: context.testSummary
          ? truncate(context.testSummary, AI_CONSULTATION_TEST_SUMMARY_MAX_LENGTH)
          : undefined,
        promptVersion: AI_CONSULTATION_PROMPT_VERSION,
      },
    },
  });
  const consultation = recordView(saved);
  return { consultation, reply: guarded.text, blocked: guarded.blocked };
};

export const listAiConsultations = async (
  userId: string,
  courseIdInput: unknown
): Promise<{ consultations: AiConsultationRecord[] }> => {
  const courseId = requireNonEmptyString(courseIdInput, "INVALID_COURSE_ID", "単元を指定してください。");
  const records = await prisma.aiConsultation.findMany({
    where: { userId, courseId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return { consultations: records.map(recordView) };
};
