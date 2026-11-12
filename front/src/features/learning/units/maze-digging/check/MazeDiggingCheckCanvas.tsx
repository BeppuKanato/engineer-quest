"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import type { NodeAnswer } from "../../../assessment/assessment";
import { answerCueSx } from "../../../assessment/NodeAnswerOverlay";
import { MazeGridDrawing } from "../../../player/MazeGridDrawing";
import { mazeGridGeometry, mazeGridLayout } from "../../../player/mazeGridGeometry";
import { parseMazeCellKey, type MazeGridCanvasState } from "../../../player/mazeGrid.types";
import { playerTokens } from "../../../player/player.tokens";

/**
 * 盤面と回答操作を同じキャンバスへまとめる。描画は共通グリッド基盤に委譲し、
 * 回答ボタンはマスの中心に重ねる HTML ボタンとする（図の座標・状態色は変えない）。
 * タップ領域はマスそのもの。ただし画面上で 44px 未満になる場合は BFS フェーズ3と
 * 同じ考え方で中心から広げ、最低限の大きさを保つ。
 */
export function MazeDiggingCheckCanvas({ canvas, questionId, cellIds, onAnswer, disabled = false }: {
  canvas: MazeGridCanvasState;
  questionId?: string;
  cellIds?: readonly string[];
  onAnswer: (answer: NodeAnswer) => void;
  /** 正解後は選び直せないよう入力を固定する。 */
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: mazeGridGeometry.width, height: mazeGridGeometry.height });
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
  const scale = Math.max(0.1, Math.min(size.width / mazeGridGeometry.width, size.height / mazeGridGeometry.height));
  const layout = mazeGridLayout(canvas.data.size);
  const tapSize = Math.max(layout.cell * scale, 44);
  return <Box ref={host} sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: mazeGridGeometry.width * scale, height: mazeGridGeometry.height * scale, position: "relative", flexShrink: 0 }}>
        <MazeGridDrawing canvas={canvas} label={`${canvas.data.size}×${canvas.data.size}の迷路の盤面`} />
        {questionId && <Box role="group" aria-label="回答の選択肢" sx={{ position: "absolute", inset: 0 }}>
          {cellIds?.map((key) => {
            const center = layout.center(key);
            const { x, y } = parseMazeCellKey(key);
            return <Box component="button" type="button" key={`${questionId}:${key}`} disabled={disabled}
              aria-label={`${x + 1}列目、${y + 1}行目のマスを選ぶ`}
              onClick={() => onAnswer({ kind: "node", nodeId: key })}
              sx={{ ...answerCueSx, position: "absolute", display: "block", p: 0, border: 0, borderRadius: 1.5,
                left: center.x * scale - tapSize / 2, top: center.y * scale - tapSize / 2, width: tapSize, height: tapSize,
                background: "transparent", cursor: "pointer", touchAction: "manipulation",
                "&::before": { ...answerCueSx["&::before"], inset: 2 },
                "&:active::before": { borderWidth: 5, opacity: 1 },
                "&:disabled": { cursor: "default" },
              }}>
              <TouchAppIcon aria-hidden sx={{ position: "absolute", top: 1, right: 1, fontSize: 19,
                bgcolor: playerTokens.surface, borderRadius: "50%", color: playerTokens.focus, pointerEvents: "none" }} />
            </Box>;
          })}
        </Box>}
      </Box>
    </Box>
  </Box>;
}
