export type LessonStepType = "TUTORIAL" | "VIEW" | "CHOICE" | "FILL_BLANK" | "ORDERING" | "SHORT_INPUT" | "TRACE";
export type Lesson = {
    id: string;
    courseId: string;
    courseTitle: string;
    title: string;
    description: string;
    activities: LessonActivity[];
}

export type LessonActivity = {
    id: string;
    type: LessonStepType;
    title: string;
    instruction: string;
    mentorMessage: string;
    choices?: Choice[]; // CHOICEタイプのときに使用
    codeTemplate?: string; // FILL_BLANKやTRACEタイプのときに使用
    input?: Input; // SHORT_INPUTタイプのときに使用
    summary?: string[]; // VIEWタイプのときに使用
    blanks?: Blank[]; // FILL_BLANKタイプのときに使用
    blankChoices?: BlankChoice[]; // FILL_BLANKタイプのときに使用
    orderingItems?: OrderingItem[];
    correctFeedback?: string;
    incorrectFeedback?: string;
    goal: {
        type: "UI_PREVIEW" | "CODE_OUTPUT" | "CODE_CORRECTNESS";
        title: string;
        previewKey?: string;
    }
    actionLabel: string;
}

export type Choice = {
    id: string;
    label: string;
    isCorrect: boolean;
    feedback: string;
}

export type BlankChoice = {
    id: string;
    label: string;
}

export type Input = {
    placeholder: string;
    minLength?: number;
    maxLength?: number;
    answer?: string; // SHORT_INPUTの正解例（あくまで参考用）
}

export type Blank = {
    id: string;
    answer: string;
    placeholder: string;
}

export type OrderingItem = {
  id: string;
  label: string;
  order: number;
};

export type ActivityAnswerState  = {
  selectedChoiceId: string | null;
  userAnswer: unknown;
  isCorrect: boolean | null;
};