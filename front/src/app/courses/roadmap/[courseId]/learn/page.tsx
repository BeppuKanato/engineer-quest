import { AppHeader } from "@/app/component/appHeader";
import { LearningScreen } from "@/features/learning/app/LearningScreen";
export default async function LearnPage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ phase?: string }> }) {
  const [{ courseId }, { phase }] = await Promise.all([params, searchParams]);
  return <LearningScreen courseId={courseId} header={<AppHeader />} reviewPhaseKey={phase} />;
}
