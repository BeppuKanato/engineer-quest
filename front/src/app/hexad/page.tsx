"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { submitHexadResponse } from "@/api/hexad.api";
import { ActionButton } from "@/app/component/actionButton";
import { useUserSession } from "@/app/component/userSession";
import {
  HEXAD_QUESTIONS,
  LIKERT_OPTIONS,
  type HexadQuestionId,
} from "@/features/hexad/questions";
import { ApiError } from "@/lib/fetcher";
import { auth } from "@/lib/firebase";

type Answers = Partial<Record<HexadQuestionId, number>>;

const shuffleQuestions = () => {
  const questions = [...HEXAD_QUESTIONS];
  for (let index = questions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
  }
  return questions;
};

export default function HexadQuestionnairePage() {
  const router = useRouter();
  const { appUser, updateAppUser } = useUserSession();
  const [questions, setQuestions] = useState<Array<(typeof HEXAD_QUESTIONS)[number]>>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setQuestions(shuffleQuestions());

    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      try {
        const nextToken = await user.getIdToken();
        if (!active) return;

        if (appUser?.hasHexadResponse) {
          router.replace("/home");
          return;
        }

        setToken(nextToken);
      } catch (error) {
        console.error(error);
        if (active) setErrorMessage("回答状況を確認できませんでした。時間をおいて再度お試しください。");
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [appUser?.hasHexadResponse, router]);

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === HEXAD_QUESTIONS.length;
  const progress = useMemo(
    () => (answeredCount / HEXAD_QUESTIONS.length) * 100,
    [answeredCount]
  );

  const handleSubmit = async () => {
    if (!token || !isComplete || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await submitHexadResponse(token, answers as Record<string, number>);
      updateAppUser({ hasHexadResponse: true });
      router.replace("/home");
    } catch (error) {
      if (error instanceof ApiError && error.code === "HEXAD_ALREADY_COMPLETED") {
        router.replace("/home");
        return;
      }
      console.error(error);
      setErrorMessage("回答を保存できませんでした。入力内容を確認して再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || questions.length === 0) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f5f8fc" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography fontWeight={800}>アンケートを準備しています</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc", py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, color: "#fff", background: "linear-gradient(135deg, #0047c7 0%, #2563eb 65%, #0891b2 100%)" }}>
            <Typography variant="h3" fontWeight={900} sx={{ fontSize: { xs: 34, md: 48 } }}>
              動機づけアンケート
            </Typography>
            <Typography sx={{ mt: 1.5, lineHeight: 1.8, opacity: 0.92 }}>
              あなたに合った学習体験づくりのための24問です。すべての設問に回答してください。
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef" }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              各設問について、次の7段階から1つを選択してください。
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 3, columns: { xs: 1, sm: 2 }, lineHeight: 1.9 }}>
              {LIKERT_OPTIONS.map((option) => (
                <li key={option.value}>{option.value}: {option.label}</li>
              ))}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ position: "sticky", top: 12, zIndex: 2, p: 2, borderRadius: 3, border: "1px solid #dbe3ef", boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)" }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography fontWeight={900}>回答状況</Typography>
              <Typography fontWeight={900}>{answeredCount} / 24</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 9, borderRadius: 999 }} />
          </Paper>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Stack spacing={2}>
            {questions.map((question, index) => (
              <Paper key={question.id} component="fieldset" elevation={0} sx={{ m: 0, p: { xs: 2.5, md: 3 }, borderRadius: 3, border: answers[question.id] ? "2px solid #93c5fd" : "1px solid #dbe3ef", bgcolor: "#fff" }}>
                <Typography component="legend" fontWeight={900} sx={{ px: 0, mb: 2, lineHeight: 1.7 }}>
                  {index + 1}. {question.text} <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </Typography>
                <Box sx={{ overflowX: "auto", pb: 0.5 }}>
                  <RadioGroup
                    row
                    aria-label={question.text}
                    value={answers[question.id] ?? ""}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setAnswers((current) => ({ ...current, [question.id]: value }));
                    }}
                    sx={{ minWidth: 560, display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
                  >
                    {LIKERT_OPTIONS.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={String(option.value)}
                        labelPlacement="bottom"
                        title={option.label}
                        sx={{ m: 0, alignItems: "center", justifyContent: "center" }}
                      />
                    ))}
                  </RadioGroup>
                </Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, color: "text.secondary" }}>
                  <Typography variant="caption">1 全くそう思わない</Typography>
                  <Typography variant="caption">7 非常にそう思う</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: "1px solid #dbe3ef" }}>
            {!isComplete && (
              <Alert severity="info" sx={{ mb: 2 }}>
                未回答の設問が{24 - answeredCount}問あります。全24問に回答すると提出できます。
              </Alert>
            )}
            <ActionButton
              fullWidth
              variant="contained"
              size="large"
              loading={isSubmitting}
              loadingLabel="回答を保存しています..."
              disabled={!isComplete || !token}
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={handleSubmit}
              sx={{ minHeight: 56, borderRadius: 2, fontSize: 17, fontWeight: 900 }}
            >
              回答を提出する
            </ActionButton>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "center" }}>
              提出後は回答を変更・再回答できません。
            </Typography>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
