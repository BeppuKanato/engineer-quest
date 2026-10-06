import { additionalCreateQuestSeed } from "./additionalCreateQuestSeed";

export const createQuestSeed = [
  {
    id: "create-quest-turn-order-v1",
    title: "RPGの行動順を作ろう",
    description:
      "キャラクターを素早さの高い順に並べ、戦闘で使える行動順を完成させます。まず正しく動かし、安定性や入力非破壊、大量データへの対応で得点を伸ばせます。",
    scenario:
      "あなたはRPGの戦闘機能を担当しています。画面とキャラクターデータは用意済みです。decide_turn_order関数を実装し、行動順を返してください。",
    problemType: "SORT",
    functionName: "decide_turn_order",
    starterCode: [
      "def decide_turn_order(characters):",
      "    # charactersは、nameとspeedを持つ辞書のリストです",
      "    # 素早さが高いキャラクターから順に、新しいリストで返してください",
      "    return characters",
    ].join("\n"),
    estimatedMinutes: 45,
    tags: ["Python", "並べ替え", "ゲーム"],
    thumbnailUrl: "/images/create-quests/turn-order.svg",
    previewData: {
      kind: "SORT",
      previewTitle: "戦闘プレビュー",
      previewDescription: "テスト後は実行結果の行動順を表示します。",
      guidanceTitle: "標準ソートも使えます",
      guidanceBody: "sorted()や.sort()で基本要件をクリアして構いません。自作実装へ置き換えると追加得点を狙えます。",
      characters: [
        { id: "knight", name: "ナイト", speed: 42 },
        { id: "mage", name: "メイジ", speed: 68 },
        { id: "archer", name: "アーチャー", speed: 81 },
        { id: "healer", name: "ヒーラー", speed: 55 },
      ],
    },
    sortOrder: 1,
    relatedCourses: [
      {
        courseId: "course-algorithm-selection-sort-v1",
        reason: "小さいリストを自分で並べ替える処理から始められます。",
        order: 1,
      },
      {
        courseId: "course-algorithm-merge-sort-v1",
        reason: "大量データ、安定性、自作実装の要件を同時に狙いやすくなります。",
        order: 2,
      },
    ],
    requirements: [
      {
        id: "turn-order-descending",
        title: "素早さが高い順に並べる",
        description: "通常のパーティーをspeedの降順で返します。",
        kind: "BASIC" as const,
        category: "FUNCTIONAL" as const,
        points: 20,
        order: 1,
        tests: [
          {
            id: "mixed-party",
            type: "OUTPUT_EQUALS",
            label: "4人の行動順",
            args: [[
              { id: "a", name: "ナイト", speed: 42 },
              { id: "b", name: "メイジ", speed: 68 },
              { id: "c", name: "アーチャー", speed: 81 },
              { id: "d", name: "ヒーラー", speed: 55 },
            ]],
            expected: [
              { id: "c", name: "アーチャー", speed: 81 },
              { id: "b", name: "メイジ", speed: 68 },
              { id: "d", name: "ヒーラー", speed: 55 },
              { id: "a", name: "ナイト", speed: 42 },
            ],
          },
          {
            id: "already-descending",
            type: "OUTPUT_EQUALS",
            label: "すでに行動順",
            args: [[
              { id: "a", name: "A", speed: 90 },
              { id: "b", name: "B", speed: 50 },
              { id: "c", name: "C", speed: 10 },
            ]],
            expected: [
              { id: "a", name: "A", speed: 90 },
              { id: "b", name: "B", speed: 50 },
              { id: "c", name: "C", speed: 10 },
            ],
          },
        ],
        hints: [
          { id: "compare-speed", title: "比較する値", body: "辞書のspeedを比較し、大きい値を先へ置きます。" },
        ],
      },
      {
        id: "turn-order-boundaries",
        title: "空と1人のパーティーも扱う",
        description: "キャラクターが0人または1人でもエラーにしません。",
        kind: "BASIC" as const,
        category: "FUNCTIONAL" as const,
        points: 15,
        order: 2,
        tests: [
          { id: "empty", type: "OUTPUT_EQUALS", label: "0人", args: [[]], expected: [] },
          {
            id: "single",
            type: "OUTPUT_EQUALS",
            label: "1人",
            args: [[{ id: "a", name: "A", speed: 40 }]],
            expected: [{ id: "a", name: "A", speed: 40 }],
          },
        ],
        hints: [
          { id: "short-list", title: "短いリスト", body: "要素が1個以下なら、並べ替える必要はありません。" },
        ],
      },
      {
        id: "turn-order-all-members",
        title: "全員を一度ずつ行動順に含める",
        description: "人数を増やしても、欠けたり重複したりせず全員を返します。",
        kind: "BASIC" as const,
        category: "FUNCTIONAL" as const,
        points: 10,
        order: 3,
        tests: [
          {
            id: "six-members",
            type: "OUTPUT_EQUALS",
            label: "6人全員",
            args: [[
              { id: "a", name: "A", speed: 3 }, { id: "b", name: "B", speed: 9 },
              { id: "c", name: "C", speed: 1 }, { id: "d", name: "D", speed: 7 },
              { id: "e", name: "E", speed: 5 }, { id: "f", name: "F", speed: 11 },
            ]],
            expected: [
              { id: "f", name: "F", speed: 11 }, { id: "b", name: "B", speed: 9 },
              { id: "d", name: "D", speed: 7 }, { id: "e", name: "E", speed: 5 },
              { id: "a", name: "A", speed: 3 }, { id: "c", name: "C", speed: 1 },
            ],
          },
        ],
        hints: [
          { id: "leftovers", title: "残りの要素", body: "途中で片方を使い切った場合も、残った要素を結果へ追加します。" },
        ],
      },
      {
        id: "turn-order-stable",
        title: "同じ素早さなら登録順を維持する",
        description: "speedが同じキャラクターは、入力に登場した順番を保ちます。",
        kind: "OPTIONAL" as const,
        category: "QUALITY" as const,
        points: 15,
        order: 4,
        tests: [
          {
            id: "same-speed",
            type: "OUTPUT_EQUALS",
            label: "同じ素早さの3人",
            args: [[
              { id: "first", name: "先に登録", speed: 50 },
              { id: "fast", name: "最速", speed: 80 },
              { id: "second", name: "次に登録", speed: 50 },
              { id: "third", name: "最後に登録", speed: 50 },
            ]],
            expected: [
              { id: "fast", name: "最速", speed: 80 },
              { id: "first", name: "先に登録", speed: 50 },
              { id: "second", name: "次に登録", speed: 50 },
              { id: "third", name: "最後に登録", speed: 50 },
            ],
          },
        ],
        hints: [
          { id: "stability", title: "安定した並べ替え", body: "値が等しいときに左側を先に選ぶ方法は、元の順番を維持できます。" },
          { id: "stable-course", title: "役立つアルゴリズム", body: "マージソートは、結合時の比較を工夫すると安定した並べ替えにできます。", courseId: "course-algorithm-merge-sort-v1" },
        ],
      },
      {
        id: "turn-order-non-mutating",
        title: "元のパーティーデータを変更しない",
        description: "返り値を作る際に、入力されたリストの並びを変更しません。",
        kind: "OPTIONAL" as const,
        category: "QUALITY" as const,
        points: 10,
        order: 5,
        tests: [
          {
            id: "input-unchanged",
            type: "INPUT_UNCHANGED",
            label: "入力リストを維持",
            args: [[
              { id: "a", name: "A", speed: 10 },
              { id: "b", name: "B", speed: 30 },
              { id: "c", name: "C", speed: 20 },
            ]],
          },
        ],
        hints: [
          { id: "copy", title: "新しいリスト", body: "入力を直接並べ替えず、新しいリストを返す方法を考えます。" },
        ],
      },
      {
        id: "turn-order-custom-sort",
        title: "並べ替え処理を自分で実装する",
        description: "sorted()とリストの.sort()を呼ばずに並べ替えます。",
        kind: "OPTIONAL" as const,
        category: "IMPLEMENTATION" as const,
        points: 15,
        order: 6,
        tests: [
          { id: "no-standard-sort", type: "SOURCE_NO_STANDARD_SORT", label: "標準ソートを直接呼ばない" },
        ],
        hints: [
          { id: "simple-sort", title: "小さく始める", body: "未整列部分から次の値を探す選択ソートでも、この要件を達成できます。", courseId: "course-algorithm-selection-sort-v1" },
          { id: "fast-sort", title: "性能要件も狙う", body: "分割と結合を使うマージソートなら、大量データ要件も同時に狙えます。", courseId: "course-algorithm-merge-sort-v1" },
        ],
      },
      {
        id: "turn-order-efficient",
        title: "128人を比較回数1,000回以内で並べる",
        description: "データが増えても、すべての組み合わせを調べない方法で処理します。",
        kind: "OPTIONAL" as const,
        category: "PERFORMANCE" as const,
        points: 15,
        order: 7,
        tests: [
          { id: "comparison-budget", type: "COMPARISON_LIMIT", label: "128人の比較回数", size: 128, maxComparisons: 1000 },
        ],
        hints: [
          { id: "growth", title: "比較回数の増え方", body: "人数が2倍になったとき比較回数が約4倍になる方法では、上限を超えます。" },
          { id: "n-log-n", title: "役立つアルゴリズム", body: "マージソートなど、処理量がO(n log n)程度の方法が適しています。", courseId: "course-algorithm-merge-sort-v1" },
        ],
      },
    ],
  },
  ...additionalCreateQuestSeed,
] as const;
