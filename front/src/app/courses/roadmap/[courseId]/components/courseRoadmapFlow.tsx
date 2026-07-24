"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { Box, Button, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { DifficultyLabel } from "@/app/component/difficultyLabel";
import { StatusChip } from "@/app/component/statusChip";

import type { CourseRoadmap, CourseRoadmapMission } from "../../type";
import type { Difficulty } from "../../../type";
import { MissionRoadmapNode } from "./missionRoadmapNode";

type CourseRoadmapFlowProps = {
  course: CourseRoadmap;
  onMissionClick: (missionId: string, difficulty?: Difficulty) => void;
  onMissionDetailClick: (missionId: string) => void;
};

const NODE_WIDTH = 132;
const NODE_GAP = 110;
const MAIN_LINE_TOP = 70;
const CHALLENGE_TOP = 232;
const CHALLENGE_CONNECTOR_TOP = 142;

const groupChallengesByParentId = (missions: CourseRoadmapMission[]) => {
  return missions
    .filter((mission) => mission.type === "challenge")
    .reduce<Record<string, CourseRoadmapMission[]>>((acc, mission) => {
      if (!mission.parentMissionId) return acc;

      acc[mission.parentMissionId] ??= [];
      acc[mission.parentMissionId].push(mission);
      acc[mission.parentMissionId].sort((a, b) => a.branchOrder - b.branchOrder);
      return acc;
    }, {});
};

const progressRate = (done: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
};

const getActionLabel = (mission: CourseRoadmapMission) => {
  if (mission.isLocked) return "未解放";
  if (mission.status === "completed") return "復習";
  if (mission.status === "in_progress") return "続きから";
  return "開始";
};

