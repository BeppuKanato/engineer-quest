import { UnitOverview } from "@/features/learning/app/UnitOverview";
export default async function UnitPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <UnitOverview courseId={courseId} />;
}
