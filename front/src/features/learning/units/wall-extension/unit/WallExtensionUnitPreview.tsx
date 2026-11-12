"use client";

import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps } from "../../../unit/LearningUnitPreview";
import { WallExtensionCheckPreview } from "../check/WallExtensionCheckPreview";
import { WallExtensionCodeCheckPreview } from "../code-check/WallExtensionCodeCheckPreview";
import { WallExtensionCodeMappingPreview } from "../code-mapping/WallExtensionCodeMappingPreview";
import { WallExtensionConsolidationPreview } from "../consolidation/WallExtensionConsolidationPreview";
import { WallExtensionExecutionPreview } from "../execution/WallExtensionExecutionPreview";
import { WallExtensionImplementationPreview } from "../implementation/WallExtensionImplementationPreview";
import { wallExtensionImplementationContent } from "../implementation/implementation.content";
import { WallExtensionMotivationPreview } from "../motivation/WallExtensionMotivationPreview";
import { WallExtensionResultFigure } from "./WallExtensionResultFigure";
import { wallExtensionUnitPhases, wallExtensionUnitTitle } from "./unit.content";

const wallExtensionUnit = {
  title: wallExtensionUnitTitle,
  phases: wallExtensionUnitPhases,
  views: {
    "wall-extension-motivation": WallExtensionMotivationPreview,
    "wall-extension-execution": WallExtensionExecutionPreview,
    "wall-extension-check": WallExtensionCheckPreview,
    "wall-extension-code-mapping": WallExtensionCodeMappingPreview,
    "wall-extension-code-check": WallExtensionCodeCheckPreview,
    "wall-extension-consolidation": WallExtensionConsolidationPreview,
    "wall-extension-implementation": WallExtensionImplementationPreview,
  },
  resultFigure: <WallExtensionResultFigure />,
  finalResult: wallExtensionImplementationContent.result,
  keepHiddenPlayersRunning: true,
} satisfies LearningUnitDefinition;

export type WallExtensionUnitPreviewProps = LearningUnitPreviewProps;

export function WallExtensionUnitPreview(props: WallExtensionUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={wallExtensionUnit} />;
}
