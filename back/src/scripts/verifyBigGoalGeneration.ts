import assert from "node:assert/strict";
import { generateBigGoalCandidates, type LearnerGoalState } from "../service/bigGoal.candidates";
import { generateBigGoalProposals } from "../service/bigGoal.generate";

const state: LearnerGoalState = {
  units: [{ courseId: "binary", title: "二分探索", status: "NOT_STARTED", completedPhaseCount: 0 }],
  achievements: [{ achievementId: "binary-master", title: "二分探索を修得した", courseId: "binary", achieved: false }],
  latestCompletedUnit: null,
  coveredCourseIds: [],
  openCreateQuestCountByCourse: { binary: 1 },
};
const eligible = generateBigGoalCandidates({ timing: "UNIT_START", startCourseId: "binary", state });
const inputs = {
  timing: "UNIT_START" as const,
  startCourseId: "binary",
  eligible,
  learnerState: { units: [{ title: "二分探索", status: "NOT_STARTED" }] },
  declaredInfo: null,
  condition: "STANDARD" as const,
  hexadScores: null,
};
const makeGoal = (type: string, courseId: string | null, achievementId: string | null, challenge: string | null, score: number) => ({
  type, courseId, achievementId, challenge, count: null,
  motivation: "一歩ずつ進めて、できることを増やそう",
  score, rationale: "二分探索は未着手のため、段階を踏んで取り組む目標として提案します",
});
const response = {
  goals: [
    makeGoal("UNIT_COMPLETION", "binary", null, "NONE", 65),
    makeGoal("UNIT_COMPLETION", "binary", null, "NO_HINT", 82),
    makeGoal("ACHIEVEMENT", null, "binary-master", null, 70),
  ],
};

async function main() {
  assert.equal(eligible.length, 4);
  let prompt = "";
  const logs: unknown[] = [];
  const result = await generateBigGoalProposals(inputs, {
    callModel: async (request) => {
      prompt = request.messages[1].content;
      return { content: JSON.stringify(response) };
    },
    onCallLog: (log) => { logs.push(log); },
  });
  assert.equal(result.candidates.length, 3);
  assert.equal(result.recommendedCandidateKey, "unit-completion-no-hint:binary");
  assert.equal(result.candidates[1].params && "challenge" in result.candidates[1].params, true);
  assert.ok(result.candidates[1].displayText.startsWith("二分探索の単元を完了する（ヒントなし）"));
  assert.ok(!prompt.includes("hexadScores"));
  assert.equal(logs.length, 1);

  let personalizedUser = "";
  await generateBigGoalProposals({
    ...inputs, condition: "PERSONALIZED", hexadScores: {
      Philanthropist: 12, Socialiser: 12, FreeSpirit: 12, Achiever: 24, Disruptor: 12, Player: 12,
    },
  }, {
    callModel: async (request) => {
      personalizedUser = request.messages[1].content;
      assert.ok(request.messages[0].content.includes("Achiever"));
      return { content: JSON.stringify(response) };
    },
  });
  assert.ok(personalizedUser.includes("hexadScores"));

  // 型とパラメータをLLMが勝手に作っても、コード側で拒否する。
  await assert.rejects(generateBigGoalProposals(inputs, {
    callModel: async () => ({
      content: JSON.stringify({
        goals: [makeGoal("UNIT_COMPLETION", "nonexistent", null, "NONE", 80), ...response.goals.slice(1)],
      }),
    }),
  }), /BIG_GOAL_GENERATION_FAILED/);

  // 単元が未完了のときは作る課題の目標を許可しない。
  assert.ok(eligible.every(candidate => candidate.type !== "CREATE_QUEST"));
  const afterCompletion = generateBigGoalCandidates({
    timing: "ON_ACHIEVEMENT",
    state: { ...state, units: [{ ...state.units[0], status: "COMPLETED", completedPhaseCount: 7 }] },
  });
  assert.ok(afterCompletion.some(candidate => candidate.type === "CREATE_QUEST"));

  console.log("PASS: LLM goal generation, HEXAD gating, feasible criteria, and safe failure");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
