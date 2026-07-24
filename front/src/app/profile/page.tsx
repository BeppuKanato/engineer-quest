"use client";

import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import HistoryIcon from "@mui/icons-material/History";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PetsIcon from "@mui/icons-material/Pets";
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
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { getCollection, type CollectionResponse } from "@/api/collection.api";
import {
  getProfile,
  type ProfileHistoryItem,
  type ProfileHistoryType,
  type ProfileResponse,
  updateProfileMascot,
} from "@/api/profile.api";
import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { ActionButton } from "@/app/component/actionButton";
import { AppSnackbar } from "@/app/component/appSnackbar";
import { AppHeader } from "@/app/component/appHeader";
import { getMascotImagePath, isMascotId, mascotOptions, type MascotId } from "@/app/component/mascot";
import { useSoundEffect } from "@/app/component/soundFeedback";
import { TechBadgeIcon } from "@/app/component/techBadgeIcon";
import {
  useAchievementNotificationMode,
  type AchievementNotificationMode,
} from "@/hooks/useAchievementNotificationMode";
import { auth } from "@/lib/firebase";

const historyMeta: Record<
  ProfileHistoryType,
  { label: string; color: string; bgcolor: string; icon: ReactNode }
> = {
  mission_completed: { label: "ミッション",
    color: "#0052d9",
    bgcolor: "#eaf2ff",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  achievement_unlocked: { label: "実績",
    color: "#d97706",
    bgcolor: "#fff7ed",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  activity_completed: {
    label: "活動",
    color: "#16a34a",
    bgcolor: "#dcfce7",
    icon: <FlagIcon fontSize="small" />,
  },
  badge_acquired: { label: "バッジ",
    color: "#0f9a9a",
    bgcolor: "#e6fffb",
    icon: <WorkspacePremiumIcon fontSize="small" />,
  },
};

const requiredExperienceForLevel = (level: number): number => {
  if (level <= 0) return 0;
  return Math.floor(100 * Math.pow(level, 1.5));
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });


export default function ProfilePage() {
  const { play } = useSoundEffect();
  const {
    mode: achievementNotificationMode,
    setMode: setAchievementNotificationMode,
  } = useAchievementNotificationMode();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
  const [selectedMascotId, setSelectedMascotId] = useState<MascotId>("red-panda");
  const [draftMascotId, setDraftMascotId] = useState<MascotId>("red-panda");
  const [isMascotDialogOpen, setIsMascotDialogOpen] = useState(false);
  const [isMascotSaving, setIsMascotSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setProfile(null);
        setCollection(null);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const [profileData, collectionData] = await Promise.all([
          getProfile(token),
          getCollection(token),
        ]);

        if (!isMounted) return;
        setProfile(profileData);
        setCollection(collectionData);
        const nextMascotId = isMascotId(profileData.user.selectedMascotId)
          ? profileData.user.selectedMascotId
          : "red-panda";
        setSelectedMascotId(nextMascotId);
        setDraftMascotId(nextMascotId);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("プロフィール情報を取得できませんでした。");
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

  const history = profile?.history ?? [];
  const user = profile?.user ?? null;
  const selectedBadge = profile?.selectedBadge ?? null;
  const selectedMascot = mascotOptions.find((mascot) => mascot.id === selectedMascotId) ?? mascotOptions[0];
  const nextLevelExp = user ? requiredExperienceForLevel(user.level + 1) : 0;
  const currentLevelExp = user ? requiredExperienceForLevel(user.level) : 0;
  const levelProgress =
    user && nextLevelExp > currentLevelExp
      ? Math.min(100, Math.round(((user.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100))
      : 0;

  const summary = {
    missions: user?.completedMissionCount ?? 0,
    badges: collection?.badges.ownedCount ?? user?.badgeCount ?? 0,
    knowledgeCards: collection?.knowledgeTips.collectedCount ?? 0,
    achievements: collection?.achievements.achievedCount ?? history.filter((item) => item.type === "achievement_unlocked").length,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <AppBreadcrumbs items={[{ label: "プロフィール" }]} />
          {isLoading ? (
            <ProfileSkeleton />
          ) : !profile || !user ? (
            <Alert severity="error">{errorMessage ?? "プロフィール情報がありません。"}</Alert>
          ) : (
            <>
            <Box>
              <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 52 } }}>
                プロフィール
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, fontSize: 17 }}>
                あなたの学習記録とアカウント情報を確認できます。
              </Typography>
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 18px 44px rgba(15, 23, 42, 0.06)" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "360px minmax(0, 1fr) 520px" }, gap: { xs: 3, lg: 4 }, alignItems: "center" }}>
                <Box component="img" src={getMascotImagePath(selectedMascotId, "normal")} alt="マスコット画像" sx={{ width: { xs: 220, md: 300 }, height: { xs: 220, md: 300 }, objectFit: "contain", mx: { xs: "auto", lg: 0 } }} />

                <Stack spacing={2.2}>
                  <Chip label="プロフィール" sx={{ alignSelf: "flex-start", fontWeight: 900, color: "#0052d9", bgcolor: "#eaf2ff" }} />
                  <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 42, md: 56 }, lineHeight: 1 }}>
                    {user.displayName ?? "Engineer"}
                  </Typography>
                  <Typography sx={{ maxWidth: 520, lineHeight: 1.8, fontSize: 17 }}>
                    Web開発に関する知識とスキルを深めるための学習プラットフォームです。
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    <Chip label={`Lv.${user.level}`} sx={{ px: 1, py: 2.4, fontWeight: 900, color: "#fff", bgcolor: "#0052d9", fontSize: 16 }} />
                    <Chip icon={<EmojiEventsIcon />} label={user.rank} sx={{ px: 1, py: 2.4, fontWeight: 900, bgcolor: "#f8fafc", fontSize: 16 }} />
                  </Stack>

                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography fontWeight={900}>EXP</Typography>
                      <LinearProgress variant="determinate" value={levelProgress} sx={{ flex: 1, height: 9, borderRadius: 999 }} />
                      <Typography fontWeight={900} color="text.secondary">
                        {user.exp.toLocaleString()} / {nextLevelExp.toLocaleString()}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: { lg: "0" }, borderLeft: { lg: "1px solid #e2e8f0" }, bgcolor: "transparent" }}>
                  <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>
                    プロフィール設定
                  </Typography>
                  <Stack spacing={1.5}>
                    <SettingRow
                      icon={<PetsIcon />}
                      label="相棒"
                      value={selectedMascot.label}
                      image={getMascotImagePath(selectedMascotId, "face")}
                      onClick={() => {
                        setDraftMascotId(selectedMascotId);
                        setIsMascotDialogOpen(true);
                      }}
                    />
                    <SettingRow
                      icon={<WorkspacePremiumIcon />}
                      label="プロフィールバッジ"
                      value={selectedBadge?.name ?? "未設定"}
                      badge={selectedBadge}
                      href="/badges"
                    />
                    <AchievementNotificationSetting
                      value={achievementNotificationMode}
                      onChange={(mode) => {
                        setAchievementNotificationMode(mode);
                        play("uiSelect");
                      }}
                    />
                  </Stack>
                </Paper>
              </Box>
            </Paper>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) 0.9fr" }, gap: 3 }}>
              <RecentActivityCard items={history.slice(0, 5)} />
              <LearningSummaryCard summary={summary} />
            </Box>
            <MascotSelectDialog
              open={isMascotDialogOpen}
              currentMascotId={selectedMascotId}
              selectedMascotId={draftMascotId}
              onClose={() => setIsMascotDialogOpen(false)}
              isSaving={isMascotSaving}
              onSelect={(mascotId) => {
                setDraftMascotId(mascotId);
                play("uiSelect");
              }}
              onConfirm={async () => {
                if (draftMascotId === selectedMascotId || isMascotSaving) return;
                setIsMascotSaving(true);
                try {
                  const currentUser = auth.currentUser;
                  if (!currentUser) {
                    throw new Error("Unauthorized");
                  }
                  const token = await currentUser.getIdToken();
                  const result = await updateProfileMascot(token, draftMascotId);
                  const nextMascotId = isMascotId(result.selectedMascotId)
                    ? result.selectedMascotId
                    : draftMascotId;
                  setSelectedMascotId(nextMascotId);
                  setDraftMascotId(nextMascotId);
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          user: {
                            ...current.user,
                            selectedMascotId: nextMascotId,
                          },
                        }
                      : current
                  );
                  setIsMascotDialogOpen(false);
                  setSnackbarOpen(true);
                  play("saveSuccess");
                } finally {
                  setIsMascotSaving(false);
                }
              }}
            />
            </>
          )}
        </Stack>
      </Container>
      <AppSnackbar open={snackbarOpen} message="相棒が変更されました。" onClose={() => setSnackbarOpen(false)} />
    </Box>
  );
}

