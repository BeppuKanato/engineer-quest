"use client";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRef, useState } from "react";
import { answerDailyReview, getDailyReview, type DailyReview } from "@/api/dailyReview.api";
import { AppHeader } from "@/app/component/appHeader";
import { ApiError } from "@/lib/fetcher";
import { answerQuestion, createAssessmentState, type AssessmentAnswer } from "../assessment/assessment";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../assessment/AnswerFeedback";
import { resolveReviewMaterial, reviewUnitName, singleReviewContent, type ReviewMaterial } from "./reviewMaterials";
import { useDailyReview } from "./useDailyReview";

export function DailyReviewQuestion({ review, material, token, onSaved, reload }: {
  review: DailyReview; material: ReviewMaterial; token: string;
  onSaved: (review: DailyReview | null) => void; reload: () => void;
}) {
  const [content] = useState(() => singleReviewContent(material, review.id));
  const [session, setSession] = useState(() => createAssessmentState(content));
  const [saved, setSaved] = useState<DailyReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const locked = useRef(false);
  const pending = useRef<boolean | null>(null);
  const attempt = session.records[0]?.attempts[0];
  useAssessmentFeedback(content, session);
  async function save(correct: boolean) {
    setSaving(true); setSaveError(false);
    const accept = (value: DailyReview | null) => { if (value?.id === review.id) setSaved(value); else onSaved(value); };
    try { accept((await answerDailyReview(token, review.id, correct)).review); }
    catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        try { accept((await getDailyReview(token)).review); return; } catch { /* 同じ初回結果だけ再送できる状態を残す */ }
      }
      setSaveError(true);
    } finally { setSaving(false); }
  }
  const submit = (answer: AssessmentAnswer) => {
    if (locked.current) return;
    const next = answerQuestion(content, session, material.questionId, answer);
    const result = next.records[0]?.attempts[0];
    if (!result) return;
    locked.current = true; pending.current = result.correct; setSession(next); void save(result.correct);
  };
  const question = material.question;
  return <Stack spacing={2}>
    <Typography variant="h5" component="h2" sx={{ fontSize: "clamp(20px, 2vw, 30px)", textAlign: "center" }}>{question.prompt}</Typography>
    <AnswerFeedbackNotice assessmentId={content.id} />
    <Box sx={{ width: "100%", minWidth: 0, height: "kind" in question && question.kind === "parsons" ? "auto" : "clamp(320px, 54dvh, 740px)", display: "flex", justifyContent: "center", overflow: "auto", pointerEvents: attempt ? "none" : undefined }}>
      {material.render({ onAnswer: submit, disabled: !!attempt })}
    </Box>
    {"choices" in question && <Stack direction="row" flexWrap="wrap" justifyContent="center" useFlexGap gap={1} role="group" aria-label="解答の選択肢">
      {question.choices.map(choice => <Button key={choice.id} variant="outlined" disabled={!!attempt} sx={{ minHeight: 48, textTransform: "none", fontSize: 18 }} onClick={() => submit({ kind: "choice", choiceId: choice.id })}>{choice.text}</Button>)}
    </Stack>}
    {attempt && <Alert severity={(saved?.correct ?? attempt.correct) ? "success" : "info"} role="status">{(saved?.correct ?? attempt.correct) ? "正解です。" : "不正解です。"}今日の復習はこの1問で終わりです。{saving ? "回答を保存しています。" : saved ? "回答を保存しました。" : ""}</Alert>}
    {saveError && <Alert severity="error" action={<Button disabled={saving} onClick={() => { if (pending.current !== null) void save(pending.current); }}>保存を再試行</Button>}>回答を保存できませんでした。入力した結果を再送できます。</Alert>}
    <Stack direction="row" gap={2}><Button component={Link} href="/home">ホームへ戻る</Button>{saveError && <Button onClick={reload}>今日の状態を確認する</Button>}</Stack>
  </Stack>;
}
export function DailyReviewPage() {
  const { review, loading, error, reload, setReview, token, status } = useDailyReview();
  const material = review ? resolveReviewMaterial(review) : null;
  return <Box sx={{ minHeight: "100dvh", bgcolor: "#f3f6fb" }}><AppHeader />
    <Container maxWidth={false} sx={{ width: { xs: "100%", md: "88%" }, py: 2 }}>
      <Typography variant="h4" component="h1" fontWeight={900}>今日の復習</Typography>
      {review && <Typography sx={{ my: 1 }}>{reviewUnitName(review.courseId)}・1問</Typography>}
      {loading ? <Typography role="status">今日の復習を確認しています。</Typography>
        : status !== "authenticated" ? <Alert severity="info">ログインして復習に取り組みましょう。<Button component={Link} href="/auth/login">ログインする</Button></Alert>
        : error ? <Alert severity="error" action={<Button onClick={reload}>再試行</Button>}>今日の復習を取得できませんでした。</Alert>
        : !review || !material ? <Alert severity="info">今日は復習できる問題がありません。<Button component={Link} href="/home">ホームへ戻る</Button></Alert>
        : review.answeredAt ? <Stack spacing={2} sx={{ mt: 3 }}><Alert severity={review.correct ? "success" : "info"}>{review.correct ? "正解でした。" : "不正解でした。"}今日の復習は回答済みです。また明日取り組みましょう。</Alert><Button component={Link} href="/home">ホームへ戻る</Button></Stack>
        : token && <DailyReviewQuestion key={review.id} review={review} material={material} token={token} onSaved={setReview} reload={reload} />}
    </Container>
  </Box>;
}
