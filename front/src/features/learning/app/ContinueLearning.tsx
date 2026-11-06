"use client";
import { Alert, Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserSession } from "@/app/component/userSession";
import { getLearningProgress, type LearningProgress } from "@/api/learning.api";
import { ApiError } from "@/lib/fetcher";
import { learningUnits, resumePhaseIndex, unitUrl, type LearningUnit } from "./unitRegistry";
import { appLearningTokens as tokens } from "./appLearning.tokens";

type Resume = { unit: LearningUnit; progress: LearningProgress };

export function ContinueLearning() {
  const { firebaseUser, status } = useUserSession();
  const [state, setState] = useState<{ uid: string; resume: Resume | null; failed: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!firebaseUser) return;
    let current = true;
    setState(null);
    void firebaseUser.getIdToken().then(async token => {
      const results = await Promise.allSettled(learningUnits.map(unit => getLearningProgress(token, unit.courseId)));
      const inProgress = results.flatMap((result, index) => result.status === "fulfilled" && result.value.unit?.status === "IN_PROGRESS" ? [{ unit: learningUnits[index], progress: result.value, startedAt: result.value.unit.startedAt }] : []);
      inProgress.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
      const failed = results.some(result => result.status === "rejected" && !(result.reason instanceof ApiError && result.reason.status === 404));
      const top = inProgress[0];
      if (current) setState({ uid: firebaseUser.uid, resume: top ? { unit: top.unit, progress: top.progress } : null, failed });
    }, () => { if (current) setState({ uid: firebaseUser.uid, resume: null, failed: true }); });
    return () => { current = false; };
  }, [firebaseUser, revision]);
  const result = state?.uid === firebaseUser?.uid ? state : null;
  const loading = status === "loading" || (!!firebaseUser && !result);

  // 進行中の単元がないときは、コース一覧への案内に化けるくらいならカード自体を出さない。
  // 探す役割はホームの単元グリッドとコース一覧が担う（Issue #137 / ホーム画面レイアウト原案）。
  if (!loading && result && !result.resume && !result.failed) return null;

  const resume = result?.resume ?? null;
  const completedCount = resume
    ? resume.unit.phases.filter(phase => resume.progress.phases.some(saved => saved.phaseKey === phase.id && saved.status === "COMPLETED")).length
    : 0;
  const nextIndex = resume ? resumePhaseIndex(resume.unit, resume.progress) : null;

  return <Card component={motion.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-label="続きから始める" sx={{ mb: 3, borderRadius: 3, bgcolor: tokens.surface, color: tokens.text, border: `1px solid ${tokens.border}` }}>
    <CardContent>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>続きから始める</Typography>
      {loading ? <Typography role="status" sx={{ mt: 1 }}>学習中の単元を確認しています。</Typography> : result?.failed && !resume ?
        <Alert severity="warning" action={<Button onClick={() => setRevision(value => value + 1)}>再試行</Button>}>進捗を確認できませんでした。<Button component={Link} href="/courses">コース一覧へ</Button></Alert> :
        resume && <Box sx={{ mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>{resume.unit.title}</Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Typography color="text.secondary" fontWeight={700}>{completedCount} / {resume.unit.phases.length} 完了</Typography>
            <LinearProgress
              variant="determinate"
              value={(completedCount / resume.unit.phases.length) * 100}
              aria-label="単元の進捗"
              sx={{ flex: 1, minWidth: 140, height: 8, borderRadius: 999, bgcolor: tokens.progress.idle, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: tokens.progress.next } }}
            />
            {nextIndex !== null && <Typography fontWeight={700}>次は「{resume.unit.phases[nextIndex].formalName}」</Typography>}
          </Stack>
          <Button component={Link} href={unitUrl(resume.unit.courseId)} variant="contained">単元の続きへ</Button>
        </Box>}
    </CardContent>
  </Card>;
}
