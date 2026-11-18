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
 * 基準データ §3 フェーズ3。2026-11-17 の判断基準（問題数ではなく「アルゴリズムの
 * 流れを理解できていると判断するに足るか」）で監査し、連結2問から8問へ拡充した。
 * フェーズ4が前提とする流れの理解は次の7件で、既存2問は柱の処理順と伸長先
 * （5本目の場面だけ）をカバーしていた。
 * - 柱は2マスおきに立つ（新問 next-pillar-place、柱立ての場面）
 * - 柱の処理順は左上から右下（既存 next-pillar に加え、後半の場面でも確認する）
 * - 伸長先は柱の隣のマス（既存 wall-target に加え、後半の場面でも確認する）
 * - 許される方向の規則：一番上の段は4方向、それ以外は上を除く3方向
 *   （新問 allowed-directions-lower / allowed-directions-top。既存の設問は
 *   方向を提示してしまうため、この規則は未確認だった。フェーズ4の
 *   if-first-row の分岐全体がこの理解の上に立つ）
 * - すべての柱を処理し終えたら完成（新問 maze-completion）
 * 場面はフェーズ2のステップをステップIDで参照し、壁は複製しない。
 * 正解はすべて組み立て済みトレースから導く。
 */
const extensions = wallExtensionExtensions(wallExtensionMainSize, wallExtensionMainChoices);
const next = extensions[4];
const sceneStep = getLearningStep(wallExtensionExecutionContent, "extend-2-4");
// 状況キャプション（Issue #297）。場面ステップの processing は伸ばし終えた
// 柱（4本目）を指し、Q2 の場面では処理予定の柱へ移るため、青い柱の時制が
// 設問間で反転する。Q1 は直前の伸長を完了形で、Q2 は前提として確定した次の
// 処理を未来形で示し、青の意味を文章で固定する（文言はトレースから導く）。
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

// 柱立ての場面（pillar-6-2: 一番上の段の3本を立て終えた状態）で、次に立てる柱を問う。
const placeSceneStep = getLearningStep(wallExtensionExecutionContent, "pillar-6-2");
const placedPillars = pillarKeys.filter((key) => new Set(placeSceneStep.canvas.state.walls).has(key));
const placeNext = pillarKeys[placedPillars.length];
const placeSituation = `${pillarPlace(placedPillars[placedPillars.length - 1])}を立てました。`;
// 後半の場面（extend-2-6: 7本目まで伸ばした状態）で、処理順と伸長先をもう一度問う。
const lateNext = extensions[7];
const latePrevious = extensions[6];
const lateSceneStep = getLearningStep(wallExtensionExecutionContent, "extend-2-6");
const lateSceneWalls = new Set(lateSceneStep.canvas.state.walls);
const [lateX, lateY] = lateNext.pillar.split(",").map(Number);
const lateTargetCandidates = Object.values(wallExtensionDirections)
  .map((delta) => mazeCellKey(lateX + delta.x, lateY + delta.y))
  .filter((key) => !lateSceneWalls.has(key));
const latePastSituation = `${pillarPlace(latePrevious.pillar)}から、${directionLabels[latePrevious.direction]}へ壁を伸ばしました。`;
const lateNextSituation = `次は、${pillarPlace(lateNext.pillar)}から壁を伸ばします。`;
// 完成の判断は、最後（9本目）の伸長を終えた場面で問う。
const lastExtension = extensions[extensions.length - 1];
const lastSituation = `${pillarPlace(lastExtension.pillar)}から、${directionLabels[lastExtension.direction]}へ壁を伸ばしました。`;

