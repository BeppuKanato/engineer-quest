import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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

import { CategoryChip } from "../../component/categoryChip";
import { DifficultyLabel } from "../../component/difficultyLabel";
import { StatusChip } from "../../component/statusChip";
import type { Course, CourseCategory } from "../type";

type CourseCardProps = Course & {
  onCourseClick?: (courseId: string) => void;
};

type CourseVisualStyle = {
  background: string;
  accent: string;
  softAccent: string;
};

const COURSE_VISUAL_STYLE: Record<CourseCategory, CourseVisualStyle> = {
  ui: {
    background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
    accent: "#2563eb",
    softAccent: "#bfdbfe",
  },
  data: {
    background: "linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)",
    accent: "#059669",
    softAccent: "#bbf7d0",
  },
  tool: {
    background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)",
    accent: "#0f766e",
    softAccent: "#99f6e4",
  },
  algorithm: {
    background: "linear-gradient(135deg, #fff7ed 0%, #fefce8 100%)",
    accent: "#ea580c",
    softAccent: "#fed7aa",
  },
  game: {
    background: "linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%)",
    accent: "#7c3aed",
    softAccent: "#ddd6fe",
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
  description,
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
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 3,
        border: "1px solid #dbe3ef",
        bgcolor: "#fff",
        boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 20px 42px rgba(15, 23, 42, 0.13)",
        },
      }}
    >
      <Box
        sx={{
          minHeight: 156,
          p: 2,
          bgcolor: "#f8fafc",
          background: visualStyle.background,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Box
          sx={{
            height: 120,
            borderRadius: 2,
            bgcolor: "rgba(255, 255, 255, 0.76)",
            border: "1px solid rgba(148, 163, 184, 0.34)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            p: 1.5,
            display: "grid",
            gridTemplateRows: "20px 1fr",
            gap: 1.25,
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: index === 0 ? visualStyle.accent : "#cbd5e1",
                }}
              />
            ))}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: 1.25,
              minHeight: 0,
            }}
          >
            <Stack spacing={0.8} justifyContent="center">
              <Box
                sx={{
                  height: 12,
                  width: "86%",
                  borderRadius: 1,
                  bgcolor: visualStyle.accent,
                }}
              />
              <Box
                sx={{
                  height: 12,
                  width: "68%",
                  borderRadius: 1,
                  bgcolor: visualStyle.softAccent,
                }}
              />
              <Box
                sx={{
                  height: 12,
                  width: "76%",
                  borderRadius: 1,
                  bgcolor: "#cbd5e1",
                }}
              />
            </Stack>

            <Box
              sx={{
                borderRadius: 2,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
                display: "grid",
                placeItems: "center",
              }}
            >
              <RouteIcon sx={{ color: visualStyle.accent, fontSize: 42 }} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Stack spacing={2} sx={{ p: 2.5, flex: 1 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <StatusChip status={status} />
          <DifficultyLabel difficulty={difficulty} variant="chip" />
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

        <Box>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{ lineHeight: 1.35, letterSpacing: 0 }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              lineHeight: 1.75,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {categories.map((category) => (
            <CategoryChip key={category} category={category} />
          ))}
        </Stack>

        <Box sx={{ mt: "auto" }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              進捗
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
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
          <Chip
            label={`基礎 ${completedRequiredMissionCount}/${requiredMissionCount}`}
            size="small"
            sx={{ fontWeight: 800, bgcolor: "#eff6ff", color: "#1d4ed8" }}
          />
          <Chip
            label={`挑戦 ${completedChallengeMissionCount}/${challengeMissionCount}`}
            size="small"
            sx={{ fontWeight: 800, bgcolor: "#fff7ed", color: "#c2410c" }}
          />
          <Chip
            label={`全${totalMissionCount}ミッション`}
            size="small"
            sx={{ fontWeight: 800, bgcolor: "#f1f5f9", color: "#475569" }}
          />
        </Stack>

        <Button
          variant="contained"
          fullWidth
          startIcon={actionIcon}
          onClick={() => onCourseClick?.(id)}
          sx={{
            mt: 0.5,
            minHeight: 46,
            borderRadius: 2,
            fontWeight: 900,
            background:
              status === "completed"
                ? "linear-gradient(135deg, #16a34a 0%, #0f766e 100%)"
                : "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            boxShadow: "0 10px 22px rgba(37, 99, 235, 0.24)",
          }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Paper>
  );
};
