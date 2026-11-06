import { Box, Typography } from "@mui/material";
import { MazeGridDrawing } from "../../player/MazeGridDrawing";
import { playerTokens } from "../../player/player.tokens";
import { wallExtensionImplementationContent as content } from "./implementation.content";
import { gridDifferences, isMazeGridValue, mazeGridCanvas } from "./implementation";

const labels = content.display;

/**
 * 戻り値の盤面を描く。期待する迷路と大きさが同じなら、期待と違うマスを
 * フォーカス青の枠で示し、件数を併記する（色だけに頼らない）。
 */
export function MazeGridOutput({ expected, actual, height = 210 }: { expected: unknown; actual: unknown; height?: number }) {
  if (!isMazeGridValue(actual)) return <Typography component="p" sx={{ fontSize: 16 }}>{labels.invalid}</Typography>;
  const differences = gridDifferences(expected, actual);
  return <>
    <Box sx={{ height, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}>
      <MazeGridDrawing canvas={mazeGridCanvas(actual, differences ?? [])} label="作られた迷路" />
    </Box>
    {differences === null
      ? <Typography component="p" sx={{ fontSize: 16 }}>{labels.sizeMismatch}</Typography>
      : differences.length > 0 && <Typography component="p" data-grid-different-count={differences.length} sx={{ fontSize: 16 }}>
          {labels.different.replace("{count}", String(differences.length))}
        </Typography>}
  </>;
}
