import assert from "node:assert/strict";

import {
  evaluateBigGoal,
  summarizeUnit,
  type BigGoalFacts,
  type PhaseFact,
} from "../service/bigGoal.evaluate";
import {
  buildBigGoalDisplayText,
  type BigGoalParams,
  type BigGoalParamsByType,
} from "../service/bigGoal.types";

const phase = (
  phaseKey: string,
  summary: Record<string, unknown> | null
): PhaseFact => ({ phaseKey, status: "COMPLETED", summary });

// BFS を完了した学習者のフェーズ事実（確認・応用は初回 5/6、フェーズ7は骨格・ヒント使用あり）
const bfsPhases: PhaseFact[] = [
  phase("bfs-motivation", null),
  phase("bfs-execution", null),
  phase("bfs-check", { firstAttemptCorrect: 2, totalQuestions: 2 }),
  phase("bfs-code-mapping", null),
  phase("bfs-code-check", { firstAttemptCorrect: 1, totalQuestions: 2 }),
  phase("bfs-consolidation", { firstAttemptCorrect: 2, totalQuestions: 2 }),
  phase("bfs-implementation", { testRuns: 3, hintUsage: [1, 0, 0, 0], inputLevel: "skeleton" }),
];

function main() {
  const summary = summarizeUnit(bfsPhases);
  assert.equal(summary.completedPhaseCount, 7);
  assert.deepEqual(summary.firstAttempt, { correct: 5, total: 6, rate: 5 / 6 });
  assert.equal(summary.phase7.inputLevel, "skeleton");
  assert.equal(summary.phase7.noHint, false);

  const completedFacts: BigGoalFacts = { unitStatus: "COMPLETED", phases: bfsPhases };

  // 到達型（標準形）：単元完了で達成
  const standard = evaluateBigGoal(
    "UNIT_COMPLETION",
    { courseId: "bfs" },
    completedFacts
  );
  assert.equal(standard.outcome, "ACHIEVED");
  assert.equal(standard.fraction, 1);

  // 到達型（挑戦＝全部書く）：入力レベルが skeleton のため、単元完了時点で未達成で閉じる
  const challengeLevel = evaluateBigGoal(
    "UNIT_COMPLETION",
    { courseId: "bfs", challenge: { inputLevel: "full" } },
    completedFacts
  );
  assert.equal(challengeLevel.outcome, "UNMET_CLOSED");

  // 到達型（挑戦＝ヒントなし・初回正答率0.8以上）：ヒント使用があるため未達成で閉じる
  const challengeHint = evaluateBigGoal(
    "UNIT_COMPLETION",
    { courseId: "bfs", challenge: { noHint: true, minFirstAttemptRate: 0.8 } },
    completedFacts
  );
  assert.equal(challengeHint.outcome, "UNMET_CLOSED");
  const hintChecks = challengeHint.detail.challengeChecks as Record<string, boolean | null>;
  assert.equal(hintChecks.noHint, false);
  assert.equal(hintChecks.firstAttemptRate, true);

  // 単元が未完了なら、挑戦条件の中間状態が悪化していても終了しない（継続中）
  const ongoing = evaluateBigGoal(
    "UNIT_COMPLETION",
    { courseId: "bfs", challenge: { inputLevel: "full" } },
    { unitStatus: "IN_PROGRESS", phases: bfsPhases.slice(0, 3) }
  );
  assert.equal(ongoing.outcome, "ONGOING");
  assert.equal(ongoing.fraction, 3 / 7);

  // 挑戦を満たす到達（全部書く・ヒントなし・初回全問正解）
  const perfectPhases: PhaseFact[] = [
    phase("u-check", { firstAttemptCorrect: 2, totalQuestions: 2 }),
    phase("u-implementation", { testRuns: 1, hintUsage: [0, 0, 0, 0], inputLevel: "full" }),
  ];
  const perfect = evaluateBigGoal(
    "UNIT_COMPLETION",
    {
      courseId: "u",
      challenge: { inputLevel: "full", noHint: true, minFirstAttemptRate: 1 },
    },
    { unitStatus: "COMPLETED", phases: perfectPhases }
  );
  assert.equal(perfect.outcome, "ACHIEVED");

  // 実績型：獲得記録の有無だけを見る
  assert.equal(
    evaluateBigGoal("ACHIEVEMENT", { achievementId: "a1" }, { achievementAcquired: true }).outcome,
    "ACHIEVED"
  );
  assert.equal(
    evaluateBigGoal("ACHIEVEMENT", { achievementId: "a1" }, { achievementAcquired: false }).outcome,
    "ONGOING"
  );

  // 応用型：完了件数がパラメータに達したら達成
  const create = { algorithmCourseId: "bfs", count: 2 };
  assert.equal(
    evaluateBigGoal("CREATE_QUEST", create, { createQuestCompletedCount: 1 }).outcome,
    "ONGOING"
  );
  assert.equal(
    evaluateBigGoal("CREATE_QUEST", create, { createQuestCompletedCount: 1 }).fraction,
    0.5
  );
  assert.equal(
    evaluateBigGoal("CREATE_QUEST", create, { createQuestCompletedCount: 2 }).outcome,
    "ACHIEVED"
  );

  // 枠のみの型は判定しない
  for (const [type, params] of [
    ["INTEGRATION", { courseIds: ["a", "b"], budgetLevel: "standard", count: 1 }],
    ["SHARING", { artifactQuestId: "q1" }],
    ["RETENTION", { courseId: "bfs" }],
  ] as Array<[keyof BigGoalParamsByType, BigGoalParams]>) {
    const result = evaluateBigGoal(type, params, {});
    assert.equal(result.outcome, "NOT_INSTRUMENTED");
    assert.equal(result.fraction, null);
  }

  // 表示文：テンプレートにパラメータを埋め、時間指定は付けない
  assert.equal(
    buildBigGoalDisplayText("UNIT_COMPLETION", { courseId: "dfs" }, { courseTitle: "深さ優先探索" }),
    "深さ優先探索の単元を完了する"
  );
  assert.equal(
    buildBigGoalDisplayText(
      "UNIT_COMPLETION",
      { courseId: "dfs", challenge: { inputLevel: "full" } },
      { courseTitle: "深さ優先探索" }
    ),
    "深さ優先探索の単元を完了する（フェーズ7は全部書く書き方）"
  );
  assert.equal(
    buildBigGoalDisplayText("ACHIEVEMENT", { achievementId: "a1" }, { achievementTitle: "確認問題を初回で全問正解" }),
    "実績「確認問題を初回で全問正解」を獲得する"
  );
  assert.equal(
    buildBigGoalDisplayText("CREATE_QUEST", { algorithmCourseId: "bfs", count: 1 }, { courseTitle: "幅優先探索" }),
    "作るで幅優先探索の課題を1件完了する"
  );

  console.log("PASS: big-goal attainment evaluation (unit/achievement/create-quest), challenge closure, progress fractions, display text templates");
}

main();