export const wallExtensionCheckContent: WallExtensionCheckContent = {
  version: 1, kind: "concept-check", id: "wall-extension-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-pillar-place", prompt: "次に立てる柱はどれですか", situation: placeSituation, stepId: "pillar-6-2",
      nodeIds: wallExtensionPillars(wallExtensionMainSize), allowNone: false,
      correctAnswer: { kind: "node", nodeId: placeNext }, requires: null,
      reviewStepIds: ["pillar-6-2", "pillar-2-4"], tags: ["pillar-placement"], direction: null,
    },
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
    {
      kind: "choice",
      id: "allowed-directions-lower", prompt: "一番上の段以外の柱が壁を伸ばせる方向はどれですか", situation: pastSituation, stepId: "extend-2-4",
      choices: [
        { id: "four-directions", text: "上下左右の4方向" },
        { id: "three-without-up", text: "上を除く、下・左・右の3方向" },
        { id: "two-vertical", text: "上・下の2方向" },
        { id: "two-horizontal", text: "左・右の2方向" },
      ],
      correctAnswer: { kind: "choice", choiceId: "three-without-up" }, requires: null,
      reviewStepIds: ["directions-rule", "extend-2-4"], tags: ["allowed-directions"],
    },
    {
      kind: "choice",
      id: "allowed-directions-top", prompt: "一番上の段の柱が壁を伸ばせる方向はどれですか", situation: "柱をすべて立て終わりました。", stepId: "directions-rule",
      choices: [
        { id: "three-without-up", text: "上を除く、下・左・右の3方向" },
        { id: "two-horizontal", text: "左・右の2方向" },
        { id: "four-directions", text: "上下左右の4方向" },
        { id: "two-vertical", text: "上・下の2方向" },
      ],
      correctAnswer: { kind: "choice", choiceId: "four-directions" }, requires: null,
      reviewStepIds: ["directions-rule"], tags: ["allowed-directions"],
    },
    {
      id: "next-pillar-late", prompt: "次に処理する柱はどれですか", situation: latePastSituation, stepId: "extend-2-6",
      nodeIds: wallExtensionPillars(wallExtensionMainSize), allowNone: false,
      correctAnswer: { kind: "node", nodeId: lateNext.pillar }, requires: null,
      reviewStepIds: ["extend-2-6", "extend-4-6"], tags: ["pillar-order"], direction: null,
    },
    {
      id: "wall-target-late", prompt: "壁になるマスはどれですか", situation: lateNextSituation, stepId: "extend-2-6",
      nodeIds: lateTargetCandidates, allowNone: false,
      correctAnswer: { kind: "node", nodeId: lateNext.target },
      requires: { questionId: "next-pillar-late", answer: { kind: "node", nodeId: lateNext.pillar } },
      reviewStepIds: ["extend-2-6", "extend-4-6"], tags: ["extension-target"], direction: lateNext.direction,
    },
    {
      kind: "choice",
      id: "maze-completion", prompt: "すべての柱から壁を伸ばし終わりました。この後はどうなりますか", situation: lastSituation, stepId: "extend-6-6",
      choices: [
        { id: "extend-again", text: "一番上の段の柱に戻って、もう一度壁を伸ばします" },
        { id: "completed", text: "迷路の完成です" },
        { id: "place-more-pillars", text: "柱をさらに立てて、壁を伸ばし続けます" },
        { id: "rebuild-border", text: "外側の壁を作り直します" },
      ],
      correctAnswer: { kind: "choice", choiceId: "completed" }, requires: null,
      reviewStepIds: ["extend-6-6", "complete"], tags: ["completion"],
    },
  ],
  completion: {
    stepId: "extend-4-4",
    caption: "次に処理する柱と、壁が伸びるマスを追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/**
 * 設問の場面。選択肢設問と、方向の指示がないタップ設問はフェーズ2のステップ
 * canvas をそのまま返す。方向の指示があるタップ設問は同じ盤面（壁は同一）の
 * まま、処理中の柱を前提設問の正解の柱へ移し、伸ばした直後を表す highlight を
 * 外した場面を返す。
 */
export function getWallExtensionCheckScene(question: WallExtensionCheckQuestion): MazeGridCanvasState {
  const step = getLearningStep(wallExtensionExecutionContent, question.stepId);
  if ("kind" in question) return step.canvas;
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
// 拡充した設問の正解も、検証済みトレースと確定事項に照合する。
// 柱立て: pillar-6-2 の場面で立て終えた柱は一番上の段の3本、次は (2,4)。
// 後半の場面: 8本目は柱 (4,6) から右へ (5,6)。最後は柱 (6,6) から下へ (6,7)。
if (placedPillars.join("|") !== "2,2|4,2|6,2" ||
  placeNext !== "2,4" || placeSituation !== "一番上の段の右の柱を立てました。" ||
  lateNext.pillar !== "4,6" || lateNext.direction !== "right" || lateNext.target !== "5,6" ||
  latePrevious.pillar !== "2,6" || latePrevious.direction !== "right" || latePrevious.target !== "3,6" ||
  latePastSituation !== "一番下の段の左の柱から、右へ壁を伸ばしました。" ||
  lateNextSituation !== "次は、一番下の段の真ん中の柱から壁を伸ばします。" ||
  lateTargetCandidates.join("|") !== "4,5|4,7|5,6" ||
  lastExtension.pillar !== "6,6" || lastExtension.direction !== "down" || lastExtension.target !== "6,7" ||
  lastSituation !== "一番下の段の右の柱から、下へ壁を伸ばしました。") {
  throw new Error("Wall-extension check additions must follow the verified trace");
}
