"use client";

import { Box } from "@mui/material";
import { LearningPlayer } from "../player/LearningPlayer";
import { defineLearningContent, type LearningStep } from "../player/content.types";
import { playerTokens, type PlayerStatus } from "../player/player.tokens";
import { buildWeightedTrace, reconstructWeightedPath, weightedEdges, weightedGoal, weightedHeuristic, weightedNodes, weightedStart, type WeightedNodeId, type WeightedSearchMode, type WeightedSnapshot } from "../graphs/weightedSearch";

type Canvas = { data: { mode: WeightedSearchMode }; state: WeightedSnapshot; highlights: readonly { from: WeightedNodeId; to: WeightedNodeId }[] };
const distanceText = (value: number | null) => value === null ? "∞" : String(value);
const priority = (mode: WeightedSearchMode, state: WeightedSnapshot, id: WeightedNodeId) => (state.distances[id] ?? Infinity) + (mode === "astar" ? weightedHeuristic[id] : 0);
function caption(mode: WeightedSearchMode, state: WeightedSnapshot): string {
  const { operation, from, to, candidate } = state;
  if (operation === "init") return "出発点Aまでの移動コストを0として、候補に追加します。";
  if (operation === "finish") return "ゴールFから前の場所をたどると、最短経路A→B→D→F（コスト6）が分かります。";
  if (operation === "select" && from) return mode === "dijkstra"
    ? `候補の中で移動コストが最小の${from}（${priority(mode, state, from)}）を選びます。`
    : `候補の中で移動コストと残りの推定コストの合計が最小の${from}（${priority(mode, state, from)}）を選びます。`;
  if (operation === "relax") return `${from}を経由すると${to}へのコストが${candidate}になるので、距離と前の場所を更新します。`;
  return `${from}を経由すると${to}へのコストは${candidate}となり、記録済みのコスト${to ? distanceText(state.distances[to]) : ""}より小さくないので更新しません。`;
}
function makeContent(mode: WeightedSearchMode) {
  const steps = buildWeightedTrace(mode).map((state, index): LearningStep<Canvas> => ({
    id: `${index + 1}-${state.operation}-${state.from ?? "start"}-${state.to ?? "none"}`,
    caption: caption(mode, state),
    canvas: { data: { mode }, state, highlights: state.from && state.to ? [{ from: state.from, to: state.to }] : [] },
  }));
  const [first, ...rest] = steps;
  if (!first) throw new Error("Weighted search needs steps");
  return defineLearningContent<Canvas>({ version: 1, kind: "step-sequence", id: `${mode}-execution`, phase: 2, intervalMs: 3500, steps: [first, ...rest] }, canvas => {
    if (canvas.state.frontier.some(id => canvas.state.distances[id] === null)) throw new Error("Unreachable frontier");
    if (new Set(canvas.state.selected).size !== canvas.state.selected.length) throw new Error("Duplicate selected node");
  });
}
const contents = { dijkstra: makeContent("dijkstra"), astar: makeContent("astar") };
const point = (id: WeightedNodeId) => {
  const node = weightedNodes.find(n => n.id === id);
  if (!node) throw new Error("Unknown node");
  return { x: 70 + node.x * 83, y: 65 + node.y * 165 };
};
function WeightedCanvas({ canvas }: { canvas: Canvas }) {
  const { state, data: { mode } } = canvas;
  const path = state.operation === "finish" ? reconstructWeightedPath(state) : [];
  const pathEdge = (from: WeightedNodeId, to: WeightedNodeId) => path.some((id, i) => (id === from && path[i+1] === to) || (id === to && path[i+1] === from));
  const status = (id: WeightedNodeId): PlayerStatus => state.operation !== "finish" && state.from === id ? "processing" : state.selected.includes(id) ? "completed" : state.frontier.includes(id) ? "queued" : "idle";
  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, minHeight: 0, color: playerTokens.text }}>
      <Box component="svg" viewBox="0 0 640 325" role="img" aria-label="重み付きグラフと各地点のコスト" sx={{ width: "100%", flex: "1 1 auto", minHeight: 0, maxHeight: 440 }}>
        {weightedEdges.map(({ from, to, weight }) => {
          const a = point(from), b = point(to);
          const active = canvas.highlights.some(h => h.from === from && h.to === to || h.from === to && h.to === from);
          const inPath = pathEdge(from, to);
          const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
          return <g key={from+to}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active || inPath ? playerTokens.focus : "#9ca3af"} strokeWidth={active || inPath ? 4 : 2} strokeDasharray={active && state.operation === "keep" ? "6 4" : undefined} /><rect x={mx-13} y={my-11} width={26} height={22} rx={4} fill={playerTokens.surface} /><text x={mx} y={my+5} textAnchor="middle" fontSize={15} fill={playerTokens.text}>{weight}</text></g>;
        })}
        {weightedNodes.map(({ id }) => {
          const p = point(id), tone = status(id), color = playerTokens.states[tone], g = state.distances[id];
          return <g key={id}><title>{`${id} ${color.label}、移動コスト${distanceText(g)}`}</title><circle cx={p.x} cy={p.y} r={25} fill={color.fill} stroke={path.includes(id) ? playerTokens.focus : color.stroke} strokeWidth={path.includes(id) ? 4 : 2} /><text x={p.x} y={p.y+6} textAnchor="middle" fontSize={18} fontWeight={700} fill={tone === "processing" ? "#fff" : playerTokens.text}>{id}</text><text x={p.x} y={p.y-34} textAnchor="middle" fontSize={14} fill={playerTokens.text}>{id === weightedStart ? "出発" : id === weightedGoal ? "ゴール" : ""}</text><text x={p.x} y={p.y+43} textAnchor="middle" fontSize={15} fill={playerTokens.text}>{`g=${distanceText(g)}`}</text>{mode === "astar" && <text x={p.x} y={p.y+61} textAnchor="middle" fontSize={13} fill={playerTokens.text}>{`h=${weightedHeuristic[id]}  f=${g === null ? "∞" : priority(mode,state,id)}`}</text>}</g>;
        })}
      </Box>
      <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
        <Box component="span" sx={{ fontWeight: 600 }}>{mode === "astar" ? "候補（g+hの小さい順）" : "候補（gの小さい順）"}</Box>
        {state.frontier.length ? state.frontier.map(id => <Box key={id} component="span" sx={{ border: "1px solid", borderColor: playerTokens.states.queued.stroke, bgcolor: playerTokens.states.queued.fill, px: 1.5, py: 0.5, borderRadius: 1 }}>{id}: {priority(mode,state,id)}</Box>) : <Box component="span">なし</Box>}
      </Box>
      <Box sx={{ fontSize: 14, textAlign: "center" }}>選択順：{state.selected.join(" → ") || "—"}</Box>
      <Box sx={{ fontSize: 14, textAlign: "center" }}>前の場所：{weightedNodes.filter(({id}) => state.predecessors[id]).map(({id}) => `${id}←${state.predecessors[id]}`).join("　") || "—"}</Box>
      {path.length > 0 && <Box sx={{ fontWeight: 700 }}>最短経路：{path.join(" → ")}（コスト{state.distances[weightedGoal]}）</Box>}
    </Box>
  );
}
export function WeightedExecutionPreview({ mode }: { mode: WeightedSearchMode }) {
  return <Box component="main" sx={{ height: "100dvh", minHeight: 480, display: "flex", bgcolor: playerTokens.background }}><LearningPlayer content={contents[mode]} renderCanvas={canvas => <WeightedCanvas canvas={canvas} />} /></Box>;
}
