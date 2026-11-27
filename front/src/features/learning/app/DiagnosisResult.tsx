"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

import type { diagnoseAssessment } from "../assessment/assessment";
import { AssessmentReviewButton } from "../review/AssessmentReviewButton";
import { DiagnosisScore } from "./DiagnosisScore";
import { ResultConfetti } from "./ResultConfetti";
import { ResultTagRow } from "./ResultTagRow";

export type AssessmentDiagnosis = ReturnType<typeof diagnoseAssessment>;

/**
 * フェーズ6（応用問題）の診断画面の本体。紙吹雪・スコア・論点ごとの結果・完了文の並びは
 * 全単元で同じ形にするため、ここだけが持つ。単元側は診断結果と復習の受け渡しだけを持つ。
 * 完了文（completion）は単元の content が持つ場合だけ出す。children は論点一覧の後ろに置く
 * （DFS の実績表示など、単元固有の差し込み用）。
 */
export function DiagnosisResult({ diagnosis, reviewLabel, completion, onReviewTag, children }: {
  diagnosis: AssessmentDiagnosis;
  reviewLabel: string;
  completion?: string;
  onReviewTag: (tag: string) => void;
  children?: ReactNode;
}) {
  return <>
    <ResultConfetti />
    <DiagnosisScore correct={diagnosis.correct} total={diagnosis.total} />
    <Box component="ul" aria-label="論点ごとの結果" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1, width: "100%", maxWidth: 720, mx: "auto", mt: 2 }}>
      {diagnosis.tags.map((result, index) => <ResultTagRow key={result.tag} dataTag={result.tag} label={result.tag} index={index}
        passed={result.passed} correct={result.correct} total={result.total}
        reviewAction={!result.passed ? <AssessmentReviewButton ariaLabel={`${result.tag}を復習する`}
          onClick={() => onReviewTag(result.tag)} label={reviewLabel} /> : undefined} />)}
    </Box>
    {completion && <Typography component="p" sx={{ textAlign: "center", fontWeight: 700 }}>{completion}</Typography>}
    {children}
  </>;
}
