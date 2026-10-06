"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { CodeLines, StepTraceControls } from "@/features/learning/components";

type GraphNode = { id: string; label: string; x: number; y: number };
type GraphEdge = { from: string; to: string };
type GraphStep = {
  currentNode?: string;
  inspectingNode?: string;
  queue: string[];
  discoveredNodes: string[];
  processedNodes: string[];
  distances?: Record<string, number>;
  activeEdge?: { from: string; to: string };
  message: string;
  nextLabel?: string;
  activeCodeLines?: number[];
};
type GraphTraceData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  steps: GraphStep[];
  adjacency?: Record<string, string[]>;
  code?: string;
  finalMessage?: string;
  intervalMs?: number;
  showQueue?: boolean;
  showDistances?: boolean;
  currentNodeLabel?: string;
  waitingNodeLabel?: string;
  containerLabel?: string;
  containerLeadingLabel?: string;
  containerTrailingLabel?: string;
  activeContainerItem?: "FIRST" | "LAST";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const stringList = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const parseData = (content: Record<string, unknown>): GraphTraceData | null => {
  if (!Array.isArray(content.nodes) || !Array.isArray(content.edges) || !Array.isArray(content.steps)) return null;
  const nodes = content.nodes.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.label !== "string" || typeof item.x !== "number" || typeof item.y !== "number") return [];
    return [{ id: item.id, label: item.label, x: item.x, y: item.y }];
  });
  const edges = content.edges.flatMap((item) => {
    if (!isRecord(item) || typeof item.from !== "string" || typeof item.to !== "string") return [];
    return [{ from: item.from, to: item.to }];
  });
  const steps = content.steps.flatMap((item) => {
    if (!isRecord(item) || typeof item.message !== "string") return [];
    const distances = isRecord(item.distances)
      ? Object.fromEntries(Object.entries(item.distances).filter((entry): entry is [string, number] => typeof entry[1] === "number"))
      : undefined;
    const activeEdge = isRecord(item.activeEdge) && typeof item.activeEdge.from === "string" && typeof item.activeEdge.to === "string"
      ? { from: item.activeEdge.from, to: item.activeEdge.to }
      : undefined;
    return [{
      currentNode: typeof item.currentNode === "string" ? item.currentNode : undefined,
      inspectingNode: typeof item.inspectingNode === "string" ? item.inspectingNode : undefined,
      queue: stringList(item.queue),
      discoveredNodes: stringList(item.discoveredNodes),
      processedNodes: stringList(item.processedNodes),
      distances,
      activeEdge,
      message: item.message,
      nextLabel: typeof item.nextLabel === "string" ? item.nextLabel : undefined,
      activeCodeLines: Array.isArray(item.activeCodeLines)
        ? item.activeCodeLines.filter((line): line is number => Number.isInteger(line))
        : undefined,
    }];
  });
  if (nodes.length === 0 || steps.length === 0) return null;
  const adjacency = isRecord(content.adjacency)
    ? Object.fromEntries(Object.entries(content.adjacency).map(([id, neighbors]) => [id, stringList(neighbors)]))
    : undefined;
  return {
    nodes,
    edges,
    steps,
    adjacency,
    code: typeof content.code === "string" ? content.code : undefined,
    finalMessage: typeof content.finalMessage === "string" ? content.finalMessage : undefined,
    intervalMs: typeof content.intervalMs === "number" ? content.intervalMs : undefined,
    showQueue: content.showQueue !== false,
    showDistances: content.showDistances === true,
    currentNodeLabel: typeof content.currentNodeLabel === "string" ? content.currentNodeLabel : undefined,
    waitingNodeLabel: typeof content.waitingNodeLabel === "string" ? content.waitingNodeLabel : undefined,
    containerLabel: typeof content.containerLabel === "string" ? content.containerLabel : undefined,
    containerLeadingLabel: typeof content.containerLeadingLabel === "string" ? content.containerLeadingLabel : undefined,
    containerTrailingLabel: typeof content.containerTrailingLabel === "string" ? content.containerTrailingLabel : undefined,
    activeContainerItem: content.activeContainerItem === "LAST" ? "LAST" : "FIRST",
  };
};

const nodeColors = (nodeId: string, step: GraphStep) => {
  if (nodeId === step.currentNode) return { fill: "#2563eb", stroke: "#1d4ed8", text: "#ffffff", label: "現在取り出した場所" };
  if (nodeId === step.inspectingNode) return { fill: "#c4b5fd", stroke: "#7c3aed", text: "#3b0764", label: "今確認する隣" };
  if (step.processedNodes.includes(nodeId)) return { fill: "#bbf7d0", stroke: "#16a34a", text: "#14532d", label: "確認済み" };
  if (step.discoveredNodes.includes(nodeId)) return { fill: "#fde68a", stroke: "#d97706", text: "#78350f", label: "発見済み" };
  return { fill: "#ffffff", stroke: "#94a3b8", text: "#334155", label: "未発見" };
};

