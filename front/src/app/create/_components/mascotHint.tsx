"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";

import { getMascotImagePath, useUserMascot } from "@/app/component/mascot";

export const MascotHint = ({ text }: { text: string }) => {
  const mascotId = useUserMascot();

  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box
        component="img"
        src={getMascotImagePath(mascotId, "cheer")}
        alt="マスコット"
        sx={{ width: 78, height: 78, objectFit: "contain", flexShrink: 0 }}
      />
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
