"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PersonIcon from "@mui/icons-material/Person";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  drawTechIconBadge,
  getBadgeCollection,
  setSelectedTechIconBadge,
  type BadgeCollectionItem,
  type BadgeCollectionResponse,
  type TechIconBadge,
  type TechIconBadgeRarity,
} from "@/api/badges.api";
import { ActionButton } from "@/app/component/actionButton";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { TechBadgeIcon } from "@/app/component/techBadgeIcon";
import { auth } from "@/lib/firebase";

const DRAW_DURATION_MS = 1500;

const rarityStyle: Record<
  TechIconBadgeRarity,
  { label: string; color: string; bgcolor: string; borderColor: string; glow: string }
> = {
  COMMON: { label: "Common", color: "#334155", bgcolor: "#f1f5f9", borderColor: "#cbd5e1", glow: "0 18px 42px rgba(100, 116, 139, 0.18)" },
  RARE: { label: "Rare", color: "#1d4ed8", bgcolor: "#dbeafe", borderColor: "#93c5fd", glow: "0 22px 52px rgba(37, 99, 235, 0.28)" },
  EPIC: { label: "Epic", color: "#7e22ce", bgcolor: "#f3e8ff", borderColor: "#d8b4fe", glow: "0 26px 64px rgba(126, 34, 206, 0.32)" },
  LEGENDARY: { label: "Legendary", color: "#b45309", bgcolor: "#fef3c7", borderColor: "#f59e0b", glow: "0 30px 76px rgba(180, 83, 9, 0.36)" },
};

