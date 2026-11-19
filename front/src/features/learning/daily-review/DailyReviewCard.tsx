"use client";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { DailyReview } from "@/api/dailyReview.api";
import { resolveReviewMaterial, reviewUnitName } from "./reviewMaterials";
import { useDailyReview } from "./useDailyReview";
export function DailyReviewCardContent({ review }: { review: DailyReview }) {
  return <Card data-daily-review-card sx={{ mb: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
    <CardContent><Stack spacing={1} alignItems="flex-start">
      <Typography variant="h5" component="h2" fontWeight={900}>今日の復習</Typography>
      <Typography>{reviewUnitName(review.courseId)}</Typography>
      {review.answeredAt
        ? <Typography role="status">今日の復習は回答済みです。{review.correct ? "正解でした。" : "不正解でした。"}また明日取り組みましょう。</Typography>
        : <><Typography>学んだ内容を1問だけ思い出してみましょう。</Typography><Button component={Link} href="/daily-review" variant="contained">復習する</Button></>}
    </Stack></CardContent>
  </Card>;
}
export function DailyReviewCard() {
  const { review, loading, error } = useDailyReview();
  if (loading || error || !review || !resolveReviewMaterial(review)) return null;
  return <DailyReviewCardContent review={review} />;
}
