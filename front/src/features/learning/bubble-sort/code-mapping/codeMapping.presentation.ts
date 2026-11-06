import type { BubbleSortCodeVariables } from "./codeMapping.types";

const scalar = (value: number | null) => value === null ? "—" : String(value);
/** 現在のペアはローカル変数 result と j からの射影（基準データ §3 フェーズ4の変数表示）。 */
const pair = (variables: BubbleSortCodeVariables) =>
  variables.result === null || variables.j === null || variables.j + 1 >= variables.result.length
    ? "—" : `(${variables.result[variables.j]}, ${variables.result[variables.j + 1]})`;

/** 表示文字列どうしを比較するので、未代入→値、ペアの移動も同じ規則で扱う。 */
export function codeVariableRows(variables: BubbleSortCodeVariables, previous?: BubbleSortCodeVariables) {
  const values = (entry: BubbleSortCodeVariables) => [
    { name: "n", value: scalar(entry.n) },
    { name: "i", value: scalar(entry.i) },
    { name: "j", value: scalar(entry.j) },
    { name: "比べるペア", value: pair(entry) },
  ];
  const before = previous && values(previous);
  return values(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}
