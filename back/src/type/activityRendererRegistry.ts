import { MissionActivityType } from "@prisma/client";
import { z } from "zod";

const rendererDataSchema = z.record(z.unknown());
const textDataSchema = z.object({
  body: z.string().optional(),
  text: z.string().optional(),
}).passthrough();
const learningRoadmapDataSchema = z.object({
  roadmapSteps: z.array(z.string()),
}).passthrough();
const rangeQuestionSchema = z.object({
  id: z.string(),
  target: z.number(),
  values: z.array(z.number()).min(1),
  midIndex: z.number().int().nonnegative(),
  leftIndex: z.number().int().nonnegative().optional(),
  rightIndex: z.number().int().nonnegative().optional(),
  correctRegion: z.enum(["left", "center", "right"]),
}).passthrough().superRefine((question, context) => {
  if (question.midIndex >= question.values.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["midIndex"],
      message: "midIndex must point to an item in values",
    });
  }
  if (question.leftIndex !== undefined && question.leftIndex > question.midIndex) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["leftIndex"], message: "leftIndex must not exceed midIndex" });
  }
  if (question.rightIndex !== undefined && (question.rightIndex < question.midIndex || question.rightIndex >= question.values.length)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["rightIndex"], message: "rightIndex must contain midIndex and stay in values" });
  }
});
const arrayRegionSelectDataSchema = z.object({
  sequenceMode: z.enum(["QUESTIONS", "TRACE"]),
  rangeDecisionQuestions: z.array(rangeQuestionSchema).min(1),
}).passthrough();
const indexQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  values: z.array(z.number()).min(1),
  correctIndex: z.number().int(),
  leftIndex: z.number().int().nonnegative().optional(),
  rightIndex: z.number().int().nonnegative().optional(),
  midIndex: z.number().int().nonnegative().optional(),
  visiblePointers: z.array(z.enum(["left", "mid", "right"])).optional(),
}).passthrough().superRefine((question, context) => {
  const lastIndex = question.values.length - 1;
  const leftIndex = question.leftIndex ?? 0;
  const rightIndex = question.rightIndex ?? lastIndex;
  if (leftIndex > rightIndex || rightIndex > lastIndex) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["rightIndex"], message: "active index range must stay in values" });
  }
  if (question.correctIndex < leftIndex || question.correctIndex > rightIndex) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctIndex"], message: "correctIndex must be in the active range" });
  }
  if (question.midIndex !== undefined && question.midIndex > lastIndex) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["midIndex"], message: "midIndex must point to an item in values" });
  }
});
const indexSelectDataSchema = z.object({
  indexSelectionQuestions: z.array(indexQuestionSchema).min(1),
}).passthrough();
const orderedStepsDataSchema = z.object({
  steps: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).min(1),
}).passthrough();
const pairDecisionDataSchema = z.object({
  decisionPairs: z.array(z.object({
    id: z.string(),
    left: z.number(),
    right: z.number(),
    feedback: z.string().optional(),
  }).passthrough()).min(1).max(4),
  correctAnswers: z.record(z.enum(["swap", "keep"])),
}).passthrough().superRefine((data, context) => {
  for (const pair of data.decisionPairs) {
    if (!(pair.id in data.correctAnswers)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctAnswers", pair.id],
        message: "Every decision pair requires a correct answer",
      });
    }
  }
});
const choiceDataSchema = z.object({
  choices: z.array(z.object({
    id: z.string(),
    label: z.string(),
    isCorrect: z.boolean(),
    feedback: z.string().optional(),
  }).passthrough()).min(2),
}).passthrough();
const optionFillDataSchema = z.object({
  fillOptions: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).min(2),
  correctAnswers: z.string(),
}).passthrough();
const codeBlockBuilderDataSchema = z.object({
  codeBlocks: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).min(2),
  correctAnswers: z.array(z.string()).min(1),
}).passthrough();
const comparisonSequenceDataSchema = z.object({
  sequenceQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  }).passthrough()).min(1),
  correctAnswers: z.array(z.string()).min(1),
}).passthrough().superRefine((data, context) => {
  if (data.sequenceQuestions.length !== data.correctAnswers.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctAnswers"], message: "Each sequence question requires one correct answer" });
  }
});
const matchDataSchema = z.object({
  items: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).min(1),
  targets: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).min(1),
  answers: z.array(z.object({ targetId: z.string(), itemIds: z.array(z.string()).min(1) })).min(1),
}).passthrough();
const multiDecisionDataSchema = z.object({
  decisionPairs: z.array(z.object({ id: z.string() }).passthrough()).min(1),
  correctAnswers: z.record(z.string()),
}).passthrough();
const comparisonRuleDataSchema = z.object({
  explanation: z.string(),
  rule: z.string(),
  examples: z.array(z.object({
    title: z.string(),
    before: z.array(z.number()).min(2),
    after: z.array(z.number()).min(2),
    description: z.string(),
    didSwap: z.boolean(),
  })).min(2),
}).passthrough();
const pythonComparisonDataSchema = z.object({
  values: z.array(z.number()).min(2),
  comparisonCode: z.string(),
  explanation: z.string(),
}).passthrough();
const pythonSwapDataSchema = z.object({
  values: z.array(z.number()).min(2),
  swapCode: z.string(),
  resultValues: z.array(z.number()).min(2),
}).passthrough();
const sortOverviewDataSchema = z.object({
  beforeValues: z.array(z.number()).min(1),
  ascendingValues: z.array(z.number()).min(1),
  descendingValues: z.array(z.number()).min(1),
  finalExplanation: z.string(),
}).passthrough();
const valuesAndBodyDataSchema = z.object({
  values: z.array(z.number()).min(1),
  body: z.string(),
}).passthrough();
const valuesAndCodeDataSchema = z.object({
  values: z.array(z.number()).min(1),
  code: z.string(),
}).passthrough();
const onePassIncompleteDataSchema = z.object({
  beforeValues: z.array(z.number()).min(1),
  afterValues: z.array(z.number()).min(1),
  unsortedIndices: z.array(z.number().int().nonnegative()).min(1),
  confirmedIndices: z.array(z.number().int().nonnegative()),
}).passthrough();
const iLoopMappingDataSchema = z.object({
  values: z.array(z.number()).min(1),
  loopCode: z.string(),
  passMappings: z.array(z.object({ label: z.string(), i: z.number().int().nonnegative() })).min(1),
}).passthrough();
const nestedLoopDataSchema = z.object({
  values: z.array(z.number()).min(1),
  code: z.string(),
  loopMappings: z.array(z.object({ i: z.number().int().nonnegative(), js: z.array(z.number().int().nonnegative()) })).min(1),
  codeRoles: z.array(z.object({
    id: z.string(),
    label: z.string(),
    code: z.string(),
    role: z.string(),
    tone: z.enum(["blue", "green", "amber", "purple"]),
  })).min(1),
}).passthrough();
const rangeRedundancyDataSchema = z.object({
  initialValues: z.array(z.number()).min(1),
  afterFirstPass: z.array(z.number()).min(1),
  confirmedIndices: z.array(z.number().int().nonnegative()).min(1),
  comparisonPairs: z.array(z.tuple([z.number().int(), z.number().int()])).min(1),
}).passthrough();
const rangeByPassDataSchema = z.object({
  passRanges: z.array(z.object({
    label: z.string(),
    i: z.number().int().nonnegative(),
    values: z.array(z.number()).min(1),
    comparisonCount: z.number().int().nonnegative(),
    result: z.array(z.number()).min(1),
  }).passthrough()).min(1),
}).passthrough();
const rangeFormulaDataSchema = z.object({
  formula: z.string(),
  rows: z.array(z.object({
    label: z.string(),
    i: z.number().int().nonnegative(),
    expression: z.string(),
    result: z.number().int().nonnegative(),
  })).min(1),
}).passthrough();
const completeProcessDataSchema = z.object({
  processes: z.array(z.object({ code: z.string(), role: z.string() })).min(1),
  flow: z.array(z.string()).min(1),
}).passthrough();
const codeEditorDataSchema = z.object({
  starterCode: z.string(),
  evaluationMode: z.enum(["TEST_CASES", "TRANSCRIPTION"]),
}).passthrough();
const binaryArrayStateSchema = z.object({
  values: z.array(z.number()).min(1),
  leftIndex: z.number().int().nonnegative(),
  rightIndex: z.number().int().nonnegative(),
  midIndex: z.number().int().nonnegative().optional(),
}).passthrough();
const binaryCentralComparisonSchema = z.object({
  values: z.array(z.number()).min(1),
  target: z.number(),
  midIndex: z.number().int().nonnegative(),
  comparisonText: z.string(),
  nextRangeText: z.string(),
  comparisonRules: z.array(z.object({ condition: z.string(), result: z.string() })).min(1),
  pythonCode: z.string(),
  midNote: z.string(),
}).passthrough();
const binarySortedRequirementSchema = z.object({
  target: z.number(),
  sortedValues: z.array(z.number()).min(1),
  unsortedValues: z.array(z.number()).min(1),
  midIndex: z.number().int().nonnegative(),
  sortedExplanation: z.string(),
  unsortedExplanation: z.string(),
  premise: z.string(),
}).passthrough();
const binaryRangeUpdateSchema = z.object({
  examples: z.array(z.object({
    id: z.string(),
    title: z.string(),
    values: z.array(z.number()).min(1),
    leftIndex: z.number().int().nonnegative(),
    rightIndex: z.number().int().nonnegative(),
    midIndex: z.number().int().nonnegative(),
    text: z.string(),
    code: z.string(),
  }).passthrough()).min(1),
  sceneConclusion: z.string(),
}).passthrough();
const binaryEndingsSchema = z.object({
  examples: z.array(z.object({
    id: z.string(),
    title: z.string(),
    text: z.string(),
    code: z.string(),
  }).passthrough()).min(2),
}).passthrough();
const arrayTraceDataSchema = z.object({
  values: z.array(z.number()).min(1),
  steps: z.array(z.object({
    values: z.array(z.number()).optional(),
    comparingIndices: z.array(z.number().int()).optional(),
    swappingIndices: z.array(z.number().int()).optional(),
    confirmedIndices: z.array(z.number().int()).optional(),
    excludedIndices: z.array(z.number().int()).optional(),
    pointers: z.array(z.object({
      index: z.number().int(),
      label: z.string(),
      tone: z.enum(["primary", "secondary", "success", "warning"]).optional(),
    })).optional(),
    message: z.string(),
    activeCodeLines: z.array(z.number().int().positive()).optional(),
  }).passthrough()).min(1),
  code: z.string().optional(),
  finalMessage: z.string().optional(),
  intervalMs: z.number().int().positive().optional(),
}).passthrough();

