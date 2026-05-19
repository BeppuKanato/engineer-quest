import { Box, Typography } from "@mui/material";

type HtmlIframePreviewProps = {
  html: string;
  minHeight?: number;
  bodyPadding?: number;
  showBorder?: boolean;
};

export const HtmlIframePreview: React.FC<HtmlIframePreviewProps> = ({
  html,
  minHeight = 280,
  bodyPadding = 24,
  showBorder = true,
}) => {
  const srcDoc = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Arial, sans-serif;
        padding: ${bodyPadding}px;
        color: #0f172a;
        background: #ffffff;
      }

      h1 {
        font-size: 32px;
        margin: 0 0 16px;
        font-weight: 800;
      }

      h2 {
        font-size: 28px;
        margin: 0 0 14px;
        font-weight: 800;
      }

      h3 {
        font-size: 24px;
        margin: 0 0 12px;
        font-weight: 800;
      }

      p {
        margin: 0 0 12px;
        color: #475569;
        line-height: 1.8;
      }

      button {
        margin-top: 8px;
        border: 0;
        border-radius: 10px;
        padding: 10px 16px;
        background: #1976d2;
        color: white;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>
`;

  if (!html.trim()) {
    return (
      <Box
        sx={{
          width: "100%",
          height: minHeight,
          borderRadius: 3,
          border: showBorder ? "1px solid #E0E7F0" : "none",
          bgcolor: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
          textAlign: "center",
        }}
      >
        <Typography variant="body2">ここに表示結果が出ます</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="iframe"
      title="HTML preview"
      sandbox=""
      srcDoc={srcDoc}
      sx={{
        display: "block",
        width: "100%",
        height: minHeight,
        border: showBorder ? "1px solid #E0E7F0" : "none",
        borderRadius: 3,
        bgcolor: "#FFFFFF",
      }}
    />
  );
};