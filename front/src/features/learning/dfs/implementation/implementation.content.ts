import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import { searchGraphAdjacency } from "../../graphs/searchGraph";
import { dfsCode, type DfsCodeLineId } from "../code-mapping/dfsCode";
import { dfsConsolidationContent, transferGraph } from "../consolidation/consolidation.content";

/**
 * フェーズ7（自分で実装）の問題と判定データ（プログラム形式）。
 * BFS（PR #529）と同じ契約で、学習者は関数ではなくプログラムを書く。
 * 入力は標準入力で与えられ、標準出力へ2つの結果を出す。関数名・変数名・
 * 書き方は固定しない。旧・関数形は implementation-legacy に保存した。
 *
 * 出力（2026-11-28 の仕様変更。単元ミッションとの目的共有のため、訪問順に
 * 加えて「たどり着けた宝の数」を報告させる。宝の数はミッションの目的の
 * 報告であり、訪問順は深さ優先探索を実行したことの証跡になる）：
 *   1行目：出発点からたどり着けた宝の数
 *   2行目：出発点からたどり着ける場所を、深さ優先探索で初めて訪れた順
 *
 * 順番の約束（フェーズ4・5のコード契約 dfs-order-stack v1）：
 * スタックを使い、積むときに訪問済みにし、隣は逆順に積む。
 * 隣の並びは入力に現れた順とする。この約束で順番は一意に決まる。
 *
 * 入力の形式：
 *   1行目：出発点の場所（アルファベット大文字1文字）
 *   2行目：宝のある場所（半角スペース区切り。宝の位置は問題仕様として明示する）
 *   3行目以降：道でつながっている場所のペア「A B」（両方向にたどれる）
 */
export type ProgramTest = {
  readonly id: string;
  readonly label: string;
  readonly visibility: "display" | "judgement";
  readonly inputText: string;
  /** 入力に登場するすべての場所（アルファベット順）。 */
  readonly nodes: readonly string[];
  /** 宝のある場所。 */
  readonly treasures: readonly string[];
  /** 期待する訪問順（たどり着ける場所だけ）。 */
  readonly expected: readonly string[];
  /** 期待する「たどり着けた宝の数」（訪問順に含まれる宝の数）。 */
  readonly expectedCount: number;
};

/** 図の描画用に、入力テキストから宝の行（2行目）を取り除く。共通の図部品は「出発点＋つながり」の形式を読むため。 */
export const graphInputText = (inputText: string): string => {
  const lines = inputText.split("\n");
  return [lines[0], ...lines.slice(2)].join("\n");
};

/** 期待する標準出力の全文（入口と問題タブの「出力の例」用）。 */
export const expectedOutputText = (test: ProgramTest): string => `${test.expectedCount}\n${test.expected.join(" ")}`;

type Adjacency = Readonly<Record<string, readonly string[]>>;

/** 隣接リストから、同じ隣接リストを再現できる入力（ペアの並び）を作る。 */
const edgesFromAdjacency = (adjacency: Adjacency): [string, string][] => {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const [node, neighbors] of Object.entries(adjacency)) {
    for (const neighbor of neighbors) {
      const key = [node, neighbor].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([node, neighbor]);
    }
  }
  return edges;
};

const buildAdjacency = (start: string, edges: readonly (readonly [string, string])[]): Map<string, string[]> => {
  const graph = new Map<string, string[]>();
  const ensure = (node: string) => {
    if (!graph.has(node)) graph.set(node, []);
    return graph.get(node)!;
  };
  ensure(start);
  for (const [a, b] of edges) {
    ensure(a).push(b);
    ensure(b).push(a);
  }
  return graph;
};

/** 期待値の正本：スタック形の深さ優先探索（積むときに訪問済み、隣は逆順に積む）。 */
const referenceOrder = (graph: ReadonlyMap<string, readonly string[]>, start: string): string[] => {
  const visited = new Set([start]);
  const order: string[] = [];
  const stack = [start];
  while (stack.length > 0) {
    const node = stack.pop()!;
    order.push(node);
    for (const neighbor of [...(graph.get(node) ?? [])].reverse()) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        stack.push(neighbor);
      }
    }
  }
  return order;
};

