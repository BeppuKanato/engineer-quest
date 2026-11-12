import { AppHeader } from "@/app/component/appHeader";
import { UnitOverview } from "@/features/learning/screens/UnitOverview";
export default async function UnitPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <UnitOverview courseId={courseId} header={<AppHeader />} />;
}
