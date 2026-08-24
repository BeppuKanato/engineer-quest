import { Box, Divider, Paper, Stack } from "@mui/material";
import type { ReactNode } from "react";

type ActivityShellProps = {
  header: ReactNode;
  context?: ReactNode;
  visualization?: ReactNode;
  interaction?: ReactNode;
  feedback?: ReactNode;
  navigation: ReactNode;
  visualizationVariant?: "default" | "workspace";
};

const Region = ({
  children,
  label,
  tone = "plain",
  workspace = false,
}: {
  children: ReactNode;
  label: string;
  tone?: "plain" | "visual" | "interaction";
  workspace?: boolean;
}) => (
  <Box
    component="section"
    aria-label={label}
    sx={{
      minWidth: 0,
      ...(tone === "visual" && {
        p: workspace ? 0 : { xs: 1.5, sm: 2.5 },
        minHeight: { xs: 250, md: 330 },
        display: workspace ? "block" : "grid",
        alignItems: workspace ? undefined : "center",
        border: "1px solid #bfdbfe",
        borderRadius: 2.5,
        bgcolor: workspace ? "#fff" : "#f8fbff",
        overflow: workspace ? "visible" : "hidden",
      }),
      ...(tone === "interaction" && {
        p: { xs: 1.5, sm: 2.5 },
        border: "1px solid #fde68a",
        borderRadius: 2.5,
        bgcolor: "#fffcf2",
      }),
    }}
  >
    {children}
  </Box>
);

/**
 * Common Activity frame. The global header, breadcrumbs and learning sidebar
 * remain owned by the page; only these six ordered regions change by pattern.
 */
export function ActivityShell({
  header,
  context,
  visualization,
  interaction,
  feedback,
  navigation,
  visualizationVariant = "default",
}: ActivityShellProps) {
  return (
    <Paper
      component="article"
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #dbe3ef",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
        bgcolor: "#fff",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Stack spacing={0}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 2 }}>
          {header}
        </Box>
        <Divider />
        <Stack spacing={3} sx={{ p: { xs: 2, sm: 3 } }}>
          {context && <Region label="学習コンテキスト">{context}</Region>}
          {visualization && (
            <Region
              label={visualizationVariant === "workspace" ? "コース完了課題" : "アルゴリズムのビジュアル"}
              tone="visual"
              workspace={visualizationVariant === "workspace"}
            >
              {visualization}
            </Region>
          )}
          {interaction && (
            <Region label="ユーザー操作" tone="interaction">
              {interaction}
            </Region>
          )}
          {feedback && <Region label="フィードバック">{feedback}</Region>}
        </Stack>
        <Divider />
        <Box
          component="footer"
          aria-label="Activity操作"
          sx={{ px: { xs: 2, sm: 3 }, py: 2, bgcolor: "#f8fafc" }}
        >
          {navigation}
        </Box>
      </Stack>
    </Paper>
  );
}
