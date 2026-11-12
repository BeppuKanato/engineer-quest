"use client";

import { ImplementationWorkspace, type ImplementationWorkspaceProps } from "../../implementation/ImplementationWorkspace";
import { runFreeDisplayCase } from "../../implementation/freeExecution";
import { ImplementationHints } from "../../units/bfs/implementation/ImplementationHints";
import { FreeExecutionConsole } from "../../units/bfs/implementation/FreeExecutionConsole";
import { bfsEditorText } from "../../units/bfs/implementation/editor.content";
import { bfsTraceText } from "../../units/bfs/trace/trace.content";
import { runImplementationTests } from "../../units/bfs/implementation/implementation";
import type { WorkspaceHintProps, WorkspaceConsoleProps } from "../../implementation/ImplementationWorkspace";
import { dfsCode } from "../code-mapping/dfsCode";
import { traceDfsCode } from "../trace/acquireTrace";
import { convertDfsTrace } from "../trace/convertTrace";
import { DfsTraceDialog } from "../trace/DfsTraceDialog";
import { dfsImplementationContent as content, freeDisplayCase } from "./implementation.content";
import { DfsImplementationResults, VisitOrderOutput } from "./ImplementationResults";

function DfsHints(props: WorkspaceHintProps) {
  return <ImplementationHints {...props} hints={content.hints} code={dfsCode} repeatLabel="スタックが空になるまでくり返し" />;
}
function DfsConsole(props: WorkspaceConsoleProps) {
  return <FreeExecutionConsole {...props} returnedLabel="戻り値（訪問順）" renderReturn={actual => <VisitOrderOutput expected={freeDisplayCase.expected} actual={actual} />} />;
}

export function DfsImplementationPreview(props: ImplementationWorkspaceProps = {}) {
  return <ImplementationWorkspace {...props} exercise={{
    label: `DFSの${content.stageName}`,
    content, text: bfsEditorText, traceText: bfsTraceText, Hints: DfsHints, Console: DfsConsole, runTests: runImplementationTests,
    Results: DfsImplementationResults,
    runFreeCode: (code, onPrepared, isCurrent) => runFreeDisplayCase(freeDisplayCase, code, onPrepared, isCurrent),
    visualDebug: { acquire: traceDfsCode, convert: convertDfsTrace, Dialog: DfsTraceDialog },
  }} />;
}
