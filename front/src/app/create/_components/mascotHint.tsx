"use client";

import { Paper, Stack, Typography } from "@mui/material";

import { RobotFigure } from "@/app/component/robotFigure";

export const MascotHint = ({ text }: { text: string }) => {

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <RobotFigure state="cheer" alt="マスコット" size="M" grounding="disc" />
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.4,
          borderRadius: 2,
          border: "1px solid #dbe3ef",
          bgcolor: "#fff",
          position: "relative",
        }}
      >
        <Typography fontWeight={800} sx={{ lineHeight: 1.7 }}>
          {text}
        </Typography>
      </Paper>
    </Stack>
  );
};
