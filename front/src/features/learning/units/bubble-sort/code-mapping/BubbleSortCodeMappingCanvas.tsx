"use client";

import { CodeMappingLayout } from "../../../components/code/CodeMappingLayout";
import { CodeVariableList } from "../../../components/code/CodeVariableList";


import { CodeDisplay } from "../../../code/CodeDisplay";
import { BubbleSortExecutionCanvas } from "../execution/BubbleSortExecutionCanvas";
import { bubbleSortCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { BubbleSortCodeMappingCanvasState } from "./codeMapping.types";

export function BubbleSortCodeMappingCanvas({ canvas }: { canvas: BubbleSortCodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = bubbleSortCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = bubbleSortCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);

  return <CodeMappingLayout label="バブルソートの図とコードの対応" frameId={canvas.state.executionStepId}
    graph={<BubbleSortExecutionCanvas canvas={execution} />}
    code={<CodeDisplay code={canvas.data.code} label="bubble_sortのコード" activeLineId={activeLineId} lineHeight={1.6} />}
    variables={<CodeVariableList rows={rows} />} />;
}
