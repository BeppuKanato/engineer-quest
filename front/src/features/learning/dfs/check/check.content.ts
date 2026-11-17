import { validateAssessment, type ChoiceQuestion, type ConceptCheckAssessment, type NodeTapQuestion } from "../../assessment/assessment";
import { searchGraphNodes } from "../../graphs/searchGraph";
import { getLearningStep } from "../../review/reviewContent";
import { dfsExecutionContent } from "../execution/execution.content";

type DfsCheckNodeQuestion = NodeTapQuestion & { readonly correctFeedback: string };
type DfsCheckChoiceQuestion = ChoiceQuestion & { readonly correctFeedback: string };
type DfsCheckQuestion = DfsCheckNodeQuestion | DfsCheckChoiceQuestion;
type DfsCheckContent = Omit<ConceptCheckAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [DfsCheckQuestion, ...DfsCheckQuestion[]];
  readonly completion: { readonly stepId: string };
};
const nodeIds = searchGraphNodes.map(node => node.id);

/**
 * 基準書§4。図は§2の元ステップをIDで参照し、座標・状態を複製しない。
 * 4サイクル8問。前提のカバーと「流れを理解できていると判断するに足るか」で問題数を決める
 * 基準（2026-11-17）に沿い、取り出す側に加えて「何が積まれるか（追加と追加しない判断）」と
 * 訪問順・終了まで確認する。訪問順は数値の選択肢（choice）で聞き、タップ問題と混在させる。
 * 発見済みの印を入れる時点で付ける仕組み（mark-at-push）はフェーズ2に提示がないため、
 * 問題はその仕組み自体には依存させない（教材側の判断事項）。
 */
export const dfsCheckContent: DfsCheckContent = {
  version: 1, kind: "concept-check", id: "dfs-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "take-next", prompt: "次に取り出すのは、どれ？", stepId: "skip-b-from-d", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "F" }, requires: null,
      reviewStepIds: ["skip-b-from-d", "pop-f"], tags: ["next-pop"],
      correctFeedback: "正解。スタックの末尾にあるFを取り出します。",
    },
    {
      id: "after-f", prompt: "Fを調べ終えたあと、次に取り出すのは、どれ？", stepId: "dead-end-f", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "E" }, requires: { questionId: "take-next", answer: { kind: "node", nodeId: "F" } },
      reviewStepIds: ["dead-end-f", "pop-e"], tags: ["after-dead-end"],
      correctFeedback: "正解。Fからは新しく入る場所がないので、スタックに残っていたEを取り出します。",
    },
    {
      id: "push-next-from-a", prompt: "このあと、Aの隣でもう1つスタックに入るのはどれ？", stepId: "push-c-from-a", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "B" }, requires: null,
      reviewStepIds: ["push-c-from-a", "push-b-from-a"], tags: ["push-order"],
      correctFeedback: "正解。Aの隣は、Cのあとにもう1つの隣Bが末尾へ入ります。",
    },
    {
      id: "take-after-push", prompt: "次に取り出すのは、どれ？", stepId: "push-b-from-a", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "B" }, requires: { questionId: "push-next-from-a", answer: { kind: "node", nodeId: "B" } },
      reviewStepIds: ["push-b-from-a", "pop-b"], tags: ["push-order"],
      correctFeedback: "正解。最後に末尾へ入ったBが、Cより先に取り出されます。",
    },
    {
      kind: "choice", id: "visit-order-f", prompt: "次に調べるFは、何番目に調べる場所になる？", stepId: "pop-d",
      choices: [{ id: "three", text: "3" }, { id: "four", text: "4" }, { id: "five", text: "5" }],
      correctAnswer: { kind: "choice", choiceId: "four" }, requires: null,
      reviewStepIds: ["pop-d", "pop-f"], tags: ["visit-order"],
      correctFeedback: "正解。A、B、Dをすでに調べているので、次に調べるFは4番目になります。",
    },
    {
      id: "add-after-f", prompt: "Fを取り出して調べたあと、スタックに新しく入るのはどれ？", stepId: "pop-f", nodeIds, allowNone: true,
      correctAnswer: { kind: "none" }, requires: null,
      reviewStepIds: ["pop-f", "dead-end-f"], tags: ["no-add"],
      correctFeedback: "正解。Fの隣のDは調べ終えていて、Eはすでにスタックにあるので、新しく入る場所はありません。",
    },
    {
      id: "add-after-e", prompt: "Eを取り出して調べたあと、スタックに新しく入るのはどれ？", stepId: "pop-e", nodeIds, allowNone: true,
      correctAnswer: { kind: "none" }, requires: null,
      reviewStepIds: ["pop-e", "no-add-from-e"], tags: ["no-add"],
      correctFeedback: "正解。Eの隣はどれも調べ終えているかスタックにあるので、新しく入る場所はありません。",
    },
    {
      id: "stack-empty", prompt: "このあとスタックが空になるのは、どの場所を取り出したとき？", stepId: "no-add-from-e", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "C" }, requires: { questionId: "add-after-e", answer: { kind: "none" } },
      reviewStepIds: ["no-add-from-e", "pop-c", "finish-all"], tags: ["stack-empty"],
      correctFeedback: "正解。最後に残ったCを取り出すと、スタックが空になります。",
    },
  ],
  completion: { stepId: "finish-all" },
};

validateAssessment(dfsCheckContent);
for (const question of dfsCheckContent.questions) {
  const step = getLearningStep(dfsExecutionContent, question.stepId);
  if ("nodeIds" in question && question.nodeIds.some(id => !step.canvas.data.graph.nodes.some(node => node.id === id))) throw new Error("Unknown DFS answer node");
  question.reviewStepIds.forEach(id => getLearningStep(dfsExecutionContent, id));
}
getLearningStep(dfsExecutionContent, dfsCheckContent.completion.stepId);
