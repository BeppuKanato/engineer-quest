"use client";

import { CodeMappingLayout } from "../../../components/code/CodeMappingLayout";
import { CodeVariableList } from "../../../components/code/CodeVariableList";


import { CodeDisplay } from "../../../code/CodeDisplay";
import { MazeDiggingExecutionCanvas } from "../execution/MazeDiggingExecutionCanvas";
import { mazeDiggingCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { MazeDiggingCodeMappingCanvasState } from "./codeMapping.types";

export function MazeDiggingCodeMappingCanvas({ canvas }: { canvas: MazeDiggingCodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = mazeDiggingCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = mazeDiggingCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);

  return <CodeMappingLayout label="穴掘り法の図とコードの対応" frameId={canvas.state.executionStepId}
    graph={<MazeDiggingExecutionCanvas canvas={execution} />}
    code={<CodeDisplay code={canvas.data.code} label="dig_mazeのコード" activeLineId={activeLineId} lineHeight={1.6} />}
    variables={<CodeVariableList rows={rows} />} />;
}
