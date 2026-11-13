import assert from "node:assert/strict";

import {
  generateBigGoalCandidates,
  MAX_BIG_GOAL_CANDIDATES,
  type LearnerGoalState,
} from "../service/bigGoal.candidates";
import {
  BIG_GOAL_SCORING_PROMPT_VERSION,
  scoreBigGoalCandidates,
  type BigGoalCallLog,
  type BigGoalScoringInput,
} from "../service/bigGoal.scoring";

const baseState = (overrides: Partial<LearnerGoalState>): LearnerGoalState => ({
  units: [
    { courseId: "bfs", title: "幅優先探索", status: "NOT_STARTED", completedPhaseCount: 0 },
    { courseId: "dfs", title: "深さ優先探索", status: "NOT_STARTED", completedPhaseCount: 0 },
    { courseId: "binary", title: "二分探索", status: "NOT_STARTED", completedPhaseCount: 0 },
  ],
  achievements: [
    { achievementId: "a-bfs-1", title: "幅優先探索の確認問題を初回で全問正解", courseId: "bfs", achieved: false },
    { achievementId: "a-bfs-2", title: "幅優先探索をヒントなしで完了", courseId: "bfs", achieved: false },
    { achievementId: "a-dfs-1", title: "深さ優先探索の確認問題を初回で全問正解", courseId: "dfs", achieved: false },
  ],
  latestCompletedUnit: null,
  coveredCourseIds: [],
  openCreateQuestCountByCourse: {},
  ...overrides,
});

const keys = (list: { candidateKey: string }[]) => list.map((c) => c.candidateKey);

