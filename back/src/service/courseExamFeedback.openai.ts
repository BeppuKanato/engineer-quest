import { FeedbackCondition } from "@prisma/client";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AutoParseableTextFormat } from "openai/lib/parser";
import type { ZodTypeAny } from "zod";

import {
  personalizedCourseExamFeedbackSchema,
  standardCourseExamFeedbackSchema,
  type GeneratedCourseExamFeedback,
} from "./courseExamFeedback.schema";

export const getCourseExamFeedbackModel = () =>
  process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini";

export type CourseExamFeedbackGenerationResult = {
  feedback: GeneratedCourseExamFeedback;
  responseId: string;
  model: string;
  usage: unknown;
};

export type CourseExamFeedbackGenerator = (
  prompt: string,
  condition: FeedbackCondition
) => Promise<CourseExamFeedbackGenerationResult>;

let client: OpenAI | null = null;
const makeTextFormat = zodTextFormat as unknown as (
  schema: ZodTypeAny,
  name: string
) => AutoParseableTextFormat<unknown>;
const standardFeedbackTextFormat = makeTextFormat(
  standardCourseExamFeedbackSchema,
  "course_exam_feedback"
);
const personalizedFeedbackTextFormat = makeTextFormat(
  personalizedCourseExamFeedbackSchema,
  "course_exam_feedback"
);

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  client ??= new OpenAI({ apiKey, timeout: 60_000, maxRetries: 2 });
  return client;
};

export const generateCourseExamFeedbackWithOpenAI: CourseExamFeedbackGenerator =
  async (prompt, condition) => {
    const isPersonalized = condition === FeedbackCondition.PERSONALIZED;
    const schema = isPersonalized
      ? personalizedCourseExamFeedbackSchema
      : standardCourseExamFeedbackSchema;
    const response = await getClient().responses.parse({
      model: getCourseExamFeedbackModel(),
      input: prompt,
      reasoning: { effort: "medium" },
      text: {
        format: isPersonalized
          ? personalizedFeedbackTextFormat
          : standardFeedbackTextFormat,
      },
    });
    if (!response.output_parsed) {
      throw new Error("OpenAI response did not contain parsed feedback");
    }
    return {
      feedback: schema.parse(response.output_parsed),
      responseId: response.id,
      model: response.model,
      usage: response.usage ?? null,
    };
  };
