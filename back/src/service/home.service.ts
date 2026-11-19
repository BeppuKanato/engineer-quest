/**
 * Home表示用の集約。旧フロー（Mission/Activity）の進捗源は削除済みで、
 * 学習カレンダーは新フローの確定済み完了記録と「作る」提出を源にする。
 * 単元の進捗・再開表示は新フローの進捗モデル接続（#78）で置き換える。
 */
import { Achievement, AchievementConditionType } from "@prisma/client";

import { prisma } from "../lib/prisma";

const rankThresholds = [
  { name: "Junior", requiredCompletedMissionCount: 0 },
  { name: "Senior", requiredCompletedMissionCount: 6 },
  { name: "Lead", requiredCompletedMissionCount: 14 },
  { name: "Master", requiredCompletedMissionCount: 24 },
];

const requiredExperienceForLevel = (level: number): number => {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
};

const deriveLevelStatus = (experience: number) => {
  let level = 1;

  while (experience >= requiredExperienceForLevel(level + 1)) {
    level += 1;
  }

  return {
    level,
    requireNextLevelExp: requiredExperienceForLevel(level + 1),
  };
};

const buildRankStatus = (completedMissionCount: number) => {
  const currentRank =
    [...rankThresholds]
      .reverse()
      .find(
        (rank) => completedMissionCount >= rank.requiredCompletedMissionCount
      ) ?? rankThresholds[0];
  const currentIndex = rankThresholds.findIndex(
    (rank) => rank.name === currentRank.name
  );
  const nextRank = rankThresholds[currentIndex + 1] ?? null;

  if (!nextRank) {
    return {
      rank: currentRank.name,
      nextRank: null,
      conditions: {
        mission: [
          {
            title: `${currentRank.name}ランクに到達済み`,
            status: "complete" as const,
          },
        ],
      },
    };
  }

  return {
    rank: currentRank.name,
    nextRank: { name: nextRank.name },
    conditions: {
      mission: Array.from(
        { length: nextRank.requiredCompletedMissionCount },
        (_, index) => ({
          title: `Mission ${index + 1}個完了`,
          status:
            completedMissionCount >= index + 1
              ? ("complete" as const)
              : ("incomplete" as const),
        })
      ),
    },
  };
};

const calculateAchievementProgress = async (achievement: Achievement) => {
  // 旧フローの条件は進捗源を失ったため 0 固定。新フロー条件は #78 で追加する。
  // 作る・カード系の条件も従来どおり Home では進捗を表示しない（実績画面が正本）。
  switch (achievement.conditionType) {
    case AchievementConditionType.MISSION_COUNT:
      return {
        name: `Missionを${achievement.conditionValue ?? 0}個完了`,
        goal: achievement.conditionValue ?? 0,
        progress: 0,
      };
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
      return { name: "指定Missionを完了", goal: 1, progress: 0 };
    case AchievementConditionType.ACTIVITY_COUNT:
      return {
        name: `Activityを${achievement.conditionValue ?? 0}個完了`,
        goal: achievement.conditionValue ?? 0,
        progress: 0,
      };
    case AchievementConditionType.COURSE_COMPLETE:
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
      return { name: "Course内の必須Missionを完了", goal: 1, progress: 0 };
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE:
      return { name: "Challengeを含めたMissionを完了", goal: 1, progress: 0 };
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
      return { name: "Course終了試験Hardをクリア", goal: 1, progress: 0 };
    case AchievementConditionType.STREAK_DAYS:
      return {
        name: `${achievement.conditionValue ?? 0}日連続で学習`,
        goal: achievement.conditionValue ?? 0,
        progress: 0,
      };
    case AchievementConditionType.CREATE_QUEST_SCORE:
    case AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT:
    case AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT:
    case AchievementConditionType.CREATE_QUEST_PERFECT_COUNT:
    case AchievementConditionType.KNOWLEDGE_CARD_COUNT:
    case AchievementConditionType.COURSE_COMPLETED_COUNT:
    case AchievementConditionType.UNIT_COMPLETE:
    case AchievementConditionType.UNIT_COMPLETED_COUNT:
    case AchievementConditionType.PHASE_COMPLETED:
    case AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT:
    case AchievementConditionType.PHASE_NO_HINT_COMPLETE:
      return { name: achievement.title, goal: achievement.conditionValue ?? 1, progress: 0 };
  }
};

