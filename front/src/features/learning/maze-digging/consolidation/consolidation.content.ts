import { validateAssessment} from "../../assessment/assessment";
import { mazeCellKey, parseMazeCellKey} from "../../player/mazeGrid.types";
import { getLearningStep} from "../../review/reviewContent";
import { validateMazeDiggingCanvas, type MazeDiggingCanvasState} from "../mazeDiggingCanvas";
import {
mazeDiggingAltSmallChoices, mazeDiggingBacktracks, mazeDiggingDirections, mazeDiggingLargeChoices,
mazeDiggingLargeSize, mazeDiggingSmallChoices, mazeDiggingSmallSize, mazeDiggingWalls, runMazeDigging,
} from "../mazeDiggingMaze";
import { mazeDiggingCode} from "../code-mapping/mazeDiggingCode";
import { mazeDiggingCodeMappingContent} from "../code-mapping/codeMapping.content";
import { mazeDiggingExecutionContent} from "../execution/execution.content";
import type {
MazeDiggingConsolidationContent, MazeDiggingGridTapQuestion,
} from "./consolidation.types";

/**
* 基準データ §3 フェーズ6（転移タップ1問・選択5問・Parsons 1問）。
* Q1の場面は転移用 7×7 の途中状態（掘削5回目まで）を組み立てで作り、
* 正解は検証済みトレースの6回目の掘削から導く。第2問は同じ 7×7 を最後まで追う問題で、
* 場面は戻り終えた時点、答えは8回目（最後）の掘削。性質・理由の場面はフェーズ2の盤面を参照する。
* 未見の番号列と大きな盤面の問題は、フェーズ7の判定用テスト（J2・J3）と同じ盤面を
* mazeDiggingMaze の正本データから組み立てて作る。
* 復習先はすべてフェーズ4（コードとの対応）のフレームで、新しい盤面の答え合わせは作らない。
*/
const smallRun = runMazeDigging(mazeDiggingSmallSize, mazeDiggingSmallChoices);
const transferBefore = smallRun.digs[4];
const transferDig = smallRun.digs[5];
const transferWallSet = new Set<string>(transferBefore.wallsAfter);
const { x: currentX, y: currentY} = parseMazeCellKey(transferDig.from);
// Q1の回答対象はフェーズ3と同じ考え方で、アルゴリズムが実際に集める候補そのもの:
// 現在マスから2マス先が盤内（外周を除く）で、まだ壁のままの部屋。提示順（上・右・下・左）のまま並べる。
const transferCandidates = mazeDiggingDirections
.map((direction) => mazeCellKey(currentX + 2 * direction.x, currentY + 2 * direction.y))
.filter((key) => {
const { x, y} = parseMazeCellKey(key);
return x >= 1 && x < mazeDiggingSmallSize - 1 && y >= 1 && y < mazeDiggingSmallSize - 1 && transferWallSet.has(key);
});
const transferScene: MazeDiggingCanvasState = {
data: { kind: "maze-grid", size: mazeDiggingSmallSize},
state: { walls: transferBefore.wallsAfter, processing: transferDig.from, target: null, path: transferBefore.stackPath, start: null, goal: null},
highlights: [],
};
const directionLabels: Record<string, string> = { up: "上", right: "右", down: "下", left: "左"};
const transferDirection = mazeDiggingDirections.find(
(direction) => mazeCellKey(currentX + 2 * direction.x, currentY + 2 * direction.y) === transferDig.room,
);
/** 座標の表示は、コードの grid[y][x] の添字順に合わせ (y, x) とする（Issue #326）。 */
const coordinate = (key: string) => {
const { x, y} = parseMazeCellKey(key);
return `(${y}, ${x})`;
};
const completedScene = getLearningStep(mazeDiggingExecutionContent, "complete").canvas;
const deadEndScene = getLearningStep(mazeDiggingExecutionContent, "dig-6").canvas;
// 転移盤面の最後の掘削（8回目）。7回目で行き止まりに入り、戻ってから掘り直す場面を問う。
// 場面は「戻り終えた時点」の盤面で、壁は7回目の掘削直後（戻っても盤面は変わらない）、
// 現在マスと経路はバックトラックの導出（再開マスと戻り終えたスタック）から作る。
const finalBefore = smallRun.digs[6];
const finalDig = smallRun.digs[7];
const finalBacktrack = mazeDiggingBacktracks(smallRun.digs).find((backtrack) => backtrack.afterDigIndex === 6);
if (!finalBacktrack) throw new Error("Maze-digging small run must backtrack before the final dig");
const finalWallSet = new Set<string>(finalBefore.wallsAfter);
const { x: finalX, y: finalY} = parseMazeCellKey(finalDig.from);
const finalScene: MazeDiggingCanvasState = {
data: { kind: "maze-grid", size: mazeDiggingSmallSize},
state: { walls: finalBefore.wallsAfter, processing: finalDig.from, target: null, path: finalBacktrack.stackPath, start: null, goal: null},
highlights: [],
};
const finalDirection = mazeDiggingDirections.find(
(direction) => mazeCellKey(finalX + 2 * direction.x, finalY + 2 * direction.y) === finalDig.room,
);
// 未見の番号列（フェーズ7の判定用 J2 と同じ列）で作った完成盤面。開始から追跡する問題の場面に使う。
const altRun = runMazeDigging(mazeDiggingSmallSize, mazeDiggingAltSmallChoices);
const altScene: MazeDiggingCanvasState = {
data: { kind: "maze-grid", size: mazeDiggingSmallSize},
state: { walls: mazeDiggingWalls(altRun.grid), processing: null, target: null, path: [], start: null, goal: null},
highlights: [],
};
// 大きな盤面（フェーズ7の判定用 J3 と同じ 11×11）の完成盤面。掘削回数の一般化を問う場面に使う。
const largeRun = runMazeDigging(mazeDiggingLargeSize, mazeDiggingLargeChoices);
const largeScene: MazeDiggingCanvasState = {
data: { kind: "maze-grid", size: mazeDiggingLargeSize},
state: { walls: mazeDiggingWalls(largeRun.grid), processing: null, target: null, path: [], start: null, goal: null},
highlights: [],
};
const [firstFrame,...remainingFrames] = mazeDiggingCodeMappingContent.steps;

