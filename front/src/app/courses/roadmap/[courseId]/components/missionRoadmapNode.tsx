import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import { Box, Chip, Stack, Typography } from "@mui/material";

import type { CourseRoadmapMission } from "../../type";

type MissionRoadmapNodeProps = {
  mission: CourseRoadmapMission;
  isNext: boolean;
  isSelected: boolean;
  onSelect: (mission: CourseRoadmapMission) => void;
  onActivate: (mission: CourseRoadmapMission) => void;
  variant?: "main" | "challenge" | "course_exam";
};

export const MissionRoadmapNode = ({
  mission,
  isNext,
  isSelected,
  onSelect,
  onActivate,
  variant = "main",
}: MissionRoadmapNodeProps) => {
  const isCompleted = mission.status === "completed";
  const isChallenge = variant === "challenge" || mission.type === "challenge";
  const isCourseExam = variant === "course_exam" || mission.type === "course_exam";
  const isLocked = mission.isLocked;
  const accentColor = isCompleted ? "#16a34a" : isCourseExam ? "#7c3aed" : isChallenge ? "#f97316" : "#0057e7";
  const softColor = isCompleted ? "#dcfce7" : isCourseExam ? "#f5f3ff" : isChallenge ? "#fff7ed" : "#eff6ff";
  const labelColor = isCompleted ? "#15803d" : isCourseExam ? "#6d28d9" : isChallenge ? "#ea580c" : "#1d4ed8";

  return (
    <Stack spacing={1} alignItems="center" sx={{ width: 132, position: "relative", zIndex: 2 }}>
      <Box sx={{ position: "relative" }}>
        {isNext && (
          <Chip
            label="NEXT"
            size="small"
            sx={{
              position: "absolute",
              left: "50%",
              top: -34,
              transform: "translateX(-50%)",
              zIndex: 2,
              bgcolor: "#0057e7",
              color: "#fff",
              fontWeight: 950,
              boxShadow: "0 8px 18px rgba(0,87,231,0.24)",
            }}
          />
        )}

        {isCompleted && (
          <Box
            sx={{
              position: "absolute",
              right: -4,
              top: -4,
              zIndex: 2,
              width: 26,
              height: 26,
              borderRadius: "50%",
              bgcolor: "#16a34a",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              border: "3px solid #fff",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 17 }} />
          </Box>
        )}

        <Box
          component="button"
          type="button"
          onClick={() => {
            onSelect(mission);
            if (!isLocked) {
              onActivate(mission);
            }
          }}
          aria-label={`${mission.title}の詳細を表示`}
          sx={{
            width: isChallenge ? 68 : isCourseExam ? 82 : 76,
            height: isChallenge ? 68 : isCourseExam ? 82 : 76,
            borderRadius: "50%",
            border: "4px solid",
            borderColor: isSelected ? accentColor : isCompleted ? "#86efac" : isLocked ? "#cbd5e1" : "#bfdbfe",
            bgcolor: isLocked ? "#f8fafc" : accentColor,
            color: isLocked ? "#64748b" : "#fff",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            boxShadow: isSelected
              ? `0 0 0 8px ${isCompleted ? "rgba(22,163,74,0.14)" : isCourseExam ? "rgba(124,58,237,0.14)" : isChallenge ? "rgba(249,115,22,0.12)" : "rgba(0,87,231,0.13)"}, 0 16px 28px rgba(15,23,42,0.16)`
              : "0 10px 22px rgba(15,23,42,0.12)",
            transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: `0 0 0 8px ${isCompleted ? "rgba(22,163,74,0.12)" : isCourseExam ? "rgba(124,58,237,0.12)" : isChallenge ? "rgba(249,115,22,0.1)" : "rgba(0,87,231,0.1)"}, 0 18px 34px rgba(15,23,42,0.16)`,
            },
          }}
        >
          {isLocked ? (
            <LockIcon sx={{ fontSize: 28 }} />
          ) : isCompleted ? (
            <CheckCircleIcon sx={{ fontSize: 34 }} />
          ) : isChallenge ? (
            <StarIcon sx={{ fontSize: 32 }} />
          ) : isCourseExam ? (
            <EmojiEventsIcon sx={{ fontSize: 38 }} />
          ) : (
            <PlayArrowIcon sx={{ fontSize: 40 }} />
          )}
        </Box>
      </Box>

      <Stack spacing={0.4} alignItems="center">
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              bgcolor: softColor,
              color: labelColor,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 950,
            }}
          >
            {isCourseExam ? "EX" : mission.order}
          </Box>
          <Typography
            sx={{
              maxWidth: 118,
              color: isCourseExam ? "#6d28d9" : isChallenge ? "#ea580c" : "#111827",
              fontSize: 14,
              fontWeight: 900,
              lineHeight: 1.25,
              textAlign: "center",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {mission.title}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
};
