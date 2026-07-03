"use client";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockIcon from "@mui/icons-material/Lock";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { Alert, Box, Chip, Container, LinearProgress, MenuItem, Paper, Select, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getCollection, type CollectionKnowledgeTip, type CollectionResponse } from "@/api/collection.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const rarityStyle = {
  COMMON: { label: "Common", color: "#0f766e", bgcolor: "#e6fffb", border: "#99f6e4" },
  RARE: { label: "Rare", color: "#1d4ed8", bgcolor: "#dbeafe", border: "#93c5fd" },
  EPIC: { label: "Epic", color: "#7e22ce", bgcolor: "#f3e8ff", border: "#d8b4fe" },
} as const;

export default function KnowledgeCardsPage() {
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [activeCourse, setActiveCourse] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setCollection(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getCollection(token);

        if (!isMounted) return;
        setCollection(data);
        const firstCollected = data.knowledgeTips.items.find((tip) => tip.isCollected);
        setSelectedCardId((current) => current ?? firstCollected?.id ?? data.knowledgeTips.items[0]?.id ?? null);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("知識カードを取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const cards = useMemo(
    () => collection?.knowledgeTips.items ?? [],
    [collection]
  );
  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    cards.forEach((card) => map.set(card.courseId, card.courseTitle));
    return [...map.entries()].map(([id, title]) => ({ id, title }));
  }, [cards]);

  const shownCards = useMemo(() => {
    const filtered = activeCourse === "all" ? cards : cards.filter((card) => card.courseId === activeCourse);
    return [...filtered].sort((a, b) => {
      if (sort === "rarity") {
        const order = { EPIC: 3, RARE: 2, COMMON: 1 };
        return order[b.rarity] - order[a.rarity];
      }
      if (sort === "course") return a.courseTitle.localeCompare(b.courseTitle, "ja");
      return new Date(b.collectedAt ?? 0).getTime() - new Date(a.collectedAt ?? 0).getTime();
    });
  }, [activeCourse, cards, sort]);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? shownCards[0] ?? null,
    [cards, selectedCardId, shownCards]
  );

  const collectedCount = collection?.knowledgeTips.collectedCount ?? 0;
  const totalCount = collection?.knowledgeTips.totalCount ?? 0;
  const progress = totalCount === 0 ? 0 : Math.round((collectedCount / totalCount) * 100);
  const commonCount = cards.filter((card) => card.isCollected && card.rarity === "COMMON").length;
  const rareCount = cards.filter((card) => card.isCollected && card.rarity === "RARE").length;
  const epicCount = cards.filter((card) => card.isCollected && card.rarity === "EPIC").length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        {isLoading ? (
          <KnowledgeSkeleton />
        ) : (
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 52 } }}>知識カード</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, fontSize: 17 }}>学習で獲得した知識カードをコースごとに確認・復習できます。</Typography>
              </Box>
              <Chip icon={<InfoOutlinedIcon />} label="学習完了時に獲得" sx={{ alignSelf: { xs: "flex-start", md: "center" }, px: 1, py: 2.3, fontWeight: 900, color: "#0052d9", bgcolor: "#fff", border: "1px solid #bfdbfe" }} />
            </Stack>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "80px 1fr 120px 120px 120px" }, gap: 2, alignItems: "center" }}>
                <Box sx={{ width: 64, height: 64, borderRadius: 2, display: "grid", placeItems: "center", color: "#7e22ce", bgcolor: "#f3e8ff" }}><MenuBookIcon sx={{ fontSize: 42 }} /></Box>
                <Box>
                  <Typography fontWeight={900}>獲得済みカード</Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="h4" fontWeight={900}>{collectedCount} / {totalCount} 枚</Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 10, borderRadius: 999 }} />
                    <Typography fontWeight={900}>{progress}%</Typography>
                  </Stack>
                </Box>
                <RarityCount label="Common" value={commonCount} color="#0f766e" bg="#e6fffb" />
                <RarityCount label="Rare" value={rareCount} color="#1d4ed8" bg="#dbeafe" />
                <RarityCount label="Epic" value={epicCount} color="#7e22ce" bg="#f3e8ff" />
              </Box>
            </Paper>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 390px" }, gap: 3, alignItems: "start" }}>
              <Stack spacing={2}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                    <ToggleButtonGroup value={activeCourse} exclusive onChange={(_, value) => value && setActiveCourse(value)} size="small" sx={{ gap: 1, flexWrap: "wrap", "& .MuiToggleButton-root": { border: 0, borderRadius: 2, px: 2, fontWeight: 900, bgcolor: "#eef2f7" }, "& .Mui-selected": { bgcolor: "#0052d9 !important", color: "#fff !important" } }}>
                      <ToggleButton value="all">すべて</ToggleButton>
                      {courseOptions.map((course) => <ToggleButton key={course.id} value={course.id}>{course.title}</ToggleButton>)}
                    </ToggleButtonGroup>
                    <Select size="small" value={sort} onChange={(event) => setSort(event.target.value)} sx={{ minWidth: 150, borderRadius: 2 }}>
                      <MenuItem value="newest">新しい順</MenuItem>
                      <MenuItem value="rarity">レア度順</MenuItem>
                      <MenuItem value="course">コース順</MenuItem>
                    </Select>
                  </Stack>
                </Paper>

                <Stack spacing={2}>
                  {courseOptions
                    .filter((course) => activeCourse === "all" || course.id === activeCourse)
                    .map((course) => {
                      const courseCards = shownCards.filter((card) => card.courseId === course.id);
                      if (courseCards.length === 0) return null;
                      const courseCollected = courseCards.filter((card) => card.isCollected).length;
                      return (
                        <Paper key={course.id} elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
                          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                            <MenuBookIcon sx={{ color: "#0052d9" }} />
                            <Typography variant="h5" fontWeight={900} sx={{ flex: 1 }}>{course.title}</Typography>
                            <Chip label={`${courseCollected} / ${courseCards.length} 枚`} sx={{ fontWeight: 900, color: "#0052d9", bgcolor: "#eaf2ff" }} />
                          </Stack>
                          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
                            {courseCards.map((card) => (
                              <KnowledgeCardTile key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCardId(card.id)} />
                            ))}
                          </Box>
                        </Paper>
                      );
                    })}
                </Stack>
              </Stack>

              <KnowledgeDetailPanel card={selectedCard} />
            </Box>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

