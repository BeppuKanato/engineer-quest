import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { getHomeByUser } from "../service/home.service";
import { deriveLevel, getProfileByUser } from "../service/profile.service";

// DB不要のAPI契約検証。表示削除後も、統計・カレンダー・目標・プロフィール設定を保つ。
const now = new Date();
const achievement = { id: "a", title: "学習継続 3日", description: "3日連続の学習", rarity: "RARE", iconKey: "challenge", conditionType: "STREAK_DAYS", conditionValue: 3 };
const award = { id: "ua", achievedAt: now, achievement };
Object.assign(prisma.userAchievement, { count: async () => 6, findMany: async () => [award], findUnique: async () => award });
Object.assign(prisma.achievement, { findFirst: async () => achievement });
Object.assign(prisma.userKnowledgeCard, { count: async () => 9 });
Object.assign(prisma.hexadResponse, { findUnique: async () => null });
Object.assign(prisma.createQuestAttempt, { findMany: async () => [] });
Object.assign(prisma.phaseLearningProgress, { findMany: async () => [{ completedAt: now }] });
Object.assign(prisma.unitLearningProgress, { findMany: async () => [] });
Object.assign(prisma.createQuestSubmission, { findMany: async () => [] });
const user = { id: "fixture", displayName: "学び手", selectedMascotId: "penguin", selectedTargetAchievementId: "a", selectedProfileAchievementId: "a" };

async function main() {
  const home = await getHomeByUser(user);
  const profile = await getProfileByUser(user);
  for (const response of [home, profile]) {
    for (const key of ["rank", "level", "exp", "requireNextLevelExp", "nextRank", "nextRankCondition"]) {
      assert.equal(Object.hasOwn(response, key), false, key);
      assert.equal(Object.hasOwn(response.user, key), false, key);
    }
    assert.equal(response.user.displayName, user.displayName);
    assert.equal(response.user.selectedMascotId, "penguin");
  }
  assert.equal(home.user.completedAchievementNum, 6);
  assert.equal(home.user.completedMissionNum, 0);
  assert.equal(home.calendar.totalDays, 1);
  assert.equal(home.calendar.hasLearnedToday, true);
  assert.equal(home.targetAchievement?.title, achievement.title);
  assert.equal(home.targetAchievement?.factor[0].progress, 1);
  assert.deepEqual([profile.user.completedCourseCount, profile.user.completedMissionCount, profile.user.achievementCount, profile.user.knowledgeCardCount], [0, 0, 6, 9]);
  assert.equal(profile.selectedAchievement?.id, "a");
  assert.equal(profile.history[0]?.title, achievement.title);
  assert.equal(profile.hexadProfile, null);
  assert.deepEqual(profile.recentWorks, []);
  // フィードバックの凍結契約を維持（画面・APIはこの計算を使わない）。
  assert.deepEqual([0, 282, 1000].map(deriveLevel), [1, 2, 4]);
  console.log("Home/profile contract: no level/EXP/rank fields; statistics, calendar, target, selected achievement and frozen feedback calculation retained.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
