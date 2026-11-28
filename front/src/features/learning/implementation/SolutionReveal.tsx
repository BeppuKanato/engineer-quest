"use client";

import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";

import { SOLUTION_REVEAL_FAILURE_THRESHOLD } from "./answerReveal";

const ACTION_BLUE = "#2563eb";
const TEXT_BLACK = "#111827";

/**
 * 解法例の解放バルブの導線（ステージ2）。
 * テスト失敗が閾値に達した試行でのみ出す。文字だけのリンクにせず、
 * 状態が伝わる面として置く。文言は新規の教材文を作らず、既存のお手本の
 * 文言（タイトル・注意書き）をそのまま使う。
 */
export function SolutionRevealValve({ onOpen }: { onOpen: () => void }) {
  return (
    <Box role="status" sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, border: "2px solid #d97706", borderRadius: 2, bgcolor: "#fffbeb", px: 2, py: 1.25 }}>
      <LockOpenRoundedIcon aria-hidden sx={{ color: "#d97706", fontSize: 28, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="p" sx={{ fontSize: 16, fontWeight: 900, color: TEXT_BLACK }}>
          解法例を見られるようになりました
        </Typography>
        <Typography component="p" sx={{ fontSize: 14, color: TEXT_BLACK }}>
          テストに{SOLUTION_REVEAL_FAILURE_THRESHOLD}回つまずいたため、進めるための手がかりとして解法例を開きました。見たあとも、自分のコードで挑戦を続けられます。
        </Typography>
      </Box>
      <Button variant="contained" startIcon={<MenuBookRoundedIcon />} onClick={onOpen}
        sx={{ minHeight: 48, px: 2.5, fontWeight: 800, flexShrink: 0, bgcolor: ACTION_BLUE, "&:hover": { bgcolor: "#1d4ed8" } }}>
        解法例を見る
      </Button>
    </Box>
  );
}

/** 解法例（既存のお手本プログラム）を表示するダイアログ。お手本の内容は変えない。 */
export function SolutionRevealDialog({ open, onClose, title, note, program }: {
  open: boolean;
  onClose: () => void;
  title: string;
  note: string;
  program: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-label={title}>
      <DialogTitle sx={{ fontSize: 20, fontWeight: 900, color: TEXT_BLACK }}>{title}</DialogTitle>
      <DialogContent>
        <Typography component="p" sx={{ fontSize: 14, mb: 1.5, color: TEXT_BLACK }}>{note}</Typography>
        <Box component="pre" sx={{ m: 0, p: 2, bgcolor: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 1.5, fontFamily: "monospace", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre", overflowX: "auto", color: TEXT_BLACK }}>
          {program}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
          <Button variant="contained" onClick={onClose} sx={{ minHeight: 44, px: 3, fontWeight: 800, bgcolor: ACTION_BLUE, "&:hover": { bgcolor: "#1d4ed8" } }}>
            自分のコードに戻る
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
