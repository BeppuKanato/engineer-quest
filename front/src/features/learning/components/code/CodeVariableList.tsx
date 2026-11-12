"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { playerTokens } from "../../player/player.tokens";

export type CodeVariableRow = { name: string; value: ReactNode; changed: boolean };

/** 差分計算は教材側で行い、この部品は値と変化の表示だけを担う。 */
export function CodeVariableList({ rows, density = "compact" }: { rows: readonly CodeVariableRow[]; density?: "compact" | "comfortable" }) {
  const comfortable = density === "comfortable";
  return <Box component="dl" aria-label="コードの変数" sx={{ mt: comfortable ? 2 : 1.5, mb: 0, display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)",
    columnGap: 1, rowGap: comfortable ? 0.5 : 0.25, fontFamily: "monospace", fontSize: comfortable ? "clamp(16px, 1vw, 18px)" : 16,
    ...(comfortable ? {} : { lineHeight: 1.3 }), color: playerTokens.text, flexShrink: 0 }}>
    {rows.map(({ name, value, changed }) => <Box key={name} sx={{ display: "contents" }}>
      <Box component="dt">{name} =</Box>
      <Box component="dd" data-variable={name} data-variable-changed={changed}
        sx={{ m: 0, px: 0.75, borderRadius: 1, justifySelf: "start", overflowWrap: "anywhere",
          bgcolor: changed ? playerTokens.focus : "transparent", color: changed ? playerTokens.surface : playerTokens.text, fontWeight: changed ? 700 : 400,
          transition: "background-color 600ms, color 600ms",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>{value}</Box>
    </Box>)}
  </Box>;
}