const testCase = (
  id: string,
  label: string,
  visibility: ProgramTest["visibility"],
  start: string,
  treasures: readonly string[],
  edges: readonly (readonly [string, string])[],
): ProgramTest => {
  const graph = buildAdjacency(start, edges);
  const expected = referenceOrder(graph, start);
  return {
    id, label, visibility,
    inputText: [start, treasures.join(" "), ...edges.map(([a, b]) => `${a} ${b}`)].join("\n"),
    nodes: [...graph.keys()].sort(),
    treasures,
    expected,
    expectedCount: expected.filter(place => treasures.includes(place)).length,
  };
};

const transferAdjacency: Adjacency = Object.fromEntries(transferGraph.nodes.map(({ id }) => [
  id, transferGraph.edges.flatMap(edge => edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : []),
]));

const parsonsQuestion = dfsConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-stack", "for-neighbor-reversed", "if-unvisited"] as const;

const codeLineText = (id: DfsCodeLineId): string => {
  const line = dfsCode.lines.find(line => line.id === id);
  if (!line) throw new Error("Missing canonical line");
  return line.text;
};
/** 正解コードは関数の中の行（インデント4つ分）なので、プログラムのトップレベル用に4つ外す。 */
const dedent = (text: string): string => text.replace(/^ {4}/u, "");
const placeholderLine = (id: DfsCodeLineId, description: string): string => {
  const indent = /^ */u.exec(dedent(codeLineText(id)))?.[0] ?? "";
  return `${indent}raise NotImplementedError  # ここを書く：${description}`;
};
const placeholderGuide = "# 「ここを書く」の行が、まだ書けていない場所です。その行を消して、自分のコードを書いてください。";

/** 入力の受け取り（用意する行）。出発点と宝のある場所を読み、場所のつながり（両方向）を辞書にする。 */
const inputLines = [
  "import sys",
  "",
  "lines = [line.split() for line in sys.stdin.read().splitlines() if line.strip()]",
  "start = lines[0][0]",
  "treasures = lines[1]",
  "graph = {}",
  "for a, b in lines[2:]:",
  "    graph.setdefault(a, []).append(b)",
  "    graph.setdefault(b, []).append(a)",
  "graph.setdefault(start, [])",
];
/** 出力（用意する行）。1行目にたどり着けた宝の数、2行目に訪れた順を出す。 */
const outputLines = [
  "found = sum(1 for place in treasures if place in order)",
  "print(found)",
  "print(*order)",
];

const bodyLine = (id: DfsCodeLineId): string => dedent(codeLineText(id));

/** 自由実装の初期コード。決まりは入出力の形式だけ。 */
const fullTemplate = "# ここを書く：入力を受け取り、たどり着けた宝の数と深さ優先で訪れた順を出力するプログラムを書く\n# 入力の1行目は出発点、2行目は宝のある場所、3行目以降は「場所 場所」のつながりです。\n";

/** 橋渡し（骨格）：入力の受け取り・出力と制御構造は用意し、本体の行をプレースホルダにする。 */
const skeletonTemplate = [
  ...inputLines,
  "",
  placeholderGuide,
  placeholderLine("initialize-visited", "出発点を入れた発見済みの集合を用意する"),
  placeholderLine("initialize-order", "訪問順を記録する空のリストを用意する"),
  placeholderLine("initialize-stack", "出発点を入れたスタックを用意する"),
  bodyLine("while-stack"),
  placeholderLine("pop-node", "スタックの末尾から場所を1つ取り出す"),
  placeholderLine("append-order", "取り出した場所を訪問順に記録する"),
  bodyLine("for-neighbor-reversed"),
  bodyLine("if-unvisited"),
  placeholderLine("mark-visited", "隣の場所を発見済みとして記録する"),
  placeholderLine("append-stack", "隣の場所をスタックの末尾に追加する"),
  ...outputLines,
].join("\n");

/** 橋渡し（穴埋め）：要点の行（取り出し・発見の記録・スタックへの追加）だけをプレースホルダにする。 */
const fillInTemplate = [
  ...inputLines,
  "",
  placeholderGuide,
  bodyLine("initialize-visited"),
  bodyLine("initialize-order"),
  bodyLine("initialize-stack"),
  bodyLine("while-stack"),
  placeholderLine("pop-node", "スタックの末尾から場所を1つ取り出す"),
  bodyLine("append-order"),
  bodyLine("for-neighbor-reversed"),
  bodyLine("if-unvisited"),
  placeholderLine("mark-visited", "隣の場所を発見済みとして記録する"),
  placeholderLine("append-stack", "隣の場所をスタックの末尾に追加する"),
  ...outputLines,
].join("\n");

