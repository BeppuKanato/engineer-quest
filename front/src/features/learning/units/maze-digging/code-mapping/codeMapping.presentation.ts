import type { MazeDiggingCodeVariables } from "./codeMapping.types";

const scalar = (value: number | null) => value === null ? "—" : String(value);
/** 部屋の組の表示は、コードの grid[y][x] の添字順に合わせ (y, x) とする（Issue #326）。値の保持順はコードの (x, y) のまま、表示だけを入れ替える。 */
const rooms = (value: MazeDiggingCodeVariables["candidates"]) =>
  value === null ? "—" : `[${value.map(([x, y]) => `(${y}, ${x})`).join(", ")}]`;

/** 表示文字列どうしを比較するので、未代入→値、リストの伸長・短縮も同じ規則で扱う。 */
export function codeVariableRows(variables: MazeDiggingCodeVariables, previous?: MazeDiggingCodeVariables) {
  const values = (entry: MazeDiggingCodeVariables) => [
    { name: "size", value: scalar(entry.size) },
    { name: "step", value: scalar(entry.step) },
    { name: "x", value: scalar(entry.x) },
    { name: "y", value: scalar(entry.y) },
    { name: "dx", value: scalar(entry.dx) },
    { name: "dy", value: scalar(entry.dy) },
    { name: "nx", value: scalar(entry.nx) },
    { name: "ny", value: scalar(entry.ny) },
    { name: "candidates", value: rooms(entry.candidates) },
    { name: "stack", value: rooms(entry.stack) },
  ];
  const before = previous && values(previous);
  return values(variables).map((row, index) => ({ ...row, changed: row.value !== (before?.[index].value ?? "—") }));
}
