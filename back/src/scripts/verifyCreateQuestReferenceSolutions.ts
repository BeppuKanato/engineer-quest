import { spawnSync } from "node:child_process";

import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";

const answers: Record<string, string> = {
  "create-quest-turn-order-v1": `
def decide_turn_order(characters):
    if len(characters) <= 1:
        return list(characters)
    middle = len(characters) // 2
    left = decide_turn_order(characters[:middle])
    right = decide_turn_order(characters[middle:])
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i]["speed"] >= right[j]["speed"]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    return merged + left[i:] + right[j:]
`,
  "create-quest-dungeon-route-v1": `
from collections import deque
def find_escape_route(passages, start, goal):
    queue = deque([(start, [start])])
    visited = {start}
    while queue:
        room, route = queue.popleft()
        if room == goal:
            return route
        for next_room in passages.get(room, []):
            if next_room not in visited:
                visited.add(next_room)
                queue.append((next_room, route + [next_room]))
    return []
`,
  "create-quest-chat-keyword-v1": `
def find_keyword(text, keyword):
    if len(keyword) == 0:
        return 0
    lps = [0] * len(keyword)
    length = 0
    i = 1
    while i < len(keyword):
        if keyword[i] == keyword[length]:
            length += 1; lps[i] = length; i += 1
        elif length > 0:
            length = lps[length - 1]
        else:
            lps[i] = 0; i += 1
    i = j = 0
    while i < len(text):
        if text[i] == keyword[j]:
            i += 1; j += 1
            if j == len(keyword):
                return i - j
        elif j > 0:
            j = lps[j - 1]
        else:
            i += 1
    return -1
`,
  "create-quest-product-search-v1": `
def find_product(products, target_id):
    left = 0
    right = len(products) - 1
    answer = None
    while left <= right:
        middle = (left + right) // 2
        current_id = products[middle]["id"]
        if current_id == target_id:
            answer = products[middle]
            right = middle - 1
        elif current_id < target_id:
            left = middle + 1
        else:
            right = middle - 1
    return answer
`,
  "create-quest-skill-tree-v1": `
def find_unlockable_skills(skill_tree, start):
    stack = list(reversed(skill_tree.get(start, [])))
    visited = {start}
    result = []
    while stack:
        skill = stack.pop()
        if skill in visited:
            continue
        visited.add(skill)
        result.append(skill)
        stack.extend(reversed(skill_tree.get(skill, [])))
    return result
`,
};

