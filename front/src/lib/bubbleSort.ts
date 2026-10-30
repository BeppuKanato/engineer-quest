export type BubbleSortPhase =
  | "initial"
  | "compare"
  | "swap"
  | "no-swap"
  | "pass-complete"
  | "complete";

export type BubbleSortStep = {
  values: number[];
  comparedIndices?: [number, number];
  swappedIndices?: [number, number];
  sortedIndices: number[];
  outerIndex?: number;
  innerIndex?: number;
  comparisonCount: number;
  swapCount: number;
  highlightedCodeLines: number[];
  message: string;
  phase: BubbleSortPhase;
};

export const generateBubbleSortSteps = (input: number[]): BubbleSortStep[] => {
  const values = [...input];
  const steps: BubbleSortStep[] = [{
    values: [...values],
    sortedIndices: [],
    comparisonCount: 0,
    swapCount: 0,
    highlightedCodeLines: [1, 2],
    message: "左端から、隣り合う値を比べていきます。",
    phase: "initial",
  }];
  let comparisonCount = 0;
  let swapCount = 0;

  for (let i = 0; i < Math.max(0, values.length - 1); i += 1) {
    for (let j = 0; j < values.length - i - 1; j += 1) {
      comparisonCount += 1;
      steps.push({
        values: [...values],
        comparedIndices: [j, j + 1],
        sortedIndices: Array.from({ length: i }, (_, k) => values.length - 1 - k),
        outerIndex: i,
        innerIndex: j,
        comparisonCount,
        swapCount,
        highlightedCodeLines: [4, 5, 6],
        message: `${values[j]}と${values[j + 1]}を比較します。`,
        phase: "compare",
      });
      if (values[j] > values[j + 1]) {
        const left = values[j];
        const right = values[j + 1];
        [values[j], values[j + 1]] = [right, left];
        swapCount += 1;
        steps.push({
          values: [...values],
          swappedIndices: [j, j + 1],
          sortedIndices: Array.from({ length: i }, (_, k) => values.length - 1 - k),
          outerIndex: i,
          innerIndex: j,
          comparisonCount,
          swapCount,
          highlightedCodeLines: [7],
          message: `左側の${left}が大きいため、${left}と${right}を交換しました。`,
          phase: "swap",
        });
      } else {
        steps.push({
          values: [...values],
          comparedIndices: [j, j + 1],
          sortedIndices: Array.from({ length: i }, (_, k) => values.length - 1 - k),
          outerIndex: i,
          innerIndex: j,
          comparisonCount,
          swapCount,
          highlightedCodeLines: [6],
          message: "左側の方が大きくないため、そのまま次へ進みます。",
          phase: "no-swap",
        });
      }
    }
    const sortedIndices = Array.from({ length: i + 1 }, (_, k) => values.length - 1 - k);
    steps.push({
      values: [...values],
      sortedIndices,
      outerIndex: i,
      comparisonCount,
      swapCount,
      highlightedCodeLines: [4],
      message: `右端側の${values[values.length - 1 - i]}が確定しました。`,
      phase: "pass-complete",
    });
  }

  steps.push({
    values: [...values],
    sortedIndices: values.map((_, index) => index),
    comparisonCount,
    swapCount,
    highlightedCodeLines: [9],
    message: "すべての要素が昇順に並びました。",
    phase: "complete",
  });
  return steps;
};

export const normalizeTranscriptionCode = (code: string) =>
  code
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
