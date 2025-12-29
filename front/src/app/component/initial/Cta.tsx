// components/Cta.tsx
"use client";

import { Box, Typography, Stack, Button } from "@mui/material";
import { ArrowRight, Sparkles } from "lucide-react";

interface CtaProps {
    signupRouter: () => void;
}

export function Cta({ signupRouter }: CtaProps) {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 10, md: 20 },
        position: "relative",
        overflow: "hidden",
        bgcolor: "primary.main",
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
        color: "white",
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Box sx={{ maxWidth: 800, mx: "auto", px: 2, position: "relative", zIndex: 1, textAlign: "center" }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 2,
            py: 1,
            bgcolor: "rgba(255,255,255,0.2)",
            borderRadius: 3,
            mb: 3,
          }}
        >
          <Sparkles size={16} />
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            今なら無料で始められます
          </Typography>
        </Stack>

        <Typography variant="h4" component="h2" sx={{ fontWeight: "bold", mb: 2 }}>
          EngineerQuestで
          <br />
          プログラミング学習を始めよう
        </Typography>

        <Typography variant="body1" color="rgba(255,255,255,0.9)" sx={{ mb: 4 }}>
          新人エンジニアとして、ミッションをクリアしながらスキルを習得。
          キャラクターと一緒に成長する、新しい学習体験を。
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 1.5,
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              backgroundColor: "secondary.main",
              color: "white",
              "&:hover": { backgroundColor: "secondary.dark" },
            }}
            endIcon={<ArrowRight />}
            onClick={signupRouter}
          >
            学習を始める
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
