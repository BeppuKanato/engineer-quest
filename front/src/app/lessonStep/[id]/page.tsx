"use client";

import { useState } from "react";
import { Box, Card, CardContent, Container, Stack, Typography } from "@mui/material";

import { AppHeader } from "../../component/appHeader";
import { htmlSelfIntroductionLesson1 } from "../sampleData/htmlSelfIntroductionLesson1";
import { LessonHeaderCard } from "../component/headerCard";
import { LessonActivityCard } from "../component/activityCard";
import { LessonActionButtons } from "../component/actionButtons";
import { ActivityAnswerState } from "../type";
// import { normalize } from "path";

export default function LessonPage() {
  const lesson = htmlSelfIntroductionLesson1;

  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [userAnswer, setUserAnswer] = useState<unknown>(null);
  const [activityAnswerMap, setActivityAnswerMap] = useState<Record<string, ActivityAnswerState>>({});

  const currentActivity = lesson.activities[currentActivityIndex];

  const resetAnswerState = () => {
    setSelectedChoiceId(null);
    setChecked(false);
    setIsCorrect(null);
    setFeedback("");
    setUserAnswer(null);
  };

  const createFeedback = (
    activity: typeof currentActivity, savedState: ActivityAnswerState
  ) => {
    if (activity.type === "CHOICE") {
      const selectedChoice = activity.choices?.find(
        (choice) => choice.id === savedState.selectedChoiceId
      );

      return selectedChoice?.feedback ?? "";
    }

    if (activity.type === "FILL_BLANK") {
      return activity.correctFeedback ?? "正解です！";
    }

    return "";
  };

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoiceId(choiceId);
    setChecked(false);
    setIsCorrect(null);
    setFeedback("");
  };

  const handleConfirm = () => {
    if (currentActivity.type === "TUTORIAL" || currentActivity.type === "VIEW") {
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

    const normalize = (value: unknown) => {
      return String(value ?? "").trim().toLowerCase();
    }

    if (currentActivity.type === "FILL_BLANK") {
      const answers = (userAnswer ?? {}) as Record<string, string>;

      const result =
        currentActivity.blanks?.every((blank) => {
          return normalize(answers[blank.id]) === normalize(blank.answer);
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

      return;
    }
    // TODO: FILL_BLANK / SHORT_INPUT / ORDERING / TRACE
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

  const handleNext = () => {
    if (currentActivityIndex >= lesson.activities.length - 1) {
      console.log("lesson completed");
      return;
    }

    moveToActivity(currentActivityIndex + 1);
  };

  const handleBack = () => {
    if (currentActivityIndex === 0) return;

    moveToActivity(currentActivityIndex - 1);
  };

  const handleActionClick = () => {
    if (checked && isCorrect) {
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
  }

  const isFillBlanckAnswered = () => {
    if (currentActivity.type !== "FILL_BLANK") return false;

    const answers = (userAnswer ?? {}) as Record<string, string>;

    return(
      currentActivity.blanks?.every((blank) => {
        return Boolean(answers[blank.id]?.trim());
      }) ?? false
    );
  };

  const canAction =
    currentActivity.type === "TUTORIAL" ||
    currentActivity.type === "VIEW" ||
    (currentActivity.type === "CHOICE" && selectedChoiceId !== null) || 
    (currentActivity.type === "FILL_BLANK" && isFillBlanckAnswered());

  const buttonLabel =
    checked && isCorrect ? "次へ" : currentActivity.actionLabel;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7F8FC" }}>
      <AppHeader />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
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
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: isCorrect ? "#A7E3C1" : "#F6B3B3",
                bgcolor: isCorrect ? "#F0FFF6" : "#FFF5F5",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography fontWeight={800}>
                  {isCorrect ? "正解！" : "もう一度確認しよう"}
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                  {feedback}
                </Typography>
              </CardContent>
            </Card>
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