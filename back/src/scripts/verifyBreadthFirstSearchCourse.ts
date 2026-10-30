/** BFS教材の標準コード、必須テストの検出力、グラフトレース、統合コードを検証する。DBは変更しない。 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import {
  breadthFirstSearchAnswerCode,
  breadthFirstSearchCourseSeed,
} from "../../prisma/seedData/breadthFirstSearchCourseSeed";

const activities = breadthFirstSearchCourseSeed.missions.flatMap((mission) => mission.activities);
const exam = activities.find((activity) => activity.content.rendererKey === "CODE_EDITOR")!;
const tests = exam.content.data.testCases as { args: [Record<string, string[]>, string]; expected: Record<string, number> }[];
const pythonData = Buffer.from(JSON.stringify({ code: breadthFirstSearchAnswerCode, tests })).toString("base64");
const harness = `
import base64, json, random
data = json.loads(base64.b64decode('${pythonData}'))
namespace = {}
exec(data['code'], namespace)

def reference(graph, start):
    distances = {start: 0}
    frontier = [start]
    distance = 0
    while frontier:
        next_frontier = []
        for node in frontier:
            for neighbor in graph.get(node, []):
                if neighbor not in distances:
                    distances[neighbor] = distance + 1
                    next_frontier.append(neighbor)
        frontier = next_frontier
        distance += 1
    return distances

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
            actual = namespace['bfs_distances'](graph, start)
            assert actual == reference(graph, start), (graph, start, actual)
            count += 1

mutations = {
    'right side pop breaks breadth order': data['code'].replace('queue.popleft()', 'queue.pop()'),
    'visited check reversed': data['code'].replace('neighbor not in distances', 'neighbor in distances'),
    'distance not increased': data['code'].replace('distances[node] + 1', 'distances[node]'),
    'start not marked': data['code'].replace('distances = {start: 0}', 'distances = {}'),
}
for name, source in mutations.items():
    ns = {}
    exec(source, ns)
    detected = False
    for case in data['tests']:
        try:
            if ns['bfs_distances'](*case['args']) != case['expected']:
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
  for (const edge of data.edges as { from: string; to: string }[]) {
    assert.ok(nodeIds.has(edge.from) && nodeIds.has(edge.to), `${activity.id}: edge nodes must exist`);
  }
  for (const step of data.steps as {
    queue: string[];
    discoveredNodes: string[];
    processedNodes: string[];
    distances?: Record<string, number>;
  }[]) {
    assert.equal(new Set(step.queue).size, step.queue.length, `${activity.id}: queue must not contain duplicates`);
    for (const id of [...step.queue, ...step.discoveredNodes, ...step.processedNodes, ...Object.keys(step.distances ?? {})]) {
      assert.ok(nodeIds.has(id), `${activity.id}: trace node ${id} must exist`);
    }
    for (const id of step.queue) assert.ok(step.discoveredNodes.includes(id), `${activity.id}: queued nodes must be discovered`);
    for (const id of step.processedNodes) assert.ok(step.discoveredNodes.includes(id), `${activity.id}: processed nodes must be discovered`);
    for (const id of Object.keys(step.distances ?? {})) assert.ok(step.discoveredNodes.includes(id), `${activity.id}: distances must belong to discovered nodes`);
  }
}

const assembly = activities.find((activity) => activity.id === "bfs-full-build")!.content.data;
const blocks = assembly.codeBlocks as { id: string; label: string }[];
const slots = assembly.builderSlots as { indent: number }[];
const assembled = [
  assembly.codePreviewPrefix,
  ...(assembly.correctAnswers as string[]).map((id, index) =>
    "    ".repeat(slots[index].indent) + blocks.find((block) => block.id === id)!.label),
].join("\n");
assert.equal(assembled, breadthFirstSearchAnswerCode, "The taught assembled code must equal the Course Mission answer");
console.log("All graph traces are internally consistent; assembled code matches Course Mission.");
