// components/Footer.tsx
"use client";

import { Box, Container, Stack, Typography, Link } from "@mui/material";
import { Code2 } from "lucide-react";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "grey.900",
        color: "white",
        py: { xs: 8, md: 16 },
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 6, md: 4 }}
          mb={6}
        >
          {/* Brand */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  }}
                >
                  <Code2 size={20} color="white" />
                </Box>
                <Typography variant="h6">CodeQuest</Typography>
              </Stack>
              <Typography variant="body2" color="grey.400">
                ゲーム感覚で楽しく学べる、プログラミング学習プラットフォーム
              </Typography>
            </Stack>
          </Box>

          {/* Product */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" mb={1}>学習</Typography>
            <Stack spacing={0.5}>
              <Link href="#" color="grey.400" underline="hover">機能紹介</Link>
              <Link href="#" color="grey.400" underline="hover">使い方</Link>
              <Link href="#" color="grey.400" underline="hover">ミッション一覧</Link>
            </Stack>
          </Box>

          {/* Resources */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" mb={1}>リソース</Typography>
            <Stack spacing={0.5}>
              <Link href="#" color="grey.400" underline="hover">ドキュメント</Link>
              <Link href="#" color="grey.400" underline="hover">チュートリアル</Link>
            </Stack>
          </Box>

          {/* About */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" mb={1}>情報</Typography>
            <Stack spacing={0.5}>
              <Link href="#" color="grey.400" underline="hover">CodeQuestについて</Link>
              <Link href="#" color="grey.400" underline="hover">お問い合わせ</Link>
            </Stack>
          </Box>
        </Stack>

        <Box borderTop={1} borderColor="grey.800" pt={4}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="grey.400" textAlign={{ xs: "center", md: "left" }}>
              © 2025 CodeQuest. All rights reserved.
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
