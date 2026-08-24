import {
  BadgeTicketReason,
  CourseDifficulty,
  MissionType,
  Prisma,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";
import { parseActivityContent } from "../type/activityContent";
import {
  getActivityRendererDefinition,
  type ActivityAnswerRenderer,
} from "../type/activityRendererRegistry";
import { evaluateAchievementsForUser } from "./achievement.service";
import { awardBadgeTickets } from "./badge.service";
import { getKnowledgeCardCandidateIdsForMission } from "./knowledgeCard.service";
import {
  getCurrentCourseExamAttempt,
  recordCourseExamSubmission,
  startOrResumeCourseExamAttempt,
} from "./courseExamAttempt.service";

type ApiDifficulty = "easy" | "normal" | "hard";
type ApiProgressStatus = "completed" | "in_progress" | "not_started";
type ApiMissionType = "main" | "challenge" | "course_exam";

type GetMissionPlayInput = {
  missionId: string;
  firebaseUid: string;
  difficulty?: ApiDifficulty;
};

type GetMissionOverviewInput = {
  missionId: string;
  firebaseUid: string;
};

type ActivityActionInput = {
  missionId: string;
  activityId: string;
  firebaseUid: string;
};

type AnswerActivityInput = ActivityActionInput & {
  answer: unknown;
};

type CompleteMissionInput = {
  missionId: string;
  firebaseUid: string;
};

type ExperienceUpdate = {
  gainedExp: number;
  previousExperience: number;
  currentExperience: number;
  isNewlyAwarded: boolean;
};

type BadgeTicketReward = {
  amount: number;
  reason: BadgeTicketReason;
  currentTickets: number;
  transactionId: string;
  createdAt: string;
};

type MissionActivityContent = Record<string, unknown>;

const toDifficulty = (difficulty: CourseDifficulty): ApiDifficulty => {
  switch (difficulty) {
    case CourseDifficulty.EASY:
      return "easy";
    case CourseDifficulty.NORMAL:
      return "normal";
    case CourseDifficulty.HARD:
      return "hard";
  }
};

const toCourseDifficulty = (difficulty: ApiDifficulty): CourseDifficulty => {
  switch (difficulty) {
    case "easy":
      return CourseDifficulty.EASY;
    case "normal":
      return CourseDifficulty.NORMAL;
    case "hard":
      return CourseDifficulty.HARD;
  }
};

const difficultyRank: Record<CourseDifficulty, number> = {
  [CourseDifficulty.EASY]: 1,
  [CourseDifficulty.NORMAL]: 2,
  [CourseDifficulty.HARD]: 3,
};

const pickHigherDifficulty = (
  current: CourseDifficulty | null | undefined,
  next: CourseDifficulty
) => {
  if (!current) return next;
  return difficultyRank[next] > difficultyRank[current] ? next : current;
};

const toProgressStatus = (
  status?: PrismaProgressStatus | null
): ApiProgressStatus => {
  if (status === PrismaProgressStatus.COMPLETED) return "completed";
  if (status === PrismaProgressStatus.IN_PROGRESS) return "in_progress";
  return "not_started";
};

const toMissionType = (type: MissionType): ApiMissionType => {
  switch (type) {
    case MissionType.MAIN:
      return "main";
    case MissionType.CHALLENGE:
      return "challenge";
    case MissionType.COURSE_EXAM:
      return "course_exam";
  }
};

const asRecord = (value: unknown): MissionActivityContent => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as MissionActivityContent;
  }

  return {};
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
};

const normalizeStringArray = (value: unknown): string[] => {
  if (isStringArray(value)) return value;
  return [];
};

const unorderedEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;

  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();

  return sortedLeft.every((value, index) => value === sortedRight[index]);
};

const getAnswerFeedback = (
  isCorrect: boolean | null,
  content: MissionActivityContent,
  fallback = "回答を保存しました。"
) => {
  if (isCorrect === true && typeof content.correctFeedback === "string") {
    return content.correctFeedback;
  }

  if (isCorrect === false && typeof content.incorrectFeedback === "string") {
    return content.incorrectFeedback;
  }

  return fallback;
};

