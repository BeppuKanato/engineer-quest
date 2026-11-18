import { validateAssessment} from "../../assessment/assessment";
import { mazeCellKey, validateMazeGridCanvas, type MazeGridCanvasState} from "../../player/mazeGrid.types";
import { getLearningStep} from "../../review/reviewContent";
import {
buildWallExtensionWalls, wallExtensionDirections, wallExtensionExtensions,
wallExtensionSmallChoices, wallExtensionSmallSize, wallExtensionUnseenChoices,
} from "../wallExtensionMaze";
import { wallExtensionCode} from "../code-mapping/wallExtensionCode";
import { wallExtensionCodeMappingContent} from "../code-mapping/codeMapping.content";
import { wallExtensionExecutionContent} from "../execution/execution.content";
import type {
WallExtensionConsolidationContent, WallExtensionGridTapQuestion,
} from "./consolidation.types";

/**
* 基準データ §3 フェーズ6。2026-11-17 の判断基準（「自力で流れからコードを
* 組み立てる力があると判断するに足るか」）で監査し、4問から7問へ拡充した。
* フェーズ7（表示 D1・D2、判定 J1〜J3）が前提とする力のうち、既存4問は
* 転移タップ（7×7 の3本目まで）・完成した迷路の性質・上に伸ばせない理由・
* Parsons をカバーしていた。未カバーだったものを足す。
* - 転移盤面の最後（4本目）までの追跡（D2 の盤面を最後までたどる）
* - 未見の盤面で手順を最初から適用すること（一番上の段の柱から上へ伸びる
* 場面を含む。フェーズ3・既存の転移タップは上方向を扱っていない）
* - 大きな盤面への一般化（11×11 の柱の本数。フェーズ7 J3 の前提）
* 行の内容を書く力（タイピングの段差）は教材側の判断事項として残し、
* 空・最小の盤面はフェーズ7のテストにないため対象外とする。
* 場面は転移用の盤面を組み立てで作り、正解は検証済みトレースから導く。
* 復習先はすべてフェーズ4（コードとの対応）のフレームで、新しい盤面の
* 答え合わせは作らない。
*/
const transferExtensions = wallExtensionExtensions(wallExtensionSmallSize, wallExtensionSmallChoices);
const transfer = transferExtensions[2];
const transferWalls = buildWallExtensionWalls(wallExtensionSmallSize, wallExtensionSmallChoices, 2);
const transferWallSet = new Set(transferWalls);
const [transferX, transferY] = transfer.pillar.split(",").map(Number);
// Q1の回答対象はフェーズ3 Q2 と同じ考え方で、柱に隣接する未壁マスに限る。
const transferCandidates = Object.values(wallExtensionDirections)
.map((delta) => mazeCellKey(transferX + delta.x, transferY + delta.y))
.filter((key) =>!transferWallSet.has(key));
const transferScene: MazeGridCanvasState = {
data: { kind: "maze-grid", size: wallExtensionSmallSize},
state: { walls: transferWalls, processing: transfer.pillar, target: null, path: [], start: null, goal: null},
highlights: [],
};
// 転移盤面の最後（4本目）。場面は3本目まで伸ばした状態で、正解は4本目から導く。
const transferFinal = transferExtensions[3];
const transferFinalWalls = buildWallExtensionWalls(wallExtensionSmallSize, wallExtensionSmallChoices, 3);
const transferFinalWallSet = new Set(transferFinalWalls);
const [transferFinalX, transferFinalY] = transferFinal.pillar.split(",").map(Number);
const transferFinalCandidates = Object.values(wallExtensionDirections)
.map((delta) => mazeCellKey(transferFinalX + delta.x, transferFinalY + delta.y))
.filter((key) =>!transferFinalWallSet.has(key));
const transferFinalScene: MazeGridCanvasState = {
data: { kind: "maze-grid", size: wallExtensionSmallSize},
state: { walls: transferFinalWalls, processing: transferFinal.pillar, target: null, path: [], start: null, goal: null},
highlights: [],
};
// 未見の盤面（7×7、別の choices）の1本目。一番上の段の柱から上へ伸びる。
const unseenExtensions = wallExtensionExtensions(wallExtensionSmallSize, wallExtensionUnseenChoices);
const unseenFirst = unseenExtensions[0];
const unseenWalls = buildWallExtensionWalls(wallExtensionSmallSize, wallExtensionUnseenChoices, 0);
const unseenWallSet = new Set(unseenWalls);
const [unseenX, unseenY] = unseenFirst.pillar.split(",").map(Number);
const unseenCandidates = Object.values(wallExtensionDirections)
.map((delta) => mazeCellKey(unseenX + delta.x, unseenY + delta.y))
.filter((key) =>!unseenWallSet.has(key));
const unseenScene: MazeGridCanvasState = {
data: { kind: "maze-grid", size: wallExtensionSmallSize},
state: { walls: unseenWalls, processing: unseenFirst.pillar, target: null, path: [], start: null, goal: null},
highlights: [],
};
const completedScene = getLearningStep(wallExtensionExecutionContent, "complete").canvas;
const lowerPillarScene = getLearningStep(wallExtensionExecutionContent, "extend-2-4").canvas;
const [firstFrame,...remainingFrames] = wallExtensionCodeMappingContent.steps;

