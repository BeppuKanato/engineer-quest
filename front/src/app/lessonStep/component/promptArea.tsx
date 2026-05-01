import { Avatar, Box, Stack, Typography } from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";

import { LessonActivity, LessonStepType } from "../type";

const mentorIconMap: Record<LessonStepType, React.ReactElement> = {
  TUTORIAL: <SchoolRoundedIcon />,
  VIEW: <SchoolRoundedIcon />,
  CHOICE: <QuizRoundedIcon />,
  FILL_BLANK: <CodeRoundedIcon />,
  ORDERING: <FormatListNumberedRoundedIcon />,
  SHORT_INPUT: <EditRoundedIcon />,
  TRACE: <RouteRoundedIcon />,
};

type LessonPromptAreaProps = {
  activity: LessonActivity;
};

export const LessonPromptArea: React.FC<LessonPromptAreaProps> = ({
  activity,
}) => {
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: "#EAF3FF",
            color: "primary.main",
            border: "1px solid #D9E5F7",
          }}
        >
          {mentorIconMap[activity.type]}
        </Avatar>

        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 999,
            bgcolor: "#F2F7FF",
            border: "1px solid #D9E5F7",
          }}
        >
          <Typography fontWeight={700} color="primary.main">
            {activity.mentorMessage}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
          {activity.title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ lineHeight: 1.8 }}
        >
          {activity.instruction}
        </Typography>
      </Box>
    </Stack>
  );
};