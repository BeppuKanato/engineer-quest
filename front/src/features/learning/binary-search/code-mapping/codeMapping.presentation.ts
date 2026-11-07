import type { BinarySearchCodeVariables } from "./codeMapping.types";

const scalar = (value: number | null) => value === null ? "—" : String(value);
/** 真ん中の値は盤面の values とローカル変数 mid からの射影（基準データ §3 フェーズ4の変数表示）。 */
const midValue = (variables: BinarySearchCodeVariables, values: readonly number[]) =>
  variables.mid === null ? "—" : String(values[variables.mid]);

/** 表示文字列どうしを比較するので、未代入→値、真ん中の移動も同じ規則で扱う。 */
export function codeVariableRows(
  variables: BinarySearchCodeVariables,
  values: readonly number[],
  previous?: BinarySearchCodeVariables,
) {
  const rowsOf = (entry: BinarySearchCodeVariables) => [
    { name: "lo", value: scalar(entry.lo) },
    { name: "hi", value: scalar(entry.hi) },
    { name: "mid", value: scalar(entry.mid) },
    { name: "values[mid]", value: midValue(entry, values) },
  ];
  const before = previous && rowsOf(previous);
  return rowsOf(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}
