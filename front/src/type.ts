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
    star: number;
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
    };
    selectedFeedbackIndex: number | null;
}

export type MissionExamCriteria = {
    score: number;
    factor: string;
}

export type MissionExamAIResponse = {
    progressId: string;
    score: number;
    reason: {
        "good": string[];
        "bad": string[];
    };
    feedbacks: {
        index: number;
        type: JUDGE_TYPE;
        text: string;
    }[];
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
        star: number,
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
    },
    experienceStatus: {
        currentLevel: number,
        currentExp: number,
        requiredExpForNextLevel: number,
        remainningExp: number,
        progressRate: number
    }
}

export type MissionResultResponse = {
    missionData: {
        title: string,
        detail: string,
        experience: number,
        star: number,
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
        exam: { id: string }; 
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
    },
    examResult: {
        point: number,
        isPassed: boolean,
        judgeType: JUDGE_TYPE,
        createdAt: string,
    }[],
    dayUsagetime: number,
    weekUsagetime: number,
    totalUsagetime: number,
    experienceUpdate: {
        oldLevel: number;
        newLevel: number;
        oldExperience: number;
        newExperience: number;

        oldLevelRequiredExp: number;
        newLevelRequiredExp: number;
    }
    updatedRank: string | null;
}

export type SharedMissionSelectItem = {
  title: string;
  detail: string;
  star: number;
  type: MISSION_TYPE;
  difficulty: {
    name: string;
  };
  exam: {
    id: string;
    language: MISSION_EXAM_LANGUAGE[];
  } | null;
};

export type SharedMissionUserCode = {
  code: string;
  language: MISSION_EXAM_LANGUAGE;
  fileName: string | null;
};

export type SharedMissionItem = {
  user: {
    name: string;
  };
  examProgress: {
    point: number;
    good: string[];
    bad: string[];
    userCodes: {
      code: string;
      language: string;
      fileName?: string | null;
    }[];
  };
};

export type SharedMissionStats = {
  count: number;
  average: number;
  max: number;
  min: number;
};

export type SharedMissionMainResponse = {
  sharedMissions: SharedMissionItem[];
  stats: SharedMissionStats;
};

export type FailedConnectionResponse = {
    message: string;
}