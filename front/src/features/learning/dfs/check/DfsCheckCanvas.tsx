"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { NodeAnswer } from "../../assessment/assessment";
import { answerCueSx, NodeAnswerOverlay } from "../../assessment/NodeAnswerOverlay";
import { graphGeometry } from "../../player/graphGeometry";
import { playerTokens } from "../../player/player.tokens";
import { DfsExecutionCanvas, dfsExecutionCanvasHeight } from "../execution/DfsExecutionCanvas";
import type { DfsExecutionCanvasState } from "../execution/execution.types";

export function DfsCheckCanvas({ canvas, questionId, nodeIds, allowNone = false, onAnswer, disabled = false }: {
  canvas: DfsExecutionCanvasState; questionId?: string; nodeIds?: readonly string[];
  allowNone?: boolean;
  onAnswer: (answer: NodeAnswer) => void; disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: graphGeometry.width, height: dfsExecutionCanvasHeight });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  // 「どれも入らない」の操作域を図の下に確保し、図の拡縮率は操作域を除いた高さで決める（BFSと同じ考え方）。
  const controlsHeight = questionId && allowNone ? 72 : 0;
  const scale = Math.max(0.1, Math.min(size.width / graphGeometry.width, (size.height - controlsHeight) / dfsExecutionCanvasHeight));
  const tapSize = Math.max(88, 44 / scale);
  return <Box ref={host} sx={{ flex: 1, minHeight: 320, minWidth: 0 }}>
    <Box role={questionId ? "group" : undefined} aria-label={questionId ? "回答の選択肢" : undefined}
      sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: graphGeometry.width * scale, height: dfsExecutionCanvasHeight * scale, flexShrink: 0 }}>
        <DfsExecutionCanvas canvas={canvas} highlightNodes={!questionId}
          renderNodeOverlay={questionId ? nodeId => nodeIds?.includes(nodeId)
            ? <NodeAnswerOverlay key={questionId} nodeId={nodeId} tapSize={tapSize} disabled={disabled} onAnswer={onAnswer} />
            : null : undefined} />
      </Box>
      {questionId && allowNone && <Box sx={{ height: controlsHeight, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Button type="button" disabled={disabled} startIcon={<TouchAppIcon sx={{ fontSize: 22 }} />}
          onClick={() => onAnswer({ kind: "none" })}
          sx={{ ...answerCueSx, minHeight: 48, px: 3, borderRadius: 999, bgcolor: playerTokens.layers.layer0,
            color: playerTokens.text, fontSize: 17, fontWeight: 700, textTransform: "none",
            "&::before": { ...answerCueSx["&::before"], inset: 0 },
            "& .MuiButton-startIcon": { color: playerTokens.focus, mr: 1, ml: 0 },
            "&:hover": { bgcolor: playerTokens.layers.layer1 } }}>どれも入らない</Button>
      </Box>}
    </Box>
  </Box>;
}
