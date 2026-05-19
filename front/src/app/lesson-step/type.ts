export type LessonStepType = "TRY_CODE" | "TUTORIAL" | "VIEW" | "CHOICE" | "SELECT_FILL";

export type PreviewType = "STATIC_HTML" | "CUSTOM" | "NO_PREVIEW";

export type BlankAreaType = "CODE" | "ORDERED_STEPS" | "INLINE_NEXT";

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
    
    blankArea?: BlankArea // SELECT_FILLやTRACEタイプのときに使用
    blanks?: Blank[]; // SELECT_FILLタイプのときに使用
    blankChoices?: BlankChoice[]; // SELECT_FILLタイプのときに使用
  
    input?: Input; // SHORT_INPUTタイプのときに使用
    summary?: string[]; // VIEWタイプのときに使用
    
    starterCode?: string;
    sampleCode?: string;
    
    correctFeedback?: string;
    incorrectFeedback?: string;

    preview: Preview;

    actionLabel: string;
}

export type Preview = {
    type: PreviewType;
    title: string;
    html?: string;
    caption?: string;
    previewKey?: string;
    minHeight?: number;
};

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

export type BlankArea = {
    type: BlankAreaType;
    template?: string;
}

export type Input = {
    placeholder: string;
    minLength?: number;
    maxLength?: number;
    answer?: string; // SHORT_INPUTの正解例（あくまで参考用）
}

export type Blank = {
    id: string;
    answerChoiceId: string;
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