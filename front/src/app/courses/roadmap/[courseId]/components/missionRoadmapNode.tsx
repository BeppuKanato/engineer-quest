import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import { DifficultyLabel } from "@/app/component/difficultyLabel";
import { StatusChip } from "@/app/component/statusChip";

import type { CourseRoadmapMission } from "../../type";

type MissionRoadmapNodeProps = {
  mission: CourseRoadmapMission;
  isNext: boolean;
  onMissionClick: (missionId: string) => void;
  onMissionDetailClick: (missionId: string) => void;
  variant?: "main" | "challenge";
};

const getActionLabel = (mission: CourseRoadmapMission) => {
  if (mission.isLocked) return "未開放";
  if (mission.status === "completed") return "復習";
  if (mission.status === "in_progress") return "続きから";
  return "開始";
};

const getActionIcon = (mission: CourseRoadmapMission) => {
  if (mission.isLocked) return <LockIcon />;
  if (mission.status === "completed") return <CheckCircleIcon />;
  return <PlayArrowIcon />;
};

export const MissionRoadmapNode = ({
  mission,
  isNext,
  onMissionClick,
  onMissionDetailClick,
  variant = "main",
}: MissionRoadmapNodeProps) => {
  const isCompleted = mission.status === "completed";
  const isChallenge = variant === "challenge" || mission.type === "challenge";
  const isLocked = mission.isLocked;
  const accentColor = isChallenge ? "#f97316" : "#2563eb";
  const completedColor = "#16a34a";
  const borderColor = isCompleted
    ? "#86efac"
    : isNext
      ? "#93c5fd"
      : isChallenge
        ? "#fed7aa"
        : "#dbe3ef";

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "#fff",
        border: "1px solid",
        borderColor,
        boxShadow: isNext
          ? "0 18px 38px rgba(37, 99, 235, 0.18)"
          : "0 10px 26px rgba(15, 23, 42, 0.08)",
        position: "relative",
      }}
    >
      {isNext && (
        <Chip
          size="small"
          label="NEXT"
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 2,
            bgcolor: "#2563eb",
            color: "#fff",
            fontWeight: 900,
            boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
          }}
        />
      )}

      <Box
        sx={{
          height: isChallenge ? 70 : 96,
          p: 1.25,
          bgcolor: isChallenge ? "#fff7ed" : "#eff6ff",
          background: isChallenge
            ? "linear-gradient(135deg, #fff7ed 0%, #fff 100%)"
            : "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Box
          sx={{
            height: "100%",
            borderRadius: 2,
            border: "1px solid rgba(148, 163, 184, 0.32)",
            bgcolor: "rgba(255,255,255,0.76)",
            p: 1,
            display: "grid",
            gridTemplateColumns: "1fr 64px",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Stack spacing={0.55}>
            <Box
              sx={{
                width: "74%",
                height: 8,
                borderRadius: 999,
                bgcolor: isCompleted ? completedColor : accentColor,
              }}
            />
            <Box
              sx={{
                width: "58%",
                height: 8,
                borderRadius: 999,
                bgcolor: isChallenge ? "#fed7aa" : "#bfdbfe",
              }}
            />
            <Box
              sx={{
                width: "66%",
                height: 8,
                borderRadius: 999,
                bgcolor: "#cbd5e1",
              }}
            />
          </Stack>

          <Box
            sx={{
              height: "100%",
              borderRadius: 1.5,
              border: "1px solid #e2e8f0",
              display: "grid",
              placeItems: "center",
              color: isCompleted ? completedColor : accentColor,
              bgcolor: "#fff",
            }}
          >
            {isLocked ? (
              <LockIcon sx={{ fontSize: isChallenge ? 24 : 30 }} />
            ) : isChallenge ? (
              <StarIcon sx={{ fontSize: 28 }} />
            ) : (
              <PlayArrowIcon sx={{ fontSize: 32 }} />
            )}
          </Box>
        </Box>
      </Box>

      <Stack spacing={1.35} sx={{ p: isChallenge ? 1.5 : 2 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
          <Chip
            size="small"
            icon={isChallenge ? <StarIcon /> : <PlayArrowIcon />}
            label={isChallenge ? "挑戦" : "基礎"}
            sx={{
              bgcolor: isChallenge ? "#fff7ed" : "#eff6ff",
              color: isChallenge ? "#c2410c" : "#1d4ed8",
              fontWeight: 900,
              "& .MuiChip-icon": { color: "inherit" },
            }}
          />
          <DifficultyLabel difficulty={mission.difficulty} variant="chip" />
        </Stack>

        <Box>
          <Typography fontWeight={900} sx={{ color: "#0f172a", lineHeight: 1.35 }}>
            {mission.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              lineHeight: 1.65,
              display: "-webkit-box",
              WebkitLineClamp: isChallenge ? 2 : 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {mission.description}
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <StatusChip status={mission.status} />
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            約{mission.estimatedMinutes}分
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={isCompleted ? "outlined" : "contained"}
            disabled={isLocked}
            startIcon={getActionIcon(mission)}
            onClick={() => onMissionClick(mission.id)}
            sx={{
              flex: 1,
              borderRadius: 2,
              fontWeight: 900,
              bgcolor:
                !isCompleted && !isLocked
                  ? isChallenge
                    ? "#f97316"
                    : "#2563eb"
                  : undefined,
            }}
          >
            {getActionLabel(mission)}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<InfoOutlinedIcon />}
            onClick={() => onMissionDetailClick(mission.id)}
            sx={{
              minWidth: 112,
              borderRadius: 2,
              fontWeight: 900,
              bgcolor: "#fff",
            }}
          >
            内容を見る
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