export const wallExtensionConsolidationContent: WallExtensionConsolidationContent = {
version: 1, kind: "diagnostic-check", id: "wall-extension-consolidation", phase: 6, stageName: "応用問題",
code: wallExtensionCode,
reviewLabel: "💡 基本例の動き・コードをもう一度見る",
completion: "理解の状況が確認できました。それでは【自分で実装】に進み、自分の手でコードを完成させましょう！",
questions: [
{
kind: "node", id: "transfer-wall-target", prompt: "壁になるマスはどれですか",
scene: transferScene, direction: transfer.direction,
nodeIds: transferCandidates, allowNone: false,
correctAnswer: { kind: "node", nodeId: transfer.target}, requires: null,
stepId: "execution-extend-4-4",
reviewStepIds: ["for-extension-4-4", "lookup-delta-4-4", "execution-extend-4-4"],
tags: ["壁が伸びる先の追跡"],
instruction: "盤面のマスをタップして答える",
correctFeedback: "正解。柱の右隣のマスが、新しい壁になります。",
incorrectFeedback: "不正解。壁は、処理している柱から指示された方向へ1マス進んだ先に伸びます。",
},
{
kind: "node", id: "transfer-wall-target-final", prompt: "壁になるマスはどれですか",
scene: transferFinalScene, direction: transferFinal.direction,
nodeIds: transferFinalCandidates, allowNone: false,
correctAnswer: { kind: "node", nodeId: transferFinal.target}, requires: null,
stepId: "execution-extend-4-4",
reviewStepIds: ["for-extension-4-4", "lookup-delta-4-4", "execution-extend-4-4"],
tags: ["転移盤面の最後の伸長"],
instruction: "盤面のマスをタップして答える",
correctFeedback: "正解。最後の柱の下隣のマスが、新しい壁になり、この盤面の迷路が完成します。",
incorrectFeedback: "不正解。壁は、処理している柱から指示された方向へ1マス進んだ先に伸びます。",
},
{
kind: "node", id: "unseen-first-extension", prompt: "壁になるマスはどれですか",
scene: unseenScene, direction: unseenFirst.direction,
nodeIds: unseenCandidates, allowNone: false,
correctAnswer: { kind: "node", nodeId: unseenFirst.target}, requires: null,
stepId: "execution-extend-2-2",
reviewStepIds: ["for-extension-2-2", "lookup-delta-2-2", "execution-extend-2-2"],
tags: ["別の盤面での最初の伸長"],
instruction: "盤面のマスをタップして答える",
correctFeedback: "正解。一番上の段の柱は上にも伸ばせるので、柱の上隣のマスが新しい壁になります。",
incorrectFeedback: "不正解。一番上の段の柱は上下左右の4方向へ伸ばせます。指示された方向の隣のマスを選びます。",
},
{
kind: "choice", id: "completed-maze-properties", prompt: "棒倒し法で作った迷路について、正しい説明はどれですか",
scene: completedScene,
choices: [
{ id: "connected-no-loops", text: "すべての通路がつながっていて、輪（ぐるりと回れる道）がない"},
{ id: "some-isolated", text: "一部の通路は、どこにもつながっていない"},
{ id: "has-loops", text: "輪（ぐるりと回れる道）がいくつかある"},
{ id: "more-walls-than-pillars", text: "伸ばした壁の数は、柱の数より多い"},
],
correctAnswer: { kind: "choice", choiceId: "connected-no-loops"}, requires: null,
stepId: "return-grid", reviewStepIds: ["execution-complete", "return-grid"],
tags: ["完成した迷路の性質"],
instruction: "迷路の性質を1つ選ぶ",
correctFeedback: "正解。どの通路からどの通路へもたどり着けて、ぐるりと回れる道はありません。",
incorrectFeedback: "不正解。柱ごとに壁を1本ずつ伸ばす作り方では、通路は必ずつながり、輪はできません。",
},
{
kind: "choice", id: "no-upward-extension", prompt: "一番上の段以外の柱が、上へ壁を伸ばせないのはなぜですか",
scene: lowerPillarScene,
choices: [
{ id: "prevents-loops", text: "上へ伸ばすと、輪（ぐるりと回れる道）ができることがあるため"},
{ id: "outside-board", text: "上のマスが、盤面の外になってしまうため"},
{ id: "already-wall", text: "上のマスは、いつもすでに壁になっているため"},
],
correctAnswer: { kind: "choice", choiceId: "prevents-loops"}, requires: null,
stepId: "if-first-row-2-4",
reviewStepIds: ["if-first-row-2-4", "else-branch-2-4", "allowed-three-2-4"],
tags: ["上に伸ばせない理由"],
instruction: "理由を1つ選ぶ",
correctFeedback: "正解。上の段の柱が伸ばした壁とつながって、輪ができることがあるためです。",
incorrectFeedback: "不正解。コードでは一番上の段かどうかで伸ばせる方向を切り替えています。輪を防ぐための決まりです。",
},
{
kind: "choice", id: "pillar-count-larger-board", prompt: "盤面を11×11にすると、柱は全部で何本立ちますか",
scene: completedScene,
choices: [
{ id: "nine", text: "9本"},
{ id: "sixteen", text: "16本"},
{ id: "twenty-five", text: "25本"},
{ id: "thirty-six", text: "36本"},
],
correctAnswer: { kind: "choice", choiceId: "sixteen"}, requires: null,
stepId: "return-grid", reviewStepIds: ["execution-complete", "return-grid"],
tags: ["大きな盤面の柱の数"],
instruction: "柱の本数を1つ選ぶ",
correctFeedback: "正解。柱は縦も横も2マスおきに4本ずつ立つので、全部で16本です。",
incorrectFeedback: "不正解。柱は2マスおきに立ちます。11×11では縦・横とも端から端まで4本ずつになるので、全部で16本です。",
},
{
kind: "parsons", id: "whole-code-order", prompt: "迷路を作るコードを、実行の流れに合う順序に並べてください。",
lineIds: [
"write-wall", "for-pillar-row", "border-left", "define-function", "allowed-three",
"initialize-grid", "append-pillar", "for-border", "return-grid", "if-first-row",
"place-pillar", "border-top", "for-extension", "lookup-delta", "initialize-pillars",
"define-directions", "border-right", "for-pillar-column", "allowed-four", "border-bottom",
"else-branch",
],
correctAnswer: { kind: "order", lineIds: wallExtensionCode.lines.map((line) => line.id)}, requires: null,
// 外周の4つの書き込みは互いに独立で、順序を入れ替えても迷路は変わらない（BFSの初期化2行と同じ扱い）。
interchangeableLineGroups: [["border-top", "border-bottom", "border-left", "border-right"]],
// フェード型: 関数定義・盤面の初期化・外周ループと柱ループの枠・方向表・return は固定し、
// 外周の書き込み、柱を立てる中身、壁を伸ばす判断の流れだけを並べ替える。入れ替え可能グループの行は固定しない。
fixedLineIds: ["define-function", "initialize-grid", "for-border", "initialize-pillars", "for-pillar-row", "for-pillar-column", "define-directions", "return-grid"],
stepId: firstFrame.id, reviewStepIds: [firstFrame.id,...remainingFrames.map((frame) => frame.id)],
tags: ["コード全体の流れ"],
instruction: "色の薄い行は固定されています。残りの行をドラッグ、または↑↓ボタンで並び替える",
correctFeedback: "正解。外側を囲み、柱を立て、柱から壁を伸ばして返すまでの流れを組み立てられました。",
incorrectFeedback: "不正解。外側を囲む、柱を立てる、方向を決めて壁を書き込む、盤面を返す、という流れを確かめてみましょう。",
},
],
};

