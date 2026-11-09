"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import type { NodeAnswer } from "../../assessment/assessment";
import { answerCueSx } from "../../assessment/NodeAnswerOverlay";
import { ArrayDrawing } from "../../player/ArrayDrawing";
import { arrayBarsGeometry, arrayBarsLayout } from "../../player/arrayBarsGeometry";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import { playerTokens } from "../../player/player.tokens";

/** 回答ボタンの縦の範囲。値のラベルより上から、位置ラベルの下までを1マスの列として扱う（フェーズ3と同じ）。 */
const tapTop = 32;
const tapBottom = arrayBarsGeometry.baselineY + arrayBarsGeometry.indexLabelOffsetY + 16;

/**
 * 応用問題の場面キャンバス。場面は共通配列基盤の形で持つため
 * （不在ケース・未整列リストは単元盤面型では表せない）、フェーズ3の
 * BinarySearchCheckCanvas（単元盤面型専用）ではなく、盤面の形に合わせた
 * 本コンポーネントで描く。描画は共通配列基盤に委譲し、回答ボタンは
 * マス（棒の列）に重ねる HTML ボタンとする（フェーズ3と同じ考え方）。
 * 選択肢の設問では questionId を渡さず、ボタンは描かない。
 */
export function BinarySearchConsolidationCanvas({ canvas, label, questionId, cellIds, onAnswer, disabled = false }: {
  canvas: ArrayBarsCanvasState;
  label: string;
  questionId?: string;
  cellIds?: readonly string[];
  onAnswer: (answer: NodeAnswer) => void;
  /** 正解後は選び直せないよう入力を固定する。 */
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: arrayBarsGeometry.width, height: arrayBarsGeometry.height });
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
  const scale = Math.max(0.1, Math.min(size.width / arrayBarsGeometry.width, size.height / arrayBarsGeometry.height));
  const values = canvas.state.values;
  const layout = arrayBarsLayout(values);
  const slotWidth = (arrayBarsGeometry.width - arrayBarsGeometry.marginX * 2) / values.length;
  const tapWidth = Math.max(slotWidth * scale, 44);
  return <Box ref={host} sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ width: arrayBarsGeometry.width * scale, height: arrayBarsGeometry.height * scale, position: "relative", flexShrink: 0 }}>
        <ArrayDrawing canvas={canvas} label={label} />
        {questionId && <Box role="group" aria-label="回答の選択肢" sx={{ position: "absolute", inset: 0 }}>
          {cellIds?.map((id) => {
            const index = Number(id);
            const center = layout.bar(index).centerX;
            return <Box component="button" type="button" key={`${questionId}:${id}`} disabled={disabled}
              aria-label={`左から${index + 1}番目のマス（値 ${values[index]}）を選ぶ`}
              onClick={() => onAnswer({ kind: "node", nodeId: id })}
              sx={{ ...answerCueSx, position: "absolute", display: "block", p: 0, border: 0, borderRadius: 1.5,
                left: center * scale - tapWidth / 2, top: tapTop * scale, width: tapWidth, height: (tapBottom - tapTop) * scale,
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