type BadgeFilter = "all" | "owned" | "locked";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function BadgesPage() {
  const { play } = useSoundEffect();
  const [token, setToken] = useState<string | null>(null);
  const [collection, setCollection] = useState<BadgeCollectionResponse | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
  const [acquiredBadge, setAcquiredBadge] = useState<TechIconBadge | null>(null);
  const [filter, setFilter] = useState<BadgeFilter>("all");
  const [sort, setSort] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [selectingBadgeId, setSelectingBadgeId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canDraw = useMemo(() => {
    if (!collection) return false;
    return collection.ticketBalance > 0 && collection.ownedCount < collection.totalCount && !isDrawing;
  }, [collection, isDrawing]);

  const refreshCollection = async (idToken: string, nextSelectedBadgeId?: string) => {
    const data = await getBadgeCollection(idToken);
    setCollection(data);
    setSelectedBadgeId((current) => nextSelectedBadgeId ?? current ?? data.selectedBadge?.id ?? data.badges.find((badge) => badge.isOwned)?.id ?? data.badges[0]?.id ?? null);
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setToken(null);
        setCollection(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const idToken = await user.getIdToken();

        if (!isMounted) return;
        setToken(idToken);
        await refreshCollection(idToken);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("バッジコレクションを取得できませんでした。");
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

  const visibleBadges = useMemo(() => {
    const badges = collection?.badges ?? [];
    const filtered = badges.filter((badge) => {
      if (filter === "owned") return badge.isOwned;
      if (filter === "locked") return !badge.isOwned;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "rarity") {
        const order = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
        return order[b.rarity] - order[a.rarity];
      }
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      return new Date(b.acquiredAt ?? 0).getTime() - new Date(a.acquiredAt ?? 0).getTime();
    });
  }, [collection, filter, sort]);

  const selectedBadge = useMemo(() => {
    const badges = collection?.badges ?? [];
    return badges.find((badge) => badge.id === selectedBadgeId) ?? badges[0] ?? null;
  }, [collection, selectedBadgeId]);

  const handleDraw = async () => {
    if (!token || isDrawing) return;

    if (!collection || collection.ticketBalance <= 0) {
      setErrorMessage("Badge Ticket が足りません。");
      return;
    }

    if (collection.ownedCount >= collection.totalCount) {
      setErrorMessage("すべてのTech Icon Badgeを獲得済みです。");
      return;
    }

    try {
      setIsDrawing(true);
      setIsOverlayOpen(true);
      setResultOpen(false);
      setAcquiredBadge(null);
      setErrorMessage(null);
      const startedAt = Date.now();
      const result = await drawTechIconBadge(token);
      const remainingMs = Math.max(0, DRAW_DURATION_MS - (Date.now() - startedAt));

      setSelectedBadgeId(result.badge.id);
      await wait(remainingMs);
      await refreshCollection(token, result.badge.id);

      play("cardAcquired");
      setAcquiredBadge(result.badge);
      setResultOpen(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("バッジを獲得できませんでした。チケット数と未獲得バッジを確認してください。");
    } finally {
      setIsOverlayOpen(false);
      setIsDrawing(false);
    }
  };

  const handleSelectBadge = async (badgeId: string) => {
    if (!token) return;
    try {
      setSelectingBadgeId(badgeId);
      setErrorMessage(null);
      await setSelectedTechIconBadge(token, badgeId);
      play("saveSuccess");
      await refreshCollection(token, badgeId);
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールバッジを設定できませんでした。");
    } finally {
      setSelectingBadgeId(null);
    }
  };

  const progress = collection?.totalCount ? Math.round((collection.ownedCount / collection.totalCount) * 100) : 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[{ label: "コレクション", href: "/collection" }, { label: "バッジ" }]} />
          {isLoading ? (
            <BadgesSkeleton />
          ) : (
            <>
            <BadgeGachaPanel
              collection={collection}
              progress={progress}
              isDrawing={isDrawing}
              canDraw={canDraw}
              onDraw={handleDraw}
            />

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {collection && collection.ticketBalance <= 0 && collection.ownedCount < collection.totalCount && (
              <Alert severity="info">Badge Ticket が足りません。ミッション完了やレビュー保存でチケットを集めましょう。</Alert>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 420px" }, gap: 3, alignItems: "start" }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                  <ToggleButtonGroup value={filter} exclusive onChange={(_, value) => value && setFilter(value)} size="small" sx={{ gap: 1, flexWrap: "wrap", "& .MuiToggleButton-root": { border: 0, borderRadius: 2, px: 2, fontWeight: 900, bgcolor: "#f1f5f9" }, "& .Mui-selected": { bgcolor: "#0052d9 !important", color: "#fff !important" } }}>
                    <ToggleButton value="all">すべて</ToggleButton>
                    <ToggleButton value="owned">獲得済み</ToggleButton>
                    <ToggleButton value="locked">未獲得</ToggleButton>
                  </ToggleButtonGroup>
                  <Select size="small" value={sort} onChange={(event) => setSort(event.target.value)} sx={{ minWidth: 156, borderRadius: 2 }}>
                    <MenuItem value="newest">新しい順</MenuItem>
                    <MenuItem value="rarity">レア度順</MenuItem>
                    <MenuItem value="name">名前順</MenuItem>
                  </Select>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                  {visibleBadges.map((badge) => (
                    <BadgeTile key={badge.id} badge={badge} selected={selectedBadgeId === badge.id} onClick={() => setSelectedBadgeId(badge.id)} />
                  ))}
                </Box>
              </Paper>

              <BadgeDetailPanel badge={selectedBadge} onSetProfile={handleSelectBadge} isSelecting={selectingBadgeId === selectedBadge?.id} />
            </Box>
            </>
          )}
        </Stack>
      </Container>

      <BadgeDrawOverlay open={isOverlayOpen} />
      <BadgeAcquiredDialog
        badge={acquiredBadge}
        open={resultOpen}
        ticketCount={collection?.ticketBalance ?? 0}
        canDrawAgain={canDraw}
        isDrawing={isDrawing}
        isSelecting={selectingBadgeId === acquiredBadge?.id}
        onClose={() => setResultOpen(false)}
        onDrawAgain={handleDraw}
        onSetProfile={handleSelectBadge}
      />
    </Box>
  );
}

const BadgeGachaPanel = ({
  collection,
  progress,
  isDrawing,
  canDraw,
  onDraw,
}: {
  collection: BadgeCollectionResponse | null;
  progress: number;
  isDrawing: boolean;
  canDraw: boolean;
  onDraw: () => void;
}) => (
  <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 18px 44px rgba(15, 23, 42, 0.06)" }}>
    <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 52 } }}>バッジコレクション</Typography>
    <Typography color="text.secondary" sx={{ mt: 1, fontSize: 17 }}>
      チケットを使って獲得したTech Icon Badgeを確認し、プロフィールに設定できます。
    </Typography>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 380px" },
        gap: 3,
        mt: 3,
        alignItems: "stretch",
      }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px minmax(260px, 1fr) 220px" }, gap: { xs: 2, md: 3 }, alignItems: "center" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <WorkspacePremiumIcon sx={{ fontSize: 70, color: "#0f9a9a", flexShrink: 0 }} />
          <Box>
            <Typography fontWeight={900}>獲得済み</Typography>
            <Typography variant="h4" fontWeight={900}>
              {collection?.ownedCount ?? 0} / {collection?.totalCount ?? 0}
            </Typography>
          </Box>
        </Stack>
        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography fontWeight={900}>コレクション進捗</Typography>
            <Typography fontWeight={900}>{progress}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999, bgcolor: "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: "#0f9a9a" } }} />
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <ConfirmationNumberIcon sx={{ fontSize: 62, color: "#f59e0b", flexShrink: 0 }} />
          <Box>
            <Typography fontWeight={900}>Badge Ticket</Typography>
            <Typography variant="h3" fontWeight={900}>
              {collection?.ticketBalance ?? 0}
              <Typography component="span" fontSize={18} fontWeight={900}> 枚</Typography>
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #bfdbfe", bgcolor: "linear-gradient(145deg, #eff6ff 0%, #ffffff 100%)" }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 70, height: 70, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#fff7ed", color: "#f59e0b", border: "1px solid #fed7aa" }}>
              <Inventory2Icon sx={{ fontSize: 42 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900}>バッジ獲得</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.7 }}>
                Badge Ticketを1枚使って、未所持のTech Icon Badgeを1つ獲得できます。
              </Typography>
            </Box>
          </Stack>
          <Chip icon={<ConfirmationNumberIcon />} label="必要チケット: 1枚" sx={{ alignSelf: "flex-start", fontWeight: 900, bgcolor: "#fff7ed", color: "#b45309" }} />
          <ActionButton
            variant="contained"
            size="large"
            startIcon={<ConfirmationNumberIcon />}
            loading={isDrawing}
            loadingLabel="開封中..."
            disabled={!canDraw}
            onClick={onDraw}
            sx={{ minHeight: 56, px: 4, fontWeight: 900, borderRadius: 2 }}
          >
            チケットを使う
          </ActionButton>
        </Stack>
      </Paper>
    </Box>
  </Paper>
);

