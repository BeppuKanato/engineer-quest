import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { Box, Chip, Stack, Typography } from "@mui/material";

import type { CourseRoadmap, CourseRoadmapMission } from "../../type";
import { MissionRoadmapNode } from "./missionRoadmapNode";

type CourseRoadmapFlowProps = {
  course: CourseRoadmap;
  onMissionClick: (missionId: string) => void;
  onMissionDetailClick: (missionId: string) => void;
};

const MAIN_NODE_WIDTH = 300;
const MAIN_NODE_GAP = 88;
const MAIN_LINE_TOP = 166;
const CHALLENGE_TOP = 420;

const CourseCompleteNode = ({ isCompleted }: { isCompleted: boolean }) => {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 260,
        borderRadius: 3,
        bgcolor: "#fff",
        border: "1px solid",
        borderColor: isCompleted ? "#86efac" : "#dbe3ef",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1.5,
        p: 3,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          bgcolor: isCompleted ? "#dcfce7" : "#f1f5f9",
          color: isCompleted ? "#16a34a" : "#64748b",
          display: "grid",
          placeItems: "center",
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: 38 }} />
      </Box>

      <Box>
        <Typography fontWeight={900} sx={{ fontSize: 20, color: "#0f172a" }}>
          コース完了
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, lineHeight: 1.7 }}
        >
          基礎ルートを最後まで進めると、このコースの完了です。
        </Typography>
      </Box>

      <Chip
        label={isCompleted ? "達成済み" : "ゴール"}
        size="small"
        sx={{
          fontWeight: 900,
          bgcolor: isCompleted ? "#dcfce7" : "#eff6ff",
          color: isCompleted ? "#15803d" : "#1d4ed8",
        }}
      />
    </Box>
  );
};

const groupChallengesByParentId = (missions: CourseRoadmapMission[]) => {
  return missions
    .filter((mission) => mission.type === "challenge")
    .reduce<Record<string, CourseRoadmapMission[]>>((acc, mission) => {
      if (!mission.parentMissionId) {
        return acc;
      }

      acc[mission.parentMissionId] ??= [];
      acc[mission.parentMissionId].push(mission);
      acc[mission.parentMissionId].sort(
        (a, b) => a.branchOrder - b.branchOrder
      );

      return acc;
    }, {});
};

