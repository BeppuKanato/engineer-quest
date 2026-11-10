"use client";

import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps } from "../../unit/LearningUnitPreview";
import { BfsCheckPreview } from "../check/BfsCheckPreview";
import { BfsCodeCheckPreview } from "../code-check/BfsCodeCheckPreview";
import { BfsCodeMappingPreview } from "../code-mapping/BfsCodeMappingPreview";
import { BfsConsolidationPreview } from "../consolidation/BfsConsolidationPreview";
import { BfsExecutionPreview } from "../execution/BfsExecutionPreview";
import { BfsImplementationPreview } from "../implementation/BfsImplementationPreview";
import { bfsImplementationContent } from "../implementation/implementation.content";
import { BfsMotivationPreview } from "../motivation/BfsMotivationPreview";
import { BfsResultFigure } from "./BfsResultFigure";
import { bfsUnitPhases, bfsUnitTitle } from "./unit.content";

const bfsUnit = {
  title: bfsUnitTitle,
  phases: bfsUnitPhases,
  views: {
    "bfs-motivation": BfsMotivationPreview,
    "bfs-execution": BfsExecutionPreview,
    "bfs-check": BfsCheckPreview,
    "bfs-code-mapping": BfsCodeMappingPreview,
    "bfs-code-check": BfsCodeCheckPreview,
    "bfs-consolidation": BfsConsolidationPreview,
    "bfs-implementation": BfsImplementationPreview,
  },
  resultFigure: <BfsResultFigure />,
  finalResult: bfsImplementationContent.result,
  keepHiddenPlayersRunning: true,
} satisfies LearningUnitDefinition;

export type BfsUnitPreviewProps = LearningUnitPreviewProps;

export function BfsUnitPreview(props: BfsUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={bfsUnit} />;
}
