"use client";

import { ImplementationWorkspace, type ImplementationExercise, type ImplementationWorkspaceProps } from "../../implementation/ImplementationWorkspace";
import { BinarySearchTraceDialog } from "../trace/BinarySearchTraceDialog";
import { traceBinarySearchCode } from "../trace/acquireTrace";
import { convertBinarySearchTrace } from "../trace/convertTrace";
import { binarySearchTraceText } from "../trace/trace.content";
import type { BinarySearchTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runBinarySearchFreeCode } from "./freeExecution";
import { binarySearchEditorText } from "./editor.content";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { binarySearchImplementationContent } from "./implementation.content";
import { runImplementationTests } from "./implementation";

const binarySearchExercise = {
  label: "二分探索の自分で実装", content: binarySearchImplementationContent, text: binarySearchEditorText, traceText: binarySearchTraceText,
  Results: ImplementationResults, Hints: ImplementationHints, Console: FreeExecutionConsole,
  runTests: runImplementationTests, runFreeCode: runBinarySearchFreeCode,
  visualDebug: { acquire: traceBinarySearchCode, convert: convertBinarySearchTrace, Dialog: BinarySearchTraceDialog },
} satisfies ImplementationExercise<BinarySearchTracePlayback>;

export function BinarySearchImplementationPreview(props: ImplementationWorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={binarySearchExercise} />;
}
