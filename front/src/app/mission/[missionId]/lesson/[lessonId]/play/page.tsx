"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Fade,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";

import { AppHeader } from "../../../../../component/appHeader";
import { LessonHeaderCard } from "./component/headerCard";
import { LessonActivityCard } from "./component/activityCard";
import { LessonActionButtons } from "./component/actionButtons";
import type { ActivityAnswerState, Lesson, LessonActivity } from "./type";

import { auth } from "@/lib/firebase";
import { completeLesson, getLessonPlay } from "@/api/mission.api";
import { LessonPlaySkeleton } from "./component/skeleton";

export default function LessonPage() {
  const params = useParams<{
    missionId: string;
    lessonId: string;
  }>();

  const router = useRouter();

  const missionId = params.missionId;
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [userAnswer, setUserAnswer] = useState<unknown>(null);
  const [activityAnswerMap, setActivityAnswerMap] = useState<
    Record<string, ActivityAnswerState>
  >({});

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const token = await auth.currentUser?.getIdToken();

        if (!token) {
          setErrorMessage("ログイン情報を取得できませんでした。");
          return;
        }

        const data = await getLessonPlay(token, lessonId);

        setLesson(data);
        setCurrentActivityIndex(0);
        resetAnswerState();
        setActivityAnswerMap({});
      } catch (error) {
        console.error(error);
        setErrorMessage("レッスン情報の取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const resetAnswerState = () => {
    setSelectedChoiceId(null);
    setChecked(false);
    setIsCorrect(null);
    setFeedback("");
    setUserAnswer(null);
  };

  const createFeedback = (
    activity: LessonActivity,
    savedState: ActivityAnswerState
  ) => {
    if (activity.type === "CHOICE") {
      const selectedChoice = activity.choices?.find(
        (choice) => choice.id === savedState.selectedChoiceId
      );

      return selectedChoice?.feedback ?? "";
    }

    if (activity.type === "SELECT_FILL") {
      return activity.correctFeedback ?? "正解です！";
    }

    return "";
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F7F8FC",
          background:
            "linear-gradient(180deg, #F7F8FC 0%, #F3F7FF 45%, #F7F8FC 100%)",
        }}
      >
        <AppHeader />
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 } }}>
          {/* <Typography fontWeight={900}>レッスンを読み込んでいます...</Typography>
           */}
          <LessonPlaySkeleton />
        </Container>
      </Box>
    );
  }

  if (errorMessage || !lesson) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#F7F8FC",
        }}
      >
        <AppHeader />
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 } }}>
          <Alert severity="error">
            {errorMessage ?? "レッスン情報を取得できませんでした。"}
          </Alert>
        </Container>
      </Box>
    );
  }

  const currentActivity = lesson.activities[currentActivityIndex];
  const isLastActivity = currentActivityIndex === lesson.activities.length - 1;

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setChecked(false);
    setIsCorrect(null);
    setFeedback("");
  };

  const moveToActivity = (nextIndex: number) => {
    const nextActivity = lesson.activities[nextIndex];
    const savedState = activityAnswerMap[nextActivity.id];

    setCurrentActivityIndex(nextIndex);

    if (savedState) {
      setUserAnswer(savedState.userAnswer);
      setSelectedChoiceId(savedState.selectedChoiceId);
      setChecked(true);
      setIsCorrect(true);
      setFeedback(createFeedback(nextActivity, savedState));
      return;
    }

    resetAnswerState();
  };

  const handleCompleteLesson = async () => {
    try {
      setIsCompleting(true);

      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        setErrorMessage("ログイン情報を取得できませんでした。");
        return;
      }

      await completeLesson(token, lesson.id);

      router.push("/lesson-complete");
    } catch (error) {
      console.error(error);
      setErrorMessage("レッスン完了の保存に失敗しました。");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNext = () => {
    if (currentActivityIndex >= lesson.activities.length - 1) {
      void handleCompleteLesson();
      return;
    }

    moveToActivity(currentActivityIndex + 1);
  };

  const handleBack = () => {
    if (currentActivityIndex === 0) return;

    moveToActivity(currentActivityIndex - 1);
  };

  const handleConfirm = () => {
    if (
      currentActivity.type === "TUTORIAL" ||
      currentActivity.type === "VIEW" ||
      currentActivity.type === "TRY_CODE"
    ) {
      handleNext();
      return;
    }

    if (currentActivity.type === "CHOICE") {
      if (!selectedChoiceId) return;

      const selectedChoice = currentActivity.choices?.find(
        (choice) => choice.id === selectedChoiceId
      );

      if (!selectedChoice) return;

      setChecked(true);
      setIsCorrect(selectedChoice.isCorrect);
      setFeedback(selectedChoice.feedback);

      if (selectedChoice.isCorrect) {
        setActivityAnswerMap((prev) => ({
          ...prev,
          [currentActivity.id]: {
            selectedChoiceId,
            userAnswer,
            isCorrect: true,
          },
        }));
      }

      return;
    }

    if (currentActivity.type === "SELECT_FILL") {
      const answers = (userAnswer ?? {}) as Record<string, string>;

      const result =
        currentActivity.blanks?.every((blank) => {
          return answers[blank.id] === blank.answerChoiceId;
        }) ?? false;

      setChecked(true);
      setIsCorrect(result);
      setFeedback(
        result
          ? currentActivity.correctFeedback ?? "正解です！"
          : currentActivity.incorrectFeedback ?? "もう一度確認しましょう。"
      );

      if (result) {
        setActivityAnswerMap((prev) => ({
          ...prev,
          [currentActivity.id]: {
            selectedChoiceId: null,
            userAnswer,
            isCorrect: true,
          },
        }));
      }
    }
  };

  const handleActionClick = () => {
    if (canCompleteCurrentActivity) {
      handleNext();
      return;
    }

    handleConfirm();
  };

  const handleAnswerChange = (answer: unknown) => {
    setUserAnswer(answer);
    setChecked(false);
    setIsCorrect(null);
    setFeedback("");
  };

  const isSelectFillAnswered = () => {
    if (currentActivity.type !== "SELECT_FILL") return false;

    const answers = (userAnswer ?? {}) as Record<string, string>;

    return (
      currentActivity.blanks?.every((blank) => {
        return Boolean(answers[blank.id]?.trim());
      }) ?? false
    );
  };

  const canAction =
    !isCompleting &&
    (currentActivity.type === "TUTORIAL" ||
      currentActivity.type === "VIEW" ||
      currentActivity.type === "TRY_CODE" ||
      (currentActivity.type === "CHOICE" && selectedChoiceId !== null) ||
      (currentActivity.type === "SELECT_FILL" && isSelectFillAnswered()));

  const canCompleteCurrentActivity =
    currentActivity.type === "TUTORIAL" ||
    currentActivity.type === "VIEW" ||
    currentActivity.type === "TRY_CODE" ||
    (checked && isCorrect === true);

  const buttonLabel =
    isCompleting
      ? "保存中..."
      : isLastActivity && canCompleteCurrentActivity
        ? "レッスン完了"
        : checked && isCorrect === true
          ? "次へ"
          : currentActivity.actionLabel;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F7F8FC",
        background:
          "linear-gradient(180deg, #F7F8FC 0%, #F3F7FF 45%, #F7F8FC 100%)",
      }}
    >
      <AppHeader />

      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2.5, md: 4 },
          px: { xs: 2, md: 3 },
        }}
      >
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <LessonHeaderCard
            lesson={lesson}
            currentActivityIndex={currentActivityIndex}
          />

          <LessonActivityCard
            activity={currentActivity}
            selectedChoiceId={selectedChoiceId}
            checked={checked}
            isCorrect={isCorrect}
            userAnswer={userAnswer}
            onChoiceSelect={handleChoiceSelect}
            onAnswerChange={handleAnswerChange}
          />

          {checked && feedback && (
            <Fade in={checked} timeout={250}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: isCorrect ? "#86EFAC" : "#FCA5A5",
                  bgcolor: isCorrect ? "#ECFDF5" : "#FFF1F2",
                  boxShadow: isCorrect
                    ? "0 14px 30px rgba(34, 197, 94, 0.10)"
                    : "0 14px 30px rgba(239, 68, 68, 0.08)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        bgcolor: isCorrect ? "#DCFCE7" : "#FFE4E6",
                        color: isCorrect ? "#16A34A" : "#E11D48",
                      }}
                    >
                      {isCorrect ? (
                        <CheckCircleRoundedIcon />
                      ) : (
                        <TipsAndUpdatesRoundedIcon />
                      )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} sx={{ color: "#0F172A" }}>
                        {isCorrect ? "正解！" : "もう一度確認しよう"}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{ mt: 0.75, lineHeight: 1.8 }}
                      >
                        {feedback}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Fade>
          )}

          <LessonActionButtons
            showBack={currentActivityIndex !== 0}
            canAction={canAction}
            buttonLabel={buttonLabel}
            onBack={handleBack}
            onAction={handleActionClick}
          />
        </Stack>
      </Container>
    </Box>
  );
}