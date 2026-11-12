"use client";

import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps } from "../../unit/LearningUnitPreview";
import { MazeDiggingCheckPreview } from "../check/MazeDiggingCheckPreview";
import { MazeDiggingCodeCheckPreview } from "../code-check/MazeDiggingCodeCheckPreview";
import { MazeDiggingCodeMappingPreview } from "../code-mapping/MazeDiggingCodeMappingPreview";
import { MazeDiggingConsolidationPreview } from "../consolidation/MazeDiggingConsolidationPreview";
import { MazeDiggingExecutionPreview } from "../execution/MazeDiggingExecutionPreview";
import { MazeDiggingImplementationPreview } from "../implementation/MazeDiggingImplementationPreview";
import { mazeDiggingImplementationContent } from "../implementation/implementation.content";
import { MazeDiggingMotivationPreview } from "../motivation/MazeDiggingMotivationPreview";
import { MazeDiggingResultFigure } from "./MazeDiggingResultFigure";
import { mazeDiggingUnitPhases, mazeDiggingUnitTitle } from "./unit.content";

const mazeDiggingUnit = {
  title: mazeDiggingUnitTitle,
  phases: mazeDiggingUnitPhases,
  views: {
    "maze-digging-motivation": MazeDiggingMotivationPreview,
    "maze-digging-execution": MazeDiggingExecutionPreview,
    "maze-digging-check": MazeDiggingCheckPreview,
    "maze-digging-code-mapping": MazeDiggingCodeMappingPreview,
    "maze-digging-code-check": MazeDiggingCodeCheckPreview,
    "maze-digging-consolidation": MazeDiggingConsolidationPreview,
    "maze-digging-implementation": MazeDiggingImplementationPreview,
  },
  resultFigure: <MazeDiggingResultFigure />,
  finalResult: mazeDiggingImplementationContent.result,
  keepHiddenPlayersRunning: true,
} satisfies LearningUnitDefinition;

export type MazeDiggingUnitPreviewProps = LearningUnitPreviewProps;

export function MazeDiggingUnitPreview(props: MazeDiggingUnitPreviewProps = {}) {
  return <LearningUnitPreview {...props} unit={mazeDiggingUnit} />;
}
