import {
  CourseDifficulty,
  MissionActivityType,
  MissionType,
  ProgressStatus as PrismaProgressStatus,
} from "@prisma/client";

import { AppError } from "../error/appError";
import { prisma } from "../lib/prisma";

type ApiDifficulty = "easy" | "normal" | "hard";
type ApiProgressStatus = "completed" | "in_progress" | "not_started";

type GetMissionPlayInput = {
  missionId: string;
  firebaseUid: string;
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

const toProgressStatus = (
  status?: PrismaProgressStatus | null
): ApiProgressStatus => {
  if (status === PrismaProgressStatus.COMPLETED) return "completed";
  if (status === PrismaProgressStatus.IN_PROGRESS) return "in_progress";
  return "not_started";
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

const judgeChoice = (content: MissionActivityContent, answer: unknown) => {
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

const judgeSelectFill = (content: MissionActivityContent, answer: unknown) => {
  const answerRecord = asRecord(answer);
  const expected = content.correctAnswers ?? content.answer;

  if (expected === undefined) {
    return {
      isCorrect: null,
      feedback: "回答を保存しました。",
    };
  }

  const isCorrect =
    JSON.stringify(answerRecord.values ?? answer) === JSON.stringify(expected);

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

  if (submittedCode === null || answerCode === null) {
    return {
      isCorrect: null,
      feedback: "コードを保存しました。",
    };
  }

  const isCorrect = submittedCode === answerCode;

  return {
    isCorrect,
    feedback: getAnswerFeedback(isCorrect, content),
  };
};

const judgeAnswer = (
  type: MissionActivityType,
  content: MissionActivityContent,
  answer: unknown
) => {
  const checkType = content.checkType;
  const effectiveType =
    type === MissionActivityType.MISSION_CHECK && typeof checkType === "string"
      ? checkType
      : type;

  switch (effectiveType) {
    case MissionActivityType.CHOICE:
    case "CHOICE":
      return judgeChoice(content, answer);
    case MissionActivityType.MATCH:
    case "MATCH":
      return judgeMatch(content, answer);
    case MissionActivityType.ORDERED_STEPS:
    case "ORDERED_STEPS":
      return judgeOrderedSteps(content, answer);
    case MissionActivityType.SELECT_FILL:
    case "SELECT_FILL":
      return judgeSelectFill(content, answer);
    case MissionActivityType.TRY_CODE:
    case "TRY_CODE":
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

  if (!isAlreadyStarted && mission.type === MissionType.MAIN) {
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

export const getMissionPlayService = async ({
  missionId,
  firebaseUid,
}: GetMissionPlayInput) => {
  const user = await getUserByFirebaseUid(firebaseUid);
  await assertMissionUnlocked(user.id, missionId);

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
      sections: {
        orderBy: {
          order: "asc",
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
          startedAt: true,
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "MISSION_NOT_FOUND", "Mission not found");
  }

  const firstActivityId = mission.activities[0]?.id ?? null;
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
    },
    create: {
      userId: user.id,
      missionId: mission.id,
      status: PrismaProgressStatus.IN_PROGRESS,
      startedAt: new Date(),
      currentActivityId,
    },
  });

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
    isLocked: false,
    unlockRequirement: null,
    progress: {
      status: toProgressStatus(missionProgress?.status ?? PrismaProgressStatus.IN_PROGRESS),
      currentActivityId,
      completedActivityIds,
    },
    sections: mission.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
    })),
    activities: mission.activities.map((activity) => ({
      id: activity.id,
      sectionId: activity.sectionId,
      type: activity.type,
      title: activity.title,
      instruction: activity.instruction,
      mentorMessage: activity.mentorMessage,
      content: activity.content,
      preview: activity.preview,
      actionLabel: activity.actionLabel,
      order: activity.order,
      sectionOrder: activity.sectionOrder,
      isMissionCheck: activity.isMissionCheck,
      progressStatus: toProgressStatus(activity.progresses[0]?.status),
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
      sections: {
        orderBy: {
          order: "asc",
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
    progress: {
      status: toProgressStatus(missionProgress?.status),
      currentActivityId,
      completedActivityIds,
    },
    sections: mission.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
    })),
    activities: mission.activities.map((activity) => ({
      id: activity.id,
      sectionId: activity.sectionId,
      type: activity.type,
      title: activity.title,
      instruction: activity.instruction,
      mentorMessage: activity.mentorMessage,
      content: activity.content,
      preview: activity.preview,
      actionLabel: activity.actionLabel,
      order: activity.order,
      sectionOrder: activity.sectionOrder,
      isMissionCheck: activity.isMissionCheck,
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
  });

  if (!activity) {
    throw new AppError(404, "ACTIVITY_NOT_FOUND", "Activity not found");
  }

  const content = asRecord(activity.content);
  const result = judgeAnswer(activity.type, content, answer);

  await prisma.activityAnswerLog.create({
    data: {
      userId: user.id,
      activityId: activity.id,
      answer: answer === undefined ? {} : JSON.parse(JSON.stringify(answer)),
      isCorrect: result.isCorrect,
    },
  });

  return result;
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

  if (activity.type === MissionActivityType.MISSION_CHECK) {
    const latestCorrectAnswer = await prisma.activityAnswerLog.findFirst({
      where: {
        userId: user.id,
        activityId: activity.id,
        isCorrect: true,
      },
      orderBy: {
        answeredAt: "desc",
      },
    });

    if (!latestCorrectAnswer) {
      throw new AppError(
        400,
        "MISSION_CHECK_NOT_PASSED",
        "Mission check must be answered correctly before completion"
      );
    }
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

  await prisma.userMissionProgress.upsert({
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
    },
    create: {
      userId: user.id,
      missionId: mission.id,
      status: PrismaProgressStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date(),
    },
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

  return {
    mission: {
      id: mission.id,
      courseId: mission.courseId,
      title: mission.title,
      rewardExp: mission.rewardExp,
      learnedItems: mission.learnedItems,
    },
    nextMission,
    unlockedChallenges,
  };
};
