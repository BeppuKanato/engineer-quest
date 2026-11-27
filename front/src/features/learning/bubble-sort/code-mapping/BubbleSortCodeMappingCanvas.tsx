"use client";

import { CodeDisplay } from "../../code/CodeDisplay";
import { CodeMappingStage } from "../../player/CodeMappingStage";
import { BubbleSortExecutionCanvas } from "../execution/BubbleSortExecutionCanvas";
import { bubbleSortCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { BubbleSortCodeMappingCanvasState } from "./codeMapping.types";

/**
 * 割り付け・変数パネルは共通土台（CodeMappingStage）が決める。ここはバブルソートの図・コード・変数行だけを持つ。
 */
export function BubbleSortCodeMappingCanvas({ canvas }: { canvas: BubbleSortCodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = bubbleSortCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = bubbleSortCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);
  return (
    <CodeMappingStage label="バブルソートの図とコードの対応" frameId={canvas.state.executionStepId}
      graph={<BubbleSortExecutionCanvas canvas={execution} />}
      code={<CodeDisplay code={canvas.data.code} label="bubble_sortのコード" activeLineId={activeLineId} lineHeight={1.6} />}
      variables={rows} />
  );
}
