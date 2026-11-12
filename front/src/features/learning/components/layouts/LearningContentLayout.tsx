"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { learningContentFrame, type LearningContentFrame } from "./learningContentFrame";

/** 単品では表示領域の84%、単元内では親が確保した領域を使う。 */
export function LearningContentLayout({ embedded = false, label, presentation = "visual", frame = "standard", rootLabel, children, overlay }: {
  embedded?: boolean;
  label: string;
  frame?: LearningContentFrame;
  rootLabel?: string;
  /** コード並べ替えだけは操作ボタンとコードの距離を制限する。 */
  presentation?: "visual" | "code-order";
  children: ReactNode;
  overlay?: ReactNode;
}) {
  const styles = learningContentFrame(embedded, frame);
  return <Box component={embedded ? "div" : "main"} aria-label={rootLabel} sx={styles.root}>
    <Box component="section" aria-label={label} sx={{ ...styles.section,
      ...(presentation === "code-order" ? { maxWidth: 1200, minHeight: 0, minWidth: 0 } : {}) }}>
      {children}
    </Box>
    {overlay}
  </Box>;
}
