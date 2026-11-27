"use client";

import { CodeDisplay } from "../../code/CodeDisplay";
import { CodeMappingStage } from "../../player/CodeMappingStage";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import { dfsCodeMappingContent } from "./codeMapping.content";
import { codeExecutionView, codeVariableRows } from "./codeMapping.presentation";
import type { DfsCodeMappingCanvasState } from "./codeMapping.types";

/**
 * 割り付け・変数パネルは共通土台（CodeMappingStage）が決める。ここは DFS の図・コード・変数行だけを持つ。
 * 以前はコード幅が他単元と違う 52% で、宿主の高さも測っていなかった。
 */
export function DfsCodeMappingCanvas({ canvas }: { canvas: DfsCodeMappingCanvasState }) {
  const index = dfsCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const rows = codeVariableRows(canvas.state.variables, dfsCodeMappingContent.steps[index - 1]?.canvas.state.variables);
  return (
    <CodeMappingStage label="DFSの図とコードの対応" frameId={canvas.state.executionStepId}
      graph={<DfsExecutionCanvas canvas={canvas.state.execution} view={codeExecutionView(canvas)} />}
      code={<CodeDisplay code={canvas.data.code} label="dfs_orderのコード" activeLineId={canvas.highlights[0].id} lineHeight={1.65} />}
      variables={rows} />
  );
}
