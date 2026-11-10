/**
 * 大目標の提案と確定（Issue #366）。
 * 提案は機会（eventKey）ごとに冪等で、生成はフィードバック v1 と同じ
 * GENERATING → GENERATED／FAILED の非同期パターンで進む。
 * 確定は学習者の合意操作でのみ行い、黙って有効化はしない。確定時は
 * 現在の学習者状態で候補を再検証し、古い提案のまま確定できないようにする。
 * 有効な大目標は同時に1つだけ。合意のうえで差し替える場合は、旧目標を
 * 見直し済みとして閉じ、新目標に supersedesId で引き継ぎを記録する。
 */
import { BigGoalStatus, Prisma } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import {
  generateBigGoalCandidates,
  type BigGoalCandidate,
} from "./bigGoal.candidates";
import {
  scoreBigGoalCandidates,
  type BigGoalScoringOutput,
} from "./bigGoal.scoring";
import { loadLearnerGoalState, summarizeLearnerStateForScoring } from "./bigGoal.state";
import { evaluateBigGoalRow } from "./bigGoal.service";

const json = (v: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(v));

// フィードバック v1 と同じ実験キー（feedbackV1.context.ts の定義に合わせる）。
const HEXAD_FEEDBACK_EXPERIMENT_KEY = "HEXAD_FEEDBACK_2026";
const GENERATING_TIMEOUT_MS = 10 * 60_000;

type AuthUser = { id: string };

export type BigGoalProposalRequest = {
  timing: "UNIT_START" | "ON_ACHIEVEMENT";
  startCourseId?: string;
  achievedGoalId?: string;
};

type StoredProposalResult = {
  candidates: BigGoalCandidate[];
  scores: BigGoalScoringOutput["scores"];
  recommendedCandidateKey: string;
  llmRecommendedCandidateKey: string;
  scoring: { model: string; promptVersion: string };
};

const eventKeyFor = (input: BigGoalProposalRequest): string =>
  input.timing === "UNIT_START"
    ? `big-goal:unit-start:${input.startCourseId}`
    : `big-goal:achievement:${input.achievedGoalId}`;

function proposalResponse(row: {
  id: string;
  timing: string;
  startCourseId: string | null;
  status: string;
  failureCode: string | null;
  result: Prisma.JsonValue | null;
  selectedCandidateKey: string | null;
  createdAt: Date;
  generatedAt: Date | null;
}) {
  const result = row.result as unknown as StoredProposalResult | null;
  const scoreByKey = new Map((result?.scores ?? []).map((s) => [s.candidateKey, s]));
  return {
    id: row.id,
    timing: row.timing,
    startCourseId: row.startCourseId,
    status: row.status,
    failureCode: row.failureCode,
    candidates: result
      ? result.candidates.map((c) => ({
          candidateKey: c.candidateKey,
          type: c.type,
          params: c.params,
          displayText: c.displayText,
          score: scoreByKey.get(c.candidateKey)?.score ?? null,
          rationale: scoreByKey.get(c.candidateKey)?.rationale ?? null,
        }))
      : null,
    recommendedCandidateKey: result?.recommendedCandidateKey ?? null,
    selectedCandidateKey: row.selectedCandidateKey,
    createdAt: row.createdAt.toISOString(),
    generatedAt: row.generatedAt?.toISOString() ?? null,
  };
}

async function resolveScoringCondition(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      hexadResponse: true,
      experimentAssignments: {
        where: { experimentKey: HEXAD_FEEDBACK_EXPERIMENT_KEY },
      },
    },
  });
  const assignment = user?.experimentAssignments[0];
  // 大目標は製品機能であり実験参加を前提にしない。割り当てがない学習者は
  // STANDARD 相当（HEXAD を入力に含めない）で採点する。
  const condition =
    assignment?.condition === "PERSONALIZED" ? "PERSONALIZED" : "STANDARD";
  const h = user?.hexadResponse;
  const hexadScores =
    condition === "PERSONALIZED" && h
      ? {
          Philanthropist: h.philanthropistScore,
          Socialiser: h.socialiserScore,
          FreeSpirit: h.freeSpiritScore,
          Achiever: h.achieverScore,
          Disruptor: h.disruptorScore,
          Player: h.playerScore,
        }
      : null;
  return { condition: condition as "STANDARD" | "PERSONALIZED", hexadScores };
}

