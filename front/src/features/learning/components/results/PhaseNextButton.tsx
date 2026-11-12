"use client";

import { Button } from "@mui/material";

import { playerTokens } from "../../player/player.tokens";

/**
 * フェーズ間の遷移ボタンの共通形（#142）。
 * 置かれる場所（プレイヤーの操作バー／リザルト画面／フェーズ内の結果）によらず、
 * 種類・サイズ・色をこれ1つに揃える。文言は呼び出し側が「次の段階の名称＋へ進む」で渡す。
 */
export function PhaseNextButton({ label, onClick, disabled = false, ariaLabel }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return <Button variant="contained" onClick={onClick} disabled={disabled} aria-label={ariaLabel}
    sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap",
      bgcolor: playerTokens.focus, color: playerTokens.surface,
      "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>
    {label}
  </Button>;
}
