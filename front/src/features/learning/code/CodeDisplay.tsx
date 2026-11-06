"use client";

import { Box } from "@mui/material";
import { playerTokens } from "../player/player.tokens";

export type CodeBlank = { readonly lineId: string; readonly start: number; readonly length: number };

/** コード本文を変換せずに表示する、BFS/DFS共通の行ハイライト・空欄表示。 */
export function CodeDisplay({ code, label, activeLineId, blank, lineHeight = 1.8 }: {
  code: { readonly lines: readonly { readonly id: string; readonly text: string }[] };
  label: string; activeLineId?: string; blank?: CodeBlank; lineHeight?: number;
}) {
  return <Box component="ol" aria-label={label} sx={{ m: 0, p: 0, listStyle: "none", flexShrink: 0,
    fontFamily: "monospace", fontSize: "clamp(16px, 1vw, 18px)", lineHeight }}>
    {code.lines.map((line, index) => {
      const active = line.id === activeLineId;
      const hole = blank?.lineId === line.id ? blank : undefined;
      return <Box component="li" key={line.id} data-code-line-id={line.id} aria-current={active ? "step" : undefined}
        sx={{ display: "flex", whiteSpace: "pre", color: active ? playerTokens.surface : playerTokens.text,
          bgcolor: active ? playerTokens.focus : "transparent", opacity: !activeLineId || active ? 1 : 0.55,
          transition: "background-color 600ms, opacity 600ms", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
        <Box component="span" aria-hidden sx={{ width: "3ch", pr: 1, textAlign: "right", flexShrink: 0 }}>{index + 1}</Box>
        <Box component="code">{hole ? <>{line.text.slice(0, hole.start)}<Box component="span" role="img" aria-label="空欄"
          sx={{ display: "inline-block", minWidth: "6ch", lineHeight: 1.5, textAlign: "center", color: playerTokens.focus,
            bgcolor: playerTokens.surface, border: `2px dashed ${playerTokens.focus}`, borderRadius: 1 }}>____</Box>{line.text.slice(hole.start + hole.length)}</> : line.text}</Box>
      </Box>;
    })}
  </Box>;
}
