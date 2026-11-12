import type { CodeVariables } from "./codeMapping.types";

const scalar = (value: string | number | null) => value === null ? "—" : typeof value === "string" ? `'${value}'` : String(value);

/** 表示文字列どうしを比較するので、未代入→値、空キュー、辞書の更新も同じ規則で扱う。 */
export function codeVariableRows(variables: CodeVariables, previous?: CodeVariables) {
  const values = (entry: CodeVariables) => [
    { name: "start", value: scalar(entry.start) },
    { name: "node", value: scalar(entry.node) },
    { name: "distances[node]", value: scalar(entry.nodeDistance) },
    { name: "neighbor", value: scalar(entry.neighbor) },
    { name: "distances[neighbor]", value: scalar(entry.neighborDistance) },
    { name: "queue", value: entry.queue === null ? "—" : `[${entry.queue.map(scalar).join(", ")}]` },
    { name: "distances", value: entry.distances === null ? "—" : `{${Object.entries(entry.distances).map(([id, distance]) => `'${id}': ${distance}`).join(", ")}}` },
  ];
  const before = previous && values(previous);
  return values(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}
