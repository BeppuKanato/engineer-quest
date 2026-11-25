"use client";

import { AppBreadcrumbs } from "@/app/component/appBreadcrumbs";
import { AppHeader } from "@/app/component/appHeader";
import { developmentMissionThumbnailFor } from "@/features/learning/app/DevelopmentMissionThumbnail";
import { RankMedal } from "@/features/learning/app/RankMedal";
import { developmentMissions, nextRank, rankForPoints, rankThresholds } from "@/features/learning/app/developmentMissions";
import { useEffect, useState } from "react";
import { useUserSession } from "@/app/component/userSession";
import { getCourses } from "@/api/courses.api";
import { withLearningProgress } from "@/app/courses/courseProgress";
import { getDevelopmentMissionBests } from "@/api/developmentMissions.api";
import LockIcon from "@mui/icons-material/Lock";
import { Box, Button, Chip, Container, LinearProgress, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

// 発展ミッション一覧の下書き（2026-11-25、Issue #507）。
// 課題の場面イラストを主役にし、解法は指定しない。解放条件と自己ベスト（メダル付き）を載せる。
export default function MissionsPage() {
  const router = useRouter();
  const { status, token } = useUserSession();
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(new Set());
  const [bests, setBests] = useState<Map<string, { points: number; rank: string }>>(new Map());

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let cancelled = false;
    void (async () => {
      const [courses, bestsResponse] = await Promise.all([
        getCourses(token).then((data) => withLearningProgress(token, data)).catch(() => []),
        getDevelopmentMissionBests(token).catch(() => ({ bests: [] })),
      ]);
      if (cancelled) return;
      setCompletedCourseIds(new Set(courses.filter((course) => course.status === "completed").map((course) => course.id)));
      setBests(new Map(bestsResponse.bests.map((best) => [best.missionId, { points: best.points, rank: rankForPoints(best.points) }])));
    })();
    return () => { cancelled = true; };
  }, [status, token]);

  const missions = developmentMissions.map((mission) => ({
    ...mission,
    unlocked: completedCourseIds.has(mission.unlockCourseId),
    selfBest: bests.get(mission.id) ?? null,
  }));
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: { xs: 3, md: 4 } }}>
        <AppBreadcrumbs items={[{ label: "発展ミッション" }]} />
      </Container>
      <Container maxWidth="lg" sx={{ pt: 3, pb: 6 }}>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 900 }}>発展ミッション</Typography>
        <Typography component="p" sx={{ fontSize: 16, mt: 0.75, mb: 3 }}>
          学んだアルゴリズムを、別の課題で使う挑戦です。解き方は決まっていません。正しい解き方ならクリアでき、良い解き方ほどスコアが上がります。
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
          {missions.map((mission) => (
            <Paper key={mission.id} elevation={0} sx={{ border: "1px solid #dbe3ef", borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <Box sx={{ height: 168, flexShrink: 0 }}>{developmentMissionThumbnailFor(mission.id)}</Box>
              <Box sx={{ p: 3, pt: 2.25, display: "flex", flexDirection: "column", flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  {!mission.unlocked
                    ? <Chip size="small" icon={<LockIcon sx={{ fontSize: 14 }} />} label={`${mission.unlockUnitName}を終えると解放`} sx={{ bgcolor: "#eef2f7", fontWeight: 700 }} />
                    : mission.selfBest
                      ? <Chip size="small" label="クリア済み" sx={{ bgcolor: "#16a34a", color: "#fff", fontWeight: 700 }} />
                      : <Chip size="small" label="挑戦できる" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 700 }} />}
                  {mission.unlocked && <Chip size="small" variant="outlined" label={`解放条件：${mission.unlockUnitName}の単元完了`} />}
                </Box>
                <Typography component="p" sx={{ fontSize: 18, fontWeight: 900 }}>{mission.title}</Typography>
                <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.8, mt: 0.75 }}>{mission.problem}</Typography>
                <Box sx={{ mt: 1.75 }}>
                  {mission.selfBest ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <RankMedal rank={mission.selfBest.rank} size={28} />
                        <Typography component="p" sx={{ fontSize: 16 }}>自己ベスト：{mission.selfBest.points}点</Typography>
                        {nextRank(mission.selfBest.points) && (
                          <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>次の{nextRank(mission.selfBest.points)!.rank}ランクまであと {nextRank(mission.selfBest.points)!.min - mission.selfBest.points}点</Typography>
                        )}
                      </Box>
                      {nextRank(mission.selfBest.points) && (
                        <>
                          <LinearProgress
                            variant="determinate"
                            value={Math.round(((mission.selfBest.points - (rankThresholds.find((t) => t.rank === mission.selfBest!.rank)?.min ?? 300)) / (nextRank(mission.selfBest.points)!.min - (rankThresholds.find((t) => t.rank === mission.selfBest!.rank)?.min ?? 300))) * 100)}
                            sx={{ mt: 1, height: 8, borderRadius: 999, bgcolor: "#e2e8f0", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 999 } }}
                          />
                          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                            <Typography component="p" sx={{ fontSize: 14 }}>{mission.selfBest.rank}ランク {rankThresholds.find((t) => t.rank === mission.selfBest!.rank)?.min}点</Typography>
                            <Typography component="p" sx={{ fontSize: 14 }}>{nextRank(mission.selfBest.points)!.rank}ランク {nextRank(mission.selfBest.points)!.min}点</Typography>
                          </Box>
                        </>
                      )}
                    </>
                  ) : (
                    <Typography component="p" sx={{ fontSize: 16 }}>自己ベスト：まだ記録なし</Typography>
                  )}
                </Box>
                <Box sx={{ flex: 1 }} />
                {mission.unlocked ? (
                  <Button
                    variant="contained"
                    onClick={() => router.push(`/missions/${mission.id}`)}
                    sx={{ mt: 2.5, minHeight: 48, alignSelf: "flex-start", px: 3, fontWeight: 800, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                  >
                    {mission.selfBest ? (mission.selfBest.rank === "S" ? "もう一度挑戦する →" : "記録に挑戦する →") : "挑戦する →"}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => router.push("/courses")}
                    sx={{ mt: 2.5, minHeight: 48, alignSelf: "flex-start", px: 3, fontWeight: 800 }}
                  >
                    {mission.unlockUnitName}を学習する →
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
