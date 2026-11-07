"use client";

import Box from "@mui/material/Box";

import { ArrayDrawing } from "../../player/ArrayDrawing";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import type { PlayerStatus } from "../../player/player.tokens";
import type { BinarySearchCellStatus, BinarySearchExecutionCanvasState } from "./execution.types";

/**
 * 単元側のセル状態からプレイヤートークンへの写像（基準データ §4）。
 * 範囲外は完了グレー相当、範囲内は未処理の白、中央と発見は処理中の青
 * （達成を示す青。BFS の到達図と同じ使い方）。発見は強調リングで中央と区別する。
 */
const cellStatusToPlayerStatus: Record<BinarySearchCellStatus, PlayerStatus> = {
  discarded: "completed",
  "in-range": "idle",
  center: "processing",
  found: "processing",
};

/**
 * 盤面を共通配列基盤の形へ変換する。状態の意味は単元側の盤面型が持ち、
 * 描画は ArrayDrawing へ委譲する（cellStatuses 拡張でセルごとの色を決める）。
 * フェーズ4は同じ snapshot と renderer を、トレース変換は同じ盤面型を使う。
 */
function toArrayBars(canvas: BinarySearchExecutionCanvasState): ArrayBarsCanvasState {
  const { values, cells } = canvas.state;
  return {
    data: { kind: "array-bars" },
    state: {
      values,
      comparing: null,
      fixedFrom: values.length,
      cellStatuses: cells.map((status) => cellStatusToPlayerStatus[status]),
    },
    highlights: canvas.highlights,
  };
}

/** フェーズ2の見た目を描く。描画そのものは共通配列基盤へ委譲し、ここでは配列の読み（aria ラベル）だけを持つ。 */
export function BinarySearchExecutionCanvas({ canvas }: { canvas: BinarySearchExecutionCanvasState }) {
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      <ArrayDrawing canvas={toArrayBars(canvas)} label={`${canvas.state.values.length}つの並んだ数字から${canvas.state.target}を探す様子`} />
    </Box>
  );
}
