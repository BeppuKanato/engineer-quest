"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box } from "@mui/material";
import { graphGeometry } from "../player/graphGeometry";
import { playerTokens } from "../player/player.tokens";
import type { NodeAnswer } from "./assessment";

// 正解や処理状態ではなく、すべての回答候補に同じ操作の手がかりを付ける。
export const answerCueSx = {
  position: "relative",
  "&::before": {
    content: '""', position: "absolute", pointerEvents: "none",
    border: `${graphGeometry.ringStrokeWidth}px dashed ${playerTokens.focus}`,
    borderRadius: "inherit",
    animation: "answer-cue 700ms ease-in-out 2",
  },
  "@keyframes answer-cue": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
  "&:hover::before, &:focus-visible::before": { borderWidth: 5, animation: "none", opacity: 1 },
  "&:focus-visible": { outline: "none" },
  "@media (prefers-reduced-motion: reduce)": { "&::before": { animation: "none" } },
} as const;

/** 共通ノード座標に重ねる回答操作面。図の寸法・状態色には触れない。 */
export function NodeAnswerOverlay({ nodeId, tapSize, onAnswer, disabled = false }: {
  nodeId: string; tapSize: number; onAnswer: (answer: NodeAnswer) => void; disabled?: boolean;
}) {
  const ringInset = (tapSize - graphGeometry.ringRadius * 2) / 2;
  return <foreignObject x={-tapSize / 2} y={-tapSize / 2} width={tapSize} height={tapSize}>
    <Box component="button" type="button" aria-label={`${nodeId}を選ぶ`} disabled={disabled}
      onClick={() => onAnswer({ kind: "node", nodeId })}
      sx={{ ...answerCueSx, width: "100%", height: "100%", display: "block", p: 0, border: 0,
        borderRadius: "50%", background: "transparent", cursor: "pointer", touchAction: "manipulation",
        "&::before": { ...answerCueSx["&::before"], inset: ringInset },
        "&:active::before": { borderWidth: 5, opacity: 1 },
      }}>
      <TouchAppIcon aria-hidden sx={{ position: "absolute", top: ringInset + 1, right: ringInset - 1, fontSize: 19,
        bgcolor: playerTokens.surface, borderRadius: "50%", color: playerTokens.focus, pointerEvents: "none" }} />
    </Box>
  </foreignObject>;
}
