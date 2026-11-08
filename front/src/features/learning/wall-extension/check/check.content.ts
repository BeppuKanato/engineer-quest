import { validateAssessment } from "../../assessment/assessment";
import { mazeCellKey, validateMazeGridCanvas, type MazeGridCanvasState } from "../../player/mazeGrid.types";
import { getLearningStep } from "../../review/reviewContent";
import {
  wallExtensionDirections, wallExtensionExtensions, wallExtensionMainChoices, wallExtensionMainSize, wallExtensionPillars,
  type WallExtensionDirection,
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
// 状況キャプション（Issue #297）。場面ステップの processing は伸ばし終えた
// 柱（4本目）を指し、Q2 の場面では処理予定の柱へ移るため、青い柱の時制が
// 設問間で反転する。Q1 は直前の伸長を完了形で、Q2 は前提の次の処理を
// 未来形で示す。柱の位置表現はフェーズ2キャプションの言い方（段＋左右）に
// 合わせ、座標から機械的に導く。
const previous = extensions.find((extension) => extension.pillar === sceneStep.canvas.state.processing);
const directionLabels: Record<WallExtensionDirection, string> = { up: "上", down: "下", left: "左", right: "右" };
const pillarKeys = wallExtensionPillars(wallExtensionMainSize);
const pillarXs = [...new Set(pillarKeys.map((key) => Number(key.split(",")[0])))].sort((a, b) => a - b);
const pillarYs = [...new Set(pillarKeys.map((key) => Number(key.split(",")[1])))].sort((a, b) => a - b);
const pillarPlace = (key: string) => {
  const [x, y] = key.split(",").map(Number);
  const row = pillarYs.indexOf(y), column = pillarXs.indexOf(x);
  const rowLabel = row === 0 ? "一番上の段" : row === pillarYs.length - 1 ? "一番下の段" : "真ん中の段";
  const columnLabel = column === 0 ? "左" : column === pillarXs.length - 1 ? "右" : "真ん中";
  return `${rowLabel}の${columnLabel}の柱`;
};
const pastSituation = previous ? `${pillarPlace(previous.pillar)}から、${directionLabels[previous.direction]}へ壁を伸ばしました。` : "";
const nextSituation = `次は、${pillarPlace(next.pillar)}から壁を伸ばします。`;
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
      id: "next-pillar", prompt: "次に処理する柱はどれですか", situation: pastSituation, stepId: "extend-2-4",
      nodeIds: wallExtensionPillars(wallExtensionMainSize), allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.pillar }, requires: null,
      reviewStepIds: ["extend-2-4", "extend-4-4"], tags: ["pillar-order"], direction: null,
    },
    {
      id: "wall-target", prompt: "壁になるマスはどれですか", situation: nextSituation, stepId: "extend-2-4",
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
// 状況キャプションは4本目（柱 (2,4) から下へ (2,5)）と5本目から導くため、併せて照合する。
if (next.pillar !== "4,4" || next.direction !== "right" || next.target !== "5,4" ||
  !previous || previous.pillar !== "2,4" || previous.direction !== "down" || previous.target !== "2,5" ||
  pastSituation !== "真ん中の段の左の柱から、下へ壁を伸ばしました。" ||
  nextSituation !== "次は、真ん中の段の真ん中の柱から壁を伸ばします。") {
  throw new Error("Wall-extension check answers must follow the verified trace");
}
