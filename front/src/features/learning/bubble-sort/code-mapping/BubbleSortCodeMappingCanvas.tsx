"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { CodeDisplay } from "../../code/CodeDisplay";
import { playerTokens } from "../../player/player.tokens";
import { BubbleSortExecutionCanvas } from "../execution/BubbleSortExecutionCanvas";
import { bubbleSortCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { BubbleSortCodeMappingCanvasState } from "./codeMapping.types";

export function BubbleSortCodeMappingCanvas({ canvas }: { canvas: BubbleSortCodeMappingCanvasState }) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 450 });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  // BFS・棒倒し法フェーズ4と同じ割り付け: コード幅を優先して確保し、図は比率を保って縮小する。
  const codeWidth = Math.max(620, size.width * 0.48);
  const graphWidth = Math.max(Math.min(size.width, 480), size.width - codeWidth);
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = bubbleSortCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = bubbleSortCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);

  return <Box ref={host} role="group" aria-label="バブルソートの図とコードの対応" data-frame-id={canvas.state.executionStepId}
    sx={{ width: "100%", height: "100%", overflowX: "auto", overflowY: "hidden" }}>
    <Box sx={{ width: graphWidth + codeWidth, height: "100%", display: "flex" }}>
      <Box data-code-graph sx={{ width: graphWidth, height: "100%", flexShrink: 0 }}>
        <BubbleSortExecutionCanvas canvas={execution} />
      </Box>
      <Box sx={{ width: codeWidth, px: 1, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "safe center", minHeight: 0, overflowY: "auto" }}>
        <CodeDisplay code={canvas.data.code} label="bubble_sortのコード" activeLineId={activeLineId} lineHeight={1.6} />
        <Box component="dl" aria-label="コードの変数" sx={{ mt: 1.5, mb: 0, display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)",
          columnGap: 1, rowGap: 0.25, fontFamily: "monospace", fontSize: 16, lineHeight: 1.3, color: playerTokens.text, flexShrink: 0 }}>
          {rows.map(({ name, value, changed }) => <Box key={name} sx={{ display: "contents" }}>
            <Box component="dt">{name} =</Box>
            <Box component="dd" data-variable={name} data-variable-changed={changed}
              sx={{ m: 0, px: 0.75, borderRadius: 1, justifySelf: "start", overflowWrap: "anywhere",
                bgcolor: changed ? playerTokens.focus : "transparent",
                color: changed ? playerTokens.surface : playerTokens.text, fontWeight: changed ? 700 : 400,
                transition: "background-color 600ms, color 600ms",
                "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>{value}</Box>
          </Box>)}
        </Box>
      </Box>
    </Box>
  </Box>;
}
