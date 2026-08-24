export type ActivityLearningRole =
  | "ORIENTATION"
  | "EXPLANATION"
  | "GUIDED_PRACTICE"
  | "INDEPENDENT_PRACTICE"
  | "CODE_MAPPING"
  | "SYNTHESIS"
  | "MISSION_CHECK"
  | "COURSE_EXAM";

export type ActivityFeedbackPolicy =
  | { mode: "NONE" }
  | { mode: "RETRY_WITH_HINT"; revealAfterAttempts: number };

export type ActivityRendererData = Record<string, unknown>;

export type ActivityContent = {
  learningRole: ActivityLearningRole;
  rendererKey: ActivityRendererKey;
  feedbackPolicy: ActivityFeedbackPolicy;
  data: ActivityRendererData;
};

type VisualizationRenderer =
  | "NONE"
  | "SORT_OVERVIEW"
  | "LEARNING_ROADMAP"
  | "ARRAY_TRACE"
  | "BINARY_SEARCH"
  | "BUBBLE_MISSION_2"
  | "BUBBLE_MISSION_3"
  | "BUBBLE_MISSION_4"
  | "BUBBLE_MISSION_5"
  | "BUBBLE_MISSION_6";

export type AnswerRenderer =
  | "NONE"
  | "SINGLE_CHOICE"
  | "ARRAY_REGION_SELECT"
  | "INDEX_SELECT"
  | "MATCH"
  | "BLOCK_ORDER"
  | "CODE_EDITOR"
  | "PAIR_DECISION"
  | "MULTI_DECISION"
  | "OPTION_FILL"
  | "CODE_BLOCK_BUILDER"
  | "COMPARISON_SEQUENCE"
  | "LOOP_ROLE"
  | "CODE_REPAIR";

type RendererDefinition = {
  visualization: VisualizationRenderer;
  answer: AnswerRenderer;
};

const renderer = (
  visualization: VisualizationRenderer,
  answer: AnswerRenderer = "NONE",
): RendererDefinition => ({ visualization, answer });

export const activityRendererRegistry = {
  TEXT: renderer("NONE"),
  LEARNING_ROADMAP: renderer("LEARNING_ROADMAP"),
  SORT_OVERVIEW: renderer("SORT_OVERVIEW"),
  ARRAY_TRACE: renderer("ARRAY_TRACE"),
  ARRAY_REGION_SELECT: renderer("NONE", "ARRAY_REGION_SELECT"),
  INDEX_SELECT: renderer("NONE", "INDEX_SELECT"),
  SINGLE_CHOICE: renderer("NONE", "SINGLE_CHOICE"),
  BLOCK_ORDER: renderer("NONE", "BLOCK_ORDER"),
  CODE_FILL: renderer("NONE", "CODE_BLOCK_BUILDER"),
  MATCH: renderer("NONE", "MATCH"),
  CODE_EDITOR: renderer("NONE", "CODE_EDITOR"),

  COMPARISON_RULE: renderer("BUBBLE_MISSION_2"),
  PAIR_DECISION: renderer("NONE", "PAIR_DECISION"),
  PYTHON_COMPARISON: renderer("BUBBLE_MISSION_2"),
  CONDITION_FILL: renderer("BUBBLE_MISSION_2", "OPTION_FILL"),
  PYTHON_SWAP: renderer("BUBBLE_MISSION_2"),
  SWAP_FILL: renderer("BUBBLE_MISSION_2", "OPTION_FILL"),
  IF_SWAP_BUILD: renderer("BUBBLE_MISSION_2", "CODE_BLOCK_BUILDER"),

  NEXT_PAIR_SEQUENCE: renderer("BUBBLE_MISSION_3", "COMPARISON_SEQUENCE"),
  J_POSITION_MAPPING: renderer("BUBBLE_MISSION_3"),
  J_PAIR_CHOICE: renderer("BUBBLE_MISSION_3", "SINGLE_CHOICE"),
  ONE_PASS_LOOP: renderer("BUBBLE_MISSION_3"),
  ONE_PASS_BUILD: renderer("BUBBLE_MISSION_3", "CODE_BLOCK_BUILDER"),
  ONE_PASS_RESULT: renderer("BUBBLE_MISSION_3", "SINGLE_CHOICE"),

  ONE_PASS_INCOMPLETE: renderer("BUBBLE_MISSION_4"),
  SECOND_PASS_SEQUENCE: renderer("BUBBLE_MISSION_4", "COMPARISON_SEQUENCE"),
  I_LOOP_MAPPING: renderer("BUBBLE_MISSION_4"),
  NESTED_LOOP_STRUCTURE: renderer("BUBBLE_MISSION_4"),
  MULTI_PASS_BUILD: renderer("BUBBLE_MISSION_4", "CODE_BLOCK_BUILDER"),
  MULTI_PASS_RESULT: renderer("BUBBLE_MISSION_4", "SINGLE_CHOICE"),

  RANGE_REDUNDANCY: renderer("BUBBLE_MISSION_5"),
  NEXT_ACTIVE_RANGE: renderer("BUBBLE_MISSION_5", "SINGLE_CHOICE"),
  RANGE_BY_PASS: renderer("BUBBLE_MISSION_5"),
  RANGE_FORMULA: renderer("BUBBLE_MISSION_5"),
  RANGE_FILL: renderer("BUBBLE_MISSION_5", "OPTION_FILL"),
  OPTIMIZATION_COMPARE: renderer("BUBBLE_MISSION_5", "SINGLE_CHOICE"),

  COMPLETE_PROCESS_REVIEW: renderer("BUBBLE_MISSION_6"),
  LOOP_ROLE_REVIEW: renderer("BUBBLE_MISSION_6", "LOOP_ROLE"),
  EXECUTION_ORDER: renderer("BUBBLE_MISSION_6", "BLOCK_ORDER"),
  MISSING_CONDITION: renderer("BUBBLE_MISSION_6", "SINGLE_CHOICE"),
  CODE_REPAIR: renderer("BUBBLE_MISSION_6", "CODE_REPAIR"),
  COMPLETE_CODE_BUILD: renderer("BUBBLE_MISSION_6", "CODE_BLOCK_BUILDER"),
  COMPLETE_CODE_MATCH: renderer("BUBBLE_MISSION_6", "MATCH"),

  BINARY_SEARCH_CENTRAL_COMPARISON: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_SORTED_REQUIREMENT: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_INDEX_RANGE: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_MID_CALCULATION: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_RANGE_UPDATE: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_RECALCULATE_MID: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_ONE_ITERATION: renderer("BINARY_SEARCH", "BLOCK_ORDER"),
  BINARY_SEARCH_WHILE_LOOP: renderer("BINARY_SEARCH"),
  BINARY_SEARCH_ENDINGS: renderer("BINARY_SEARCH"),
} as const satisfies Record<string, RendererDefinition>;

