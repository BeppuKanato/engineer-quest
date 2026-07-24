import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import StarsIcon from "@mui/icons-material/Stars";
import {
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React from "react";

import { getMascotImagePath } from "@/app/component/mascot";

import { Mission, MissionTab, TargetAchievement } from "../type";

type MissionHeroCardProps = {
  mission: Mission | null;
  recommendedMission: Mission | null;
  targetAchievement: TargetAchievement | null;
  mascotId: string;
  tab: MissionTab;
  onChangeTab: (value: MissionTab) => void;
};

const getAchievementProgress = (achievement: TargetAchievement | null) => {
  if (!achievement) return 0;

  const totalGoal = achievement.factor.reduce((sum, item) => sum + item.goal, 0);
  const totalProgress = achievement.factor.reduce(
    (sum, item) => sum + Math.min(item.progress, item.goal),
    0
  );

  return totalGoal === 0 ? 0 : Math.round((totalProgress / totalGoal) * 100);
};

const MascotCoach = ({ message, mascotId }: { message: string; mascotId: string }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        right: { xs: 20, md: 54 },
        top: { xs: 92, md: 88 },
        display: { xs: "none", md: "block" },
        width: 300,
      }}
    >
      <Box
        sx={{
          position: "relative",
          ml: "auto",
          mb: 2,
          width: 210,
          p: 2,
          borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.92)",
          color: "#0f172a",
          fontWeight: 900,
          lineHeight: 1.55,
          boxShadow: "0 14px 30px rgba(0,0,0,0.14)",
          "&::after": {
            content: '""',
            position: "absolute",
            right: 34,
            bottom: -12,
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "14px solid #fff",
          },
        }}
      >
        {message}
      </Box>
      <Box
        sx={{
          width: 178,
          height: 178,
          ml: "auto",
          borderRadius: "50%",
          overflow: "hidden",
          border: "6px solid rgba(255,255,255,0.9)",
          bgcolor: "#fff",
          boxShadow: "0 22px 48px rgba(0,0,0,0.24)",
        }}
      >
        <Box
          component="img"
          src={getMascotImagePath(mascotId, "face")}
          alt="学習を応援する相棒の顔"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.08)",
          }}
        />
      </Box>
    </Box>
  );
};
export const MissionHeroCard: React.FC<MissionHeroCardProps> = ({
  mission,
  recommendedMission,
  targetAchievement,
  mascotId,
  tab,
  onChangeTab,
}) => {
  const isAchievementTab = tab === "achievement";
  const achievementProgress = getAchievementProgress(targetAchievement);
  const heroKey = isAchievementTab ? targetAchievement?.title ?? "empty-achievement" : mission?.id ?? "empty-mission";
  const missionProgress = mission?.progress ?? 0;
  const coachMessage = isAchievementTab
    ? "今日の積み上げが目標達成につながるよ。"
    : "あと少し。この調子で進めよう。";

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #dbeafe",
        boxShadow: "0 18px 44px rgba(0, 72, 180, 0.14)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 500, md: 380 },
          p: { xs: 3, md: 5 },
          pr: { xs: 3, md: 40 },
          color: "#fff",
          background:
            "radial-gradient(circle at 80% 18%, rgba(255,255,255,0.18), transparent 26%), linear-gradient(135deg, #0057e7 0%, #0041c4 52%, #003189 100%)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.42,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.55) 0 2px, transparent 3px)",
            backgroundSize: "72px 72px",
          }}
        />

        <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => onChangeTab(value)}
            sx={{
              width: "fit-content",
              minHeight: 48,
              p: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.16)",
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                minHeight: 40,
                px: { xs: 2, md: 4 },
                borderRadius: 999,
                color: "rgba(255,255,255,0.8)",
                fontWeight: 900,
                letterSpacing: 0,
              },
              "& .Mui-selected": {
                bgcolor: "#fff",
                color: "#0b4ac8",
              },
            }}
          >
            <Tab value="today" label="今日の学習" />
            <Tab value="achievement" label="目標実績" />
          </Tabs>

          <AnimatePresence mode="wait">
            <motion.div
              key={heroKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {isAchievementTab ? (
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <StarsIcon />
                    <Typography fontWeight={900}>設定中の目標</Typography>
                  </Stack>

                  <Box>
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: { xs: 34, md: 52 },
                        fontWeight: 950,
                        lineHeight: 1.08,
                        letterSpacing: 0,
                      }}
                    >
                      {targetAchievement?.title ?? "目標実績を設定しよう"}
                    </Typography>
                    <Typography sx={{ mt: 2, maxWidth: 620, color: "rgba(255,255,255,0.9)", lineHeight: 1.8 }}>
                      {targetAchievement
                        ? "自分で決めた実績に向けて、今日の学習を積み上げましょう。"
                        : "実績一覧から目標を選ぶと、ホームで進捗を確認できます。"}
                    </Typography>
                  </Box>

                  <Box sx={{ maxWidth: 560 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography fontWeight={900}>目標達成率</Typography>
                      <Typography fontWeight={900}>{achievementProgress}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={achievementProgress}
                      sx={{
                        height: 14,
                        borderRadius: 999,
                        bgcolor: "rgba(255,255,255,0.22)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          background: "linear-gradient(90deg, #fbbf24 0%, #34d399 100%)",
                        },
                      }}
                    />
                  </Box>

                  <Button
                    component={Link}
                    href={targetAchievement ? targetAchievement.href ?? recommendedMission?.href ?? "/courses" : "/achievements"}
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      width: "fit-content",
                      minHeight: 56,
                      px: 4,
                      borderRadius: 2,
                      bgcolor: "#fff",
                      color: "#0b4ac8",
                      fontWeight: 900,
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#f8fafc", boxShadow: "none" },
                    }}
                  >
                    {targetAchievement ? targetAchievement.actionLabel ?? "学習を続ける" : "目標を設定する"}
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <FlagIcon />
                    <Typography fontWeight={900}>今日の学習</Typography>
                  </Stack>

                  <Box>
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: { xs: 36, md: 56 },
                        fontWeight: 950,
                        lineHeight: 1.08,
                        letterSpacing: 0,
                      }}
                    >
                      {mission?.title ?? "次に学ぶミッションを選ぼう"}
                    </Typography>
                    <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.9)", lineHeight: 1.8 }}>
                      {mission
                        ? mission.reason
                        : "進行中または未完了のミッションが見つかりません。コース一覧から学習先を選べます。"}
                    </Typography>
                  </Box>

                  {mission && (
                  <Box sx={{ maxWidth: 560 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography fontWeight={900}>ミッション進捗</Typography>
                      <Typography fontWeight={900}>{missionProgress}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={missionProgress}
                      sx={{
                        height: 14,
                        borderRadius: 999,
                        bgcolor: "rgba(255,255,255,0.22)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          background: "linear-gradient(90deg, #fbbf24 0%, #fde68a 100%)",
                        },
                      }}
                    />
                  </Box>
                  )}

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
                    <Button
                      component={Link}
                      href={mission?.href ?? "/courses"}
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        minHeight: 56,
                        px: 4,
                        borderRadius: 2,
                        bgcolor: "#fff",
                        color: "#0b4ac8",
                        fontWeight: 900,
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#f8fafc", boxShadow: "none" },
                      }}
                    >
                      {mission?.ctaLabel ?? "コース一覧を見る"}
                    </Button>
                    {mission && (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          icon={<AccessTimeIcon />}
                          label={`約${mission.estimatedMinutes}分`}
                          sx={{
                            width: "fit-content",
                            bgcolor: "rgba(255,255,255,0.16)",
                            color: "#fff",
                            fontWeight: 900,
                            "& .MuiChip-icon": { color: "#bfdbfe" },
                          }}
                        />
                        {mission.activityCount > 0 && (
                          <Chip
                            label={`${mission.activityCount} アクティビティ`}
                            sx={{ width: "fit-content", bgcolor: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 900 }}
                          />
                        )}
                        {mission.rewardExp > 0 && (
                          <Chip
                            icon={<EmojiEventsIcon />}
                            label={`完了報酬 ${mission.rewardExp} EXP`}
                            sx={{
                              width: "fit-content",
                              bgcolor: "rgba(255,255,255,0.16)",
                              color: "#fff",
                              fontWeight: 900,
                              "& .MuiChip-icon": { color: "#fbbf24" },
                            }}
                          />
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Stack>
              )}
            </motion.div>
          </AnimatePresence>
        </Stack>

        <MascotCoach message={coachMessage} mascotId={mascotId} />
      </Box>
    </Card>
  );
};
