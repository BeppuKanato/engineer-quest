/** DFS教材の標準コード、必須テストの検出力、グラフトレース、統合コードを検証する。DBは変更しない。 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import {
  depthFirstSearchAnswerCode,
  depthFirstSearchCourseSeed,
} from "../../prisma/seedData/depthFirstSearchCourseSeed";

const activities = depthFirstSearchCourseSeed.missions.flatMap((mission) => mission.activities);
const exam = activities.find((activity) => activity.content.rendererKey === "CODE_EDITOR")!;
const tests = exam.content.data.testCases as { args: [Record<string, string[]>, string]; expected: string[] }[];
const pythonData = Buffer.from(JSON.stringify({ code: depthFirstSearchAnswerCode, tests })).toString("base64");
const harness = `
import base64, json, random
data = json.loads(base64.b64decode('${pythonData}'))
namespace = {}
exec(data['code'], namespace)

def reference(graph, start):
    visited = {start}
    order = [start]
    stack = [(start, 0)]
    while stack:
        node, index = stack[-1]
        neighbors = graph.get(node, [])
        if index >= len(neighbors):
            stack.pop()
            continue
        neighbor = neighbors[index]
        stack[-1] = (node, index + 1)
        if neighbor not in visited:
            visited.add(neighbor)
            order.append(neighbor)
            stack.append((neighbor, 0))
    return order

random.seed(20260925)
count = 0
for size in range(1, 8):
    labels = [chr(ord('A') + index) for index in range(size)]
    for _ in range(80):
        graph = {label: [] for label in labels}
        for left in range(size):
            for right in range(left + 1, size):
                if random.random() < 0.32:
                    graph[labels[left]].append(labels[right])
                    graph[labels[right]].append(labels[left])
        for start in labels:
            actual = namespace['dfs_order'](graph, start)
            assert actual == reference(graph, start), (graph, start, actual)
            count += 1

mutations = {
    'visited guard removed': data['code'].replace('if neighbor not in visited:', 'if True:'),
    'arrival order reversed': data['code'].replace('order.append(node)', 'order.insert(0, node)'),
    'only first branch explored': data['code'].replace('visit(neighbor)', 'return visit(neighbor)'),
    'start call omitted': data['code'].replace('visit(start)', '# visit(start)'),
    'wrong node marked': data['code'].replace('visited.add(node)', 'visited.add(start)'),
}
for name, source in mutations.items():
    ns = {}
    exec(source, ns)
    detected = False
    for case in data['tests']:
        try:
            if ns['dfs_order'](*case['args']) != case['expected']:
                detected = True
                break
        except Exception:
            detected = True
            break
    assert detected, name
print(f'{count} generated graph/start pairs passed; all {len(mutations)} misconceptions detected by required tests.')
`;
const execution = spawnSync("python", ["-c", harness], { encoding: "utf8", timeout: 15_000 });
assert.equal(execution.status, 0, execution.stderr || execution.error?.message);
console.log(execution.stdout.trim());

for (const activity of activities.filter((item) => item.content.rendererKey === "GRAPH_TRACE" || item.content.rendererKey === "GRAPH_CHOICE")) {
  const data = activity.content.data;
  const nodeIds = new Set((data.nodes as { id: string }[]).map((node) => node.id));
  for (const step of data.steps as { queue: string[]; discoveredNodes: string[]; processedNodes: string[] }[]) {
    assert.equal(new Set(step.queue).size, step.queue.length, `${activity.id}: active calls must not contain duplicates`);
    for (const id of [...step.queue, ...step.discoveredNodes, ...step.processedNodes]) {
      assert.ok(nodeIds.has(id), `${activity.id}: trace node ${id} must exist`);
    }
    for (const id of step.queue) assert.ok(step.discoveredNodes.includes(id), `${activity.id}: active calls must be discovered`);
    for (const id of step.processedNodes) assert.ok(step.discoveredNodes.includes(id), `${activity.id}: processed nodes must be discovered`);
  }
}

const assembly = activities.find((activity) => activity.id === "dfs-full-build")!.content.data;
const blocks = assembly.codeBlocks as { id: string; label: string }[];
const slots = assembly.builderSlots as { indent: number }[];
const assembled = [
  assembly.codePreviewPrefix,
  ...(assembly.correctAnswers as string[]).map((id, index) =>
    "    ".repeat(slots[index].indent) + blocks.find((block) => block.id === id)!.label),
].join("\n");
assert.equal(assembled, depthFirstSearchAnswerCode, "The taught assembled code must equal the Course Mission answer");
console.log("All DFS graph traces are internally consistent; assembled code matches Course Mission.");