const buildAchievementTargetLink = (
  achievement: Pick<Achievement, "conditionType" | "courseId">
) => {
  switch (achievement.conditionType) {
    case AchievementConditionType.SPECIFIC_MISSION_CLEAR:
    case AchievementConditionType.COURSE_REQUIRED_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_ALL_MISSION_COMPLETE:
    case AchievementConditionType.COURSE_COMPLETE:
    case AchievementConditionType.COURSE_EXAM_HARD_CLEAR:
    case AchievementConditionType.COURSE_COMPLETED_COUNT:
      return achievement.courseId
        ? { href: "/courses", actionLabel: "対象コースを見る" }
        : { href: "/courses", actionLabel: "コースを選ぶ" };
    case AchievementConditionType.MISSION_COUNT:
    case AchievementConditionType.ACTIVITY_COUNT:
    case AchievementConditionType.STREAK_DAYS:
      return { href: "/courses", actionLabel: "学習を続ける" };
    case AchievementConditionType.CREATE_QUEST_SCORE:
    case AchievementConditionType.CREATE_QUEST_COMPLETED_COUNT:
    case AchievementConditionType.CREATE_QUEST_OPTIONAL_REQUIREMENT_COUNT:
    case AchievementConditionType.CREATE_QUEST_PERFECT_COUNT:
      return { href: "/create", actionLabel: "作る課題に挑戦する" };
    case AchievementConditionType.KNOWLEDGE_CARD_COUNT:
      return { href: "/collection", actionLabel: "コレクションを見る" };
    case AchievementConditionType.UNIT_COMPLETE:
    case AchievementConditionType.UNIT_COMPLETED_COUNT:
    case AchievementConditionType.PHASE_COMPLETED:
    case AchievementConditionType.PHASE_FIRST_ATTEMPT_PERFECT:
    case AchievementConditionType.PHASE_NO_HINT_COMPLETE:
      return { href: "/courses", actionLabel: "学習を続ける" };
  }
};

const getTargetAchievement = async (
  userId: string,
  selectedTargetAchievementId: string | null
) => {
  if (!selectedTargetAchievementId) return null;

  const achievement = await prisma.achievement.findFirst({
    where: {
      id: selectedTargetAchievementId,
      isSecret: false,
      userAchievements: {
        none: {
          userId,
        },
      },
    },
  });

  if (!achievement) return null;

  const factor = await calculateAchievementProgress(achievement);
  const targetLink = buildAchievementTargetLink(achievement);

  return {
    title: achievement.title,
    href: targetLink.href,
    actionLabel: targetLink.actionLabel,
    factor: [factor],
  };
};

// Asia/Tokyo は UTC+9（夏時間なし）。実行環境のタイムゾーンに依存させない。
const tokyoDate = (date: Date) => new Date(date.getTime() + 9 * 60 * 60 * 1000);
const toDateKey = (date: Date) => tokyoDate(date).toISOString().slice(0, 10);

const buildLearningCalendar = async (userId: string) => {
  const today = new Date();
  const localToday = tokyoDate(today);
  const year = localToday.getUTCFullYear();
  const month = localToday.getUTCMonth();
  const monthKey = toDateKey(today).slice(0, 7);

  // 欠落し得るクライアントイベントではなく、サーバーで確定した completedAt を使う。
  const [submissions, phases, units] = await Promise.all([
    prisma.createQuestSubmission.findMany({
      where: { attempt: { userId } },
      select: { submittedAt: true },
    }),
    prisma.phaseLearningProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
    }),
    prisma.unitLearningProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);
  const learnedDates = [
    ...submissions.map((submission) => submission.submittedAt),
    ...phases.map((phase) => phase.completedAt),
    ...units.map((unit) => unit.completedAt),
  ].filter((date): date is Date => date !== null);
  const learnedDateKeys = new Set(learnedDates.map(toDateKey));
  const learnedDaysInMonth = [...learnedDateKeys]
    .filter((key) => key.startsWith(`${monthKey}-`))
    .map((key) => Number(key.slice(8, 10)));

  let continuationDays = 0;
  const cursor = new Date(today);
  while (learnedDateKeys.has(toDateKey(cursor))) {
    continuationDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    year,
    month,
    date: localToday.getUTCDate(),
    learnedDays: learnedDaysInMonth.sort((a, b) => a - b),
    continuationDays,
    totalDays: learnedDateKeys.size,
    hasLearnedToday: learnedDateKeys.has(toDateKey(today)),
  };
};

export const getHomeByUser = async (user: {
  id: string;
  displayName: string | null;
  experience: number;
  selectedMascotId: string;
  selectedTargetAchievementId: string | null;
}) => {
  const completedAchievementCount = await prisma.userAchievement.count({
    where: { userId: user.id },
  });
  const levelStatus = deriveLevelStatus(user.experience);
  // ランクの基礎だった Mission 完了数は進捗源を失ったため 0 固定（#78 で単元進捗に再接続）。
  const rankStatus = buildRankStatus(0);
  const [targetAchievement, calendar] = await Promise.all([
    getTargetAchievement(user.id, user.selectedTargetAchievementId),
    buildLearningCalendar(user.id),
  ]);

  return {
    user: {
      displayName: user.displayName,
      rank: rankStatus.rank,
      level: levelStatus.level,
      requireNextLevelExp: levelStatus.requireNextLevelExp,
      exp: user.experience,
      selectedMascotId: user.selectedMascotId,
      completedMissionNum: 0,
      completedAchievementNum: completedAchievementCount,
      todayCompletedMissionCount: 0,
      dailyMissionGoal: 5,
      continuationDays: calendar.continuationDays,
      totalDays: calendar.totalDays,
    },
    missions: {
      resume: null,
      recommended: null,
      recommendedList: [],
    },
    nextRank: rankStatus.nextRank,
    nextRankCondition: rankStatus.conditions,
    targetAchievement,
    calendar,
  };
};
