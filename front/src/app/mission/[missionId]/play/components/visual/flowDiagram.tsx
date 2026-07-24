"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import CodeIcon from "@mui/icons-material/Code";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import LaptopMacOutlinedIcon from "@mui/icons-material/LaptopMacOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { Box, Stack, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

import type {
  FlowDiagramVisual,
  MissionVisualIcon,
} from "./type";
import { visualToneStyle } from "./visualTheme";

type FlowDiagramProps = {
  visual: FlowDiagramVisual;
};

const iconByType: Record<MissionVisualIcon, SvgIconComponent> = {
  browser: LaptopMacOutlinedIcon,
  server: DnsOutlinedIcon,
  database: StorageOutlinedIcon,
  cloud: CloudOutlinedIcon,
  user: PersonOutlineIcon,
  device: SmartphoneOutlinedIcon,
  file: InsertDriveFileOutlinedIcon,
  code: CodeIcon,
};

const FlowNode = ({
  node,
}: {
  node: FlowDiagramVisual["nodes"][number];
}) => {
  const Icon = iconByType[node.icon];
  const tone = visualToneStyle[node.tone ?? "blue"];

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{
        flex: "0 0 150px",
        minHeight: 148,
        p: 2,
        textAlign: "center",
        border: `1px solid ${tone.border}`,
        borderRadius: 2,
        bgcolor: tone.background,
      }}
    >
      <Box
        sx={{
          width: 58,
          height: 58,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "#fff",
          color: tone.color,
          boxShadow: `0 5px 16px ${tone.border}66`,
        }}
      >
        <Icon sx={{ fontSize: 34 }} />
      </Box>
      <Typography fontWeight={900}>{node.label}</Typography>
      {node.description && (
        <Typography variant="caption" sx={{ lineHeight: 1.5, color: "#475569", fontWeight: 700 }}>
          {node.description}
        </Typography>
      )}
    </Stack>
  );
};

const FlowEdge = ({
  edge,
  direction,
}: {
  edge: FlowDiagramVisual["edges"][number] | undefined;
  direction: "horizontal" | "vertical";
}) => {
  if (!edge) {
    return <Box sx={{ flex: "1 1 80px", minWidth: 64, minHeight: 48 }} />;
  }

  const isHorizontal = direction === "horizontal";
  const ForwardIcon = isHorizontal ? ArrowForwardIcon : ArrowDownwardIcon;
  const ReverseIcon = isHorizontal ? ArrowBackIcon : ArrowUpwardIcon;

  return (
    <Stack
      spacing={0.25}
      alignItems="center"
      justifyContent="center"
      sx={{
        flex: "1 1 120px",
        minWidth: isHorizontal ? 104 : 180,
        minHeight: isHorizontal ? 90 : 104,
        color: "#334155",
      }}
    >
      {edge.label && (
        <Typography variant="caption" fontWeight={800} textAlign="center">
          {edge.label}
        </Typography>
      )}
      <Box
        sx={{
          width: isHorizontal ? "100%" : 32,
          height: isHorizontal ? 28 : 42,
          display: "grid",
          placeItems: "center",
          color: "#2563eb",
        }}
      >
        <ForwardIcon sx={{ fontSize: isHorizontal ? 38 : 34 }} />
      </Box>

      {edge.bidirectional && (
        <>
          <Box
            sx={{
              width: isHorizontal ? "100%" : 32,
              height: isHorizontal ? 28 : 42,
              display: "grid",
              placeItems: "center",
              color: "#64748b",
            }}
          >
            <ReverseIcon sx={{ fontSize: isHorizontal ? 38 : 34 }} />
          </Box>
          {edge.reverseLabel && (
            <Typography variant="caption" fontWeight={800} textAlign="center">
              {edge.reverseLabel}
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
};

export const FlowDiagram = ({ visual }: FlowDiagramProps) => {
  const direction = visual.direction ?? "horizontal";
  const isHorizontal = direction === "horizontal";
  const connectionFor = (from: string, to: string) =>
    visual.edges.find(
      (edge) =>
        (edge.from === from && edge.to === to) ||
        (edge.bidirectional && edge.from === to && edge.to === from)
    );

  return (
    <Box
      role="img"
      aria-label={
        visual.title ??
        visual.caption ??
        visual.nodes.map((node) => node.label).join("から")
      }
      sx={{ overflowX: "auto", py: 1 }}
    >
      <Stack
        direction={isHorizontal ? "row" : "column"}
        alignItems="center"
        justifyContent="center"
        sx={{ minWidth: isHorizontal ? "max-content" : 0 }}
      >
        {visual.nodes.map((node, index) => {
          const nextNode = visual.nodes[index + 1];
          const edge = nextNode ? connectionFor(node.id, nextNode.id) : undefined;

          return (
            <Stack
              key={node.id}
              direction={isHorizontal ? "row" : "column"}
              alignItems="center"
              sx={{ display: "contents" }}
            >
              <FlowNode node={node} />
              {nextNode && <FlowEdge edge={edge} direction={direction} />}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
};
