import { validateAssessment, type DiagnosticAssessment, type NodeTapQuestion, type ChoiceQuestion, type ParsonsQuestion } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { bfsGraph } from "../bfsGraph";
import { bfsCode } from "../code-mapping/bfsCode";
import { bfsCodeMappingContent } from "../code-mapping/codeMapping.content";
import { isolatedGraph, transferGraph, type ConsolidationGraph } from "./consolidation.graphs";

type Scene = { readonly graph: ConsolidationGraph; readonly start: string };
type QuestionDetails = {
  readonly instruction: string;
  readonly correctFeedback: string;
  readonly incorrectFeedback: string;
};
export type ConsolidationQuestion =
  | (NodeTapQuestion & QuestionDetails & { readonly kind: "node"; readonly scene: Scene })
  | (ChoiceQuestion & QuestionDetails & { readonly scene: Scene })
  | (ParsonsQuestion & QuestionDetails);
export type ConsolidationContent = Omit<DiagnosticAssessment, "questions"> & {
  readonly phase: 6;
  readonly code: typeof bfsCode;
  readonly questions: readonly [ConsolidationQuestion, ...ConsolidationQuestion[]];
  readonly reviewLabel: string;
  readonly completion: string;
};
const [firstFrame, ...remainingFrames] = bfsCodeMappingContent.steps;
export const bfsConsolidationContent: ConsolidationContent = {
  version: 1, kind: "diagnostic-check", id: "bfs-consolidation", phase: 6, code: bfsCode,
  reviewLabel: "💡 基本例の動き・コード（フェーズ4）を見る",
  completion: "理解の状況が確認できました。それでは【フェーズ7：自力実装】に進み、自分の手でコードを完成させましょう！",
  questions: [
    {
      kind: "node", id: "last-from-f", prompt: "出発点をFに変えると、最後に取り出されるのはどれ？",
      scene: { graph: bfsGraph, start: "F" }, nodeIds: bfsGraph.nodes.map(node => node.id), allowNone: false,
      correctAnswer: { kind: "node", nodeId: "A" }, requires: null,
      stepId: "execution-dequeue-c", reviewStepIds: ["while-c", "execution-dequeue-c"], tags: ["処理順序の追跡"],
      instruction: "図のノードをタップして答える",
      correctFeedback: "正解。Fから距離の近い順に取り出すと、最後はAになります。",
      incorrectFeedback: "不正解。キューの先頭から、距離の近い順に取り出す規則を確かめてみましょう。",
    },
    {
      kind: "choice", id: "queue-after-j", prompt: "Jの隣を調べ終えた直後、キューに入っているのはどれ？",
      scene: { graph: transferGraph, start: "G" },
      choices: [{ id: "k-l", text: "K → L" }, { id: "l-k", text: "L → K" }, { id: "k-only", text: "K のみ" }],
      correctAnswer: { kind: "choice", choiceId: "k-l" }, requires: null,
      stepId: "execution-discover-f", reviewStepIds: ["assign-d-f", "execution-discover-f"], tags: ["キューの状態の追跡"],
      instruction: "キューの状態を1つ選ぶ",
      correctFeedback: "正解。Jの隣のLは、先に入っていたKの後ろに追加されます。",
      incorrectFeedback: "不正解。取り出すのは先頭、新しく追加するのは末尾、という順序を確かめてみましょう。",
    },
    {
      kind: "choice", id: "unreachable-z", prompt: "出発点Aからつながっていない場所Zは、結果（distances）にどうなりますか？",
      scene: { graph: isolatedGraph, start: "A" },
      choices: [{ id: "absent", text: "距離は決まらず、結果にも入らない" }, { id: "zero", text: "距離0として入る" }, { id: "largest", text: "いちばん大きな距離として入る" }],
      correctAnswer: { kind: "choice", choiceId: "absent" }, requires: null,
      stepId: "return-distances", reviewStepIds: ["while-empty", "return-distances"], tags: ["たどり着けない場所の扱い"],
      instruction: "結果の扱いを1つ選ぶ",
      correctFeedback: "正解。たどり着けないZはキューに入らず、距離辞書にも記録されません。",
      incorrectFeedback: "不正解。出発点からたどれない場所が、一度でもキューに入るかを考えてみましょう。",
    },
    {
      kind: "choice", id: "start-already-discovered", prompt: "隣の場所を調べている途中で、出発点Aが隣として見つかったとき、Aの距離はどうなりますか？",
      scene: { graph: bfsGraph, start: "A" },
      choices: [{ id: "unchanged", text: "0のまま。すでに決まっているので、追加も更新もされない" }, { id: "update", text: "見つけた場所の距離に1を足した値に更新される" }, { id: "requeue", text: "キューにもう一度入る" }],
      correctAnswer: { kind: "choice", choiceId: "unchanged" }, requires: null,
      stepId: "if-b-a", reviewStepIds: ["for-b-a", "if-b-a"], tags: ["距離が決まった場所の扱い"],
      instruction: "距離の扱いを1つ選ぶ",
      correctFeedback: "正解。Aの距離はすでに0と記録されているため、追加も更新もしません。",
      incorrectFeedback: "不正解。distancesにすでに記録された場所を、条件判定でどう扱うか確かめてみましょう。",
    },
    {
      kind: "parsons", id: "whole-code-order", prompt: "幅優先探索のコードを、実行の流れに合う順序に並べてください。",
      lineIds: ["enqueue-neighbor", "initialize-distances", "while-queue", "return-distances", "dequeue-node", "import-deque", "assign-distance", "define-function", "if-undiscovered", "initialize-queue", "for-neighbor"],
      correctAnswer: { kind: "order", lineIds: bfsCode.lines.map(line => line.id) }, requires: null,
      stepId: firstFrame.id, reviewStepIds: [firstFrame.id, ...remainingFrames.map(frame => frame.id)], tags: ["コード全体の流れ"],
      instruction: "行をタップした順に並べる。並べた行をタップすると戻せます。",
      correctFeedback: "正解。初期化から探索、結果を返すまでのコードの流れを組み立てられました。",
      incorrectFeedback: "不正解。初期化、取り出し、未発見判定、距離代入と追加、結果を返す流れを確かめてみましょう。",
    },
  ],
};

