import type { GreedyCoinsCodeVariables } from "./codeMapping.types";

const scalar = (value: number | null) => value === null ? "—" : String(value);
const list = (value: readonly number[] | null) => value === null ? "—" : `[${value.join(", ")}]`;

/** 表示文字列どうしを比較するので、未代入→値、リストへの追加も同じ規則で扱う。 */
export function codeVariableRows(
  variables: GreedyCoinsCodeVariables,
  previous?: GreedyCoinsCodeVariables,
) {
  const rowsOf = (entry: GreedyCoinsCodeVariables) => [
    { name: "remaining", value: scalar(entry.remaining) },
    { name: "coin", value: scalar(entry.coin) },
    { name: "result", value: list(entry.result) },
  ];
  const before = previous && rowsOf(previous);
  return rowsOf(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}
