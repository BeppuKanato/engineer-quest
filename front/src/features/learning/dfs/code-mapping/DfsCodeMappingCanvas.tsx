"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { CodeDisplay } from "../../code/CodeDisplay";
import { playerTokens } from "../../player/player.tokens";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import { dfsCodeMappingContent } from "./codeMapping.content";
import { codeExecutionView, codeVariableRows } from "./codeMapping.presentation";
import type { DfsCodeMappingCanvasState } from "./codeMapping.types";

export function DfsCodeMappingCanvas({ canvas }: { canvas: DfsCodeMappingCanvasState }) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width > 0) setWidth(entry.contentRect.width); });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const codeWidth = Math.max(620, width * 0.52);
  const graphWidth = Math.max(Math.min(width, 480), width - codeWidth);
  const index = dfsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const rows = codeVariableRows(canvas.state.variables, dfsCodeMappingContent.steps[index - 1]?.canvas.state.variables);
  return <Box ref={host} role="group" aria-label="DFSの図とコードの対応" data-frame-id={canvas.state.executionStepId}
    sx={{ width: "100%", height: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden" }}>
    <Box sx={{ width: graphWidth + codeWidth, height: "100%", display: "flex" }}>
      <Box data-code-graph sx={{ width: graphWidth, height: "100%", flexShrink: 0 }}>
        <DfsExecutionCanvas canvas={canvas.state.execution} view={codeExecutionView(canvas)} />
      </Box>
      <Box data-code-panel sx={{ width: codeWidth, px: 1, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "safe center", minHeight: 0, overflowY: "auto" }}>
        {/* コードだけを横スクロールさせる（フェーズ5と同じ割り付け）。max-content でコード本来の幅を
            スクロール量へ反映し、列幅に切り取られて末尾へ辿れない状態を防ぐ（#301）。 */}
        <Box sx={{ width: "100%", overflowX: "auto", flexShrink: 0 }}>
          <Box sx={{ width: "max-content", minWidth: "100%" }}>
            <CodeDisplay code={canvas.data.code} label="dfs_orderのコード" activeLineId={canvas.highlights[0].id} lineHeight={1.65} />
          </Box>
        </Box>
        <Box component="dl" aria-label="コードの変数" sx={{ mt: 1.5, mb: 0, display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)",
          columnGap: 1, rowGap: 0.25, fontFamily: "monospace", fontSize: 16, lineHeight: 1.3, color: playerTokens.text, flexShrink: 0 }}>
          {rows.map(({ name, value, changed }) => <Box key={name} sx={{ display: "contents" }}>
            <Box component="dt">{name} =</Box>
            <Box component="dd" data-variable={name} data-variable-changed={changed}
              sx={{ m: 0, px: 0.75, borderRadius: 1, justifySelf: "start", overflowWrap: "anywhere",
                bgcolor: changed ? playerTokens.focus : "transparent", color: changed ? playerTokens.surface : playerTokens.text,
                fontWeight: changed ? 700 : 400, transition: "background-color 600ms, color 600ms",
                "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>{value}</Box>
          </Box>)}
        </Box>
      </Box>
    </Box>
  </Box>;
}
