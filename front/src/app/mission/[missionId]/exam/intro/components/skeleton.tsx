"use client";

import React from "react";
import { Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

export const MissionExamIntroSkeleton: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        borderRadius: 5,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.10)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          px: { xs: 2.5, md: 4 },
          pt: { xs: 3.5, md: 4.5 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <DecorativeMark
          value="✦"
          sx={{
            top: 30,
            left: 48,
            color: "rgba(124, 58, 237, 0.3)",
            fontSize: 28,
          }}
        />

        <DecorativeMark
          value="✦"
          sx={{
            top: 70,
            right: 62,
            color: "rgba(37, 99, 235, 0.3)",
            fontSize: 34,
          }}
        />

        <DecorativeMark
          value="★"
          sx={{
            right: 130,
            bottom: 46,
            color: "rgba(245, 158, 11, 0.3)",
            fontSize: 24,
          }}
        />

        <Stack
          spacing={2.2}
          alignItems="center"
          textAlign="center"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Chip
            label="MISSION EXAM"
            size="small"
            sx={{
              bgcolor: "#ede9fe",
              color: "#6d28d9",
              border: "1px solid rgba(124, 58, 237, 0.18)",
              fontWeight: 900,
              letterSpacing: "0.08em",
              borderRadius: 999,
            }}
          />

          <Box
            sx={{
              position: "relative",
              width: 88,
              height: 88,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              background: "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
              boxShadow: "0 18px 36px rgba(245, 158, 11, 0.24)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: -10,
                borderRadius: "50%",
                border: "2px solid rgba(250, 204, 21, 0.18)",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                inset: -20,
                borderRadius: "50%",
                border: "1px solid rgba(245, 158, 11, 0.12)",
              },
            }}
          >
            <EmojiEventsRoundedIcon sx={{ fontSize: 48 }} />
          </Box>

          <Box sx={{ width: "100%" }}>
            <Skeleton
              variant="text"
              animation="wave"
              sx={{
                mx: "auto",
                width: { xs: "85%", sm: 420 },
                height: 52,
                borderRadius: 2,
              }}
            />

            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{
                mx: "auto",
                mt: 1,
                width: 150,
                height: 24,
                borderRadius: 999,
              }}
            />

            <Skeleton
              variant="text"
              animation="wave"
              sx={{
                mx: "auto",
                mt: 1.8,
                width: { xs: "92%", sm: 520 },
                height: 28,
                borderRadius: 2,
              }}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: { xs: 360, sm: 430 },
              p: 1.3,
              borderRadius: 4,
              bgcolor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(148, 163, 184, 0.26)",
              boxShadow: "0 16px 34px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 3,
              }}
            />
          </Paper>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
            justifyContent="center"
          >
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{ width: 90, height: 24, borderRadius: 999 }}
            />
            <Skeleton
              variant="rounded"
              animation="wave"
              sx={{ width: 220, height: 24, borderRadius: 999 }}
            />
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 3.5 },
          background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
          borderTop: "1px solid rgba(226, 232, 240, 0.55)",
        }}
      >
        <Stack spacing={2.2}>
          <Box>
            <Typography
              component="h2"
              sx={{
                color: "#0f4fa8",
                fontWeight: 900,
                fontSize: { xs: "1.15rem", md: "1.3rem" },
                mb: 0.4,
              }}
            >
              難易度を選択
            </Typography>

            <Skeleton
              variant="text"
              animation="wave"
              sx={{ width: 260, height: 24, borderRadius: 2 }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },
              gap: 1.4,
            }}
          >
            {[0, 1, 2].map((index) => (
              <DifficultyCardSkeleton key={index} />
            ))}
          </Box>

          <Skeleton
            variant="rounded"
            animation="wave"
            sx={{
              width: "100%",
              height: 58,
              borderRadius: 3,
            }}
          />

          <Stack spacing={1.6} alignItems="center" sx={{ pt: 0.5 }}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <BoltRoundedIcon sx={{ fontSize: 22, color: "#7c3aed" }} />
              <Skeleton
                variant="text"
                animation="wave"
                sx={{ width: 150, height: 26, borderRadius: 2 }}
              />
            </Stack>

            <Button
              variant="contained"
              size="large"
              disabled
              sx={{
                width: { xs: "100%", sm: 360 },
                py: 1.45,
                borderRadius: 999,
                fontWeight: 900,
                fontSize: "1rem",
                textTransform: "none",
                background: "linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)",
                opacity: 0.55,
              }}
            >
              確認テストをはじめる
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

const DifficultyCardSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        overflow: "hidden",
        border: "2px solid rgba(203, 213, 225, 0.95)",
        borderRadius: 3.5,
        minHeight: 164,
        bgcolor: "#ffffff",
        boxShadow: "0 4px 10px rgba(15, 23, 42, 0.035)",
      }}
    >
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          height: 8,
          width: "100%",
        }}
      />

      <Stack spacing={1.35} sx={{ p: 1.8 }}>
        <Box sx={{ textAlign: "center", px: 2.5 }}>
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ mx: "auto", width: 58, height: 18, borderRadius: 2 }}
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ mx: "auto", width: 86, height: 30, borderRadius: 2 }}
          />
        </Box>

        <Box sx={{ pt: 0.8, borderTop: "1px solid rgba(203, 213, 225, 0.7)" }}>
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: 92, height: 20, borderRadius: 2 }}
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ width: 82, height: 20, borderRadius: 2 }}
          />
          <Skeleton
            variant="text"
            animation="wave"
            sx={{ mt: 0.8, width: "92%", height: 20, borderRadius: 2 }}
          />
        </Box>

        <Skeleton
          variant="text"
          animation="wave"
          sx={{ width: 58, height: 20, borderRadius: 2 }}
        />
      </Stack>
    </Box>
  );
};

type DecorativeMarkProps = {
  value: string;
  sx: object;
};

const DecorativeMark: React.FC<DecorativeMarkProps> = ({ value, sx }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        fontWeight: 900,
        lineHeight: 1,
        userSelect: "none",
        ...sx,
      }}
    >
      {value}
    </Box>
  );
};