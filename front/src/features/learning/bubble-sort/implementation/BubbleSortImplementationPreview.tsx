"use client";

import { ImplementationWorkspace, type ImplementationExercise, type ImplementationWorkspaceProps } from "../../implementation/ImplementationWorkspace";
import { BubbleSortTraceDialog } from "../trace/BubbleSortTraceDialog";
import { traceBubbleSortCode } from "../trace/acquireTrace";
import { convertBubbleSortTrace } from "../trace/convertTrace";
import { bubbleSortTraceText } from "../trace/trace.content";
import type { BubbleSortTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runBubbleSortFreeCode } from "./freeExecution";
import { bubbleSortEditorText } from "./editor.content";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { bubbleSortImplementationContent } from "./implementation.content";
import { runImplementationTests } from "./implementation";

const bubbleSortExercise = {
  label: "バブルソートの自分で実装", content: bubbleSortImplementationContent, text: bubbleSortEditorText, traceText: bubbleSortTraceText,
  Results: ImplementationResults, Hints: ImplementationHints, Console: FreeExecutionConsole,
  runTests: runImplementationTests, runFreeCode: runBubbleSortFreeCode,
  visualDebug: { acquire: traceBubbleSortCode, convert: convertBubbleSortTrace, Dialog: BubbleSortTraceDialog },
} satisfies ImplementationExercise<BubbleSortTracePlayback>;

export function BubbleSortImplementationPreview(props: ImplementationWorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={bubbleSortExercise} />;
}
