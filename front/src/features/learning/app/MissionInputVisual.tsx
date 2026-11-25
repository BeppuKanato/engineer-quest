"use client";

// 入力の見方（図解）（2026-11-25）。入力の文章説明を読む前に、
// 例の入力をそのまま図にして、記号の意味が凡例で分かるようにする。

import type { DevMission } from "@/features/learning/app/developmentMissions";
import { Box, Typography } from "@mui/material";

export const MissionInputVisual: React.FC<{ visual: DevMission["inputVisual"] }> = ({ visual }) => {
  const legendByMark = new Map(visual.legend.map((l) => [l.mark, l]));
  return (
    <Box>
      {visual.kind === "grid" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
          {visual.rows.map((row, ri) => (
            <Box key={ri} sx={{ display: "flex", gap: "3px" }}>
              {row.split("").map((ch, ci) => {
                const l = legendByMark.get(ch);
                return (
                  <Box
                    key={ci}
                    sx={{
                      width: 30, height: 30, borderRadius: 1,
                      bgcolor: l?.bg ?? "#f1f5f9", color: l?.fg ?? "#111827",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 900, fontFamily: "monospace",
                    }}
                  >
                    {ch}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      )}
      {visual.kind === "versions" && (
        <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {visual.states.map((s, i) => {
            const l = legendByMark.get(String(s));
            return (
              <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                <Typography component="p" sx={{ fontSize: 14, fontWeight: 700 }}>{i + 1}</Typography>
                <Box
                  sx={{
                    width: 32, height: 42, borderRadius: 1.5, position: "relative", overflow: "hidden",
                    bgcolor: l?.bg ?? "#f1f5f9", color: l?.fg ?? "#111827",
                    border: "2px solid #5b7186",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 900, fontFamily: "monospace",
                  }}
                >
                  {s}
                  {s === 1 && (
                    <Box component="svg" viewBox="0 0 32 42" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden>
                      <path d="M8 6 l7 9 l-4 8 l9 9" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </Box>
                  )}
                </Box>
                <Typography component="p" sx={{ fontSize: 14 }}>{i === 0 ? "版の番号" : ""}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
        {visual.legend.map((l) => (
          <Box key={l.mark} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 22, height: 22, borderRadius: 0.75, bgcolor: l.bg, color: l.fg, border: "1px solid #5b7186", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, fontFamily: "monospace" }}>
              {l.mark}
            </Box>
            <Typography component="p" sx={{ fontSize: 14 }}>{l.label}</Typography>
          </Box>
        ))}
      </Box>
      <Typography component="p" sx={{ fontSize: 14, mt: 1 }}>{visual.firstLine}</Typography>
    </Box>
  );
};

const cellPalette = (ch: string): { bg: string; fg: string } => {
  if (ch === "S") return { bg: "#2563eb", fg: "#fff" };
  if (ch === "G") return { bg: "#d97706", fg: "#fff" };
  if (ch === "#") return { bg: "#5b7186", fg: "#fff" };
  return { bg: "#f3e9d2", fg: "#111827" };
};

/**
 * 例の見方：同じ地図の上で「通る経路」と「調べた範囲」の違いを色で示す。
 * 出力の2つの数（通る部屋数／調べた部屋数）が何を数えているかを、図と結び付ける。
 * 解き方（調べる順序）は描かない。
 */
export const MissionExampleTrace: React.FC<{
  rows: string[];
  pathCells: Array<[number, number]>;
  examinedCells: Array<[number, number]>;
  pathLabel: string;
  examinedLabel: string;
}> = ({ rows, pathCells, examinedCells, pathLabel, examinedLabel }) => {
  const key = (r: number, c: number) => `${r},${c}`;
  const path = new Set(pathCells.map(([r, c]) => key(r, c)));
  const examined = new Set(examinedCells.map(([r, c]) => key(r, c)));
  return (
    <Box>
      <Box sx={{ display: "inline-flex", flexDirection: "column", gap: 0.5 }}>
        {rows.map((row, r) => (
          <Box key={r} sx={{ display: "flex", gap: 0.5 }}>
            {row.split("").map((ch, c) => {
              const isPath = path.has(key(r, c));
              const isExamined = examined.has(key(r, c));
              const palette = cellPalette(ch);
              const isSG = ch === "S" || ch === "G";
              return (
                <Box
                  key={c}
                  sx={{
                    width: 30, height: 30, borderRadius: 1,
                    bgcolor: isPath && !isSG ? "#2563eb" : isExamined ? "#fde68a" : palette.bg,
                    color: isPath && !isSG ? "#fff" : isExamined ? "#92400e" : palette.fg,
                    border: isPath && isSG ? "2.5px solid #2563eb" : isExamined ? "1.5px solid #d97706" : "1px solid #d8cfc0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 900, fontFamily: "monospace",
                  }}
                >
                  {ch}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: 0.75, bgcolor: "#2563eb", flexShrink: 0 }} />
          <Typography component="p" sx={{ fontSize: 14 }}>{pathLabel}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: 0.75, bgcolor: "#fde68a", border: "1.5px solid #d97706", flexShrink: 0 }} />
          <Typography component="p" sx={{ fontSize: 14 }}>{examinedLabel}</Typography>
        </Box>
      </Box>
    </Box>
  );
};