export const mazeDiggingConsolidationContent: MazeDiggingConsolidationContent = {
version: 1, kind: "diagnostic-check", id: "maze-digging-consolidation", phase: 6, stageName: "応用問題",
code: mazeDiggingCode,
reviewLabel: "💡 基本例の動き・コードをもう一度見る",
completion: "理解の状況が確認できました。それでは【自分で実装】に進み、自分の手でコードを完成させましょう！",
questions: [
{
kind: "node", id: "transfer-dig-target",
prompt: `${coordinate(transferDig.from)} から${transferDirection? directionLabels[transferDirection.name]: ""}へ掘ります。掘られる部屋はどれですか`,
scene: transferScene,
nodeIds: transferCandidates, allowNone: false,
correctAnswer: { kind: "node", nodeId: transferDig.room}, requires: null,
stepId: "execution-dig-6",
reviewStepIds: ["choose-candidate-6", "dig-between-6", "dig-room-6", "execution-dig-6"],
tags: ["掘り進める先の追跡"],
instruction: "盤面のマスをタップして答える",
correctFeedback: `正解。左へ2マス先の部屋 ${coordinate(transferDig.room)} が掘られます。`,
incorrectFeedback: "不正解。掘られるのは、現在マスから指示された方向へ2マス先にある、まだ壁のままの部屋です。",
},
{
kind: "choice", id: "transfer-final-dig",
prompt: `行き止まりから ${coordinate(finalDig.from)} まで戻ってきました。ここから${finalDirection? directionLabels[finalDirection.name]: ""}へ掘ります。掘られる部屋はどれですか`,
scene: finalScene,
choices: [
{ id: "coord-5-5", text: "(5, 5)"},
{ id: "coord-3-1", text: "(3, 1)"},
{ id: "coord-5-1", text: "(5, 1)"},
{ id: "coord-5-3", text: "(5, 3)"},
],
correctAnswer: { kind: "choice", choiceId: "coord-5-5"}, requires: null,
stepId: "execution-dig-8",
reviewStepIds: ["choose-candidate-8", "dig-between-8", "dig-room-8", "execution-dig-8"],
tags: ["戻った後の掘り直し"],
instruction: "最後に掘られる部屋を1つ選ぶ",
correctFeedback: `正解。右へ2マス先の部屋 ${coordinate(finalDig.room)} が掘られ、迷路が完成します。`,
incorrectFeedback: "不正解。掘られるのは、戻った先の現在マスから指示された方向へ2マス先にある、まだ壁のままの部屋です。",
},
{
kind: "choice", id: "completed-maze-properties", prompt: "穴掘り法で作った迷路について、正しい説明はどれですか",
scene: completedScene,
choices: [
{ id: "connected-no-loops", text: "すべての部屋が通路でつながっていて、輪（ぐるりと回れる道）がない"},
{ id: "some-isolated", text: "一部の部屋は、どこにもつながっていない"},
{ id: "has-loops", text: "輪（ぐるりと回れる道）がいくつかある"},
{ id: "digs-equal-rooms", text: "掘った回数は、部屋の数と同じである"},
],
correctAnswer: { kind: "choice", choiceId: "connected-no-loops"}, requires: null,
stepId: "return-grid", reviewStepIds: ["execution-complete", "return-grid"],
tags: ["完成した迷路の性質"],
instruction: "迷路の性質を1つ選ぶ",
correctFeedback: "正解。どの部屋からどの部屋へもたどり着けて、ぐるりと回れる道はありません。棒倒し法とは作り方が逆でも、完成した迷路の性質は同じです。",
incorrectFeedback: "不正解。壁の塊を掘って作る方法でも、すべての部屋はつながり、輪はできません。",
},
{
kind: "choice", id: "backtrack-reason", prompt: "行き止まりの部屋では、なぜ戻る（バックトラックする）必要があるのですか",
scene: deadEndScene,
choices: [
{ id: "no-diggable-left", text: "その部屋からは掘れる部屋がもうなく、戻らなければ残りの部屋にたどり着けないため"},
{ id: "would-dig-twice", text: "戻らないと、同じ部屋を二度掘ってしまうため"},
{ id: "stack-overflow", text: "スタックに部屋がたまりすぎてしまうため"},
],
correctAnswer: { kind: "choice", choiceId: "no-diggable-left"}, requires: null,
stepId: "execution-backtrack-1",
reviewStepIds: ["if-candidates-7", "else-branch-7", "pop-stack-7", "execution-backtrack-1"],
tags: ["バックトラックが必要な理由"],
instruction: "理由を1つ選ぶ",
correctFeedback: "正解。その部屋から掘れる先がないので、掘れる部屋が残っているところまで戻って掘り直します。",
incorrectFeedback: "不正解。掘れるかどうかは盤面の状態で判定しているので、同じ部屋を二度掘ることはありません。戻るのは、残りの部屋へ進むためです。",
},
{
kind: "choice", id: "unseen-choices-last-room",
prompt: `別の7×7の盤面で、方向の番号 [${mazeDiggingAltSmallChoices.join(", ")}] を順に使って迷路を作りました。最後に掘られる部屋はどれですか`,
scene: altScene,
choices: [
{ id: "coord-3-3", text: "(3, 3)"},
{ id: "coord-1-3", text: "(1, 3)"},
{ id: "coord-3-5", text: "(3, 5)"},
{ id: "coord-5-5", text: "(5, 5)"},
],
correctAnswer: { kind: "choice", choiceId: "coord-3-3"}, requires: null,
stepId: "choose-candidate-1", reviewStepIds: ["if-candidates-1", "choose-candidate-1", "execution-dig-1"],
tags: ["別の番号列での追跡"],
instruction: "最後に掘られる部屋を1つ選ぶ",
correctFeedback: "正解。番号列を順にたどると、最後に掘られるのは (3, 3) の部屋です。",
incorrectFeedback: "不正解。番号列を先頭から順に使い、そのつど候補の並び（上・右・下・左の順）に当てはめて追うと、最後に掘られる部屋が決まります。",
},
{
kind: "choice", id: "large-board-dig-count", prompt: "11×11の盤面で穴掘り法の迷路を完成させると、部屋を掘る回数は全部で何回ですか",
scene: largeScene,
choices: [
{ id: "twenty-four", text: "24回"},
{ id: "twenty-five", text: "25回"},
{ id: "forty-eight", text: "48回"},
{ id: "forty-nine", text: "49回"},
],
correctAnswer: { kind: "choice", choiceId: "twenty-four"}, requires: null,
stepId: "return-grid", reviewStepIds: ["execution-complete", "return-grid"],
tags: ["大きな盤面への一般化"],
instruction: "掘る回数を1つ選ぶ",
correctFeedback: "正解。部屋は25個あり、スタートの部屋は最初から掘られているので、掘る回数は25から1を引いた24回です。盤面の大きさが変わっても、掘る回数は部屋の数から1を引いたものになります。",
incorrectFeedback: "不正解。スタートの部屋は最初から掘られているので、掘る回数は部屋の数から1を引いたものになります。",
},
{
kind: "parsons", id: "whole-code-order", prompt: "迷路を作るコードを、実行の流れに合う順序に並べてください。",
lineIds: [
"while-stack", "initialize-grid", "pop-stack", "define-function", "compute-next",
"dig-start", "choose-candidate", "initialize-candidates", "return-grid", "for-direction",
"push-stack", "define-directions", "if-candidates", "current-room", "dig-room",
"initialize-step", "append-candidate", "else-branch", "advance-step", "initialize-stack",
"if-diggable", "dig-between",
],
correctAnswer: { kind: "order", lineIds: mazeDiggingCode.lines.map((line) => line.id)}, requires: null,
// フェード型: 関数定義・初期化・開始マスの準備・ループの枠・return は固定し、掘るか戻るかの本体だけを並べ替える。
fixedLineIds: ["define-function", "initialize-grid", "define-directions", "dig-start", "initialize-stack", "initialize-step", "while-stack", "return-grid"],
stepId: firstFrame.id, reviewStepIds: [firstFrame.id,...remainingFrames.map((frame) => frame.id)],
tags: ["コード全体の流れ"],
instruction: "色の薄い行は固定されています。残りの行をドラッグ、または↑↓ボタンで並び替える",
correctFeedback: "正解。全部を壁にする、開始マスを掘る、候補を選んで掘るか戻る、盤面を返す、という流れを組み立てられました。",
incorrectFeedback: "不正解。開始マスを掘る、候補を集める、選んで掘ってスタックに積む、候補がなければ戻る、という流れを確かめてみましょう。",
},
],
};

