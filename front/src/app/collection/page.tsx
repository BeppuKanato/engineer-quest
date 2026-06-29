"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LockIcon from "@mui/icons-material/Lock";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
  Alert,
  Box,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import {
  getCollection,
  type CollectionBadgeItem,
  type CollectionKnowledgeTip,
  type CollectionResponse,
  type CollectionAchievement,
} from "@/api/collection.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const rarityColor = {
  COMMON: { color: "#334155", bgcolor: "#f1f5f9", border: "#cbd5e1" },
  RARE: { color: "#1d4ed8", bgcolor: "#dbeafe", border: "#93c5fd" },
  EPIC: { color: "#7e22ce", bgcolor: "#f3e8ff", border: "#d8b4fe" },
  LEGENDARY: { color: "#b45309", bgcolor: "#fef3c7", border: "#f59e0b" },
};

const ProgressHeader = ({
  label,
  current,
  total,
}: {
  label: string;
  current: number;
  total: number;
}) => {
  const progress = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid #e2e8f0" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
        <Box>
          <Typography fontWeight={900}>{label}</Typography>
          <Typography color="text.secondary" variant="body2">
            {current} / {total}
          </Typography>
        </Box>
        <Box sx={{ minWidth: { xs: "100%", sm: 260 } }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
        </Box>
      </Stack>
    </Paper>
  );
};

const BadgeCard = ({ badge }: { badge: CollectionBadgeItem }) => {
  const style = rarityColor[badge.rarity];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${badge.isOwned ? style.border : "#e2e8f0"}`,
        bgcolor: badge.isOwned ? "#fff" : "#f8fafc",
        opacity: badge.isOwned ? 1 : 0.7,
        minHeight: 174,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#fff",
              border: "1px solid #e2e8f0",
            }}
          >
            {badge.isOwned ? (
              <Box component="img" src={badge.iconUrl} alt={badge.name} sx={{ width: 32, height: 32 }} />
            ) : (
              <LockIcon sx={{ color: "#94a3b8" }} />
            )}
          </Box>
          <Box>
            <Typography fontWeight={900}>{badge.name}</Typography>
            <Chip label={badge.rarity} size="small" sx={{ color: style.color, bgcolor: style.bgcolor, fontWeight: 900 }} />
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {badge.description}
        </Typography>
      </Stack>
    </Paper>
  );
};

const KnowledgeCard = ({ tip }: { tip: CollectionKnowledgeTip }) => {
  const style = rarityColor[tip.rarity];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${tip.isCollected ? style.border : "#e2e8f0"}`,
        bgcolor: tip.isCollected ? "#fff" : "#f8fafc",
        opacity: tip.isCollected ? 1 : 0.72,
        minHeight: 180,
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={tip.courseTitle} size="small" sx={{ fontWeight: 900 }} />
          <Chip label={tip.rarity} size="small" sx={{ color: style.color, bgcolor: style.bgcolor, fontWeight: 900 }} />
        </Stack>
        <Typography variant="h6" fontWeight={900}>
          {tip.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {tip.description}
        </Typography>
      </Stack>
    </Paper>
  );
};

const AchievementCard = ({ achievement }: { achievement: CollectionAchievement }) => {
  const achieved = achievement.status === "achieved";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: achieved ? "#fff" : "#f8fafc",
        opacity: achievement.status === "secret_locked" ? 0.72 : 1,
        minHeight: 180,
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            icon={achieved ? <EmojiEventsIcon /> : <LockIcon />}
            label={achieved ? "Achieved" : achievement.status === "secret_locked" ? "Secret" : "Locked"}
            size="small"
            color={achieved ? "success" : "default"}
            sx={{ fontWeight: 900 }}
          />
          <Chip label={achievement.categoryLabel} size="small" />
        </Stack>
        <Typography variant="h6" fontWeight={900}>
          {achievement.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {achievement.description}
        </Typography>
        {achievement.conditionLabel && (
          <Typography variant="caption" color="text.secondary">
            条件: {achievement.conditionLabel}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

const LoadingSkeleton = () => (
  <Grid container spacing={2}>
    {[0, 1, 2, 3, 4, 5].map((index) => (
      <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />
      </Grid>
    ))}
  </Grid>
);

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState<"badges" | "tips" | "achievements">("badges");
  const [collection, setCollection] = useState<CollectionResponse | null>(null);
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
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("Collectionを取得できませんでした。");
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
      <Container maxWidth={false} sx={{ maxWidth: 1120, py: 4 }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
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
                    Collection
                  </Typography>
                  <Typography color="text.secondary">
                    獲得したBadge、Knowledge Tip、Achievementをまとめて確認できます。
                  </Typography>
                </Box>
              </Stack>
              <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
                <Tab value="badges" label="Tech Badges" />
                <Tab value="tips" label="Knowledge Tips" />
                <Tab value="achievements" label="Achievements" />
              </Tabs>
            </Stack>
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading || !collection ? (
            <LoadingSkeleton />
          ) : (
            <>
              {activeTab === "badges" && (
                <Stack spacing={2}>
                  <ProgressHeader label="Tech Icon Badge" current={collection.badges.ownedCount} total={collection.badges.totalCount} />
                  <Grid container spacing={2}>
                    {collection.badges.items.map((badge) => (
                      <Grid key={badge.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <BadgeCard badge={badge} />
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              )}

              {activeTab === "tips" && (
                <Stack spacing={2}>
                  <ProgressHeader label="Knowledge Tips" current={collection.knowledgeTips.collectedCount} total={collection.knowledgeTips.totalCount} />
                  <Grid container spacing={2}>
                    {collection.knowledgeTips.items.map((tip) => (
                      <Grid key={tip.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <KnowledgeCard tip={tip} />
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              )}

              {activeTab === "achievements" && (
                <Stack spacing={2}>
                  <ProgressHeader label="Achievements" current={collection.achievements.achievedCount} total={collection.achievements.totalCount} />
                  <Grid container spacing={2}>
                    {collection.achievements.items.map((achievement) => (
                      <Grid key={achievement.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <AchievementCard achievement={achievement} />
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
