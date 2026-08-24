import { Prisma } from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { ensureHexadFeedbackExperimentAssignment } from "./experimentAssignment.service";

export const HEXAD_QUESTIONNAIRE_VERSION = "hexad-24-ja-v1";

const questionIds = [
  "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8",
  "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16",
  "Q17", "Q18", "Q19", "Q20", "Q21", "Q22", "Q23", "Q24",
] as const;

type QuestionId = (typeof questionIds)[number];
type Answers = Record<QuestionId, number>;

const validateAnswers = (value: unknown): Answers => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(400, "INVALID_HEXAD_ANSWERS", "24問すべてに回答してください。");
  }

  const input = value as Record<string, unknown>;
  const answers = {} as Answers;

  for (const questionId of questionIds) {
    const answer = input[questionId];
    if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 1 || answer > 7) {
      throw new AppError(
        400,
        "INVALID_HEXAD_ANSWERS",
        `${questionId}の回答は1〜7の整数で指定してください。`
      );
    }
    answers[questionId] = answer;
  }

  return answers;
};

const sum = (answers: Answers, ids: readonly QuestionId[]) =>
  ids.reduce((total, id) => total + answers[id], 0);

const toResponse = (response: {
  questionnaireVersion: string;
  philanthropistScore: number;
  socialiserScore: number;
  freeSpiritScore: number;
  achieverScore: number;
  disruptorScore: number;
  playerScore: number;
  completedAt: Date;
}) => ({
  questionnaireVersion: response.questionnaireVersion,
  scores: {
    philanthropist: response.philanthropistScore,
    socialiser: response.socialiserScore,
    freeSpirit: response.freeSpiritScore,
    achiever: response.achieverScore,
    disruptor: response.disruptorScore,
    player: response.playerScore,
  },
  completedAt: response.completedAt.toISOString(),
});

export const getHexadResponse = async (userId: string) => {
  const response = await prisma.hexadResponse.findUnique({
    where: { userId },
  });

  return {
    hasResponse: response !== null,
    response: response ? toResponse(response) : null,
  };
};

export const createHexadResponse = async (
  userId: string,
  input: { questionnaireVersion?: unknown; answers?: unknown }
) => {
  if (input.questionnaireVersion !== HEXAD_QUESTIONNAIRE_VERSION) {
    throw new AppError(
      400,
      "UNSUPPORTED_HEXAD_VERSION",
      "対応していない質問紙バージョンです。"
    );
  }

  const answers = validateAnswers(input.answers);
  const scores = {
    philanthropistScore: sum(answers, ["Q1", "Q2", "Q3", "Q4"]),
    socialiserScore: sum(answers, ["Q5", "Q6", "Q7", "Q8"]),
    freeSpiritScore: sum(answers, ["Q9", "Q10", "Q11", "Q12"]),
    achieverScore: sum(answers, ["Q13", "Q14", "Q15", "Q16"]),
    disruptorScore: sum(answers, ["Q17", "Q18", "Q19", "Q20"]),
    playerScore: sum(answers, ["Q21", "Q22", "Q23", "Q24"]),
  };

  const transactionRetries = 3;
  for (let transactionAttempt = 0; transactionAttempt < transactionRetries; transactionAttempt += 1) {
    try {
      const response = await prisma.$transaction(
        async (tx) => {
          const createdResponse = await tx.hexadResponse.create({
            data: {
              userId,
              questionnaireVersion: HEXAD_QUESTIONNAIRE_VERSION,
              q1: answers.Q1,
              q2: answers.Q2,
              q3: answers.Q3,
              q4: answers.Q4,
              q5: answers.Q5,
              q6: answers.Q6,
              q7: answers.Q7,
              q8: answers.Q8,
              q9: answers.Q9,
              q10: answers.Q10,
              q11: answers.Q11,
              q12: answers.Q12,
              q13: answers.Q13,
              q14: answers.Q14,
              q15: answers.Q15,
              q16: answers.Q16,
              q17: answers.Q17,
              q18: answers.Q18,
              q19: answers.Q19,
              q20: answers.Q20,
              q21: answers.Q21,
              q22: answers.Q22,
              q23: answers.Q23,
              q24: answers.Q24,
              ...scores,
            },
          });

          await ensureHexadFeedbackExperimentAssignment(tx, userId);
          return createdResponse;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      return {
        hasResponse: true,
        response: toResponse(response),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        if (transactionAttempt < transactionRetries - 1) continue;
        throw new AppError(
          503,
          "EXPERIMENT_ASSIGNMENT_RETRY_EXHAUSTED",
          "実験条件を割り当てられませんでした。もう一度お試しください。"
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          409,
          "HEXAD_ALREADY_COMPLETED",
          "HEXADアンケートには回答済みです。"
        );
      }
      throw error;
    }
  }

  throw new Error("Unreachable experiment assignment state");
};
