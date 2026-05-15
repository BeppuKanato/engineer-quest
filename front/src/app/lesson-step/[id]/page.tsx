"use client";

import { useState } from "react";
import { Box, Card, CardContent, Container, Stack, Typography, Fade } from "@mui/material";

import { AppHeader } from "../../component/appHeader";
import { htmlSelfIntroductionLesson1 } from "../sampleData/htmlSelfIntroductionLesson1";
import { LessonHeaderCard } from "../component/headerCard";
import { LessonActivityCard } from "../component/activityCard";
import { LessonActionButtons } from "../component/actionButtons";
import { ActivityAnswerState } from "../type";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import { useRouter } from "next/navigation";

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
  const isLastActivity = currentActivityIndex === lesson.activities.length - 1;

  const router = useRouter();

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

    if (activity.type === "SELECT_FILL") {
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
    if (currentActivity.type === "TUTORIAL" || 
    currentActivity.type === "VIEW" || 
    currentActivity.type === "TRY_CODE") {
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
      router.push("/lesson-complete");
      return;
    }

    moveToActivity(currentActivityIndex + 1);
  };

  const handleBack = () => {
    if (currentActivityIndex === 0) return;

    moveToActivity(currentActivityIndex - 1);
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
  }

  const isSelectFillAnswered = () => {
    if (currentActivity.type !== "SELECT_FILL") return false;

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
  currentActivity.type === "TRY_CODE" ||
  (currentActivity.type === "CHOICE" && selectedChoiceId !== null) ||
  (currentActivity.type === "SELECT_FILL" && isSelectFillAnswered());

  const canCompleteCurrentActivity =
    currentActivity.type === "TUTORIAL" ||
    currentActivity.type === "VIEW" ||
    currentActivity.type === "TRY_CODE" ||
    (checked && isCorrect === true);

  const buttonLabel =
    isLastActivity && canCompleteCurrentActivity
      ? "レッスン完了"
      : checked && isCorrect === true
        ? "次へ"
        : currentActivity.actionLabel;
  return (
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#F7F8FC",
      background: "linear-gradient(180deg, #F7F8FC 0%, #F3F7FF 45%, #F7F8FC 100%)" 
    }}>
      <AppHeader />

      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2.5, md: 4},
          px: { xs: 2, md: 3} 
        }}
      >
        <Stack spacing={{ xs: 2.5, md: 3}}>
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