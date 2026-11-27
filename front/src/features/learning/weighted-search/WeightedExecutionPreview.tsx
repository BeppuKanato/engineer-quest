"use client";
import { Box } from "@mui/material";
import { LearningPlayer } from "../player/LearningPlayer";
import { defineLearningContent, type LearningContent } from "../player/content.types";
import { playerTokens, type PlayerStatus } from "../player/player.tokens";
import type { LearningInstrumentation } from "../instrumentation/useLearningVisit";
import { reconstructWeightedPath, weightedEdges, weightedGoal, weightedHeuristic, weightedNodes, weightedStart, type WeightedNodeId, type WeightedSearchMode, type WeightedSnapshot } from "../graphs/weightedSearch";
import { weightedMaterials } from "./content";
export type WeightedCanvasState = { data: { mode: WeightedSearchMode; introStage?: number; introPath?: readonly WeightedNodeId[] }; state: WeightedSnapshot; highlights: readonly { from: WeightedNodeId; to: WeightedNodeId }[] };
const distanceText = (value: number | null) => value === null ? "∞" : String(value);
const priority = (mode: WeightedSearchMode, state: WeightedSnapshot, id: WeightedNodeId) => (state.distances[id] ?? Infinity) + (mode === "astar" ? weightedHeuristic[id] : 0);
export function weightedContent(mode: WeightedSearchMode, stage: "motivation" | "execution" | "mapping"): LearningContent<WeightedCanvasState> {
  return defineLearningContent<WeightedCanvasState>(weightedMaterials[mode][stage], canvas => {
    if (canvas.state.frontier.some(id => canvas.state.distances[id] === null) || new Set(canvas.state.selected).size !== canvas.state.selected.length) throw new Error("Invalid weighted search snapshot");
  });
}
export const weightedContents = { dijkstra: { motivation: weightedContent("dijkstra","motivation"), execution: weightedContent("dijkstra","execution"), mapping: weightedContent("dijkstra","mapping") }, astar: { motivation: weightedContent("astar","motivation"), execution: weightedContent("astar","execution"), mapping: weightedContent("astar","mapping") } };
const point = (id: WeightedNodeId) => {
  const node = weightedNodes.find(n => n.id === id);
  if (!node) throw new Error("Unknown node");
  return { x: 70 + node.x * 83, y: 65 + node.y * 165 };
};
export function WeightedCanvas({ canvas, onNode, selectable = [], questionMode = false }: { canvas: WeightedCanvasState; onNode?: (id: WeightedNodeId) => void; selectable?: readonly string[]; questionMode?: boolean }) {
  const { state, data: { mode } } = canvas;
  const intro = canvas.data.introStage;
  const path = canvas.data.introPath?.length ? canvas.data.introPath : state.operation === "finish" ? reconstructWeightedPath(state) : [];
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
          return <g key={id} role={onNode && selectable.includes(id) ? "button" : undefined} tabIndex={onNode && selectable.includes(id) ? 0 : undefined} aria-label={onNode && selectable.includes(id) ? id + "を選ぶ" : undefined} onClick={onNode && selectable.includes(id) ? () => onNode(id) : undefined} onKeyDown={event => { if (onNode && selectable.includes(id) && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onNode(id); } }} style={{cursor: onNode && selectable.includes(id) ? "pointer" : "default"}}><title>{`${id} ${color.label}、移動コスト${distanceText(g)}`}</title><circle cx={p.x} cy={p.y} r={25} fill={color.fill} stroke={path.includes(id) ? playerTokens.focus : color.stroke} strokeWidth={path.includes(id) || (onNode && selectable.includes(id)) ? 4 : 2} /><text x={p.x} y={p.y+6} textAnchor="middle" fontSize={18} fontWeight={700} fill={tone === "processing" ? "#fff" : playerTokens.text}>{id}</text><text x={p.x} y={p.y-34} textAnchor="middle" fontSize={14} fill={playerTokens.text}>{id === weightedStart ? "出発" : id === weightedGoal ? "ゴール" : ""}</text>{(!intro || intro >= 4) && <text x={p.x} y={p.y+43} textAnchor="middle" fontSize={15} fill={playerTokens.text}>{`g=${distanceText(g)}`}</text>}{mode === "astar" && (!intro || intro >= 2) && <text x={p.x} y={p.y+61} textAnchor="middle" fontSize={13} fill={playerTokens.text}>{`h=${weightedHeuristic[id]}  f=${g === null ? "∞" : priority(mode,state,id)}`}</text>}</g>;
        })}
      </Box>
      {(!intro || intro >= 4) && <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
        <Box component="span" sx={{ fontWeight: 600 }}>{questionMode ? "候補" : mode === "astar" ? "候補（g+hの小さい順）" : "候補（gの小さい順）"}</Box>
        {state.frontier.length ? (questionMode ? [...state.frontier].sort() : state.frontier).map(id => <Box key={id} component="span" sx={{ border: "1px solid", borderColor: playerTokens.states.queued.stroke, bgcolor: playerTokens.states.queued.fill, px: 1.5, py: 0.5, borderRadius: 1 }}>{id}: {priority(mode,state,id)}</Box>) : <Box component="span">なし</Box>}
      </Box>}
      {!intro && <Box sx={{ fontSize: 14, textAlign: "center" }}>選択順：{state.selected.join(" → ") || "—"}</Box>}
      {!intro && <Box sx={{ fontSize: 14, textAlign: "center" }}>前の場所：{weightedNodes.filter(({id}) => state.predecessors[id]).map(({id}) => `${id}←${state.predecessors[id]}`).join("　") || "—"}</Box>}
      {!intro && path.length > 0 && <Box sx={{ fontWeight: 700 }}>最短経路：{path.join(" → ")}（コスト{state.distances[weightedGoal]}）</Box>}
    </Box>
  );
}

