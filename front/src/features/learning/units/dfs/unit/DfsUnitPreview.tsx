"use client";

import { Box, Typography } from "@mui/material";
import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps, type UnitPhaseView } from "../../../unit/LearningUnitPreview";
import { DfsCheckPreview } from "../check/DfsCheckPreview";
import { DfsCodeCheckPreview } from "../code-check/DfsCodeCheckPreview";
import { DfsCodeMappingPreview } from "../code-mapping/DfsCodeMappingPreview";
import { DfsConsolidationPreview } from "../consolidation/DfsConsolidationPreview";
import { DfsExecutionCanvas } from "../execution/DfsExecutionCanvas";
import { DfsExecutionPreview } from "../execution/DfsExecutionPreview";
import { dfsExecutionContent } from "../execution/execution.content";
import { DfsImplementationPreview } from "../implementation/DfsImplementationPreview";
import { dfsImplementationContent } from "../implementation/implementation.content";
import { DfsMotivationPreview } from "../motivation/DfsMotivationPreview";
import { dfsUnitPhases, dfsUnitTitle } from "./unit.content";

const finalExample = dfsExecutionContent.steps.at(-1)!.canvas;

function DfsResultFigure() {
  return <Box component="figure" data-dfs-result-figure sx={{ m: 0, width: "min(100%, 520px)" }}>
    <Box sx={{ height: 320 }}><DfsExecutionCanvas canvas={finalExample} /></Box>
    <Typography component="figcaption" sx={{ textAlign: "center", fontSize: 16 }}>基本例の訪問順</Typography>
  </Box>;
}

const dfsUnit = {
  title: dfsUnitTitle,
  phases: dfsUnitPhases,
  views: {
    "dfs-motivation": DfsMotivationPreview,
    "dfs-execution": DfsExecutionPreview,
    "dfs-check": DfsCheckPreview,
    "dfs-code-mapping": DfsCodeMappingPreview,
    "dfs-code-check": DfsCodeCheckPreview,
    "dfs-consolidation": DfsConsolidationPreview,
    "dfs-implementation": DfsImplementationPreview,
  } satisfies Record<(typeof dfsUnitPhases)[number]["id"], UnitPhaseView>,
  resultFigure: <DfsResultFigure />,
  firstAttemptResult: true,
  finalResult: dfsImplementationContent.result,
} satisfies LearningUnitDefinition;

export function DfsUnitPreview(props: LearningUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={dfsUnit} />;
}