export type ActivityRendererKey = keyof typeof activityRendererRegistry;

export const getActivityRendererDefinition = (rendererKey: string): RendererDefinition => {
  const definition = activityRendererRegistry[rendererKey as ActivityRendererKey];
  if (!definition) {
    throw new Error(`Unregistered activity renderer: ${rendererKey}`);
  }
  return definition;
};

const learningRoles = new Set<ActivityLearningRole>([
  "ORIENTATION",
  "EXPLANATION",
  "GUIDED_PRACTICE",
  "INDEPENDENT_PRACTICE",
  "CODE_MAPPING",
  "SYNTHESIS",
  "MISSION_CHECK",
  "COURSE_EXAM",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const parseActivityContent = (value: unknown): ActivityContent => {
  if (!isRecord(value)) throw new Error("Activity content must be an object");
  if (!learningRoles.has(value.learningRole as ActivityLearningRole)) {
    throw new Error(`Unknown activity learning role: ${String(value.learningRole)}`);
  }
  if (typeof value.rendererKey !== "string") {
    throw new Error("Activity rendererKey must be a string");
  }
  getActivityRendererDefinition(value.rendererKey);
  if (!isRecord(value.feedbackPolicy)) {
    throw new Error("Activity feedbackPolicy must be an object");
  }
  const feedbackPolicy = value.feedbackPolicy;
  if (
    feedbackPolicy.mode !== "NONE" &&
    !(
      feedbackPolicy.mode === "RETRY_WITH_HINT" &&
      typeof feedbackPolicy.revealAfterAttempts === "number" &&
      feedbackPolicy.revealAfterAttempts > 0
    )
  ) {
    throw new Error(`Invalid activity feedback policy: ${String(feedbackPolicy.mode)}`);
  }
  if (!isRecord(value.data)) throw new Error("Activity data must be an object");
  if (
    value.rendererKey === "CODE_EDITOR" &&
    value.data.evaluationMode !== "TEST_CASES" &&
    value.data.evaluationMode !== "TRANSCRIPTION"
  ) {
    throw new Error("CODE_EDITOR requires a supported evaluationMode");
  }
  if (
    value.rendererKey === "ARRAY_TRACE" &&
    (!Array.isArray(value.data.values) || !Array.isArray(value.data.steps))
  ) {
    throw new Error("ARRAY_TRACE requires values and steps");
  }
  if (
    value.rendererKey === "ARRAY_REGION_SELECT" &&
    (value.data.sequenceMode !== "QUESTIONS" && value.data.sequenceMode !== "TRACE")
  ) {
    throw new Error("ARRAY_REGION_SELECT requires a supported sequenceMode");
  }

  return value as ActivityContent;
};
