"use client";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import {
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type AppBreadcrumbsProps = {
  items: BreadcrumbItem[];
  compact?: boolean;
};

export const AppBreadcrumbs = ({ items, compact = false }: AppBreadcrumbsProps) => (
  <Breadcrumbs
    aria-label="breadcrumb"
    sx={{
      color: "#64748b",
      fontWeight: 800,
      fontSize: compact ? 13 : 14,
      minWidth: 0,
      overflowX: "auto",
      overflowY: "hidden",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      "& .MuiBreadcrumbs-separator": { color: "#94a3b8" },
      "& a": {
        color: "#2563eb",
        fontWeight: 900,
        textDecoration: "none",
        maxWidth: compact ? 180 : 240,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    }}
  >
    <MuiLink
      component={Link}
      href="/home"
      underline="hover"
      title="ホーム"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
    >
      <HomeRoundedIcon sx={{ fontSize: compact ? 17 : 19 }} />
      ホーム
    </MuiLink>
    {items.map((item, index) =>
      item.href ? (
        <MuiLink
          key={`${item.label}-${index}`}
          component={Link}
          href={item.href}
          underline="hover"
          title={item.label}
        >
          {item.label}
        </MuiLink>
      ) : (
        <Stack
          key={`${item.label}-${index}`}
          component="span"
          direction="row"
          alignItems="center"
          sx={{ minWidth: 0 }}
        >
          <Typography
            component="span"
            title={item.label}
            sx={{
              color: "#0f172a",
              fontWeight: 950,
              maxWidth: compact ? 220 : 320,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Typography>
        </Stack>
      )
    )}
  </Breadcrumbs>
);
