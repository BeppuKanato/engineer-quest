import type { ImplementationInputLevel } from "../../implementation/inputLevel";
import { bfsCode, type BfsCodeLineId } from "../code-mapping/bfsCode";
import { bfsConsolidationContent } from "../consolidation/consolidation.content";

/**
 * フェーズ7（自分で実装）の問題と判定データ（プログラム形式）。
 * 2026-11-25 の自由実装形（再設計仕様 docs/redesign-overview-2026-11.md）：
 * 学習者は関数ではなくプログラムを書く。入力は標準入力で与えられ、
 * 出発点から各場所までの距離（通る道の本数、たどり着けない場所は -1）を
 * 標準出力へ1行で出す。関数名・変数名・書き方は一切固定しない。
 * 旧・関数形は implementation-legacy に保存した。
 *
 * 入力の形式：
 *   1行目：出発点の場所（アルファベット大文字1文字）
 *   2行目以降：道でつながっている場所のペア「A B」（両方向にたどれる）
 * 出力：入力に登場するすべての場所について、アルファベット順に距離を並べる。
 */
export type ProgramTest = {
  readonly id: string;
  readonly label: string;
  readonly visibility: "display" | "judgement";
  readonly inputText: string;
  /** 出力の並びに対応する場所（アルファベット順）。 */
  readonly nodes: readonly string[];
  readonly expected: readonly number[];
};

type Graph = ReadonlyMap<string, readonly string[]>;

const buildGraph = (start: string, edges: readonly (readonly [string, string])[]): Graph => {
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

/** 期待値の正本：幅優先探索で出発点からの距離を求める（到達できない場所は -1）。 */
const referenceDistances = (graph: Graph, start: string): ReadonlyMap<string, number> => {
  const distances = new Map<string, number>([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const neighbor of graph.get(node) ?? []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, distances.get(node)! + 1);
        queue.push(neighbor);
      }
    }
  }
  return distances;
};

const testCase = (
  id: string,
  label: string,
  visibility: ProgramTest["visibility"],
  start: string,
  edges: readonly (readonly [string, string])[],
): ProgramTest => {
  const graph = buildGraph(start, edges);
  const nodes = [...graph.keys()].sort();
  const distances = referenceDistances(graph, start);
  return {
    id, label, visibility,
    inputText: [start, ...edges.map(([a, b]) => `${a} ${b}`)].join("\n"),
    nodes,
    expected: nodes.map(node => distances.get(node) ?? -1),
  };
};

const basicEdges = [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "E"], ["D", "F"], ["E", "F"]] as const;
const transferEdges = [["G", "H"], ["G", "I"], ["H", "J"], ["I", "J"], ["I", "K"], ["J", "L"], ["K", "L"]] as const;

const parsonsQuestion = bfsConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsonsQuestion || parsonsQuestion.kind !== "parsons") throw new Error("Phase 6 Parsons question is required");

const skeletonLineIds = ["while-queue", "for-neighbor", "if-undiscovered"] as const;

const codeLineText = (id: BfsCodeLineId): string => {
  const line = bfsCode.lines.find(line => line.id === id);
  if (!line) throw new Error("Missing canonical line");
  return line.text;
};
/** 正解コードは関数の中の行（インデント4つ分）なので、プログラムのトップレベル用に4つ外す。 */
const dedent = (text: string): string => text.replace(/^ {4}/u, "");
const placeholderLine = (id: BfsCodeLineId, description: string): string => {
  const indent = /^ */u.exec(dedent(codeLineText(id)))?.[0] ?? "";
  return `${indent}raise NotImplementedError  # ここを書く：${description}`;
};
const placeholderGuide = "# 「ここを書く」の行が、まだ書けていない場所です。その行を消して、自分のコードを書いてください。";

/** 入力の受け取り（用意する行）。出発点と、場所のつながり（両方向）を辞書にする。 */
const inputLines = [
  "import sys",
  "from collections import deque",
  "",
  "lines = [line.split() for line in sys.stdin.read().splitlines() if line.strip()]",
  "start = lines[0][0]",
  "graph = {}",
  "for a, b in lines[1:]:",
  "    graph.setdefault(a, []).append(b)",
  "    graph.setdefault(b, []).append(a)",
  "graph.setdefault(start, [])",
];
/** 出力（用意する行）。登場する場所をアルファベット順に、距離を並べる。 */
const outputLine = "print(*[distances.get(node, -1) for node in sorted(graph)])";

