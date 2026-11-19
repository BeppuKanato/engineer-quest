import type { ReactNode } from "react";
import type { DailyReview } from "@/api/dailyReview.api";
import type { AssessmentAnswer, AssessmentContent } from "../assessment/assessment";
import { getLearningStep } from "../review/reviewContent";
import { findLearningUnit } from "../app/unitRegistry";
import { CodeDisplay } from "../code/CodeDisplay";
import { parsonsMovableSegments } from "../bfs/consolidation/parsonsOrderFeedback";
import { ParsonsBoard } from "../bfs/consolidation/ParsonsBoard";
import { ConsolidationGraph } from "../bfs/consolidation/ConsolidationGraph";
import { BinarySearchConsolidationCanvas } from "../binary-search/consolidation/BinarySearchConsolidationCanvas";
import { bfsCheckContent } from "../bfs/check/check.content";
import { BfsCheckCanvas } from "../bfs/check/BfsCheckCanvas";
import { bfsCodeCheckContent } from "../bfs/code-check/codeCheck.content";
import { bfsConsolidationContent } from "../bfs/consolidation/consolidation.content";
import { bfsExecutionContent } from "../bfs/execution/execution.content";
import { dfsCheckContent } from "../dfs/check/check.content";
import { DfsCheckCanvas } from "../dfs/check/DfsCheckCanvas";
import { dfsCodeCheckContent } from "../dfs/code-check/codeCheck.content";
import { dfsConsolidationContent } from "../dfs/consolidation/consolidation.content";
import { dfsExecutionContent } from "../dfs/execution/execution.content";
import { wallExtensionCheckContent, getWallExtensionCheckScene } from "../wall-extension/check/check.content";
import { WallExtensionCheckCanvas } from "../wall-extension/check/WallExtensionCheckCanvas";
import { wallExtensionCodeCheckContent } from "../wall-extension/code-check/codeCheck.content";
import { wallExtensionConsolidationContent } from "../wall-extension/consolidation/consolidation.content";
import { bubbleSortCheckContent, getBubbleSortCheckScene } from "../bubble-sort/check/check.content";
import { BubbleSortCheckCanvas } from "../bubble-sort/check/BubbleSortCheckCanvas";
import { bubbleSortCodeCheckContent } from "../bubble-sort/code-check/codeCheck.content";
import { bubbleSortConsolidationContent } from "../bubble-sort/consolidation/consolidation.content";
import { mazeDiggingCheckContent, getMazeDiggingCheckScene } from "../maze-digging/check/check.content";
import { MazeDiggingCheckCanvas } from "../maze-digging/check/MazeDiggingCheckCanvas";
import { mazeDiggingCodeCheckContent } from "../maze-digging/code-check/codeCheck.content";
import { mazeDiggingConsolidationContent } from "../maze-digging/consolidation/consolidation.content";
import { binarySearchCheckContent, getBinarySearchCheckScene } from "../binary-search/check/check.content";
import { BinarySearchCheckCanvas } from "../binary-search/check/BinarySearchCheckCanvas";
import { binarySearchCodeCheckContent } from "../binary-search/code-check/codeCheck.content";
import { binarySearchConsolidationContent } from "../binary-search/consolidation/consolidation.content";
import { greedyCoinsCheckContent, getGreedyCoinsCheckScene } from "../greedy-coins/check/check.content";
import { GreedyCoinsCheckCanvas } from "../greedy-coins/check/GreedyCoinsCheckCanvas";
import { greedyCoinsCodeCheckContent } from "../greedy-coins/code-check/codeCheck.content";
import { greedyCoinsConsolidationContent } from "../greedy-coins/consolidation/consolidation.content";

