import { Difficulty } from "@prisma/client";

export type LoginResponse = {
    id: String
    name: String
}

export type MissionResponse = {
    id: string,
    dificulty: Difficulty,
    title: string,
    detail: string,
    component: string,
}

export type AIResponse = {
    score: number,
    reason: {
        "good": string[],
        "bad": string[],
    },
    feedback: string | null,
}