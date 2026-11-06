"use client";

import { Box, Typography } from "@mui/material";

import { GraphEdges, GraphNodes, GraphViewport } from "../../player/GraphDrawing";
import { graphGeometry } from "../../player/graphGeometry";
import { playerTokens } from "../../player/player.tokens";
import { searchGraphEdges, searchGraphNodes } from "../../graphs/searchGraph";
import { bfsDistancesFrom } from "../bfsDistances";

/**
 * 到達図：単元の完成図を結果画面に出す静的表示（BFS は全ノードに距離が入った最終状態）。
 * 学習中の状態色（完了＝グレー）ではなく、達成を示す青で全ノードを描く。
 * 距離は正本グラフから導出する（bfsDistancesFrom）ので、図と教材の距離がずれることはない。
 */
export function BfsResultFigure() {
  const distances = bfsDistancesFrom("A");
  const position = (id: string) => searchGraphNodes.find(node => node.id === id)!;
  const transition = { duration: 0, ease: "easeInOut" } as const;
  return <Box data-result-figure sx={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
    <GraphViewport label="完成した図：すべての場所に距離が入った状態" height={300}>
      <GraphEdges transition={transition} position={position}
        edges={searchGraphEdges.map(edge => ({ ...edge, highlighted: false }))} />
      <GraphNodes transition={transition}
        nodes={searchGraphNodes.map(node => ({
          ...node, label: node.id, status: "processing" as const, highlighted: false,
          ariaLabel: `${node.id}：${distances.get(node.id)}歩`,
        }))}
        renderNodeDecoration={nodeId => {
          const distance = distances.get(nodeId)!;
          return <g transform={`translate(${graphGeometry.nodeRadius - 2}, ${-graphGeometry.nodeRadius + 2})`}>
            <circle r={13} fill={playerTokens.surface} stroke={playerTokens.focus} strokeWidth={2} />
            <text textAnchor="middle" y={5} fontSize={14} fontWeight={700} fill={playerTokens.focus}>{distance}</text>
          </g>;
        }} />
    </GraphViewport>
    <Typography component="p" sx={{ textAlign: "center", fontSize: 14, color: playerTokens.text }}>
      この段階で完成した図（すべての場所に距離が入った状態）
    </Typography>
  </Box>;
}
