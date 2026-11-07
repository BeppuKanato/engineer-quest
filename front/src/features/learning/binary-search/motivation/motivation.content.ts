import { defineLearningContent } from "../../player/content.types";
import {
  binarySearchHalvingCounts, binarySearchMainTarget, binarySearchMainValues,
} from "../binarySearch";
import {
  validateBinarySearchMotivationCanvas, type BinarySearchMotivationCanvasState, type BinarySearchMotivationContent,
} from "./motivation.types";

/**
 * 基準データ §3 フェーズ1。主教材の配列は §1 の検証済みデータ、
 * 数当ての件数列は §1 の半分の計算（100→50→25→13→7→4→2→1）から組み立てる。
 * 用語（二分探索・インデックス等）はフェーズ1では出さず、名称付けは後続フェーズに置く。
 */
const halvingCounts = binarySearchHalvingCounts(100);

function arrayScene(target: number | null, exit: BinarySearchMotivationCanvasState["state"]["exit"] = null): BinarySearchMotivationCanvasState {
  return {
    data: { kind: "binary-search-motivation" },
    state: { visual: { kind: "array", values: binarySearchMainValues, target }, exit },
    highlights: target === null ? [] : [{ kind: "cell", id: binarySearchMainValues.indexOf(target) }],
  };
}

function guessScene(asked: number | null, remaining: readonly [number, number] | null): BinarySearchMotivationCanvasState {
  return {
    data: { kind: "binary-search-motivation" },
    state: { visual: { kind: "guess", low: 1, high: 100, asked, remaining }, exit: null },
    highlights: [],
  };
}

const sequence = defineLearningContent<BinarySearchMotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "binary-search-motivation", phase: 1, intervalMs: 3500,
  steps: [
    {
      id: "find-twenty-five", caption: "小さい順に並んだ7つの数字から25を探すとき、端から順に見ると最大で7回も見ることになります。",
      canvas: arrayScene(binarySearchMainTarget),
    },
    {
      id: "guessing-game", caption: "たとえば、1から100のうちの1つの数を、『大きい』『小さい』のヒントだけで当てるゲームがあります。",
      canvas: guessScene(null, null),
    },
    {
      id: "ask-middle", caption: "真ん中の数を聞くと、答えに合わせて候補の半分が一度に消えます。",
      canvas: guessScene(50, [51, 100]),
    },
    {
      id: "seven-guesses", caption: "半分ずつに絞っていくと、100個の候補でも7回で必ず当たります。",
      canvas: {
        data: { kind: "binary-search-motivation" },
        state: { visual: { kind: "halving", counts: halvingCounts }, exit: null },
        highlights: [],
      },
    },
    {
      id: "unit-overview", caption: "この単元では、並んだ数字から目的の数を素早く見つける方法を、動きの確認からコード、そして自分で実装するところまで順に学びます。",
      canvas: arrayScene(null),
    },
    {
      id: "main-example-preview", caption: "最初の例では、この7つの数字から25を探す動きを見ていきます。",
      canvas: arrayScene(binarySearchMainTarget, { label: "動きの説明へ進む", nextPhase: 2 }),
    },
  ],
}, validateBinarySearchMotivationCanvas);

export const binarySearchMotivationContent: BinarySearchMotivationContent = {
  ...sequence, stageName: "導入",
  vocabulary: [
    { concept: "middle", everyday: "真ん中", technical: "中央", firstStepId: "ask-middle", usage: "候補の範囲の真ん中にある数。フェーズ1では「真ん中」と言い、後続フェーズで中央の値として扱う。" },
    { concept: "candidates", everyday: "候補", technical: "探索範囲", firstStepId: "ask-middle", usage: "まだ答えの可能性が残っている数の集まり。フェーズ2以降は、残った範囲そのものを探索範囲として扱う。" },
    { concept: "half", everyday: "半分", technical: "半分", firstStepId: "ask-middle", usage: "真ん中を聞くたびに候補が半分になること。フェーズ2の「範囲を半分にする」という見方につながる。" },
  ],
};

for (const entry of binarySearchMotivationContent.vocabulary) {
  if (!sequence.steps.some((step) => step.id === entry.firstStepId)) throw new Error("Unknown vocabulary introduction step");
}
