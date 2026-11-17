import { validateAssessment, type ChoiceQuestion, type DiagnosticAssessment, type NodeTapQuestion, type ParsonsQuestion } from "../../assessment/assessment";
import { searchGraph } from "../../graphs/searchGraph";
import type { GraphCanvasState } from "../../player/graphCanvas.types";
import { getLearningStep } from "../../review/reviewContent";
import { dfsCodeMappingContent } from "../code-mapping/codeMapping.content";
import { dfsCode } from "../code-mapping/dfsCode";

type Graph = GraphCanvasState["data"];
type Scene = { readonly graph: Graph; readonly start: string };
type QuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};
export type DfsConsolidationQuestion = QuestionDetails & (
  | (NodeTapQuestion & { readonly kind: "node"; readonly scene: Scene })
  | (ChoiceQuestion & { readonly scene: Scene })
  | ParsonsQuestion
);

export const transferGraph: Graph = {
  kind: "graph",
  nodes: searchGraph.nodes.map((node, index) => {
    const id = "GHIJKL"[index];
    return { ...node, id, label: id };
  }),
  edges: [
    { id: "gh", from: "G", to: "H" }, { id: "gi", from: "G", to: "I" },
    { id: "hj", from: "H", to: "J" }, { id: "hk", from: "H", to: "K" },
    { id: "il", from: "I", to: "L" },
  ],
  layers: [],
};

const isolatedGraph: Graph = {
  ...searchGraph,
  nodes: [...searchGraph.nodes, { id: "Z", label: "Z", x: 530, y: 330 }],
};

/** フェーズ7の判定用テストJ3と同じ形（Bの隣の情報が未登録）。図はAとBの辺だけを描く。 */
const missingAdjacencyGraph: Graph = {
  kind: "graph",
  nodes: searchGraph.nodes.filter(node => node.id === "A" || node.id === "B"),
  edges: searchGraph.edges.filter(edge => edge.id === "ab"),
  layers: [],
};

/** フェーズ7の判定用テストJ2と同じ形（出発点だけのグラフ）。 */
const startOnlyGraph: Graph = {
  kind: "graph",
  nodes: searchGraph.nodes.filter(node => node.id === "A"),
  edges: [],
  layers: [],
};

const canonicalLineIds = dfsCode.lines.map(line => line.id);
const [firstFrame, ...remainingFrames] = dfsCodeMappingContent.steps;

