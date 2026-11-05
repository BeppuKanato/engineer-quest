"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import type { CodeMappingCanvasState } from "./codeMapping.types";

const scalar = (value: string | number | null) => value === null ? "—" : typeof value === "string" ? `'${value}'` : String(value);

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
  // フェーズ2のSVGがこの表示枠で占める実寸を保持し、コードをその右へ追加する。
  // 狭い画面では図を縮小したり上下へ並べ替えず、この領域だけを横スクロールする。
  const graphWidth = Math.min(size.width, size.height * 600 / 450);
  const codeWidth = Math.max(480, size.width - graphWidth);
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  const rows = [
    ["start", scalar(variables.start)], ["node", scalar(variables.node)],
    ["distances[node]", scalar(variables.nodeDistance)], ["neighbor", scalar(variables.neighbor)],
    ["distances[neighbor]", scalar(variables.neighborDistance)],
    ["queue", variables.queue === null ? "—" : `[${variables.queue.map(scalar).join(", ")}]`],
    ["distances", variables.distances === null ? "—" : `{${Object.entries(variables.distances).map(([id, distance]) => `'${id}': ${distance}`).join(", ")}}`],
  ];

  return <Box ref={host} role="group" aria-label="BFSの図とコードの対応" data-frame-id={canvas.state.executionStepId}
    sx={{ width: "100%", height: "100%", overflowX: "auto", overflowY: "hidden" }}>
    <Box sx={{ width: graphWidth + codeWidth, height: "100%", display: "flex" }}>
      <Box data-code-graph sx={{ width: graphWidth, height: "100%", flexShrink: 0 }}>
        <BfsExecutionCanvas canvas={execution} />
      </Box>
      <Box sx={{ width: codeWidth, px: 1, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0, overflowY: "auto" }}>
        <Box component="ol" aria-label="bfs_distancesのコード" sx={{ m: 0, p: 0, listStyle: "none", flexShrink: 0,
          fontFamily: "monospace", fontSize: "clamp(12px, 0.9vw, 16px)", lineHeight: 1.8 }}>
          {canvas.data.code.lines.map((line, index) => {
            const active = line.id === activeLineId;
            return <Box component="li" key={line.id} data-code-line-id={line.id} aria-current={active ? "step" : undefined}
              sx={{ display: "flex", whiteSpace: "pre", color: active ? playerTokens.surface : playerTokens.text,
                bgcolor: active ? playerTokens.focus : "transparent", opacity: active ? 1 : 0.3,
                transition: "background-color 600ms, opacity 600ms", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
              <Box component="span" aria-hidden sx={{ width: "3ch", pr: 1, textAlign: "right", flexShrink: 0 }}>{index + 1}</Box>
              <Box component="code">{line.text}</Box>
            </Box>;
          })}
        </Box>
        <Box component="dl" aria-label="コードの変数" sx={{ mt: 2, mb: 0, display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)",
          columnGap: 1, rowGap: 0.5, fontFamily: "monospace", fontSize: "clamp(12px, 0.9vw, 16px)", color: playerTokens.text, flexShrink: 0 }}>
          {rows.map(([name, value]) => <Box key={name} sx={{ display: "contents" }}>
            <Box component="dt">{name} =</Box>
            <Box component="dd" data-variable={name} sx={{ m: 0, overflowWrap: "anywhere" }}>{value}</Box>
          </Box>)}
        </Box>
      </Box>
    </Box>
  </Box>;
}
