import { validateAssessment } from "../../assessment/assessment";
import { mazeCellKey, parseMazeCellKey, type MazeCellKey } from "../../player/mazeGrid.types";
import { getLearningStep } from "../../review/reviewContent";
import { validateMazeDiggingCanvas, type MazeDiggingCanvasState } from "../mazeDiggingCanvas";
import {
  mazeDiggingBacktracks, mazeDiggingDirections, mazeDiggingMainChoices, mazeDiggingMainSize, runMazeDigging,
} from "../mazeDiggingMaze";
import { mazeDiggingExecutionContent } from "../execution/execution.content";
import type { MazeDiggingCheckContent, MazeDiggingCheckQuestion } from "./check.types";

/**
 * 基準データ §3 フェーズ3。2026-11-17 の判断基準（問題数ではなく「アルゴリズムの
 * 流れを理解できていると判断するに足るか」）で監査し、連結2問から6問へ拡充した。
 * フェーズ4が前提とする流れの理解は次の5件で、既存2問は掘削1回分（部屋と間の壁、
 * dig-3 の場面）だけをカバーしていた。
 * - 最初の掘削でも、掘る先は現在マスから2マス先の部屋（新問 first-dig-room、dig-start の場面）
 * - 候補は「2マス先が盤内（外周を除く）で、まだ壁のままの部屋」の集合
 *   （新問 candidate-count、dig-3 の場面で候補を数える）
 * - 行き止まりでは、掘れる部屋のあるマスまで戻って掘り直す
 *   （新問 dead-end-next、dig-6 の場面）
 * - 全部の部屋を掘ると完成し、掘った回数は部屋の数 − 1
 *   （新問 completion-count、complete の場面）
 * 場面はフェーズ2のステップをステップIDで参照し、壁は複製しない。
 * 正解はすべて組み立て済みトレースから導く。次の行き先は乱数（choices）で
 * 決まるため一意に定まらず、方向は基準データ §6-6 のとおりタップ設問の
 * 問題文の中で提示する。
 */
const run = runMazeDigging(mazeDiggingMainSize, mazeDiggingMainChoices);
const first = run.digs[0];
const next = run.digs[3];
const backtrack = mazeDiggingBacktracks(run.digs)[0];
const directionLabels: Record<string, string> = { up: "上", right: "右", down: "下", left: "左" };
/** 座標の表示は、コードの grid[y][x] の添字順に合わせ (y, x) とする（Issue #326）。 */
const coordinate = (key: MazeCellKey) => {
  const { x, y } = parseMazeCellKey(key);
  return `(${y}, ${x})`;
};
const directionOf = (from: MazeCellKey, room: MazeCellKey) => mazeDiggingDirections.find(
  (direction) => {
    const { x, y } = parseMazeCellKey(from);
    return mazeCellKey(x + 2 * direction.x, y + 2 * direction.y) === room;
  },
);
/**
 * その場面でアルゴリズムが実際に集める候補（現在マスから2マス先が盤内で、
 * まだ壁のままの部屋。提示順（上・右・下・左）のまま並べる）と、候補方向
 * それぞれの間の壁マス。掘削で通路になるのはこの範囲だけ。
 */
const candidatesAt = (stepId: string, from: MazeCellKey) => {
  const walls = new Set(getLearningStep(mazeDiggingExecutionContent, stepId).canvas.state.walls);
  const { x, y } = parseMazeCellKey(from);
  const directions = mazeDiggingDirections.filter((direction) => {
    const key = mazeCellKey(x + 2 * direction.x, y + 2 * direction.y);
    const nextCell = parseMazeCellKey(key);
    return nextCell.x >= 1 && nextCell.x < mazeDiggingMainSize - 1
      && nextCell.y >= 1 && nextCell.y < mazeDiggingMainSize - 1 && walls.has(key);
  });
  return {
    rooms: directions.map((direction) => mazeCellKey(x + 2 * direction.x, y + 2 * direction.y)),
    betweens: directions.map((direction) => mazeCellKey(x + direction.x, y + direction.y)),
  };
};
const firstCandidates = candidatesAt("dig-start", first.from);
const sceneCandidates = candidatesAt("dig-3", next.from);
const firstDirection = directionOf(first.from, first.room);
const nextDirection = directionOf(next.from, next.room);
const deadEndRoom = backtrack.poppedRooms[0];