const judgeChoice = (
  answerRenderer: ActivityAnswerRenderer,
  content: MissionActivityContent,
  answer: unknown,
) => {
  if (answerRenderer === "INDEX_SELECT") {
    const indexQuestions = Array.isArray(content.indexSelectionQuestions)
      ? content.indexSelectionQuestions
      : [];
    const questions = indexQuestions.flatMap((question) => {
      const questionRecord = asRecord(question);
      if (
        typeof questionRecord.id !== "string" ||
        typeof questionRecord.correctIndex !== "number"
      ) {
        return [];
      }
      return [{ id: questionRecord.id, correctIndex: questionRecord.correctIndex }];
    });
    const selectedIndices = asRecord(asRecord(answer).selectedIndices);
    if (
      questions.length === 0 ||
      questions.some(({ id }) => typeof selectedIndices[id] !== "number")
    ) {
      return {
        isCorrect: false,
        feedback: "すべての問題で位置を選んでから確認してください。",
      };
    }
    const isCorrect =
      Object.keys(selectedIndices).length === questions.length &&
      questions.every(({ id, correctIndex }) => selectedIndices[id] === correctIndex);
    return { isCorrect, feedback: getAnswerFeedback(isCorrect, content) };
  }

  if (answerRenderer === "ARRAY_REGION_SELECT") {
    const rangeQuestions = Array.isArray(content.rangeDecisionQuestions)
      ? content.rangeDecisionQuestions
      : [];
    const questions = rangeQuestions.flatMap((question) => {
      const questionRecord = asRecord(question);
      const correctRegion = questionRecord.correctRegion;
      if (
        typeof questionRecord.id !== "string" ||
        (correctRegion !== "left" &&
          correctRegion !== "center" &&
          correctRegion !== "right")
      ) {
        return [];
      }

      return [{ id: questionRecord.id, correctRegion }];
    });
    const selectedRegions = asRecord(asRecord(answer).selectedRegions);

    if (
      questions.length === 0 ||
      questions.some(({ id }) => typeof selectedRegions[id] !== "string")
    ) {
      return {
        isCorrect: false,
        feedback: "すべての場面で探す範囲を選んでから確認してください。",
      };
    }

    const isCorrect =
      Object.keys(selectedRegions).length === questions.length &&
      questions.every(
        ({ id, correctRegion }) => selectedRegions[id] === correctRegion
      );

    return {
      isCorrect,
      feedback: getAnswerFeedback(isCorrect, content),
    };
  }

  const choices = Array.isArray(content.choices) ? content.choices : [];
  const selectedChoiceId =
    typeof answer === "string"
      ? answer
      : asRecord(answer).selectedChoiceId ?? asRecord(answer).choiceId;

  const selectedChoice = choices.find((choice) => {
    const choiceRecord = asRecord(choice);
    return choiceRecord.id === selectedChoiceId;
  });

  if (!selectedChoice) {
    return {
      isCorrect: false,
      feedback: "選択肢を選んでから確認してください。",
    };
  }

  const selectedChoiceRecord = asRecord(selectedChoice);
  const isCorrect = selectedChoiceRecord.isCorrect === true;
  const feedback =
    typeof selectedChoiceRecord.feedback === "string"
      ? selectedChoiceRecord.feedback
      : getAnswerFeedback(isCorrect, content);

  return { isCorrect, feedback };
};

const judgeOrderedSteps = (
  content: MissionActivityContent,
  answer: unknown
) => {
  const answerOrder = normalizeStringArray(content.answerOrder);
  const selectedOrder = normalizeStringArray(
    Array.isArray(answer) ? answer : asRecord(answer).orderedIds
  );

  if (answerOrder.length === 0) {
    return {
      isCorrect: null,
      feedback: "回答を保存しました。",
    };
  }

  const isCorrect =
    selectedOrder.length === answerOrder.length &&
    selectedOrder.every((id, index) => id === answerOrder[index]);

  return {
    isCorrect,
    feedback: getAnswerFeedback(isCorrect, content),
  };
};

const judgeMatch = (content: MissionActivityContent, answer: unknown) => {
  const answers = Array.isArray(content.answers) ? content.answers : [];
  const answerRecord = asRecord(answer);
  const matchPairs = asRecord(answerRecord.matchPairs ?? answerRecord.matches);

  if (answers.length === 0) {
    return {
      isCorrect: null,
      feedback: "回答を保存しました。",
    };
  }

  const isCorrect = answers.every((expected) => {
    const expectedRecord = asRecord(expected);
    const targetId = expectedRecord.targetId;
    const expectedItemIds = normalizeStringArray(expectedRecord.itemIds);

    if (typeof targetId !== "string") return false;

    return unorderedEqual(
      normalizeStringArray(matchPairs[targetId]),
      expectedItemIds
    );
  });

  return {
    isCorrect,
    feedback: getAnswerFeedback(isCorrect, content),
  };
};