export const GraphTraversalVisualization = ({ content }: { content: Record<string, unknown> }) => {
  const data = useMemo(() => parseData(content), [content]);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(data?.intervalMs ?? 1500);

  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
    setSpeed(data?.intervalMs ?? 1500);
  }, [data]);

  useEffect(() => {
    if (!playing || !data) return;
    if (stepIndex >= data.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStepIndex((current) => current + 1), speed);
    return () => window.clearTimeout(timer);
  }, [data, playing, speed, stepIndex]);

  if (!data) return null;
  const step = data.steps[stepIndex];
  const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
  const showCurrentLegend = data.steps.some((item) => item.currentNode);
  const showWaitingLegend = data.steps.some((item) => item.discoveredNodes.some((id) => !item.processedNodes.includes(id) && id !== item.currentNode));
  const showProcessedLegend = data.steps.some((item) => item.processedNodes.length > 0);
  const activeEdge = (edge: GraphEdge) => step.activeEdge && (
    (step.activeEdge.from === edge.from && step.activeEdge.to === edge.to)
    || (step.activeEdge.from === edge.to && step.activeEdge.to === edge.from)
  );

  return (
    <Stack spacing={2.25} sx={{ minWidth: 0 }}>
      <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, borderRadius: 3, bgcolor: "#f8fafc", overflow: "hidden" }}>
        <Box sx={{ width: "100%", maxWidth: 680, mx: "auto" }}>
          <svg viewBox="0 0 100 68" role="img" aria-label={`つながりの図。${step.message}`} style={{ width: "100%", height: "auto", display: "block" }}>
            {data.edges.map((edge, index) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              const highlighted = activeEdge(edge);
              return (
                <line
                  key={`${edge.from}-${edge.to}-${index}`}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={highlighted ? "#7c3aed" : "#cbd5e1"}
                  strokeWidth={highlighted ? 2.2 : 1.2}
                  strokeLinecap="round"
                />
              );
            })}
            {data.nodes.map((node) => {
              const colors = nodeColors(node.id, step);
              return (
                <g key={node.id} aria-label={`${node.label}：${colors.label}`}>
                  <circle cx={node.x} cy={node.y} r="7.2" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" />
                  <text x={node.x} y={node.y + 1.5} textAnchor="middle" fontSize="5" fontWeight="800" fill={colors.text}>{node.label}</text>
                  {data.showDistances && step.distances?.[node.id] !== undefined && (
                    <text x={node.x} y={node.y + 11} textAnchor="middle" fontSize="3.5" fontWeight="700" fill="#475569">
                      距離 {step.distances[node.id]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ mt: 1 }} aria-label="図の状態説明">
          {showCurrentLegend && <Chip size="small" label={data.currentNodeLabel ?? "現在取り出した場所"} sx={{ bgcolor: "#dbeafe", fontWeight: 800 }} />}
          {showWaitingLegend && <Chip size="small" label={data.waitingNodeLabel ?? "発見済み・待機中"} sx={{ bgcolor: "#fef3c7", fontWeight: 800 }} />}
          {showProcessedLegend && <Chip size="small" label="確認済み" sx={{ bgcolor: "#dcfce7", fontWeight: 800 }} />}
        </Stack>
      </Paper>

      {data.adjacency && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>つながりの一覧</Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
            {Object.entries(data.adjacency).map(([node, neighbors]) => (
              <Chip key={node} label={`${node} → ${neighbors.length ? neighbors.join("、") : "なし"}`} variant="outlined" sx={{ fontWeight: 800 }} />
            ))}
          </Stack>
        </Paper>
      )}

      {data.showQueue && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, borderColor: "#f59e0b", bgcolor: "#fffbeb" }}>
          <Typography fontWeight={950}>{data.containerLabel ?? "待ち行列（左から取り出す）"}</Typography>
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            <Typography fontSize={13} fontWeight={900} color="#92400e">{data.containerLeadingLabel ?? "次に取り出す側"}</Typography>
            {step.queue.length > 0
              ? step.queue.map((node, index) => {
                const activeIndex = data.activeContainerItem === "LAST" ? step.queue.length - 1 : 0;
                return <Chip key={`${node}-${index}`} label={node} color={index === activeIndex ? "warning" : "default"} sx={{ fontWeight: 900 }} />;
              })
              : <Chip label="空" variant="outlined" />}
            <Typography fontSize={13} fontWeight={900} color="#92400e">{data.containerTrailingLabel ?? "追加する側"}</Typography>
          </Stack>
        </Paper>
      )}

      <Typography aria-live="polite" fontWeight={900} color="#1e293b" sx={{ lineHeight: 1.75 }}>{step.message}</Typography>
      {data.code && <CodeLines code={data.code} activeLines={step.activeCodeLines ?? []} />}
      <StepTraceControls
        stepIndex={stepIndex}
        stepCount={data.steps.length}
        playing={playing}
        speed={speed}
        nextLabel={step.nextLabel}
        onReset={() => { setStepIndex(0); setPlaying(false); }}
        onPrevious={() => { setStepIndex((current) => Math.max(0, current - 1)); setPlaying(false); }}
        onNext={() => { setStepIndex((current) => Math.min(data.steps.length - 1, current + 1)); setPlaying(false); }}
        onPlayingChange={(nextPlaying) => {
          if (nextPlaying && stepIndex >= data.steps.length - 1) setStepIndex(0);
          setPlaying(nextPlaying);
        }}
        onSpeedChange={setSpeed}
      />
      {stepIndex === data.steps.length - 1 && data.finalMessage && (
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: "#ecfdf5", border: "1px solid #86efac" }}>
          <Typography color="#166534" fontWeight={900}>{data.finalMessage}</Typography>
        </Paper>
      )}
    </Stack>
  );
};
