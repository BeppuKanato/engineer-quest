"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
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
import { AppHeader } from "@/app/component/appHeader";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { TechBadgeIcon } from "@/app/component/techBadgeIcon";
import { auth } from "@/lib/firebase";

const rarityStyle: Record<
  TechIconBadgeRarity,
  { label: string; color: string; bgcolor: string; borderColor: string; glow: string }
> = {
  COMMON: {
    label: "Common",
    color: "#334155",
    bgcolor: "#f1f5f9",
    borderColor: "#cbd5e1",
    glow: "0 18px 42px rgba(100, 116, 139, 0.18)",
  },
  RARE: {
    label: "Rare",
    color: "#1d4ed8",
    bgcolor: "#dbeafe",
    borderColor: "#93c5fd",
    glow: "0 22px 52px rgba(37, 99, 235, 0.28)",
  },
  EPIC: {
    label: "Epic",
    color: "#7e22ce",
    bgcolor: "#f3e8ff",
    borderColor: "#d8b4fe",
    glow: "0 26px 64px rgba(126, 34, 206, 0.32)",
  },
  LEGENDARY: {
    label: "Legendary",
    color: "#b45309",
    bgcolor: "#fef3c7",
    borderColor: "#f59e0b",
    glow: "0 30px 76px rgba(180, 83, 9, 0.36)",
  },
};