const judgeSelectFill = (
  answerRenderer: ActivityAnswerRenderer,
  content: MissionActivityContent,
  answer: unknown,
) => {
  const answerRecord = asRecord(answer);
  const expected = content.correctAnswers ?? content.answer;

  if (expected === undefined) {
    return {
      isCorrect: null,
      feedback: "回答を保存しました。",
    };
  }

  const submitted = answerRecord.values ?? answer;
  const isCorrect = answerRenderer === "MULTI_DECISION" || answerRenderer === "PAIR_DECISION"
    ? Object.entries(asRecord(expected)).every(
        ([key, value]) => asRecord(submitted)[key] === value
      ) && Object.keys(asRecord(submitted)).length === Object.keys(asRecord(expected)).length
    : JSON.stringify(submitted) === JSON.stringify(expected);

  if (!isCorrect && answerRenderer === "CODE_BLOCK_BUILDER") {
    const selected = normalizeStringArray(answerRecord.values);
    const expectedBlocks = normalizeStringArray(expected);
    const blocks = Array.isArray(content.codeBlocks) ? content.codeBlocks : [];
    const feedbackFor = (blockId: string | undefined) => {
      const block = blocks.find((item) => asRecord(item).id === blockId);
      const feedback = asRecord(block).feedback;
      return typeof feedback === "string" ? feedback : null;
    };

    const mismatchIndex = expectedBlocks.findIndex(
      (blockId, index) => selected[index] !== blockId
    );
    if (mismatchIndex >= 0) {
      return {
        isCorrect: false,
        feedback:
          feedbackFor(selected[mismatchIndex]) ??
          (typeof content.incorrectFeedback === "string"
            ? content.incorrectFeedback
            : "ブロックの順番とインデントを確認してください。"),
      };
    }
  }

  if (!isCorrect && answerRenderer === "OPTION_FILL") {
    const selected = typeof answer === "string" ? answer : answerRecord.values;
    const optionFeedback = asRecord(content.optionFeedback);
    const feedback = typeof selected === "string" ? optionFeedback[selected] : null;
    if (typeof feedback === "string") {
      return { isCorrect: false, feedback };
    }
  }

  return {
    isCorrect,
    feedback: getAnswerFeedback(isCorrect, content),
  };
};

const judgeTryCode = (content: MissionActivityContent, answer: unknown) => {
  const answerRecord = asRecord(answer);
  const submittedCode =
    typeof answer === "string"
      ? answer
      : typeof answerRecord.code === "string"
        ? answerRecord.code
        : typeof answerRecord.userCode === "string"
          ? answerRecord.userCode
          : null;
  const answerCode =
    typeof content.answerCode === "string"
      ? content.answerCode
      : typeof content.expectedCode === "string"
        ? content.expectedCode
        : null;

  if (content.evaluationMode === "TEST_CASES") {
    const expectedTestCount = Array.isArray(content.testCases)
      ? content.testCases.length
      : 0;
    const passedTestCount =
      typeof answerRecord.passedTestCount === "number"
        ? answerRecord.passedTestCount
        : 0;
    const totalTestCount =
      typeof answerRecord.totalTestCount === "number"
        ? answerRecord.totalTestCount
        : 0;
    const isCorrect =
      typeof submittedCode === "string" &&
      submittedCode.trim().length > 0 &&
      expectedTestCount > 0 &&
      answerRecord.executionPassed === true &&
      passedTestCount === expectedTestCount &&
      totalTestCount === expectedTestCount;

    return {
      isCorrect,
      feedback: getAnswerFeedback(isCorrect, content),
    };
  }

  if (submittedCode === null || answerCode === null) {
    return {
      isCorrect: null,
      feedback: "コードを保存しました。",
    };
  }

  const normalizeTranscriptionCode = (code: string) =>
    code
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+$/g, ""))
      .join("\n")
      .replace(/\n+$/g, "");
  const isCorrect =
    content.evaluationMode === "TRANSCRIPTION"
      ? normalizeTranscriptionCode(submittedCode) ===
          normalizeTranscriptionCode(answerCode) &&
        answerRecord.executionPassed === true
      : submittedCode === answerCode;

  return {
    isCorrect,
    feedback: getAnswerFeedback(isCorrect, content),
  };
};

const judgeAnswer = (
  rendererKey: string,
  content: MissionActivityContent,
  answer: unknown
) => {
  const answerRenderer = getActivityRendererDefinition(rendererKey).answer;
  switch (answerRenderer) {
    case "SINGLE_CHOICE":
    case "ARRAY_REGION_SELECT":
    case "INDEX_SELECT":
      return judgeChoice(answerRenderer, content, answer);
    case "MATCH":
      return judgeMatch(content, answer);
    case "BLOCK_ORDER":
      return judgeOrderedSteps(content, answer);
    case "PAIR_DECISION":
    case "MULTI_DECISION":
    case "OPTION_FILL":
    case "CODE_BLOCK_BUILDER":
    case "COMPARISON_SEQUENCE":
      return judgeSelectFill(answerRenderer, content, answer);
    case "CODE_EDITOR":
      return judgeTryCode(content, answer);
    default:
      return {
        isCorrect: null,
        feedback: "回答を保存しました。",
      };
  }
};