const BadgeTile = ({ badge, selected, onClick }: { badge: BadgeCollectionItem; selected: boolean; onClick: () => void }) => {
  const style = rarityStyle[badge.rarity];
  return (
    <Paper component="button" type="button" elevation={0} onClick={onClick} sx={{ position: "relative", appearance: "none", p: 2, minHeight: 172, borderRadius: 2, border: selected ? "2px solid #0052d9" : "1px solid #dbe3ef", bgcolor: "#fff", cursor: "pointer", opacity: badge.isOwned ? 1 : 0.64, boxShadow: selected ? "0 12px 34px rgba(0, 82, 217, 0.16)" : "none" }}>
      {selected && <CheckCircleIcon sx={{ position: "absolute", top: 10, right: 10, color: "#0052d9" }} />}
      <Stack spacing={1.1} alignItems="center" textAlign="center">
        <TechBadgeIcon name={badge.name} iconUrl={badge.iconUrl} isLocked={!badge.isOwned} size={68} iconSize={42} />
        <Typography fontWeight={900} sx={{ color: "#050505", minHeight: 24 }}>{badge.name}</Typography>
        <Chip label={style.label} size="small" sx={{ fontWeight: 900, color: style.color, bgcolor: style.bgcolor }} />
        <Chip label={badge.isOwned ? "獲得済み" : "未獲得"} size="small" sx={{ fontWeight: 900, bgcolor: badge.isOwned ? "#e6fffb" : "#f1f5f9", color: badge.isOwned ? "#0f766e" : "#64748b" }} />
      </Stack>
    </Paper>
  );
};

