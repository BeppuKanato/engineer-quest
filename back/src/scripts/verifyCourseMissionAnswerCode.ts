/** Course Missionの標準解答を、seedに定義した全テストケースで実行する。 */
import { spawnSync } from "node:child_process";

import { learningSeed } from "../../prisma/seedData/learningSeed";

type TestCase = {
  id: string;
  args: unknown[];
  expected: unknown;
};

const stringify = (value: unknown) => JSON.stringify(value);
let verifiedCourseMissionCount = 0;
let verifiedTestCount = 0;

for (const course of learningSeed.courses) {
  for (const mission of course.missions) {
    for (const activity of mission.activities) {
      if (activity.content.rendererKey !== "CODE_EDITOR") continue;

      const { answerCode, functionName, testCases } = activity.content.data;
      if (typeof answerCode !== "string") continue;
      if (typeof functionName !== "string" || !Array.isArray(testCases)) {
        throw new Error(`${activity.id}: answerCode requires functionName and testCases`);
      }

      const cases = testCases as TestCase[];
      const encodedCases = Buffer.from(JSON.stringify(cases), "utf8").toString("base64");
      const harness = [
        answerCode,
        "",
        "import base64",
        "import json",
        `_cases = json.loads(base64.b64decode('${encodedCases}').decode('utf-8'))`,
        "_results = []",
        "for _case in _cases:",
        `    _actual = ${functionName}(*_case['args'])`,
        "    _results.append({\"id\": _case[\"id\"], \"actual\": _actual})",
        "print(json.dumps(_results, ensure_ascii=False))",
      ].join("\n");

      const execution = spawnSync("python", ["-c", harness], {
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        timeout: 15_000,
      });
      if (execution.error) throw execution.error;
      if (execution.status !== 0) {
        throw new Error(`${activity.id}: answerCode failed to execute\n${execution.stderr}`);
      }

      const results = JSON.parse(execution.stdout.trim()) as Array<{ id: string; actual: unknown }>;
      for (const testCase of cases) {
        const result = results.find((item) => item.id === testCase.id);
        if (!result || stringify(result.actual) !== stringify(testCase.expected)) {
          throw new Error(
            `${activity.id}/${testCase.id}: expected ${stringify(testCase.expected)}, got ${stringify(result?.actual)}`,
          );
        }
      }

      verifiedCourseMissionCount += 1;
      verifiedTestCount += cases.length;
      console.log(`Verified ${course.title} / ${mission.title}: ${cases.length} tests.`);
    }
  }
}

if (verifiedCourseMissionCount === 0) {
  throw new Error("No Course Mission answerCode was found");
}

console.log(`Course Mission answerCode verification passed: ${verifiedCourseMissionCount} mission, ${verifiedTestCount} tests.`);
