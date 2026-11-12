"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** 図とコードの配分・スクロールだけを持つ。教材の状態や行の意味は受け取らない。 */
export function CodeMappingLayout({ label, frameId, graph, code, variables, codeFraction = 0.48, widthOnly = false, containedWidth = false }: {
  label: string;
  frameId: string;
  graph: ReactNode;
  code: ReactNode;
  variables: ReactNode;
  codeFraction?: number;
  /** 高さに制約のない既存の表示にも幅観測を接続する。 */
  widthOnly?: boolean;
  containedWidth?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && (widthOnly || entry.contentRect.height > 0)) setWidth(entry.contentRect.width);
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [widthOnly]);
  const codeWidth = Math.max(620, width * codeFraction);
  const graphWidth = Math.max(Math.min(width, 480), width - codeWidth);
  return <Box ref={host} role="group" aria-label={label} data-frame-id={frameId}
    sx={{ width: "100%", height: "100%", ...(containedWidth ? { minWidth: 0 } : {}), overflowX: "auto", overflowY: "hidden" }}>
    <Box sx={{ width: graphWidth + codeWidth, height: "100%", display: "flex" }}>
      <Box data-code-graph sx={{ width: graphWidth, height: "100%", flexShrink: 0 }}>{graph}</Box>
      <Box data-code-panel sx={{ width: codeWidth, px: 1, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "safe center", minHeight: 0, overflowY: "auto" }}>
        <Box sx={{ width: "100%", overflowX: "auto", flexShrink: 0 }}>
          <Box sx={{ width: "max-content", minWidth: "100%" }}>{code}</Box>
        </Box>
        {variables}
      </Box>
    </Box>
  </Box>;
}
