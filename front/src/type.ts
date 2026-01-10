export enum JUDGE_TYPE {
    WITH_FEEDBACK = "WITH_FEEDBACK",
    WITHOUT_FEEDBACK = "WITHOUT_FEEDBACK",
    PHILANTHROPIST = "PHILANTHROPIST",
    ACHIEVER = "ACHIEVER",
    FREE_SPIRIT = "FREE_SPIRIT",
    SOCIALIZER = "SOCIALIZER",
    PLAYER = "PLAYER",
    DISRUPTOR = "DISRUPTOR"
}

export enum MISSION_TYPE {
    MAIN = "MAIN",
    SUB = "SUB",
    PROMOTION = "PROMOTION"
}

export enum MISSION_STATUS_TYPE  {
    NOT_STARTED = "NOT_STARTED",   
    IN_PROGRESS = "IN_PROGRESS",  
    COMPLETED = "COMPLETED",     
    CANCELED = "CANCELED"  
}

export enum MISSION_EXAM_TPYE {
    REPRODUCTION = "REPRODUCTION",
    FREE_CREATION = "FREE_CREATION",
    HYBRID = "HYBRID"
}

export enum MISSION_EXAM_LANGUAGE {
    HTML = "HTML",
    CSS = "CSS",
    JavaScript = "JavaScript"
}

export type MissionSelectResponse = {
    id: string
    title: string;
    detail: string;
    type: MISSION_TYPE;
    client: {
        id: string,
        name: string,
        imagePath: string
    }
    missionProgresses: {
        status: MISSION_STATUS_TYPE,
        currentStep: number,
        completedAt: Date
    }[]
    difficulty: {
        name: '初級' | '中級' | '上級';
    }
    _count: {
        steps: number
    }
}

export type MissionConfirmResponse = {
    component: string,
    exam: {
        type: MISSION_EXAM_TPYE,
        instructions: string[],
        criteria: MissionExamCriteria
    }
    difficulty: {
        name: string
    },
    steps: {
        id: string,
        title: string,
        detail: string,
        _count: {
            explains: number,
            stepExams: number
        },
    }[],
    missionProgresses: {
        status: MISSION_STATUS_TYPE,
        currentStep: number
    }[]
}

export type StepExplainResponse =  {
    id: string;
    title: string;
    explains: {
        content: string;
        componentType?: string;
        highlight?: string;
        supporter: {
            name: string;
            imagePath: string;
        };
        code: string;
    }[]
    mission: {
        id: string,
        component: string,
    }
}

export type StepExamResponse = {
    id: string;
    title: string;
    order: number;
    stepExams: {
        content: string;
        answer: string;
        componentType?: string;
        highlight?: string;
        instructions: string[];
        supporter: {
            name: string;
            imagePath: string;
        },
    }[],
    mission: {
        id: string,
        component: string,
        steps: {
            id: string,
            order: number,
        }[],
    },
}

export type MissionExamRepsonse = {
    id: string;
    title: string;
    exam: {
        id: string
        type: MISSION_EXAM_TPYE;
        instructions: string[];
        component: string;
        language: MISSION_EXAM_LANGUAGE[];
    }
}

export type MissionExamCriteria = {
    score: number;
    factor: string;
}

export type MissionExamAIResponse = {
    score: number;
    reason: {
        "good": string[];
        "bad": string[];
    };
    feedback: string | null;
    isPassed: boolean;
}

export type MissionSentence = {
    id: string,
    title: string,
    detail: string,
    type: MISSION_TYPE,
    sentences: {
        sentence: string,
        speaker: {
            name: string,
            imagePath: string
        }
    }[]
}

//homeページでアクセスするデータのみを定義
export type HomePageResponse = {
    acceptableMission: {
        id: string,
        title: string,
        detail: string,
        type: MISSION_TYPE,
        client: {
            id: string,
            name: string,
            imagePath: string
        }
        difficulty: {
            id: string,
            name: string,
        },
        beforeSentences: {
            id: string,
            sentence: string,
            order: number,
            speaker: {
                name: string,
                imagePath: string
            }
        }[]
    }[],
    user: {
        rankId: string,
        name: string,
        level: number,
        experience: number,
        rank: {
            name: string,
        },
        levelRequirement: {
            requiredExperience: number
        }
    }
}

export type MissionResultResponse = {
    missionData: {
        title: string,
        detail: string,
        experience: number,
        steps: {
            title: string
        }[],
        difficulty: {
            name: string,
        },
        afterSentences: {
            speaker: {
                name: string,
                imagePath: string,
            },
            sentence: string
        }[],
        _count: {
            steps: number
        },
    },
    user: {
        name: string,
        level: number,
        experience: number,
        rank: {
            name: string,
        },
        levelRequirement: {
            requiredExperience: number
        }
    },
    examResult: {
        point: number,
        isPassed: boolean,
        feedback: string | null,
        judgeType: JUDGE_TYPE,
        createdAt: string,
    }[],
    dayUsagetime: number,
    weekUsagetime: number,
    totalUsagetime: number,
    experienceUpdate: {
        oldLevel: number,
        newLevel: number,
        oldExperience: number,
        gainedExperience: number,
        levelUps: {
            level: number,
            requiredExperience: number,
        }[],
    }
    updatedRank: string | null;
}