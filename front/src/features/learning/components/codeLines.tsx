import { Box, Typography } from "@mui/material";

export const CodeLines = ({
  code,
  activeLines = [],
  showLineNumbers = false,
  wrapLongLines = false,
  ariaLabel = "Pythonコード",
}: {
  code: string;
  activeLines?: readonly number[];
  showLineNumbers?: boolean;
  wrapLongLines?: boolean;
  ariaLabel?: string;
}) => (
  <Box
    role="region"
    aria-label={ariaLabel}
    sx={{
      minWidth: 0,
      bgcolor: "#0f172a",
      color: "#e2e8f0",
      borderRadius: 2,
      p: 1.5,
      overflowX: wrapLongLines ? "hidden" : "auto",
    }}
  >
    {code.split("\n").map((line, index) => (
      <Box
        key={index}
        sx={{
          display: "flex",
          minWidth: wrapLongLines ? 0 : "max-content",
          bgcolor: activeLines.includes(index + 1) ? "#1d4ed8" : "transparent",
          borderRadius: 0.5,
        }}
      >
        {showLineNumbers && (
          <Typography component="span" sx={{ width: 32, pr: 1, color: "#94a3b8", textAlign: "right", fontFamily: "monospace", userSelect: "none" }}>
            {index + 1}
          </Typography>
        )}
        <Typography
          component="code"
          sx={{
            display: "block",
            minWidth: 0,
            whiteSpace: wrapLongLines ? "pre-wrap" : "pre",
            overflowWrap: wrapLongLines ? "anywhere" : "normal",
            fontFamily: "monospace",
            fontSize: 14,
          }}
        >
          {line || " "}
        </Typography>
      </Box>
    ))}
  </Box>
);
