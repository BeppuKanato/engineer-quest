import { Box, Stack, Typography } from "@mui/material";

import type { GraphCanvasState } from "./graphCanvas.types";
import { playerTokens } from "./player.tokens";

export function GraphCanvas({ canvas }: { canvas: GraphCanvasState }) {
  const { data, state, highlights } = canvas;
  const highlightFor = (kind: "node" | "edge" | "item", id: string) =>
    highlights.find((highlight) => highlight.kind === kind && highlight.id === id);

  return (
    <Box sx={{ width: "100%", maxWidth: 640, mx: "auto" }}>
      <svg viewBox="0 0 600 300" role="img" aria-label="対象データと各ノードの状態" style={{ display: "block", width: "100%" }}>
        {data.layers.map((layer) => (
          <g key={layer.id}>
            <rect x={90} y={layer.y} width={420} height={layer.height} rx={24} fill={playerTokens.layers[layer.tone]} />
            <text x={105} y={layer.y + 24} fill={playerTokens.text} fontSize={13}>{layer.label}</text>
          </g>
        ))}
        {data.edges.map((edge) => {
          const from = data.nodes.find((node) => node.id === edge.from)!;
          const to = data.nodes.find((node) => node.id === edge.to)!;
          const highlight = highlightFor("edge", edge.id);
          return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={playerTokens.states[highlight?.tone ?? "idle"].stroke} strokeWidth={highlight ? 5 : 2} />;
        })}
        {data.nodes.map((node) => {
          const status = state.nodes.find((entry) => entry.id === node.id)!.status;
          const highlight = highlightFor("node", node.id);
          const tone = playerTokens.states[highlight?.tone ?? status];
          const label = `${node.label}：${playerTokens.states[status].label}${highlight ? "、強調" : ""}`;
          return (
            <g key={node.id} role="img" aria-label={label}>
              <title>{label}</title>
              {highlight && <circle cx={node.x} cy={node.y} r={34} fill="none" stroke={tone.stroke} strokeWidth={2} strokeDasharray="4 4" />}
              <circle cx={node.x} cy={node.y} r={27} fill={tone.fill} stroke={tone.stroke} strokeWidth={3} />
              <text x={node.x} y={node.y + 7} textAnchor="middle" fill={playerTokens.text} fontSize={21} fontWeight={700}>{node.label}</text>
              <text x={node.x} y={node.y + 49} textAnchor="middle" fill={playerTokens.text} fontSize={12}>
                {playerTokens.states[status].marker} {playerTokens.states[status].label}
              </text>
            </g>
          );
        })}
      </svg>
      <Stack spacing={2} alignItems="center" sx={{ minHeight: 120 }}>
        {state.structures.map((structure) => (
          <Stack key={structure.id} spacing={0.75} alignItems="center" role="group" aria-label={structure.label}>
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>{structure.label}</Typography>
            <Stack component="ol" direction="row" alignItems="center" sx={{ p: 0, m: 0, gap: 1, listStyle: "none", minHeight: 42, flexWrap: "wrap", justifyContent: "center" }}>
              {structure.items.length === 0 && <Typography component="li" sx={{ color: playerTokens.control }}>∅</Typography>}
              {structure.items.map((item, i) => {
                const highlight = highlightFor("item", item.id);
                const tone = playerTokens.states[highlight?.tone ?? item.status];
                return (
                  <Box component="li" key={item.id} aria-label={`${item.value}：${playerTokens.states[item.status].label}${i === 0 && structure.kind === "queue" ? "、先頭" : ""}`}
                    sx={{ bgcolor: tone.fill, border: `2px solid ${tone.stroke}`, outline: highlight ? `2px dashed ${tone.stroke}` : undefined,
                      outlineOffset: 3, px: 1.75, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
                    {i === 0 && structure.kind === "queue" && <span aria-hidden="true">← </span>}{item.value}
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        ))}
        <Stack direction="row" gap={2} flexWrap="wrap" justifyContent="center">
          {state.variables.map((variable) => <Typography component="span" key={variable.name} sx={{ fontSize: 14 }}>
            {variable.name} = {variable.value ?? "∅"}
          </Typography>)}
        </Stack>
      </Stack>
    </Box>
  );
}
