"use client";

import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps } from "../../../unit/LearningUnitPreview";
import { GreedyCoinsCheckPreview } from "../check/GreedyCoinsCheckPreview";
import { GreedyCoinsCodeCheckPreview } from "../code-check/GreedyCoinsCodeCheckPreview";
import { GreedyCoinsCodeMappingPreview } from "../code-mapping/GreedyCoinsCodeMappingPreview";
import { GreedyCoinsConsolidationPreview } from "../consolidation/GreedyCoinsConsolidationPreview";
import { GreedyCoinsExecutionPreview } from "../execution/GreedyCoinsExecutionPreview";
import { GreedyCoinsImplementationPreview } from "../implementation/GreedyCoinsImplementationPreview";
import { greedyCoinsImplementationContent } from "../implementation/implementation.content";
import { GreedyCoinsMotivationPreview } from "../motivation/GreedyCoinsMotivationPreview";
import { GreedyCoinsResultFigure } from "./GreedyCoinsResultFigure";
import { greedyCoinsUnitPhases, greedyCoinsUnitTitle } from "./unit.content";

const greedyCoinsUnit = {
  title: greedyCoinsUnitTitle,
  phases: greedyCoinsUnitPhases,
  views: {
    "greedy-coins-motivation": GreedyCoinsMotivationPreview,
    "greedy-coins-execution": GreedyCoinsExecutionPreview,
    "greedy-coins-check": GreedyCoinsCheckPreview,
    "greedy-coins-code-mapping": GreedyCoinsCodeMappingPreview,
    "greedy-coins-code-check": GreedyCoinsCodeCheckPreview,
    "greedy-coins-consolidation": GreedyCoinsConsolidationPreview,
    "greedy-coins-implementation": GreedyCoinsImplementationPreview,
  },
  resultFigure: <GreedyCoinsResultFigure />,
  finalResult: greedyCoinsImplementationContent.result,
  keepHiddenPlayersRunning: true,
} satisfies LearningUnitDefinition;

export type GreedyCoinsUnitPreviewProps = LearningUnitPreviewProps;

export function GreedyCoinsUnitPreview(props: GreedyCoinsUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={greedyCoinsUnit} />;
}
