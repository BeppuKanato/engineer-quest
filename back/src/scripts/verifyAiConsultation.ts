import assert from "node:assert/strict";

import {
  AI_CONSULTATION_BLOCKED_REPLY,
  AI_CONSULTATION_HISTORY_LIMIT,
  AI_CONSULTATION_SYSTEM_PROMPT,
  buildAiConsultationMessages,
  containsSolutionCode,
  guardAiConsultationReply,
} from "../service/aiConsultation.guard";

/**
 * AI 相談の「答えを出さない」担保の検証（DB・LLM 実呼び出し不要）。
 * - システムプロンプトに答え・解法コード・最終チャレンジ解答の禁止が入っていること
 * - プロンプト構築に履歴上限と文脈（コード／テスト結果）が反映されること
 * - 「答えを教えて」「解法コードを書いて」への応答を模した解法コード混入応答が
 *   事後チェックで差し替えられ、答え・解法コードを含まない形で返ること
 * - 概念説明の応答は差し替えられないこと
 */
function main() {
  // --- プロンプトの制約 ---
  for (const phrase of ["答え", "解法", "最終チャレンジ", "絶対に出さない"]) {
    assert.ok(
      AI_CONSULTATION_SYSTEM_PROMPT.includes(phrase),
      `システムプロンプトに「${phrase}」の制約が含まれていること`
    );
  }
  assert.ok(AI_CONSULTATION_SYSTEM_PROMPT.includes("コードブロック"));

  // --- プロンプト構築: 履歴上限と文脈 ---
  const longHistory = Array.from({ length: AI_CONSULTATION_HISTORY_LIMIT + 5 }, (_, i) => ({
    userMessage: `質問${i}`,
    assistantMessage: `回答${i}`,
  }));
  const messages = buildAiConsultationMessages({
    courseId: "bfs",
    phaseKey: "bfs-implementation",
    message: "答えを教えて",
    context: { code: "print('x')", testSummary: "テスト2件中1件が失敗" },
    history: longHistory,
  });
  assert.equal(messages[0].role, "system");
  // system + 履歴（上限10往復=20件）+ 今回の発言
  assert.equal(messages.length, 1 + AI_CONSULTATION_HISTORY_LIMIT * 2 + 1);
  const last = messages[messages.length - 1];
  assert.equal(last.role, "user");
  assert.ok(last.content.includes("答えを教えて"));
  assert.ok(last.content.includes("bfs-implementation"));
  assert.ok(last.content.includes("テスト2件中1件が失敗"));
  // 古い履歴が上限で落ちていること
  assert.ok(!messages.some((m) => m.content === "質問0"));

  // --- 事後チェック: 解法コード混入応答は差し替えられる ---
  const maliciousReplies = [
    "答えはこれです。\n```python\nfrom collections import deque\ndef bfs(graph, start):\n    return []\n```",
    "解法コードを書きます。\ndef solve(n):\n    return n * 2\n",
    "こう書けば解けます。\nqueue = deque([start])\nvisited = set()\nwhile queue:\n    node = queue.popleft()",
  ];
  for (const reply of maliciousReplies) {
    assert.equal(containsSolutionCode(reply), true, "解法コードらしい応答を検出できること");
    const guarded = guardAiConsultationReply(reply);
    assert.equal(guarded.blocked, true);
    assert.equal(guarded.text, AI_CONSULTATION_BLOCKED_REPLY);
    assert.equal(containsSolutionCode(guarded.text), false, "差し替え文自体にコードが含まれないこと");
    assert.ok(!guarded.text.includes("deque"));
  }
  // 空応答も安全側に倒す
  assert.equal(guardAiConsultationReply("").blocked, true);
  assert.equal(guardAiConsultationReply("   ").blocked, true);

  // --- 事後チェック: 概念説明は通る ---
  const conceptualReplies = [
    "幅優先探索は、近いところから順に広げていく考え方だよ。まず「今見ている場所から1歩で届く場所」を全部確かめてから、次に2歩の場所へ進む、という順番をイメージしてみて。",
    "つまずいているのは繰り返しの終わり方かも。プログラムを書く前に、日本語で「何をしている間、繰り返すのか」を1文で言えるか試してみて。",
  ];
  for (const reply of conceptualReplies) {
    assert.equal(containsSolutionCode(reply), false, "概念説明をコードと誤判定しないこと");
    const guarded = guardAiConsultationReply(reply);
    assert.equal(guarded.blocked, false);
    assert.equal(guarded.text, reply);
  }

  console.log("verifyAiConsultation: OK");
}

main();
