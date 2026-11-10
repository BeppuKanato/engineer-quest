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

const transferGraph: Graph = {
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
