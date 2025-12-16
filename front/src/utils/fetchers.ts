import { getApiBaseUrl } from "@/lib/api";
import { User } from "firebase/auth";
import { RequestInit } from "next/dist/server/web/spec-extension/request";

/**
 * ユーザのIDをheaderに含めたfetcher
 * 
 * @param path APIのエンドポイント
 * @param options 
 */
export const fetchWithUserId = async(user: User, path: string, options: RequestInit = {}) => {
    const apiBaseUrl = getApiBaseUrl();
    const token = await user.getIdToken();
    try {
        return fetch(`${apiBaseUrl}${path}`, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
    }
    catch (error) {
        console.error("API通信で例外", error);
        throw error; // これが重要
    }
};

export const fetchWithoutUserId = async(path: string, options: RequestInit = {}) => {
    const apiBaseUrl = getApiBaseUrl();
    try {
        return fetch(`${apiBaseUrl}${path}`, {
            ...options,
            headers: {
                ...options.headers,
                "Content-Type": "application/json",
            },
        });
    }
    catch (error) {
        console.error("API通信で例外", error);
        throw error; // これが重要
    }
};