import { motion, useReducedMotion } from "framer-motion";

/**
 * テストの入力グラフを描く小さな図。場所を円周上に等間隔に置き、
 * つながりを線で引く。distances を渡すと、各場所に距離のバッジを付け、
 * animate のときは距離の順に場所が色づく（幅優先探索の広がり方）。
 */
export function GraphFigure({ nodes, edges, start, distances, animate = false, label }: {
  nodes: readonly string[];
  edges: readonly (readonly [string, string])[];
  start: string;
  distances?: Readonly<Record<string, number>>;
  animate?: boolean;
  label: string;
}) {
  const reduce = useReducedMotion();
  const size = 300, center = size / 2, radius = 104;
  const position = new Map(nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return [node, { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) }] as const;
  }));
  return <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} style={{ display: "block", width: "100%", height: "100%" }}>
    <rect x="0" y="0" width={size} height={size} fill="#eef4fc" />
    {edges.map(([a, b], index) => {
      const pa = position.get(a), pb = position.get(b);
      if (!pa || !pb) return null;
      return <line key={index} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#94a3b8" strokeWidth="3" />;
    })}
    {nodes.map(node => {
      const p = position.get(node)!;
      const distance = distances?.[node];
      const lit = distance !== undefined && distance >= 0;
      const delay = animate && !reduce && lit ? 0.3 + distance * 0.45 : 0;
      return <motion.g key={node}
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay }}>
        <motion.circle cx={p.x} cy={p.y} r="21"
          initial={false}
          animate={{ fill: lit ? "#2563eb" : "#ffffff", stroke: node === start ? "#111827" : "#64748b" }}
          transition={{ duration: 0.35, delay }} strokeWidth={node === start ? 3.5 : 2} />
        <motion.text x={p.x} y={p.y + 6} textAnchor="middle" fontSize="17" fontWeight="900"
          initial={false} animate={{ fill: lit ? "#ffffff" : "#111827" }} transition={{ duration: 0.35, delay }}>
          {node}
        </motion.text>
        {distance !== undefined && <g>
          <rect x={p.x + 10} y={p.y + 8} width="26" height="20" rx="6" fill={lit ? "#16a34a" : "#64748b"} />
          <text x={p.x + 23} y={p.y + 23} textAnchor="middle" fontSize="13" fontWeight="900" fill="#ffffff">{distance}</text>
        </g>}
        {node === start && <text x={p.x} y={p.y - 30} textAnchor="middle" fontSize="12" fontWeight="800" fill="#111827">出発点</text>}
      </motion.g>;
    })}
  </svg>;
}

/** テストデータ（inputText）から図の材料を取り出す。 */
export function graphFromInput(inputText: string): { nodes: string[]; edges: [string, string][]; start: string } {
  const lines = inputText.split("\n").map(line => line.split(/\s+/u).filter(Boolean)).filter(parts => parts.length > 0);
  const start = lines[0]?.[0] ?? "A";
  const edges = lines.slice(1).filter(parts => parts.length >= 2).map(parts => [parts[0], parts[1]] as [string, string]);
  const nodeSet = new Set<string>([start]);
  for (const [a, b] of edges) { nodeSet.add(a); nodeSet.add(b); }
  return { nodes: [...nodeSet].sort(), edges, start };
}

export function distancesRecord(nodes: readonly string[], expected: readonly number[]): Record<string, number> {
  return Object.fromEntries(nodes.map((node, index) => [node, expected[index]]));
}