const BadgeDetailPanel = ({ badge, onSetProfile, isSelecting }: { badge: BadgeCollectionItem | null; onSetProfile: (badgeId: string) => void; isSelecting: boolean }) => {
  if (!badge) return null;
  const style = rarityStyle[badge.rarity];
  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", minHeight: 560, position: { lg: "sticky" }, top: { lg: 88 } }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Box sx={{ width: 148, height: 148, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#e6fffb" }}>
          <TechBadgeIcon name={badge.name} iconUrl={badge.iconUrl} isLocked={!badge.isOwned} size={104} iconSize={66} />
        </Box>
        <Box>
          <Typography variant="h3" fontWeight={900} sx={{ fontSize: 38 }}>{badge.name}</Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
            <Chip label={style.label} sx={{ fontWeight: 900, color: style.color, bgcolor: style.bgcolor }} />
            <Chip label={badge.isOwned ? "獲得済み" : "未獲得"} sx={{ fontWeight: 900, color: badge.isOwned ? "#0f766e" : "#64748b", bgcolor: badge.isOwned ? "#e6fffb" : "#f1f5f9" }} />
          </Stack>
        </Box>
        <Box sx={{ width: "100%", borderTop: "1px solid #e2e8f0", pt: 3, textAlign: "left" }}>
          <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1 }}>説明</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{badge.description}</Typography>
        </Box>
        {badge.acquiredAt && (
          <Box sx={{ width: "100%", textAlign: "left" }}>
            <Typography fontWeight={900} color="#0052d9" sx={{ mb: 1 }}>獲得日</Typography>
            <Typography color="text.secondary">{new Date(badge.acquiredAt).toLocaleString("ja-JP")}</Typography>
          </Box>
        )}
        <ActionButton
          fullWidth
          variant="contained"
          size="large"
          startIcon={<PersonIcon />}
          loading={isSelecting}
          loadingLabel="設定中..."
          disabled={!badge.isOwned || badge.isSelected || isSelecting}
          onClick={() => onSetProfile(badge.id)}
          sx={{ mt: "auto", minHeight: 54, borderRadius: 2, fontWeight: 900 }}
        >
          {badge.isSelected ? "プロフィールに設定済み" : "プロフィールに設定"}
        </ActionButton>
        <Button fullWidth component={Link} href="/collection" variant="outlined" sx={{ minHeight: 48, borderRadius: 2, fontWeight: 900 }}>
          コレクションTOPへ
        </Button>
      </Stack>
    </Paper>
  );
};

const BadgeDrawOverlay = ({ open }: { open: boolean }) => (
  <Backdrop open={open} sx={{ zIndex: (theme) => theme.zIndex.modal + 2, bgcolor: "rgba(15, 23, 42, 0.62)", color: "#fff" }}>
    <Stack spacing={3} alignItems="center" textAlign="center">
      <Box sx={{ position: "relative", width: 260, height: 220, display: "grid", placeItems: "center" }}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Box
            key={index}
            component={motion.div}
            animate={{ scale: [0.6, 1.25, 0.6], opacity: [0.25, 1, 0.25], rotate: [0, 20, 0] }}
            transition={{ duration: 1.25, repeat: Infinity, delay: index * 0.12 }}
            sx={{
              position: "absolute",
              left: `${16 + ((index * 37) % 200)}px`,
              top: `${12 + ((index * 29) % 150)}px`,
              width: 12,
              height: 12,
              borderRadius: 1,
              bgcolor: index % 2 ? "#fbbf24" : "#93c5fd",
              boxShadow: "0 0 18px currentColor",
            }}
          />
        ))}
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -1, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            width: 168,
            height: 128,
            borderRadius: "22px 22px 18px 18px",
            position: "relative",
            background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 52%, #b45309 100%)",
            border: "5px solid #92400e",
            boxShadow: "0 0 42px rgba(251, 191, 36, 0.55), 0 28px 70px rgba(0, 0, 0, 0.26)",
            "&::before": {
              content: '""',
              position: "absolute",
              left: 14,
              right: 14,
              top: -34,
              height: 52,
              borderRadius: "34px 34px 10px 10px",
              background: "linear-gradient(180deg, #fde68a 0%, #f59e0b 100%)",
              border: "5px solid #92400e",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              left: "50%",
              top: 42,
              transform: "translateX(-50%)",
              width: 42,
              height: 48,
              borderRadius: 2,
              bgcolor: "#fff7ed",
              border: "4px solid #92400e",
            },
          }}
        />
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={900}>開封中...</Typography>
        <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.82)" }}>Tech Icon Badgeを確認しています</Typography>
      </Box>
    </Stack>
  </Backdrop>
);

