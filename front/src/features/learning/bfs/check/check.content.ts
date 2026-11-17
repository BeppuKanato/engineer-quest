import { validateAssessment, type ConceptCheckAssessment } from "../../assessment/assessment";
import { getLearningStep } from "../../review/reviewContent";
import { searchGraphNodes } from "../../graphs/searchGraph";
import { bfsExecutionContent } from "../execution/execution.content";

const nodeIds = searchGraphNodes.map(node => node.id);

/**
 * 4サイクル7問。前提のカバーで問題数を決める基準（2026-11-17）に沿い、
 * 取り出す順序・末尾追加・距離（+1）・記録済みの回避・終了条件を一通り確認する。
 * 距離は歩数を直接聞く選択問題（choice）で、タップ問題と concept-check として混在させる。
 */
export const bfsCheckContent: ConceptCheckAssessment & { readonly phase: 3; readonly completion: { readonly stepId: string; readonly caption: string } } = {
  version: 1, kind: "concept-check", id: "bfs-check", phase: 3,
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
    {
      kind: "choice", id: "distance-b", prompt: "Bは、Aから何歩先？", stepId: "discover-b",
      choices: [{ id: "zero", text: "0" }, { id: "one", text: "1" }, { id: "two", text: "2" }],
      correctAnswer: { kind: "choice", choiceId: "one" }, requires: null,
      reviewStepIds: ["dequeue-a", "discover-b"], tags: ["distance-steps"],
    },
    {
      kind: "choice", id: "distance-f", prompt: "Fは、Aから何歩先？", stepId: "discover-f",
      choices: [{ id: "two", text: "2" }, { id: "three", text: "3" }, { id: "four", text: "4" }],
      correctAnswer: { kind: "choice", choiceId: "three" }, requires: null,
      reviewStepIds: ["dequeue-d", "discover-f"], tags: ["distance-steps"],
    },
    {
      id: "enqueue-next", prompt: "Bを調べていて、Dの次にキューの末尾へ入るのはどれ？", stepId: "discover-d", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "E" }, requires: null,
      reviewStepIds: ["discover-d", "discover-e"], tags: ["enqueue-order"],
    },
    {
      id: "after-e", prompt: "Eを取り出して調べたあと、キューに新しく入るのはどれ？", stepId: "dequeue-e", nodeIds, allowNone: true,
      correctAnswer: { kind: "none" }, requires: { questionId: "enqueue-next", answer: { kind: "node", nodeId: "E" } },
      // 記録済みの隣を飛ばす場面（skip-b-from-e）を、直前の同一状態から再生する。
      reviewStepIds: ["dequeue-e", "skip-b-from-e"], tags: ["skip-recorded"],
    },
    {
      id: "queue-empty", prompt: "このあとキューが空になるのは、どの場所を調べ終えたとき？", stepId: "complete-e", nodeIds, allowNone: false,
      correctAnswer: { kind: "node", nodeId: "F" }, requires: null,
      reviewStepIds: ["complete-e", "dequeue-f", "complete-all"], tags: ["queue-empty"],
    },
  ],
  completion: { stepId: "skip-e", caption: "取り出す順序と重ねて追加しない判断に加えて、距離の決まり方も追えたので、次は、図の動きとコードの対応を確かめます。" },
};

validateAssessment(bfsCheckContent);
for (const question of bfsCheckContent.questions) {
  getLearningStep(bfsExecutionContent, question.stepId);
  question.reviewStepIds.forEach(id => getLearningStep(bfsExecutionContent, id));
}
getLearningStep(bfsExecutionContent, bfsCheckContent.completion.stepId);
