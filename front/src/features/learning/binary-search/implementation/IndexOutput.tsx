import { Box, Typography } from "@mui/material";
import { ArrayDrawing } from "../../player/ArrayDrawing";
import { playerTokens } from "../../player/player.tokens";
import { binarySearchImplementationContent as content } from "./implementation.content";
import { indexCanvas, isIndexValue } from "./implementation";

const labels = content.display;

/**
 * 戻り値の位置を、リストの図とともに示す。位置が範囲内なら、そのセルを
 * 処理中の青＋強調リングで示す（盤面型の found の写像と同じ。色だけに
 * 頼らず、位置の数値も併記する）。-1 は「見つからなかった」として図には
 * どのセルも指さずに示す。
 */
export function IndexOutput({ values, actual, height = 210 }: { values: readonly number[]; actual: unknown; height?: number }) {
  if (!isIndexValue(actual)) return <Typography component="p" sx={{ fontSize: 16 }}>{labels.invalid}</Typography>;
  const inRange = actual >= 0 && actual < values.length;
  return <>
    <Box sx={{ height, display: "flex", bgcolor: playerTokens.surface, border: "1px solid #e5e7eb", borderRadius: 1, my: 1 }}>
      <ArrayDrawing canvas={indexCanvas(values, actual)} label="探した結果のリスト" />
    </Box>
    {actual === -1
      ? <Typography component="p" data-index-not-found sx={{ fontSize: 16 }}>{labels.notFound}</Typography>
      : inRange
        ? <Typography component="p" data-index-position={actual} sx={{ fontSize: 16 }}>{labels.position.replace("{index}", String(actual))}</Typography>
        : <Typography component="p" sx={{ fontSize: 16 }}>{labels.outOfRange}</Typography>}
  </>;
}