const MissionDetailPanel = ({
  mission,
  onMissionClick,
  onMissionDetailClick,
}: {
  mission: CourseRoadmapMission;
  onMissionClick: (missionId: string, difficulty?: Difficulty) => void;
  onMissionDetailClick: (missionId: string) => void;
}) => {
  const isChallenge = mission.type === "challenge";
  const isCourseExam = mission.type === "course_exam";
  const accentColor = isCourseExam ? "#7c3aed" : isChallenge ? "#f97316" : "#0057e7";
  const softColor = isCourseExam ? "#f5f3ff" : isChallenge ? "#fff7ed" : "#eff6ff";
  const labelColor = isCourseExam ? "#6d28d9" : isChallenge ? "#ea580c" : "#1d4ed8";

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: "2px solid",
        borderColor: accentColor,
        bgcolor: "#fff",
        boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
        p: { xs: 2.5, md: 3 },
        position: { lg: "sticky" },
        top: { lg: 110 },
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={isCourseExam ? "コース完了" : isChallenge ? "挑戦" : "必須"}
            sx={{
              bgcolor: softColor,
              color: labelColor,
              fontWeight: 950,
            }}
          />
          <DifficultyLabel difficulty={mission.difficulty} variant="chip" />
        </Stack>

        <Box>
          <Typography component="h2" sx={{ fontSize: { xs: 26, md: 30 }, fontWeight: 950, lineHeight: 1.25 }}>
            {mission.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
            {mission.description}
          </Typography>
        </Box>

        <Stack spacing={1.3}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <StatusChip status={mission.status} />
          </Stack>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <AccessTimeIcon sx={{ color: "#64748b" }} />
            <Typography color="text.secondary" fontWeight={800}>
              約{mission.estimatedMinutes}分
            </Typography>
          </Stack>
        </Stack>

        <Box sx={{ height: 1, bgcolor: "#e5e7eb" }} />

        <Stack spacing={1.5}>
          <Typography fontWeight={950}>報酬プレビュー</Typography>
          <Stack direction="row" spacing={3}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  bgcolor: "#dbeafe",
                  color: "#2563eb",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <EmojiEventsIcon />
              </Box>
              <Box>
                <Typography fontWeight={950}>EXP</Typography>
                <Typography color="text.secondary" fontWeight={800}>+50</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  bgcolor: "#fef3c7",
                  color: "#d97706",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <EmojiEventsIcon />
              </Box>
              <Box>
                <Typography fontWeight={950}>Badge</Typography>
                <Typography color="text.secondary" fontWeight={800}>+1</Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>

        {isCourseExam && !mission.isLocked ? (
          <Stack spacing={1.25}>
            <Typography fontWeight={900} color="text.secondary">
              難易度を選んで開始できます。どの難易度でもコース完了になります。
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {([
                ["easy", "やさしい"],
                ["normal", "ふつう"],
                ["hard", "むずかしい"],
              ] as const).map(([difficulty, label]) => (
                <Button
                  key={difficulty}
                  variant={difficulty === "normal" ? "contained" : "outlined"}
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={() => onMissionClick(mission.id, difficulty)}
                  sx={{
                    minHeight: 52,
                    borderRadius: 2,
                    fontWeight: 950,
                    bgcolor: difficulty === "normal" ? accentColor : undefined,
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={mission.isLocked}
            startIcon={mission.isLocked ? <LockIcon /> : <PlayArrowIcon />}
            onClick={() => onMissionClick(mission.id)}
            sx={{
              minHeight: 58,
              borderRadius: 2,
              fontWeight: 950,
              fontSize: 20,
              bgcolor: accentColor,
              boxShadow: "0 12px 24px rgba(0,87,231,0.22)",
            }}
          >
            {getActionLabel(mission)}
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={() => onMissionDetailClick(mission.id)}
          sx={{ borderRadius: 2, fontWeight: 900 }}
        >
          詳細ページを見る
        </Button>
      </Stack>
    </Box>
  );
};

export const CourseRoadmapFlow = ({
  course,
  onMissionClick,
  onMissionDetailClick,
}: CourseRoadmapFlowProps) => {
  const mainMissions = useMemo(
    () =>
      course.missions
        .filter((mission) => mission.isRequiredForCourseCompletion)
        .sort((a, b) => a.order - b.order),
    [course.missions]
  );
  const challengeMissionsByParentId = useMemo(
    () => groupChallengesByParentId(course.missions),
    [course.missions]
  );
  const allSelectableMissions = useMemo(
    () => [
      ...mainMissions,
      ...Object.values(challengeMissionsByParentId).flat(),
    ],
    [challengeMissionsByParentId, mainMissions]
  );
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    course.nextMission?.id ?? allSelectableMissions[0]?.id ?? ""
  );

  useEffect(() => {
    setSelectedMissionId(course.nextMission?.id ?? allSelectableMissions[0]?.id ?? "");
  }, [allSelectableMissions, course.nextMission?.id]);

  const selectedMission =
    allSelectableMissions.find((mission) => mission.id === selectedMissionId) ??
    course.nextMission ??
    allSelectableMissions[0];

  const roadmapWidth =
    mainMissions.length * NODE_WIDTH + Math.max(0, mainMissions.length - 1) * NODE_GAP;
  const hasChallenges = mainMissions.some(
    (mission) => (challengeMissionsByParentId[mission.id] ?? []).length > 0
  );
  const requiredProgress = progressRate(
    course.completedRequiredMissionCount,
    course.requiredMissionCount
  );
  const challengeProgress = progressRate(
    course.completedChallengeMissionCount,
    course.challengeMissionCount
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 420px" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#fff",
          boxShadow: "0 14px 36px rgba(15,23,42,0.06)",
          p: { xs: 2.5, md: 3 },
          minWidth: 0,
        }}
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={950} letterSpacing={0}>
                ミッションロードマップ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                アイコンを選ぶと右側にミッション詳細が表示されます。
              </Typography>
            </Box>

            <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#0057e7" }} />
                <Typography variant="body2" fontWeight={800}>必須ミッション</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#f97316" }} />
                <Typography variant="body2" fontWeight={800}>挑戦ミッション</Typography>
              </Stack>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={900}>必須ミッション</Typography>
                <Typography fontWeight={900}>{course.completedRequiredMissionCount} / {course.requiredMissionCount}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={requiredProgress}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#0057e7" },
                }}
              />
            </Stack>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={900}>挑戦ミッション</Typography>
                <Typography fontWeight={900}>{course.completedChallengeMissionCount} / {course.challengeMissionCount}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={challengeProgress}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "#ffedd5",
                  "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#f97316" },
                }}
              />
            </Stack>
          </Box>

          <Box sx={{ overflowX: "auto", overflowY: "hidden", pb: 2, scrollbarWidth: "thin" }}>
            <Box
              sx={{
                minWidth: Math.max(860, roadmapWidth),
                minHeight: hasChallenges ? 390 : 210,
                position: "relative",
                pt: 4,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: MAIN_LINE_TOP,
                  left: NODE_WIDTH / 2,
                  width: Math.max(0, roadmapWidth - NODE_WIDTH),
                  height: 5,
                  borderRadius: 999,
                  bgcolor: "#0057e7",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />

              <Box sx={{ display: "flex", gap: `${NODE_GAP}px`, alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                {mainMissions.map((mission, index) => {
                  const challenges = challengeMissionsByParentId[mission.id] ?? [];
                  const branchLeft = index * (NODE_WIDTH + NODE_GAP) + NODE_WIDTH / 2;

                  return (
                    <Box key={mission.id} sx={{ width: NODE_WIDTH, flex: `0 0 ${NODE_WIDTH}px`, position: "relative" }}>
                      <MissionRoadmapNode
                        mission={mission}
                        isNext={course.nextMission?.id === mission.id}
                        isSelected={selectedMission?.id === mission.id}
                        onSelect={(nextMission) => setSelectedMissionId(nextMission.id)}
                        onActivate={(nextMission) => onMissionClick(nextMission.id)}
                        variant={mission.type === "course_exam" ? "course_exam" : "main"}
                      />

                      {challenges.length > 0 && (
                        <Box>
                          <Box
                            sx={{
                              position: "absolute",
                              top: CHALLENGE_CONNECTOR_TOP,
                              left: "50%",
                              width: 5,
                              height: CHALLENGE_TOP - CHALLENGE_CONNECTOR_TOP,
                              bgcolor: "#f97316",
                              borderRadius: 999,
                              transform: "translateX(-50%)",
                              pointerEvents: "none",
                              zIndex: 0,
                            }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              top: CHALLENGE_TOP,
                              left: 0,
                              transform: "translateX(12px)",
                            }}
                          >
                            <Stack spacing={1.5} alignItems="center">
                              {challenges.map((challenge) => (
                                <MissionRoadmapNode
                                  key={challenge.id}
                                  mission={challenge}
                                  isNext={false}
                                  isSelected={selectedMission?.id === challenge.id}
                                  onSelect={(nextMission) => setSelectedMissionId(nextMission.id)}
                                  onActivate={(nextMission) => onMissionClick(nextMission.id)}
                                  variant="challenge"
                                />
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      )}

                      {challenges.length > 0 && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: MAIN_LINE_TOP - 7,
                            left: branchLeft - index * (NODE_WIDTH + NODE_GAP),
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            bgcolor: "#f97316",
                            transform: "translateX(-50%)",
                            border: "3px solid #fff",
                            pointerEvents: "none",
                            zIndex: 2,
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: 2,
              bgcolor: "#eff6ff",
              color: "#1d4ed8",
            }}
          >
            <TipsAndUpdatesIcon />
            <Typography fontWeight={800}>
              各ミッションをクリアして、Webアプリが動く仕組みをステップごとに理解していきましょう。
            </Typography>
          </Box>
        </Stack>
      </Box>

      {selectedMission && (
        <MissionDetailPanel
          mission={selectedMission}
          onMissionClick={onMissionClick}
          onMissionDetailClick={onMissionDetailClick}
        />
      )}
    </Box>
  );
};
