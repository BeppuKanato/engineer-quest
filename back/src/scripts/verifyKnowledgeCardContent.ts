import assert from "node:assert/strict";
import { KnowledgeCardRarity } from "@prisma/client";
import { knowledgeCardSeed, knowledgeCardPhaseScheduleSeed } from "../../prisma/seedData/knowledgeCardSeed";
import { createQuestSeed } from "../../prisma/seedData/createQuestSeed";

// Issue #480で固定した既存の所持キー。中身を差し替えてもID・単元・取得位置は維持する。
const groups = [
  ["breadth-first-search-v1", "bfs", ["shortest-path", "deque", "bidirectional"]],
  ["wall-extension-v1", "wall-extension", ["procedural-generation", "random-seed", "perfect-maze"]],
  ["bubble-sort-v2", "bubble-sort", ["stable-sort", "swap", "complexity"]],
  ["maze-digging-v1", "maze-digging", ["backtracking", "stack", "spanning-tree"]],
  ["binary-search-v1", "binary-search", ["halving-range", "compare-middle", "logarithmic-time"]],
  ["depth-first-search-v1", "dfs", ["topological-sort", "list-stack", "backtracking"]],
  ["greedy-coins-v1", "greedy-coins", ["greedy-choice", "remaining", "not-always-optimal"]],
  ["dijkstra-v1", "dijkstra", ["weighted-graph","relaxation","priority-queue"]],
  ["astar-v1", "astar", ["heuristic","admissibility","consistency"]],
] as const;
assert.equal(knowledgeCardSeed.length, 27);
assert.equal(new Set(knowledgeCardSeed.map(card => card.title)).size, 27, "カードのタイトルが重複している");
const rarity = [KnowledgeCardRarity.RARE, KnowledgeCardRarity.COMMON, KnowledgeCardRarity.EPIC];
const phases = ["execution", "code-check", "implementation"];
for (const [groupIndex, [course, prefix, suffixes]] of groups.entries()) {
  for (const [index, suffix] of suffixes.entries()) {
    const id = `knowledge-card-${prefix}-${suffix}`;
    const card = knowledgeCardSeed.find(entry => entry.id === id);
    assert.ok(card, `既存の所持キーがない: ${id}`);
    assert.equal(card.courseId, `course-algorithm-${course}`);
    assert.equal(card.catalogNumber, index + 1);
    assert.equal(card.sortOrder, groupIndex * 3 + index + 1);
    assert.equal(card.rarity, rarity[index]);
    assert.equal(card.isPublished, true);
    const slots = knowledgeCardPhaseScheduleSeed.filter(entry => entry.knowledgeCardId === id);
    assert.equal(slots.length, 1);
    assert.equal(slots[0].phaseKey, `${prefix}-${phases[index]}`);
    assert.equal(slots[0].courseId, card.courseId);
  }
}
const quests = new Map<string, typeof createQuestSeed[number]>(createQuestSeed.map(quest => [quest.id, quest]));
for (const card of knowledgeCardSeed) {
  assert.equal(new Set(card.relatedCreateQuestIds).size, card.relatedCreateQuestIds.length, `${card.id}: 対応の重複`);
  for (const questId of card.relatedCreateQuestIds) assert.ok(quests.has(questId), `${card.id}: 存在しないクエスト ${questId}`);
  assert.ok(card.useCase.length >= 20 && card.useCase.length <= 100, `${card.id}: 作業状況の文の長さ`);
  for (const quest of createQuestSeed) assert.ok(!card.useCase.includes(quest.title), `${card.id}: クエスト名の埋め込み`);
  assert.ok(!/クエスト|画面|コレクション|ホーム|SNS|家計|履修科目|ブラウザ/.test(card.useCase), `${card.id}: 画面名や実世界だけの例`);
}
assert.ok(knowledgeCardSeed.some(card => card.relatedCreateQuestIds.length === 0), "対応なしは空配列");
assert.ok(knowledgeCardSeed.some(card => card.relatedCreateQuestIds.length > 1), "複数の使える場所に対応できる");
const title = (id: string) => knowledgeCardSeed.find(card => card.id === `knowledge-card-${id}`)?.title;
assert.equal(title("dfs-list-stack"), "リストで作るスタック");
assert.equal(title("dfs-backtracking"), "枝刈り");
assert.equal(title("maze-digging-backtracking"), "バックトラッキング");
assert.equal(title("maze-digging-stack"), "再帰呼び出し");
console.log(`PASS: 知識カード27枚の所持キー・取得位置・レアリティ保持、タイトル重複なし、作業状況と関連クエストIDの整合性（対応あり${knowledgeCardSeed.filter(card => card.relatedCreateQuestIds.length > 0).length}枚）。`);
