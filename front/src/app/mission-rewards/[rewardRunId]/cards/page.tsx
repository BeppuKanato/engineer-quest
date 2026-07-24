"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import StarIcon from "@mui/icons-material/Star";
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getMissionRewardRun,
  selectMissionRewardKnowledgeCard,
  type MissionRewardRunResponse,
} from "@/api/missionRewards.api";
import { AppHeader } from "@/app/component/appHeader";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { ActionButton } from "@/app/component/actionButton";
import { BlockingProcessOverlay } from "@/app/component/blockingProcessOverlay";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { auth } from "@/lib/firebase";

import {
  KnowledgeCardRewardCard,
  MascotBubble,
  RewardHero,
  RewardPageShell,
  getRarityTone,
} from "../../_components/rewardVisuals";

export default function MissionRewardCardsPage() {
  const params = useParams<{ rewardRunId: string }>();
  const rewardRunId = params.rewardRunId;
  const router = useRouter();
  const { play } = useSoundEffect();
  const { showOverlay, startNavigation } = useNavigationFeedback();
  const [token, setToken] = useState<string | null>(null);
  const [rewardRun, setRewardRun] = useState<MissionRewardRunResponse | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
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
        setPendingCardId(data.selectedKnowledgeCard?.id ?? null);
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
    return (
      rewardRun.selectedKnowledgeCard ??
      rewardRun.candidateKnowledgeCards.find((card) => card.id === selectedCardId) ??
      null
    );
  }, [rewardRun, selectedCardId]);

  const pendingCard = useMemo(() => {
    if (!rewardRun || !pendingCardId) return null;
    return rewardRun.candidateKnowledgeCards.find((card) => card.id === pendingCardId) ?? null;
  }, [pendingCardId, rewardRun]);

  const goNextRewardStep = () => {
    startNavigation(() => {
      router.push(`/mission-rewards/${encodeURIComponent(rewardRunId)}/result`);
    });
  };

  const handlePickCard = (knowledgeCardId: string) => {
    if (isSelecting || revealedCardId || rewardRun?.selectedKnowledgeCard) return;
    setPendingCardId(knowledgeCardId);
    play("uiSelect");
  };

  const handleSelect = async () => {
    if (!token || !rewardRun || !pendingCardId || isSelecting || rewardRun.selectedKnowledgeCard) return;

    try {
      setIsSelecting(true);
      setErrorMessage(null);
      setSelectedCardId(pendingCardId);
      const result = await selectMissionRewardKnowledgeCard(token, rewardRun.id, pendingCardId);
      play("cardFlip");
      setRewardRun({ ...rewardRun, selectedKnowledgeCard: result.knowledgeCard });
      setRevealedCardId(result.knowledgeCard.id);
      window.setTimeout(() => play("cardAcquired"), 280);
    } catch (error) {
      console.error(error);
      setSelectedCardId(null);
      setPendingCardId(null);
      setErrorMessage("このカードを選択できませんでした。再読み込みして確認してください。");
    } finally {
      setIsSelecting(false);
    }
  };

  const candidateCards = rewardRun?.candidateKnowledgeCards ?? [];
  const tone = selectedCard ? getRarityTone(selectedCard.rarity) : null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef4fb" }}>
      <AppHeader />
      <PageTransitionOverlay
        open={showOverlay}
        message="次の報酬確認へ進んでいます..."
      />
      <BlockingProcessOverlay
        open={isSelecting}
        title="知識カードを獲得しています"
        description="獲得内容を保存しています。この処理中は画面を閉じないでください。"
      />
      <RewardPageShell maxWidth={1560}>
        {isLoading ? (
          <Skeleton variant="rounded" height={620} sx={{ borderRadius: 4 }} />
        ) : !rewardRun ? (
          <Alert severity="error">{errorMessage ?? "報酬データがありません。"}</Alert>
        ) : (
          <Stack spacing={3}>
            <AppBreadcrumbs
              items={[
                { label: "コレクション", href: "/collection" },
                { label: "知識カード獲得" },
              ]}
            />
            <Box sx={{ position: "relative", minHeight: { md: 190 }, pt: { md: 1 } }}>
              <RewardHero
                chip="Mission Reward"
                title="新しい知識を発見！"
                subtitle={`${rewardRun.mission.title} で手に入る Knowledge Card を1枚選びます。カードを選ぶと、中身が明らかになります。`}
              />
              <MascotBubble message={revealedCardId ? "おめでとう！新しい知識カードを獲得したよ！" : "どのカードが出るかな？"} />
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            {candidateCards.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "rgba(255,255,255,0.9)", textAlign: "center" }}>
                <Typography variant="h6" fontWeight={900}>今回選べる知識カードはありません</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>次の報酬確認へ進みます。</Typography>
                <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={goNextRewardStep} sx={{ mt: 2, minHeight: 48, fontWeight: 900, borderRadius: 2 }}>
                  次へ
                </Button>
              </Paper>
            ) : (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 300px)" },
                    justifyContent: "center",
                    gap: { xs: 2.5, md: 8, xl: 11 },
                    alignItems: "start",
                    maxWidth: "100%",
                    mx: "auto",
                    width: "100%",
                    mt: { xs: 0, md: -1 },
                  }}
                >
                  {candidateCards.map((card, index) => (
                    <Stack key={card.id} spacing={1.3} alignItems="center">
                      <KnowledgeCardRewardCard
                        card={card}
                        selected={pendingCardId === card.id}
                        disabled={
                          isSelecting ||
                          Boolean(revealedCardId)
                        }
                        index={index}
                        revealed={revealedCardId === card.id}
                        acquired={revealedCardId === card.id}
                        onSelect={() => handlePickCard(card.id)}
                      />
                      <Chip
                        icon={<StarIcon />}
                        label={`ヒント: ${getRarityTone(card.rarity).label}以上確定`}
                        sx={{
                          fontWeight: 900,
                          color: getRarityTone(card.rarity).color,
                          bgcolor: "rgba(255,255,255,0.88)",
                          border: `1px solid ${getRarityTone(card.rarity).border}`,
                          "& .MuiChip-icon": { color: "inherit" },
                        }}
                      />
                    </Stack>
                  ))}
                </Box>

                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  elevation={0}
                  sx={{
                    width: "100%",
                    maxWidth: 1160,
                    mx: "auto",
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    border: tone ? `1px solid ${tone.border}` : "1px solid #dbe3ef",
                    bgcolor: "rgba(255,255,255,0.92)",
                    boxShadow: revealedCardId && tone ? tone.glow : "0 18px 48px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  {revealedCardId && selectedCard ? (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", color: "#16a34a", bgcolor: "#dcfce7", flexShrink: 0 }}>
                          <CheckCircleIcon sx={{ fontSize: 36 }} />
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 0.8 }}>
                            <Chip label="獲得したカード" color="success" size="small" sx={{ fontWeight: 900 }} />
                            <Chip label={selectedCard.rarity} size="small" sx={{ fontWeight: 900, color: tone?.color, bgcolor: tone?.bgcolor }} />
                          </Stack>
                          <Typography variant="h5" fontWeight={900}>{selectedCard.title}</Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>{selectedCard.description}</Typography>
                          <Typography color="#047857" fontWeight={900} sx={{ mt: 0.75 }}>
                            コレクションに追加しました。
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<NavigateNextIcon />}
                        startIcon={<CollectionsBookmarkIcon />}
                        onClick={goNextRewardStep}
                        sx={{ minHeight: 54, px: 4, fontWeight: 900, borderRadius: 2, flexShrink: 0 }}
                      >
                        次へ進む
                      </Button>
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "180px minmax(0, 1fr) 260px" },
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-start" } }}>
                        <Box sx={{ width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", color: "#2563eb", bgcolor: "#dbeafe" }}>
                          <HelpOutlineIcon sx={{ fontSize: 38 }} />
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" fontWeight={900}>
                          {pendingCard ? "このカードを獲得しますか？" : "3枚の伏せカードから1枚だけ選んでください"}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                          {pendingCard
                            ? "選んだカードでよければ、獲得ボタンを押してください。"
                            : "カードをクリックして候補を選び、獲得ボタンで中身を明らかにします。"}
                        </Typography>
                      </Box>
                      <ActionButton
                        variant="contained"
                        size="large"
                        endIcon={<NavigateNextIcon />}
                        startIcon={<CollectionsBookmarkIcon />}
                        loading={isSelecting}
                        loadingLabel="獲得中..."
                        disabled={!pendingCard || isSelecting}
                        onClick={handleSelect}
                        sx={{ minHeight: 54, px: 3, fontWeight: 900, borderRadius: 2 }}
                      >
                        このカードを獲得する
                      </ActionButton>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Stack>
        )}
      </RewardPageShell>
    </Box>
  );
}
