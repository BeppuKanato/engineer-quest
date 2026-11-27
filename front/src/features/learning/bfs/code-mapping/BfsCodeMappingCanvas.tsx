"use client";

import { CodeMappingStage } from "../../player/CodeMappingStage";
import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { BfsCodeDisplay } from "./BfsCodeDisplay";
import { bfsCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { CodeMappingCanvasState } from "./codeMapping.types";

/**
 * 割り付け・変数パネルは共通土台（CodeMappingStage）が決める。ここは BFS の図・コード・変数行だけを持つ。
 */
export function BfsCodeMappingCanvas({ canvas }: { canvas: CodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = bfsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = bfsCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);
  return (
    <CodeMappingStage label="BFSの図とコードの対応" frameId={canvas.state.executionStepId}
      graph={<BfsExecutionCanvas canvas={execution} />}
      code={<BfsCodeDisplay code={canvas.data.code} activeLineId={activeLineId} />}
      variables={rows} />
  );
}