const SettingRow = ({
  icon,
  label,
  value,
  href,
  onClick,
  image,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  onClick?: () => void;
  image?: string;
  badge?: { name: string; iconUrl: string | null } | null;
}) => (
  <Paper
    component={onClick ? "button" : Link}
    href={onClick ? undefined : href}
    type={onClick ? "button" : undefined}
    onClick={onClick}
    elevation={0}
    sx={{
      p: 1.5,
      width: "100%",
      borderRadius: 2,
      border: "1px solid #dbe3ef",
      bgcolor: "#fff",
      textDecoration: "none",
      color: "inherit",
      display: "block",
      appearance: "none",
      textAlign: "left",
      cursor: "pointer",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ width: 34, color: "#0052d9", display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography fontWeight={800} sx={{ flex: 1 }}>{label}</Typography>
      {image && <Box component="img" src={image} alt={value} sx={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />}
      {badge && <TechBadgeIcon name={badge.name} iconUrl={badge.iconUrl} size={34} iconSize={20} />}
      <Typography fontWeight={800}>{value}</Typography>
      <ChevronRightIcon sx={{ color: "#94a3b8" }} />
    </Stack>
  </Paper>
);

const achievementNotificationOptions: {
  value: AchievementNotificationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "modal",
    label: "モーダル",
    description: "実績解除時に、大きな演出画面を表示します。",
  },
  {
    value: "snackbar",
    label: "スナックバー",
    description: "実績解除時に、画面上へ小さな通知を表示します。",
  },
  {
    value: "none",
    label: "通知なし",
    description: "実績は解除されますが、即時通知は表示しません。",
  },
];

const AchievementNotificationSetting = ({
  value,
  onChange,
}: {
  value: AchievementNotificationMode;
  onChange: (mode: AchievementNotificationMode) => void;
}) => (
  <Paper
    elevation={0}
    sx={{ p: 1.5, borderRadius: 2, border: "1px solid #dbe3ef", bgcolor: "#fff" }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
      <Box sx={{ width: 34, color: "#0052d9", display: "grid", placeItems: "center" }}>
        <NotificationsActiveIcon />
      </Box>
      <Typography fontWeight={800}>実績解除通知</Typography>
    </Stack>
    <RadioGroup
      value={value}
      onChange={(event) =>
        onChange(event.target.value as AchievementNotificationMode)
      }
      aria-label="実績解除通知"
    >
      {achievementNotificationOptions.map((option) => (
        <Paper
          component="label"
          key={option.value}
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            p: 1,
            borderRadius: 2,
            cursor: "pointer",
            bgcolor: value === option.value ? "#eff6ff" : "transparent",
          }}
        >
          <Radio value={option.value} size="small" sx={{ mt: -0.5 }} />
          <Box>
            <Typography fontWeight={900}>{option.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {option.description}
            </Typography>
          </Box>
        </Paper>
      ))}
    </RadioGroup>
  </Paper>
);

const MascotSelectDialog = ({
  open,
  currentMascotId,
  selectedMascotId,
  isSaving,
  onClose,
  onSelect,
  onConfirm,
}: {
  open: boolean;
  currentMascotId: MascotId;
  selectedMascotId: MascotId;
  isSaving: boolean;
  onClose: () => void;
  onSelect: (mascotId: MascotId) => void;
  onConfirm: () => void;
}) => {
  const selectedMascot = mascotOptions.find((mascot) => mascot.id === selectedMascotId) ?? mascotOptions[0];
  const isCurrentSelection = selectedMascotId === currentMascotId;

  return (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogContent sx={{ p: { xs: 3, md: 4 } }}>
      <Typography variant="h4" fontWeight={900}>相棒を選択</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        候補を選んでから、確認ボタンで相棒を変更します。
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 300px" }, gap: 2.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          {mascotOptions.map((mascot) => {
            const selected = mascot.id === selectedMascotId;
            const current = mascot.id === currentMascotId;
            return (
              <Paper
                key={mascot.id}
                component="button"
                type="button"
                elevation={0}
                onClick={() => onSelect(mascot.id)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: selected ? "3px solid #0052d9" : current ? "2px solid #16a34a" : "1px solid #dbe3ef",
                  bgcolor: selected ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: selected ? "0 18px 42px rgba(0, 82, 217, 0.16)" : "none",
                  transition: "transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 16px 34px rgba(15, 23, 42, 0.1)",
                  },
                }}
              >
                <Box component="img" src={getMascotImagePath(mascot.id, "normal")} alt={mascot.label} sx={{ width: 150, height: 150, objectFit: "contain" }} />
                <Typography variant="h6" fontWeight={900}>{mascot.label}</Typography>
                <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 1 }} flexWrap="wrap">
                  {current && <Chip label="現在の相棒" size="small" color="success" sx={{ fontWeight: 900 }} />}
                  {selected && !current && <Chip label="選択中" size="small" sx={{ fontWeight: 900, bgcolor: "#0052d9", color: "#fff" }} />}
                  {!selected && !current && <Chip label="選択可能" size="small" sx={{ fontWeight: 900 }} />}
                </Stack>
              </Paper>
            );
          })}
        </Box>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#f8fbff" }}>
          <Stack spacing={1.5} alignItems="center" textAlign="center">
            <Box component="img" src={getMascotImagePath(selectedMascotId, "normal")} alt={selectedMascot.label} sx={{ width: 180, height: 180, objectFit: "contain" }} />
            <Typography variant="h5" fontWeight={900}>{selectedMascot.label}</Typography>
            <Chip label={selectedMascot.personality} sx={{ fontWeight: 900, color: "#0052d9", bgcolor: "#eaf2ff" }} />
            <Typography color="#334155" fontWeight={800} sx={{ lineHeight: 1.75 }}>
              {selectedMascot.message}
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button disabled={isSaving} onClick={onClose} sx={{ fontWeight: 900 }}>閉じる</Button>
      <ActionButton
        variant="contained"
        loading={isSaving}
        loadingLabel="変更中..."
        disabled={isCurrentSelection}
        onClick={onConfirm}
        sx={{ minHeight: 44, fontWeight: 900, borderRadius: 2 }}
      >
        {isCurrentSelection ? "現在の相棒" : "この相棒にする"}
      </ActionButton>
    </DialogActions>
  </Dialog>
  );
};

