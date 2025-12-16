import { getApiBaseUrl } from "@/lib/api";
import { User } from "firebase/auth";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const navigateWithUpdateUsageTime = async (user: User | null | undefined, router: AppRouterInstance, targetUrl: string, startTime: Date, method: "push" | "replace") => {
    const apiBaseUrl = getApiBaseUrl();
    //ユーザを認識できない場合処理をしない(改善するかも 2025-11-21 記載)
    if (!user) {
        return;
    }
    const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const data = {
        token: await user.getIdToken(),
        useTime: elapsed,
    }
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"})
    navigator.sendBeacon(`${apiBaseUrl}/usage/upsert`, blob);
    if (method === "push") {
        router.push(targetUrl);
    } else {
        router.replace(targetUrl);
    }
}