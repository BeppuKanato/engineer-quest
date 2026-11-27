"use client";

import { CodeDisplay } from "../../code/CodeDisplay";
import { CodeMappingStage } from "../../player/CodeMappingStage";
import { BinarySearchExecutionCanvas } from "../execution/BinarySearchExecutionCanvas";
import { binarySearchCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { BinarySearchCodeMappingCanvasState } from "./codeMapping.types";

/**
 * 割り付け・変数パネルは共通土台（CodeMappingStage）が決める。ここは二分探索の図・コード・変数行だけを持つ。
 */
export function BinarySearchCodeMappingCanvas({ canvas }: { canvas: BinarySearchCodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = binarySearchCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = binarySearchCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, execution.state.values, previous);
  return (
    <CodeMappingStage label="二分探索の図とコードの対応" frameId={canvas.state.executionStepId}
      graph={<BinarySearchExecutionCanvas canvas={execution} />}
      code={<CodeDisplay code={canvas.data.code} label="binary_searchのコード" activeLineId={activeLineId} lineHeight={1.6} />}
      variables={rows} />
  );
}
