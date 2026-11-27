"use client";
import { Alert, Box, Button, Chip, Container, Paper, Skeleton, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getHome, type HomeResponse } from "@/api/home.api";
import { AppHeader } from "@/app/component/appHeader";
import { FeedbackDestination } from "@/app/component/feedbackV1";
import { RobotBust } from "@/app/component/robotBust";
import { useUserSession } from "@/app/component/userSession";
import { HomeDashboard } from "@/features/home/HomeDashboard";
import { goalAchievement, goalStore, useGoalCourseId, type GoalAchievement } from "@/features/learning/app/goalStore";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { ResultConfetti } from "@/features/learning/app/ResultConfetti";
import { DailyReviewCardContent } from "@/features/learning/daily-review/DailyReviewCard";
import { resolveReviewMaterial } from "@/features/learning/daily-review/reviewMaterials";
import { useDailyReview } from "@/features/learning/daily-review/useDailyReview";
import { peekClientQueryData } from "@/lib/clientQueryCache";

const PRIMARY = "#2563eb";
const GREEN = "#16a34a";
const HAIRLINE = "#e3e9f4";

/**
 * 目標達成の帯（2026-11-28）。目標の単元が完了していたら、目標は自動で
 * 取り消され、代わりにこの帯で称賛と「達成したので取り消した」ことを知らせる。
 * 紙吹雪は同じ達成につき1セッションに1回だけ（帯自体は閉じるまで残る）。
 */
function GoalAchievementBand({ record, onDismiss }: { record: GoalAchievement; onDismiss: () => void }) {
  const [celebrate] = useState(() => {
    try {
      const key = `engineer-quest:goal-celebrated:${record.courseId}`;
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
      return true;
    } catch {
      return true;
    }
  });
  return (
    <Paper component="section" data-home-section="goal" aria-label="目標の達成" elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${HAIRLINE}`, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 28px rgba(15, 23, 42, 0.06)", px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
      {celebrate && <ResultConfetti preset="final" />}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiEventsIcon sx={{ color: "#d97706", fontSize: 20 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em" }}>目標</Typography>
            <Chip label={record.unitTitle} size="small" sx={{ fontSize: 14, fontWeight: 800, height: 26, bgcolor: "#fdf3e3", color: "#b45309" }} />
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.4, mt: 1 }}>目標を達成しました！</Typography>
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, mt: 0.25 }}>「{record.missionTitle}」を達成しました。目標は達成したので取り消しました。</Typography>
          <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
            <Button component={Link} href="/courses" variant="contained" sx={{ fontSize: 16, fontWeight: 900, px: 2.5, py: 1, borderRadius: "12px", bgcolor: PRIMARY, "&:hover": { bgcolor: "#1d4ed8" } }}>
              コース一覧で次の目標を設定する
            </Button>
            <Button variant="text" onClick={onDismiss} sx={{ fontSize: 16, fontWeight: 800, px: 2, py: 1, borderRadius: "12px", color: PRIMARY }}>
              閉じる
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
          <RobotBust state="happy" width={148} height={102} />
        </Box>
      </Box>
    </Paper>
  );
}

/**
 * 目標帯（2026-11-27 確定）：大目標（LLM生成）は廃止され、目標は学習者が自分で
 * 設定した単元ミッション（goalStore の旗）を表示する。目標は「場所・目標」なので
 * 未設定でも帯は消さず、設定への促す形で出す（2026-11-27 の空状態方針）。
 * 進み具合はその単元の段階の完了量（緑）で示す。
 * 目標の単元が完了していたら、達成を記録して目標を自動で取り消し、達成の帯を
 * 出す（2026-11-28）。達成していない目標には触らない。
 */
function GoalBand({ data }: { data: HomeResponse }) {
  const goalCourseId = useGoalCourseId();
  const unit = goalCourseId ? data.overview.units.find(item => item.id === goalCourseId) : undefined;
  const mission = goalCourseId ? findUnitMission(goalCourseId) : undefined;
  const [achieved, setAchieved] = useState<GoalAchievement | null>(() => goalAchievement.read());
  const goalStatus = unit?.status;
  const goalMissionTitle = mission?.title;
  useEffect(() => {
    if (!goalCourseId || !unit || !mission || goalStatus !== "COMPLETED") return;
    const record: GoalAchievement = { courseId: goalCourseId, missionTitle: goalMissionTitle ?? mission.title, unitTitle: unit.title };
    goalAchievement.record(record);
    setAchieved(record);
    goalStore.set(null);
    // unit / mission は参照が変わるため、判定に使うプリミティブ値だけを依存にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalCourseId, goalStatus, goalMissionTitle]);
  if (achieved && !unit) {
    return <GoalAchievementBand record={achieved} onDismiss={() => { goalAchievement.clear(); setAchieved(null); }} />;
  }
  if (!unit || !mission) {
    return (
      <Paper component="section" data-home-section="goal" aria-label="目標" elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${HAIRLINE}`, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 28px rgba(15, 23, 42, 0.06)", px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FlagIcon sx={{ color: PRIMARY, fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em" }}>目標</Typography>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.4, mt: 1 }}>目標はまだ設定されていません</Typography>
        <Typography sx={{ fontSize: 16, lineHeight: 1.7, mt: 0.25 }}>コース一覧や単元画面で旗を立てると、ここに単元ミッションと進み具合が表示されます</Typography>
        <Button component={Link} href="/courses" variant="outlined" sx={{ mt: 2, fontSize: 16, fontWeight: 900, px: 2.5, py: 1, borderRadius: "12px", color: PRIMARY, borderColor: PRIMARY }}>
          コース一覧で目標を設定する
        </Button>
      </Paper>
    );
  }
  const percent = unit.totalPhases > 0 ? Math.round((unit.completedPhases / unit.totalPhases) * 100) : 0;
  return (
    <Paper component="section" data-home-section="goal" aria-label="目標" elevation={0} sx={{ borderRadius: "18px", border: `1px solid ${HAIRLINE}`, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 28px rgba(15, 23, 42, 0.06)", px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <FlagIcon sx={{ color: PRIMARY, fontSize: 20 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em" }}>目標</Typography>
        <Chip label={unit.title} size="small" sx={{ fontSize: 14, fontWeight: 800, height: 26, bgcolor: "#eef4ff", color: PRIMARY }} />
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.4, mt: 1 }}>{mission.title}</Typography>
      <Typography sx={{ fontSize: 16, lineHeight: 1.7, mt: 0.25 }}>{mission.description}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>段階 {unit.completedPhases} / {unit.totalPhases}</Typography>
        <Box sx={{ flex: 1, height: 10, borderRadius: "999px", bgcolor: "#e5eaf3", overflow: "hidden" }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="目標の単元の進み具合">
          <Box sx={{ width: `${percent}%`, height: "100%", bgcolor: GREEN, borderRadius: "999px" }} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 900, color: GREEN }}>{percent}%</Typography>
      </Box>
    </Paper>
  );
}

