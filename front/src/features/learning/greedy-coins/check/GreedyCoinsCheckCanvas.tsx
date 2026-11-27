"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box } from "@mui/material";

import type { NodeAnswer } from "../../assessment/assessment";
import { answerCueSx } from "../../assessment/NodeAnswerOverlay";
import { CheckCanvasStage } from "../../player/CheckCanvasStage";
import { playerTokens } from "../../player/player.tokens";
import { GreedyCoinsExecutionCanvas } from "../execution/GreedyCoinsExecutionCanvas";
import type { GreedyCoinsExecutionCanvasState } from "../execution/execution.types";
import { greedyCoinsGeometry, greedyCoinsLayout } from "../figure/greedyCoinsGeometry";

/**
 * 盤面と回答操作を同じキャンバスへまとめる。置き方・拡縮は共通土台（CheckCanvasStage）が決め、
 * 描画はフェーズ2と同じ GreedyCoinsExecutionCanvas（硬貨図への委譲）に任せ、回答ボタンは
 * 額面チップに重ねる HTML ボタンとする（図の座標・状態色は変えない）。
 * タップ領域は額面チップの強調リングの円。ただし画面上で 44px 未満に
 * なる場合は中心から広げ、最低限の大きさを保つ。
 * 選択肢の設問（Q2）では questionId を渡さず、ボタンは描かない。
 */
export function GreedyCoinsCheckCanvas({ canvas, questionId, cellIds, onAnswer, disabled = false }: {
  canvas: GreedyCoinsExecutionCanvasState;
  questionId?: string;
  cellIds?: readonly string[];
  onAnswer: (answer: NodeAnswer) => void;
  /** 正解後は選び直せないよう入力を固定する。 */
  disabled?: boolean;
}) {
  const coins = canvas.state.coins;
  return (
    <CheckCanvasStage logicalWidth={greedyCoinsGeometry.width} logicalHeight={greedyCoinsGeometry.height}>
      {({ scale }) => {
        const layout = greedyCoinsLayout(coins.length);
        const tapSize = Math.max(greedyCoinsGeometry.ringRadius * 2 * scale, 44);
        return (
          <>
            <GreedyCoinsExecutionCanvas canvas={canvas} />
            {questionId && <Box role="group" aria-label="回答の選択肢" sx={{ position: "absolute", inset: 0 }}>
              {cellIds?.map((id) => {
                const index = coins.indexOf(Number(id));
                const center = layout.coinCenter(index);
                return <Box component="button" type="button" key={`${questionId}:${id}`} disabled={disabled}
                  aria-label={`${id}円の硬貨を選ぶ`}
                  onClick={() => onAnswer({ kind: "node", nodeId: id })}
                  sx={{ ...answerCueSx, position: "absolute", display: "block", p: 0, border: 0, borderRadius: "50%",
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
          </>
        );
      }}
    </CheckCanvasStage>
  );
}
