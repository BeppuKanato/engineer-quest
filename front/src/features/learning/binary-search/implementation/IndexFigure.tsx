import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

/**
 * 並んだ数値をセルの列で見せる。highlight に位置を渡すと、そのセルを
 * 青く塗って「位置」の印を出す。animate のときは、そのセルが順に目立つ。
 */
export function IndexFigure({ values, highlight, label, animate = false }: {
  values: readonly number[];
  highlight?: number;
  label: string;
  animate?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return <Box role="img" aria-label={label} sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, p: 1.5, borderRadius: 2, bgcolor: "#eef4fb", justifyContent: "center" }}>
    {values.map((value, index) => {
      const isHit = highlight !== undefined && highlight >= 0 && index === highlight;
      return <Box key={index} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
        <motion.div
          initial={false}
          animate={isHit && animate && !reducedMotion ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={isHit && animate && !reducedMotion ? { delay: 0.5, duration: 0.7, ease: "easeInOut" } : { duration: 0.2 }}
          style={{ display: "flex" }}
        >
          <Box sx={{
            minWidth: 44, height: 44, px: 0.5, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 1.5, border: isHit ? "2px solid #1d4ed8" : "1.5px solid #94a3b8",
            bgcolor: isHit ? "#2563eb" : "#ffffff",
          }}>
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 800, color: isHit ? "#ffffff" : "#111827" }}>{value}</Typography>
          </Box>
        </motion.div>
        <Typography component="span" sx={{ fontSize: 12, fontWeight: isHit ? 900 : 600, color: "#111827" }}>{isHit ? `位置 ${index}` : index}</Typography>
      </Box>;
    })}
    {highlight === -1 && <Typography component="span" sx={{ fontSize: 14, fontWeight: 800, alignSelf: "center" }}>並びにありません（-1）</Typography>}
  </Box>;
}
