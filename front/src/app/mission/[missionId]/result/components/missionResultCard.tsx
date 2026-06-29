"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RouteIcon from "@mui/icons-material/Route";
import StarIcon from "@mui/icons-material/Star";
import { Alert, Box, Button, Chip, Paper, Stack, Typography, keyframes } from "@mui/material";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useSoundEffect } from "@/app/component/soundFeedback";
import type { CollectKnowledgeCardResponse, CompleteMissionResponse, KnowledgeCardChoice } from "../../play/type";
import { CountUpExp } from "./countUpExp";
import { MissionResultConfetti } from "./missionResultConfetti";

const trophyFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-7px) scale(1.04); }
`;

const rewardPulse = keyframes`
  0% { transform: scale(0.98); opacity: 0; }
  60% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

type MissionResultCardProps = {
  result: CompleteMissionResponse;
  onCollectKnowledgeCard: (
    knowledgeCardId: string
  ) => Promise<CollectKnowledgeCardResponse>;
  onNextMission: () => void;
  onCourseRoadmap: () => void;
};

export const MissionResultCard = ({
  result,
  onCollectKnowledgeCard,
  onNextMission,
  onCourseRoadmap,
}: MissionResultCardProps) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { play } = useSoundEffect();
  const knowledgeCardChoices = result.knowledgeCardChoices ?? [];
  const badgeTicketTotal = (result.badgeTicketRewards ?? []).reduce(
    (sum, reward) => sum + Math.max(0, reward.amount),
    0
  );
  const lastBadgeTicketReward =
    result.badgeTicketRewards?.[result.badgeTicketRewards.length - 1] ?? null;
  const currentTicketBalance =
    lastBadgeTicketReward?.currentTickets ?? null;
  const [selectedKnowledgeCardId, setSelectedKnowledgeCardId] = useState<string | null>(null);
  const [collectedKnowledgeCard, setCollectedKnowledgeCard] =
    useState<KnowledgeCardChoice | null>(null);
  const [isCollectingKnowledgeCard, setIsCollectingKnowledgeCard] =
    useState(false);
  const [knowledgeCardError, setKnowledgeCardError] = useState<string | null>(
    null
  );

  useEffect(() => {
    play("missionComplete");
    if (badgeTicketTotal > 0) {
      window.setTimeout(() => play("ticket"), 450);
    }
  }, [badgeTicketTotal, play]);

  const handleCollectKnowledgeCard = async () => {
    if (!selectedKnowledgeCardId || collectedKnowledgeCard) return;

    try {
      setIsCollectingKnowledgeCard(true);
      setKnowledgeCardError(null);
      const response = await onCollectKnowledgeCard(selectedKnowledgeCardId);
      setCollectedKnowledgeCard(response.knowledgeCard);
      play("saveSuccess");
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setKnowledgeCardError("知識カードを追加できませんでした。もう一度試してください。");
    } finally {
      setIsCollectingKnowledgeCard(false);
    }
  };

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
              animation: `${rewardPulse} 520ms ease-out`,
            }}
          >
            <StarIcon sx={{ position: "absolute", top: 24, right: 30, color: "#fef08a", fontSize: 32 }} />
            <AutoAwesomeIcon sx={{ position: "absolute", bottom: 24, left: 30, color: "#fef08a" }} />
            <Typography sx={{ fontWeight: 900, opacity: 0.95 }}>獲得EXP</Typography>
            <CountUpExp exp={result.experienceUpdate.gainedExp} />
            <Typography sx={{ mt: 0.5, fontWeight: 900, fontSize: 20 }}>EXP</Typography>
            <Typography sx={{ mt: 1, fontWeight: 800, opacity: 0.9 }}>
              Total {result.experienceUpdate.currentExperience.toLocaleString()} EXP
            </Typography>
          </Box>

          {badgeTicketTotal > 0 && (
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid #bbf7d0",
                bgcolor: "#f0fdf4",
                boxShadow: "0 12px 28px rgba(22, 163, 74, 0.12)",
                animation: `${rewardPulse} 520ms ease-out 120ms both`,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "#dcfce7",
                      color: "#16a34a",
                    }}
                  >
                    <ConfirmationNumberIcon />
                  </Box>
                  <Box>
                    <Typography fontWeight={900} color="#166534">
                      Badge Ticket +{badgeTicketTotal}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tech Icon Badgeを獲得するためのチケットを受け取りました
                      {currentTicketBalance !== null
                        ? ` / 所持 ${currentTicketBalance}枚`
                        : ""}
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  component={Link}
                  href="/badges"
                  variant="contained"
                  color="success"
                  sx={{ fontWeight: 900, borderRadius: 2 }}
                >
                  Badge Gachaへ
                </Button>
              </Stack>
            </Box>
          )}

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

          {knowledgeCardChoices.length > 0 && (
            <Box sx={{ p: 2.5, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff", boxShadow: "0 12px 28px rgba(37, 99, 235, 0.1)" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeIcon sx={{ color: "#2563eb" }} />
                <Typography fontWeight={900} color="#1d4ed8">
                  新しい知識を発見！
                </Typography>
              </Stack>

              {collectedKnowledgeCard ? (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "#fff", border: "1px solid #93c5fd" }}>
                  <Chip
                    label={collectedKnowledgeCard.label}
                    size="small"
                    sx={{ mb: 1, bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 900 }}
                  />
                  <Typography variant="h6" fontWeight={900}>
                    {collectedKnowledgeCard.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
                    {collectedKnowledgeCard.description}
                  </Typography>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    コレクションに追加されました
                  </Alert>
                </Box>
              ) : (
                <>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    コースに関連する知識カードを1枚選んで、コレクションに追加できます。
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 2 }}>
                    {knowledgeCardChoices.map((card) => {
                      const selected = selectedKnowledgeCardId === card.id;

                      return (
                        <Button
                          key={card.id}
                          variant={selected ? "contained" : "outlined"}
                          onClick={() => setSelectedKnowledgeCardId(card.id)}
                          disabled={isCollectingKnowledgeCard}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            justifyContent: "flex-start",
                            textAlign: "left",
                            textTransform: "none",
                          }}
                        >
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                              <Chip
                                label={card.label}
                                size="small"
                                sx={{
                                  bgcolor: selected ? "rgba(255,255,255,0.22)" : "#dbeafe",
                                  color: selected ? "#fff" : "#1d4ed8",
                                  fontWeight: 900,
                                }}
                              />
                              <Chip
                                label={card.rarity}
                                size="small"
                                sx={{
                                  bgcolor: selected ? "rgba(255,255,255,0.18)" : "#fef3c7",
                                  color: selected ? "#fff" : "#92400e",
                                  fontWeight: 900,
                                }}
                              />
                            </Stack>
                            <Typography fontWeight={900}>{card.title}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, opacity: selected ? 0.9 : 0.75 }}>
                              {card.description}
                            </Typography>
                          </Box>
                        </Button>
                      );
                    })}
                  </Stack>
                  {knowledgeCardError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {knowledgeCardError}
                    </Alert>
                  )}
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!selectedKnowledgeCardId || isCollectingKnowledgeCard}
                    onClick={handleCollectKnowledgeCard}
                    sx={{ mt: 2, minHeight: 48, fontWeight: 900, borderRadius: 2 }}
                  >
                    {isCollectingKnowledgeCard ? "追加中..." : "この知識カードを追加する"}
                  </Button>
                </>
              )}
            </Box>
          )}

          {result.unlockedAchievements.length > 0 && (
            <Box sx={{ p: 2.5, borderRadius: 2, border: "1px solid #fde68a", bgcolor: "#fffbeb", boxShadow: "0 12px 28px rgba(217, 119, 6, 0.12)" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEventsIcon sx={{ color: "#d97706" }} />
                <Typography fontWeight={900} color="#92400e">
                  新しい実績を獲得しました
                </Typography>
              </Stack>
              <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                {result.unlockedAchievements.map((achievement) => (
                  <Box key={achievement.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ffffff", border: "1px solid #fde68a" }}>
                    <Typography fontWeight={900}>{achievement.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {achievement.description}
                    </Typography>
                  </Box>
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
