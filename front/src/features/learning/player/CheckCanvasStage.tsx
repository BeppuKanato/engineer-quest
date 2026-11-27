"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Button } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { answerCueSx } from "../assessment/NodeAnswerOverlay";

import { playerTokens } from "./player.tokens";

/** 図外の回答操作（「どれも入らない」等）に確保する固定の高さ（画面 px）。 */
export const CHECK_CANVAS_CONTROLS_HEIGHT = 72;

export type CheckCanvasFrame = {
  /** 論理座標から画面 px への倍率。単元側のオーバーレイ配置はこの値だけで計算する。 */
  scale: number;
  /** ノードタップ領域の画面 px（44px を論理座標へ戻した下限 88 を下回らない）。 */
  tapSize: number;
};

/**
 * フェーズ3（動きの確認問題）キャンバスの共通土台。UI 定義 §2.3・§5.2 の実装はここだけに置く。
 * 宿主の実寸を測り、単元ごとの論理座標（geometry）を等倍比で拡縮して中央に置く。
 * 拡縮式・ステージ寸法・操作域の確保・初期サイズは単元側では決めない。
 * 単元側が渡すのは図の描画と回答オーバーレイだけとする。
 */
export function CheckCanvasStage({ logicalWidth, logicalHeight, groupLabel, controls, children }: {
  logicalWidth: number;
  logicalHeight: number;
  /** 図タップと図外ボタンを1つの回答グループとしてまとめる場合に指定する。 */
  groupLabel?: string;
  /** 図の下に置く図外の回答操作。ある場合だけ高さ 72px を確保し、拡縮はその分を除いた高さで決める。 */
  controls?: ReactNode;
  children: (frame: CheckCanvasFrame) => ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: logicalWidth, height: logicalHeight });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // 単元コンテナが過去フェーズを非表示にしても、最後の縮尺を維持する。
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const controlsHeight = controls ? CHECK_CANVAS_CONTROLS_HEIGHT : 0;
  const scale = Math.max(0.1, Math.min(size.width / logicalWidth, (size.height - controlsHeight) / logicalHeight));
  const tapSize = Math.max(88, 44 / scale);
  return (
    <Box ref={host} role={groupLabel ? "group" : undefined} aria-label={groupLabel}
      sx={{ flex: 1, minHeight: 320, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ width: logicalWidth * scale, height: logicalHeight * scale, position: "relative", flexShrink: 0 }}>
          {children({ scale, tapSize })}
        </Box>
      </Box>
      {controls && (
        <Box sx={{ height: controlsHeight, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {controls}
        </Box>
      )}
    </Box>
  );
}

/** 「どれも入らない」ボタン。図には重ねず、ステージ下の操作域に画面 px の大きさで置く（全単元共通）。 */
export function NoneAnswerButton({ disabled = false, onAnswer }: {
  disabled?: boolean;
  onAnswer: () => void;
}) {
  return (
    <Button type="button" disabled={disabled} startIcon={<TouchAppIcon sx={{ fontSize: 22 }} />}
      onClick={onAnswer}
      sx={{ ...answerCueSx, minHeight: 48, px: 3, borderRadius: 999, bgcolor: playerTokens.layers.layer0,
        color: playerTokens.text, fontSize: 17, fontWeight: 700, textTransform: "none",
        "&::before": { ...answerCueSx["&::before"], inset: 0 },
        "& .MuiButton-startIcon": { color: playerTokens.focus, mr: 1, ml: 0 },
        "&:hover": { bgcolor: playerTokens.layers.layer1 } }}>
      どれも入らない
    </Button>
  );
}