const BadgeAcquiredDialog = ({
  badge,
  open,
  ticketCount,
  canDrawAgain,
  isDrawing,
  isSelecting,
  onClose,
  onDrawAgain,
  onSetProfile,
}: {
  badge: TechIconBadge | null;
  open: boolean;
  ticketCount: number;
  canDrawAgain: boolean;
  isDrawing: boolean;
  isSelecting: boolean;
  onClose: () => void;
  onDrawAgain: () => void;
  onSetProfile: (badgeId: string) => void;
}) => (
  <Dialog open={open && Boolean(badge)} onClose={isDrawing ? undefined : onClose} fullWidth maxWidth="sm">
    {badge && (
      <>
        <DialogContent sx={{ p: { xs: 3, md: 4 }, textAlign: "center", background: `linear-gradient(140deg, #ffffff 0%, ${rarityStyle[badge.rarity].bgcolor} 100%)` }}>
          <Stack spacing={2.5} alignItems="center">
            <Chip icon={<AutoAwesomeIcon />} label="バッジ獲得！" sx={{ fontWeight: 900, color: rarityStyle[badge.rarity].color, bgcolor: rarityStyle[badge.rarity].bgcolor }} />
            <Box sx={{ width: 144, height: 144, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#fff", border: `3px solid ${rarityStyle[badge.rarity].borderColor}`, boxShadow: rarityStyle[badge.rarity].glow }}>
              <TechBadgeIcon name={badge.name} iconUrl={badge.iconUrl} size={100} iconSize={64} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900}>{badge.name}</Typography>
              <Chip label={rarityStyle[badge.rarity].label} sx={{ mt: 1, fontWeight: 900, color: rarityStyle[badge.rarity].color, bgcolor: rarityStyle[badge.rarity].bgcolor }} />
            </Box>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{badge.description}</Typography>
            <Chip icon={<ConfirmationNumberIcon />} label={`残りチケット ${ticketCount}枚`} sx={{ fontWeight: 900, bgcolor: "#eff6ff", color: "#0052d9" }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={onClose} sx={{ fontWeight: 900, borderRadius: 2 }}>閉じる</Button>
          <ActionButton variant="outlined" loading={isDrawing} loadingLabel="開封中..." disabled={!canDrawAgain || isDrawing} onClick={onDrawAgain} sx={{ fontWeight: 900, borderRadius: 2 }}>
            もう一度引く
          </ActionButton>
          <ActionButton variant="contained" loading={isSelecting} loadingLabel="設定中..." disabled={isSelecting} onClick={() => onSetProfile(badge.id)} sx={{ fontWeight: 900, borderRadius: 2 }}>
            プロフィールに設定
          </ActionButton>
        </DialogActions>
      </>
    )}
  </Dialog>
);

const BadgesSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={270} sx={{ borderRadius: 3 }} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 420px" }, gap: 3 }}>
      <Skeleton variant="rounded" height={600} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={560} sx={{ borderRadius: 3 }} />
    </Box>
  </Stack>
);