export const dfsConsolidationContent: Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly stageName: string;
  readonly code: typeof dfsCode;
  readonly reviewLabel: string;
  readonly questions: readonly [DfsConsolidationQuestion, ...DfsConsolidationQuestion[]];
} = {
  version: 1, kind: "diagnostic-check", id: "dfs-consolidation", phase: 6, stageName: "応用問題", code: dfsCode,
  reviewLabel: "基本例の動き・コードをもう一度見る",
  // 7問。前提のカバーと「自力で流れからコードを組み立てる力があると判断するに足るか」で
  // 問題数を決める基準（2026-11-17）に沿い、フェーズ7の判定用テストが前提とする境界2件
  // （隣の情報が未登録の場所 J3、出発点だけのグラフ J2）を Parsons の前に追加した。
  // 隣を逆順に見る効果は問1・問2の追跡の中で使われるが単独では聞いていない（△）。
  // 行の内容を書く力と、Parsons 固定行（define-function / while-stack / return-order）を
  // 自分で書くことは、フェーズ6の形式では確認せず判断事項として残す。
  questions: [
    {
      kind: "node", id: "last-from-f", prompt: "出発点をFに変えると、最後に訪れるのはどれ？",
      scene: { graph: searchGraph, start: "F" }, nodeIds: searchGraph.nodes.map(node => node.id), allowNone: false,
      correctAnswer: { kind: "node", nodeId: "E" }, requires: null,
      stepId: "for-a-c", reviewStepIds: ["for-a-c", "if-a-c", "mark-a-c", "execution-push-c-from-a", "for-a-b", "if-a-b", "mark-a-b", "execution-push-b-from-a", "for-end-a", "while-b", "pop-node-b"],
      tags: ["処理順序の追跡"],
      instruction: "図のノードをタップして答える",
      correctFeedback: "正解。FからはF→D→B→A→C→Eの順に訪れ、最後はEになります。",
      incorrectFeedback: "不正解。隣を逆順でスタックに入れて、最後に入れた場所から取り出す規則を確かめてみましょう。",
    },
    {
      kind: "choice", id: "stack-after-j-k", prompt: "JとKを取り出して調べ終えた直後、スタックに入っているのはどれ？",
      scene: { graph: transferGraph, start: "G" },
      choices: [{ id: "i-only", text: "I のみ" }, { id: "i-h", text: "I → H" }, { id: "h-only", text: "H のみ" }],
      correctAnswer: { kind: "choice", choiceId: "i-only" }, requires: null,
      stepId: "execution-dead-end-f", reviewStepIds: ["execution-dead-end-f", "while-e", "pop-node-e", "execution-pop-e"],
      tags: ["スタックの状態の追跡"],
      instruction: "スタックの状態を1つ選ぶ",
      correctFeedback: "正解。H・J・Kはすでに取り出して調べ終えたので、スタックに残っているのはIだけです。",
      incorrectFeedback: "不正解。取り出した場所はスタックから外れ、行き止まりでは新しい場所が加わらないことを確かめてみましょう。",
    },
    {
      kind: "choice", id: "unreachable-z", prompt: "出発点Aからつながっていない場所Zは、結果（訪問順）にどうなりますか？",
      scene: { graph: isolatedGraph, start: "A" },
      choices: [{ id: "absent", text: "結果に入らない" }, { id: "last", text: "結果の最後に入る" }, { id: "first", text: "結果の先頭に入る" }],
      correctAnswer: { kind: "choice", choiceId: "absent" }, requires: null,
      stepId: "for-a-c", reviewStepIds: ["for-a-c", "if-a-c", "mark-a-c", "execution-push-c-from-a"],
      tags: ["たどり着けない場所の扱い"],
      instruction: "結果の扱いを1つ選ぶ",
      correctFeedback: "正解。たどり着けないZは訪れることがなく、訪問順にも入りません。",
      incorrectFeedback: "不正解。スタックに追加する候補は、今調べている場所の隣から選ぶことを確かめてみましょう。",
    },
    {
      kind: "choice", id: "start-already-discovered", prompt: "Bの隣を調べている途中で、出発点Aが隣として見つかったとき、どうなりますか？",
      scene: { graph: searchGraph, start: "A" },
      choices: [
        { id: "skip", text: "すでに発見済みとして記録されているので、もう一度は訪れない" },
        { id: "record-again", text: "訪問順にもう一度追加される" },
        { id: "push-again", text: "スタックにもう一度追加される" },
      ],
      correctAnswer: { kind: "choice", choiceId: "skip" }, requires: null,
      stepId: "execution-skip-a-from-b", reviewStepIds: ["for-b-a", "execution-skip-a-from-b"],
      tags: ["発見済みの場所の扱い"],
      instruction: "出発点Aの扱いを1つ選ぶ",
      correctFeedback: "正解。Aは出発点として最初に発見済みに記録されているため、スタックにも訪問順にも、もう一度は追加されません。",
      incorrectFeedback: "不正解。すでに発見済みに記録された場所を、条件判定でどう扱うか確かめてみましょう。",
    },
    {
      kind: "choice", id: "missing-adjacency-b", prompt: "Bの隣の情報が graph に登録されていないとします。Bがスタックから取り出されたとき、「for neighbor in reversed(graph.get(node, [])):」の行はどう動きますか？",
      scene: { graph: missingAdjacencyGraph, start: "A" },
      choices: [{ id: "error", text: "エラーになって止まる" }, { id: "treat-as-empty", text: "隣がないものとして扱い、そのまま次へ進む" }, { id: "removed", text: "Bが訪問順から消える" }],
      correctAnswer: { kind: "choice", choiceId: "treat-as-empty" }, requires: null,
      stepId: "for-b-e", reviewStepIds: ["execution-pop-b", "for-b-e"],
      tags: ["隣の情報がない場所の扱い"],
      instruction: "行の動きを1つ選ぶ",
      correctFeedback: "正解。隣の情報が登録されていない場所では空のリストが返るため、エラーにならず、そのまま次へ進みます。",
      incorrectFeedback: "不正解。隣の情報が登録されていない場所を、graph.get(node, []) がどう扱うか確かめてみましょう。",
    },
    {
      kind: "choice", id: "start-only-result", prompt: "出発点Aだけで、隣が1つもないグラフでは、結果（訪問順）はどうなりますか？",
      scene: { graph: startOnlyGraph, start: "A" },
      choices: [{ id: "only-start", text: "Aだけが入る" }, { id: "empty", text: "空のリストになる" }, { id: "never-ends", text: "スタックが空にならず、終わらない" }],
      correctAnswer: { kind: "choice", choiceId: "only-start" }, requires: null,
      stepId: "return-order", reviewStepIds: ["initialize-visited", "execution-finish-all", "return-order"],
      tags: ["出発点だけのグラフの扱い"],
      instruction: "結果の扱いを1つ選ぶ",
      correctFeedback: "正解。出発点Aだけが訪問順に入り、スタックが空になって処理が終わります。",
      incorrectFeedback: "不正解。出発点は最初にスタックへ入ることと、スタックが空になったら終わることを確かめてみましょう。",
    },
    {
      kind: "parsons", id: "whole-code-order", prompt: "深さ優先探索のコードを、実行の流れに合う順序に並べてください。",
      lineIds: [
        "define-function", "initialize-stack", "initialize-visited", "initialize-order", "while-stack",
        "append-stack", "append-order", "if-unvisited", "pop-node", "mark-visited", "for-neighbor-reversed", "return-order",
      ],
      correctAnswer: { kind: "order", lineIds: canonicalLineIds }, requires: null,
      interchangeableLineGroups: [["initialize-visited", "initialize-order", "initialize-stack"]],
      fixedLineIds: ["define-function", "while-stack", "return-order"],
      stepId: firstFrame.id, reviewStepIds: [firstFrame.id, ...remainingFrames.map(frame => frame.id)],
      tags: ["コード全体の流れ"],
      instruction: "鍵の付いた行は固定です。残りの行を固定行で区切られた範囲ごとに、ドラッグか↑↓ボタンで並び替えます。",
      correctFeedback: "正解。取り出しから訪問順の記録、未発見の隣の追加までを組み立てられました。",
      incorrectFeedback: "不正解。スタックから取り出した後、どの順で訪問順を記録し、未発見の隣を追加するか見直してみましょう。",
    },
  ],
};

validateAssessment(dfsConsolidationContent);
for (const question of dfsConsolidationContent.questions) {
  getLearningStep(dfsCodeMappingContent, question.stepId);
  question.reviewStepIds.forEach(id => getLearningStep(dfsCodeMappingContent, id));
}
