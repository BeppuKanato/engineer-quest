import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export type ActivityFeedbackTone = "correct" | "incorrect" | "hint" | "info";

const toneStyles: Record<ActivityFeedbackTone, { border: string; background: string; iconBackground: string; color: string }> = {
  correct: { border: "#86efac", background: "#f0fdf4", iconBackground: "#dcfce7", color: "#15803d" },
  incorrect: { border: "#fecaca", background: "#fef2f2", iconBackground: "#fee2e2", color: "#b91c1c" },
  hint: { border: "#fde68a", background: "#fffbeb", iconBackground: "#fef3c7", color: "#92400e" },
  info: { border: "#bfdbfe", background: "#eff6ff", iconBackground: "#dbeafe", color: "#1d4ed8" },
};

const FeedbackIcon = ({ tone }: { tone: ActivityFeedbackTone }) => {
  if (tone === "correct") return <CheckCircleIcon />;
  if (tone === "incorrect") return <ErrorOutlineIcon />;
  return <LightbulbIcon />;
};

export const ActivityFeedbackCard = ({
  tone,
  title,
  message,
  detail,
  aside,
}: {
  tone: ActivityFeedbackTone;
  title: string;
  message: string;
  detail?: ReactNode;
  aside?: ReactNode;
}) => {
  const style = toneStyles[tone];
  return (
    <Paper
      elevation={0}
      role={tone === "incorrect" ? "alert" : "status"}
      aria-live="polite"
      sx={{ p: 2.5, minHeight: 120, borderRadius: 3, border: `1px solid ${style.border}`, bgcolor: style.background }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ width: 48, height: 48, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: style.iconBackground, color: style.color }}>
            <FeedbackIcon tone={tone} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={950} color={style.color}>{title}</Typography>
            <Typography sx={{ mt: 0.5, color: "#334155", fontWeight: 800, lineHeight: 1.7 }}>{message}</Typography>
            {detail && <Box sx={{ mt: 1 }}>{detail}</Box>}
          </Box>
        </Stack>
        {aside}
      </Stack>
    </Paper>
  );
};
