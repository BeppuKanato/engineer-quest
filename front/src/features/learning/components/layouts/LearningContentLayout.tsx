"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { playerTokens } from "../../player/player.tokens";

/** 単品では表示領域の84%、単元内では親が確保した領域を使う。 */
export function LearningContentLayout({ embedded = false, label, presentation = "visual", children, overlay }: {
  embedded?: boolean;
  label: string;
  /** コード並べ替えだけは操作ボタンとコードの距離を制限する。 */
  presentation?: "visual" | "code-order";
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return <Box component={embedded ? "div" : "main"} sx={{ minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined, display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text }}>
    <Box component="section" aria-label={label}
      sx={{ width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh",
        minHeight: embedded ? 0 : 500, p: 1, display: "flex", flexDirection: "column",
        ...(presentation === "code-order" ? { maxWidth: 1200, minHeight: 0, minWidth: 0 } : {}) }}>
      {children}
    </Box>
    {overlay}
  </Box>;
}
