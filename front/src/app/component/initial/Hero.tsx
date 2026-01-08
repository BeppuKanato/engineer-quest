// components/Hero.tsx
"use client";

import { Box, Typography, Button, Stack } from "@mui/material";
import { Sparkles, Zap } from "lucide-react";

interface HeroProps { 
    signupRouter: () => void;
}

export function Hero({ signupRouter }: HeroProps) {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        py: { xs: 10, md: 20 },
        background: 'linear-gradient(135deg, #DBEAFE, #EDE9FE, #FFE4E6)',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'center' }}>
        {/* Left */}
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, px: 2, py: 1, backgroundColor: '#DBEAFE', borderRadius: 2, display: 'inline-flex', alignItems: 'center' }}>
            <Sparkles />
            <Typography variant="body2" color="primary">ゲーム感覚でプログラミングを学ぼう</Typography>
          </Stack>

          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
            新人エンジニアとして<br />
            <Box component="span" sx={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              成長の冒険
            </Box>
            を始めよう
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            EngineerQuestは、ミッションをクリアしながらプログラミングスキルを習得できる、ゲーミフィケーション型学習プラットフォームです。
            あなたのキャラクターと一緒に成長し、エンジニアとしてのキャリアを築きましょう。
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" size="large" onClick={signupRouter} startIcon={<Zap />}>学習を始める</Button>
            <Button variant="outlined" size="large">詳しく見る</Button>
          </Stack>
        </Box>

        {/* Right */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1623479322729-28b25c16b011?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
            alt="プログラミング学習"
            sx={{ width: '100%', borderRadius: 3, boxShadow: 4 }}
          />

          {/* Floating Cards */}
          <Box sx={{ position: 'absolute', top: -16, left: -16, bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, bgcolor: 'green', borderRadius: '50%' }} />
              <Typography variant="body2">レベルアップ！</Typography>
            </Stack>
          </Box>

          <Box sx={{ position: 'absolute', bottom: -16, right: -16, bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 32, height: 32, bgcolor: 'yellow', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>⭐</Box>
              <Box>
                <Typography variant="body2">ミッションクリア</Typography>
                <Typography variant="caption" color="text.secondary">+50 XP</Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
