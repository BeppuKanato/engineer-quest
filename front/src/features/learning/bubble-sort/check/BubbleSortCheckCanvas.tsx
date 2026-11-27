"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box } from "@mui/material";

import type { NodeAnswer } from "../../assessment/assessment";
import { answerCueSx } from "../../assessment/NodeAnswerOverlay";
import { ArrayDrawing } from "../../player/ArrayDrawing";
import { arrayBarsGeometry, arrayBarsLayout } from "../../player/arrayBarsGeometry";
import type { ArrayBarsCanvasState } from "../../player/arrayBars.types";
import { CheckCanvasStage } from "../../player/CheckCanvasStage";
import { playerTokens } from "../../player/player.tokens";

/** 回答ボタンの縦の範囲。値のラベルより上から、位置ラベルの下までを1マスの列として扱う。 */
const tapTop = 32;
const tapBottom = arrayBarsGeometry.baselineY + arrayBarsGeometry.indexLabelOffsetY + 16;

/**
 * 配列と回答操作を同じキャンバスへまとめる。置き方・拡縮は共通土台（CheckCanvasStage）が決め、
 * 描画は共通配列基盤に委譲し、回答ボタンはマス（棒の列）に重ねる HTML ボタンとする
 * （図の座標・状態色は変えない）。
 * タップ領域は棒の列そのもの。ただし画面上で 44px 未満になる場合は
 * 棒倒し法フェーズ3と同じ考え方で中心から広げ、最低限の幅を保つ。
 */
export function BubbleSortCheckCanvas({ canvas, questionId, cellIds, onAnswer, disabled = false }: {
  canvas: ArrayBarsCanvasState;
  questionId?: string;
  cellIds?: readonly string[];
  onAnswer: (answer: NodeAnswer) => void;
  /** 正解後は選び直せないよう入力を固定する。 */
  disabled?: boolean;
}) {
  const values = canvas.state.values;
  return (
    <CheckCanvasStage logicalWidth={arrayBarsGeometry.width} logicalHeight={arrayBarsGeometry.height}>
      {({ scale }) => {
        const layout = arrayBarsLayout(values);
        const slotWidth = (arrayBarsGeometry.width - arrayBarsGeometry.marginX * 2) / values.length;
        const tapWidth = Math.max(slotWidth * scale, 44);
        return (
          <>
            <ArrayDrawing canvas={canvas} label="バブルソートの並び替えの途中経過" />
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
          </>
        );
      }}
    </CheckCanvasStage>
  );
}