const getUserByFirebaseUid = async (firebaseUid: string) => {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
};

const getMissionAccess = async (userId: string, missionId: string) => {
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
      course: { isPublished: true },
    },
    select: {
      id: true,
      type: true,
      order: true,
      isRequiredForCourseCompletion: true,
      parentMissionId: true,
      progresses: {
        where: { userId },
        select: { status: true },
      },
      course: {
        select: {
          missions: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              isRequiredForCourseCompletion: true,
              progresses: {
                where: { userId },
                select: { status: true },
              },
            },
          },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
  }

  const isAlreadyStarted = mission.progresses.length > 0;
  let unlockMission: { id: string; title: string } | null = null;
  let isUnlocked = isAlreadyStarted;

  if (
    !isAlreadyStarted &&
    (mission.type === MissionType.MAIN ||
      mission.type === MissionType.COURSE_EXAM)
  ) {
    const requiredMissions = mission.course.missions.filter(
      (candidate) => candidate.isRequiredForCourseCompletion
    );
    const currentIndex = requiredMissions.findIndex(
      (candidate) => candidate.id === mission.id
    );
    const previousMission =
      currentIndex > 0 ? requiredMissions[currentIndex - 1] : null;

    unlockMission = previousMission
      ? { id: previousMission.id, title: previousMission.title }
      : null;
    isUnlocked =
      previousMission === null ||
      previousMission.progresses[0]?.status === PrismaProgressStatus.COMPLETED;
  }

  if (!isAlreadyStarted && mission.type === MissionType.CHALLENGE) {
    const parentMission = mission.parentMissionId
      ? mission.course.missions.find(
          (candidate) => candidate.id === mission.parentMissionId
        ) ?? null
      : null;

    unlockMission = parentMission
      ? { id: parentMission.id, title: parentMission.title }
      : null;
    isUnlocked =
      parentMission?.progresses[0]?.status === PrismaProgressStatus.COMPLETED;
  }

  return {
    isLocked: !isUnlocked,
    unlockMission,
  };
};

const assertMissionUnlocked = async (userId: string, missionId: string) => {
  const access = await getMissionAccess(userId, missionId);

  if (access.isLocked) {
    throw new AppError(
      403,
      "MISSION_LOCKED",
      access.unlockMission
        ? `${access.unlockMission.title}を完了すると開放されます。`
        : "このミッションはまだ開放されていません。"
    );
  }

  return access;
};

const getMissionActivities = async (missionId: string) => {
  return prisma.missionActivity.findMany({
    where: {
      missionId,
    },
    orderBy: {
      order: "asc",
    },
  });
};

const getNextActivityId = async (
  missionId: string,
  completedActivityIds: string[]
) => {
  const activities = await getMissionActivities(missionId);
  return (
    activities.find((activity) => !completedActivityIds.includes(activity.id))
      ?.id ?? null
  );
};

const completeMissionIfAllActivitiesCompleted = async (
  userId: string,
  missionId: string
) => {
  const activities = await getMissionActivities(missionId);
  const progresses = await prisma.userMissionActivityProgress.findMany({
    where: {
      userId,
      activityId: {
        in: activities.map((activity) => activity.id),
      },
      status: PrismaProgressStatus.COMPLETED,
    },
    select: {
      activityId: true,
    },
  });

  const completedActivityIds = new Set(
    progresses.map((progress) => progress.activityId)
  );

  if (
    activities.length > 0 &&
    activities.every((activity) => completedActivityIds.has(activity.id))
  ) {
    await prisma.userMissionProgress.update({
      where: {
        userId_missionId: {
          userId,
          missionId,
        },
      },
      data: {
        status: PrismaProgressStatus.COMPLETED,
        currentActivityId: null,
        completedAt: new Date(),
      },
    });

    return true;
  }

  return false;
};

const awardMissionExperience = async (
  tx: Prisma.TransactionClient,
  userId: string,
  missionId: string,
  rewardExp: number
): Promise<ExperienceUpdate> => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { experience: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const progress = await tx.userMissionProgress.findUnique({
    where: {
      userId_missionId: {
        userId,
        missionId,
      },
    },
    select: {
      awardedExp: true,
    },
  });

  if (progress?.awardedExp && progress.awardedExp > 0) {
    return {
      gainedExp: progress.awardedExp,
      previousExperience: user.experience,
      currentExperience: user.experience,
      isNewlyAwarded: false,
    };
  }

  const gainedExp = Math.max(0, rewardExp);

  await tx.userMissionProgress.update({
    where: {
      userId_missionId: {
        userId,
        missionId,
      },
    },
    data: {
      awardedExp: gainedExp,
    },
  });

  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: {
      experience: {
        increment: gainedExp,
      },
    },
    select: {
      experience: true,
    },
  });

  return {
    gainedExp,
    previousExperience: user.experience,
    currentExperience: updatedUser.experience,
    isNewlyAwarded: true,
  };
};