const harness = String.raw`
import copy, json, sys

class TrackedNumber(int):
    comparisons = 0
    @classmethod
    def reset(cls): cls.comparisons = 0
    @classmethod
    def hit(cls): cls.comparisons += 1
    def __lt__(self, other): self.hit(); return int(self) < int(other)
    def __le__(self, other): self.hit(); return int(self) <= int(other)
    def __gt__(self, other): self.hit(); return int(self) > int(other)
    def __ge__(self, other): self.hit(); return int(self) >= int(other)
    def __eq__(self, other): self.hit(); return int(self) == int(other)

class TrackedCharacter(str):
    comparisons = 0
    @classmethod
    def reset(cls): cls.comparisons = 0
    def __eq__(self, other): type(self).comparisons += 1; return str(self) == str(other)

class TrackedString:
    def __init__(self, value): self.value = str(value)
    def __len__(self): return len(self.value)
    def __getitem__(self, key):
        value = self.value[key]
        return TrackedString(value) if isinstance(key, slice) else TrackedCharacter(value)

class TrackedGraph(dict):
    accesses = 0
    def __getitem__(self, key): type(self).accesses += 1; return super().__getitem__(key)
    def get(self, key, default=None): type(self).accesses += 1; return super().get(key, default)

def plain(value):
    if isinstance(value, list): return [plain(item) for item in value]
    if isinstance(value, dict): return {key: plain(item) for key, item in value.items()}
    if isinstance(value, TrackedNumber): return int(value)
    return value

def bag(value): return sorted(json.dumps(plain(item), ensure_ascii=False, sort_keys=True) for item in value)
def track_field(value, field):
    if isinstance(value, list): return [track_field(item, field) for item in value]
    if isinstance(value, dict): return {key: TrackedNumber(item) if key == field and isinstance(item, int) else track_field(item, field) for key, item in value.items()}
    return value

payload = json.load(sys.stdin)
reports = []
for quest in payload:
    namespace = {}
    exec(quest["code"], namespace)
    function = namespace[quest["functionName"]]
    score = 0
    failed = []
    for requirement in quest["requirements"]:
        passed = True
        for case in requirement["tests"]:
            kind = case["type"]
            args = copy.deepcopy(case.get("args", []))
            before = copy.deepcopy(args)
            if kind == "COMPARISON_LIMIT":
                size = case["size"]
                values = [{"id": f"unit-{i}", "name": f"Unit {i}", "speed": (size * 13 - i * 37) % 997} for i in range(size)]
                expected = sorted(values, key=lambda item: item["speed"], reverse=True)
                tracked = [{**item, "speed": TrackedNumber(item["speed"])} for item in values]
                TrackedNumber.reset(); actual = function(tracked)
                ok = plain(actual) == expected and TrackedNumber.comparisons <= case["maxComparisons"]
            elif kind == "FIELD_COMPARISON_LIMIT":
                size = case["size"]
                args = [[{"id": i * 2, "name": f"商品{i}", "stock": i % 10} for i in range(size)], case["targetId"]]
                args[0] = track_field(args[0], case.get("field", "id")); args[1] = TrackedNumber(args[1])
                TrackedNumber.reset(); actual = function(*args)
                ok = plain(actual) == case["expected"] and TrackedNumber.comparisons <= case["maxComparisons"]
            elif kind == "STRING_COMPARISON_LIMIT":
                TrackedCharacter.reset(); actual = function(TrackedString(args[0]), TrackedString(args[1]))
                ok = actual == case["expected"] and TrackedCharacter.comparisons <= case["maxComparisons"]
            elif kind == "GRAPH_ACCESS_LIMIT":
                args[0] = TrackedGraph(args[0]); TrackedGraph.accesses = 0; actual = function(*args)
                ok = actual == case["expected"] and TrackedGraph.accesses <= case["maxAccesses"]
            elif kind == "SOURCE_NO_STANDARD_SORT":
                ok = "sorted(" not in quest["code"] and ".sort(" not in quest["code"]
            else:
                actual = function(*args)
                if kind == "INPUT_UNCHANGED": ok = args == before
                elif kind == "OUTPUT_SET_EQUALS": ok = isinstance(actual, list) and bag(actual) == bag(case["expected"])
                else: ok = plain(actual) == case.get("expected")
            if not ok:
                passed = False
                failed.append(f'{requirement["id"]}:{case["id"]}:actual={plain(actual) if "actual" in locals() else "n/a"}:expected={case.get("expected")}')
        if passed: score += requirement["points"]
    reports.append({"id": quest["id"], "score": score, "failed": failed})
print(json.dumps(reports, ensure_ascii=False))
`;

const payload = createQuestSeed.map((quest) => ({
  id: quest.id,
  functionName: quest.functionName,
  code: answers[quest.id],
  requirements: quest.requirements,
}));

for (const quest of payload) {
  if (!quest.code) throw new Error(`Reference solution is missing: ${quest.id}`);
  const total = quest.requirements.reduce((sum, requirement) => sum + requirement.points, 0);
  const basic = quest.requirements.filter((requirement) => requirement.kind === "BASIC").reduce((sum, requirement) => sum + requirement.points, 0);
  if (total !== 100 || basic !== 45) throw new Error(`Unexpected score allocation: ${quest.id} (${basic}/${total})`);
}

const result = spawnSync("python", ["-X", "utf8", "-c", harness], {
  input: JSON.stringify(payload),
  encoding: "utf8",
  maxBuffer: 10 * 1024 * 1024,
});
if (result.status !== 0) throw new Error(result.stderr || "Reference solution verification failed");
const reports = JSON.parse(result.stdout) as Array<{ id: string; score: number; failed: string[] }>;
for (const report of reports) {
  console.log(`${report.id}: ${report.score}/100${report.failed.length ? ` failed=${report.failed.join(",")}` : ""}`);
  if (report.score !== 100) process.exitCode = 1;
}