export type ActivityAnswerRenderer =
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
  | "COMPARISON_SEQUENCE";

type RendererDefinition = {
  allowedTypes: readonly MissionActivityType[];
  dataSchema: z.ZodType<Record<string, unknown>>;
  answer: ActivityAnswerRenderer;
  visualization:
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
};

const defineRenderer = (
  allowedTypes: readonly MissionActivityType[],
  visualization: RendererDefinition["visualization"],
  dataSchema: z.ZodType<Record<string, unknown>> = rendererDataSchema,
  answer?: ActivityAnswerRenderer,
): RendererDefinition => ({
  allowedTypes,
  visualization,
  dataSchema,
  answer: answer ?? (
    allowedTypes[0] === MissionActivityType.CHOICE
      ? "SINGLE_CHOICE"
      : allowedTypes[0] === MissionActivityType.SELECT_FILL
        ? "OPTION_FILL"
        : allowedTypes[0] === MissionActivityType.ORDERED_STEPS
          ? "BLOCK_ORDER"
          : allowedTypes[0] === MissionActivityType.MATCH
            ? "MATCH"
            : allowedTypes[0] === MissionActivityType.TRY_CODE
              ? "CODE_EDITOR"
              : "NONE"
  ),
});

const VIEW = [MissionActivityType.VIEW] as const;
const CHOICE = [MissionActivityType.CHOICE] as const;
const SELECT_FILL = [MissionActivityType.SELECT_FILL] as const;
const ORDERED_STEPS = [MissionActivityType.ORDERED_STEPS] as const;
const MATCH = [MissionActivityType.MATCH] as const;
const TRY_CODE = [MissionActivityType.TRY_CODE] as const;

