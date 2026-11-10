import { validateAssessment } from "../../assessment/assessment";
import { mazeCellKey, validateMazeGridCanvas, type MazeGridCanvasState } from "../../player/mazeGrid.types";
import { getLearningStep } from "../../review/reviewContent";
import {
  buildWallExtensionWalls, wallExtensionDirections, wallExtensionExtensions,
  wallExtensionSmallChoices, wallExtensionSmallSize,
} from "../wallExtensionMaze";
import { wallExtensionCode } from "../code-mapping/wallExtensionCode";
import { wallExtensionCodeMappingContent } from "../code-mapping/codeMapping.content";
import { wallExtensionExecutionContent } from "../execution/execution.content";
import type {
  WallExtensionConsolidationContent, WallExtensionGridTapQuestion,
} from "./consolidation.types";

/**
 * 基準データ §3 フェーズ6（転移タップ1問・選択2問・Parsons 1問）。
 * Q1の場面は転移用 7×7 の途中状態（2本目まで伸ばした盤面）を組み立てで作り、
 * 正解は検証済みトレースの3本目から導く。Q2・Q3の場面はフェーズ2の盤面を参照する。
 * 復習先はすべてフェーズ4（コードとの対応）のフレームで、新しい盤面の答え合わせは作らない。
 */
const transferExtensions = wallExtensionExtensions(wallExtensionSmallSize, wallExtensionSmallChoices);
const transfer = transferExtensions[2];
const transferWalls = buildWallExtensionWalls(wallExtensionSmallSize, wallExtensionSmallChoices, 2);
const transferWallSet = new Set(transferWalls);
const [transferX, transferY] = transfer.pillar.split(",").map(Number);
// Q1の回答対象はフェーズ3 Q2 と同じ考え方で、柱に隣接する未壁マスに限る。
const transferCandidates = Object.values(wallExtensionDirections)
  .map((delta) => mazeCellKey(transferX + delta.x, transferY + delta.y))
  .filter((key) => !transferWallSet.has(key));
const transferScene: MazeGridCanvasState = {
  data: { kind: "maze-grid", size: wallExtensionSmallSize },
  state: { walls: transferWalls, processing: transfer.pillar, target: null, path: [], start: null, goal: null },
  highlights: [],
};
const completedScene = getLearningStep(wallExtensionExecutionContent, "complete").canvas;
const lowerPillarScene = getLearningStep(wallExtensionExecutionContent, "extend-2-4").canvas;
const [firstFrame, ...remainingFrames] = wallExtensionCodeMappingContent.steps;

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
      correctAnswer: { kind: "node", nodeId: transfer.target }, requires: null,
      stepId: "execution-extend-4-4",
      reviewStepIds: ["for-extension-4-4", "lookup-delta-4-4", "execution-extend-4-4"],
      tags: ["壁が伸びる先の追跡"],
      instruction: "盤面のマスをタップして答える",
      correctFeedback: "正解。柱の右隣のマスが、新しい壁になります。",
      incorrectFeedback: "不正解。壁は、処理している柱から指示された方向へ1マス進んだ先に伸びます。",
    },
    {
      kind: "choice", id: "completed-maze-properties", prompt: "棒倒し法で作った迷路について、正しい説明はどれですか",
      scene: completedScene,
      choices: [
        { id: "connected-no-loops", text: "すべての通路がつながっていて、輪（ぐるりと回れる道）がない" },
        { id: "some-isolated", text: "一部の通路は、どこにもつながっていない" },
        { id: "has-loops", text: "輪（ぐるりと回れる道）がいくつかある" },
        { id: "more-walls-than-pillars", text: "伸ばした壁の数は、柱の数より多い" },
      ],
      correctAnswer: { kind: "choice", choiceId: "connected-no-loops" }, requires: null,
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
        { id: "prevents-loops", text: "上へ伸ばすと、輪（ぐるりと回れる道）ができることがあるため" },
        { id: "outside-board", text: "上のマスが、盤面の外になってしまうため" },
        { id: "already-wall", text: "上のマスは、いつもすでに壁になっているため" },
      ],
      correctAnswer: { kind: "choice", choiceId: "prevents-loops" }, requires: null,
      stepId: "if-first-row-2-4",
      reviewStepIds: ["if-first-row-2-4", "else-branch-2-4", "allowed-three-2-4"],
      tags: ["上に伸ばせない理由"],
      instruction: "理由を1つ選ぶ",
      correctFeedback: "正解。上の段の柱が伸ばした壁とつながって、輪ができることがあるためです。",
      incorrectFeedback: "不正解。コードでは一番上の段かどうかで伸ばせる方向を切り替えています。輪を防ぐための決まりです。",
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
      correctAnswer: { kind: "order", lineIds: wallExtensionCode.lines.map((line) => line.id) }, requires: null,
      // 外周の4つの書き込みは互いに独立で、順序を入れ替えても迷路は変わらない（BFSの初期化2行と同じ扱い）。
      interchangeableLineGroups: [["border-top", "border-bottom", "border-left", "border-right"]],
      // フェード型: 関数定義・盤面の初期化・外周ループと柱ループの枠・方向表・return は固定し、
      // 外周の書き込み、柱を立てる中身、壁を伸ばす判断の流れだけを並べ替える。入れ替え可能グループの行は固定しない。
      fixedLineIds: ["define-function", "initialize-grid", "for-border", "initialize-pillars", "for-pillar-row", "for-pillar-column", "define-directions", "return-grid"],
      stepId: firstFrame.id, reviewStepIds: [firstFrame.id, ...remainingFrames.map((frame) => frame.id)],
      tags: ["コード全体の流れ"],
      instruction: "色の薄い行は固定されています。残りの行をドラッグ、または↑↓ボタンで並び替える",
      correctFeedback: "正解。外側を囲み、柱を立て、柱から壁を伸ばして返すまでの流れを組み立てられました。",
      incorrectFeedback: "不正解。外側を囲む、柱を立てる、方向を決めて壁を書き込む、盤面を返す、という流れを確かめてみましょう。",
    },
  ],
};