export function WeightedCode({ mode, focused = [], blank }: { mode: WeightedSearchMode; focused?: readonly string[]; blank?: { lineId: string; start: number; length: number } }) {
  return <Box component="pre" aria-label="Pythonコード" sx={{ m:0, p:1.5, overflow:"auto", fontFamily:"monospace", fontSize:14, lineHeight:1.65, color:playerTokens.text, bgcolor:playerTokens.layers.layer0, minWidth:0 }}>
    {weightedMaterials[mode].code.lines.map((line,i) => <Box key={line.id} component="div" sx={{ bgcolor:focused.includes(line.id)?"#dbeafe":"transparent", fontWeight:focused.includes(line.id)?700:400, opacity:focused.length&&!focused.includes(line.id)?0.65:1, whiteSpace:"pre" }}>
      <Box component="span" sx={{display:"inline-block",width:28,opacity:0.7,userSelect:"none"}}>{i+1}</Box>{blank?.lineId===line.id ? line.text.slice(0,blank.start)+"＿＿＿"+line.text.slice(blank.start+blank.length):line.text}
    </Box>)}
  </Box>;
}
export function WeightedMappingCanvas({ canvas }: { canvas: WeightedCanvasState }) {
  const mode=canvas.data.mode, op=canvas.state.operation;
  const focus=weightedMaterials[mode].mapping.steps.find(s=>s.canvas.state.operation===op)?.codeFocus ?? [];
  return <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:1.5,height:"100%",minHeight:0,overflow:"auto"}}><WeightedCanvas canvas={canvas}/><WeightedCode mode={mode} focused={focus}/></Box>;
}
export function WeightedExecutionPreview({ mode, stage="execution", embedded=false, active=true, onLearningEvent, onComplete, nextLabel }: LearningInstrumentation & { mode: WeightedSearchMode; stage?: "motivation" | "execution" | "mapping"; embedded?: boolean; onComplete?: () => void; nextLabel?: string }) {
  return <Box component={embedded?"div":"main"} sx={{ height: embedded?"100%":"100dvh", minHeight: embedded?0:480, display:"flex", bgcolor:playerTokens.background }}><LearningPlayer active={active} onLearningEvent={onLearningEvent} content={weightedContents[mode][stage]} renderCanvas={canvas=>stage==="mapping"?<WeightedMappingCanvas canvas={canvas}/>:<WeightedCanvas canvas={canvas}/>} endAction={onComplete?{label:nextLabel??"次へ進む",onClick:onComplete}:undefined}/></Box>;
}
