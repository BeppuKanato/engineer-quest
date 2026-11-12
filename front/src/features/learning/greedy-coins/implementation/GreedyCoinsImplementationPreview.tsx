"use client";

import { ImplementationWorkspace, type ImplementationExercise, type ImplementationWorkspaceProps } from "../../implementation/ImplementationWorkspace";
import { GreedyCoinsTraceDialog } from "../trace/GreedyCoinsTraceDialog";
import { traceGreedyCoinsCode } from "../trace/acquireTrace";
import { convertGreedyCoinsTrace } from "../trace/convertTrace";
import { greedyCoinsTraceText } from "../trace/trace.content";
import type { GreedyCoinsTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runGreedyCoinsFreeCode } from "./freeExecution";
import { greedyCoinsEditorText } from "./editor.content";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { greedyCoinsImplementationContent } from "./implementation.content";
import { runImplementationTests } from "./implementation";

const greedyCoinsExercise = {
  label: "貪欲法の自分で実装", content: greedyCoinsImplementationContent, text: greedyCoinsEditorText, traceText: greedyCoinsTraceText,
  Results: ImplementationResults, Hints: ImplementationHints, Console: FreeExecutionConsole,
  runTests: runImplementationTests, runFreeCode: runGreedyCoinsFreeCode,
  visualDebug: { acquire: traceGreedyCoinsCode, convert: convertGreedyCoinsTrace, Dialog: GreedyCoinsTraceDialog },
} satisfies ImplementationExercise<GreedyCoinsTracePlayback>;

export function GreedyCoinsImplementationPreview(props: ImplementationWorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={greedyCoinsExercise} />;
}