export const mazeDiggingCheckContent: MazeDiggingCheckContent = {
  version: 1, kind: "concept-check", id: "maze-digging-check", phase: 3, stageName: "動きの確認問題",
  questions: [
    {
      id: "first-dig-room",
      prompt: `${coordinate(first.from)} から${firstDirection ? directionLabels[firstDirection.name] : ""}へ掘ります。掘られる部屋はどれですか`,
      stepId: "dig-start",
      nodeIds: firstCandidates.rooms, allowNone: false,
      correctAnswer: { kind: "node", nodeId: first.room }, requires: null,
      reviewStepIds: ["dig-start", "dig-1"], tags: ["dig-target"],
    },
    {
      id: "next-room",
      prompt: `${coordinate(next.from)} から${nextDirection ? directionLabels[nextDirection.name] : ""}へ掘ります。掘られる部屋はどれですか`,
      stepId: "dig-3",
      nodeIds: sceneCandidates.rooms, allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.room }, requires: null,
      reviewStepIds: ["dig-3", "dig-4"], tags: ["dig-target"],
    },
    {
      id: "between-wall",
      prompt: "そのとき通路になる、間の壁マスはどれですか",
      stepId: "dig-3",
      nodeIds: sceneCandidates.betweens, allowNone: false,
      correctAnswer: { kind: "node", nodeId: next.between },
      requires: { questionId: "next-room", answer: { kind: "node", nodeId: next.room } },
      reviewStepIds: ["dig-3", "dig-4"], tags: ["dig-between"],
    },
    {
      kind: "choice",
      id: "candidate-count",
      prompt: `${coordinate(next.from)} から掘れる部屋は、いくつありますか`,
      stepId: "dig-3",
      choices: [
        { id: "two", text: "2つ" },
        { id: "three", text: "3つ" },
        { id: "four", text: "4つ" },
      ],
      correctAnswer: { kind: "choice", choiceId: "three" }, requires: null,
      reviewStepIds: ["dig-3", "dig-4"], tags: ["dig-candidates"],
    },
    {
      kind: "choice",
      id: "dead-end-next",
      prompt: `行き止まりの ${coordinate(deadEndRoom)} では、この後どうなりますか`,
      stepId: "dig-6",
      choices: [
        { id: "resume-digging", text: `掘れる部屋がある ${coordinate(backtrack.resumeRoom)} まで戻って、そこから掘り直す` },
        { id: "dig-through", text: "隣の壁を掘って、そのまま進み続ける" },
        { id: "restart-from-start", text: "スタートの (1, 1) まで戻って、最初から掘り直す" },
        { id: "finish-here", text: "掘るのをやめて、この盤面で完成とする" },
      ],
      correctAnswer: { kind: "choice", choiceId: "resume-digging" }, requires: null,
      reviewStepIds: ["dig-6", "backtrack-1", "dig-7"], tags: ["backtrack-resume"],
    },
    {
      kind: "choice",
      id: "completion-count",
      prompt: "スタートの部屋 (1, 1) は最初に掘ってあります。それ以外の部屋を掘った回数は、全部で何回ですか",
      stepId: "complete",
      choices: [
        { id: "fifteen", text: "15回" },
        { id: "sixteen", text: "16回" },
        { id: "thirty-one", text: "31回" },
      ],
      correctAnswer: { kind: "choice", choiceId: "fifteen" }, requires: null,
      reviewStepIds: ["complete"], tags: ["dig-count"],
    },
  ],
  completion: {
    stepId: "dig-4",
    caption: "次に掘る部屋と、通路になる間の壁を追えたので、次は、図の動きとコードの対応を確かめます。",
  },
};

/**
 * 設問の場面。すべての設問で場面ステップの canvas をそのまま返す（棒倒し法
 * フェーズ3と違い、前提設問の正解で処理中マスが移ることはないため、場面の
 * 差し替えはしない）。
 */
export function getMazeDiggingCheckScene(question: MazeDiggingCheckQuestion): MazeDiggingCanvasState {
  return getLearningStep(mazeDiggingExecutionContent, question.stepId).canvas;
}

validateAssessment(mazeDiggingCheckContent);
for (const question of mazeDiggingCheckContent.questions) {
  getLearningStep(mazeDiggingExecutionContent, question.stepId);
  question.reviewStepIds.forEach((id) => getLearningStep(mazeDiggingExecutionContent, id));
  validateMazeDiggingCanvas(getMazeDiggingCheckScene(question));
}
getLearningStep(mazeDiggingExecutionContent, mazeDiggingCheckContent.completion.stepId);
// 基準データ §3 の確定事項（1回目: (1,1) から右へ (3,1)・間の壁 (2,1)、4回目: キー "5,3" から
// 右へ "7,3"・間の壁 "6,3"、候補は3つ、最初のバックトラックは (5,1) から (7,3) へ再開、
// 掘削は全15回）と教材の正解がずれたら落とす。
const dig3Scene = getLearningStep(mazeDiggingExecutionContent, "dig-3");
if (dig3Scene.canvas.state.processing !== next.from
  || first.from !== "1,1" || firstDirection?.name !== "right" || first.room !== "3,1" || first.between !== "2,1"
  || firstCandidates.rooms.join("|") !== "3,1|1,3"
  || next.from !== "5,3" || nextDirection?.name !== "right" || next.room !== "7,3" || next.between !== "6,3"
  || sceneCandidates.rooms.length !== 3
  || backtrack.afterDigIndex !== 5 || deadEndRoom !== "5,1" || backtrack.resumeRoom !== "7,3"
  || backtrack.poppedRooms.join(",") !== "5,1,7,1"
  || run.digs.length !== 15) {
  throw new Error("Maze-digging check answers must follow the verified trace");
}
