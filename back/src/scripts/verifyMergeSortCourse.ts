/** マージソート教材の標準コード、必須テスト、段階図、統合コードを検証する。DBは変更しない。 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import { mergeSortAnswerCode, mergeSortCourseSeed } from "../../prisma/seedData/mergeSortCourseSeed";

const activities = mergeSortCourseSeed.missions.flatMap((mission) => mission.activities);
const exam = activities.find((activity) => activity.content.rendererKey === "CODE_EDITOR")!;
const tests = exam.content.data.testCases as { args: [number[]]; expected: number[] }[];
const pythonData = Buffer.from(JSON.stringify({ code: mergeSortAnswerCode, tests })).toString("base64");
const harness = `
import base64, json, random
data = json.loads(base64.b64decode('${pythonData}'))
namespace = {}
exec(data['code'], namespace)

random.seed(20260925)
count = 0
for size in range(9):
    for _ in range(200):
        values = [random.randint(-9, 9) for _ in range(size)]
        original = values[:]
        actual = namespace['merge_sort'](values)
        assert actual == sorted(original), (original, actual)
        assert values == original, ('input mutated', original, values)
        count += 1

mutations = {
    'base result emptied': data['code'].replace('return numbers', 'return []', 1),
    'right boundary skips middle': data['code'].replace('numbers[middle:]', 'numbers[middle + 1:]'),
    'comparison reversed': data['code'].replace('left[i] <= right[j]', 'left[i] >= right[j]'),
    'wrong pointer advanced': data['code'].replace('merged.append(right[j])\\n            j += 1', 'merged.append(right[j])\\n            i += 1'),
    'left remainder omitted': data['code'].replace('merged.extend(left[i:])', '# merged.extend(left[i:])'),
    'left recursion omitted': data['code'].replace('left = merge_sort(numbers[:middle])', 'left = numbers[:middle]'),
}
for name, source in mutations.items():
    ns = {}
    exec(source, ns)
    detected = False
    for case in data['tests']:
        try:
            if ns['merge_sort'](*case['args']) != case['expected']:
                detected = True
                break
        except Exception:
            detected = True
            break
    assert detected, name
print(f'{count} generated lists passed without input mutation; all {len(mutations)} misconceptions detected by required tests.')
`;

const execution = spawnSync("python", ["-c", harness], { encoding: "utf8", timeout: 15_000 });
assert.equal(execution.status, 0, execution.stderr || execution.error?.message);
console.log(execution.stdout.trim());

const sortedText = (values: number[]) => [...values].sort((left, right) => left - right).join(",");
for (const activity of activities.filter((item) => item.content.rendererKey === "DIVIDE_COMBINE_TRACE")) {
  const levels = activity.content.data.levels as { groups: number[][]; phase: "DIVIDE" | "COMBINE" }[];
  const baseline = sortedText(levels[0].groups.flat());
  levels.forEach((level, index) => {
    assert.equal(sortedText(level.groups.flat()), baseline, `${activity.id} level ${index}: values must be preserved`);
    if (level.phase === "COMBINE") {
      level.groups.forEach((group) => assert.deepEqual(group, [...group].sort((a, b) => a - b), `${activity.id}: combined groups must be sorted`));
    }
  });
}

for (const activity of activities.filter((item) => item.content.rendererKey === "TWO_LIST_MERGE_TRACE")) {
  const data = activity.content.data as unknown as {
    left: number[];
    right: number[];
    steps: { leftIndex: number; rightIndex: number; result: number[] }[];
  };
  assert.deepEqual(data.left, [...data.left].sort((a, b) => a - b), `${activity.id}: left input must be sorted`);
  assert.deepEqual(data.right, [...data.right].sort((a, b) => a - b), `${activity.id}: right input must be sorted`);
  data.steps.forEach((step, index) => {
    const consumed = [...data.left.slice(0, step.leftIndex), ...data.right.slice(0, step.rightIndex)].sort((a, b) => a - b);
    assert.deepEqual(step.result, consumed, `${activity.id} step ${index}: result must contain exactly consumed values`);
  });
  const last = data.steps.at(-1)!;
  assert.equal(last.leftIndex, data.left.length, `${activity.id}: final step must consume left`);
  assert.equal(last.rightIndex, data.right.length, `${activity.id}: final step must consume right`);
}

const assembly = activities.find((activity) => activity.id === "merge-full-build")!.content.data;
const blocks = assembly.codeBlocks as { id: string; label: string }[];
const slots = assembly.builderSlots as { indent: number }[];
const assembled = [
  assembly.codePreviewPrefix,
  ...(assembly.correctAnswers as string[]).map((id, index) =>
    "    ".repeat(slots[index].indent) + blocks.find((block) => block.id === id)!.label),
].join("\n");
assert.equal(assembled, mergeSortAnswerCode, "The taught assembled code must equal the Course Mission answer");
console.log("All divide/merge traces preserve their invariants; assembled code matches Course Mission.");