const levelTemplates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: skeletonTemplate,
  "fill-in": fillInTemplate,
};

/** お手本のプログラム（フェーズ6までの正解コードを、プログラムの形に組み直したもの）。 */
export const dfsExampleProgram = [
  ...inputLines,
  "",
  bodyLine("initialize-visited"),
  bodyLine("initialize-order"),
  bodyLine("initialize-stack"),
  bodyLine("while-stack"),
  bodyLine("pop-node"),
  bodyLine("append-order"),
  bodyLine("for-neighbor-reversed"),
  bodyLine("if-unvisited"),
  bodyLine("mark-visited"),
  bodyLine("append-stack"),
  ...outputLines,
].join("\n");

/**
 * 自動チェック。種を固定した乱数でグラフと宝の配置を作り（毎回同じケースに
 * なり、結果が再現できる）、期待値は参照実装で求める。到達できない場所を
 * 含むグラフも自然に混ざる（その場所は期待する順番に入らず、そこの宝は
 * 期待する宝の数に入らない）。
 */
const autoTests: readonly ProgramTest[] = (() => {
  let seed = 20261125;
  const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const cases: ProgramTest[] = [];
  for (let index = 0; index < 24; index++) {
    const nodeCount = 2 + Math.floor(random() * 7);
    const nodes = Array.from({ length: nodeCount }, (_, i) => String.fromCharCode(65 + i));
    const edges: [string, string][] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (random() < 0.35) edges.push([nodes[i], nodes[j]]);
      }
    }
    // 宝は各場所に3割で置き、1つも無いケースは作らない（入力の2行目が空にならないようにする）。
    const treasures = nodes.filter(() => random() < 0.3);
    if (treasures.length === 0) treasures.push(nodes[nodes.length - 1]);
    cases.push(testCase(`A${index + 1}`, `自動チェック${index + 1}`, "judgement", "A", treasures, edges));
  }
  return cases;
})();

export const dfsAutoTests: readonly ProgramTest[] = autoTests;

