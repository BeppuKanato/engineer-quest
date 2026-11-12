import { validateAssessment } from "../../../assessment/assessment";
import { mazeCellKey, parseMazeCellKey, type MazeCellKey } from "../../../player/mazeGrid.types";
import { getLearningStep } from "../../../review/reviewContent";
import { validateMazeDiggingCanvas, type MazeDiggingCanvasState } from "../mazeDiggingCanvas";
import {
  mazeDiggingDirections, mazeDiggingMainChoices, mazeDiggingMainSize, runMazeDigging,
} from "../mazeDiggingMaze";
import { mazeDiggingExecutionContent } from "../execution/execution.content";
import type { MazeDiggingCheckContent } from "./check.types";

/**
 * 基準データ §3 フェーズ3（連結2問）。場面はフェーズ2の `dig-3`
 * （主教材で3回目まで掘った状態）の盤面をステップIDで参照し、壁は複製しない。
 * 正解は組み立て済みトレースの4回目の掘削から導く（Q1=掘られる部屋、Q2=間の壁マス）。
 * 次の行き先は乱数（choices）で決まるため一意に定まらず、方向は基準データ §6-6 の
 * とおり Q1 の問題文の中で提示する。
 */
const run = runMazeDigging(mazeDiggingMainSize, mazeDiggingMainChoices);
const next = run.digs[3];
const sceneStep = getLearningStep(mazeDiggingExecutionContent, "dig-3");
const sceneWalls = new Set(sceneStep.canvas.state.walls);
const { x: currentX, y: currentY } = parseMazeCellKey(next.from);
// Q1の回答対象は、アルゴリズムが実際に集める候補そのもの: 現在マスから2マス先が
// 盤内（外周を除く）で、まだ壁のままの部屋。提示順（上・右・下・左）のまま並べる。
const candidateDirections = mazeDiggingDirections.filter((direction) => {
  const key = mazeCellKey(currentX + 2 * direction.x, currentY + 2 * direction.y);
  const { x, y } = parseMazeCellKey(key);
  return x >= 1 && x < mazeDiggingMainSize - 1 && y >= 1 && y < mazeDiggingMainSize - 1 && sceneWalls.has(key);
});
const candidateRooms = candidateDirections.map((direction) => mazeCellKey(currentX + 2 * direction.x, currentY + 2 * direction.y));
// Q2の回答対象は、候補方向それぞれの間の壁マス。掘削で通路になるのはこの範囲だけ。
const candidateBetweens = candidateDirections.map((direction) => mazeCellKey(currentX + direction.x, currentY + direction.y));
const directionLabels: Record<string, string> = { up: "上", right: "右", down: "下", left: "左" };
const nextDirection = mazeDiggingDirections.find(
  (direction) => mazeCellKey(currentX + 2 * direction.x, currentY + 2 * direction.y) === next.room,
);
/** 座標の表示は、コードの grid[y][x] の添字順に合わせ (y, x) とする（Issue #326）。 */
const coordinate = (key: MazeCellKey) => {
  const { x, y } = parseMazeCellKey(key);
  return `(${y}, ${x})`;
};

export const mazeDiggingCheckContent: MazeDiggingCheckContent = {
  version: 1, kind: "node-tap-check", id: "maze-digging-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "next-room",
      prompt: `${coordinate(next.from)} から${nextDirection ? directionLabels[nextDirection.name] : ""}へ掘ります。掘られる部屋はどれですか`,
      stepId: "dig-3",
      nodeIds: candidateRooms, allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.room }, requires: null,
      reviewStepIds: ["dig-3", "dig-4"], tags: ["dig-target"],
    },
    {
      id: "between-wall",
      prompt: "そのとき通路になる、間の壁マスはどれですか",
      stepId: "dig-3",
      nodeIds: candidateBetweens, allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.between },
      requires: { questionId: "next-room", answer: { kind: "node", nodeId: next.room } },
      reviewStepIds: ["dig-3", "dig-4"], tags: ["dig-between"],
    },
  ],
  completion: {
    stepId: "dig-4",
    caption: "次に掘る部屋と、通路になる間の壁を追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/**
 * 設問の場面。2問とも同じ掘削の前後を問うため、場面ステップの canvas をそのまま返す
 * （処理中の現在マス (3, 5) は両問で変わらない。棒倒し法フェーズ3と違い、
 * 前提設問の正解で処理中マスが移ることはない）。
 */
export function getMazeDiggingCheckScene(): MazeDiggingCanvasState {
  return sceneStep.canvas;
}

validateAssessment(mazeDiggingCheckContent);
for (const question of mazeDiggingCheckContent.questions) {
  getLearningStep(mazeDiggingExecutionContent, question.stepId);
  question.reviewStepIds.forEach((id) => getLearningStep(mazeDiggingExecutionContent, id));
  validateMazeDiggingCanvas(getMazeDiggingCheckScene());
}
getLearningStep(mazeDiggingExecutionContent, mazeDiggingCheckContent.completion.stepId);
// 基準データ §3 の確定事項（4回目: (5,3) から右へ、部屋 (7,3)・間の壁 (6,3)）と教材の正解がずれたら落とす。
if (sceneStep.canvas.state.processing !== next.from
  || next.from !== "5,3" || nextDirection?.name !== "right" || next.room !== "7,3" || next.between !== "6,3") {
  throw new Error("Maze-digging check answers must follow the verified trace");
}
