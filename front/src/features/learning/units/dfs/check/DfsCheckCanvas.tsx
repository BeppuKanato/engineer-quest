"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { NodeAnswer } from "../../../assessment/assessment";
import { NodeAnswerOverlay } from "../../../assessment/NodeAnswerOverlay";
import { graphGeometry } from "../../../player/graphGeometry";
import { DfsExecutionCanvas, dfsExecutionCanvasHeight } from "../execution/DfsExecutionCanvas";
import type { DfsExecutionCanvasState } from "../execution/execution.types";

export function DfsCheckCanvas({ canvas, questionId, nodeIds, onAnswer, disabled = false }: {
  canvas: DfsExecutionCanvasState; questionId?: string; nodeIds?: readonly string[];
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
  const scale = Math.max(0.1, Math.min(size.width / graphGeometry.width, size.height / dfsExecutionCanvasHeight));
  const tapSize = Math.max(88, 44 / scale);
  return <Box ref={host} sx={{ flex: 1, minHeight: 320, minWidth: 0 }}>
    <Box role={questionId ? "group" : undefined} aria-label={questionId ? "回答の選択肢" : undefined}
      sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: graphGeometry.width * scale, height: dfsExecutionCanvasHeight * scale, flexShrink: 0 }}>
        <DfsExecutionCanvas canvas={canvas} highlightNodes={!questionId}
          renderNodeOverlay={questionId ? nodeId => nodeIds?.includes(nodeId)
            ? <NodeAnswerOverlay key={questionId} nodeId={nodeId} tapSize={tapSize} disabled={disabled} onAnswer={onAnswer} />
            : null : undefined} />
      </Box>
    </Box>
  </Box>;
}
