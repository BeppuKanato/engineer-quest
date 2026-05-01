import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";

import { LessonActivity } from "../type";
import { LessonPromptArea } from "./promptArea";
import { GoalPreviewRenderer } from "./preview/goalPreviewRenderer";
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

export const LessonActivityCard: React.FC<LessonActivityCardProps> = ({
  activity,
  selectedChoiceId,
  checked,
  isCorrect,
  userAnswer,
  onChoiceSelect,
  onAnswerChange,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid #E6EAF2",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <LessonPromptArea activity={activity} />

          <Divider sx={{ borderColor:  "#E6EAF2"}}/>

          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={800}>
              {activity.goal.title}
            </Typography>

            <GoalPreviewRenderer
              activity={activity}
              userAnswer={userAnswer}
            />
          </Stack>

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