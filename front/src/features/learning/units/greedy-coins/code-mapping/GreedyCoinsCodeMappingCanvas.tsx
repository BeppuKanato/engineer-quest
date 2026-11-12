"use client";

import { CodeMappingLayout } from "../../../components/code/CodeMappingLayout";
import { CodeVariableList } from "../../../components/code/CodeVariableList";


import { CodeDisplay } from "../../../code/CodeDisplay";
import { GreedyCoinsExecutionCanvas } from "../execution/GreedyCoinsExecutionCanvas";
import { greedyCoinsCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { GreedyCoinsCodeMappingCanvasState } from "./codeMapping.types";

export function GreedyCoinsCodeMappingCanvas({ canvas }: { canvas: GreedyCoinsCodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = greedyCoinsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = greedyCoinsCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);

  return <CodeMappingLayout label="貪欲法の図とコードの対応" frameId={canvas.state.executionStepId}
    graph={<GreedyCoinsExecutionCanvas canvas={execution} />}
    code={<CodeDisplay code={canvas.data.code} label="greedy_coinsのコード" activeLineId={activeLineId} lineHeight={1.6} />}
    variables={<CodeVariableList rows={rows} />} />;
}
