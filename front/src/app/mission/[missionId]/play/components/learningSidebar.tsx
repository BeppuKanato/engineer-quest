"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LockOutlineIcon from "@mui/icons-material/LockOutline";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Box, Button, Collapse, Divider, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import type { MissionActivity, MissionPlayResponse } from "../type";

type SidebarGroup = {
  id: string;
  title: string;
  description: string | null;
  activities: MissionActivity[];
  isMissionCheck: boolean;
  sectionNumber: number | null;
};

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
}: LearningSidebarProps) => {
  const groups = useMemo<SidebarGroup[]>(() => {
    const regularSections = mission.sections.filter((section) =>
      mission.activities.some(
        (activity) => activity.sectionId === section.id && !activity.isMissionCheck
      )
    );

    const regularGroups = regularSections.map((section, index) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      activities: mission.activities.filter(
        (activity) => activity.sectionId === section.id && !activity.isMissionCheck
      ),
      isMissionCheck: false,
      sectionNumber: index + 1,
    }));
    const missionCheckActivities = mission.activities.filter(
      (activity) => activity.isMissionCheck
    );

    return missionCheckActivities.length > 0
      ? [
          ...regularGroups,
          {
            id: "mission-check",
            title: "Mission Check",
            description: "ここまでの内容を確認",
            activities: missionCheckActivities,
            isMissionCheck: true,
            sectionNumber: null,
          },
        ]
      : regularGroups;
  }, [mission]);

  const currentGroup = groups.find((group) =>
    group.activities.some((activity) => activity.id === currentActivityId)
  );
  const regularSectionCount = groups.filter(
    (group) => !group.isMissionCheck
  ).length;
  const [expandedGroupId, setExpandedGroupId] = useState(
    currentGroup?.id ?? groups[0]?.id ?? ""
  );

  useEffect(() => {
    if (currentGroup) setExpandedGroupId(currentGroup.id);
  }, [currentGroup]);

  const activityNumberById = new Map(
    mission.activities.map((activity, index) => [activity.id, index + 1])
  );

  return (
    <Paper
      component="aside"
      elevation={0}
      sx={{
        position: "sticky",
        top: 24,
        width: "100%",
        maxHeight: "calc(100vh - 48px)",
        border: "1px solid #dbe3ef",
        borderRadius: 2,
        bgcolor: "#fff",
        overflowY: "auto",
      }}
    >
      <Stack>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <DashboardCustomizeIcon sx={{ color: "#2563eb", mt: 0.2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                Course
              </Typography>
              <Typography fontWeight={900} sx={{ lineHeight: 1.45 }}>
                {mission.courseTitle}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1.75 }}>
          <Typography variant="caption" color="#b45309" fontWeight={900}>
            Mission {mission.missionOrder}
          </Typography>
          <Typography fontWeight={900} sx={{ mt: 0.25, lineHeight: 1.45 }}>
            {mission.title}
          </Typography>
        </Box>

        <Stack spacing={1.25} sx={{ px: 1.5, pb: 2 }}>
          {groups.map((group) => {
            const isExpanded = expandedGroupId === group.id;
            const completedCount = group.activities.filter((activity) =>
              completedActivityIds.has(activity.id)
            ).length;
            const isCompleted =
              group.activities.length > 0 && completedCount === group.activities.length;
            const isCurrent = group.id === currentGroup?.id;
            const canExpand =
              isCurrent ||
              isCompleted ||
              group.activities.some((activity) => activity.id === availableActivityId);

            return (
              <Paper
                key={group.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: isCurrent
                    ? group.isMissionCheck
                      ? "2px solid #f59e0b"
                      : "2px solid #60a5fa"
                    : "1px solid #dbe3ef",
                  overflow: "hidden",
                  bgcolor: "#fff",
                }}
              >
                <Button
                  fullWidth
                  disabled={!canExpand}
                  onClick={() => setExpandedGroupId(isExpanded ? "" : group.id)}
                  endIcon={canExpand ? <ExpandMoreIcon /> : <LockOutlineIcon />}
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    justifyContent: "space-between",
                    textAlign: "left",
                    color: group.isMissionCheck ? "#b45309" : "#0f172a",
                    "& .MuiButton-endIcon": {
                      transform: isExpanded ? "rotate(180deg)" : "none",
                      transition: "transform 180ms ease",
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={900}>
                      {group.isMissionCheck
                        ? "MISSION CHECK"
                        : `SECTION ${group.sectionNumber} / ${regularSectionCount}`}
                    </Typography>
                    <Typography fontWeight={900} sx={{ lineHeight: 1.35 }}>
                      {group.title}
                    </Typography>
                    {!isExpanded && (
                      <Typography variant="caption" color="text.secondary">
                        {isCompleted
                          ? "完了"
                          : isCurrent
                          ? `${completedCount} / ${group.activities.length}`
                          : group.description}
                      </Typography>
                    )}
                  </Box>
                </Button>

                <Collapse in={isExpanded} timeout={180}>
                  <Divider />
                  <Stack sx={{ py: 0.75 }}>
                    {group.activities.map((activity) => {
                      const isSelected = activity.id === currentActivityId;
                      const isActivityCompleted = completedActivityIds.has(activity.id);
                      const isAvailable = activity.id === availableActivityId;
                      const canSelect = isActivityCompleted || isAvailable || isSelected;

                      return (
                        <Button
                          key={activity.id}
                          fullWidth
                          disabled={!canSelect}
                          onClick={() => onSelectActivity(activity.id)}
                          sx={{
                            minHeight: 42,
                            px: 1.25,
                            py: 0.75,
                            justifyContent: "flex-start",
                            textAlign: "left",
                            borderRadius: 0,
                            bgcolor: isSelected ? "#eaf3ff" : "transparent",
                            color: isSelected ? "#1559b7" : "#334155",
                            "&:hover": { bgcolor: isSelected ? "#eaf3ff" : "#f8fafc" },
                          }}
                        >
                          {isActivityCompleted ? (
                            <CheckCircleIcon sx={{ mr: 1, fontSize: 17, color: "#16a34a" }} />
                          ) : isSelected || isAvailable ? (
                            <RadioButtonCheckedIcon sx={{ mr: 1, fontSize: 17, color: "#2563eb" }} />
                          ) : group.isMissionCheck ? (
                            <FactCheckIcon sx={{ mr: 1, fontSize: 17 }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ mr: 1, fontSize: 17 }} />
                          )}
                          <Typography variant="caption" fontWeight={isSelected ? 900 : 700}>
                            {activityNumberById.get(activity.id)}. {activity.title}
                          </Typography>
                        </Button>
                      );
                    })}
                  </Stack>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>

        <Box sx={{ mt: "auto", p: 1.5, pt: 0 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MapOutlinedIcon />}
            onClick={onBackToRoadmap}
            sx={{ minHeight: 48, borderRadius: 2, fontWeight: 900, bgcolor: "#fff" }}
          >
            ロードマップに戻る
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};