const bodyLine = (id: BfsCodeLineId): string => dedent(codeLineText(id));

/** 自由実装の初期コード。決まりは入出力の形式だけ。 */
const fullTemplate = "# ここを書く：入力を受け取り、出発点からの距離を出力するプログラムを書く\n# 入力の1行目は出発点、2行目以降は「場所 場所」のつながりです。\n";

/** 橋渡し（骨格）：入力の受け取り・出力と制御構造は用意し、本体の行をプレースホルダにする。 */
const skeletonTemplate = [
  ...inputLines,
  "",
  placeholderGuide,
  placeholderLine("initialize-distances", "出発点の距離が0の辞書を用意する"),
  placeholderLine("initialize-queue", "出発点を入れたキューを用意する"),
  bodyLine("while-queue"),
  placeholderLine("dequeue-node", "キューの先頭を取り出す"),
  bodyLine("for-neighbor"),
  bodyLine("if-undiscovered"),
  placeholderLine("assign-distance", "隣の距離を、今の距離＋1で記録する"),
  placeholderLine("enqueue-neighbor", "隣をキューの末尾に加える"),
  outputLine,
].join("\n");

/** 橋渡し（穴埋め）：要点の行（距離の記録と、キューへの追加）だけをプレースホルダにする。 */
const fillInTemplate = [
  ...inputLines,
  "",
  placeholderGuide,
  bodyLine("initialize-distances"),
  bodyLine("initialize-queue"),
  bodyLine("while-queue"),
  bodyLine("dequeue-node"),
  bodyLine("for-neighbor"),
  bodyLine("if-undiscovered"),
  placeholderLine("assign-distance", "隣の距離を、今の距離＋1で記録する"),
  placeholderLine("enqueue-neighbor", "隣をキューの末尾に加える"),
  outputLine,
].join("\n");

const levelTemplates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: skeletonTemplate,
  "fill-in": fillInTemplate,
};

/** お手本のプログラム（フェーズ6までの正解コードを、プログラムの形に組み直したもの）。 */
export const bfsExampleProgram = [
  ...inputLines,
  "",
  bodyLine("initialize-distances"),
  bodyLine("initialize-queue"),
  bodyLine("while-queue"),
  bodyLine("dequeue-node"),
  bodyLine("for-neighbor"),
  bodyLine("if-undiscovered"),
  bodyLine("assign-distance"),
  bodyLine("enqueue-neighbor"),
  outputLine,
].join("\n");

