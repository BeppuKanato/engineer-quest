import { z } from "zod";
import type { MissionActivityType } from "@prisma/client";
import { getActivityRendererDefinition } from "./activityRendererRegistry";

export const activityLearningRoleSchema = z.enum([
  "ORIENTATION",
  "EXPLANATION",
  "GUIDED_PRACTICE",
  "INDEPENDENT_PRACTICE",
  "CODE_MAPPING",
  "SYNTHESIS",
  "MISSION_CHECK",
  "COURSE_EXAM",
]);

export const activityFeedbackPolicySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("NONE") }).strict(),
  z.object({
    mode: z.literal("RETRY_WITH_HINT"),
    revealAfterAttempts: z.number().int().positive(),
  }).strict(),
]);

export const activityContentSchema = z.object({
  learningRole: activityLearningRoleSchema,
  rendererKey: z.string().min(1),
  feedbackPolicy: activityFeedbackPolicySchema,
  data: z.record(z.unknown()),
}).strict();

export type ActivityLearningRole = z.infer<typeof activityLearningRoleSchema>;
export type ActivityFeedbackPolicy = z.infer<typeof activityFeedbackPolicySchema>;
export type ActivityContent = z.infer<typeof activityContentSchema>;

export const parseActivityContent = (
  value: unknown,
  activityType?: MissionActivityType,
): ActivityContent => {
  const content = activityContentSchema.parse(value);
  const renderer = getActivityRendererDefinition(content.rendererKey);
  renderer.dataSchema.parse(content.data);

  if (activityType && !renderer.allowedTypes.includes(activityType)) {
    throw new Error(
      `Renderer ${content.rendererKey} cannot be used with activity type ${activityType}`,
    );
  }

  return content;
};
