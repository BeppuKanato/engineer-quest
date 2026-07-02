"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Alert, Backdrop, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getMissionRewardRun,
  selectMissionRewardKnowledgeCard,
  type MissionRewardRunResponse,
} from "@/api/missionRewards.api";
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { auth } from "@/lib/firebase";

import {
  KnowledgeCardRewardCard,
  RewardHero,
  RewardPageShell,
  getRarityTone,
} from "../../_components/rewardVisuals";

export default function MissionRewardCardsPage() {
  const params = useParams<{ rewardRunId: string }>();
  const rewardRunId = params.rewardRunId;
  const router = useRouter();
  const { play } = useSoundEffect();
  const [token, setToken] = useState<string | null>(null);
  const [rewardRun, setRewardRun] = useState<MissionRewardRunResponse | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showAcquired, setShowAcquired] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const idToken = await user.getIdToken();
        const data = await getMissionRewardRun(idToken, rewardRunId);

        if (!isMounted) return;
        setToken(idToken);
        setRewardRun(data);
        setSelectedCardId(data.selectedKnowledgeCard?.id ?? null);
        setRevealedCardId(data.selectedKnowledgeCard?.id ?? null);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("報酬データを取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [rewardRunId]);

  const selectedCard = useMemo(() => {
    if (!rewardRun || !selectedCardId) return null;
    return rewardRun.candidateKnowledgeCards.find((card) => card.id === selectedCardId) ?? null;
  }, [rewardRun, selectedCardId]);

  const acquiredCard = rewardRun?.selectedKnowledgeCard ?? selectedCard;

  const goAchievements = () => {
    router.push(`/mission-rewards/${encodeURIComponent(rewardRunId)}/achievements`);
  };

  const handleSelect = async () => {
    if (!token || !rewardRun || !selectedCardId || rewardRun.selectedKnowledgeCard) return;

    try {
      setIsSelecting(true);
      setErrorMessage(null);
      const result = await selectMissionRewardKnowledgeCard(token, rewardRun.id, selectedCardId);
      play("saveSuccess");
      setRewardRun({ ...rewardRun, selectedKnowledgeCard: result.knowledgeCard });
      setRevealedCardId(result.knowledgeCard.id);

      window.setTimeout(() => {
        setShowAcquired(true);
      }, 760);
      window.setTimeout(() => {
        router.push(`/mission-rewards/${encodeURIComponent(rewardRun.id)}/achievements`);
      }, 2200);
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("この報酬ではカードを選択できませんでした。再読み込みして確認してください。");
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <RewardPageShell>
        {isLoading ? (
          <Skeleton variant="rounded" height={520} sx={{ borderRadius: 4 }} />
        ) : !rewardRun ? (
          <Alert severity="error">{errorMessage ?? "報酬データがありません。"}</Alert>
        ) : (
          <Stack spacing={3.5}>
            <RewardHero
              chip="Mission Reward"
              title="新しい知識を発見！"
              subtitle={`${rewardRun.mission.title} で手に入れる Knowledge Card を1枚選びます。カードの中身は、選んでからのお楽しみです。`}
            />

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {rewardRun.candidateKnowledgeCards.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "rgba(255,255,255,0.88)", textAlign: "center" }}>
                <Typography variant="h6" fontWeight={900}>今回選択できる知識カードはありません</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>次の報酬確認へ進みます。</Typography>
                <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={goAchievements} sx={{ mt: 2, minHeight: 46, fontWeight: 900, borderRadius: 2 }}>
                  実績解除へ
                </Button>
              </Paper>
            ) : rewardRun.selectedKnowledgeCard ? (
              <Paper
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                elevation={0}
                sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: "1px solid #bfdbfe", bgcolor: "rgba(255,255,255,0.92)", boxShadow: "0 24px 64px rgba(37, 99, 235, 0.16)" }}
              >
                <Stack spacing={2.5} alignItems="center" textAlign="center">
                  <Chip label="ACQUIRED" color="success" sx={{ fontWeight: 900 }} />
                  <Typography variant="h5" fontWeight={900}>この報酬ではすでにカードを取得済みです</Typography>
                  <Box sx={{ width: "100%", maxWidth: 360 }}>
                    <KnowledgeCardRewardCard
                      card={rewardRun.selectedKnowledgeCard}
                      selected
                      disabled
                      index={0}
                      revealed
                      acquired
                      onSelect={() => undefined}
                    />
                  </Box>
                  <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={goAchievements} sx={{ minHeight: 48, fontWeight: 900, borderRadius: 2 }}>
                    実績解除へ
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
                  {rewardRun.candidateKnowledgeCards.map((card, index) => (
                    <KnowledgeCardRewardCard
                      key={card.id}
                      card={card}
                      selected={selectedCardId === card.id}
                      disabled={isSelecting}
                      index={index}
                      revealed={revealedCardId === card.id}
                      acquired={revealedCardId === card.id}
                      onSelect={() => {
                        if (isSelecting || revealedCardId) return;
                        setSelectedCardId(card.id);
                      }}
                    />
                  ))}
                </Box>

                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: selectedCard ? `1px solid ${getRarityTone(selectedCard.rarity).border}` : "1px solid #dbe3ef",
                    bgcolor: "rgba(255,255,255,0.9)",
                  }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                    <Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        <Chip label={selectedCard ? "選択中" : "カードを選択"} size="small" color={selectedCard ? "primary" : "default"} sx={{ fontWeight: 900 }} />
                        {selectedCard && <Chip label={`${selectedCard.rarity} の気配`} size="small" sx={{ fontWeight: 900 }} />}
                      </Stack>
                      <Typography variant="h6" fontWeight={900}>
                        {revealedCardId && selectedCard ? selectedCard.title : selectedCard ? "この伏せカードを選びますか？" : "3枚の伏せカードから1枚選んでください"}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                        {revealedCardId && selectedCard
                          ? selectedCard.description
                          : selectedCard
                            ? "確定するとカードがひっくり返り、今回獲得する知識が分かります。"
                            : "レアリティの雰囲気だけを頼りに、気になるカードを選びます。"}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!selectedCard || isSelecting || Boolean(revealedCardId)}
                      onClick={handleSelect}
                      sx={{ minHeight: 52, px: 4, fontWeight: 900, borderRadius: 2, flexShrink: 0 }}
                    >
                      {isSelecting ? "カードを開封中..." : "このカードにする"}
                    </Button>
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        )}
      </RewardPageShell>

      <Backdrop open={showAcquired} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, bgcolor: "rgba(15, 23, 42, 0.72)" }}>
        <AnimatePresence>
          {showAcquired && acquiredCard && (
            <Paper
              component={motion.div}
              initial={{ opacity: 0, scale: 0.82, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              elevation={0}
              sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, textAlign: "center", maxWidth: 440, border: "1px solid #facc15", boxShadow: "0 0 80px rgba(250, 204, 21, 0.36)" }}
            >
              <Stack spacing={2} alignItems="center">
                <AutoAwesomeIcon sx={{ fontSize: 58, color: "#f59e0b" }} />
                <Typography variant="h4" fontWeight={900}>知識カードを入手！</Typography>
                <Typography color="text.secondary" fontWeight={900}>
                  {acquiredCard.title}
                </Typography>
                <Chip label={acquiredCard.rarity} sx={{ fontWeight: 900, color: getRarityTone(acquiredCard.rarity).color, bgcolor: getRarityTone(acquiredCard.rarity).bgcolor }} />
              </Stack>
            </Paper>
          )}
        </AnimatePresence>
      </Backdrop>
    </Box>
  );
}