async function generateProposal(id: string, userId: string, input: BigGoalProposalRequest) {
  const state = await loadLearnerGoalState(userId);
  const candidates = generateBigGoalCandidates({
    timing: input.timing,
    startCourseId: input.startCourseId ?? null,
    state,
  });
  if (candidates.length === 0) {
    await prisma.bigGoalProposal.update({
      where: { id },
      data: { status: "FAILED", failureCode: "NO_CANDIDATES" },
    });
    return;
  }
  const { condition, hexadScores } = await resolveScoringCondition(userId);
  await prisma.bigGoalProposal.update({
    where: { id },
    data: {
      condition,
      input: json({
        timing: input.timing,
        startCourseId: input.startCourseId ?? null,
        achievedGoalId: input.achievedGoalId ?? null,
        condition,
        learnerState: summarizeLearnerStateForScoring(state),
        candidates,
        declaredInfo: null,
      }),
    },
  });
  const scoring = await scoreBigGoalCandidates(
    {
      timing: input.timing,
      startCourseId: input.startCourseId ?? null,
      candidates,
      learnerState: summarizeLearnerStateForScoring(state),
      // 初回申告の保存先は現行スキーマに存在しないため、当面は null で採点する。
      declaredInfo: null,
      condition,
      hexadScores,
    },
    {
      onCallLog: async (log) => {
        await prisma.bigGoalProposalCall.create({
          data: { proposalId: id, data: json(log) },
        });
      },
    }
  );
  const result: StoredProposalResult = {
    candidates,
    scores: scoring.scores,
    recommendedCandidateKey: scoring.recommendedCandidateKey,
    llmRecommendedCandidateKey: scoring.llmRecommendedCandidateKey,
    scoring: { model: scoring.model, promptVersion: scoring.promptVersion },
  };
  await prisma.bigGoalProposal.update({
    where: { id, status: "GENERATING" },
    data: { status: "GENERATED", result: json(result), generatedAt: new Date() },
  });
}

