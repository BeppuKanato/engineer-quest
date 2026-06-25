"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RouteIcon from "@mui/icons-material/Route";
import StarIcon from "@mui/icons-material/Star";
import { Box, Button, Chip, Paper, Stack, Typography, keyframes } from "@mui/material";
import { useRef } from "react";

import type { CompleteMissionResponse } from "../../play/type";
import { CountUpExp } from "./countUpExp";
import { MissionResultConfetti } from "./missionResultConfetti";

const trophyFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-7px) scale(1.04); }
`;

type MissionResultCardProps = {
  result: CompleteMissionResponse;
  onNextMission: () => void;
  onCourseRoadmap: () => void;
};

export const MissionResultCard = ({
  result,
  onNextMission,
  onCourseRoadmap,
}: MissionResultCardProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <MissionResultConfetti targetRef={cardRef} />
      <Paper
        ref={cardRef}
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4, md: 5 },
          borderRadius: 4,
          border: "1px solid #dbe3ef",
          boxShadow: "0 22px 56px rgba(15, 23, 42, 0.13)",
          overflow: "visible",
        }}
      >
        <Stack spacing={3.5}>
          <Stack alignItems="center" textAlign="center">
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Great work!"
              variant="outlined"
              sx={{
                mb: 2,
                borderRadius: 999,
                borderColor: "#60a5fa",
                bgcolor: "#eff6ff",
                color: "#1976d2",
                fontWeight: 900,
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />

            <Box
              sx={{
                width: 128,
                height: 128,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(250, 204, 21, 0.38) 0%, rgba(250, 204, 21, 0.12) 55%, rgba(255,255,255,0) 73%)",
                animation: `${trophyFloat} 2.6s ease-in-out infinite`,
              }}
            >
              <EmojiEventsIcon
                sx={{
                  fontSize: 92,
                  color: "#facc15",
                  filter: "drop-shadow(0 10px 16px rgba(234, 179, 8, 0.32))",
                }}
              />
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 1,
                fontSize: { xs: 36, md: 52 },
                fontWeight: 900,
                lineHeight: 1.15,
                color: "#1976d2",
                letterSpacing: 0,
              }}
            >
              ミッション完了！
            </Typography>
            <Typography sx={{ mt: 1, fontSize: { xs: 20, md: 25 }, fontWeight: 900 }}>
              {result.mission.title}をクリアしました
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
              すべてのアクティビティをやり遂げました。次に使える知識がまた増えました。
            </Typography>
          </Stack>

          <Box
            sx={{
              py: { xs: 3.5, md: 4.5 },
              px: 3,
              borderRadius: 3,
              textAlign: "center",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              background: "linear-gradient(120deg, #1976d2 0%, #20b8d8 54%, #4f67f6 100%)",
              boxShadow: "0 18px 38px rgba(25, 118, 210, 0.28)",
            }}
          >
            <StarIcon sx={{ position: "absolute", top: 24, right: 30, color: "#fef08a", fontSize: 32 }} />
            <AutoAwesomeIcon sx={{ position: "absolute", bottom: 24, left: 30, color: "#fef08a" }} />
            <Typography sx={{ fontWeight: 900, opacity: 0.95 }}>獲得EXP</Typography>
            <CountUpExp exp={result.mission.rewardExp} />
            <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: 20 }}>EXP</Typography>
          </Box>

          {result.mission.learnedItems.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
                できるようになったこと
              </Typography>
              <Stack spacing={1.25}>
                {result.mission.learnedItems.map((item) => (
                  <Stack
                    key={item}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #bfdbfe",
                      bgcolor: "#eff6ff",
                    }}
                  >
                    <CheckCircleIcon sx={{ color: "#22a95a", flexShrink: 0 }} />
                    <Typography fontWeight={800}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {result.unlockedChallenges.length > 0 && (
            <Box sx={{ p: 2.5, borderRadius: 2, border: "1px solid #fdba74", bgcolor: "#fff7ed" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeIcon sx={{ color: "#ea580c" }} />
                <Typography fontWeight={900} color="#c2410c">
                  挑戦ミッションが開放されました
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontWeight: 800 }}>
                {result.unlockedChallenges.map((challenge) => challenge.title).join("、")}
              </Typography>
            </Box>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<RouteIcon />}
              onClick={onCourseRoadmap}
              sx={{ minHeight: 52, fontWeight: 900, borderRadius: 2 }}
            >
              ミッションロードマップへ
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="large"
              endIcon={<PlayArrowIcon />}
              disabled={!result.nextMission}
              onClick={onNextMission}
              sx={{
                minHeight: 52,
                fontWeight: 900,
                borderRadius: 2,
                boxShadow: "0 10px 22px rgba(25, 118, 210, 0.25)",
              }}
            >
              {result.nextMission ? "次のミッションへ" : "基礎ルート完了"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
};
