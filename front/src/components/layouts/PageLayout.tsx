"use client";

import { Container } from "@mui/material";
import type { ReactNode } from "react";

/** 既存の画面幅と余白の契約。教材・実装エディタの枠とは分離する。 */
export const pageLayoutStyles = {
  main: { maxWidth: 1440, py: { xs: 3, md: 4 } },
  breadcrumbs: { maxWidth: 1440, pt: { xs: 3, md: 4 } },
  detail: { maxWidth: 1120, pt: 3, pb: 4 },
  reading: { maxWidth: 960, pt: 3, pb: 4 },
  creationList: { maxWidth: 1180, pt: 3, pb: 4 },
  works: { maxWidth: 1080, pt: 3, pb: 4 },
  workspace: { maxWidth: 1440, pt: 3, pb: 3 },
  collection: { pt: 3, pb: 5 },
} as const;

export type PageLayoutVariant = keyof typeof pageLayoutStyles;

export function PageLayout({ variant = "main", children }: { variant?: PageLayoutVariant; children: ReactNode }) {
  return <Container maxWidth={variant === "collection" ? "lg" : false} sx={pageLayoutStyles[variant]}>{children}</Container>;
}
