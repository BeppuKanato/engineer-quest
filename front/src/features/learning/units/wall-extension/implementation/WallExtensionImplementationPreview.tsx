"use client";

import { ImplementationWorkspace, type ImplementationExercise, type ImplementationWorkspaceProps } from "../../../implementation/ImplementationWorkspace";
import { WallExtensionTraceDialog } from "../trace/WallExtensionTraceDialog";
import { traceWallExtensionCode } from "../trace/acquireTrace";
import { convertWallExtensionTrace } from "../trace/convertTrace";
import { wallExtensionTraceText } from "../trace/trace.content";
import type { WallExtensionTracePlayback } from "../trace/trace.types";
import { FreeExecutionConsole } from "./FreeExecutionConsole";
import { runWallExtensionFreeCode } from "./freeExecution";
import { wallExtensionEditorText } from "./editor.content";
import { ImplementationHints } from "./ImplementationHints";
import { ImplementationResults } from "./ImplementationResults";
import { wallExtensionImplementationContent } from "./implementation.content";
import { runImplementationTests } from "./implementation";

const wallExtensionExercise = {
  label: "棒倒し法の自分で実装", content: wallExtensionImplementationContent, text: wallExtensionEditorText, traceText: wallExtensionTraceText,
  Results: ImplementationResults, Hints: ImplementationHints, Console: FreeExecutionConsole,
  runTests: runImplementationTests, runFreeCode: runWallExtensionFreeCode,
  visualDebug: { acquire: traceWallExtensionCode, convert: convertWallExtensionTrace, Dialog: WallExtensionTraceDialog },
} satisfies ImplementationExercise<WallExtensionTracePlayback>;

export function WallExtensionImplementationPreview(props: ImplementationWorkspaceProps) {
  return <ImplementationWorkspace {...props} exercise={wallExtensionExercise} />;
}
