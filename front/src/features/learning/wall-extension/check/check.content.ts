import { validateAssessment } from "../../assessment/assessment";
import { mazeCellKey, validateMazeGridCanvas, type MazeGridCanvasState } from "../../player/mazeGrid.types";
import { getLearningStep } from "../../review/reviewContent";
import {
  wallExtensionDirections, wallExtensionExtensions, wallExtensionMainChoices, wallExtensionMainSize, wallExtensionPillars,
} from "../wallExtensionMaze";
import { wallExtensionExecutionContent } from "../execution/execution.content";
import type { WallExtensionCheckContent, WallExtensionCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3（連結2問）。場面はフェーズ2の `extend-2-4`
 * （4本目まで伸ばした状態）の盤面をステップIDで参照し、壁は複製しない。
 * 正解は組み立て済みトレースの5本目から導く（Q1=次に処理する柱、Q2=その伸長先）。
 */
const extensions = wallExtensionExtensions(wallExtensionMainSize, wallExtensionMainChoices);
const next = extensions[4];
const sceneStep = getLearningStep(wallExtensionExecutionContent, "extend-2-4");
const sceneWalls = new Set(sceneStep.canvas.state.walls);
const [pillarX, pillarY] = next.pillar.split(",").map(Number);
// Q2の回答対象は、処理する柱に隣接するマスのうち、まだ壁でないものだけ。
// 壁は柱の隣にしか伸びないので、変化が起きる範囲はこの隣接マスに限られる。
const targetCandidates = Object.values(wallExtensionDirections)
  .map((delta) => mazeCellKey(pillarX + delta.x, pillarY + delta.y))
  .filter((key) => !sceneWalls.has(key));

export const wallExtensionCheckContent: WallExtensionCheckContent = {
  version: 1, kind: "node-tap-check", id: "wall-extension-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-pillar", prompt: "次に処理する柱はどれですか", stepId: "extend-2-4",
      nodeIds: wallExtensionPillars(wallExtensionMainSize), allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.pillar }, requires: null,
      reviewStepIds: ["extend-2-4", "extend-4-4"], tags: ["pillar-order"], direction: null,
    },
    {
      id: "wall-target", prompt: "壁になるマスはどれですか", stepId: "extend-2-4",
      nodeIds: targetCandidates, allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.target },
      requires: { questionId: "next-pillar", answer: { kind: "node", nodeId: next.pillar } },
      reviewStepIds: ["extend-2-4", "extend-4-4"], tags: ["extension-target"], direction: next.direction,
    },
  ],
  completion: {
    stepId: "extend-4-4",
    caption: "次に処理する柱と、壁が伸びるマスを追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/**
 * 設問の場面。方向の指示がない設問（Q1）はフェーズ2のステップ canvas をそのまま返す。
 * 方向の指示がある設問（Q2）は同じ盤面（壁は同一）のまま、処理中の柱を前提設問の
 * 正解の柱へ移し、伸ばした直後を表す highlight を外した場面を返す。
 */
export function getWallExtensionCheckScene(question: WallExtensionCheckQuestion): MazeGridCanvasState {
  const step = getLearningStep(wallExtensionExecutionContent, question.stepId);
  const premise = question.requires?.answer;
  if (question.direction === null || !premise || premise.kind !== "node") return step.canvas;
  return {
    data: step.canvas.data,
    state: { ...step.canvas.state, processing: premise.nodeId, target: null },
    highlights: [],
  };
}

validateAssessment(wallExtensionCheckContent);
for (const question of wallExtensionCheckContent.questions) {
  getLearningStep(wallExtensionExecutionContent, question.stepId);
  question.reviewStepIds.forEach((id) => getLearningStep(wallExtensionExecutionContent, id));
  validateMazeGridCanvas(getWallExtensionCheckScene(question));
}
getLearningStep(wallExtensionExecutionContent, wallExtensionCheckContent.completion.stepId);
// 基準データ §3 の確定事項（5本目: 柱 (4,4) から右へ (5,4)）と教材の正解がずれたら落とす。
if (next.pillar !== "4,4" || next.direction !== "right" || next.target !== "5,4") {
  throw new Error("Wall-extension check answers must follow the verified trace");
}
