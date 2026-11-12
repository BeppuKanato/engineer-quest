import { Box, Typography } from "@mui/material";
import { GreedyCoinsDrawing } from "../figure/GreedyCoinsDrawing";
import { playerTokens } from "../../../player/player.tokens";
import { greedyCoinsImplementationContent as content } from "./implementation.content";
import { coinListDifferences, coinTrayCanvas, isCoinListValue } from "./implementation";

const labels = content.display;

/**
 * 戻り値の硬貨リストを示す。トレイとして描ける並び（額面に含まれ、選択順で、
 * 合計が金額以下）は硬貨図のトレイで示し、それ以外は文字列の並びで示す。
 * 期待と長さが同じなら、期待と違う場所の件数を併記する（色だけに頼らない）。
 */
export function CoinListOutput({ expected, actual, amount, coins, height = 300 }: {
  expected: unknown; actual: unknown; amount: number; coins: readonly number[]; height?: number;
}) {
  if (!isCoinListValue(actual)) return <Typography component="p" sx={{ fontSize: 16 }}>{labels.invalid}</Typography>;
  const differences = coinListDifferences(expected, actual);
  const canvas = coinTrayCanvas(amount, coins, actual);
  return <>
    {canvas
      ? <Box sx={{ height, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}>
          <GreedyCoinsDrawing canvas={canvas} label="選んだ硬貨のトレイ" />
        </Box>
      : <Typography component="p" sx={{ fontSize: 16, fontFamily: "monospace", my: 1 }}>[{actual.join(", ")}]（{actual.length}枚）</Typography>}
    {differences === null
      ? <Typography component="p" sx={{ fontSize: 16 }}>{labels.lengthMismatch}</Typography>
      : differences.length > 0 && <Typography component="p" data-coin-different-count={differences.length} sx={{ fontSize: 16 }}>
          {labels.different.replace("{count}", String(differences.length))}
        </Typography>}
  </>;
}
