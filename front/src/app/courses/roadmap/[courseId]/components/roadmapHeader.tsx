import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RouteIcon from "@mui/icons-material/Route";
import StarsIcon from "@mui/icons-material/Stars";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { CategoryChip } from "@/app/component/categoryChip";
import { DifficultyLabel } from "@/app/component/difficultyLabel";
import { StatusChip } from "@/app/component/statusChip";
import type { CourseRoadmap } from "../../type";

type RoadmapHeaderProps = {
  course: CourseRoadmap;
  onNextMissionClick: () => void;
};

export const RoadmapHeader = ({ course, onNextMissionClick }: RoadmapHeaderProps) => {
  const isCompleted = course.status === "completed";

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        p: { xs: 2.5, md: 3 },
        boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "180px minmax(0, 1fr) 280px" },
          gap: { xs: 3, lg: 4 },
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: 140, lg: 160 },
            height: { xs: 140, lg: 160 },
            borderRadius: 4,
            bgcolor: "#eff6ff",
            display: "grid",
            placeItems: "center",
            color: "#0057e7",
          }}
        >
          <RouteIcon sx={{ fontSize: { xs: 76, lg: 92 } }} />
        </Box>

        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {isCompleted && (
              <Chip
                icon={<EmojiEventsIcon />}
                label="コースクリア"
                size="small"
                sx={{
                  bgcolor: "#fef3c7",
                  color: "#b45309",
                  fontWeight: 900,
                  border: "1px solid #f59e0b",
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            )}
            <StatusChip status={course.status} />
            <DifficultyLabel difficulty={course.difficulty} variant="chip" />
          </Stack>

          <Box>
            <Typography component="h1" sx={{ fontSize: { xs: 34, md: 42 }, fontWeight: 950, lineHeight: 1.18 }}>
              {course.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8, maxWidth: 760 }}>
              {course.description}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {course.categories.map((category) => (
              <CategoryChip key={category} category={category} />
            ))}
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "flex-start", lg: "flex-end" }}>
            <Chip icon={<AccessTimeIcon />} label="進行中" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 900, "& .MuiChip-icon": { color: "inherit" } }} />
            <Chip icon={<StarsIcon />} label="やさしい" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 900, "& .MuiChip-icon": { color: "inherit" } }} />
          </Stack>

          <Button
            variant="contained"
            disabled={!course.nextMission}
            onClick={onNextMissionClick}
            sx={{
              minHeight: 58,
              borderRadius: 2,
              fontWeight: 950,
              px: 3,
              fontSize: 18,
              bgcolor: "#0057e7",
              boxShadow: "0 12px 24px rgba(0,87,231,0.22)",
            }}
          >
            {course.nextMission ? "次のミッションへ" : "コース完了済み"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
