import { Box, Typography } from "@mui/material";

/**
 * 距離の並びを「場所：距離」のチップで見せる。expected を渡すと、
 * 期待と違う場所を太枠＋×印で示す（色だけに頼らない）。
 */
export function DistanceValues({ nodes, values, expected }: {
  nodes: readonly string[];
  values: readonly number[];
  expected?: readonly number[];
}) {
  return <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
    {nodes.map((node, index) => {
      const value = values[index];
      const different = expected !== undefined && expected[index] !== value;
      return <Box key={node} sx={{
        display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5,
        border: different ? "2px solid #111827" : "1px solid #cbd5e1", borderRadius: 1.5, bgcolor: "#fff",
      }}>
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 800 }}>{node}</Typography>
        <Typography component="span" sx={{ fontSize: 15, fontWeight: 700 }}>{value ?? "—"}</Typography>
        {different && <Typography component="span" aria-label="期待と違います" sx={{ fontSize: 13, fontWeight: 900 }}>×</Typography>}
      </Box>;
    })}
  </Box>;
}