export const activityRendererRegistry = {
  TEXT: defineRenderer(VIEW, "NONE", textDataSchema),
  LEARNING_ROADMAP: defineRenderer(VIEW, "LEARNING_ROADMAP", learningRoadmapDataSchema),
  SORT_OVERVIEW: defineRenderer(VIEW, "SORT_OVERVIEW", sortOverviewDataSchema),
  ARRAY_TRACE: defineRenderer(VIEW, "ARRAY_TRACE", arrayTraceDataSchema),
  ARRAY_REGION_SELECT: defineRenderer(CHOICE, "NONE", arrayRegionSelectDataSchema, "ARRAY_REGION_SELECT"),
  INDEX_SELECT: defineRenderer(CHOICE, "NONE", indexSelectDataSchema, "INDEX_SELECT"),
  SINGLE_CHOICE: defineRenderer(CHOICE, "NONE", choiceDataSchema),
  BLOCK_ORDER: defineRenderer(ORDERED_STEPS, "NONE", orderedStepsDataSchema),
  CODE_FILL: defineRenderer(SELECT_FILL, "NONE", rendererDataSchema, "CODE_BLOCK_BUILDER"),
  MATCH: defineRenderer(MATCH, "NONE", matchDataSchema),
  CODE_EDITOR: defineRenderer(TRY_CODE, "NONE", codeEditorDataSchema),

  COMPARISON_RULE: defineRenderer(VIEW, "BUBBLE_MISSION_2", comparisonRuleDataSchema),
  PAIR_DECISION: defineRenderer(SELECT_FILL, "NONE", pairDecisionDataSchema, "PAIR_DECISION"),
  PYTHON_COMPARISON: defineRenderer(VIEW, "BUBBLE_MISSION_2", pythonComparisonDataSchema),
  CONDITION_FILL: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_2", optionFillDataSchema),
  PYTHON_SWAP: defineRenderer(VIEW, "BUBBLE_MISSION_2", pythonSwapDataSchema),
  SWAP_FILL: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_2", optionFillDataSchema),
  IF_SWAP_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_2", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),

  NEXT_PAIR_SEQUENCE: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_3", comparisonSequenceDataSchema, "COMPARISON_SEQUENCE"),
  J_POSITION_MAPPING: defineRenderer(VIEW, "BUBBLE_MISSION_3", valuesAndBodyDataSchema),
  J_PAIR_CHOICE: defineRenderer(CHOICE, "BUBBLE_MISSION_3", choiceDataSchema),
  ONE_PASS_LOOP: defineRenderer(VIEW, "BUBBLE_MISSION_3", valuesAndCodeDataSchema),
  ONE_PASS_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_3", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),
  ONE_PASS_RESULT: defineRenderer(CHOICE, "BUBBLE_MISSION_3", choiceDataSchema),

  ONE_PASS_INCOMPLETE: defineRenderer(VIEW, "BUBBLE_MISSION_4", onePassIncompleteDataSchema),
  SECOND_PASS_SEQUENCE: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_4", comparisonSequenceDataSchema, "COMPARISON_SEQUENCE"),
  I_LOOP_MAPPING: defineRenderer(VIEW, "BUBBLE_MISSION_4", iLoopMappingDataSchema),
  NESTED_LOOP_STRUCTURE: defineRenderer(VIEW, "BUBBLE_MISSION_4", nestedLoopDataSchema),
  MULTI_PASS_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_4", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),
  MULTI_PASS_RESULT: defineRenderer(CHOICE, "BUBBLE_MISSION_4", choiceDataSchema),

  RANGE_REDUNDANCY: defineRenderer(VIEW, "BUBBLE_MISSION_5", rangeRedundancyDataSchema),
  NEXT_ACTIVE_RANGE: defineRenderer(CHOICE, "BUBBLE_MISSION_5", choiceDataSchema),
  RANGE_BY_PASS: defineRenderer(VIEW, "BUBBLE_MISSION_5", rangeByPassDataSchema),
  RANGE_FORMULA: defineRenderer(VIEW, "BUBBLE_MISSION_5", rangeFormulaDataSchema),
  RANGE_FILL: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_5", optionFillDataSchema),
  OPTIMIZATION_COMPARE: defineRenderer(CHOICE, "BUBBLE_MISSION_5", choiceDataSchema),

  COMPLETE_PROCESS_REVIEW: defineRenderer(VIEW, "BUBBLE_MISSION_6", completeProcessDataSchema),
  LOOP_ROLE_REVIEW: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_6", multiDecisionDataSchema, "MULTI_DECISION"),
  EXECUTION_ORDER: defineRenderer(ORDERED_STEPS, "BUBBLE_MISSION_6", orderedStepsDataSchema),
  MISSING_CONDITION: defineRenderer(CHOICE, "BUBBLE_MISSION_6", choiceDataSchema),
  CODE_REPAIR: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_6", multiDecisionDataSchema, "MULTI_DECISION"),
  COMPLETE_CODE_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_MISSION_6", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),
  COMPLETE_CODE_MATCH: defineRenderer(MATCH, "BUBBLE_MISSION_6", matchDataSchema),

  BINARY_SEARCH_CENTRAL_COMPARISON: defineRenderer(VIEW, "BINARY_SEARCH", binaryCentralComparisonSchema),
  BINARY_SEARCH_SORTED_REQUIREMENT: defineRenderer(VIEW, "BINARY_SEARCH", binarySortedRequirementSchema),
  BINARY_SEARCH_INDEX_RANGE: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ pythonCode: z.string(), sceneConclusion: z.string() })),
  BINARY_SEARCH_MID_CALCULATION: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ midIndex: z.number().int().nonnegative(), formula: z.string(), pythonCode: z.string(), sceneConclusion: z.string() })),
  BINARY_SEARCH_RANGE_UPDATE: defineRenderer(VIEW, "BINARY_SEARCH", binaryRangeUpdateSchema),
  BINARY_SEARCH_RECALCULATE_MID: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ midIndex: z.number().int().nonnegative(), formula: z.string(), sceneConclusion: z.string() })),
  BINARY_SEARCH_ONE_ITERATION: defineRenderer(ORDERED_STEPS, "BINARY_SEARCH", orderedStepsDataSchema.extend({ values: z.array(z.number()).min(1), leftIndex: z.number().int().nonnegative(), rightIndex: z.number().int().nonnegative(), midIndex: z.number().int().nonnegative(), formula: z.string() })),
  BINARY_SEARCH_WHILE_LOOP: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ midIndex: z.number().int().nonnegative(), pythonCode: z.string() })),
  BINARY_SEARCH_ENDINGS: defineRenderer(VIEW, "BINARY_SEARCH", binaryEndingsSchema),
} satisfies Record<string, RendererDefinition>;

export type ActivityRendererKey = keyof typeof activityRendererRegistry;

export const getActivityRendererDefinition = (rendererKey: string) => {
  const definition = activityRendererRegistry[rendererKey as ActivityRendererKey];
  if (!definition) {
    throw new Error(`Unregistered activity renderer: ${rendererKey}`);
  }
  return definition;
};
