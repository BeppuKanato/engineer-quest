// components/GameFeatures.tsx
"use client";

import { Box, Typography, Stack } from "@mui/material";
import { Star, Zap, Award } from "lucide-react";
import Image from "next/image";

const steps = [
  {
    step: "STEP 1",
    title: "キャラクター作成 & 基礎学習",
    description:
      "まずはあなたの分身となる新人エンジニアキャラクターを作成。基礎的なプログラミング概念から学習をスタートします。チュートリアルミッションで操作方法に慣れましょう。",
    icon: Star,
    iconColor: "#facc15",
    imageUrl: "https://images.unsplash.com/photo-1529429612779-c8e40ef2f36d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    reverse: true,
  },
  {
    step: "STEP 2",
    title: "ミッションに挑戦",
    description:
      "実践的なプログラミングタスクをミッション形式でクリア。コードレビューやヒント機能があるので、詰まっても安心。クリアすると経験値とバッジを獲得できます。",
    icon: Zap,
    iconColor: "#facc15",
    imageUrl: "https://images.unsplash.com/photo-1529429612779-c8e40ef2f36d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    reverse: false,
  },
  {
    step: "STEP 3",
    title: "レベルアップ & 成長実感",
    description:
      "ミッションをクリアするたびにキャラクターがレベルアップ。新人からシニアエンジニアまで、成長の過程を視覚的に楽しめます。習得したスキルはポートフォリオとして記録されます。",
    icon: Award,
    iconColor: "#22c55e",
    imageUrl: "https://images.unsplash.com/photo-1653179241553-891d33f05410?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    reverse: true,
  },
];

export function GameFeatures() {
  return (
    <Box component="section" sx={{ py: { xs: 10, md: 20 }, bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 12 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            学習の流れ
          </Typography>
          <Typography variant="body1" color="text.secondary">
            新人エンジニアとして入社し、様々なミッションに挑戦。成長を重ねて一人前のエンジニアを目指しましょう。
          </Typography>
        </Box>

        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Stack
              key={index}
              direction={{ xs: "column", md: step.reverse ? "row-reverse" : "row" }}
              spacing={4}
              alignItems="center"
              sx={{ mb: 16 }}
            >
              {/* Text Content */}
              <Box sx={{ flex: 1 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 2,
                      py: 1,
                      bgcolor: step.iconColor + "33",
                      color: step.iconColor,
                      borderRadius: 2,
                      fontWeight: "bold",
                      width: "fit-content",
                    }}
                  >
                    <Icon style={{ marginRight: 4 }} /> {step.step}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {step.description}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: 14,
                        color: step.iconColor,
                      }}
                    >
                      <Icon style={{ fontSize: 18 }} /> 実績例
                    </Box>
                  </Stack>
                </Stack>
              </Box>

              {/* Image Content */}
              <Box sx={{ flex: 1, borderRadius: 3, overflow: "hidden", boxShadow: 6 }}>
                <Image
                  src={step.imageUrl}
                  alt={step.title}
                  style={{ width: "100%", height: "auto", display: "block" }}
                  width={800}
                  height={500}
                />
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Box>
  );
}
