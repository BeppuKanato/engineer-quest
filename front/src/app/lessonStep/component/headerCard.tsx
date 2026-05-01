import {
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Lesson } from "../type";

type LessonHeaderCardProps = {
  lesson: Lesson;
  currentActivityIndex: number;
};

export const LessonHeaderCard: React.FC<LessonHeaderCardProps> = ({
  lesson,
  currentActivityIndex,
}) => {
  const currentStep = currentActivityIndex + 1;
  const totalSteps = lesson.activities.length;
  const progress = (currentStep / totalSteps) * 100;

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
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              {lesson.courseTitle}
            </Typography>

            <Typography variant="h4" fontWeight={800}>
              {lesson.title}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flex: 1,
                height: 10,
                borderRadius: 999,
                bgcolor: "#E8EEF7",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                },
              }}
            />

            <Typography variant="body2" fontWeight={700}>
              {currentStep} / {totalSteps}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};