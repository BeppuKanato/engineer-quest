"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

/** 本文だけを縦スクロールさせ、前進操作を本文の外に保つ。採点や回答状態は持たない。 */
export function AssessmentLayout({ children, footer, bodySx = [] }: {
  children: ReactNode;
  footer?: ReactNode;
  bodySx?: SxProps<Theme>;
}) {
  return <>
    <Box sx={[{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" },
      ...(Array.isArray(bodySx) ? bodySx : [bodySx])]}>
      {children}
    </Box>
    {footer}
  </>;
}