async function main() {
  // ルール仕様の具体例1：初めて BFS を開始（完了済み単元なし）
  // → 標準形＋実績型（最大で最初の実績1件）、挑戦変種は出ない
  const exampleA = generateBigGoalCandidates({
    timing: "UNIT_START",
    startCourseId: "bfs",
    state: baseState({}),
  });
  assert.deepEqual(keys(exampleA), [
    "unit-completion:bfs",
    "unit-completion-no-hint:bfs",
    "unit-completion-full-code:bfs",
    "achievement:a-bfs-1",
  ]);
  assert.equal(exampleA[0].displayText, "幅優先探索の単元を完了する");

  // 確定中の大目標が対象に含む単元では、タイミングAの新規設定をしない
  assert.deepEqual(
    generateBigGoalCandidates({
      timing: "UNIT_START",
      startCourseId: "bfs",
      state: baseState({ coveredCourseIds: ["bfs"] }),
    }),
    []
  );

  // 余裕あり（直近完了単元の初回正答率が高くヒント未使用）→ 挑戦変種が標準形の直後に出る
  const roomy = generateBigGoalCandidates({
    timing: "UNIT_START",
    startCourseId: "dfs",
    state: baseState({
      units: [
        { courseId: "bfs", title: "幅優先探索", status: "COMPLETED", completedPhaseCount: 7 },
        { courseId: "dfs", title: "深さ優先探索", status: "NOT_STARTED", completedPhaseCount: 0 },
        { courseId: "binary", title: "二分探索", status: "NOT_STARTED", completedPhaseCount: 0 },
      ],
      latestCompletedUnit: { courseId: "bfs", firstAttemptRate: 0.9, phase7NoHint: true },
    }),
  });
  assert.deepEqual(keys(roomy), [
    "unit-completion:dfs",
    "unit-completion-challenge:dfs",
    "unit-completion-no-hint:dfs",
    "achievement:a-dfs-1",
  ]);
  assert.equal(roomy[1].displayText, "深さ優先探索の単元を完了する（フェーズ7は全部書く書き方）");

  // ルール仕様の具体例2：BFS 完了直後（ヒント使用あり）
  // → 挑戦変種なし、残りの未完了単元の到達型、実績型1件（この状態では BFS の未獲得が対象）、
  //    未完了の作る課題がある BFS の応用型。統合型・共有型・定着型は出ない
  const exampleB = generateBigGoalCandidates({
    timing: "ON_ACHIEVEMENT",
    state: baseState({
      units: [
        { courseId: "bfs", title: "幅優先探索", status: "COMPLETED", completedPhaseCount: 7 },
        { courseId: "dfs", title: "深さ優先探索", status: "NOT_STARTED", completedPhaseCount: 0 },
        { courseId: "binary", title: "二分探索", status: "NOT_STARTED", completedPhaseCount: 0 },
      ],
      achievements: [
        { achievementId: "a-bfs-1", title: "幅優先探索の確認問題を初回で全問正解", courseId: "bfs", achieved: true },
        { achievementId: "a-bfs-2", title: "幅優先探索をヒントなしで完了", courseId: "bfs", achieved: false },
      ],
      latestCompletedUnit: { courseId: "bfs", firstAttemptRate: 5 / 6, phase7NoHint: false },
      openCreateQuestCountByCourse: { bfs: 1 },
    }),
  });
  assert.deepEqual(keys(exampleB), [
    "achievement:a-bfs-2",
    "create-quest:bfs:1",
    "unit-completion:dfs",
    "unit-completion:binary",
  ]);
  assert.ok(exampleB.every((c) => ["UNIT_COMPLETION", "ACHIEVEMENT", "CREATE_QUEST"].includes(c.type)));
  assert.ok(!keys(exampleB).some((k) => k.includes("challenge")));

  // 上限8件と型の多様性：到達型以外が先に置かれる
  const manyUnits: LearnerGoalState = baseState({
    units: Array.from({ length: 10 }, (_, i) => ({
      courseId: `u${i}`,
      title: `単元${i}`,
      status: "NOT_STARTED" as const,
      completedPhaseCount: 0,
    })),
    achievements: Array.from({ length: 10 }, (_, i) => ({
      achievementId: `a${i}`,
      title: `実績${i}`,
      courseId: `u${i}`,
      achieved: false,
    })),
  });
  const capped = generateBigGoalCandidates({ timing: "ON_ACHIEVEMENT", state: manyUnits });
  assert.equal(capped.length, MAX_BIG_GOAL_CANDIDATES);
  assert.ok(capped.slice(0, 2).every((c) => c.type === "ACHIEVEMENT"));
  assert.ok(capped.some((c) => c.type === "UNIT_COMPLETION"));

  // ---- 適合度採点：スタブしたモデル呼び出しで検証する ----
  const scoringInput: BigGoalScoringInput = {
    timing: "UNIT_START",
    startCourseId: "bfs",
    candidates: exampleA.filter(c => c.candidateKey === "unit-completion:bfs" || c.type === "ACHIEVEMENT"),
    learnerState: { units: [] },
    declaredInfo: null,
    condition: "STANDARD",
    hexadScores: null,
  };
  const logs: BigGoalCallLog[] = [];
  const scored = await scoreBigGoalCandidates(scoringInput, {
    callModel: async () => ({
      content: JSON.stringify({
        scores: [
          { candidateKey: "unit-completion:bfs", score: 80, rationale: "未着手の単元であり、完了が次の学習の前提になるため" },
          { candidateKey: "achievement:a-bfs-1", score: 65, rationale: "確認問題の初回成績に挑む目標として具体的であるため" },
        ],
        // LLM の本命指定は argmax と食い違うケースを意図的に作る
        recommendedCandidateKey: "achievement:a-bfs-1",
      }),
    }),
    onCallLog: (log) => {
      logs.push(log);
    },
  });
  // 本命はコード側 argmax を正とし、不一致はログに残る
  assert.equal(scored.recommendedCandidateKey, "unit-completion:bfs");
  assert.equal(scored.llmRecommendedCandidateKey, "achievement:a-bfs-1");
  assert.equal(scored.promptVersion, BIG_GOAL_SCORING_PROMPT_VERSION);
  assert.equal(logs.length, 1);
  assert.equal((logs[0].validation as { consistent: boolean }).consistent, false);
  // 採点は候補の並び順に整列して返る
  assert.deepEqual(scored.scores.map((s) => s.candidateKey), keys(scoringInput.candidates));

  // PERSONALIZED ではコードブックと HEXAD スコアがプロンプトに入り、STANDARD では入らない
  let personalizedSystem = "";
  let personalizedUser = "";
  await scoreBigGoalCandidates(
    { ...scoringInput, condition: "PERSONALIZED", hexadScores: { Achiever: 24, Player: 8 } },
    {
      callModel: async (request) => {
        personalizedSystem = request.messages[0].content;
        personalizedUser = request.messages[1].content;
        return {
          content: JSON.stringify({
            scores: [
              { candidateKey: "unit-completion:bfs", score: 90, rationale: "Achiever が高く、単元完了という明確な達成が動機に合うため" },
              { candidateKey: "achievement:a-bfs-1", score: 40, rationale: "達成の単位が小さく、本人の動機に対して弱いため" },
            ],
            recommendedCandidateKey: "unit-completion:bfs",
          }),
        };
      },
    }
  );
  assert.ok(personalizedSystem.includes("コードブック"));
  assert.ok(personalizedUser.includes("hexadScores"));

  let standardUser = "";
  await scoreBigGoalCandidates(scoringInput, {
    callModel: async (request) => {
      standardUser = request.messages[1].content;
      return {
        content: JSON.stringify({
          scores: [
            { candidateKey: "unit-completion:bfs", score: 90, rationale: "未着手のため" },
            { candidateKey: "achievement:a-bfs-1", score: 40, rationale: "前提が弱いため" },
          ],
          recommendedCandidateKey: "unit-completion:bfs",
        }),
      };
    },
  });
  assert.ok(!standardUser.includes("hexadScores"));

  // 候補の一部しか採点しない応答は機械検証で弾く
  await assert.rejects(
    scoreBigGoalCandidates(scoringInput, {
      callModel: async () => ({
        content: JSON.stringify({
          scores: [{ candidateKey: "unit-completion:bfs", score: 10, rationale: "x" }],
          recommendedCandidateKey: "unit-completion:bfs",
        }),
      }),
    }),
    /BIG_GOAL_SCORING_INVALID|Scoring did not cover/
  );

  // モデル失敗はエラーとして伝播し、ログにも残る
  const failureLogs: BigGoalCallLog[] = [];
  await assert.rejects(
    scoreBigGoalCandidates(scoringInput, {
      callModel: async () => {
        throw new Error("network down");
      },
      onCallLog: (log) => {
        failureLogs.push(log);
      },
    })
  );
  assert.equal(failureLogs.length, 1);
  assert.ok(failureLogs[0].error?.includes("network down"));

  console.log("PASS: big-goal candidate rules (timing A/B, challenge room, diversity cap) and fitness scoring validation (argmax tie-break, codebook gating, coverage check, failure logging)");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
