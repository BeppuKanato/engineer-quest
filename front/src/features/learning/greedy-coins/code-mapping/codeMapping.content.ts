import type { LearningStep } from "../../player/content.types";
import {
  greedyCoinsDenominations, greedyCoinsMainAmount,
} from "../greedyCoins";
import { greedyCoinsCode, type GreedyCoinsCodeLineId } from "./greedyCoinsCode";
import {
  defineGreedyCoinsCodeMappingContent, executionStep, type GreedyCoinsCodeMappingCanvasState,
  type GreedyCoinsCodeMappingContent, type GreedyCoinsCodeVariables,
} from "./codeMapping.types";

/**
 * コード側フレームだけを構成する。盤面はフェーズ2のスナップショットを参照し、再実装しない。
 * フレームの並びと変数は、参照コードを実際に実行したときの行順・ローカル変数と
 * 一致させる（検証は CPython のトレースと突き合わせる。実行行43行に定義フレームを
 * 足して44フレーム）。チェックポイントは `result.append(coin)` の実行9回で、
 * フェーズ2の選択ステップ select-1〜select-9 と対応する。
 *
 * チェックポイントの盤面はフェーズ2の選択ステップ（選択が完了した盤面）だが、
 * その時点のコード変数 remaining はまだ引かれる前であり、次の
 * `remaining -= coin` のフレームで盤面の残額と一致する。変数は CPython の
 * 実行どおりを優先し、この1フレームのずれは実施記録に留保として明示する。
 */
function frames(): [LearningStep<GreedyCoinsCodeMappingCanvasState>, ...LearningStep<GreedyCoinsCodeMappingCanvasState>[]] {
  const result: LearningStep<GreedyCoinsCodeMappingCanvasState>[] = [];
  const amount = greedyCoinsMainAmount;
  let reference = "introduce";
  let vars: GreedyCoinsCodeVariables = { remaining: null, coin: null, result: null };
  const add = (id: string, lineId: GreedyCoinsCodeLineId, caption: string,
    captionKind: GreedyCoinsCodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    result.push({ id, caption, canvas: {
      data: { kind: "greedy-coins-code-mapping", code: greedyCoinsCode },
      state: {
        executionStepId: reference, execution: executionStep(reference).canvas, frameKind, captionKind,
        variables: { ...vars, result: vars.result ? [...vars.result] : null },
      },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };

  add("define-function", "define-function",
    "金額と硬貨のリストを受け取り、選んだ硬貨のリストを返す greedy_coins を用意します。", "structure");
  vars = { ...vars, result: [] };
  add("init-result", "init-result", "選んだ硬貨を入れる、空のリスト result を用意します。", "assignment");
  vars = { ...vars, remaining: amount };
  add("init-remaining", "init-remaining", `残額 remaining に、払う金額 ${amount}円を入れます。`, "assignment");

  let selectCount = 0;
  let whileCount = 0;
  for (const coin of greedyCoinsDenominations) {
    vars = { ...vars, coin };
    add(`for-coin-${coin}`, "for-coin", selectCount === 0 && coin === greedyCoinsDenominations[0]
      ? `額面を大きい順に見ていき、最初は${coin}円の硬貨を見ます。`
      : `次の額面に進み、${coin}円の硬貨を見ます。`, "assignment");
    for (;;) {
      const remaining = vars.remaining;
      if (remaining === null) throw new Error("Remaining must be set before the while loop");
      whileCount += 1;
      const usable = remaining >= coin;
      add(`while-remaining-${whileCount}`, "while-remaining", usable
        ? `${remaining}円は${coin}円以上なので、${coin}円の硬貨を選べます。`
        : `${remaining}円は${coin}円より小さいので、${coin}円の硬貨は選べません。`, "evaluation");
      if (!usable) break;
      // チェックポイント: 硬貨を記録する行の実行が、フェーズ2の選択ステップに対応する。
      vars = { ...vars, result: [...(vars.result ?? []), coin] };
      selectCount += 1;
      reference = `select-${selectCount}`;
      add(`execution-select-${selectCount}`, "append-coin", executionStep(reference).caption, "assignment", "execution");
      vars = { ...vars, remaining: remaining - coin };
      add(`subtract-coin-${selectCount}`, "subtract-coin",
        `残額から${coin}円を引いて、残りは${remaining - coin}円です。`, "assignment");
    }
  }
  add("for-coin-end", "for-coin", "すべての額面を見終わったので、繰り返しを終えます。", "evaluation");
  reference = "summary";
  add("return-result", "return-result", "残額が0になり、選んだ硬貨のリストを返します。", "structure");

  const [first, ...rest] = result;
  if (!first) throw new Error("Greedy-coins code mapping needs a frame");
  return [first, ...rest];
}

export const greedyCoinsCodeMappingContent: GreedyCoinsCodeMappingContent =
  defineGreedyCoinsCodeMappingContent({
    version: 1, kind: "step-sequence", id: "greedy-coins-code-mapping", phase: 4, intervalMs: 3500,
    stageName: "動きとコードの対応", steps: frames(),
  });