const isCourseRequiredMissionsComplete = async (
  userId: string,
  courseId: string
) => {
  const requiredMissions = await prisma.mission.findMany({
    where: {
      courseId,
      isPublished: true,
      isRequiredForCourseCompletion: true,
    },
    select: {
      id: true,
      progresses: {
        where: {
          userId,
          status: PrismaProgressStatus.COMPLETED,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    requiredMissions.length > 0 &&
    requiredMissions.every((candidate) => candidate.progresses.length > 0)
  );
};

export const getMissionPlayService = async ({
  missionId,
  firebaseUid,
  difficulty,
}: GetMissionPlayInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  await assertMissionUnlocked(user.id, missionId);

  const requestedMission = await prisma.mission.findFirst({
    where: { id: missionId, isPublished: true },
    select: { type: true },
  });
  const courseExamAttempt =
    requestedMission?.type === MissionType.COURSE_EXAM
      ? await startOrResumeCourseExamAttempt(user.id, missionId)
      : null;

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
      course: {
        isPublished: true,
      },
    },
    include: {
      course: {
        select: {
          title: true,
        },
      },
      activities: {
        orderBy: {
          order: "asc",
        },
        include: {
          progresses: {
            where: {
              userId: user.id,
            },
            select: {
              status: true,
            },
          },
          answerLogs: {
            where: { userId: user.id },
            select: { isCorrect: true },
          },
        },
      },
      progresses: {
        where: {
          userId: user.id,
        },
        select: {
          status: true,
          currentActivityId: true,
          startedAt: true,
          selectedExamDifficulty: true,
          highestClearedExamDifficulty: true,
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
  }

  const firstActivityId = mission.activities[0]?.id ?? null;
  const missionProgress = mission.progresses[0];
  const selectedExamDifficulty =
    mission.type === MissionType.COURSE_EXAM && difficulty
      ? toCourseDifficulty(difficulty)
      : missionProgress?.selectedExamDifficulty ?? null;
  const completedActivityIds = mission.activities
    .filter(
      (activity) =>
        activity.progresses[0]?.status === PrismaProgressStatus.COMPLETED
    )
    .map((activity) => activity.id);
  const currentActivityId =
    missionProgress?.currentActivityId ??
    mission.activities.find((activity) => !completedActivityIds.includes(activity.id))
      ?.id ??
    firstActivityId;

  await prisma.userMissionProgress.upsert({
    where: {
      userId_missionId: {
        userId: user.id,
        missionId: mission.id,
      },
    },
    update: {
      startedAt: missionProgress?.startedAt ?? new Date(),
      currentActivityId,
      ...(mission.type === MissionType.COURSE_EXAM && selectedExamDifficulty
        ? { selectedExamDifficulty }
        : {}),
    },
    create: {
      userId: user.id,
      missionId: mission.id,
      status: PrismaProgressStatus.IN_PROGRESS,
      startedAt: new Date(),
      currentActivityId,
      ...(mission.type === MissionType.COURSE_EXAM && selectedExamDifficulty
        ? { selectedExamDifficulty }
        : {}),
    },
  });

  return {
    id: mission.id,
    courseId: mission.courseId,
    courseTitle: mission.course.title,
    missionOrder: mission.order,
    title: mission.title,
    description: mission.description,
    type: toMissionType(mission.type),
    difficulty: toDifficulty(mission.difficulty),
    selectedExamDifficulty: selectedExamDifficulty
      ? toDifficulty(selectedExamDifficulty)
      : null,
    highestClearedExamDifficulty: missionProgress?.highestClearedExamDifficulty
      ? toDifficulty(missionProgress.highestClearedExamDifficulty)
      : null,
    goalImg: mission.goalImg,
    estimatedMinutes: mission.estimatedMinutes,
    rewardExp: mission.rewardExp,
    learnedItems: mission.learnedItems,
    isLocked: false,
    unlockRequirement: null,
    courseExamAttempt,
    progress: {
      status: toProgressStatus(missionProgress?.status ?? PrismaProgressStatus.IN_PROGRESS),
      currentActivityId,
      completedActivityIds,
    },
    activities: mission.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      instruction: activity.instruction,
      mentorMessage: activity.mentorMessage,
      content: parseActivityContent(activity.content, activity.type),
      preview: activity.preview,
      actionLabel: activity.actionLabel,
      order: activity.order,
      progressStatus: toProgressStatus(activity.progresses[0]?.status),
      incorrectAttemptCount: activity.answerLogs.filter((log) => log.isCorrect === false).length,
    })),
  };
};

export const getMissionOverviewService = async ({
  missionId,
  firebaseUid,
}: GetMissionOverviewInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  const access = await getMissionAccess(user.id, missionId);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
      course: {
        isPublished: true,
      },
    },
    include: {
      course: {
        select: {
          title: true,
        },
      },
      activities: {
        orderBy: {
          order: "asc",
        },
        include: {
          progresses: {
            where: {
              userId: user.id,
            },
            select: {
              status: true,
            },
          },
        },
      },
      progresses: {
        where: {
          userId: user.id,
        },
        select: {
          status: true,
          currentActivityId: true,
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
  }

  const missionProgress = mission.progresses[0];
  const completedActivityIds = mission.activities
    .filter(
      (activity) =>
        activity.progresses[0]?.status === PrismaProgressStatus.COMPLETED
    )
    .map((activity) => activity.id);
  const currentActivityId =
    missionProgress?.currentActivityId ??
    mission.activities.find((activity) => !completedActivityIds.includes(activity.id))
      ?.id ??
    mission.activities[0]?.id ??
    null;
  const courseExamAttempt =
    mission.type === MissionType.COURSE_EXAM
      ? (await getCurrentCourseExamAttempt(user.id, mission.id)).attempt
      : null;

  return {
    id: mission.id,
    courseId: mission.courseId,
    courseTitle: mission.course.title,
    missionOrder: mission.order,
    title: mission.title,
    description: mission.description,
    difficulty: toDifficulty(mission.difficulty),
    goalImg: mission.goalImg,
    estimatedMinutes: mission.estimatedMinutes,
    rewardExp: mission.rewardExp,
    learnedItems: mission.learnedItems,
    isLocked: access.isLocked,
    unlockRequirement: access.unlockMission
      ? {
          missionId: access.unlockMission.id,
          missionTitle: access.unlockMission.title,
        }
      : null,
    courseExamAttempt,
    progress: {
      status: toProgressStatus(missionProgress?.status),
      currentActivityId,
      completedActivityIds,
    },
    activities: mission.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      instruction: activity.instruction,
      mentorMessage: activity.mentorMessage,
      content: parseActivityContent(activity.content, activity.type),
      preview: activity.preview,
      actionLabel: activity.actionLabel,
      order: activity.order,
      progressStatus: toProgressStatus(activity.progresses[0]?.status),
    })),
  };
};

