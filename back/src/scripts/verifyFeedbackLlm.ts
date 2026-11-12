import "dotenv/config";
import { readFile } from "node:fs/promises";
import {
  analysisPrompt,
  analysisSchema,
  selectionPrompt,
  openAiCall,
  type Input,
} from "../service/feedbackV1.engine";

type Stage = "analysis" | "selection";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(path: string): Promise<unknown> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text.replace(/^\uFEFF/, "")) as unknown;
}

function parseInput(value: unknown): Input {
  // FeedbackV1レコード全体を渡した場合は、そのinputを使う。
  const input =
    isObject(value) && isObject(value.input) ? value.input : value;

  if (
    !isObject(input) ||
    !("learning" in input) ||
    !("state" in input) ||
    !Array.isArray(input.actions) ||
    !isObject(input.targets) ||
    !("hexad" in input) ||
    !("bigGoal" in input)
  ) {
    throw new Error(
      "入力JSONには Input 全体が必要です。" +
      "learning / state / actions / targets / hexad / bigGoal を確認してください。",
    );
  }

  return input as unknown as Input;
}

function unwrapAnalysis(value: unknown): unknown {
  if (!isObject(value)) return value;

  // このスクリプトの出力、または保存済みの生成結果に対応。
  if ("output" in value) return value.output;
  if ("analysis" in value) return value.analysis;

  // FeedbackV1Callのdataを含むログに対応。
  if (isObject(value.data) && "output" in value.data) {
    return value.data.output;
  }

  return value;
}

async function main(): Promise<void> {
  const [stageArg, inputPath, analysisPath] = process.argv.slice(2);

  if (
    (stageArg !== "analysis" && stageArg !== "selection") ||
    !inputPath ||
    (stageArg === "selection" && !analysisPath)
  ) {
    throw new Error(
      [
        "使い方:",
        "  npx ts-node src/scripts/verifyFeedbackLlm.ts analysis input.json",
        "  npx ts-node src/scripts/verifyFeedbackLlm.ts selection input.json analysis.json",
      ].join("\n"),
    );
  }

  const stage: Stage = stageArg;
  const input = parseInput(await readJson(inputPath));

  const prompt =
    stage === "analysis"
      ? analysisPrompt(input)
      : selectionPrompt(
          input,
          analysisSchema.parse(
            unwrapAnalysis(await readJson(analysisPath!)),
          ),
        );

  const personalized = stage === "selection" && input.hexad !== null;
  const started = Date.now();

  // 進捗はstderr、結果JSONはstdoutへ出す。
  console.error(
    JSON.stringify({
      event: "feedback_llm_test_start",
      stage,
      startedAt: new Date(started).toISOString(),
      promptLength: prompt.length,
      personalized,
    }),
  );

  try {
    const result = await openAiCall(stage, prompt, personalized);

    console.log(
      JSON.stringify(
        {
          stage,
          durationMs: Date.now() - started,
          ...result,
        },
        null,
        2,
      ),
    );

    console.error(
      JSON.stringify({
        event: "feedback_llm_test_success",
        stage,
        durationMs: Date.now() - started,
        responseId: result.responseId,
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          event: "feedback_llm_test_failure",
          stage,
          durationMs: Date.now() - started,
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
          cause:
            error instanceof Error && error.cause instanceof Error
              ? {
                  name: error.cause.name,
                  message: error.cause.message,
                }
              : null,
        },
        null,
        2,
      ),
    );

    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});