const BadgeCard = ({
  badge,
  onSelect,
  isSelecting,
}: {
  badge: BadgeCollectionItem;
  onSelect: (badgeId: string) => void;
  isSelecting: boolean;
}) => {
  const style = rarityStyle[badge.rarity];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${badge.isOwned ? style.borderColor : "#e2e8f0"}`,
        bgcolor: badge.isOwned ? "#fff" : "#f8fafc",
        opacity: badge.isOwned ? 1 : 0.72,
        minHeight: 190,
      }}
    >
      <Stack spacing={1.5} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <TechBadgeIcon
            name={badge.name}
            iconUrl={badge.iconUrl}
            isLocked={!badge.isOwned}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900} sx={{ wordBreak: "break-word" }}>
              {badge.name}
            </Typography>
            <Chip
              label={style.label}
              size="small"
              sx={{
                mt: 0.75,
                color: style.color,
                bgcolor: style.bgcolor,
                fontWeight: 900,
              }}
            />
          </Box>
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7, flex: 1 }}
        >
          {badge.description}
        </Typography>

        {badge.isOwned ? (
          <Button
            fullWidth
            variant={badge.isSelected ? "contained" : "outlined"}
            disabled={badge.isSelected || isSelecting}
            onClick={() => onSelect(badge.id)}
            sx={{ fontWeight: 900, borderRadius: 2 }}
          >
            {badge.isSelected ? "プロフィールに設定中" : "プロフィールに設定"}
          </Button>
        ) : (
          <Chip label="未獲得" sx={{ alignSelf: "flex-start", fontWeight: 900 }} />
        )}
      </Stack>
    </Paper>
  );
};

const LoadingView = () => (
  <Stack spacing={2}>
    <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 2,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Skeleton key={index} variant="rounded" height={190} sx={{ borderRadius: 2 }} />
      ))}
    </Box>
  </Stack>
);

export default function BadgesPage() {
  const { play } = useSoundEffect();
  const [token, setToken] = useState<string | null>(null);
  const [collection, setCollection] = useState<BadgeCollectionResponse | null>(
    null
  );
  const [drawnBadge, setDrawnBadge] = useState<TechIconBadge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectingBadgeId, setSelectingBadgeId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canDraw = useMemo(() => {
    if (!collection) return false;
    return (
      collection.ticketBalance > 0 &&
      collection.ownedCount < collection.totalCount &&
      !isDrawing
    );
  }, [collection, isDrawing]);

  const refreshCollection = async (idToken: string) => {
    const data = await getBadgeCollection(idToken);
    setCollection(data);
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
        setErrorMessage("Badge Collectionを取得できませんでした。");
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

  const handleDraw = async () => {
    if (!token || !canDraw) return;

    try {
      setIsDrawing(true);
      setErrorMessage(null);
      play("gachaStart");
      const result = await drawTechIconBadge(token);
      setDrawnBadge(result.badge);
      window.setTimeout(
        () => play(result.badge.rarity === "COMMON" ? "badgeCommon" : "badgeRare"),
        260
      );
      await refreshCollection(token);
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("Badge Gachaを実行できませんでした。Ticketや未獲得Badgeを確認してください。");
    } finally {
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
      await refreshCollection(token);
    } catch (error) {
      console.error(error);
      play("errorSoft");
      setErrorMessage("プロフィールBadgeを設定できませんでした。");
    } finally {
      setSelectingBadgeId(null);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />

      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        {isLoading ? (
          <LoadingView />
        ) : (
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 2,
                border: "1px solid #e2e8f0",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#ecfeff",
                        color: "#0891b2",
                      }}
                    >
                      <WorkspacePremiumIcon />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={900}>
                        Badge Collection
                      </Typography>
                      <Typography color="text.secondary">
                        Tech Icon Badgeを集めてプロフィールに設定できます
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      icon={<ConfirmationNumberIcon />}
                      label={`Ticket ${collection?.ticketBalance ?? 0}`}
                      sx={{ fontWeight: 900, bgcolor: "#f0fdf4", color: "#166534" }}
                    />
                    <Chip
                      label={`${collection?.ownedCount ?? 0}/${collection?.totalCount ?? 0}`}
                      sx={{ fontWeight: 900 }}
                    />
                  </Stack>
                </Stack>

                <Divider />

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Box>
                    <Typography fontWeight={900}>Badge Gacha</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Badge Ticketを1枚使って、未所持のTech Icon Badgeを1つ獲得します
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AutoAwesomeIcon />}
                    disabled={!canDraw}
                    onClick={handleDraw}
                    sx={{ minHeight: 48, fontWeight: 900, borderRadius: 2 }}
                  >
                    {isDrawing ? "獲得中..." : "Ticketを使う"}
                  </Button>
                </Stack>

                {drawnBadge && (
                  <Alert severity="success">
                    {drawnBadge.name} Badgeを獲得しました。
                  </Alert>
                )}
                {collection && collection.ownedCount >= collection.totalCount && (
                  <Alert severity="info">
                    すべてのTech Icon Badgeを獲得済みです。
                  </Alert>
                )}
              </Stack>
            </Paper>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Dialog
              open={Boolean(drawnBadge)}
              onClose={() => setDrawnBadge(null)}
              fullWidth
              maxWidth="sm"
            >
              {drawnBadge && (
                <>
                  <DialogContent
                    sx={{
                      p: { xs: 3, md: 4 },
                      textAlign: "center",
                      background:
                        drawnBadge.rarity === "COMMON"
                          ? "#ffffff"
                          : `linear-gradient(140deg, #ffffff 0%, ${rarityStyle[drawnBadge.rarity].bgcolor} 100%)`,
                    }}
                  >
                    <Stack spacing={2.5} alignItems="center">
                      <Chip
                        icon={<AutoAwesomeIcon />}
                        label="Badge acquired"
                        sx={{
                          fontWeight: 900,
                          color: rarityStyle[drawnBadge.rarity].color,
                          bgcolor: rarityStyle[drawnBadge.rarity].bgcolor,
                        }}
                      />
                      <Box
                        sx={{
                          width: 132,
                          height: 132,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "#fff",
                          border: `3px solid ${rarityStyle[drawnBadge.rarity].borderColor}`,
                          boxShadow: rarityStyle[drawnBadge.rarity].glow,
                        }}
                      >
                        <TechBadgeIcon
                          name={drawnBadge.name}
                          iconUrl={drawnBadge.iconUrl}
                          size={92}
                          iconSize={58}
                        />
                      </Box>
                      <Box>
                        <Typography variant="h4" fontWeight={900}>
                          {drawnBadge.name}
                        </Typography>
                        <Chip
                          label={rarityStyle[drawnBadge.rarity].label}
                          sx={{
                            mt: 1,
                            fontWeight: 900,
                            color: rarityStyle[drawnBadge.rarity].color,
                            bgcolor: rarityStyle[drawnBadge.rarity].bgcolor,
                          }}
                        />
                      </Box>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {drawnBadge.description}
                      </Typography>
                    </Stack>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      onClick={() => setDrawnBadge(null)}
                      sx={{ fontWeight: 900, borderRadius: 2 }}
                    >
                      Collectionを見る
                    </Button>
                    <Button
                      variant="contained"
                      disabled={selectingBadgeId === drawnBadge.id}
                      onClick={() => handleSelectBadge(drawnBadge.id)}
                      sx={{ fontWeight: 900, borderRadius: 2 }}
                    >
                      プロフィールに設定
                    </Button>
                  </DialogActions>
                </>
              )}
            </Dialog>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {(collection?.badges ?? []).map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onSelect={handleSelectBadge}
                  isSelecting={selectingBadgeId === badge.id}
                />
              ))}
            </Box>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
