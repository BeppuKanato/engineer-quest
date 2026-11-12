"use client";

import { ImplementationWorkspace, type ImplementationExercise, type ImplementationWorkspaceProps } from "../../../implementation/ImplementationWorkspace";
import { BfsTraceDialog } from "../trace/BfsTraceDialog";
import { traceBfsCode } from "../trace/acquireTrace";
import { convertBfsTrace } from "../trace/convertTrace";
import { bfsTraceText } from "../trace/trace.content";
import type { BfsTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runBfsFreeCode } from "./freeExecution";
import { bfsEditorText } from "./editor.content";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { bfsImplementationContent } from "./implementation.content";
import { runImplementationTests } from "./implementation";

const bfsExercise = {
  label: "BFSの自分で実装", content: bfsImplementationContent, text: bfsEditorText, traceText: bfsTraceText,
  Results: ImplementationResults, Hints: ImplementationHints, Console: FreeExecutionConsole,
  runTests: runImplementationTests, runFreeCode: runBfsFreeCode,
  visualDebug: { acquire: traceBfsCode, convert: convertBfsTrace, Dialog: BfsTraceDialog },
} satisfies ImplementationExercise<BfsTracePlayback>;

export function BfsImplementationPreview(props: ImplementationWorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={bfsExercise} />;
}
