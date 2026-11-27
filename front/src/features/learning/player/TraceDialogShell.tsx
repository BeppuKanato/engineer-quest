"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import type { ReactNode } from "react";

import type { LearningInstrumentation } from "../instrumentation/useLearningVisit";

import type { CanvasSnapshot, LearningContent } from "./content.types";
import { LearningPlayer } from "./LearningPlayer";
import { playerTokens } from "./player.tokens";

/** トレースダイアログの文言のうち、構成に必要なもの。各単元の trace.content が満たす。 */
export type TraceDialogText = {
  readonly dialog: string;
  readonly close: string;
  readonly variables: string;
  readonly line: string;
  readonly unset: string;
};

/** 変数パネルに出す1行。文字列なら表示名＝変数名、[表示名, 変数名] なら別名で引く。 */
export type TraceVariableRow = string | readonly [string, string];

/** トレース再生のキャンバスから、構成に必要な最小限の形を取り出すための形。 */
export type TraceShape = {
  readonly line: number | null;
  readonly variables: Readonly<Record<string, unknown>>;
  readonly terminal?: boolean;
  readonly showGraph?: boolean;
};

/**
 * 自分のコードの動きを見るダイアログ（トレース）の共通構成。
 * 枠・閉じる操作・プレイヤー・変数パネルの置き方と寸法はここだけが決める。
 * 単元側は文言、変数の一覧、実行キャンバスの描画だけを渡す。
 * 以前は単元ごとに同型のダイアログが複写され、変数パネルの高さ等がずれていた。
 */
export function TraceDialogShell<TCanvas extends CanvasSnapshot>({
  text, playback, variables, renderExecution, traceOf, extraRows,
  onClose, onLearningEvent, active = true,
}: LearningInstrumentation & {
  text: TraceDialogText;
  playback: { content: LearningContent<TCanvas>; mode: string; notice?: string | null };
  variables: readonly TraceVariableRow[];
  renderExecution: (canvas: TCanvas) => ReactNode;
  traceOf: (canvas: TCanvas) => TraceShape;
  /** 変数パネルの末尾に足す単元固有の行（DFS の戻り値など）。 */
  extraRows?: (canvas: TCanvas) => ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open onClose={onClose} maxWidth={false} aria-label={text.dialog}
      slotProps={{ paper: { "aria-label": text.dialog, sx: { width: "84vw", height: "84dvh", maxHeight: "calc(100dvh - 16px)", m: 1, borderRadius: 0, boxShadow: "none", bgcolor: playerTokens.surface, color: playerTokens.text } } }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <IconButton aria-label={text.close} onClick={onClose} sx={{ color: playerTokens.control }}><CloseIcon /></IconButton>
      </Box>
      {playback.notice && <Typography component="p" role="status" sx={{ textAlign: "center", px: 1 }}>{playback.notice}</Typography>}
      <LearningPlayer onLearningEvent={onLearningEvent} active={active} content={playback.content} renderCanvas={canvas => {
        const trace = traceOf(canvas);
        return (
          <Box data-trace-mode={playback.mode} sx={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {trace.showGraph !== false && <Box sx={{ flex: 1, minHeight: 220 }}>{renderExecution(canvas)}</Box>}
            <Box component="dl" aria-label={text.variables} sx={{ m: 0, mt: 1, alignSelf: "center", width: "min(100%, 600px)", display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)", gap: 0.5,
              maxHeight: 140, overflowY: "auto", flexShrink: 0, fontFamily: "monospace", fontSize: 16, color: playerTokens.text }}>
              <Box component="dt">{text.line}</Box><Box component="dd" data-trace-line sx={{ m: 0 }}>{trace.line ?? text.unset}</Box>
              {variables.map(row => {
                const [name, key] = typeof row === "string" ? [row, row] : row;
                const value = trace.variables[key];
                return (
                  <Box key={name} sx={{ display: "contents" }}>
                    <Box component="dt">{name} =</Box><Box component="dd" data-trace-variable={name} sx={{ m: 0, overflowWrap: "anywhere" }}>
                      {value === undefined || value === null ? text.unset : JSON.stringify(value)}
                    </Box>
                  </Box>
                );
              })}
              {extraRows?.(canvas)}
            </Box>
          </Box>
        );
      }} />
    </Dialog>
  );
}