export async function requestBigGoalProposal(user: AuthUser, input: BigGoalProposalRequest) {
  const eventKey = eventKeyFor(input);
  let row = await prisma.bigGoalProposal.findUnique({ where: { eventKey } });
  if (row && row.userId !== user.id)
    throw new AppError(404, "PROPOSAL_NOT_FOUND", "Proposal not found");
  if (
    row?.status === "GENERATING" &&
    Date.now() - row.createdAt.getTime() > GENERATING_TIMEOUT_MS
  ) {
    await prisma.bigGoalProposal.updateMany({
      where: { id: row.id, status: "GENERATING" },
      data: { status: "FAILED", failureCode: "GENERATION_INTERRUPTED_OR_TIMEOUT" },
    });
    row = await prisma.bigGoalProposal.findUniqueOrThrow({ where: { eventKey } });
  }
  if (!row) {
    try {
      row = await prisma.bigGoalProposal.create({
        data: {
          userId: user.id,
          eventKey,
          timing: input.timing,
          startCourseId: input.startCourseId ?? null,
          status: "GENERATING",
          input: json({
            timing: input.timing,
            startCourseId: input.startCourseId ?? null,
            achievedGoalId: input.achievedGoalId ?? null,
          }),
        },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      row = await prisma.bigGoalProposal.findUniqueOrThrow({ where: { eventKey } });
      return proposalResponse(row);
    }
    const id = row.id;
    void (async () => {
      try {
        await generateProposal(id, user.id, input);
      } catch (error) {
        await prisma.bigGoalProposal.update({
          where: { id },
          data: {
            status: "FAILED",
            failureCode: error instanceof Error ? error.message : "GENERATION_FAILED",
          },
        });
      }
    })().catch((error) => console.error("big_goal_proposal_persistence_failed", { id, error }));
  }
  return proposalResponse(row);
}

export async function getBigGoalProposal(user: AuthUser, id: string) {
  const row = await prisma.bigGoalProposal.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) throw new AppError(404, "PROPOSAL_NOT_FOUND", "Proposal not found");
  return proposalResponse(row);
}

export async function confirmBigGoalProposal(
  user: AuthUser,
  id: string,
  candidateKey: string
) {
  const row = await prisma.bigGoalProposal.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) throw new AppError(404, "PROPOSAL_NOT_FOUND", "Proposal not found");
  if (row.status !== "GENERATED")
    throw new AppError(409, "PROPOSAL_NOT_READY", "Proposal is not ready to confirm");
  const result = row.result as unknown as StoredProposalResult | null;
  const candidate = result?.candidates.find((c) => c.candidateKey === candidateKey);
  if (!candidate)
    throw new AppError(400, "CANDIDATE_NOT_FOUND", "Candidate is not part of this proposal");

  // 確定時点の状態で候補を再検証し、古い提案のまま確定できないようにする。
  const state = await loadLearnerGoalState(user.id);
  const fresh = generateBigGoalCandidates({
    timing: row.timing,
    startCourseId: row.startCourseId,
    state,
  });
  if (!fresh.some((c) => c.candidateKey === candidateKey))
    throw new AppError(409, "CANDIDATE_STALE", "Candidate no longer fits the current state");

  const now = new Date();
  const created = await prisma.$transaction(async (tx) => {
    const current = await tx.bigGoal.findFirst({
      where: { userId: user.id, status: BigGoalStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
    });
    if (current) {
      await tx.bigGoal.update({
        where: { id: current.id },
        data: { status: BigGoalStatus.REVISED, closedAt: now },
      });
    }
    const goal = await tx.bigGoal.create({
      data: {
        userId: user.id,
        proposalId: row.id,
        candidateKey,
        type: candidate.type,
        params: json(candidate.params),
        displayText: candidate.displayText,
        status: BigGoalStatus.ACTIVE,
        confirmedAt: now,
        supersedesId: current?.id ?? null,
      },
    });
    await tx.bigGoalProposal.update({
      where: { id: row.id },
      data: { selectedCandidateKey: candidateKey },
    });
    return goal;
  });
  // 確定直後に1回評価し、すでに条件を満たしている目標を正しく扱う。
  await evaluateBigGoalRow({
    id: created.id,
    userId: created.userId,
    type: created.type,
    params: created.params,
    status: created.status,
  });
  const goal = await prisma.bigGoal.findUniqueOrThrow({ where: { id: created.id } });
  return { goal: goalView(goal), proposalId: row.id };
}

function goalView(goal: {
  id: string;
  type: string;
  params: Prisma.JsonValue;
  displayText: string;
  status: string;
  confirmedAt: Date | null;
  evaluation: Prisma.JsonValue | null;
  evaluatedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
}) {
  const evaluation = goal.evaluation as unknown as {
    outcome: string;
    fraction: number | null;
    detail: Record<string, unknown>;
  } | null;
  return {
    id: goal.id,
    type: goal.type,
    params: goal.params,
    displayText: goal.displayText,
    status: goal.status,
    confirmedAt: goal.confirmedAt?.toISOString() ?? null,
    progress: evaluation?.fraction ?? null,
    evaluation,
    evaluatedAt: goal.evaluatedAt?.toISOString() ?? null,
    closedAt: goal.closedAt?.toISOString() ?? null,
    createdAt: goal.createdAt.toISOString(),
  };
}

export async function getCurrentBigGoal(user: AuthUser) {
  const goal = await prisma.bigGoal.findFirst({
    where: { userId: user.id, status: BigGoalStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  });
  return { goal: goal ? goalView(goal) : null };
}

export async function listBigGoalHistory(user: AuthUser) {
  const goals = await prisma.bigGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return { goals: goals.map(goalView) };
}