export function validateWallExtensionConsolidation(content: WallExtensionConsolidationContent): void {
  validateAssessment(content);
  if (content.phase !== 6 || content.stageName !== "応用問題" || content.questions.length !== 4 || content.code !== wallExtensionCode) {
    throw new Error("Use four questions and the canonical code");
  }
  for (const question of content.questions) {
    getLearningStep(wallExtensionCodeMappingContent, question.stepId);
    question.reviewStepIds.forEach((id) => getLearningStep(wallExtensionCodeMappingContent, id));
    if (question.kind === "parsons") {
      const ids: readonly string[] = wallExtensionCode.lines.map((line) => line.id);
      if (question.lineIds.length !== ids.length || question.lineIds.some((id) => !ids.includes(id)) ||
        question.correctAnswer.lineIds.some((id, index) => id !== ids[index])) throw new Error("Parsons must use all canonical lines");
    } else {
      validateMazeGridCanvas(question.scene);
    }
  }
  // Q1は検証済みトレースの3本目と一致しなければならない（場面・方向・候補・正解）。
  const tap = content.questions[0] as WallExtensionGridTapQuestion;
  const expected = transferExtensions[2];
  if (tap.kind !== "node" || tap.scene.data.size !== wallExtensionSmallSize ||
    tap.scene.state.processing !== expected.pillar || tap.direction !== expected.direction ||
    tap.correctAnswer.kind !== "node" || tap.correctAnswer.nodeId !== expected.target ||
    new Set(tap.scene.state.walls).size !== transferWalls.length ||
    tap.scene.state.walls.some((key) => !transferWallSet.has(key)) ||
    tap.nodeIds.length !== transferCandidates.length || tap.nodeIds.some((id) => !transferCandidates.includes(id))) {
    throw new Error("Transfer question must follow the verified 7x7 trace");
  }
}
// 基準データ §3 の確定事項（7×7 の3本目: 柱 (2,4) から右へ (3,4)）と教材がずれたら落とす。
if (transfer.pillar !== "2,4" || transfer.direction !== "right" || transfer.target !== "3,4") {
  throw new Error("Wall-extension consolidation transfer must follow the verified trace");
}
validateWallExtensionConsolidation(wallExtensionConsolidationContent);
