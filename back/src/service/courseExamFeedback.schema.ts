import { z } from "zod";

export const COURSE_EXAM_FEEDBACK_ACTION_TYPES = [
  "RETRY_COURSE_EXAM",
  "SOLVE_PRACTICE_PROBLEM",
  "CREATE_LEARNING_MEMO",
  "CREATE_QUESTION_POST",
  "CREATE_ERROR_HELP_POST",
  "CREATE_WORK_POST",
  "VIEW_BOARD_POSTS",
  "ANSWER_BOARD_POST",
  "REVIEW_KNOWLEDGE_CARDS",
  "VIEW_ACHIEVEMENTS",
  "SET_TARGET_ACHIEVEMENT",
  "USE_BADGE_TICKET",
  "VIEW_BADGE_COLLECTION",
  "SET_PROFILE_BADGE",
  "VIEW_PROFILE",
  "NO_APP_ACTION",
] as const;

const nonEmptyText = z.string().trim().min(1);

const selectionAnalysisBase = z.object({
  consideredActions: z.array(
    z.object({ action: nonEmptyText, reason: nonEmptyText })
  ),
  selectedActionReason: nonEmptyText,
  usedAppState: z.array(nonEmptyText),
});

const courseExamFeedbackBase = z.object({
  currentState: nonEmptyText,
  nextGoal: nonEmptyText,
  nextStep: nonEmptyText,
  actionType: z.enum(COURSE_EXAM_FEEDBACK_ACTION_TYPES),
  actionLabel: nonEmptyText,
  learningAnalysis: z.object({
    achieved: z.array(nonEmptyText),
    likelyDifficulties: z.array(
      z.object({
        description: nonEmptyText,
        evidence: z.array(nonEmptyText),
        confidence: z.enum(["high", "medium", "low"]),
      })
    ),
    learningProcess: nonEmptyText,
    nextLearningNeed: nonEmptyText,
  }),
});

export const standardCourseExamFeedbackSchema = courseExamFeedbackBase.extend({
  selectionAnalysis: selectionAnalysisBase.extend({
    personalizationAdjustment: z.null(),
  }),
});

export const personalizedCourseExamFeedbackSchema =
  courseExamFeedbackBase.extend({
    selectionAnalysis: selectionAnalysisBase.extend({
      personalizationAdjustment: nonEmptyText,
    }),
  });

export const courseExamFeedbackSchema = courseExamFeedbackBase.extend({
  selectionAnalysis: selectionAnalysisBase.extend({
    personalizationAdjustment: nonEmptyText.nullable(),
  }),
});

export type GeneratedCourseExamFeedback = z.infer<
  typeof courseExamFeedbackSchema
>;

export type CourseExamFeedbackActionType =
  (typeof COURSE_EXAM_FEEDBACK_ACTION_TYPES)[number];
