"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { learningBlockCardSx } from "./blockCardStyles";

export type CodeWorkspaceBlock = { id: string; label: string };
export type CodeWorkspaceSlot = { label: string; indent?: number };

export const CodeBlockWorkspace = ({
  blocks,
  slots,
  selectedBlockIds,
  prefix,
  instruction,
  previewMessage,
  previewSuccess = false,
  disabled = false,
  onChange,
}: {
  blocks: readonly CodeWorkspaceBlock[];
  slots: readonly CodeWorkspaceSlot[];
  selectedBlockIds: readonly string[];
  prefix?: string;
  instruction: string;
  previewMessage?: string;
  previewSuccess?: boolean;
  disabled?: boolean;
  onChange: (selectedBlockIds: string[]) => void;
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("候補ブロックをクリックするか、コードのスロットへドラッグしてください。");
  const selected = Array.from({ length: slots.length }, (_, index) => selectedBlockIds[index] ?? "");
  const blockById = new Map(blocks.map((block) => [block.id, block]));

  const setSlot = (slot: number, blockId: string) => {
    if (disabled) return;
    const next = [...selected];
    const previousIndex = next.indexOf(blockId);
    if (previousIndex >= 0) next[previousIndex] = "";
    next[slot] = blockId;
    onChange(next);
    setRecentlyMovedId(blockId);
    setStatusMessage(`${blockById.get(blockId)?.label ?? "ブロック"}を「${slots[slot]?.label ?? `処理 ${slot + 1}`}」へ配置しました。`);
  };
  const move = (from: number, to: number) => {
    if (disabled || to < 0 || to >= slots.length) return;
    const next = [...selected];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
    const movedId = selected[from];
    if (movedId) {
      setRecentlyMovedId(movedId);
      setStatusMessage(`${blockById.get(movedId)?.label ?? "ブロック"}を${to < from ? "1つ上" : "1つ下"}へ移動しました。`);
    }
  };
  const remove = (slot: number) => {
    if (disabled) return;
    const next = [...selected];
    next[slot] = "";
    onChange(next);
    setRecentlyMovedId(null);
    setStatusMessage(`${blockById.get(selected[slot])?.label ?? "ブロック"}をコードから外しました。`);
  };
  const nextEmptySlot = selected.findIndex((blockId) => !blockId);
  const selectedCount = selected.filter(Boolean).length;

  const placeByClick = (blockId: string) => {
    const selectedIndex = selected.indexOf(blockId);
    if (selectedIndex >= 0) {
      setStatusMessage(`このブロックは「${slots[selectedIndex]?.label ?? `処理 ${selectedIndex + 1}`}」へ配置済みです。移動はコード側の「上へ」「下へ」を使います。`);
      return;
    }
    if (nextEmptySlot < 0) {
      setStatusMessage("空きスロットがありません。入れ替えるブロックをコードから外してから配置してください。");
      return;
    }
    setSlot(nextEmptySlot, blockId);
  };

  return (
    <Stack spacing={2}>
      <Stack spacing={0.75}>
        <Typography fontWeight={950}>{instruction}</Typography>
        <Typography color="#475569" fontWeight={800}>
          1. 候補をクリックまたはドラッグして配置　2. コード側の「上へ」「下へ」で順番と階層を調整　3. 不要なブロックは「外す」
        </Typography>
        <Typography aria-live="polite" color="primary" fontWeight={850}>{statusMessage}</Typography>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(300px, .9fr)" }, gap: 2 }}>
        <Paper elevation={0} sx={{ minWidth: 0, p: 1.5, bgcolor: "#0f172a", color: "#e2e8f0", borderRadius: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
            <Typography fontWeight={950}>組み立て中のコード</Typography>
            <Chip size="small" label={`配置 ${selectedCount} / ${slots.length}`} sx={{ bgcolor: "#dbeafe", color: "#1e3a8a", fontWeight: 900 }} />
          </Stack>
          {prefix && <Typography component="code" sx={{ display: "block", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "ui-monospace, monospace" }}>{prefix}</Typography>}
          {slots.map((slot, index) => {
            const block = selected[index] ? blockById.get(selected[index]) : null;
            return (
              <Paper
                key={`${slot.label}-${index}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => { if (draggedId) setSlot(index, draggedId); setDraggedId(null); }}
                elevation={0}
                sx={{
                  mt: 1.5,
                  ml: { xs: Math.min(slot.indent ?? index, 3) * 1.25, sm: Math.min(slot.indent ?? index, 3) * 4 },
                  p: 1.25,
                  minHeight: 64,
                  border: block ? "2px solid #60a5fa" : "2px dashed #60a5fa",
                  borderRadius: 2,
                  bgcolor: recentlyMovedId === block?.id ? "#dbeafe" : block ? "#eff6ff" : "rgba(255,255,255,.06)",
                  color: block ? "#0f172a" : "#bfdbfe",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                  transition: "background-color 180ms ease, border-color 180ms ease",
                }}
              >
                <Chip size="small" label={`${index + 1}. ${slot.label || `処理 ${index + 1}`}`} />
                <Typography component="code" sx={{ minWidth: 180, flex: 1, fontFamily: "ui-monospace, monospace", fontWeight: 800, overflowWrap: "anywhere" }}>{block?.label ?? "ここへ配置"}</Typography>
                {block && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    <Button size="small" variant="outlined" startIcon={<ArrowUpwardIcon />} disabled={disabled || index === 0} onClick={() => move(index, index - 1)}>上へ</Button>
                    <Button size="small" variant="outlined" startIcon={<ArrowDownwardIcon />} disabled={disabled || index === slots.length - 1} onClick={() => move(index, index + 1)}>下へ</Button>
                    <Button size="small" color="inherit" onClick={() => remove(index)}>外す</Button>
                  </Stack>
                )}
              </Paper>
            );
          })}
          {previewMessage && (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${previewSuccess ? "#86efac" : "#cbd5e1"}`,
                bgcolor: previewSuccess ? "#ecfdf5" : "#f8fafc",
                color: previewSuccess ? "#166534" : "#475569",
              }}
            >
              <Typography fontWeight={900}>{previewSuccess ? "正解後の実行結果" : "配置状況"}</Typography>
              <Typography sx={{ mt: 0.5 }}>{previewMessage}</Typography>
            </Paper>
          )}
        </Paper>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={950}>使えるコードブロック</Typography>
            <Button size="small" startIcon={<RestartAltIcon />} disabled={disabled} onClick={() => { onChange([]); setRecentlyMovedId(null); setStatusMessage("すべての配置をリセットしました。"); }}>リセット</Button>
          </Stack>
          {blocks.map((block) => {
            const selectedIndex = selected.indexOf(block.id);
            return (
              <Paper
                key={block.id}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                draggable={!disabled}
                onDragStart={() => setDraggedId(block.id)}
                onDragEnd={() => setDraggedId(null)}
                onClick={() => placeByClick(block.id)}
                onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                  if (!disabled && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    placeByClick(block.id);
                  }
                }}
                elevation={0}
                sx={{ ...learningBlockCardSx({ selected: selectedIndex >= 0, disabled, dragging: draggedId === block.id }), width: "100%", textAlign: "left" }}
              >
                <DragIndicatorIcon color="primary" />
                <Typography component="code" sx={{ minWidth: 0, flex: 1, fontFamily: "ui-monospace, monospace", fontWeight: 800, overflowWrap: "anywhere" }}>{block.label}</Typography>
                {selectedIndex >= 0 && <Chip size="small" color="primary" label={`配置済み ${selectedIndex + 1}`} sx={{ fontWeight: 900 }} />}
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
};