const RecentActivityCard = ({ items }: { items: ProfileHistoryItem[] }) => (
  <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <HistoryIcon sx={{ color: "#0052d9", fontSize: 34 }} />
        <Typography variant="h5" fontWeight={900}>最近の活動</Typography>
      </Stack>
      <Button component={Link} href="/history" sx={{ fontWeight: 900 }}>すべて見る</Button>
    </Stack>

    {items.length === 0 ? (
      <Typography color="text.secondary">まだ活動履歴がありません。</Typography>
    ) : (
      <Stack>
        {items.map((item) => {
          const meta = historyMeta[item.type];
          return (
            <Stack key={item.id} direction="row" spacing={2} alignItems="center" sx={{ py: 1.35, borderBottom: "1px solid #e2e8f0", "&:last-child": { borderBottom: 0 } }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", color: meta.color, bgcolor: meta.bgcolor, flexShrink: 0 }}>
                {meta.icon}
              </Box>
              <Typography fontWeight={800} sx={{ flex: 1, minWidth: 0 }} noWrap>{item.title}</Typography>
              <Chip label={meta.label} size="small" sx={{ minWidth: 82, fontWeight: 900, color: meta.color, bgcolor: meta.bgcolor }} />
              <Typography color="text.secondary" sx={{ width: 150, textAlign: "right" }}>{formatDateTime(item.occurredAt)}</Typography>
            </Stack>
          );
        })}
      </Stack>
    )}
  </Paper>
);

const LearningSummaryCard = ({
  summary,
}: {
  summary: {
    missions: number;
    badges: number;
    knowledgeCards: number;
    achievements: number;
  };
}) => (
  <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <BarChartIcon sx={{ color: "#0052d9", fontSize: 34 }} />
      <Typography variant="h5" fontWeight={900}>学習サマリー</Typography>
    </Stack>
    <Stack spacing={1.2}>
      <SummaryRow icon={<FlagIcon />} label="完了ミッション" value={summary.missions} suffix="件" color="#0052d9" />
      <SummaryRow icon={<WorkspacePremiumIcon />} label="獲得バッジ" value={summary.badges} suffix="個" color="#16a34a" />
      <SummaryRow icon={<MenuBookIcon />} label="知識カード" value={summary.knowledgeCards} suffix="枚" color="#7e22ce" />
      <SummaryRow icon={<EmojiEventsIcon />} label="獲得称号" value={summary.achievements} suffix="個" color="#f59e0b" />
    </Stack>
  </Paper>
);

const SummaryRow = ({ icon, label, value, suffix, color }: { icon: ReactNode; label: string; value: number; suffix: string; color: string }) => (
  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff" }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ width: 42, height: 42, borderRadius: 2, display: "grid", placeItems: "center", color, bgcolor: `${color}16` }}>{icon}</Box>
      <Typography fontWeight={800} sx={{ flex: 1 }}>{label}</Typography>
      <Typography variant="h4" fontWeight={900}>{value}</Typography>
      <Typography fontWeight={800}>{suffix}</Typography>
    </Stack>
  </Paper>
);

const ProfileSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={92} sx={{ borderRadius: 3 }} />
    <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.35fr 0.9fr" }, gap: 3 }}>
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
    </Box>
  </Stack>
);
