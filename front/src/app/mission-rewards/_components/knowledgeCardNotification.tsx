"use client";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Box, Button, Chip, Dialog, DialogContent, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { getRarityTone, RewardSparkles } from "./rewardVisuals";

export type AwardedKnowledgeCard = {
  id: string;
  catalogNumber: number;
  title: string;
  description: string;
  rarity: string;
};

export const KnowledgeCardUnlockModal = ({
  open,
  card,
  onClose,
}: {
  open: boolean;
  card: AwardedKnowledgeCard | null;
  onClose: () => void;
}) => {
  const tone = getRarityTone(card?.rarity ?? "COMMON");

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
      }}
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
      aria-labelledby="knowledge-card-unlock-title"
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(46, 16, 101, 0.78)", backdropFilter: "blur(3px)" } },
        paper: { sx: { borderRadius: { xs: 3, sm: 5 }, overflow: "hidden", bgcolor: "#faf5ff" } },
      }}
    >
      <DialogContent sx={{ position: "relative", p: { xs: 2.5, sm: 4 }, overflow: "hidden" }}>
        <RewardSparkles />
        {card && (
          <Stack spacing={2.25} alignItems="center" textAlign="center" sx={{ position: "relative", zIndex: 1 }}>
            <Typography id="knowledge-card-unlock-title" variant="h3" fontWeight={950} color="#6b21a8" sx={{ fontSize: { xs: 30, sm: 42 } }}>
              知識カード発見！
            </Typography>
            <Typography color="#581c87" fontWeight={800}>新しい知識への入口がコレクションに加わりました。</Typography>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 430,
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: 4,
                border: `2px solid ${tone.border}`,
                bgcolor: "rgba(255,255,255,0.95)",
                boxShadow: `${tone.glow}, 0 30px 70px rgba(88, 28, 135, 0.18)`,
              }}
            >
              <Stack spacing={1.75} alignItems="center">
                <Box sx={{ width: 120, height: 120, borderRadius: 4, display: "grid", placeItems: "center", color: tone.color, bgcolor: tone.bgcolor, border: `1px solid ${tone.border}` }}>
                  <MenuBookIcon sx={{ fontSize: 72 }} />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={`No.${String(card.catalogNumber).padStart(2, "0")}`} sx={{ fontWeight: 900 }} />
                  <Chip label={tone.label} sx={{ fontWeight: 950, color: tone.color, bgcolor: tone.bgcolor }} />
                </Stack>
                <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.25 }}>{card.title}</Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{card.description}</Typography>
              </Stack>
            </Paper>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: "100%", justifyContent: "center" }}>
              <Button component={Link} href="/knowledge-cards" variant="outlined" startIcon={<MenuBookIcon />} sx={{ minHeight: 50, px: 3, fontWeight: 900, borderRadius: 3 }}>
                カードの詳細を見る
              </Button>
              <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={onClose} sx={{ minHeight: 50, px: 5, fontWeight: 900, borderRadius: 3, bgcolor: "#7e22ce", "&:hover": { bgcolor: "#6b21a8" } }}>
                結果を確認する
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};