export const answerMissionActivityService = async ({
  missionId,
  activityId,
  firebaseUid,
  answer,
}: AnswerActivityInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  await assertMissionUnlocked(user.id, missionId);

  const activity = await prisma.missionActivity.findFirst({
    where: {
      id: activityId,
      missionId,
      mission: {
        isPublished: true,
      },
    },
    include: {
      mission: { select: { type: true } },
    },
  });

  if (!activity) {
    throw new AppError(404, "ACTIVITY_NOT_FOUND", "Activity not found");
  }

  const parsedContent = parseActivityContent(activity.content, activity.type);
  const content = parsedContent.data;
  const result = judgeAnswer(parsedContent.rendererKey, content, answer);

  if (
    activity.mission.type === MissionType.COURSE_EXAM &&
    content.evaluationMode === "TEST_CASES"
  ) {
    const answerRecord = asRecord(answer);
    await recordCourseExamSubmission({
      userId: user.id,
      missionId,
      code:
        typeof answer === "string"
          ? answer
          : typeof answerRecord.code === "string"
            ? answerRecord.code
            : "",
      passed: result.isCorrect === true,
      testResults: Array.isArray(answerRecord.testResults)
        ? answerRecord.testResults
        : [],
    });
  }

  await prisma.activityAnswerLog.create({
    data: {
      userId: user.id,
      activityId: activity.id,
      answer: answer === undefined ? {} : JSON.parse(JSON.stringify(answer)),
      isCorrect: result.isCorrect,
    },
  });

  const incorrectAttemptCount = await prisma.activityAnswerLog.count({
    where: { userId: user.id, activityId: activity.id, isCorrect: false },
  });

  return { ...result, incorrectAttemptCount };
};

