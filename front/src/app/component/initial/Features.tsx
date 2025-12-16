// components/Features.tsx
"use client";

import { Box, Typography } from "@mui/material";
import { Target, Trophy, Smile, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "ミッションベースの学習",
    description:
      "実践的なプログラミングタスクをミッション形式でクリア。段階的に難易度が上がるので、無理なくスキルアップできます。",
    color: "#3b82f6", // blue-500
  },
  {
    icon: Trophy,
    title: "ゲーミフィケーション",
    description:
      "経験値、レベルアップ、実績バッジなど、ゲーム要素で学習のモチベーションを維持。楽しみながら続けられます。",
    color: "#8b5cf6", // purple-500
  },
  {
    icon: Smile,
    title: "キャラクター成長システム",
    description:
      "あなたの学習進捗に応じて、新人エンジニアのキャラクターが成長。視覚的に自分の成長を実感できます。",
    color: "#ec4899", // pink-500
  },
  {
    icon: TrendingUp,
    title: "スキル可視化",
    description:
      "習得したスキルやコンピテンシーをグラフで確認。自分の強みと弱みを把握して、効率的に学習できます。",
    color: "#22c55e", // green-500
  },
];

export function Features() {
  return (
    <Box
      component="section"
      sx={{ py: { xs: 10, md: 20 }, backgroundColor: "white" }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
        {/* Section header */}
        <Box sx={{ textAlign: "center", maxWidth: 600, mx: "auto", mb: 8 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            CodeQuestの特徴
          </Typography>
          <Typography variant="body1" color="text.secondary">
            プログラミング学習を楽しく、効果的に。
            ゲーム感覚で本格的なスキルを身につけられます。
          </Typography>
        </Box>

        {/* Feature cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 4,
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Box
                key={index}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: feature.color,
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mb: 2,
                    transition: "transform 0.3s",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <Icon style={{ color: "white", width: 24, height: 24 }} />
                </Box>

                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
