"use client";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import FlagIcon from "@mui/icons-material/Flag";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  getCollection,
  type CollectionResponse,
} from "@/api/collection.api";
import { AppHeader } from "@/app/component/appHeader";
import { TechBadgeIcon } from "@/app/component/techBadgeIcon";
import { auth } from "@/lib/firebase";

type RecentItem = {
  id: string;
  title: string;
  type: "badge" | "knowledge" | "achievement";
  acquiredAt: string;
  icon: ReactNode;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const buildRecentItems = (collection: CollectionResponse): RecentItem[] => {
  const badges: RecentItem[] = collection.badges.items
    .filter((badge) => badge.isOwned && badge.acquiredAt)
    .map((badge) => ({
      id: `badge-${badge.id}`,
      title: badge.name,
      type: "badge",
      acquiredAt: badge.acquiredAt!,
      icon: <TechBadgeIcon name={badge.name} iconUrl={badge.iconUrl} isLocked={false} size={28} iconSize={18} />,
    }));

  const knowledge: RecentItem[] = collection.knowledgeTips.items
    .filter((tip) => tip.isCollected && tip.collectedAt)
    .map((tip) => ({
      id: `knowledge-${tip.id}`,
      title: tip.title,
      type: "knowledge",
      acquiredAt: tip.collectedAt!,
      icon: <MenuBookIcon sx={{ color: "#7e22ce" }} />,
    }));

  const achievements: RecentItem[] = collection.achievements.items
    .filter((achievement) => achievement.status === "achieved" && achievement.achievedAt)
    .map((achievement) => ({
      id: `achievement-${achievement.id}`,
      title: achievement.title,
      type: "achievement",
      acquiredAt: achievement.achievedAt!,
      icon: <FlagIcon sx={{ color: "#0052d9" }} />,
    }));

  return [...badges, ...knowledge, ...achievements]
    .sort((a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime())
    .slice(0, 8);
};

export default function CollectionPage() {
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
        setErrorMessage("コレクションを取得できませんでした。");
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

  const recentItems = useMemo(
    () => (collection ? buildRecentItems(collection) : []),
    [collection]
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 56 }, letterSpacing: 0 }}>
              コレクション
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, fontSize: 18 }}>
              獲得した報酬や記録をまとめて確認できます。
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading || !collection ? (
            <CollectionSkeleton />
          ) : (
            <>
              <SummaryStrip collection={collection} />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
                <FeatureCard
                  tone="teal"
                  icon={<WorkspacePremiumIcon sx={{ fontSize: 74 }} />}
                  title="バッジコレクション"
                  description="バッジチケットを使って集めたTech Icon Badgeを確認できます。"
                  stat={`${collection.badges.ownedCount} 個 所持`}
                  href="/badges"
                />
                <FeatureCard
                  tone="purple"
                  icon={<MenuBookIcon sx={{ fontSize: 74 }} />}
                  title="知識カード"
                  description="ミッション完了時に発見した知識カードを確認できます。"
                  stat={`${collection.knowledgeTips.collectedCount} 枚 所持`}
                  href="/knowledge-cards"
                />
                <FeatureCard
                  tone="blue"
                  icon={<FlagIcon sx={{ fontSize: 74 }} />}
                  title="実績"
                  description="条件を達成して解除された実績を確認できます。"
                  stat={`${collection.achievements.achievedCount} 件 達成`}
                  href="/achievements"
                />
              </Box>

              <RecentSection items={recentItems} />
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

const CollectionSkeleton = () => (
  <Stack spacing={3}>
    <Skeleton variant="rounded" height={118} sx={{ borderRadius: 3 }} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} variant="rounded" height={230} sx={{ borderRadius: 3 }} />
      ))}
    </Box>
    <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
  </Stack>
);

const SummaryStrip = ({ collection }: { collection: CollectionResponse }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 18px 44px rgba(15, 23, 42, 0.06)" }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: { xs: 2, md: 0 } }}>
      <SummaryMetric icon={<WorkspacePremiumIcon />} label="バッジ" value={collection.badges.ownedCount} suffix="個" tone="#0f9a9a" />
      <SummaryMetric icon={<MenuBookIcon />} label="知識カード" value={collection.knowledgeTips.collectedCount} suffix="枚" tone="#7e22ce" />
      <SummaryMetric icon={<FlagIcon />} label="実績" value={collection.achievements.achievedCount} suffix="件" tone="#0052d9" />
      <SummaryMetric icon={<ConfirmationNumberIcon />} label="バッジチケット" value={collection.badges.ticketBalance} suffix="枚" tone="#f59e0b" />
    </Box>
  </Paper>
);

