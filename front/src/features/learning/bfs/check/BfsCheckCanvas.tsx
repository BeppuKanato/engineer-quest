"use client";

import TouchAppIcon from "@mui/icons-material/TouchApp";
import { Box, Button } from "@mui/material";

import type { NodeAnswer } from "../../assessment/assessment";
import { answerCueSx, NodeAnswerOverlay } from "../../assessment/NodeAnswerOverlay";
import { CheckCanvasStage } from "../../player/CheckCanvasStage";
import { graphGeometry } from "../../player/graphGeometry";
import { playerTokens } from "../../player/player.tokens";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import type { BfsExecutionCanvasState } from "../execution/execution.types";

/**
 * 「どれも入らない」を置く帯の論理高さ。帯は図の一部（グラフとキューの間）として
 * 論理座標に含め、拡縮は共通土台（CheckCanvasStage）の1式だけで決める。
 * 以前は帯を画面 px で確保し、キャンバス側でも割り算していたため、拡縮の計算が単元ごとにずれていた。
 */
const ACTION_BAND_HEIGHT = 88;

/**
 * 図と回答操作の置き方・拡縮は共通土台（CheckCanvasStage）が決める。
 * ここは BFS の図とノードタップ、図の中（グラフとキューの間）に置く「どれも入らない」だけを持つ。
 * ボタンの大きさは図の拡縮に引きずられないよう、倍率で割って画面 px 相当を保つ。
 */
export function BfsCheckCanvas({ canvas, questionId, nodeIds, allowNone = false, onAnswer, disabled = false }: {
  canvas: BfsExecutionCanvasState;
  questionId?: string;
  nodeIds?: readonly string[];
  allowNone?: boolean;
  onAnswer: (answer: NodeAnswer) => void;
  /** 正解後は選び直せないよう入力を固定する。 */
  disabled?: boolean;
}) {
  return (
    <CheckCanvasStage logicalWidth={graphGeometry.width} logicalHeight={graphGeometry.height + ACTION_BAND_HEIGHT}
      groupLabel={questionId ? "回答の選択肢" : undefined}>
      {({ scale, tapSize }) => (
        <BfsExecutionCanvas canvas={canvas} highlightNodes={!questionId}
          graphAction={{ height: ACTION_BAND_HEIGHT, content: (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {questionId && allowNone && (
                <Button key={questionId} type="button" disabled={disabled} startIcon={<TouchAppIcon sx={{ fontSize: `${22 / scale}px !important` }} />}
                  onClick={() => onAnswer({ kind: "none" })}
                  sx={{ ...answerCueSx, minHeight: 48 / scale, px: `${24 / scale}px`, borderRadius: 999, bgcolor: playerTokens.layers.layer0,
                    color: playerTokens.text, fontSize: Math.min(20, Math.max(16, graphGeometry.width * scale * 0.015)) / scale, fontWeight: 700,
                    "&::before": { ...answerCueSx["&::before"], inset: 0 },
                    "& .MuiButton-startIcon": { color: playerTokens.focus, mr: `${8 / scale}px`, ml: 0 },
                    "&:hover": { bgcolor: playerTokens.layers.layer1 },
                  }}>どれも入らない</Button>
              )}
            </Box>
          ) }}
          renderNodeOverlay={questionId ? (nodeId) => {
            if (!nodeIds?.includes(nodeId)) return null;
            return <NodeAnswerOverlay key={questionId} nodeId={nodeId} tapSize={tapSize} disabled={disabled} onAnswer={onAnswer} />;
          } : undefined} />
      )}
    </CheckCanvasStage>
  );
}
