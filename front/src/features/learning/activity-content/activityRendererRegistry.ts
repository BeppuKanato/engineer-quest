/**
 * フロントエンドのActivityContent型、renderer登録表、軽量ランタイム検証。
 *
 * API受信時とMission Activity画面から参照される。rendererKeyから表示方式と
 * 回答方式を解決するが、採点や進捗更新は担当しない。
 */
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
  | "DIVIDE_COMBINE_TRACE"
  | "TWO_LIST_MERGE_TRACE"
  | "GRAPH"
  | "CODE_MAPPING"
  | "STRING_SEARCH"
  | "BINARY_SEARCH"
  | "BUBBLE_COMPARISON"
  | "BUBBLE_ONE_PASS"
  | "BUBBLE_MULTI_PASS"
  | "BUBBLE_RANGE_OPTIMIZATION"
  | "BUBBLE_COMPLETION";

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
  DIVIDE_COMBINE_TRACE: renderer("DIVIDE_COMBINE_TRACE"),
  TWO_LIST_MERGE_TRACE: renderer("TWO_LIST_MERGE_TRACE"),
  GRAPH_TRACE: renderer("GRAPH"),
  GRAPH_CHOICE: renderer("GRAPH", "SINGLE_CHOICE"),
  CODE_STATE_MAPPING: renderer("CODE_MAPPING"),
  ARRAY_REGION_SELECT: renderer("NONE", "ARRAY_REGION_SELECT"),
  INDEX_SELECT: renderer("NONE", "INDEX_SELECT"),
  SINGLE_CHOICE: renderer("NONE", "SINGLE_CHOICE"),
  BLOCK_ORDER: renderer("NONE", "BLOCK_ORDER"),
  CODE_FILL: renderer("NONE", "CODE_BLOCK_BUILDER"),
  MATCH: renderer("NONE", "MATCH"),
  CODE_EDITOR: renderer("NONE", "CODE_EDITOR"),
  SEQUENTIAL_CHOICE: renderer("NONE", "COMPARISON_SEQUENCE"),

  STRING_ALIGNMENT_TRACE: renderer("STRING_SEARCH"),
  PREFIX_SUFFIX_EXPLANATION: renderer("STRING_SEARCH"),
  PREFIX_TABLE_TRACE: renderer("STRING_SEARCH"),
  STRING_SEARCH_FALLBACK_TRACE: renderer("STRING_SEARCH"),
  STRING_SEARCH_DECISION_SEQUENCE: renderer("STRING_SEARCH", "COMPARISON_SEQUENCE"),
  STRING_SEARCH_FULL_TRACE: renderer("STRING_SEARCH"),

  COMPARISON_RULE: renderer("BUBBLE_COMPARISON"),
  PAIR_DECISION: renderer("NONE", "PAIR_DECISION"),
  PYTHON_COMPARISON: renderer("BUBBLE_COMPARISON"),
  CONDITION_FILL: renderer("BUBBLE_COMPARISON", "OPTION_FILL"),
  PYTHON_SWAP: renderer("BUBBLE_COMPARISON"),
  SWAP_FILL: renderer("BUBBLE_COMPARISON", "OPTION_FILL"),
  IF_SWAP_BUILD: renderer("BUBBLE_COMPARISON", "CODE_BLOCK_BUILDER"),

  NEXT_PAIR_SEQUENCE: renderer("BUBBLE_ONE_PASS", "COMPARISON_SEQUENCE"),
  J_POSITION_MAPPING: renderer("BUBBLE_ONE_PASS"),
  J_PAIR_CHOICE: renderer("BUBBLE_ONE_PASS", "SINGLE_CHOICE"),
  ONE_PASS_LOOP: renderer("BUBBLE_ONE_PASS"),
  ONE_PASS_BUILD: renderer("BUBBLE_ONE_PASS", "CODE_BLOCK_BUILDER"),
  ONE_PASS_RESULT: renderer("BUBBLE_ONE_PASS", "SINGLE_CHOICE"),

  ONE_PASS_INCOMPLETE: renderer("BUBBLE_MULTI_PASS"),
  SECOND_PASS_SEQUENCE: renderer("BUBBLE_MULTI_PASS", "COMPARISON_SEQUENCE"),
  I_LOOP_MAPPING: renderer("BUBBLE_MULTI_PASS"),
  NESTED_LOOP_STRUCTURE: renderer("BUBBLE_MULTI_PASS"),
  MULTI_PASS_BUILD: renderer("BUBBLE_MULTI_PASS", "CODE_BLOCK_BUILDER"),
  MULTI_PASS_RESULT: renderer("BUBBLE_MULTI_PASS", "SINGLE_CHOICE"),

  RANGE_REDUNDANCY: renderer("BUBBLE_RANGE_OPTIMIZATION"),
  NEXT_ACTIVE_RANGE: renderer("BUBBLE_RANGE_OPTIMIZATION", "SINGLE_CHOICE"),
  RANGE_BY_PASS: renderer("BUBBLE_RANGE_OPTIMIZATION"),
  RANGE_FORMULA: renderer("BUBBLE_RANGE_OPTIMIZATION"),
  RANGE_FILL: renderer("BUBBLE_RANGE_OPTIMIZATION", "OPTION_FILL"),
  OPTIMIZATION_COMPARE: renderer("BUBBLE_RANGE_OPTIMIZATION", "SINGLE_CHOICE"),

  COMPLETE_PROCESS_REVIEW: renderer("BUBBLE_COMPLETION"),
  LOOP_ROLE_REVIEW: renderer("BUBBLE_COMPLETION", "LOOP_ROLE"),
  EXECUTION_ORDER: renderer("BUBBLE_COMPLETION", "BLOCK_ORDER"),
  MISSING_CONDITION: renderer("BUBBLE_COMPLETION", "SINGLE_CHOICE"),
  CODE_REPAIR: renderer("BUBBLE_COMPLETION", "CODE_REPAIR"),
  COMPLETE_CODE_BUILD: renderer("BUBBLE_COMPLETION", "CODE_BLOCK_BUILDER"),
  COMPLETE_CODE_MATCH: renderer("BUBBLE_COMPLETION", "MATCH"),

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

/** rendererKeyを表示方式と回答方式へ解決し、未登録キーは画面表示前に失敗させる。 */
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

/** APIから受け取ったActivityContentの共通形と登録済みrendererKeyを検証する。 */
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
  if (value.rendererKey === "DIVIDE_COMBINE_TRACE" && !Array.isArray(value.data.levels)) {
    throw new Error("DIVIDE_COMBINE_TRACE requires levels");
  }
  if (
    value.rendererKey === "TWO_LIST_MERGE_TRACE" &&
    (!Array.isArray(value.data.left) || !Array.isArray(value.data.right) || !Array.isArray(value.data.steps))
  ) {
    throw new Error("TWO_LIST_MERGE_TRACE requires left, right, and steps");
  }
  if (
    value.rendererKey === "ARRAY_REGION_SELECT" &&
    (value.data.sequenceMode !== "QUESTIONS" && value.data.sequenceMode !== "TRACE")
  ) {
    throw new Error("ARRAY_REGION_SELECT requires a supported sequenceMode");
  }

  return value as ActivityContent;
};