const SummaryMetric = ({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  suffix: string;
  tone: string;
}) => (
  <Stack
    direction="row"
    spacing={2}
    alignItems="center"
    sx={{
      px: { md: 3 },
      py: 1,
      borderRight: { md: "1px solid #e2e8f0" },
      "&:last-of-type": { borderRight: 0 },
    }}
  >
    <Box sx={{ width: 70, height: 70, borderRadius: "50%", display: "grid", placeItems: "center", color: tone, bgcolor: `${tone}18`, flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography fontWeight={900}>{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="baseline">
        <Typography variant="h3" fontWeight={900} sx={{ color: "#050505", lineHeight: 1.05 }}>
          {value}
        </Typography>
        <Typography fontWeight={900}>{suffix}</Typography>
      </Stack>
    </Box>
  </Stack>
);

const FeatureCard = ({
  tone,
  icon,
  title,
  description,
  stat,
  href,
}: {
  tone: "teal" | "purple" | "blue";
  icon: ReactNode;
  title: string;
  description: string;
  stat: string;
  href: string;
}) => {
  const styles = {
    teal: { color: "#0f9a9a", bg: "#e6fffb", border: "#0f9a9a" },
    purple: { color: "#7e22ce", bg: "#f3e8ff", border: "#7e22ce" },
    blue: { color: "#0052d9", bg: "#eaf2ff", border: "#0052d9" },
  }[tone];

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, minHeight: 266, display: "flex", flexDirection: "column", borderRadius: 3, border: "1px solid #dbe3ef", borderLeft: `5px solid ${styles.border}`, bgcolor: "#fff", boxShadow: "0 18px 44px rgba(15, 23, 42, 0.08)" }}>
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ width: 118, height: 118, borderRadius: "50%", display: "grid", placeItems: "center", color: styles.color, bgcolor: styles.bg, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: 26, md: 32 } }}>{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8, fontSize: 17 }}>{description}</Typography>
          <Chip label={stat} sx={{ mt: 2, px: 1.5, fontWeight: 900, color: styles.color, bgcolor: styles.bg }} />
        </Box>
      </Stack>
      <Button
        component={Link}
        href={href}
        fullWidth
        variant="contained"
        endIcon={<ArrowForwardIosIcon />}
        sx={{ mt: "auto", minHeight: 52, borderRadius: 2, fontWeight: 900, fontSize: 18 }}
      >
        一覧を見る
      </Button>
    </Paper>
  );
};

const RecentSection = ({ items }: { items: RecentItem[] }) => (
  <Box>
    <Typography variant="h4" fontWeight={900} sx={{ mb: 1.5 }}>
      最近獲得した{items.length}件
    </Typography>
    {items.length === 0 ? (
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
        <Typography color="text.secondary">まだ獲得した報酬はありません。</Typography>
      </Paper>
    ) : (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        {[items.slice(0, 4), items.slice(4, 8)].map((group, groupIndex) => (
          <Paper key={groupIndex} elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)" }}>
            <Stack>
              {group.map((item, index) => (
                <RecentRow key={item.id} item={item} rank={groupIndex * 4 + index + 1} />
              ))}
            </Stack>
          </Paper>
        ))}
      </Box>
    )}
  </Box>
);

const RecentRow = ({ item, rank }: { item: RecentItem; rank: number }) => {
  const typeLabel = {
    badge: "バッジ",
    knowledge: "知識カード",
    achievement: "実績",
  }[item.type];
  const typeColor = {
    badge: { color: "#0f9a9a", bg: "#e6fffb" },
    knowledge: { color: "#7e22ce", bg: "#f3e8ff" },
    achievement: { color: "#0052d9", bg: "#eaf2ff" },
  }[item.type];

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.25, borderBottom: "1px solid #e2e8f0", "&:last-child": { borderBottom: 0 } }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#f1f5f9", fontWeight: 900, flexShrink: 0 }}>
        {rank}
      </Box>
      <Box sx={{ width: 34, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {item.icon}
      </Box>
      <Typography fontWeight={800} sx={{ flex: 1, minWidth: 0 }} noWrap>{item.title}</Typography>
      <Chip label={typeLabel} size="small" sx={{ fontWeight: 900, color: typeColor.color, bgcolor: typeColor.bg, minWidth: 92 }} />
      <Typography color="text.secondary" sx={{ width: 150, textAlign: "right" }}>{formatDateTime(item.acquiredAt)}</Typography>
    </Stack>
  );
};
