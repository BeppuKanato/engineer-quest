"use client";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getConceptProgress, type ConceptProgressResponse } from "@/api/conceptProgress.api";
import { useUserSession } from "@/app/component/userSession";
const presentation = {
  reached: { label: "到達", color: "#166534", background: "#dcfce7" },
  in_progress: { label: "取り組み中", color: "#1e40af", background: "#dbeafe" },
  unconfirmed: { label: "未確認", color: "#475569", background: "#f1f5f9" },
};
export function ConceptProgressList({ data }: { data: ConceptProgressResponse }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
    {data.concepts.map(concept => {
      const style = presentation[concept.state];
      return <Box key={concept.conceptId} data-concept-state={concept.state} sx={{ p: 2, minWidth: 0, border: "1px solid #cbd5e1", borderTop: `4px solid ${style.color}`, borderRadius: 2, bgcolor: "#fff" }}>
        <Stack direction="row" gap={1} alignItems="flex-start" justifyContent="space-between">
          <Typography component="h3" fontWeight={800} sx={{ fontSize: 16, overflowWrap: "anywhere" }}>{concept.label}</Typography>
          <Chip label={style.label} size="small" sx={{ flexShrink: 0, color: style.color, bgcolor: style.background, fontWeight: 800 }} />
        </Stack>
        <Typography sx={{ mt: 1.5, fontWeight: 800 }}>到達 {concept.reachedQuestions}/{concept.totalQuestions}問</Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
          初回正解率 {concept.firstAttemptRate === null ? "—（初回の記録なし）" : `${concept.firstAttemptRate}%（${concept.firstAttemptCorrect}/${concept.firstAttemptQuestions}問）`}
        </Typography>
      </Box>;
    })}
  </Box>;
}
export function ConceptProgressMap({ courseId }: { courseId: string }) {
  const { firebaseUser } = useUserSession();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ owner: string; courseId: string; data?: ConceptProgressResponse; failed?: boolean } | null>(null);
  useEffect(() => {
    if (!firebaseUser) return;
    let current = true;
    setState(null);
    void firebaseUser.getIdToken().then(token => getConceptProgress(token, courseId)).then(
      data => { if (current) setState({ owner: firebaseUser.uid, courseId, data }); },
      () => { if (current) setState({ owner: firebaseUser.uid, courseId, failed: true }); },
    );
    return () => { current = false; };
  }, [firebaseUser, courseId, revision]);
  const current = state?.owner === firebaseUser?.uid && state?.courseId === courseId ? state : null;
  return <Box component="section" aria-labelledby="concept-progress-heading" sx={{ mt: 4 }}>
    <Typography id="concept-progress-heading" component="h2" variant="h6" fontWeight={950}>概念の到達マップ</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>学習中に一度でも正解した問題を数えています。初回正解率は到達の判定には使いません。</Typography>
    {current?.data ? <ConceptProgressList data={current.data} /> : current?.failed
      ? <Alert severity="warning" action={<Button onClick={() => setRevision(value => value + 1)}>再読み込み</Button>}>概念の到達状況を取得できませんでした。学習はそのまま続けられます。</Alert>
      : <Skeleton variant="rounded" height={140} aria-label="概念の到達状況を読み込み中" />}
  </Box>;
}
