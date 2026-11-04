import type { CanvasSnapshot, LearningContent, LearningStep } from "../player/content.types";

export function getLearningStep<T extends CanvasSnapshot>(content: LearningContent<T>, id: string): LearningStep<T> {
  const step = content.steps.find(step => step.id === id);
  if (!step) throw new Error(`Unknown learning step: ${id}`);
  return step;
}

/** 元のステップそのものへの参照を選ぶ。canvas・キャプションを複製／再定義しない。 */
export function selectReviewContent<T extends CanvasSnapshot>(content: LearningContent<T>, stepIds: readonly [string, ...string[]]): LearningContent<T> {
  const [first, ...rest] = stepIds.map(id => getLearningStep(content, id));
  if (!first || new Set(stepIds).size !== stepIds.length) throw new Error("Review requires unique step IDs");
  return { ...content, id: `${content.id}:review:${stepIds.join(",")}`, steps: [first, ...rest] };
}
