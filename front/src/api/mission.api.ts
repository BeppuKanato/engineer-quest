import type { Mission } from "@/app/mission/[missionId]/overview/type";
import { fetcher } from "@/lib/fetcher";

export const getMissionOverview = async (token: string, missionId: string): Promise<Mission> => {
    return fetcher<Mission>(`/missions/${encodeURIComponent(missionId)}/overview`, {
        method: "GET",
        token,
    });
};