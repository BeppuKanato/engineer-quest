import { bfsImplementationContent, type ImplementationTest } from "../../bfs/implementation/implementation.content";
import { searchGraph, searchGraphAdjacency } from "../../../graphs/searchGraph";
import { implementationPlaceholderMarker, implementationPlaceholderStatement, type ImplementationInputLevel } from "../../../implementation/inputLevel";
import { dfsCode, type DfsCodeLineId } from "../code-mapping/dfsCode";
import { dfsConsolidationContent, transferGraph } from "../consolidation/consolidation.content";

const transferAdjacency = Object.fromEntries(transferGraph.nodes.map(({ id }) => [
  id, transferGraph.edges.flatMap(edge => edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : []),
]));
const basicOrder = ["A", "B", "D", "F", "E", "C"];
const functionName = "dfs_order";

export const freeDisplayCase = {
  id: "D1", label: "基本（動きの説明のグラフ）", visibility: "display", functionName,
  args: [searchGraphAdjacency, "A"], expected: basicOrder,
} satisfies ImplementationTest;

const placeholders = {
  "initialize-visited": "出発点を入れた発見済みの集合を用意する",
  "initialize-order": "訪問順を記録する空のリストを用意する",
  "initialize-stack": "出発点を入れたスタックを用意する",
  "pop-node": "スタックの末尾から場所を1つ取り出す",
  "append-order": "取り出した場所を訪問順に記録する",
  "mark-visited": "隣の場所を発見済みとして記録する",
  "append-stack": "隣の場所をスタックの末尾に追加する",
} satisfies Partial<Record<DfsCodeLineId, string>>;

function templateWithBlanks(ids: readonly (keyof typeof placeholders)[]) {
  const blanks = new Map<DfsCodeLineId, string>(ids.map(id => [id, placeholders[id]]));
  return dfsCode.lines.flatMap(line => {
    if (line.id === "define-function") return [line.text, "    # 「ここを書く」の行を、自分のコードに置き換えてください。"];
    const description = blanks.get(line.id);
    if (description === undefined) return [line.text];
    const indent = /^ */u.exec(line.text)?.[0] ?? "";
    return [`${indent}${implementationPlaceholderStatement}  # ${implementationPlaceholderMarker}：${description}`];
  }).join("\n");
}

const fullTemplate = [
  dfsCode.lines[0].text,
  "    # ここに、出発点から届く場所を訪れた順に返すコードを書く",
  "    pass",
].join("\n");

const templates: Readonly<Record<ImplementationInputLevel, string>> = {
  full: fullTemplate,
  skeleton: templateWithBlanks(["initialize-visited", "initialize-order", "initialize-stack", "pop-node", "append-order", "mark-visited", "append-stack"]),
  "fill-in": templateWithBlanks(["pop-node", "mark-visited", "append-stack"]),
};

const parsons = dfsConsolidationContent.questions.find(question => question.kind === "parsons");
if (!parsons) throw new Error("DFS Parsons question is required");

const skeletonLineIds = ["while-stack", "for-neighbor-reversed", "if-unvisited"] as const;

export const dfsImplementationContent = {
  id: "dfs-implementation",
  stageName: "自分で実装",
  caption: "出発点から届く場所を、深さ優先探索で訪れた順に返すコードを完成させ、実行して確かめましょう。",
  templates,
  tests: [
    freeDisplayCase,
    { id: "D2", label: "転移（応用問題のグラフ）", visibility: "display", functionName, args: [transferAdjacency, "G"], expected: ["G", "H", "J", "K", "I", "L"] },
    { id: "J1", label: "たどり着けない場所を含む", visibility: "judgement", functionName, args: [{ ...searchGraphAdjacency, Z: [] }, "A"], expected: basicOrder },
    { id: "J2", label: "出発点だけのグラフ", visibility: "judgement", functionName, args: [{ A: [] }, "A"], expected: ["A"] },
    { id: "J3", label: "隣の情報が未登録の場所を含む", visibility: "judgement", functionName, args: [{ A: ["B"] }, "A"], expected: ["A", "B"] },
  ] satisfies ImplementationTest[],
  displayScenes: [
    { testId: "D1", graph: searchGraph, start: "A" },
    { testId: "D2", graph: transferGraph, start: "G" },
  ],
  hints: {
    ...bfsImplementationContent.hints,
    variables: [
      { name: "visited", description: "発見済みの場所を記録し、二度追加するのを防ぐ集合" },
      { name: "order", description: "初めて訪れた順を記録し、結果として返すリスト" },
      { name: "stack", description: "これから調べる場所を末尾に入れ、末尾から取り出すリスト" },
    ],
    tokens: ["visited", "order", "stack", "graph", "start", "node", "neighbor", "set()", "append()", "pop()", "add()", "reversed()", "while", "for", "if", "not in", "return"],
    flow: [
      "発見済みの集合・訪問順のリスト・スタックを用意し、出発点を発見済みに記録してスタックに入れる",
      "スタックの末尾から場所を1つ取り出して、訪問順に記録する",
      "取り出した場所の隣を逆順に見て、未発見の場所を発見済みに記録してからスタックの末尾に入れる",
      "スタックが空になったら、訪問順を返す",
    ],
    skeletonLineIds,
    skeletonLines: skeletonLineIds.map(id => {
      const line = dfsCode.lines.find(candidate => candidate.id === id);
      if (!line) throw new Error("Missing DFS control line");
      return line;
    }),
    // 応用問題と同じコード契約。ヒントの練習では全行を動かせる（2026-11-09 決定）。
    parsonsQuestion: {
      ...parsons,
      fixedLineIds: undefined,
      lineIds: [
        "append-stack", "initialize-visited", "while-stack", "return-order", "pop-node", "define-function",
        "append-order", "if-unvisited", "initialize-stack", "mark-visited", "for-neighbor-reversed", "initialize-order",
      ] satisfies readonly DfsCodeLineId[],
      instruction: "行をドラッグするか、↑↓ボタンで動かして、処理の流れを確認します。",
    },
  },
  status: bfsImplementationContent.status,
  controls: bfsImplementationContent.controls,
  result: {
    ...bfsImplementationContent.result,
    title: "深さ優先探索（DFS）マスター！",
    closing: "深さ優先探索のコードを完成させ、基本ケースと境界ケースのすべてのテストを通過しました。",
  },
} as const;