/**
 * 自動チェック。種を固定した乱数でグラフを作り（毎回同じケースになり、
 * 結果が再現できる）、期待値は参照実装で求める。到達できない場所を含む
 * グラフも自然に混ざる。
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
    cases.push(testCase(`A${index + 1}`, `自動チェック${index + 1}`, "judgement", "A", edges));
  }
  return cases;
})();

export const bfsAutoTests: readonly ProgramTest[] = autoTests;

export const bfsImplementationContent = {
  version: 2, id: "bfs-implementation", phase: 7,
  caption: "出発点から各場所までの最短距離を求めるプログラムを完成させて、ミッションを達成しましょう。",
  template: fullTemplate,
  templates: levelTemplates,
  /** 単元ミッション（ミッションバンド表示用）。文言は単元ミッションの登録と一致させる。 */
  mission: {
    title: "配送ロボットで荷物を最短経路で届ける",
    successCondition: "出発点から各場所までの最短距離を正しく求めたとき達成",
  },
  /** 問題文（仕様）。入口の画面ではなく、作業画面の「問題」タブに常駐させる。 */
  statement: {
    tabLabel: "問題",
    title: "出発点からの最短距離を求めるプログラム",
    lead: "倉庫には荷物の届け先が複数あり、場所同士が道でつながっています。出発点を受け取って、すべての場所までの最短距離（通る道の本数）を求めるプログラムを作りましょう。",
    inputLabel: "入力",
    inputFormat: "入力の1行目は出発点の場所です。2行目以降は、道でつながっている場所のペアが「A B」のように半角スペース区切りで並びます。ペアは両方向にたどれるものとします。",
    outputLabel: "出力",
    outputFormat: "入力に登場するすべての場所について、アルファベット順に、出発点からの距離を半角スペース区切りで1行に出力してください。たどり着けない場所は -1 と出力してください。",
    constraintsLabel: "条件",
    constraints: [
      "場所はアルファベットの大文字1文字で表されます。",
      "同じペアが重複して現れることはありません。",
      "書き方は自由です。関数を使っても、使わなくてもかまいません。",
    ],
    exampleInputLabel: "入力の例",
    exampleOutputLabel: "出力の例",
  },
  tests: [
    testCase("D1", "基本（動きの説明のつながり）", "display", "A", basicEdges),
    testCase("D2", "応用（別のつながり）", "display", "G", transferEdges),
    testCase("J1", "たどり着けない場所あり", "judgement", "A", [["A", "B"], ["C", "D"]]),
    testCase("J2", "場所が1つだけ", "judgement", "A", []),
    testCase("J3", "一直線のつながり", "judgement", "A", [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]]),
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
    autoCaptionPassed: "{total} 件すべて、期待どおりの距離になりました。",
    autoCaptionFailed: "{total} 件中 {passed} 件が期待どおりでした。たどり着けない場所のあるグラフや、場所の少ないグラフで確かめてみましょう。",
  },
  hints: {
    labels: ["ヒント1：使う部品を見る", "ヒント2：処理の流れを見る", "ヒント3：条件とループの骨格を見る", "ヒント4：並び替えで確認する"],
    descriptions: ["使える変数やコードの部品を確認する", "どのような順序で処理するかを確認する", "コードの構造を確認する", "コードを並べ替えながら復習する"],
    compactLabels: ["ヒント1", "ヒント2", "ヒント3", "ヒント4"],
    variables: [
      { name: "start", description: "出発点の場所" },
      { name: "graph", description: "場所のつながり（場所から、つながる場所のリストへの辞書）" },
      { name: "distances", description: "出発点からの距離（場所から距離への辞書）" },
      { name: "queue", description: "これから調べる場所のキュー（deque）" },
    ],
    tokens: ["input().split()", "sys.stdin.read()", "deque", "deque([start])", "queue.popleft()", "queue.append(neighbor)", "graph.get(node, [])", "distances[neighbor] = distances[node] + 1", "neighbor not in distances", "sorted(graph)", "print(*[distances.get(node, -1) for node in sorted(graph)])"],
    tokenInstruction: "トークンを選ぶと、カーソル位置に挿入します。",
    tokenGroupLabel: "使う部品のトークン",
    flow: [
      "出発点をキューに入れ、距離を0と記録する",
      "キューの先頭を取り出し、つながっている場所を調べる",
      "まだ距離の決まっていない場所は、今の距離＋1で記録してキューに入れる",
    ],
    loopLabel: "キューが空になるまでくり返し",
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = bfsCode.lines.find(line => line.id === id);
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
    expectedLabel: "期待する距離", actualLabel: "実際の距離", noOutput: "—",
    invalid: "数値のリストではありません", lengthMismatch: "数値の個数が期待と違います",
    different: "期待と違う場所：{count}個",
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
      empty: "出力がありませんでした。各場所までの距離を、半角スペース区切りで出力してください。",
      nonNumeric: "出力に、数値でないものが含まれています。数値だけを出力してください。",
      length: "出力された数値の個数が、入力に登場する場所の数と違います。すべての場所について距離を出力してください。",
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
    title: "最短経路マスター！",
    celebrationHeading: "ミッション達成！",
    celebrationText: "出発点からすべての場所までの最短距離を求めるプログラムが完成しました",
    finalButton: "単元の結果を見る",
    closing: "幅優先探索のプログラムを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。この単元の学習は完了です。",
  },
} as const;