export const CourseRoadmapFlow = ({
  course,
  onMissionClick,
  onMissionDetailClick,
}: CourseRoadmapFlowProps) => {
  const mainMissions = course.missions
    .filter((mission) => mission.isRequiredForCourseCompletion)
    .sort((a, b) => a.order - b.order);

  const challengeMissionsByParentId = groupChallengesByParentId(course.missions);
  const roadmapNodeCount = mainMissions.length + 1;
  const desktopRoadmapWidth =
    roadmapNodeCount * MAIN_NODE_WIDTH +
    Math.max(0, roadmapNodeCount - 1) * MAIN_NODE_GAP;
  const hasDesktopChallenges = mainMissions.some(
    (mission) => (challengeMissionsByParentId[mission.id] ?? []).length > 0
  );

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ px: { xs: 0, md: 0.5 } }}
      >
        <Box>
          <Typography variant="h5" fontWeight={900} letterSpacing={0}>
            ミッションロードマップ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            基礎を左から右へ進め、枝分かれした挑戦ミッションは好きなタイミングで取り組めます。
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label="基礎ルート"
            size="small"
            sx={{ fontWeight: 900, bgcolor: "#eff6ff", color: "#1d4ed8" }}
          />
          <Chip
            label="挑戦ミッション"
            size="small"
            sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#c2410c" }}
          />
        </Stack>
      </Stack>

      <Box
        sx={{
          display: { xs: "none", md: "block" },
          overflowX: "auto",
          overflowY: "visible",
          pb: 2,
          mx: -1,
          px: 1,
          scrollbarWidth: "thin",
        }}
      >
        <Box
          sx={{
            minWidth: Math.max(1040, desktopRoadmapWidth),
            minHeight: hasDesktopChallenges ? 760 : 380,
            py: 2,
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: MAIN_LINE_TOP,
              left: MAIN_NODE_WIDTH / 2,
              right: MAIN_NODE_WIDTH / 2,
              height: 4,
              borderRadius: 999,
              bgcolor: "#cbd5e1",
            }}
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: `${MAIN_NODE_GAP}px`,
            }}
          >
            {mainMissions.map((mission) => {
              return (
                <Box
                  key={mission.id}
                  sx={{
                    width: MAIN_NODE_WIDTH,
                    flex: `0 0 ${MAIN_NODE_WIDTH}px`,
                    position: "relative",
                  }}
                >
                  <MissionRoadmapNode
                    mission={mission}
                    isNext={course.nextMission?.id === mission.id}
                    onMissionClick={onMissionClick}
                    onMissionDetailClick={onMissionDetailClick}
                    variant="main"
                  />
                </Box>
              );
            })}

            <Box
              sx={{
                width: MAIN_NODE_WIDTH,
                flex: `0 0 ${MAIN_NODE_WIDTH}px`,
                position: "relative",
              }}
            >
              <CourseCompleteNode isCompleted={course.status === "completed"} />
            </Box>
          </Box>

          {mainMissions.map((mission, index) => {
            const challengeMissions = challengeMissionsByParentId[mission.id] ?? [];

            if (challengeMissions.length === 0) {
              return null;
            }

            const parentLeft = index * (MAIN_NODE_WIDTH + MAIN_NODE_GAP);
            const branchX = parentLeft + MAIN_NODE_WIDTH + MAIN_NODE_GAP / 2;
            const challengeLeft = Math.max(
              0,
              Math.min(
                desktopRoadmapWidth - MAIN_NODE_WIDTH,
                branchX - MAIN_NODE_WIDTH / 2
              )
            );

            return (
              <Box key={`${mission.id}-challenge-branch`}>
                <Box
                  sx={{
                    position: "absolute",
                    top: MAIN_LINE_TOP,
                    left: branchX,
                    width: 0,
                    height: CHALLENGE_TOP - MAIN_LINE_TOP,
                    borderLeft: "4px solid #cbd5e1",
                    transform: "translateX(-50%)",
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    top: CHALLENGE_TOP,
                    left: challengeLeft,
                    width: MAIN_NODE_WIDTH,
                  }}
                >
                  <Stack spacing={1.25}>
                    {challengeMissions.map((challenge) => (
                      <MissionRoadmapNode
                        key={challenge.id}
                        mission={challenge}
                        isNext={false}
                        onMissionClick={onMissionClick}
                        onMissionDetailClick={onMissionDetailClick}
                        variant="challenge"
                      />
                    ))}
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
        {mainMissions.map((mission, index) => {
          const challengeMissions = challengeMissionsByParentId[mission.id] ?? [];

          return (
            <Box key={mission.id}>
              <MissionRoadmapNode
                mission={mission}
                isNext={course.nextMission?.id === mission.id}
                onMissionClick={onMissionClick}
                onMissionDetailClick={onMissionDetailClick}
                variant="main"
              />

              {challengeMissions.length > 0 && (
                <Box sx={{ mt: 1.5, pl: 2, borderLeft: "4px solid #cbd5e1" }}>
                  <Stack spacing={1.25}>
                    {challengeMissions.map((challenge) => (
                      <MissionRoadmapNode
                        key={challenge.id}
                        mission={challenge}
                        isNext={false}
                        onMissionClick={onMissionClick}
                        onMissionDetailClick={onMissionDetailClick}
                        variant="challenge"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {index < mainMissions.length - 1 && (
                <Box
                  sx={{
                    width: 3,
                    height: 24,
                    bgcolor: "#cbd5e1",
                    ml: 3,
                    my: 1,
                    borderRadius: 999,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
};
