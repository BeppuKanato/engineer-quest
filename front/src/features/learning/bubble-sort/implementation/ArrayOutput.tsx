import { Box, Typography } from "@mui/material";
import { ArrayDrawing } from "../../player/ArrayDrawing";
import { playerTokens } from "../../player/player.tokens";
import { bubbleSortImplementationContent as content } from "./implementation.content";
import { arrayBarsCanvas, arrayDifferences, isDrawableArrayValue } from "./implementation";

const labels = content.display;

/**
 * 戻り値のリストを棒グラフで描く。期待する並びと長さが同じなら、期待と違う場所を
 * フォーカス青の枠で示し、件数を併記する（色だけに頼らない）。
 */
export function ArrayOutput({ expected, actual, height = 210 }: { expected: unknown; actual: unknown; height?: number }) {
  if (!isDrawableArrayValue(actual)) return <Typography component="p" sx={{ fontSize: 16 }}>{labels.invalid}</Typography>;
  const differences = arrayDifferences(expected, actual);
  return <>
    <Box sx={{ height, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}>
      <ArrayDrawing canvas={arrayBarsCanvas(actual, differences ?? [])} label="作られた並び" />
    </Box>
    {differences === null
      ? <Typography component="p" sx={{ fontSize: 16 }}>{labels.lengthMismatch}</Typography>
      : differences.length > 0 && <Typography component="p" data-array-different-count={differences.length} sx={{ fontSize: 16 }}>
          {labels.different.replace("{count}", String(differences.length))}
        </Typography>}
  </>;
}
