import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import CodeIcon from "@mui/icons-material/Code";
import DatasetIcon from "@mui/icons-material/Dataset";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import RouteIcon from "@mui/icons-material/Route";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type React from "react";

import { CategoryChip } from "../../component/categoryChip";
import { DifficultyLabel } from "../../component/difficultyLabel";
import { StatusChip } from "../../component/statusChip";
import type { Course, CourseCategory } from "../type";

type CourseCardProps = Course & {
  onCourseClick?: (courseId: string) => void;
  featured?: boolean;
};

type CourseVisualStyle = {
  background: string;
  accent: string;
  icon: React.ReactElement;
};

const COURSE_VISUAL_STYLE: Record<CourseCategory, CourseVisualStyle> = {
  ui: {
    background: "linear-gradient(135deg, #e0f2fe 0%, #f5f3ff 100%)",
    accent: "#2563eb",
    icon: <CodeIcon />,
  },
  data: {
    background: "linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)",
    accent: "#059669",
    icon: <DatasetIcon />,
  },
  tool: {
    background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)",
    accent: "#0f766e",
    icon: <RouteIcon />,
  },
  algorithm: {
    background: "linear-gradient(135deg, #fff7ed 0%, #fefce8 100%)",
    accent: "#ea580c",
    icon: <RouteIcon />,
  },
  game: {
    background: "linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%)",
    accent: "#7c3aed",
    icon: <CloudQueueIcon />,
  },
};

const getCourseVisualStyle = (categories: CourseCategory[]) => {
  const primaryCategory = categories[0] ?? "ui";
  return COURSE_VISUAL_STYLE[primaryCategory];
};

const getActionLabel = (status: Course["status"]) => {
  if (status === "completed") return "復習する";
  if (status === "in_progress") return "続きから";
  return "開始する";
};

const getActionIcon = (status: Course["status"]) => {
  if (status === "completed") return <ReplayIcon />;
  return <PlayArrowIcon />;
};

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  categories,
  difficulty,
  status,
  progressRate,
  missionCount,
  completedMissionCount,
  totalMissionCount,
  requiredMissionCount,
  completedRequiredMissionCount,
  challengeMissionCount,
  completedChallengeMissionCount,
  onCourseClick,
  featured = false,
}) => {
  const visualStyle = getCourseVisualStyle(categories);
  const isCompleted = status === "completed";
  const actionLabel = getActionLabel(status);
  const actionIcon = getActionIcon(status);

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: featured ? { xs: "1fr", md: "200px minmax(0, 1fr)" } : "1fr",
        overflow: "hidden",
        borderRadius: 2,
        border: "1px solid #dbe3ef",
        bgcolor: "#fff",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 18px 38px rgba(15, 23, 42, 0.12)",
        },
      }}
    >
      <Box
        sx={{
          minHeight: featured ? 164 : 144,
          p: 1.75,
          bgcolor: "#f8fafc",
          background: visualStyle.background,
          borderBottom: featured ? { xs: "1px solid #e2e8f0", md: 0 } : "1px solid #e2e8f0",
          borderRight: featured ? { xs: 0, md: "1px solid #e2e8f0" } : 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Box
          sx={{
            width: featured ? 116 : 92,
            height: featured ? 116 : 92,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.74)",
            border: "1px solid rgba(148, 163, 184, 0.34)",
            display: "grid",
            placeItems: "center",
            color: visualStyle.accent,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            "& svg": {
              fontSize: featured ? 60 : 48,
            },
          }}
        >
          {visualStyle.icon}
        </Box>
      </Box>

      <Stack spacing={1.45} sx={{ p: { xs: 2, md: featured ? 2.25 : 2 }, minWidth: 0 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="space-between">
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <StatusChip status={status} />
            <DifficultyLabel difficulty={difficulty} variant="chip" />
          </Stack>
          {featured && status === "not_started" && (
            <Chip label="Recommended" size="small" sx={{ bgcolor: "#10b981", color: "#fff", fontWeight: 900 }} />
          )}
          {isCompleted && (
            <Chip
              icon={<CheckCircleIcon />}
              label="コースクリア"
              size="small"
              sx={{
                bgcolor: "#dcfce7",
                color: "#15803d",
                fontWeight: 800,
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          )}
        </Stack>

        <Typography
          variant={featured ? "h5" : "h6"}
          fontWeight={950}
          sx={{
            lineHeight: 1.35,
            letterSpacing: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {categories.map((category) => (
            <CategoryChip key={category} category={category} />
          ))}
        </Stack>

        <Box sx={{ mt: "auto" }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={900}>
              進捗
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={900}>
              {completedMissionCount} / {missionCount}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressRate}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: "#e2e8f0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: isCompleted ? "#16a34a" : visualStyle.accent,
              },
            }}
          />
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={`必須 ${completedRequiredMissionCount}/${requiredMissionCount}`} size="small" sx={{ fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }} />
          <Chip label={`挑戦 ${completedChallengeMissionCount}/${challengeMissionCount}`} size="small" sx={{ fontWeight: 800, bgcolor: "#fff7ed", color: "#c2410c" }} />
          <Chip label={`全${totalMissionCount}ミッション`} size="small" sx={{ fontWeight: 800, bgcolor: "#f1f5f9", color: "#475569" }} />
        </Stack>

        <Button
          variant="contained"
          fullWidth={!featured}
          startIcon={actionIcon}
          onClick={() => onCourseClick?.(id)}
          sx={{
            mt: 0.25,
            minHeight: 44,
            px: 3,
            borderRadius: 2,
            fontWeight: 950,
            alignSelf: featured ? "flex-end" : "stretch",
            background:
              status === "completed"
                ? "linear-gradient(135deg, #16a34a 0%, #0f766e 100%)"
                : "linear-gradient(135deg, #0057e7 0%, #0041c4 100%)",
            boxShadow: "0 10px 22px rgba(37, 99, 235, 0.24)",
          }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Paper>
  );
};