export default function HomePage() {
  const { status, token } = useUserSession();
  // 復習は「進捗データ」：割り当てが無い日は枠ごと出さず、狙いを広げる。
  // 有無をここで判定し、ある時だけ中身をスロットに渡す（カード側の null 判定と同条件）。
  const { review } = useDailyReview();
  const reviewReady = review && resolveReviewMaterial(review) ? review : null;
  const [cachedHome] = useState(() => peekClientQueryData<HomeResponse>("home"));
  const [homeData, setHomeData] = useState<HomeResponse | null>(cachedHome ?? null);
  const [isLoading, setIsLoading] = useState(!cachedHome);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) { setHomeData(null); setIsLoading(false); setErrorMessage("ログインが必要です。"); return; }
    let active = true;
    void getHome(token).then(data => { if (active) { setHomeData(data); setErrorMessage(null); } }, () => { if (active) setErrorMessage("ホーム情報を取得できませんでした。"); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [status, token]);
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6fb" }}>
    <AppHeader /><FeedbackDestination failed={!!errorMessage} ready={!isLoading && !!homeData && !errorMessage} />
    <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
      {errorMessage && <Alert severity={homeData ? "warning" : "error"} sx={{ mb: 3 }}>{errorMessage}</Alert>}
      {homeData ? <HomeDashboard data={homeData} review={reviewReady ? <DailyReviewCardContent review={reviewReady} /> : undefined} goalBand={<GoalBand data={homeData} />} /> : isLoading ? <Stack spacing={3}><Skeleton variant="rounded" height={260} /><Skeleton variant="rounded" height={180} /></Stack> : null}
    </Container>
  </Box>;
}
