import { MissionChallengePage } from "@/features/learning/app/MissionChallenge";

export default async function Page({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  return <MissionChallengePage missionId={missionId} />;
}
