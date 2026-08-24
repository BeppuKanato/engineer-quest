"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";

import type { MissionPlayResponse } from "../type";

type LearningSidebarProps = {
  mission: MissionPlayResponse;
  currentActivityId: string;
  availableActivityId: string | null;
  completedActivityIds: Set<string>;
  onSelectActivity: (activityId: string) => void;
  onBackToRoadmap: () => void;
};

export const LearningSidebar = ({
  mission,
  currentActivityId,
  availableActivityId,
  completedActivityIds,
  onSelectActivity,
  onBackToRoadmap,
}: LearningSidebarProps) => (
  <Paper
    component="aside"
    elevation={0}
    sx={{
      position: { lg: "sticky" },
      top: 88,
      width: "100%",
      maxHeight: { lg: "calc(100vh - 112px)" },
      border: "1px solid #dbe3ef",
      borderRadius: 2,
      bgcolor: "#fff",
      overflowY: "auto",
    }}
  >
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <DashboardCustomizeIcon sx={{ color: "#2563eb", mt: 0.2 }} />
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>Course</Typography>
          <Typography fontWeight={950} color="#0f172a">{mission.courseTitle}</Typography>
        </Box>
      </Stack>
    </Box>
    <Divider />
    <Box sx={{ px: 2, py: 1.75 }}>
      <Typography variant="caption" color="#b45309" fontWeight={900}>
        Mission {mission.missionOrder}
      </Typography>
      <Typography fontWeight={950} color="#0f172a">{mission.title}</Typography>
      <Chip
        size="small"
        label={`${completedActivityIds.size} / ${mission.activities.length} 完了`}
        sx={{ mt: 1, fontWeight: 800 }}
      />
    </Box>
    <Divider />
    <Stack sx={{ py: 1 }}>
      {mission.activities.map((activity, index) => {
        const isSelected = activity.id === currentActivityId;
        const isCompleted = completedActivityIds.has(activity.id);
        const isAvailable = activity.id === availableActivityId;
        const canSelect = isCompleted || isAvailable || isSelected;
        return (
          <Button
            key={activity.id}
            fullWidth
            disabled={!canSelect}
            onClick={() => onSelectActivity(activity.id)}
            sx={{
              minHeight: 48,
              px: 2,
              py: 1,
              justifyContent: "flex-start",
              textAlign: "left",
              borderRadius: 0,
              bgcolor: isSelected ? "#eaf3ff" : "transparent",
              color: isSelected ? "#1559b7" : "#334155",
              borderLeft: isSelected ? "4px solid #2563eb" : "4px solid transparent",
              "&:hover": { bgcolor: isSelected ? "#eaf3ff" : "#f8fafc" },
            }}
          >
            {isCompleted ? (
              <CheckCircleIcon sx={{ mr: 1, fontSize: 18, color: "#16a34a" }} />
            ) : isSelected || isAvailable ? (
              <RadioButtonCheckedIcon sx={{ mr: 1, fontSize: 18, color: "#2563eb" }} />
            ) : (
              <LockOutlineIcon sx={{ mr: 1, fontSize: 18 }} />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" fontWeight={900}>
                ACTIVITY {index + 1}
              </Typography>
              <Typography variant="body2" fontWeight={isSelected ? 900 : 700} noWrap>
                {activity.title}
              </Typography>
            </Box>
          </Button>
        );
      })}
    </Stack>
    <Box sx={{ p: 1.5 }}>
      <Button fullWidth variant="outlined" startIcon={<MapOutlinedIcon />} onClick={onBackToRoadmap} sx={{ minHeight: 48, fontWeight: 900 }}>
        ロードマップに戻る
      </Button>
    </Box>
  </Paper>
);