export function validateMazeDiggingConsolidation(content: MazeDiggingConsolidationContent): void {
validateAssessment(content);
if (content.phase!== 6 || content.stageName!== "応用問題" || content.questions.length!== 7 || content.code!== mazeDiggingCode) {
throw new Error("Use seven questions and the canonical code");
}
for (const question of content.questions) {
getLearningStep(mazeDiggingCodeMappingContent, question.stepId);
question.reviewStepIds.forEach((id) => getLearningStep(mazeDiggingCodeMappingContent, id));
if (question.kind === "parsons") {
const ids: readonly string[] = mazeDiggingCode.lines.map((line) => line.id);
if (question.lineIds.length!== ids.length || question.lineIds.some((id) =>!ids.includes(id)) ||
question.correctAnswer.lineIds.some((id, index) => id!== ids[index])) throw new Error("Parsons must use all canonical lines");
// 基準データ §3: 行の順序はすべて意味を持つため、順序自由な行は設けない。
if (question.interchangeableLineGroups && question.interchangeableLineGroups.length > 0) {
throw new Error("Maze-digging Parsons has no interchangeable lines");
}
} else {
validateMazeDiggingCanvas(question.scene);
}
}
// Q1は検証済みトレースの6回目の掘削と一致しなければならない（場面・候補・正解）。
const tap = content.questions[0] as MazeDiggingGridTapQuestion;
if (tap.kind!== "node" || tap.scene.data.size!== mazeDiggingSmallSize ||
tap.scene.state.processing!== transferDig.from ||
tap.correctAnswer.kind!== "node" || tap.correctAnswer.nodeId!== transferDig.room ||
new Set(tap.scene.state.walls).size!== transferBefore.wallsAfter.length ||
tap.scene.state.walls.some((key) =>!transferWallSet.has(key)) ||
tap.nodeIds.length!== transferCandidates.length || tap.nodeIds.some((id) =>!transferCandidates.includes(id))) {
throw new Error("Transfer question must follow the verified 7x7 trace");
}
// 第2の転移問題（戻った後の掘り直し）も、検証済みトレースの8回目の掘削と一致しなければならない。
// 再開マスから掘れる候補は (5,5) の1つだけなので、タップ形式では候補マスがそのまま答えになってしまう。
// そのため選択形式にし、誤答には直前に掘った部屋と再開マスそのものを置く。
const finalQuestion = content.questions[1];
if (finalQuestion.kind!== "choice" || finalQuestion.scene.data.size!== mazeDiggingSmallSize ||
finalQuestion.scene.state.processing!== finalDig.from ||
finalQuestion.correctAnswer.kind!== "choice" ||
finalQuestion.choices.find((choice) => choice.id === (finalQuestion.correctAnswer as { choiceId: string }).choiceId)?.text!== coordinate(finalDig.room) ||
new Set(finalQuestion.scene.state.walls).size!== finalBefore.wallsAfter.length ||
finalQuestion.scene.state.walls.some((key) =>!finalWallSet.has(key)) ||
finalQuestion.scene.state.path.length!== finalBacktrack!.stackPath.length ||
finalQuestion.scene.state.path.some((key, index) => key!== finalBacktrack!.stackPath[index])) {
throw new Error("Final-dig question must follow the verified 7x7 trace");
}
}
// 基準データ §3 の確定事項（7×7 の6回目: (3,5) から左へ (1,5)）と教材がずれたら落とす。
if (transferDig.from!== "3,5" || transferDirection?.name!== "left" || transferDig.room!== "1,5" || transferDig.between!== "2,5") {
throw new Error("Maze-digging consolidation transfer must follow the verified trace");
}
// 追加問題の土台トレース（7×7 の8回目・未見の番号列の最終掘削・11×11 の掘削回数）も確定事項として固定する。
if (finalDig.from!== "3,5" || finalDirection?.name!== "right" || finalDig.room!== "5,5" || finalDig.between!== "4,5" ||
finalBacktrack.resumeRoom!== "3,5") {
throw new Error("Maze-digging consolidation final dig must follow the verified trace");
}
if (altRun.digs.length!== 8 || altRun.digs[altRun.digs.length - 1].room!== "3,3") {
throw new Error("Maze-digging consolidation unseen-choices trace must end at room 3,3");
}
if (largeRun.digs.length!== 24) {
throw new Error("Maze-digging consolidation large board must take 24 digs");
}
validateMazeDiggingConsolidation(mazeDiggingConsolidationContent);
