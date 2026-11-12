import type { WallExtensionCodeVariables } from "./codeMapping.types";

const scalar = (value: number | null) => value === null ? "—" : String(value);
const pillars = (value: WallExtensionCodeVariables["pillars"]) =>
  value === null ? "—" : `[${value.map(([x, y]) => `(${x}, ${y})`).join(", ")}]`;
const allowed = (value: WallExtensionCodeVariables["allowed"]) =>
  value === null ? "—" : `[${value.map(name => `'${name}'`).join(", ")}]`;

/** 表示文字列どうしを比較するので、未代入→値、リストの伸長も同じ規則で扱う。 */
export function codeVariableRows(variables: WallExtensionCodeVariables, previous?: WallExtensionCodeVariables) {
  const values = (entry: WallExtensionCodeVariables) => [
    { name: "size", value: scalar(entry.size) },
    { name: "i", value: scalar(entry.i) },
    { name: "y", value: scalar(entry.y) },
    { name: "x", value: scalar(entry.x) },
    { name: "pillars", value: pillars(entry.pillars) },
    { name: "choice", value: scalar(entry.choice) },
    { name: "allowed", value: allowed(entry.allowed) },
    { name: "dx", value: scalar(entry.dx) },
    { name: "dy", value: scalar(entry.dy) },
  ];
  const before = previous && values(previous);
  return values(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}
