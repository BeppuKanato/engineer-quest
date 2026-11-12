"use client";

import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps } from "../../unit/LearningUnitPreview";
import { BinarySearchCheckPreview } from "../check/BinarySearchCheckPreview";
import { BinarySearchCodeCheckPreview } from "../code-check/BinarySearchCodeCheckPreview";
import { BinarySearchCodeMappingPreview } from "../code-mapping/BinarySearchCodeMappingPreview";
import { BinarySearchConsolidationPreview } from "../consolidation/BinarySearchConsolidationPreview";
import { BinarySearchExecutionPreview } from "../execution/BinarySearchExecutionPreview";
import { BinarySearchImplementationPreview } from "../implementation/BinarySearchImplementationPreview";
import { binarySearchImplementationContent } from "../implementation/implementation.content";
import { BinarySearchMotivationPreview } from "../motivation/BinarySearchMotivationPreview";
import { BinarySearchResultFigure } from "./BinarySearchResultFigure";
import { binarySearchUnitPhases, binarySearchUnitTitle } from "./unit.content";

const binarySearchUnit = {
  title: binarySearchUnitTitle,
  phases: binarySearchUnitPhases,
  views: {
    "binary-search-motivation": BinarySearchMotivationPreview,
    "binary-search-execution": BinarySearchExecutionPreview,
    "binary-search-check": BinarySearchCheckPreview,
    "binary-search-code-mapping": BinarySearchCodeMappingPreview,
    "binary-search-code-check": BinarySearchCodeCheckPreview,
    "binary-search-consolidation": BinarySearchConsolidationPreview,
    "binary-search-implementation": BinarySearchImplementationPreview,
  },
  resultFigure: <BinarySearchResultFigure />,
  finalResult: binarySearchImplementationContent.result,
  keepHiddenPlayersRunning: true,
} satisfies LearningUnitDefinition;

export type BinarySearchUnitPreviewProps = LearningUnitPreviewProps;

export function BinarySearchUnitPreview(props: BinarySearchUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={binarySearchUnit} />;
}
