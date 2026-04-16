import { Difficulty, JudgeType } from "@prisma/client";

export type LoginResponse = {
    id: string
    name: string
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
    feedbacks: {
        index: number,
        type: JudgeType,
        text: string,
    }[],
}