type Input = { onAnswer: (answer: AssessmentAnswer) => void; disabled: boolean };
export type ReviewMaterial = {
  courseId: string; phaseKey: string; assessmentId: string; questionId: string;
  question: AssessmentContent["questions"][number];
  render: (input: Input) => ReactNode;
};
function entries<T extends AssessmentContent>(courseId: string, content: T, render: (question: T["questions"][number], input: Input) => ReactNode): ReviewMaterial[] {
  return content.questions.map(question => ({ courseId, phaseKey: content.id, assessmentId: content.id, questionId: question.id, question, render: input => render(question, input) }));
}
// 教材・図は元の定義を参照。単元ごとの画面や保存フックは取り込まない。
export const reviewMaterials: ReviewMaterial[] = [
  ...entries("course-algorithm-breadth-first-search-v1", bfsCheckContent, (q, input) => <BfsCheckCanvas canvas={getLearningStep(bfsExecutionContent, q.stepId).canvas} questionId={"nodeIds" in q ? q.id : undefined} nodeIds={"nodeIds" in q ? q.nodeIds : undefined} allowNone={"allowNone" in q && q.allowNone} {...input} />),
  ...entries("course-algorithm-breadth-first-search-v1", bfsCodeCheckContent, q => <CodeDisplay code={bfsCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-breadth-first-search-v1", bfsConsolidationContent, (q, input) => q.kind === "parsons"
    ? <ParsonsBoard question={q} code={bfsConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <ConsolidationGraph {...q.scene} minHeight={0} onSelect={q.kind === "node" && !input.disabled ? nodeId => input.onAnswer({ kind: "node", nodeId }) : undefined} />),
  ...entries("course-algorithm-depth-first-search-v1", dfsCheckContent, (q, input) => <DfsCheckCanvas canvas={getLearningStep(dfsExecutionContent, q.stepId).canvas} questionId={"nodeIds" in q ? q.id : undefined} nodeIds={"nodeIds" in q ? q.nodeIds : undefined} allowNone={"allowNone" in q && q.allowNone} {...input} />),
  ...entries("course-algorithm-depth-first-search-v1", dfsCodeCheckContent, q => <CodeDisplay code={dfsCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-depth-first-search-v1", dfsConsolidationContent, (q, input) => q.kind === "parsons"
    ? <ParsonsBoard question={q} code={dfsConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <ConsolidationGraph {...q.scene} minHeight={0} onSelect={q.kind === "node" && !input.disabled ? nodeId => input.onAnswer({ kind: "node", nodeId }) : undefined} />),
  ...entries("course-algorithm-wall-extension-v1", wallExtensionCheckContent, (q, input) => <WallExtensionCheckCanvas canvas={getWallExtensionCheckScene(q)} questionId={"nodeIds" in q ? q.id : undefined} cellIds={"nodeIds" in q ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-wall-extension-v1", wallExtensionCodeCheckContent, q => <CodeDisplay code={wallExtensionCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-wall-extension-v1", wallExtensionConsolidationContent, (q, input) => q.kind === "parsons"
    ? <ParsonsBoard question={q} code={wallExtensionConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <WallExtensionCheckCanvas canvas={q.scene} questionId={q.kind === "node" ? q.id : undefined} cellIds={q.kind === "node" ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-bubble-sort-v2", bubbleSortCheckContent, (q, input) => <BubbleSortCheckCanvas canvas={getBubbleSortCheckScene(q)} questionId={"nodeIds" in q ? q.id : undefined} cellIds={"nodeIds" in q ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-bubble-sort-v2", bubbleSortCodeCheckContent, q => <CodeDisplay code={bubbleSortCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-bubble-sort-v2", bubbleSortConsolidationContent, (q, input) => q.kind === "parsons"
    ? <ParsonsBoard question={q} code={bubbleSortConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <BubbleSortCheckCanvas canvas={q.scene} questionId={q.kind === "node" ? q.id : undefined} cellIds={q.kind === "node" ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-maze-digging-v1", mazeDiggingCheckContent, (q, input) => <MazeDiggingCheckCanvas canvas={getMazeDiggingCheckScene(q)} questionId={"nodeIds" in q ? q.id : undefined} cellIds={"nodeIds" in q ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-maze-digging-v1", mazeDiggingCodeCheckContent, q => <CodeDisplay code={mazeDiggingCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-maze-digging-v1", mazeDiggingConsolidationContent, (q, input) => q.kind === "parsons"
    ? <ParsonsBoard question={q} code={mazeDiggingConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <MazeDiggingCheckCanvas canvas={q.scene} questionId={q.kind === "node" ? q.id : undefined} cellIds={q.kind === "node" ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-binary-search-v1", binarySearchCheckContent, (q, input) => <BinarySearchCheckCanvas canvas={getBinarySearchCheckScene(q)} questionId={"nodeIds" in q ? q.id : undefined} cellIds={"nodeIds" in q ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-binary-search-v1", binarySearchCodeCheckContent, q => <CodeDisplay code={binarySearchCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-binary-search-v1", binarySearchConsolidationContent, (q, input) => q.kind === "parsons"
    ? <ParsonsBoard question={q} code={binarySearchConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <BinarySearchConsolidationCanvas canvas={q.scene} label={q.prompt} questionId={q.kind === "node" ? q.id : undefined} cellIds={q.kind === "node" ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-greedy-coins-v1", greedyCoinsCheckContent, (q, input) => <GreedyCoinsCheckCanvas canvas={getGreedyCoinsCheckScene(q)} questionId={"nodeIds" in q ? q.id : undefined} cellIds={"nodeIds" in q ? q.nodeIds : undefined} {...input} />),
  ...entries("course-algorithm-greedy-coins-v1", greedyCoinsCodeCheckContent, q => <CodeDisplay code={greedyCoinsCodeCheckContent.code} label="穴埋めコード" blank={{ lineId: q.lineId, ...q.blank }} />),
  ...entries("course-algorithm-greedy-coins-v1", greedyCoinsConsolidationContent, (q, input) => "kind" in q && q.kind === "parsons"
    ? <ParsonsBoard question={q} code={greedyCoinsConsolidationContent.code} {...input} scrollable instruction={q.instruction} />
    : <GreedyCoinsCheckCanvas canvas={q.scene} questionId={"nodeIds" in q ? q.id : undefined} cellIds={"nodeIds" in q ? q.nodeIds : undefined} {...input} />),
 ];
/** 固定行をまたいでしか正解にできない初期配置は、既存部品の制約上出題しない。 */
export function unsupportedReviewReason(material: ReviewMaterial): string | null {
  const question = material.question;
  if (!("kind" in question) || question.kind !== "parsons") return null;
  const fixed = new Set(question.fixedLineIds ?? []);
  const movable = question.lineIds.filter(id => !fixed.has(id));
  let offset = 0;
  for (const segment of parsonsMovableSegments(question.correctAnswer.lineIds, question.fixedLineIds)) {
    const initial = movable.slice(offset, offset + segment.length);
    offset += segment.length;
    if (segment.some(id => !initial.includes(id))) return "固定行を越える移動が必要な初期配置";
  }
  return null;
}
export function resolveReviewMaterial(review: Pick<DailyReview, "courseId" | "phaseKey" | "assessmentId" | "questionId">) {
  return reviewMaterials.find(material => material.courseId === review.courseId && material.phaseKey === review.phaseKey && material.assessmentId === review.assessmentId && material.questionId === review.questionId && !unsupportedReviewReason(material)) ?? null;
}
export const reviewUnitName = (courseId: string) => findLearningUnit(courseId)?.title ?? "学習した単元";
// 前提の正解を必要とする図は元教材の固定スナップショットで再現する。
// この1問セッションだけ前提を外し、元教材オブジェクトには書き込まない。
export const singleReviewContent = (material: ReviewMaterial, reviewId: string): AssessmentContent => ({
  version: 1, kind: "kind" in material.question && material.question.kind === "code-blank" ? "code-blank-check" : "diagnostic-check",
  id: `daily-review:${reviewId}`, questions: [{ ...material.question, requires: null }],
} as AssessmentContent);