export function validateWallExtensionConsolidation(content: WallExtensionConsolidationContent): void {
validateAssessment(content);
if (content.phase!== 6 || content.stageName!== "応用問題" || content.questions.length!== 7 || content.code!== wallExtensionCode) {
throw new Error("Use seven questions and the canonical code");
}
for (const question of content.questions) {
getLearningStep(wallExtensionCodeMappingContent, question.stepId);
question.reviewStepIds.forEach((id) => getLearningStep(wallExtensionCodeMappingContent, id));
if (question.kind === "parsons") {
const ids: readonly string[] = wallExtensionCode.lines.map((line) => line.id);
if (question.lineIds.length!== ids.length || question.lineIds.some((id) =>!ids.includes(id)) ||
question.correctAnswer.lineIds.some((id, index) => id!== ids[index])) throw new Error("Parsons must use all canonical lines");
} else {
validateMazeGridCanvas(question.scene);
}
}
// タップ設問は検証済みトレースと一致しなければならない（場面・方向・候補・正解）。
const taps = [
{ question: content.questions[0] as WallExtensionGridTapQuestion, expected: transferExtensions[2], walls: transferWalls, candidates: transferCandidates},
{ question: content.questions[1] as WallExtensionGridTapQuestion, expected: transferExtensions[3], walls: transferFinalWalls, candidates: transferFinalCandidates},
{ question: content.questions[2] as WallExtensionGridTapQuestion, expected: unseenExtensions[0], walls: unseenWalls, candidates: unseenCandidates},
];
for (const { question: tap, expected, walls, candidates} of taps) {
const wallSet = new Set(walls);
if (tap.kind!== "node" || tap.scene.data.size!== wallExtensionSmallSize ||
tap.scene.state.processing!== expected.pillar || tap.direction!== expected.direction ||
tap.correctAnswer.kind!== "node" || tap.correctAnswer.nodeId!== expected.target ||
new Set(tap.scene.state.walls).size!== walls.length ||
tap.scene.state.walls.some((key) =>!wallSet.has(key)) ||
tap.nodeIds.length!== candidates.length || tap.nodeIds.some((id) =>!candidates.includes(id))) {
throw new Error("Transfer questions must follow the verified 7x7 traces");
}
}
}
// 基準データ §3 の確定事項（7×7 転移の3本目: 柱 (2,4) から右へ (3,4)、
// 4本目: 柱 (4,4) から下へ (4,5)、未見盤面の1本目: 柱 (2,2) から上へ (2,1)）と
// 教材がずれたら落とす。
if (transfer.pillar!== "2,4" || transfer.direction!== "right" || transfer.target!== "3,4" ||
transferFinal.pillar!== "4,4" || transferFinal.direction!== "down" || transferFinal.target!== "4,5" ||
unseenFirst.pillar!== "2,2" || unseenFirst.direction!== "up" || unseenFirst.target!== "2,1") {
throw new Error("Wall-extension consolidation transfers must follow the verified traces");
}
validateWallExtensionConsolidation(wallExtensionConsolidationContent);
