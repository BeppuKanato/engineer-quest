"use client";

import { Paper, Stack, Typography } from "@mui/material";

import { useUserMascot } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";

export const MascotHint = ({ text }: { text: string }) => {
  const mascotId = useUserMascot();

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <MascotFigure mascotId={mascotId} state="cheer" alt="マスコット" size="M" grounding="disc" />
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
