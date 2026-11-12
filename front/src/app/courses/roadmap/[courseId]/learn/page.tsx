import { LearningPageComposition } from "./LearningPageComposition";
export default async function LearnPage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ phase?: string }> }) {
  const [{ courseId }, { phase }] = await Promise.all([params, searchParams]);
  return <LearningPageComposition courseId={courseId} reviewPhaseKey={phase} />;
}
