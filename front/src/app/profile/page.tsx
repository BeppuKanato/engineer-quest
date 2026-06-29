"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  getProfile,
  type ProfileHistoryItem,
  type ProfileHistoryType,
} from "@/api/profile.api";
import type { TechIconBadge } from "@/api/badges.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const historyMeta: Record<
  ProfileHistoryType,
  {
    label: string;
    color: string;
    bgcolor: string;
    icon: ReactNode;
  }
> = {
  mission_completed: {
    label: "Mission",
    color: "#1976d2",
    bgcolor: "#dbeafe",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  achievement_unlocked: {
    label: "Achievement",
    color: "#d97706",
    bgcolor: "#fef3c7",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  activity_completed: {
    label: "Activity",
    color: "#16a34a",
    bgcolor: "#dcfce7",
    icon: <TaskAltIcon fontSize="small" />,
  },
  badge_acquired: {
    label: "Badge",
    color: "#0891b2",
    bgcolor: "#ecfeff",
    icon: <WorkspacePremiumIcon fontSize="small" />,
  },
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const HistoryItemCard = ({ item }: { item: ProfileHistoryItem }) => {
  const meta = historyMeta[item.type];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: meta.color,
            bgcolor: meta.bgcolor,
            flexShrink: 0,
          }}
        >
          {meta.icon}
        </Box>

        <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            gap={1}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.35 }}>
                {item.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {item.description}
              </Typography>
            </Box>
            <Chip
              label={meta.label}
              size="small"
              sx={{
                alignSelf: { xs: "flex-start", sm: "center" },
                color: meta.color,
                bgcolor: meta.bgcolor,
                fontWeight: 900,
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            gap={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {formatDateTime(item.occurredAt)}
            </Typography>
            {item.href && (
              <Button
                component={Link}
                href={item.href}
                size="small"
                sx={{ fontWeight: 900 }}
              >
                詳細を見る
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

const LoadingSkeleton = () => (
  <Stack spacing={2}>
    {[0, 1, 2, 3].map((index) => (
      <Skeleton key={index} variant="rounded" height={124} sx={{ borderRadius: 2 }} />
    ))}
  </Stack>
);

export default function ProfilePage() {
  const [history, setHistory] = useState<ProfileHistoryItem[]>([]);
  const [profileUser, setProfileUser] = useState<{
    displayName: string | null;
    rank: string;
    level: number;
    exp: number;
    completedCourseCount: number;
    completedMissionCount: number;
    badgeCount: number;
  } | null>(null);
  const [recentWorks, setRecentWorks] = useState<
    {
      id: string;
      title: string;
      description: string;
      createMissionTitle: string;
      isFavorite: boolean;
      updatedAt: string;
      href: string;
    }[]
  >([]);
  const [selectedBadge, setSelectedBadge] = useState<TechIconBadge | null>(null);
  const [ticketBalance, setTicketBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setHistory([]);
        setProfileUser(null);
        setRecentWorks([]);
        setSelectedBadge(null);
        setTicketBalance(0);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getProfile(token);

        if (!isMounted) return;
        setHistory(data.history);
        setProfileUser(data.user);
        setRecentWorks(data.recentWorks);
        setSelectedBadge(data.selectedBadge);
        setTicketBalance(data.ticketBalance);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("履歴を取得できませんでした。");
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

  const historyCounts = useMemo(
    () => ({
      mission: history.filter((item) => item.type === "mission_completed")
        .length,
      achievement: history.filter(
        (item) => item.type === "achievement_unlocked"
      ).length,
      activity: history.filter((item) => item.type === "activity_completed")
        .length,
      badge: history.filter((item) => item.type === "badge_acquired").length,
    }),
    [history]
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />

      <Container maxWidth={false} sx={{ maxWidth: 960, py: 4 }}>
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
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#e0f2fe",
                    color: "#0369a1",
                  }}
                >
                  <HistoryIcon />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={900}>
                    {profileUser?.displayName ?? "Profile"}
                  </Typography>
                  <Typography color="text.secondary">
                    最近の学習履歴を確認できます。
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Rank ${profileUser?.rank ?? "-"}`} color="primary" />
                <Chip label={`Level ${profileUser?.level ?? "-"}`} color="primary" />
                <Chip label={`EXP ${profileUser?.exp?.toLocaleString() ?? "0"}`} />
                <Chip label={`Course ${profileUser?.completedCourseCount ?? 0}`} />
                <Chip label={`Mission ${historyCounts.mission}`} />
                <Chip label={`Achievement ${historyCounts.achievement}`} />
                <Chip label={`Activity ${historyCounts.activity}`} />
                <Chip label={`Badge ${profileUser?.badgeCount ?? historyCounts.badge}`} />
                <Chip label={`Ticket ${ticketBalance}`} color="success" />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button component={Link} href="/my-works" variant="outlined" startIcon={<FolderSpecialIcon />} sx={{ fontWeight: 900, borderRadius: 2 }}>
                  My Works
                </Button>
                <Button component={Link} href="/history" variant="outlined" startIcon={<HistoryIcon />} sx={{ fontWeight: 900, borderRadius: 2 }}>
                  History
                </Button>
                <Button component={Link} href="/collection" variant="outlined" startIcon={<CollectionsBookmarkIcon />} sx={{ fontWeight: 900, borderRadius: 2 }}>
                  Collection
                </Button>
              </Stack>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #e2e8f0",
                  bgcolor: "#f8fafc",
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
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#ecfeff",
                        border: "1px solid #cffafe",
                        flexShrink: 0,
                      }}
                    >
                      {selectedBadge ? (
                        <Box
                          component="img"
                          src={selectedBadge.iconUrl}
                          alt={selectedBadge.name}
                          sx={{ width: 30, height: 30, objectFit: "contain" }}
                        />
                      ) : (
                        <WorkspacePremiumIcon sx={{ color: "#0891b2" }} />
                      )}
                    </Box>
                    <Box>
                      <Typography fontWeight={900}>
                        {selectedBadge ? selectedBadge.name : "Profile Badge未設定"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedBadge
                          ? selectedBadge.description
                          : "Badge Collectionで所持Badgeをプロフィールに設定できます。"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    component={Link}
                    href="/badges"
                    variant="outlined"
                    sx={{ fontWeight: 900, borderRadius: 2 }}
                  >
                    Badge Collection
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {recentWorks.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={900}>
                    最近のMy Works
                  </Typography>
                  <Button component={Link} href="/my-works" size="small" sx={{ fontWeight: 900 }}>
                    すべて見る
                  </Button>
                </Stack>
                <Stack spacing={1.25}>
                  {recentWorks.map((work) => (
                    <Box
                      key={work.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                        bgcolor: "#fff",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={900}>{work.title}</Typography>
                        {work.isFavorite && <Chip label="Favorite" size="small" color="warning" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {work.createMissionTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {work.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          )}

          {isLoading ? (
            <LoadingSkeleton />
          ) : history.length === 0 ? (
            <Alert severity="info">まだ表示できる学習履歴がありません。</Alert>
          ) : (
            <Stack spacing={2}>
              {history.map((item) => (
                <HistoryItemCard key={item.id} item={item} />
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
