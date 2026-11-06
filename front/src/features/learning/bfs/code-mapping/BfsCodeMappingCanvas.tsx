"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { BfsCodeDisplay } from "./BfsCodeDisplay";
import { bfsCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { CodeMappingCanvasState } from "./codeMapping.types";

export function BfsCodeMappingCanvas({ canvas }: { canvas: CodeMappingCanvasState }) {
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
  // 文字の可読性を優先してコード幅を確保し、図は共通SVGの比率を保って縮小する。
  // 390px級では図＋コード領域内だけの横スクロールを維持する。
  const codeWidth = Math.max(620, size.width * 0.48);
  const graphWidth = Math.max(Math.min(size.width, 480), size.width - codeWidth);
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = bfsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = bfsCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);

  return <Box ref={host} role="group" aria-label="BFSの図とコードの対応" data-frame-id={canvas.state.executionStepId}
    sx={{ width: "100%", height: "100%", overflowX: "auto", overflowY: "hidden" }}>
    <Box sx={{ width: graphWidth + codeWidth, height: "100%", display: "flex" }}>
      <Box data-code-graph sx={{ width: graphWidth, height: "100%", flexShrink: 0 }}>
        <BfsExecutionCanvas canvas={execution} />
      </Box>
      <Box sx={{ width: codeWidth, px: 1, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "safe center", minHeight: 0, overflowY: "auto" }}>
        <BfsCodeDisplay code={canvas.data.code} activeLineId={activeLineId} />
        <Box component="dl" aria-label="コードの変数" sx={{ mt: 2, mb: 0, display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)",
          columnGap: 1, rowGap: 0.5, fontFamily: "monospace", fontSize: "clamp(16px, 1vw, 18px)", color: playerTokens.text, flexShrink: 0 }}>
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
