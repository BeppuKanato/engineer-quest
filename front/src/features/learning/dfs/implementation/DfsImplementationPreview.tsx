"use client";

import { ImplementationWorkspace } from "../../bfs/implementation/BfsImplementationPreview";
import { runFreeDisplayCase } from "../../bfs/implementation/freeExecution";
import { dfsCode } from "../code-mapping/dfsCode";
import { dfsImplementationContent as content, freeDisplayCase } from "./implementation.content";
import { DfsImplementationResults, VisitOrderOutput } from "./ImplementationResults";

export function DfsImplementationPreview() {
  return <ImplementationWorkspace exercise={{
    label: `DFSの${content.stageName}`,
    content,
    Results: DfsImplementationResults,
    runFreeCode: (code, onPrepared, isCurrent) => runFreeDisplayCase(freeDisplayCase, code, onPrepared, isCurrent),
    hintCode: dfsCode,
    hintRepeatLabel: "スタックが空になるまでくり返し",
    freeReturnedLabel: "戻り値（訪問順）",
    renderFreeReturn: actual => <VisitOrderOutput expected={freeDisplayCase.expected} actual={actual} />,
  }} />;
}
