"use client";

import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps } from "../../unit/LearningUnitPreview";
import { BubbleSortCheckPreview } from "../check/BubbleSortCheckPreview";
import { BubbleSortCodeCheckPreview } from "../code-check/BubbleSortCodeCheckPreview";
import { BubbleSortCodeMappingPreview } from "../code-mapping/BubbleSortCodeMappingPreview";
import { BubbleSortConsolidationPreview } from "../consolidation/BubbleSortConsolidationPreview";
import { BubbleSortExecutionPreview } from "../execution/BubbleSortExecutionPreview";
import { BubbleSortImplementationPreview } from "../implementation/BubbleSortImplementationPreview";
import { bubbleSortImplementationContent } from "../implementation/implementation.content";
import { BubbleSortMotivationPreview } from "../motivation/BubbleSortMotivationPreview";
import { BubbleSortResultFigure } from "./BubbleSortResultFigure";
import { bubbleSortUnitPhases, bubbleSortUnitTitle } from "./unit.content";

const bubbleSortUnit = {
  title: bubbleSortUnitTitle,
  phases: bubbleSortUnitPhases,
  views: {
    "bubble-sort-motivation": BubbleSortMotivationPreview,
    "bubble-sort-execution": BubbleSortExecutionPreview,
    "bubble-sort-check": BubbleSortCheckPreview,
    "bubble-sort-code-mapping": BubbleSortCodeMappingPreview,
    "bubble-sort-code-check": BubbleSortCodeCheckPreview,
    "bubble-sort-consolidation": BubbleSortConsolidationPreview,
    "bubble-sort-implementation": BubbleSortImplementationPreview,
  },
  resultFigure: <BubbleSortResultFigure />,
  finalResult: bubbleSortImplementationContent.result,
  keepHiddenPlayersRunning: true,
} satisfies LearningUnitDefinition;

export type BubbleSortUnitPreviewProps = LearningUnitPreviewProps;

export function BubbleSortUnitPreview(props: BubbleSortUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={bubbleSortUnit} />;
}
