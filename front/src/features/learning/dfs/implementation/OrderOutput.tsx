import { Box, Typography } from "@mui/material";

/**
 * 訪問順を「A → B → D …」の並びで見せる。expected を渡すと、
 * その位置の期待と違う場所を太枠＋×印で示す（色だけに頼らない）。
 */
export function OrderValues({ values, expected }: {
  values: readonly string[];
  expected?: readonly string[];
}) {
  return <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
    {values.map((value, index) => {
      const different = expected !== undefined && expected[index] !== value;
      return <Box key={index} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        {index > 0 && <Typography component="span" aria-hidden sx={{ fontSize: 13, fontWeight: 900 }}>→</Typography>}
        <Box sx={{
          display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.9, py: 0.4,
          border: different ? "2px solid #111827" : "1px solid #cbd5e1", borderRadius: 1.5, bgcolor: "#fff",
        }}>
          <Typography component="span" sx={{ fontSize: 15, fontWeight: 800 }}>{value}</Typography>
          {different && <Typography component="span" aria-label="期待と違います" sx={{ fontSize: 13, fontWeight: 900 }}>×</Typography>}
        </Box>
      </Box>;
    })}
  </Box>;
}
