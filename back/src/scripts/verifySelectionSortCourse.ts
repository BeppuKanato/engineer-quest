/** 教材の完成コード、必須テストの検出力、配列トレースの値保存を検証する。DBは変更しない。 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { selectionSortCourseSeed, selectionSortAnswerCode } from "../../prisma/seedData/selectionSortCourseSeed";

const activities = selectionSortCourseSeed.missions.flatMap((mission) => mission.activities);
const exam = activities.find((activity) => activity.content.rendererKey === "CODE_EDITOR")!;
const tests = exam.content.data.testCases as { args: number[][]; expected: number[] }[];
const pythonData = Buffer.from(JSON.stringify({ code: selectionSortAnswerCode, tests })).toString("base64");
const harness = `
import base64, json, itertools
data = json.loads(base64.b64decode('${pythonData}'))
namespace = {}
exec(data['code'], namespace)
count = 0
for size in range(8):
    for values in itertools.product((-1, 0, 1), repeat=size):
        original = list(values)
        actual = namespace['selection_sort'](original.copy())
        assert actual == sorted(original), (original, actual)
        count += 1
mutations = {
    'candidate value instead of index': data['code'].replace('min_index = j', 'min_index = numbers[j]'),
    'candidate never reset': data['code'].replace('        min_index = i', '        min_index = 0'),
    'last item skipped': data['code'].replace('range(i + 1, n)', 'range(i + 1, n - 1)'),
    'overwrite destroys value': data['code'].replace('numbers[i], numbers[min_index] = numbers[min_index], numbers[i]', 'numbers[i] = numbers[min_index]'),
    'return after first pass': data['code'].replace('    return numbers', '        return numbers'),
}
for name, source in mutations.items():
    ns = {}
    exec(source, ns)
    detected = False
    for case in data['tests']:
        try:
            if ns['selection_sort'](case['args'][0].copy()) != case['expected']:
                detected = True
        except Exception:
            detected = True
    assert detected, name
print(f'{count} exhaustive inputs passed; all {len(mutations)} misconceptions detected by required tests.')
`;
const execution = spawnSync("python", ["-c", harness], { encoding: "utf8", timeout: 15_000 });
assert.equal(execution.status, 0, execution.stderr || execution.error?.message);
console.log(execution.stdout.trim());

for (const activity of activities.filter((item) => item.content.rendererKey === "ARRAY_TRACE")) {
  const data = activity.content.data;
  const original = data.values as number[];
  const sorted = [...original].sort((a, b) => a - b);
  const steps = data.steps as { values?: number[]; confirmedIndices?: number[]; pointers?: { index: number }[]; comparingIndices?: number[]; swappingIndices?: number[] }[];
  for (const step of steps) {
    const values = step.values ?? original;
    assert.deepEqual([...values].sort((a, b) => a - b), sorted, `${activity.id}: values must be preserved`);
    for (const index of step.confirmedIndices ?? []) assert.equal(values[index], sorted[index], `${activity.id}: confirmed value`);
    for (const index of [...(step.pointers ?? []).map((pointer) => pointer.index), ...(step.comparingIndices ?? []), ...(step.swappingIndices ?? [])]) {
      assert.ok(index >= 0 && index < values.length, `${activity.id}: index in range`);
    }
  }
}
const assembly = activities.find((activity) => activity.id === "selection-assemble")!.content.data;
const blocks = assembly.codeBlocks as { id: string; label: string }[];
const slots = assembly.builderSlots as { indent: number }[];
const assembled = [assembly.codePreviewPrefix, ...(assembly.correctAnswers as string[]).map((id, index) => "    ".repeat(slots[index].indent) + blocks.find((block) => block.id === id)!.label)].join("\n");
assert.equal(assembled, selectionSortAnswerCode, "The taught assembled code must equal the Course Mission answer");
console.log("All trace states preserve values and valid indices; assembled code matches Course Mission.");
