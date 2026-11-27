"use client";

import type { NodeAnswer } from "../../assessment/assessment";
import { NodeAnswerOverlay } from "../../assessment/NodeAnswerOverlay";
import { CheckCanvasStage, NoneAnswerButton } from "../../player/CheckCanvasStage";
import { graphGeometry } from "../../player/graphGeometry";
import { DfsExecutionCanvas, dfsExecutionCanvasHeight } from "../execution/DfsExecutionCanvas";
import type { DfsExecutionCanvasState } from "../execution/execution.types";

/**
 * 図と回答操作の置き方・拡縮は共通土台（CheckCanvasStage）が決める。
 * ここは DFS の図とノードタップ、「どれも入らない」の受け渡しだけを持つ。
 * 論理高さだけは図の構成（グラフ＋スタック＋訪問順）に合わせて実行キャンバス側の値を渡す。
 */
export function DfsCheckCanvas({ canvas, questionId, nodeIds, allowNone = false, onAnswer, disabled = false }: {
  canvas: DfsExecutionCanvasState; questionId?: string; nodeIds?: readonly string[];
  allowNone?: boolean;
  onAnswer: (answer: NodeAnswer) => void; disabled?: boolean;
}) {
  return (
    <CheckCanvasStage logicalWidth={graphGeometry.width} logicalHeight={dfsExecutionCanvasHeight}
      groupLabel={questionId ? "回答の選択肢" : undefined}
      controls={questionId && allowNone
        ? <NoneAnswerButton disabled={disabled} onAnswer={() => onAnswer({ kind: "none" })} />
        : undefined}>
      {({ tapSize }) => (
        <DfsExecutionCanvas canvas={canvas} highlightNodes={!questionId}
          renderNodeOverlay={questionId ? nodeId => nodeIds?.includes(nodeId)
            ? <NodeAnswerOverlay key={questionId} nodeId={nodeId} tapSize={tapSize} disabled={disabled} onAnswer={onAnswer} />
            : null : undefined} />
      )}
    </CheckCanvasStage>
  );
}
