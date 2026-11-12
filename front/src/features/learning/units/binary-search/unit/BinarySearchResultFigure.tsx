"use client";

import { Box, Typography } from "@mui/material";

import { playerTokens } from "../../../player/player.tokens";
import { binarySearchMainTarget, binarySearchMainValues, binarySearchProbes, runBinarySearch } from "../binarySearch";
import { BinarySearchExecutionCanvas } from "../execution/BinarySearchExecutionCanvas";
import {
  validateBinarySearchExecutionCanvas,
  type BinarySearchCellStatus, type BinarySearchExecutionCanvasState,
} from "../execution/execution.types";

/**
 * 到達図：単元の完成図を結果画面に出す静的表示（二分探索は主教材で目的の値が見つかった盤面）。
 * 盤面は正本の実行記録（binarySearchProbes）から導出するので、図と教材の探索過程がずれることはない。
 * 最後の比較で残った範囲の中に発見セルを確定表示し、捨てた部分は範囲外として残す
 * （フェーズ2の「見つかりました」の盤面と同一の状態）。検証は単元側の盤面検証で行う（基準データ §4）。
 */
const values = binarySearchMainValues;
const target = binarySearchMainTarget;
const probes = binarySearchProbes(values, target);
const lastProbe = probes[probes.length - 1];
const foundIndex = runBinarySearch(values, target);
const foundCells: readonly BinarySearchCellStatus[] = values.map((_, index) => {
  if (index === foundIndex) return "found";
  if (index < lastProbe.lo || index > lastProbe.hi) return "discarded";
  return "in-range";
});
const foundBoard: BinarySearchExecutionCanvasState = {
  data: { kind: "binary-search-execution" },
  state: { values, target, lo: lastProbe.lo, hi: lastProbe.hi, mid: lastProbe.mid, cells: foundCells },
  highlights: [{ kind: "cell", id: foundIndex }],
};
validateBinarySearchExecutionCanvas(foundBoard);

export function BinarySearchResultFigure() {
  return <Box data-result-figure sx={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
    <Box sx={{ width: "100%", height: 300, position: "relative" }}>
      <BinarySearchExecutionCanvas canvas={foundBoard} />
    </Box>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14, color: playerTokens.text }}>
      この段階で見つけた数字（{target} はインデックス {foundIndex} にありました）
    </Typography>
  </Box>;
}
