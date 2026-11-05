import { Box } from "@mui/material";
import { playerTokens } from "../../player/player.tokens";
import { bfsImplementationContent as content } from "./implementation.content";
import { distanceEntries, isDistanceMap } from "./implementation";

const labels = content.display;
export const formatDistance = (value: unknown) => typeof value === "number" ? `${value}${labels.unit}` : typeof value === "string" ? `「${value}」（${labels.invalidValue}）` : labels.invalidValue;
export function DistanceOutput({ expected, actual }: { expected: unknown; actual: unknown }) {
  if (!isDistanceMap(actual)) return labels.invalid;
  return <>{distanceEntries(expected, actual).map(entry => <Box component="span" key={entry.node} data-distance-state={entry.state}
    sx={{ display: "inline-block", mr: 1, fontWeight: entry.state === "same" ? 400 : 700,
      borderBottom: entry.state === "same" ? "none" : `2px solid ${playerTokens.focus}` }}>
    {entry.node}：{entry.state === "missing" ? labels.missing : formatDistance(entry.actual)}
    {entry.state === "different" ? `（${labels.different}・${labels.expectedLabel} ${formatDistance(entry.expected)}）` : entry.state === "extra" ? `（${labels.extra}）` : ""}
  </Box>)}</>;
}