export function validateConsolidation(content: ConsolidationContent): void {
  validateAssessment(content);
  if (content.phase !== 6 || content.questions.length !== 5 || content.code !== bfsCode) throw new Error("Use five questions and the canonical code");
  for (const question of content.questions) {
    getLearningStep(bfsCodeMappingContent, question.stepId);
    question.reviewStepIds.forEach(id => getLearningStep(bfsCodeMappingContent, id));
    if (question.kind === "parsons") {
      const ids: readonly string[] = bfsCode.lines.map(line => line.id);
      if (question.lineIds.length !== ids.length || question.lineIds.some(id => !ids.includes(id)) ||
        question.correctAnswer.lineIds.some((id, index) => id !== ids[index])) throw new Error("Parsons must use all canonical lines");
    } else {
      const { graph, start } = question.scene;
      const ids = new Set(graph.nodes.map(node => node.id));
      if (ids.size !== graph.nodes.length || !ids.has(start) || graph.nodes.some(node => !Number.isFinite(node.x) || !Number.isFinite(node.y)) ||
        graph.edges.some(edge => !ids.has(edge.from) || !ids.has(edge.to)) || new Set(graph.edges.map(edge => edge.id)).size !== graph.edges.length) throw new Error("Invalid question graph");
      if (question.kind === "node" && (question.nodeIds.length !== ids.size || question.nodeIds.some(id => !ids.has(id)))) throw new Error("Node answers must match the graph");
    }
  }
}
validateConsolidation(bfsConsolidationContent);
