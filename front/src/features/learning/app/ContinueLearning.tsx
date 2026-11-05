"use client";
import { Alert, Box, Button, Card, CardContent, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserSession } from "@/app/component/userSession";
import { getLearningProgress } from "@/api/learning.api";
import { ApiError } from "@/lib/fetcher";
import { learningUnits, unitUrl, type LearningUnit } from "./unitRegistry";
import { appLearningTokens as tokens } from "./appLearning.tokens";

export function ContinueLearning() {
  const { firebaseUser, status } = useUserSession();
  const [state, setState] = useState<{ uid: string; unit: LearningUnit | null; failed: boolean } | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!firebaseUser) return;
    let current = true;
    setState(null);
    void firebaseUser.getIdToken().then(async token => {
      const results = await Promise.allSettled(learningUnits.map(unit => getLearningProgress(token, unit.courseId)));
      const inProgress = results.flatMap((result, index) => result.status === "fulfilled" && result.value.unit?.status === "IN_PROGRESS" ? [{ unit: learningUnits[index], startedAt: result.value.unit.startedAt }] : []);
      inProgress.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
      const failed = results.some(result => result.status === "rejected" && !(result.reason instanceof ApiError && result.reason.status === 404));
      if (current) setState({ uid: firebaseUser.uid, unit: inProgress[0]?.unit ?? null, failed });
    }, () => { if (current) setState({ uid: firebaseUser.uid, unit: null, failed: true }); });
    return () => { current = false; };
  }, [firebaseUser, revision]);
  const result = state?.uid === firebaseUser?.uid ? state : null;
  const loading = status === "loading" || (!!firebaseUser && !result);
  return <Card component={motion.section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-label="続きから始める" sx={{ mb: 3, borderRadius: 3, bgcolor: tokens.surface, color: tokens.text, border: `1px solid ${tokens.border}` }}>
    <CardContent>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>続きから始める</Typography>
      {loading ? <Typography role="status" sx={{ mt: 1 }}>学習中の単元を確認しています。</Typography> : result?.failed && !result.unit ?
        <Alert severity="warning" action={<Button onClick={() => setRevision(value => value + 1)}>再試行</Button>}>進捗を確認できませんでした。<Button component={Link} href="/courses">コース一覧へ</Button></Alert> :
        <Box sx={{ mt: 1 }}><Typography sx={{ mb: 2 }}>{result?.unit?.title ?? "コース一覧から学びたい単元を選びましょう。"}</Typography>
          <Button component={Link} href={result?.unit ? unitUrl(result.unit.courseId) : "/courses"} variant="contained">{result?.unit ? "単元の続きへ" : "コース一覧へ"}</Button></Box>}
    </CardContent>
  </Card>;
}