const RarityCount = ({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) => (
  <Stack alignItems="center">
    <Chip label={label} size="small" sx={{ fontWeight: 900, color, bgcolor: bg }} />
    <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{value}<Typography component="span" fontSize={14} fontWeight={900}> 枚</Typography></Typography>
  </Stack>
);

const KnowledgeCardTile = ({ card, selected, onClick }: { card: CollectionKnowledgeTip; selected: boolean; onClick: () => void }) => {
  const style = rarityStyle[card.rarity];
  return (
    <Paper component="button" type="button" elevation={0} onClick={onClick} sx={{ appearance: "none", textAlign: "left", p: 1.5, minHeight: 112, borderRadius: 2, border: selected ? "2px solid #0052d9" : "1px solid #dbe3ef", bgcolor: card.isCollected ? "#fff" : "#f8fafc", opacity: card.isCollected ? 1 : 0.72, cursor: "pointer" }}>
      <Stack direction="row" spacing={1.5}>
        <Box sx={{ width: 54, height: 54, borderRadius: 2, display: "grid", placeItems: "center", color: card.isCollected ? style.color : "#94a3b8", bgcolor: card.isCollected ? style.bgcolor : "#f1f5f9", flexShrink: 0 }}>
          {card.isCollected ? <MenuBookIcon /> : <LockIcon />}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mb: 0.7 }}>
            <Chip label="Web基礎" size="small" sx={{ height: 20, fontWeight: 800 }} />
            <Chip label={card.isCollected ? style.label : "???"} size="small" sx={{ height: 20, fontWeight: 900, color: style.color, bgcolor: style.bgcolor }} />
          </Stack>
          <Typography fontWeight={900}>{card.isCollected ? card.title : "???"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, lineHeight: 1.45 }}>{card.isCollected ? card.description : "この知識カードはまだ獲得できていません。"}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

const KnowledgeDetailPanel = ({ card }: { card: CollectionKnowledgeTip | null }) => {
  if (!card) return null;
  const style = rarityStyle[card.rarity];
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", minHeight: 620, position: { lg: "sticky" }, top: { lg: 88 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={900}>知識カードの詳細</Typography>
          <CloseIcon sx={{ color: "#64748b" }} />
        </Stack>
        <Stack spacing={1.5} alignItems="center" textAlign="center">
          <Box sx={{ width: 128, height: 128, borderRadius: 3, display: "grid", placeItems: "center", color: card.isCollected ? style.color : "#94a3b8", bgcolor: card.isCollected ? style.bgcolor : "#f1f5f9", border: `1px solid ${card.isCollected ? style.border : "#e2e8f0"}` }}>
            {card.isCollected ? <MenuBookIcon sx={{ fontSize: 72 }} /> : <LockIcon sx={{ fontSize: 58 }} />}
          </Box>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Chip label={card.courseTitle} sx={{ fontWeight: 800 }} />
            <Chip label={card.isCollected ? style.label : "???"} sx={{ fontWeight: 900, color: style.color, bgcolor: style.bgcolor }} />
          </Stack>
          <Typography variant="h3" fontWeight={900} sx={{ fontSize: 38 }}>{card.isCollected ? card.title : "???"}</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{card.isCollected ? card.label : "まだ獲得していない知識カードです。"}</Typography>
        </Stack>
        <Box sx={{ borderTop: "1px solid #e2e8f0", pt: 2 }}>
          <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1 }}>説明</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{card.isCollected ? card.description : "このカードを獲得すると、学習した知識をここで確認できます。"}</Typography>
        </Box>
        <DetailRow icon={<CalendarMonthIcon />} label="獲得日" value={card.collectedAt ? new Date(card.collectedAt).toLocaleString("ja-JP") : "未獲得"} />
        <DetailRow icon={<MenuBookIcon />} label="対象コース" value={card.courseTitle} />
        <DetailRow icon={<ShieldOutlinedIcon />} label="レアリティ" value={card.isCollected ? style.label : "???"} />
      </Stack>
    </Paper>
  );
};

const DetailRow = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ borderTop: "1px solid #e2e8f0", pt: 1.5 }}>
    <Box sx={{ color: "#0052d9" }}>{icon}</Box>
    <Typography fontWeight={800} sx={{ flex: 1 }}>{label}</Typography>
    <Typography color="text.secondary">{value}</Typography>
  </Stack>
);

const KnowledgeSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={96} sx={{ borderRadius: 3 }} />
    <Skeleton variant="rounded" height={92} sx={{ borderRadius: 3 }} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 390px" }, gap: 3 }}>
      <Skeleton variant="rounded" height={660} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={620} sx={{ borderRadius: 3 }} />
    </Box>
  </Stack>
);
