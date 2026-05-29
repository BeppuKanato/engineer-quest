import { Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";

import { LessonActivity } from "../type";
import { LessonPromptArea } from "./promptArea";
import { PreviewRenderer } from "./preview/previewRenderer";
import { AnswerRenderer } from "./answer/answerRenderer";

type LessonActivityCardProps = {
  activity: LessonActivity;
  selectedChoiceId: string | null;
  checked: boolean;
  isCorrect: boolean | null
  userAnswer: unknown;
  onChoiceSelect: (choiceId: string) => void;
  onAnswerChange: (answer: unknown) => void;
};

 
const activityTypeLabelMap: Record<LessonActivity["type"], string> = {
  TUTORIAL: "チュートリアル",
  CHOICE: "クイズ",
  SELECT_FILL: "穴埋め",
  TRY_CODE: "実践",
  VIEW: "まとめ",
};

const activityTypeColorMap: Record<LessonActivity["type"], { bg: string; color: string }> = {
  TUTORIAL: { bg: "#EAF3FF", color: "#1976D2" },
  CHOICE: { bg: "#EEF6FF", color: "#2563EB" },
  SELECT_FILL: { bg: "#FFF7ED", color: "#EA580C" },
  TRY_CODE: { bg: "#ECFDF5", color: "#16A34A" },
  VIEW: { bg: "#F5F3FF", color: "#7C3AED" },
};

export const LessonActivityCard: React.FC<LessonActivityCardProps> = ({
  activity,
  selectedChoiceId,
  checked,
  isCorrect,
  userAnswer,
  onChoiceSelect,
  onAnswerChange,
}) => {
  const shouldShowPreview = activity.preview.type !== "NO_PREVIEW"
  const shouldShowAnswer  = activity.type === "CHOICE" || activity.type === "SELECT_FILL" || activity.type === "TRY_CODE";
  const typeColor = activityTypeColorMap[activity.type];
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid #E6EAF2",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          bgcolor: typeColor.color,
          opacity: 0.9,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Chip
            label={activityTypeLabelMap[activity.type]}
            size="small"
            sx={{
              alignSelf: "flex-start",
              bgcolor: typeColor.bg,
              color: typeColor.color,
              fontWeight: 800,
              borderRadius: 999,
            }}
          />
          <LessonPromptArea activity={activity} />

          {shouldShowPreview && (
            <>
              <Divider sx={{ borderColor:  "#E6EAF2"}}/>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={800}>
                  {activity.preview.title}
                </Typography>
    
                <PreviewRenderer
                  preview={activity.preview}
                />
              </Stack>
            </>
          )}

          {shouldShowAnswer && shouldShowPreview && (
            <Divider sx={{ borderColor: "rgba(148, 163, 184, 0.18)"}} />
          )}
          <AnswerRenderer
            activity={activity}
            selectedChoiceId={selectedChoiceId}
            checked={checked}
            isCorrect={isCorrect}
            userAnswer={userAnswer}
            onChoiceSelect={onChoiceSelect}
            onAnswerChange={onAnswerChange}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};