export const dfsImplementationContent = {
  version: 2, id: "dfs-implementation", phase: 7,
  caption: "出発点からたどり着けた宝の数と、深さ優先で訪れた順を求めるプログラムを完成させて、ミッションを達成しましょう。",
  template: fullTemplate,
  templates: levelTemplates,
  /** 単元ミッション（ミッションバンド表示用）。文言は単元ミッションの登録と一致させる。 */
  mission: {
    title: "迷路の宝を見落とさず探す",
    successCondition: "たどり着けた宝の数と正しい訪問順を報告できたとき達成",
  },
  /** 問題文（仕様）。入口の画面ではなく、作業画面の「問題」タブに常駐させる。 */
  statement: {
    tabLabel: "問題",
    title: "宝の数と訪れる順番を求めるプログラム",
    lead: "迷路には分かれ道と行き止まりがあり、あちこちに宝が置かれています。出発点を受け取って、一本の道を奥まで進む深さ優先探索で、たどり着けた宝の数と、場所を初めて訪れた順番を求めるプログラムを作りましょう。",
    inputLabel: "入力",
    inputFormat: "入力の1行目は出発点の場所です。2行目は、宝のある場所が半角スペース区切りで並びます。3行目以降は、道でつながっている場所のペアが「A B」のように半角スペース区切りで並びます。ペアは両方向にたどれるものとします。各場所からたどれる場所の並びは、入力に現れた順とします。",
    outputLabel: "出力",
    outputFormat: "1行目に、出発点からたどり着けた宝の数を出力してください。2行目に、出発点からたどり着ける場所を、深さ優先探索で初めて訪れた順に、半角スペース区切りで出力してください。たどり着けない場所は出力しません。順番は、フェーズ4・5で学んだ約束（スタックを使い、積むときに訪問済みにし、隣は逆順に積む）で決まります。",
    constraintsLabel: "条件",
    constraints: [
      "場所はアルファベットの大文字1文字で表されます。",
      "宝は複数の場所にあります。たどり着けない場所にある宝は数えません。",
      "同じペアが重複して現れることはありません。",
      "書き方は自由です。関数を使っても、使わなくてもかまいません。",
    ],
    exampleInputLabel: "入力の例",
    exampleOutputLabel: "出力の例",
  },
  // 宝の配置：D1はフェーズ1と同じF（道の奥の行き止まり）とC（最後に訪れる場所）。
  // D2はツリーの葉JとL（葉Kには宝がなく、「訪れた」と「宝があった」を区別する）。
  // J1は到達できないZにも宝を置き、数に入らないことを確かめる。J2は出発点自体に宝。
  tests: [
    testCase("D1", "基本（動きの説明のつながり）", "display", "A", ["F", "C"], edgesFromAdjacency(searchGraphAdjacency)),
    testCase("D2", "応用（別のつながり）", "display", "G", ["J", "L"], edgesFromAdjacency(transferAdjacency)),
    testCase("J1", "たどり着けない場所あり", "judgement", "A", ["F", "C", "Z"], [...edgesFromAdjacency(searchGraphAdjacency), ["Y", "Z"] as [string, string]]),
    testCase("J2", "場所が1つだけ", "judgement", "A", ["A"], []),
    testCase("J3", "一直線のつながり", "judgement", "A", ["C", "E"], [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]]),
  ] satisfies ProgramTest[],
  /**
   * 支援エスカレーション（ヒント → 橋渡し → お手本）の文言。
   * 書き方レベル（骨格・穴埋め）は任意フェーズ6.5「実装の橋渡し」の中身。
   */
  freeForm: {
    modeFree: "自由に書く",
    bridgeLabel: "実装の橋渡し",
    bridgeButton: "型を使う（橋渡し）",
    bridgeChangeButton: "型を変える",
    bridgeBackButton: "自由に書くに戻る",
    bridgeDialogTitle: "実装の橋渡し（任意フェーズ 6.5）",
    bridgeDialogLead: "型を使うと、入力の受け取りや出力、コードの骨格が用意された状態から書けます。型のコードは、今のコードとは別の下書きに残ります。",
    bridgeUseButton: "この型で書く",
    bannerText: "詰まってきたら、型（橋渡し）を使って書くこともできます。",
    bannerDismiss: "閉じる",
    exampleButton: "お手本を見る",
    exampleTitle: "お手本（考え方の確認用）",
    exampleNote: "お手本は、フェーズ6までで学んだ考え方をプログラムの形にしたものです。写すためではなく、考え方を確認するために見ましょう。",
    autoLabel: "いろいろなつながり（自動チェック）",
    autoShortLabel: "自動チェック",
    autoCaptionNone: "場所の数やつながり方の違うグラフで自動的に確認します。内容は非公開です。",
    autoCaptionPassed: "{total} 件すべて、期待どおりの結果になりました。",
    autoCaptionFailed: "{total} 件中 {passed} 件が期待どおりでした。行き止まりで戻る場面や、たどり着けない場所のあるグラフで確かめてみましょう。",
  },
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    descriptions: ["使える変数やコードの部品を確認する", "どのような順序で処理するかを確認する", "コードの構造を確認する", "コードを並べ替えながら復習する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "start", description: "出発点の場所" },
      { name: "treasures", description: "宝のある場所のリスト" },
      { name: "graph", description: "場所のつながり（場所から、つながる場所のリストへの辞書）" },
      { name: "visited", description: "発見済みの場所を記録し、二度追加するのを防ぐ集合" },
      { name: "order", description: "初めて訪れた順を記録するリスト" },
      { name: "stack", description: "これから調べる場所を末尾に入れ、末尾から取り出すリスト" },
    ],
    tokens: ["sys.stdin.read()", "graph.setdefault(a, []).append(b)", "visited = {start}", "stack = [start]", "stack.pop()", "order.append(node)", "reversed(graph.get(node, []))", "neighbor not in visited", "visited.add(neighbor)", "stack.append(neighbor)", "sum(1 for place in treasures if place in order)", "print(*order)"],
    tokenInstruction: "トークンを選ぶと、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "発見済みの集合・訪問順のリスト・スタックを用意し、出発点を発見済みに記録してスタックに入れる",
      "スタックの末尾から場所を1つ取り出して、訪問順に記録する",
      "取り出した場所の隣を逆順に見て、未発見の場所を発見済みに記録してからスタックの末尾に入れる",
      "スタックが空になったら、訪問順に含まれる宝の数を数えて出力し、続けて訪問順を出力する",
    ],
    loopLabel: "スタックが空になるまでくり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = dfsCode.lines.find(line => line.id === id);
      if (!line) throw new Error("Missing skeleton line");
      return line;
    }),
    parsonsQuestion,
    closeLabel: "ヒントを閉じる",
    groupLabel: "段階式ヒント",
  },
  display: {
    listLabel: "テスト結果一覧", errorLabel: "直近の実行結果",
    inputLabel: "入力",
    expectedLabel: "期待する順番", actualLabel: "実際の順番", noOutput: "—",
    expectedCountLabel: "期待する宝の数", actualCountLabel: "実際の宝の数", countUnit: "個",
    invalid: "場所のリストではありません", lengthMismatch: "場所の数が期待と違います",
    different: "期待と違う位置：{count}個",
    statuses: { passed: { icon: "✓", label: "通過" }, failed: { icon: "×", label: "不一致" }, unexecuted: { icon: "○", label: "未実行" },
      errorSyntax: { icon: "!", label: "実行不可" }, errorRuntime: { icon: "!", label: "実行エラー" }, errorTimeout: { icon: "!", label: "タイムアウト" } },
    messages: {
      syntax: "文法エラーのため実行できていないテストがあります。",
      runtime: "実行時エラーが起きているテストがあります。",
      timeout: "実行が終わらないテストがあります（無限ループの可能性があります）。",
      mismatch: "実行はできていますが、結果が期待と違うテストがあります。",
    },
    guidance: {
      syntax: "括弧の対応や、式が途中で終わっていないか確認してみましょう。",
      runtime: "エラーの起きた行で、変数の値がどうなっているか確認してみましょう。",
      timeout: "繰り返しが終わる条件を確認してみましょう。",
    },
    // 例外クラスごとの定型文（LLMなし）。分類名ではなく「何が起きたか」を出す。
    exceptionMessages: {
      NameError: { title: "変数『{name}』が定義されていません", titleNoName: "変数が定義されていません", guidance: "使う前に、その変数へ値を代入しているか確認してみましょう。" },
      IndexError: { title: "リストの範囲外の場所を参照しています", guidance: "リストの長さと、参照している位置（番号）を確認してみましょう。" },
      TypeError: { title: "値の種類が合わず、処理できませんでした", guidance: "その行で使っている値が、期待される種類（数やリストなど）になっているか確認してみましょう。" },
      ZeroDivisionError: { title: "0で割り算をしています", guidance: "割る数が0になっていないか確認してみましょう。" },
      ValueError: { title: "値が処理できる形になっていません", guidance: "その行で渡している値を確認してみましょう。" },
    } as Readonly<Record<string, { title: string; titleNoName?: string; guidance: string }>>,
    notExecuted: "テストはまだ実行されていません",
    notJudged: "テスト結果を判定できませんでした",
    lineNote: "（{line}行目付近）",
    format: {
      empty: "出力がありませんでした。1行目にたどり着けた宝の数、2行目に訪れた順を出力してください。",
      nonNumeric: "出力の形が違います。1行目は宝の数（数字）、2行目は場所（アルファベット1文字）の並びにしてください。",
      length: "出力された場所の数が、たどり着ける場所の数と違います。たどり着ける場所をすべて、訪れた順に出力してください。",
    },
  },
  status: {
    loading: "Python実行環境を読み込み中です。", ready: "実行できます。", running: "テストを実行中です（{current}/{total}件目）",
    timeoutNotice: "各テストの実行は最大15秒です。タイムアウト後も残りのテストを続けます。",
    unavailable: "Python実行環境を読み込めませんでした。再読込して試してください。",
    editorLoading: "コードエディタを読み込み中です。",
  },
  controls: { run: "テストを実行する", reload: "実行環境を再読込" },
  result: {
    runsLabel: "テスト実行回数：{count}回", hintLabel: "ヒントレベル{level}：{count}回",
    title: "深さ優先マスター！",
    celebrationHeading: "ミッション達成！",
    celebrationText: "たどり着けた宝の数と、深さ優先で訪れた順を求めるプログラムが完成しました",
    finalButton: "単元の結果を見る",
    closing: "深さ優先探索のプログラムを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
