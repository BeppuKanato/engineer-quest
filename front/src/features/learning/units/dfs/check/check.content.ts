import { validateAssessment, type NodeTapAssessment, type NodeTapQuestion } from "../../../assessment/assessment";
import { searchGraphNodes } from "../../../graphs/searchGraph";
import { getLearningStep } from "../../../review/reviewContent";
import { dfsExecutionContent } from "../execution/execution.content";

type DfsCheckQuestion = NodeTapQuestion & { readonly correctFeedback: string };
type DfsCheckContent = Omit<NodeTapAssessment, "questions"> & {
  readonly phase: 3;
  readonly stageName: "動きの確認問題";
  readonly questions: readonly [DfsCheckQuestion, DfsCheckQuestion];
  readonly completion: { readonly stepId: string };
};
const nodeIds = searchGraphNodes.map(node => node.id);

/** 基準書§4。図は§2の元ステップをIDで参照し、座標・状態を複製しない。 */
export const dfsCheckContent: DfsCheckContent = {
  version: 1, kind: "node-tap-check", id: "dfs-check", phase: 3, stageName: "動きの確認問題",
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
  ],
  completion: { stepId: "pop-e" },
};

validateAssessment(dfsCheckContent);
for (const question of dfsCheckContent.questions) {
  const step = getLearningStep(dfsExecutionContent, question.stepId);
  if (question.nodeIds.some(id => !step.canvas.data.graph.nodes.some(node => node.id === id))) throw new Error("Unknown DFS answer node");
  question.reviewStepIds.forEach(id => getLearningStep(dfsExecutionContent, id));
}
getLearningStep(dfsExecutionContent, dfsCheckContent.completion.stepId);
