import { Box, Typography } from "@mui/material";
import { LessonActivity } from "../../type";
import { HtmlIntroEditableTitlePreview } from "../preview/sampleCourse/htmlIntroEditableTitlePreview";
import { HtmlHeadingTagSwitcherPreview } from "../preview/sampleCourse/htmlHeadingTagSwitcherPreview";
import { HtmlHeadingGoalPreview } from "./sampleCourse/htmlHeadingGoalPreview";

type GoalPreviewRendererProps = {
  activity: LessonActivity;
  userAnswer?: unknown;
};

export const GoalPreviewRenderer: React.FC<GoalPreviewRendererProps> = ({
  activity,
  userAnswer,
}) => {
  const previewKey = activity.goal.previewKey;

  switch (previewKey) {
    case "htmlIntroEditableTitle":
      return <HtmlIntroEditableTitlePreview />;

    case "htmlHeadingTagSwitcher":
      return <HtmlHeadingTagSwitcherPreview />;
    
      case "htmlHeadingGoal":
        return <HtmlHeadingGoalPreview />

    default:
      return (
        <Box
          sx={{
            minHeight: 220,
            borderRadius: 3,
            border: "1px dashed #B7D4F6",
            bgcolor: "#F8FBFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            previewKey: {previewKey ?? "なし"}
          </Typography>
        </Box>
      );
  }
};