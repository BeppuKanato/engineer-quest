"use client";

import { CodeDisplay } from "../../code/CodeDisplay";
import { CodeMappingStage } from "../../player/CodeMappingStage";
import { WallExtensionExecutionCanvas } from "../execution/WallExtensionExecutionCanvas";
import { wallExtensionCodeMappingContent } from "./codeMapping.content";
import { codeVariableRows } from "./codeMapping.presentation";
import type { WallExtensionCodeMappingCanvasState } from "./codeMapping.types";

/**
 * 割り付け・変数パネルは共通土台（CodeMappingStage）が決める。ここは棒倒し法の図・コード・変数行だけを持つ。
 */
export function WallExtensionCodeMappingCanvas({ canvas }: { canvas: WallExtensionCodeMappingCanvasState }) {
  const { execution, variables } = canvas.state;
  const activeLineId = canvas.highlights[0].id;
  // 再描画やシークの経路に依存させず、そのステップの直前フレームとの差分を示す。
  const frameIndex = wallExtensionCodeMappingContent.steps.findIndex(step => step.canvas === canvas);
  const previous = wallExtensionCodeMappingContent.steps[frameIndex - 1]?.canvas.state.variables;
  const rows = codeVariableRows(variables, previous);
  return (
    <CodeMappingStage label="棒倒し法の図とコードの対応" frameId={canvas.state.executionStepId}
      graph={<WallExtensionExecutionCanvas canvas={execution} />}
      code={<CodeDisplay code={canvas.data.code} label="generate_mazeのコード" activeLineId={activeLineId} lineHeight={1.6} />}
      variables={rows} />
  );
}
