"use client";

import { ImplementationWorkspace, type ImplementationExercise, type ImplementationWorkspaceProps } from "../../../implementation/ImplementationWorkspace";
import { MazeDiggingTraceDialog } from "../trace/MazeDiggingTraceDialog";
import { traceMazeDiggingCode } from "../trace/acquireTrace";
import { convertMazeDiggingTrace } from "../trace/convertTrace";
import { mazeDiggingTraceText } from "../trace/trace.content";
import type { MazeDiggingTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runMazeDiggingFreeCode } from "./freeExecution";
import { mazeDiggingEditorText } from "./editor.content";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { mazeDiggingImplementationContent } from "./implementation.content";
import { runImplementationTests } from "./implementation";

const mazeDiggingExercise = {
  label: "穴掘り法の自分で実装", content: mazeDiggingImplementationContent, text: mazeDiggingEditorText, traceText: mazeDiggingTraceText,
  Results: ImplementationResults, Hints: ImplementationHints, Console: FreeExecutionConsole,
  runTests: runImplementationTests, runFreeCode: runMazeDiggingFreeCode,
  visualDebug: { acquire: traceMazeDiggingCode, convert: convertMazeDiggingTrace, Dialog: MazeDiggingTraceDialog },
} satisfies ImplementationExercise<MazeDiggingTracePlayback>;

export function MazeDiggingImplementationPreview(props: ImplementationWorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={mazeDiggingExercise} />;
}
