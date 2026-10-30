import "dotenv/config";

import { FeedbackCondition } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { buildCourseExamFeedbackContext } from "../service/courseExamFeedback.context";
import { buildCourseExamFeedbackPrompt } from "../service/courseExamFeedback.prompt";

const rewardRunId = process.argv[2]?.trim();
if (!rewardRunId) {
  throw new Error(
    "Usage: npm run preview:feedback-prompts -- <rewardRunId>"
  );
}

const main = async () => {
  const rewardRun = await prisma.missionRewardRun.findUnique({
    where: { id: rewardRunId },
    select: {
      user: {
        select: {
          firebaseUid: true,
          hexadResponse: {
            select: {
              questionnaireVersion: true,
              philanthropistScore: true,
              socialiserScore: true,
              freeSpiritScore: true,
              achieverScore: true,
              disruptorScore: true,
              playerScore: true,
            },
          },
        },
      },
    },
  });
  if (!rewardRun) throw new Error("Reward run not found");
  const hexad = rewardRun.user.hexadResponse;
  if (!hexad) throw new Error("HEXAD response not found");

  const context = await buildCourseExamFeedbackContext({
    firebaseUid: rewardRun.user.firebaseUid,
    rewardRunId,
  });
  const hexadProfile = {
    questionnaireVersion: hexad.questionnaireVersion,
    Philanthropist: hexad.philanthropistScore,
    Socialiser: hexad.socialiserScore,
    "Free Spirit": hexad.freeSpiritScore,
    Achiever: hexad.achieverScore,
    Disruptor: hexad.disruptorScore,
    Player: hexad.playerScore,
  };
  const commonInput = {
    learningLog: context.learningLog,
    appState: context.appState,
    availableActions: context.availableActions,
  };

  const standardPrompt = buildCourseExamFeedbackPrompt({
    ...commonInput,
    condition: FeedbackCondition.STANDARD,
    hexadProfile: null,
  });
  const personalizedPrompt = buildCourseExamFeedbackPrompt({
    ...commonInput,
    condition: FeedbackCondition.PERSONALIZED,
    hexadProfile,
  });

  console.info("===== STANDARD PROMPT =====");
  console.info(standardPrompt);
  console.info("===== PERSONALIZED PROMPT =====");
  console.info(personalizedPrompt);
};

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