export const completeMissionActivityService = async ({
  missionId,
  activityId,
  firebaseUid,
}: ActivityActionInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  await assertMissionUnlocked(user.id, missionId);

  const activity = await prisma.missionActivity.findFirst({
    where: {
      id: activityId,
      missionId,
      mission: {
        isPublished: true,
      },
    },
  });

  if (!activity) {
    throw new AppError(404, "ACTIVITY_NOT_FOUND", "Activity not found");
  }

  await prisma.userMissionProgress.upsert({
    where: {
      userId_missionId: {
        userId: user.id,
        missionId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      missionId,
      status: PrismaProgressStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  });

  await prisma.userMissionActivityProgress.upsert({
    where: {
      userId_activityId: {
        userId: user.id,
        activityId: activity.id,
      },
    },
    update: {
      status: PrismaProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
    create: {
      userId: user.id,
      activityId: activity.id,
      status: PrismaProgressStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  const completedProgresses =
    await prisma.userMissionActivityProgress.findMany({
      where: {
        userId: user.id,
        activity: {
          missionId,
        },
        status: PrismaProgressStatus.COMPLETED,
      },
      select: {
        activityId: true,
      },
    });
  const completedActivityIds = completedProgresses.map(
    (progress) => progress.activityId
  );
  const nextActivityId = await getNextActivityId(
    missionId,
    completedActivityIds
  );

  await prisma.userMissionProgress.update({
    where: {
      userId_missionId: {
        userId: user.id,
        missionId,
      },
    },
    data: {
      currentActivityId: nextActivityId,
    },
  });

  const isMissionCompleted = await completeMissionIfAllActivitiesCompleted(
    user.id,
    missionId
  );

  return {
    activityId: activity.id,
    status: "completed" as const,
    nextActivityId,
    isMissionCompleted,
  };
};

export const completeMissionService = async ({
  missionId,
  firebaseUid,
}: CompleteMissionInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  await assertMissionUnlocked(user.id, missionId);

  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      isPublished: true,
    },
    include: {
      activities: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
  }

  const completedProgresses =
    await prisma.userMissionActivityProgress.findMany({
      where: {
        userId: user.id,
        activityId: {
          in: mission.activities.map((activity) => activity.id),
        },
        status: PrismaProgressStatus.COMPLETED,
      },
      select: {
        activityId: true,
      },
    });
  const completedActivityIds = new Set(
    completedProgresses.map((progress) => progress.activityId)
  );
  const hasIncompleteActivity = mission.activities.some(
    (activity) => !completedActivityIds.has(activity.id)
  );

  if (hasIncompleteActivity) {
    throw new AppError(
      400,
      "MISSION_ACTIVITIES_INCOMPLETE",
      "All mission activities must be completed"
    );
  }

  const missionProgress = await prisma.userMissionProgress.findUnique({
    where: {
      userId_missionId: {
        userId: user.id,
        missionId: mission.id,
      },
    },
    select: {
      selectedExamDifficulty: true,
      highestClearedExamDifficulty: true,
    },
  });
  const completedExamDifficulty =
    mission.type === MissionType.COURSE_EXAM
      ? missionProgress?.selectedExamDifficulty ?? CourseDifficulty.EASY
      : null;
  const courseExamAttempt =
    mission.type === MissionType.COURSE_EXAM
      ? await prisma.courseExamAttempt.findFirst({
          where: {
            userId: user.id,
            missionId: mission.id,
            completedAt: null,
          },
          orderBy: { startedAt: "desc" },
          include: {
            _count: { select: { hintViews: true } },
            submissions: {
              where: { passed: true },
              select: { id: true },
              take: 1,
            },
          },
        })
      : null;

  if (mission.type === MissionType.COURSE_EXAM && !courseExamAttempt) {
    throw new AppError(
      409,
      "COURSE_EXAM_ATTEMPT_NOT_FOUND",
      "進行中のCOURSE_EXAM挑戦が見つかりません。"
    );
  }
  if (
    mission.type === MissionType.COURSE_EXAM &&
    courseExamAttempt?.submissions.length === 0
  ) {
    throw new AppError(
      409,
      "COURSE_EXAM_NOT_PASSED",
      "合格した提出がないためCOURSE_EXAMを完了できません。"
    );
  }
  const highestClearedExamDifficulty =
    completedExamDifficulty !== null
      ? pickHigherDifficulty(
          missionProgress?.highestClearedExamDifficulty,
          completedExamDifficulty
        )
      : null;

  const experienceUpdate = await prisma.$transaction(async (tx) => {
    await tx.userMissionProgress.upsert({
      where: {
        userId_missionId: {
          userId: user.id,
          missionId: mission.id,
        },
      },
      update: {
        status: PrismaProgressStatus.COMPLETED,
        currentActivityId: null,
        completedAt: new Date(),
        ...(mission.type === MissionType.COURSE_EXAM
          ? {
              selectedExamDifficulty: completedExamDifficulty,
              highestClearedExamDifficulty,
              examAttemptCount: { increment: 1 },
              examHintCount: {
                increment: courseExamAttempt?._count.hintViews ?? 0,
              },
            }
          : {}),
      },
      create: {
        userId: user.id,
        missionId: mission.id,
        status: PrismaProgressStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        ...(mission.type === MissionType.COURSE_EXAM
          ? {
              selectedExamDifficulty: completedExamDifficulty,
              highestClearedExamDifficulty,
              examAttemptCount: 1,
              examHintCount: courseExamAttempt?._count.hintViews ?? 0,
            }
          : {}),
      },
    });

    return awardMissionExperience(tx, user.id, mission.id, mission.rewardExp);
  });

  const nextMission = await prisma.mission.findFirst({
    where: {
      courseId: mission.courseId,
      isPublished: true,
      isRequiredForCourseCompletion: true,
      order: {
        gt: mission.order,
      },
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });

  const unlockedChallenges = await prisma.mission.findMany({
    where: {
      parentMissionId: mission.id,
      isPublished: true,
    },
    orderBy: {
      branchOrder: "asc",
    },
    select: {
      id: true,
      title: true,
    },
  });
  const unlockedAchievements = await evaluateAchievementsForUser(user.id);
  const shouldAwardCourseTicket =
    (mission.type !== MissionType.COURSE_EXAM ||
      experienceUpdate.isNewlyAwarded) &&
    mission.isRequiredForCourseCompletion &&
    (await isCourseRequiredMissionsComplete(user.id, mission.courseId));
  const badgeTicketRewards = await prisma.$transaction(async (tx) => {
    const rewards: BadgeTicketReward[] = [];
    const missionReward =
      mission.type === MissionType.COURSE_EXAM &&
      !experienceUpdate.isNewlyAwarded
        ? null
        : await awardBadgeTickets(tx, {
            userId: user.id,
            amount: 1,
            reason:
              mission.type === MissionType.CHALLENGE
                ? BadgeTicketReason.CHALLENGE_COMPLETE
                : BadgeTicketReason.MISSION_COMPLETE,
            sourceId: mission.id,
            note: mission.title,
          });

    if (missionReward) rewards.push(missionReward);

    if (shouldAwardCourseTicket) {
      const courseReward = await awardBadgeTickets(tx, {
        userId: user.id,
        amount: 1,
        reason: BadgeTicketReason.COURSE_COMPLETE,
        sourceId: mission.courseId,
        note: mission.courseId,
      });

      if (courseReward) rewards.push(courseReward);
    }

    for (const achievement of unlockedAchievements) {
      const achievementReward = await awardBadgeTickets(tx, {
        userId: user.id,
        amount: 1,
        reason: BadgeTicketReason.ACHIEVEMENT_UNLOCK,
        sourceId: achievement.id,
        note: achievement.title,
      });

      if (achievementReward) rewards.push(achievementReward);
    }

    return rewards;
  });
  const candidateKnowledgeCardIds =
    mission.type === MissionType.COURSE_EXAM &&
    !experienceUpdate.isNewlyAwarded
      ? []
      : await getKnowledgeCardCandidateIdsForMission(user.id, mission.courseId);
  const awardedBadgeTickets = badgeTicketRewards.reduce(
    (sum, reward) => sum + Math.max(0, reward.amount),
    0
  );
  const rewardRun = await prisma.$transaction(async (tx) => {
    const completedAt = new Date();
    if (courseExamAttempt) {
      const updated = await tx.courseExamAttempt.updateMany({
        where: { id: courseExamAttempt.id, userId: user.id, completedAt: null },
        data: { completedAt },
      });
      if (updated.count !== 1) {
        throw new AppError(
          409,
          "COURSE_EXAM_ATTEMPT_ALREADY_COMPLETED",
          "このCOURSE_EXAM挑戦はすでに完了しています。"
        );
      }
    }

    return tx.missionRewardRun.create({
      data: {
        userId: user.id,
        missionId: mission.id,
        courseExamAttemptId: courseExamAttempt?.id ?? null,
        candidateKnowledgeCardIds,
        unlockedAchievementIds: unlockedAchievements.map((achievement) => achievement.id),
        awardedExp: experienceUpdate.gainedExp,
        awardedBadgeTickets,
      },
      select: { id: true },
    });
  });

  return {
    rewardRunId: rewardRun.id,
    courseExamAttemptId: courseExamAttempt?.id ?? null,
    nextPath:
      candidateKnowledgeCardIds.length > 0
        ? `/mission-rewards/${rewardRun.id}/cards`
        : mission.type === MissionType.COURSE_EXAM
          ? `/course-results/${rewardRun.id}`
          : `/mission-rewards/${rewardRun.id}/result`,
    mission: {
      id: mission.id,
      courseId: mission.courseId,
      title: mission.title,
      rewardExp: mission.rewardExp,
      learnedItems: mission.learnedItems,
    },
    experienceUpdate,
    badgeTicketRewards,
    unlockedAchievements,
    knowledgeCardChoices: [],
    nextMission,
    unlockedChallenges,
  };
};
