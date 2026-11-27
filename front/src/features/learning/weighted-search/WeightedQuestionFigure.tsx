import { Box, Typography } from "@mui/material";
import type { AssessmentAnswer, AssessmentContent, ParsonsQuestion } from "../assessment/assessment";
import { ParsonsBoard } from "../bfs/consolidation/ParsonsBoard";
import { parsonsMovableSegments } from "../bfs/consolidation/parsonsOrderFeedback";
import type { WeightedSearchMode } from "../graphs/weightedSearch";
import { weightedMaterials } from "./content";
import { WeightedCanvas, WeightedCode, weightedContents } from "./WeightedExecutionPreview";

export type WeightedAssessmentStage = "check" | "codeCheck" | "consolidation";
type Question = AssessmentContent["questions"][number];

// Fixed rows divide the board into independent movable segments. Shuffle within
// each segment, preserving every original ID, answer and fixed-row position.
export function weightedParsonsQuestion(question: ParsonsQuestion): ParsonsQuestion {
  const fixed = new Set(question.fixedLineIds ?? []);
  const movable = parsonsMovableSegments(question.correctAnswer.lineIds, question.fixedLineIds).flatMap(segment => [...segment].reverse());
  let index = 0;
  return { ...question, lineIds: question.correctAnswer.lineIds.map(id => fixed.has(id) ? id : movable[index++]) };
}

function TransferFigure({ mode }: { mode: WeightedSearchMode }) {
  return <svg viewBox="0 0 440 185" width="100%" style={{maxHeight:170}} role="img" aria-label="別のグラフ：S-X 8、S-Y 2、Y-X 2、X-T 3、Y-T 10">
    {[[40,85,200,32,8],[40,85,200,138,2],[200,138,200,32,2],[200,32,400,85,3],[200,138,400,85,10]].map(([x1,y1,x2,y2,w],i)=><g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2"/><rect x={(x1+x2)/2-12} y={(y1+y2)/2-11} width="24" height="22" fill="white"/><text x={(x1+x2)/2} y={(y1+y2)/2+5} fontSize="14" textAnchor="middle">{w}</text></g>)}
    {[["S",40,85],["X",200,32],["Y",200,138],["T",400,85]].map(([id,x,y])=><g key={id}><circle cx={x} cy={y} r="19" fill="#fff" stroke="#64748b" strokeWidth="2"/><text x={x} y={Number(y)+5} textAnchor="middle" fontWeight="bold">{id}</text></g>)}
    {mode === "astar" && [["S",40,85,4],["X",200,32,2],["Y",200,138,3],["T",400,85,0]].map(([id,x,y,h])=><text key={id} x={x} y={Number(y)+30} textAnchor="middle" fontSize="12">h={h}</text>)}
  </svg>;
}

export function WeightedQuestionFigure({ mode, stage, question, disabled, onAnswer }: {
  mode: WeightedSearchMode; stage: WeightedAssessmentStage; question: Question;
  disabled: boolean; onAnswer: (answer: AssessmentAnswer) => void;
}) {
  if (stage === "check") {
    const canvas = weightedContents[mode].execution.steps.find(step => step.id === question.stepId)?.canvas;
    if (!canvas) throw new Error("Missing weighted review scene: " + question.stepId);
    return <Box sx={{ width:"100%", height:300, flexShrink:0 }}><WeightedCanvas canvas={canvas} questionMode onNode={"nodeIds" in question && !disabled ? id => onAnswer({kind:"node",nodeId:id}) : undefined} selectable={"nodeIds" in question ? question.nodeIds : []}/></Box>;
  }
  if ("kind" in question && question.kind === "code-blank") {
    return <Box sx={{ width:"100%", maxWidth:760 }}><WeightedCode mode={mode} focused={[question.lineId]} blank={{lineId:question.lineId,...question.blank}}/></Box>;
  }
  if ("kind" in question && question.kind === "parsons") {
    return <Box sx={{width:"100%",maxWidth:780}}><ParsonsBoard key={question.id} question={weightedParsonsQuestion(question)} code={weightedMaterials[mode].code} disabled={disabled} onAnswer={onAnswer} scrollable/></Box>;
  }
  if (question.id.startsWith("transfer-")) return <Box sx={{width:"100%",maxWidth:540}}><TransferFigure mode={mode}/></Box>;
  // These are independent conceptual questions; don't display the solution code.
  return <Typography sx={{alignSelf:"center",textAlign:"center",color:"text.secondary"}}>{question.id === "unreachable" ? "候補：なし ／ ゴール：未選択" : question.id === "zero-heuristic" ? "すべての地点で h = 0" : "辺ごとに移動コストが設定されたグラフ"}</Typography>;
}
