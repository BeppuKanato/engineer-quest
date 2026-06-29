"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import ReviewsIcon from "@mui/icons-material/Reviews";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
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
import { useEffect, useState, type ReactNode } from "react";

import {
  getHistory,
  type HistoryEvent,
  type HistoryEventType,
  type HistoryGroup,
} from "@/api/history.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const eventMeta: Record<
  HistoryEventType,
  { label: string; color: string; bgcolor: string; icon: ReactNode }
> = {
  activity_completed: {
    label: "Activity",
    color: "#16a34a",
    bgcolor: "#dcfce7",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  mission_completed: {
    label: "Mission",
    color: "#1976d2",
    bgcolor: "#dbeafe",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  course_completed: {
    label: "Course",
    color: "#7e22ce",
    bgcolor: "#f3e8ff",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  exp_gained: {
    label: "EXP",
    color: "#15803d",
    bgcolor: "#dcfce7",
    icon: <BoltIcon fontSize="small" />,
  },
  badge_ticket: {
    label: "Ticket",
    color: "#166534",
    bgcolor: "#f0fdf4",
    icon: <ConfirmationNumberIcon fontSize="small" />,
  },
  badge_acquired: {
    label: "Badge",
    color: "#0891b2",
    bgcolor: "#ecfeff",
    icon: <WorkspacePremiumIcon fontSize="small" />,
  },
  knowledge_tip_acquired: {
    label: "Tip",
    color: "#2563eb",
    bgcolor: "#eff6ff",
    icon: <AutoAwesomeIcon fontSize="small" />,
  },
  achievement_unlocked: {
    label: "Achievement",
    color: "#d97706",
    bgcolor: "#fffbeb",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  work_saved: {
    label: "Work",
    color: "#7c3aed",
    bgcolor: "#f5f3ff",
    icon: <WorkspacePremiumIcon fontSize="small" />,
  },
  ai_review: {
    label: "AI Review",
    color: "#be123c",
    bgcolor: "#fff1f2",
    icon: <ReviewsIcon fontSize="small" />,
  },
};

const HistoryEventCard = ({ event }: { event: HistoryEvent }) => {
  const meta = eventMeta[event.type];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 38,
            height: 38,
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
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography fontWeight={900}>{event.title}</Typography>
            <Chip
              label={meta.label}
              size="small"
              sx={{ color: meta.color, bgcolor: meta.bgcolor, fontWeight: 900 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {event.description}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {new Date(event.occurredAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
            {event.href && (
              <Button component={Link} href={event.href} size="small">
                詳細
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

const LoadingSkeleton = () => (
  <Stack spacing={2}>
    {[0, 1, 2, 3].map((index) => (
      <Skeleton key={index} variant="rounded" height={120} sx={{ borderRadius: 2 }} />
    ))}
  </Stack>
);

export default function HistoryPage() {
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setGroups([]);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getHistory(token);

        if (!isMounted) return;
        setGroups(data.groups);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("Historyを取得できませんでした。");
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 960, py: 4 }}>
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}
          >
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
                  History
                </Typography>
                <Typography color="text.secondary">
                  学習、獲得、制作の履歴を日付ごとに確認できます。
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <LoadingSkeleton />
          ) : groups.length === 0 ? (
            <Alert severity="info">まだ表示できる履歴がありません。</Alert>
          ) : (
            <Stack spacing={3}>
              {groups.map((group) => (
                <Box key={group.date}>
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 1.5 }}>
                    {group.date}
                  </Typography>
                  <Stack spacing={1.25}>
                    {group.events.map((event) => (
                      <HistoryEventCard key={event.id} event={event} />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
