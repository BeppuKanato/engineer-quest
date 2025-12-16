// components/Header.tsx
"use client";

import { useState } from "react";
import { AppBar, Toolbar, IconButton, Typography, Button, Stack, Drawer, Box } from "@mui/material";
import { Code2, Menu } from "lucide-react";

interface HeaderProps  {
    loginRouter: () => void;
}

export function Header({ loginRouter }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Brand */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Code2 style={{ color: 'white', width: 24, height: 24 }} />
            </Box>
            <Typography variant="h6">CodeQuest</Typography>
          </Stack>

          {/* Desktop Nav */}
          <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' } }} alignItems="center">
            <Button color="inherit" href="#features">機能紹介</Button>
            <Button color="inherit" href="#how-it-works">使い方</Button>
            <Button variant="contained" size="small" onClick={loginRouter}>ログイン</Button>
          </Stack>

          {/* Mobile Menu */}
          <IconButton
            edge="end"
            color="inherit"
            sx={{ display: { md: 'none' } }}
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <Box sx={{ width: 250, p: 2 }}>
          <Stack spacing={2}>
            <Button fullWidth href="#features">機能紹介</Button>
            <Button fullWidth href="#how-it-works">使い方</Button>
            <Button fullWidth variant="contained">ログイン</Button>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
