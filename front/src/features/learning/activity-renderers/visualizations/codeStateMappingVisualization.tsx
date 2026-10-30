/** Pythonコードの行、処理の役割、画面上の状態変化を同じ選択状態で結ぶ共通表示。 */
"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { CodeLines } from "@/features/learning/components";

type CodeMapping = {
  id: string;
  label: string;
  lines: number[];
  role: string;
  state: string;
};

export function CodeStateMappingVisualization({ content }: { content: Record<string, unknown> }) {
  const code = typeof content.code === "string" ? content.code : "";
  const mappings = Array.isArray(content.mappings) ? content.mappings as CodeMapping[] : [];
  const [selectedId, setSelectedId] = useState(mappings[0]?.id ?? "");
  const selected = mappings.find((mapping) => mapping.id === selectedId) ?? mappings[0];

  if (!selected) return null;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Typography color="#475569" fontWeight={850}>
        役割カードを順に選び、色がつくコード行と状態変化の対応を確認してください。
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(280px, .9fr)" }, gap: 2, minWidth: 0 }}>
        <CodeLines code={code} activeLines={selected.lines} showLineNumbers wrapLongLines />
        <Stack spacing={1}>
          {mappings.map((mapping, index) => {
            const active = mapping.id === selected.id;
            return (
              <Paper
                key={mapping.id}
                component="button"
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(mapping.id)}
                elevation={0}
                sx={{
                  width: "100%",
                  p: 1.5,
                  textAlign: "left",
                  borderRadius: 2,
                  border: `${active ? 2 : 1}px solid ${active ? "#2563eb" : "#cbd5e1"}`,
                  bgcolor: active ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  color: "#0f172a",
                  transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                  "&:hover": { borderColor: "#2563eb", transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(37, 99, 235, .12)" },
                  "&:focus-visible": { outline: "3px solid rgba(37, 99, 235, .35)", outlineOffset: 2 },
                }}
              >
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip size="small" color={active ? "primary" : "default"} label={index + 1} sx={{ fontWeight: 950 }} />
                  <Typography fontWeight={950}>{mapping.label}</Typography>
                  <Chip size="small" variant="outlined" label={`行 ${mapping.lines.join(", ")}`} sx={{ fontWeight: 850 }} />
                </Stack>
                <Typography sx={{ mt: 1, lineHeight: 1.65 }}><strong>役割：</strong>{mapping.role}</Typography>
                <Typography sx={{ mt: 0.5, lineHeight: 1.65, color: "#1d4ed8", fontWeight: 850 }}><strong>状態変化：</strong>{mapping.state}</Typography>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
