"use client";

import { CodeMappingLayout } from "../../components/code/CodeMappingLayout";
import { CodeVariableList } from "../../components/code/CodeVariableList";


import { BfsExecutionCanvas } from "../execution/BfsExecutionCanvas";
import { BfsCodeDisplay } from "./BfsCodeDisplay";
import { bfsCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { CodeMappingCanvasState } from "./codeMapping.types";

export function BfsCodeMappingCanvas({ canvas }: { canvas: CodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = bfsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = bfsCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);

  return <CodeMappingLayout label="BFSの図とコードの対応" frameId={canvas.state.executionStepId}
    graph={<BfsExecutionCanvas canvas={execution} />}
    code={<BfsCodeDisplay code={canvas.data.code} activeLineId={activeLineId} />}
    variables={<CodeVariableList rows={rows} density="comfortable" />} />;
}
