import { Box, Typography } from "@mui/material";
import { Preview } from "../../type";
import { StaticHtmlPreview } from "./staticHtmlPreview";
import { HtmlIntroEditableTitlePreview } from "./sampleCourse/htmlIntroEditableTitlePreview";
import { HtmlHeadingTagSwitcherPreview } from "./sampleCourse/htmlHeadingTagSwitcherPreview";

type PreviewRendererProps = {
  preview?: Preview;
  userAnswer?: unknown;
};

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({
  preview,
  userAnswer,
}) => {
  console.log(`previewTest: ${preview?.type}`)
  if (!preview) return null;

  if (preview.type === "STATIC_HTML") {
    return (
      <StaticHtmlPreview
        html={preview.html ?? ""}
        caption={preview.caption}
        minHeight={preview.minHeight}
      />
    );
  }

  if (preview.type === "CUSTOM") {
    switch (preview.previewKey) {
      case "htmlIntroEditableTitle":
        return <HtmlIntroEditableTitlePreview />;

      case "htmlHeadingTagSwitcher":
        return <HtmlHeadingTagSwitcherPreview />;

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
              previewKey: {preview.previewKey ?? "なし"}
            </Typography>
          </Box>
        );
    }
  }

  return null;
};