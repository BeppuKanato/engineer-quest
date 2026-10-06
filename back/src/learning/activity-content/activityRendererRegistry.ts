/**
 * rendererKeyごとに、許可するActivityタイプ、表示分類、回答方式、dataスキーマを登録する。
 * Mission API、採点、seed検証が同じ定義を参照し、Course IDによる分岐を作らないための中心表。
 */
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
const orderedStepsBaseDataSchema = z.object({
  steps: z.array(z.object({ id: z.string(), label: z.string() }).passthrough()).min(1),
  answerOrder: z.array(z.string()).min(1),
}).passthrough();
const orderedStepsDataSchema = orderedStepsBaseDataSchema.superRefine((data, context) => {
  const stepIds = data.steps.map((step) => step.id);
  const answerIds = data.answerOrder;
  if (new Set(stepIds).size !== stepIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps"], message: "step ids must be unique" });
  }
  if (
    answerIds.length !== stepIds.length ||
    new Set(answerIds).size !== answerIds.length ||
    answerIds.some((id) => !stepIds.includes(id))
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["answerOrder"], message: "answerOrder must contain every step id exactly once" });
  }
});
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
const sequentialChoiceDataSchema = z.object({
  sequenceQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  }).passthrough()).min(1).max(4),
  correctAnswers: z.array(z.string()).min(1),
}).passthrough().superRefine((data, context) => {
  if (data.sequenceQuestions.length !== data.correctAnswers.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctAnswers"], message: "Each question requires one correct answer" });
  }
  data.correctAnswers.forEach((answerId, index) => {
    if (!data.sequenceQuestions[index]?.options.some((option) => option.id === answerId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctAnswers", index], message: "Correct answer must reference an option" });
    }
  });
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
  forbiddenCode: z.array(z.object({
    snippet: z.string().min(1),
    label: z.string().min(1),
  }).strict()).optional(),
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
      nextLabel: z.string().optional(),
  }).passthrough()).min(1),
  code: z.string().optional(),
  finalMessage: z.string().optional(),
  intervalMs: z.number().int().positive().optional(),
}).passthrough();
const divideCombineTraceDataSchema = z.object({
  levels: z.array(z.object({
    label: z.string().min(1),
    phase: z.enum(["DIVIDE", "COMBINE"]),
    groups: z.array(z.array(z.number()).min(1)).min(1),
    message: z.string().min(1),
    nextLabel: z.string().optional(),
  }).passthrough()).min(1),
  intervalMs: z.number().int().positive().optional(),
  finalMessage: z.string().optional(),
}).passthrough();
const twoListMergeTraceDataSchema = z.object({
  left: z.array(z.number()).min(1),
  right: z.array(z.number()).min(1),
  steps: z.array(z.object({
    leftIndex: z.number().int().nonnegative(),
    rightIndex: z.number().int().nonnegative(),
    result: z.array(z.number()),
    message: z.string().min(1),
    nextLabel: z.string().optional(),
  }).passthrough()).min(1),
  intervalMs: z.number().int().positive().optional(),
  finalMessage: z.string().optional(),
  showVariableNames: z.boolean().optional(),
}).passthrough().superRefine((data, context) => {
  data.steps.forEach((step, index) => {
    if (step.leftIndex > data.left.length || step.rightIndex > data.right.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Merge pointers must stay within or immediately after their list" });
    }
  });
});
const graphNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
const graphEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});
const graphStepSchema = z.object({
  currentNode: z.string().optional(),
  inspectingNode: z.string().optional(),
  queue: z.array(z.string()),
  discoveredNodes: z.array(z.string()),
  processedNodes: z.array(z.string()),
  distances: z.record(z.number().int().nonnegative()).optional(),
  activeEdge: z.object({ from: z.string(), to: z.string() }).optional(),
  message: z.string().min(1),
  nextLabel: z.string().optional(),
  activeCodeLines: z.array(z.number().int().positive()).optional(),
}).passthrough();
const graphTraceDataSchema = z.object({
  nodes: z.array(graphNodeSchema).min(1),
  edges: z.array(graphEdgeSchema),
  steps: z.array(graphStepSchema).min(1),
  adjacency: z.record(z.array(z.string())).optional(),
  code: z.string().optional(),
  finalMessage: z.string().optional(),
  intervalMs: z.number().int().positive().optional(),
  showQueue: z.boolean().optional(),
  showDistances: z.boolean().optional(),
  currentNodeLabel: z.string().min(1).optional(),
  waitingNodeLabel: z.string().min(1).optional(),
  containerLabel: z.string().min(1).optional(),
  containerLeadingLabel: z.string().min(1).optional(),
  containerTrailingLabel: z.string().min(1).optional(),
  activeContainerItem: z.enum(["FIRST", "LAST"]).optional(),
}).passthrough().superRefine((data, context) => {
  const nodeIds = new Set(data.nodes.map((node) => node.id));
  if (nodeIds.size !== data.nodes.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["nodes"], message: "Graph node ids must be unique" });
  }
  data.edges.forEach((edge, index) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["edges", index], message: "Graph edges must reference existing nodes" });
    }
  });
  data.steps.forEach((step, index) => {
    const referenced = [
      step.currentNode,
      step.inspectingNode,
      step.activeEdge?.from,
      step.activeEdge?.to,
      ...step.queue,
      ...step.discoveredNodes,
      ...step.processedNodes,
      ...Object.keys(step.distances ?? {}),
    ]
      .filter((value): value is string => typeof value === "string");
    if (referenced.some((id) => !nodeIds.has(id))) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Graph steps must reference existing nodes" });
    }
  });
  Object.entries(data.adjacency ?? {}).forEach(([id, neighbors]) => {
    if (!nodeIds.has(id) || neighbors.some((neighbor) => !nodeIds.has(neighbor))) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["adjacency", id], message: "Graph adjacency must reference existing nodes" });
    }
  });
});
const codeStateMappingDataSchema = z.object({
  code: z.string().min(1),
  mappings: z.array(z.object({
    id: z.string(),
    label: z.string(),
    lines: z.array(z.number().int().positive()).min(1),
    role: z.string(),
    state: z.string(),
  }).passthrough()).min(1),
}).passthrough().superRefine((data, context) => {
  const lineCount = data.code.split("\n").length;
  data.mappings.forEach((mapping, mappingIndex) => {
    mapping.lines.forEach((line, lineIndex) => {
      if (line > lineCount) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["mappings", mappingIndex, "lines", lineIndex], message: "Mapped line must exist in code" });
      }
    });
  });
});
const stringAlignmentStepSchema = z.object({
  textIndex: z.number().int().nonnegative(),
  patternIndex: z.number().int().nonnegative(),
  patternStart: z.number().int().nonnegative(),
  matchedPatternIndices: z.array(z.number().int().nonnegative()).optional(),
  mismatch: z.boolean().optional(),
  message: z.string(),
  activeCodeLines: z.array(z.number().int().positive()).optional(),
  fallbackFromLength: z.number().int().positive().optional(),
  fallbackLookupIndex: z.number().int().nonnegative().optional(),
  fallbackValue: z.number().int().nonnegative().optional(),
}).passthrough();
const stringAlignmentTraceDataSchema = z.object({
  text: z.string().min(1),
  pattern: z.string().min(1),
  lps: z.array(z.number().int().nonnegative()).optional(),
  steps: z.array(stringAlignmentStepSchema).min(1),
  code: z.string().optional(),
  finalMessage: z.string().optional(),
  intervalMs: z.number().int().positive().optional(),
}).passthrough().superRefine((data, context) => {
  if (data.lps && data.lps.length !== data.pattern.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["lps"], message: "LPS length must match pattern length" });
  }
  data.steps.forEach((step, index) => {
    if (step.textIndex > data.text.length || step.patternIndex > data.pattern.length || step.patternStart > data.text.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Alignment indices must stay in text and pattern" });
    }
    if (step.matchedPatternIndices?.some((matchedIndex) => matchedIndex >= data.pattern.length)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index, "matchedPatternIndices"], message: "Matched indices must stay in pattern" });
    }
  });
});
const prefixComparisonCandidateSchema = z.object({
  prefix: z.string(),
  suffix: z.string(),
  length: z.number().int().positive(),
  isMatch: z.boolean(),
});
const prefixSuffixExplanationDataSchema = z.object({
  presentationMode: z.enum(["CALCULATION", "TERMS", "REUSE", "LENGTHS", "RULE"]),
  pattern: z.string().min(1),
  rangeLength: z.number().int().positive(),
  candidates: z.array(prefixComparisonCandidateSchema).min(1),
  longest: z.string(),
  longestLength: z.number().int().nonnegative(),
  showRulePhase: z.boolean().optional(),
}).passthrough().superRefine((data, context) => {
  const candidateLengths = data.candidates.map((candidate) => candidate.length);
  const expectedLengths = Array.from({ length: Math.max(data.rangeLength - 1, 0) }, (_, index) => index + 1);
  const longestMatch = Math.max(0, ...data.candidates.filter((candidate) => candidate.isMatch).map((candidate) => candidate.length));
  if (data.rangeLength > data.pattern.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["rangeLength"], message: "Prefix comparison range must stay within the pattern" });
  }
  if (
    data.presentationMode === "CALCULATION"
    && [...candidateLengths].sort((left, right) => left - right).join(",") !== expectedLengths.join(",")
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["candidates"], message: "Calculation must include x = 1 through m - 1 exactly once" });
  }
  if (data.presentationMode === "TERMS" && (data.candidates.length !== 1 || !data.candidates[0]?.isMatch)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["candidates"], message: "Terms presentation must use one matching prefix and suffix example" });
  }
  if (data.presentationMode === "REUSE") {
    const uniqueLengths = new Set(candidateLengths);
    if (
      uniqueLengths.size !== candidateLengths.length
      || candidateLengths.some((length) => length < 1 || length >= data.rangeLength)
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["candidates"], message: "Reuse candidates must use unique lengths between 1 and m - 1" });
    }
  }
  if (longestMatch !== data.longestLength) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["longestLength"], message: "Longest length must be the largest matching x" });
  }
  data.candidates.forEach((candidate, index) => {
    if (
      candidate.prefix.length !== candidate.length
      || candidate.suffix.length !== candidate.length
      || candidate.prefix !== data.pattern.slice(0, candidate.length)
      || candidate.suffix !== data.pattern.slice(data.rangeLength - candidate.length, data.rangeLength)
      || candidate.isMatch !== (candidate.prefix === candidate.suffix)
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["candidates", index], message: "Prefix candidate must use the actual first and last x characters and declare the actual result" });
    }
  });
});
const prefixTableStepSchema = z.object({
  index: z.number().int().nonnegative().optional(),
  length: z.number().int().nonnegative().optional(),
  lengthAfter: z.number().int().nonnegative().optional(),
  nextIndex: z.number().int().nonnegative().optional(),
  action: z.enum(["EXTEND", "FALLBACK", "RECORD_ZERO"]).optional(),
  endIndex: z.number().int().nonnegative().optional(),
  rangeLength: z.number().int().positive().optional(),
  overlapLength: z.number().int().nonnegative().optional(),
  overlapText: z.string().optional(),
  candidates: z.array(prefixComparisonCandidateSchema).optional(),
  lps: z.array(z.number().int().nonnegative().nullable()).min(1),
  message: z.string(),
  activeCodeLines: z.array(z.number().int().positive()).optional(),
  phase: z.enum(["COMPARE", "FALLBACK", "RECORDED"]).optional(),
  comparisonResult: z.enum(["MATCH", "MISMATCH"]).optional(),
  fallbackFromLength: z.number().int().positive().optional(),
  fallbackLookupIndex: z.number().int().nonnegative().optional(),
  fallbackValue: z.number().int().nonnegative().optional(),
}).passthrough();
const prefixTableTraceDataSchema = z.object({
  pattern: z.string().min(1),
  mode: z.enum(["MEANING", "BUILD"]).optional(),
  steps: z.array(prefixTableStepSchema).min(1),
  code: z.string().optional(),
  finalMessage: z.string().optional(),
  intervalMs: z.number().int().positive().optional(),
}).passthrough().superRefine((data, context) => {
  data.steps.forEach((step, index) => {
    if (step.lps.length !== data.pattern.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Prefix table state must match pattern length" });
    }
    if (data.mode === "MEANING") {
      if (
        step.endIndex == null
        || step.rangeLength == null
        || step.overlapLength == null
        || step.candidates == null
        || step.endIndex >= data.pattern.length
        || step.rangeLength !== step.endIndex + 1
        || step.overlapLength > step.endIndex + 1
      ) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Prefix meaning step requires m, x candidates, endIndex, and overlapLength" });
        return;
      }
      const rangeLength = step.rangeLength;
      const candidateLengths = step.candidates.map((candidate) => candidate.length);
      const expectedLengths = Array.from({ length: Math.max(rangeLength - 1, 0) }, (_, candidateIndex) => candidateIndex + 1);
      const longestMatch = Math.max(0, ...step.candidates.filter((candidate) => candidate.isMatch).map((candidate) => candidate.length));
      if (
        [...candidateLengths].sort((left, right) => left - right).join(",") !== expectedLengths.join(",")
        || longestMatch !== step.overlapLength
      ) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index, "candidates"], message: "Meaning step must compare every x from 1 through m - 1 and choose the largest match" });
      }
      step.candidates.forEach((candidate, candidateIndex) => {
        if (
          candidate.prefix.length !== candidate.length
          || candidate.suffix.length !== candidate.length
          || candidate.prefix !== data.pattern.slice(0, candidate.length)
          || candidate.suffix !== data.pattern.slice(rangeLength - candidate.length, rangeLength)
          || candidate.isMatch !== (candidate.prefix === candidate.suffix)
        ) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index, "candidates", candidateIndex], message: "Meaning candidate must use the actual first and last x characters and declare the actual result" });
        }
      });
      if (step.overlapText !== data.pattern.slice(0, step.overlapLength)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index, "overlapText"], message: "Overlap text must match the largest successful x" });
      }
      return;
    }
    if (
      step.index == null
      || step.length == null
      || step.index > data.pattern.length
      || step.length > data.pattern.length
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Prefix build step requires a valid index and length" });
    }
    if (step.action != null) {
      const transitionIsComplete = step.lengthAfter != null && step.nextIndex != null;
      const validTransition = transitionIsComplete && (
        (step.action === "EXTEND"
          && step.comparisonResult === "MATCH"
          && step.lengthAfter === (step.length ?? 0) + 1
          && step.nextIndex === (step.index ?? 0) + 1
          && step.lps[step.index ?? -1] === step.lengthAfter)
        || (step.action === "FALLBACK"
          && step.comparisonResult === "MISMATCH"
          && step.lengthAfter! < (step.length ?? 0)
          && step.nextIndex === step.index
          && step.lps[step.index ?? -1] == null)
        || (step.action === "RECORD_ZERO"
          && step.comparisonResult === "MISMATCH"
          && step.length === 0
          && step.lengthAfter === 0
          && step.nextIndex === (step.index ?? 0) + 1
          && step.lps[step.index ?? -1] === 0)
      );
      if (!validTransition) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index],
          message: "Prefix build transition must describe one valid comparison and its resulting update",
        });
      }
    }
    const fallbackFromLength = step.fallbackFromLength;
    const fallbackLookupIndex = step.fallbackLookupIndex;
    const fallbackValue = step.fallbackValue;
    const hasAnyFallbackValue = [fallbackFromLength, fallbackLookupIndex, fallbackValue]
      .some((value) => value != null);
    if (hasAnyFallbackValue) {
      const validFallback = typeof fallbackFromLength === "number"
        && typeof fallbackLookupIndex === "number"
        && typeof fallbackValue === "number"
        && fallbackLookupIndex === fallbackFromLength - 1
        && fallbackValue < fallbackFromLength
        && step.lps[fallbackLookupIndex] === fallbackValue;
      if (!validFallback) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["steps", index], message: "Fallback must read LPS[old length - 1] and use its value as the shorter candidate length" });
      }
    }
  });
});
const stringSearchDecisionStateSchema = z.object({
  text: z.string().min(1),
  pattern: z.string().min(1),
  textIndex: z.number().int().nonnegative(),
  patternIndex: z.number().int().nonnegative(),
  patternStart: z.number().int().nonnegative(),
  lps: z.array(z.number().int().nonnegative()).optional(),
  matchedPatternIndices: z.array(z.number().int().nonnegative()).optional(),
  mismatch: z.boolean().optional(),
  message: z.string(),
}).passthrough().superRefine((state, context) => {
  if (state.textIndex > state.text.length || state.patternIndex > state.pattern.length || state.patternStart > state.text.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Decision indices must stay in text and pattern" });
  }
  if (state.lps && state.lps.length !== state.pattern.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["lps"], message: "LPS length must match pattern length" });
  }
});
const stringSearchDecisionSequenceDataSchema = z.object({
  sequenceQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  }).passthrough()).min(1).max(4),
  correctAnswers: z.array(z.string()).min(1),
  visualizationStates: z.array(stringSearchDecisionStateSchema).min(1).max(4),
}).passthrough().superRefine((data, context) => {
  if (data.visualizationStates.length !== data.sequenceQuestions.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["visualizationStates"],
      message: "Each question requires one visualization state",
    });
  }
  if (data.correctAnswers.length !== data.sequenceQuestions.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["correctAnswers"],
      message: "Each question requires one correct answer",
    });
  }
  data.correctAnswers.forEach((answerId, index) => {
    if (!data.sequenceQuestions[index]?.options.some((option) => option.id === answerId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctAnswers", index], message: "Correct answer must reference an option" });
    }
  });
});

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
  DIVIDE_COMBINE_TRACE: defineRenderer(VIEW, "DIVIDE_COMBINE_TRACE", divideCombineTraceDataSchema),
  TWO_LIST_MERGE_TRACE: defineRenderer(VIEW, "TWO_LIST_MERGE_TRACE", twoListMergeTraceDataSchema),
  GRAPH_TRACE: defineRenderer(VIEW, "GRAPH", graphTraceDataSchema),
  GRAPH_CHOICE: defineRenderer(CHOICE, "GRAPH", graphTraceDataSchema.and(choiceDataSchema), "SINGLE_CHOICE"),
  CODE_STATE_MAPPING: defineRenderer(VIEW, "CODE_MAPPING", codeStateMappingDataSchema),
  ARRAY_REGION_SELECT: defineRenderer(CHOICE, "NONE", arrayRegionSelectDataSchema, "ARRAY_REGION_SELECT"),
  INDEX_SELECT: defineRenderer(CHOICE, "NONE", indexSelectDataSchema, "INDEX_SELECT"),
  SINGLE_CHOICE: defineRenderer(CHOICE, "NONE", choiceDataSchema),
  BLOCK_ORDER: defineRenderer(ORDERED_STEPS, "NONE", orderedStepsDataSchema),
  CODE_FILL: defineRenderer(SELECT_FILL, "NONE", rendererDataSchema, "CODE_BLOCK_BUILDER"),
  MATCH: defineRenderer(MATCH, "NONE", matchDataSchema),
  CODE_EDITOR: defineRenderer(TRY_CODE, "NONE", codeEditorDataSchema),
  SEQUENTIAL_CHOICE: defineRenderer(SELECT_FILL, "NONE", sequentialChoiceDataSchema, "COMPARISON_SEQUENCE"),

  STRING_ALIGNMENT_TRACE: defineRenderer(VIEW, "STRING_SEARCH", stringAlignmentTraceDataSchema),
  PREFIX_SUFFIX_EXPLANATION: defineRenderer(VIEW, "STRING_SEARCH", prefixSuffixExplanationDataSchema),
  PREFIX_TABLE_TRACE: defineRenderer(VIEW, "STRING_SEARCH", prefixTableTraceDataSchema),
  STRING_SEARCH_FALLBACK_TRACE: defineRenderer(VIEW, "STRING_SEARCH", stringAlignmentTraceDataSchema),
  STRING_SEARCH_DECISION_SEQUENCE: defineRenderer(SELECT_FILL, "STRING_SEARCH", stringSearchDecisionSequenceDataSchema, "COMPARISON_SEQUENCE"),
  STRING_SEARCH_FULL_TRACE: defineRenderer(VIEW, "STRING_SEARCH", stringAlignmentTraceDataSchema),

  COMPARISON_RULE: defineRenderer(VIEW, "BUBBLE_COMPARISON", comparisonRuleDataSchema),
  PAIR_DECISION: defineRenderer(SELECT_FILL, "NONE", pairDecisionDataSchema, "PAIR_DECISION"),
  PYTHON_COMPARISON: defineRenderer(VIEW, "BUBBLE_COMPARISON", pythonComparisonDataSchema),
  CONDITION_FILL: defineRenderer(SELECT_FILL, "BUBBLE_COMPARISON", optionFillDataSchema),
  PYTHON_SWAP: defineRenderer(VIEW, "BUBBLE_COMPARISON", pythonSwapDataSchema),
  SWAP_FILL: defineRenderer(SELECT_FILL, "BUBBLE_COMPARISON", optionFillDataSchema),
  IF_SWAP_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_COMPARISON", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),

  NEXT_PAIR_SEQUENCE: defineRenderer(SELECT_FILL, "BUBBLE_ONE_PASS", comparisonSequenceDataSchema, "COMPARISON_SEQUENCE"),
  J_POSITION_MAPPING: defineRenderer(VIEW, "BUBBLE_ONE_PASS", valuesAndBodyDataSchema),
  J_PAIR_CHOICE: defineRenderer(CHOICE, "BUBBLE_ONE_PASS", choiceDataSchema),
  ONE_PASS_LOOP: defineRenderer(VIEW, "BUBBLE_ONE_PASS", valuesAndCodeDataSchema),
  ONE_PASS_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_ONE_PASS", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),
  ONE_PASS_RESULT: defineRenderer(CHOICE, "BUBBLE_ONE_PASS", choiceDataSchema),

  ONE_PASS_INCOMPLETE: defineRenderer(VIEW, "BUBBLE_MULTI_PASS", onePassIncompleteDataSchema),
  SECOND_PASS_SEQUENCE: defineRenderer(SELECT_FILL, "BUBBLE_MULTI_PASS", comparisonSequenceDataSchema, "COMPARISON_SEQUENCE"),
  I_LOOP_MAPPING: defineRenderer(VIEW, "BUBBLE_MULTI_PASS", iLoopMappingDataSchema),
  NESTED_LOOP_STRUCTURE: defineRenderer(VIEW, "BUBBLE_MULTI_PASS", nestedLoopDataSchema),
  MULTI_PASS_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_MULTI_PASS", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),
  MULTI_PASS_RESULT: defineRenderer(CHOICE, "BUBBLE_MULTI_PASS", choiceDataSchema),

  RANGE_REDUNDANCY: defineRenderer(VIEW, "BUBBLE_RANGE_OPTIMIZATION", rangeRedundancyDataSchema),
  NEXT_ACTIVE_RANGE: defineRenderer(CHOICE, "BUBBLE_RANGE_OPTIMIZATION", choiceDataSchema),
  RANGE_BY_PASS: defineRenderer(VIEW, "BUBBLE_RANGE_OPTIMIZATION", rangeByPassDataSchema),
  RANGE_FORMULA: defineRenderer(VIEW, "BUBBLE_RANGE_OPTIMIZATION", rangeFormulaDataSchema),
  RANGE_FILL: defineRenderer(SELECT_FILL, "BUBBLE_RANGE_OPTIMIZATION", optionFillDataSchema),
  OPTIMIZATION_COMPARE: defineRenderer(CHOICE, "BUBBLE_RANGE_OPTIMIZATION", choiceDataSchema),

  COMPLETE_PROCESS_REVIEW: defineRenderer(VIEW, "BUBBLE_COMPLETION", completeProcessDataSchema),
  LOOP_ROLE_REVIEW: defineRenderer(SELECT_FILL, "BUBBLE_COMPLETION", multiDecisionDataSchema, "MULTI_DECISION"),
  EXECUTION_ORDER: defineRenderer(ORDERED_STEPS, "BUBBLE_COMPLETION", orderedStepsDataSchema),
  MISSING_CONDITION: defineRenderer(CHOICE, "BUBBLE_COMPLETION", choiceDataSchema),
  CODE_REPAIR: defineRenderer(SELECT_FILL, "BUBBLE_COMPLETION", multiDecisionDataSchema, "MULTI_DECISION"),
  COMPLETE_CODE_BUILD: defineRenderer(SELECT_FILL, "BUBBLE_COMPLETION", codeBlockBuilderDataSchema, "CODE_BLOCK_BUILDER"),
  COMPLETE_CODE_MATCH: defineRenderer(MATCH, "BUBBLE_COMPLETION", matchDataSchema),

  BINARY_SEARCH_CENTRAL_COMPARISON: defineRenderer(VIEW, "BINARY_SEARCH", binaryCentralComparisonSchema),
  BINARY_SEARCH_SORTED_REQUIREMENT: defineRenderer(VIEW, "BINARY_SEARCH", binarySortedRequirementSchema),
  BINARY_SEARCH_INDEX_RANGE: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ pythonCode: z.string(), sceneConclusion: z.string() })),
  BINARY_SEARCH_MID_CALCULATION: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ midIndex: z.number().int().nonnegative(), formula: z.string(), pythonCode: z.string(), sceneConclusion: z.string() })),
  BINARY_SEARCH_RANGE_UPDATE: defineRenderer(VIEW, "BINARY_SEARCH", binaryRangeUpdateSchema),
  BINARY_SEARCH_RECALCULATE_MID: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ midIndex: z.number().int().nonnegative(), formula: z.string(), sceneConclusion: z.string() })),
  BINARY_SEARCH_ONE_ITERATION: defineRenderer(ORDERED_STEPS, "BINARY_SEARCH", orderedStepsBaseDataSchema.extend({ values: z.array(z.number()).min(1), leftIndex: z.number().int().nonnegative(), rightIndex: z.number().int().nonnegative(), midIndex: z.number().int().nonnegative(), formula: z.string() })),
  BINARY_SEARCH_WHILE_LOOP: defineRenderer(VIEW, "BINARY_SEARCH", binaryArrayStateSchema.extend({ midIndex: z.number().int().nonnegative(), pythonCode: z.string() })),
  BINARY_SEARCH_ENDINGS: defineRenderer(VIEW, "BINARY_SEARCH", binaryEndingsSchema),
} satisfies Record<string, RendererDefinition>;

export type ActivityRendererKey = keyof typeof activityRendererRegistry;

/** rendererKeyを採点方式・表示分類・dataスキーマへ解決する唯一の入口。 */
export const getActivityRendererDefinition = (rendererKey: string) => {
  const definition = activityRendererRegistry[rendererKey as ActivityRendererKey];
  if (!definition) {
    throw new Error(`Unregistered activity renderer: ${rendererKey}`);
  }
  return definition;
};
