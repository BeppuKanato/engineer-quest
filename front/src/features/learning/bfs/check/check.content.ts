import { validateAssessment, type NodeTapAssessment } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { searchGraphNodes } from "../../graphs/searchGraph";
import { bfsExecutionContent } from "../execution/execution.content";

const nodeIds = searchGraphNodes.map(node => node.id);

export const bfsCheckContent: NodeTapAssessment & { readonly phase: 3; readonly completion: { readonly stepId: string; readonly caption: string } } = {
  version: 1, kind: "node-tap-check", id: "bfs-check", phase: 3,
  questions: [
    {
      id: "take-next", prompt: "キューから次に取り出すのは、どれ？", stepId: "complete-b", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "C" }, requires: null,
      reviewStepIds: ["complete-b", "dequeue-c"], tags: ["dequeue-order"],
    },
    {
      id: "after-c", prompt: "Cを取り出して調べたあと、キューに新しく入るのはどれ？", stepId: "dequeue-c", nodeIds, allowNone: true,
      correctAnswer: { kind: "none" }, requires: { questionId: "take-next", answer: { kind: "node", nodeId: "C" } },
      // skip-e の変化を再生できるよう、直前の同一状態から始める（既存ステップへの参照のみ）。
      reviewStepIds: ["dequeue-c", "skip-e"], tags: ["avoid-duplicate"],
    },
  ],
  completion: { stepId: "skip-e", caption: "取り出す順序と重ねて追加しない判断を追えたので、次は、図の動きとコードの対応を確かめます。" },
};

validateAssessment(bfsCheckContent);
for (const question of bfsCheckContent.questions) {
  getLearningStep(bfsExecutionContent, question.stepId);
  question.reviewStepIds.forEach(id => getLearningStep(bfsExecutionContent, id));
}
getLearningStep(bfsExecutionContent, bfsCheckContent.completion.stepId);
