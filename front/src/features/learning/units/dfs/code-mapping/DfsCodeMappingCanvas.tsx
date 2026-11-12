"use client";

import { CodeMappingLayout } from "../../../components/code/CodeMappingLayout";
import { CodeVariableList } from "../../../components/code/CodeVariableList";

import { CodeDisplay } from "../../../code/CodeDisplay";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import { dfsCodeMappingContent } from "./codeMapping.content";
import { codeExecutionView, codeVariableRows } from "./codeMapping.presentation";
import type { DfsCodeMappingCanvasState } from "./codeMapping.types";

export function DfsCodeMappingCanvas({ canvas }: { canvas: DfsCodeMappingCanvasState }) {
  const index = dfsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const rows = codeVariableRows(canvas.state.variables, dfsCodeMappingContent.steps[index - 1]?.canvas.state.variables);
  return <CodeMappingLayout label="DFSの図とコードの対応" frameId={canvas.state.executionStepId} codeFraction={0.52} widthOnly containedWidth
    graph={<DfsExecutionCanvas canvas={canvas.state.execution} view={codeExecutionView(canvas)} />}
    code={<CodeDisplay code={canvas.data.code} label="dfs_orderのコード" activeLineId={canvas.highlights[0].id} lineHeight={1.65} />}
    variables={<CodeVariableList rows={rows} />} />;
}
