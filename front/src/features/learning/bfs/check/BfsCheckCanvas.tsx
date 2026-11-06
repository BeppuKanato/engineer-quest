"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import type { NodeAnswer } from "../../assessment/assessment";
import { graphGeometry } from "../../player/graphGeometry";
import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import type { BfsExecutionCanvasState } from "../execution/execution.types";

// 正解や処理状態ではなく、すべての回答候補に同じ操作の手がかりを付ける。
const answerCueSx = {
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

/** 図と回答操作を同じキャンバスへまとめる。画面下端へ操作を押し出さない。 */
export function BfsCheckCanvas({ canvas, questionId, nodeIds, allowNone = false, onAnswer, disabled = false }: {
  canvas: BfsExecutionCanvasState;
  questionId?: string;
  nodeIds?: readonly string[];
  allowNone?: boolean;
  onAnswer: (answer: NodeAnswer) => void;
  /** 正解後は選び直せないよう入力を固定する。 */
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 530 });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // 単元コンテナが過去フェーズを非表示にしても、最後の縮尺を維持する。
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  // HTMLの回答ボタンは小画面でも48px以上を保つ。図は座標を変えず等倍比で拡縮する。
  const controlsHeight = 80;
  const scale = Math.max(0.1, Math.min(size.width / graphGeometry.width, (size.height - controlsHeight) / graphGeometry.height));
  const actionHeight = controlsHeight / scale;
  const tapSize = Math.max(88, 44 / scale);
  return <Box ref={host} sx={{ flex: 1, minHeight: 320, minWidth: 0 }}>
    <Box role={questionId ? "group" : undefined} aria-label={questionId ? "回答の選択肢" : undefined}
      sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: graphGeometry.width * scale, height: graphGeometry.height * scale + controlsHeight, flexShrink: 0 }}>
        <BfsExecutionCanvas canvas={canvas} highlightNodes={!questionId}
          graphAction={{ height: actionHeight, content: <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {questionId && allowNone && <Button key={questionId} type="button" disabled={disabled} startIcon={<TouchAppIcon sx={{ fontSize: `${22 / scale}px !important` }} />}
              onClick={() => onAnswer({ kind: "none" })}
              sx={{ ...answerCueSx, minHeight: 48 / scale, px: `${24 / scale}px`, borderRadius: 999, bgcolor: playerTokens.layers.layer0,
                color: playerTokens.text, fontSize: Math.min(20, Math.max(16, size.width * 0.015)) / scale, fontWeight: 700,
                "&::before": { ...answerCueSx["&::before"], inset: 0 },
                "& .MuiButton-startIcon": { color: playerTokens.focus, mr: `${8 / scale}px`, ml: 0 },
                "&:hover": { bgcolor: playerTokens.layers.layer1 },
              }}>どれも入らない</Button>}
          </Box> }}
          renderNodeOverlay={questionId ? (nodeId) => {
            if (!nodeIds?.includes(nodeId)) return null;
            // ノード自体の共通寸法は変えず、透明な操作面だけを広げる。
            const size = tapSize;
            const ringInset = (size - graphGeometry.ringRadius * 2) / 2;
            return <foreignObject key={questionId} x={-size / 2} y={-size / 2} width={size} height={size}>
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
          } : undefined} />
      </Box>
    </Box>
  </Box>;
}
