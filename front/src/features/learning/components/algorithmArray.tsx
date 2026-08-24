"use client";

import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

export type AlgorithmCellState =
  | "idle"
  | "active"
  | "comparing"
  | "swapping"
  | "selected"
  | "confirmed"
  | "excluded"
  | "correct"
  | "incorrect";

export type AlgorithmPointer = {
  index: number;
  label: string;
  tone?: "primary" | "secondary" | "success" | "warning";
};

type CellStyle = {
  border: string;
  background: string;
  label: string;
  dashed?: boolean;
  opacity?: number;
};

const cellStyles: Record<AlgorithmCellState, CellStyle> = {
  idle: { border: "#cbd5e1", background: "#fff", label: "" },
  active: { border: "#60a5fa", background: "#f8fbff", label: "探索中" },
  comparing: { border: "#2563eb", background: "#eff6ff", label: "比較" },
  swapping: { border: "#c2410c", background: "#fff7ed", label: "交換", dashed: true },
  selected: { border: "#7c3aed", background: "#f5f3ff", label: "選択" },
  confirmed: { border: "#15803d", background: "#ecfdf5", label: "確定" },
  excluded: { border: "#94a3b8", background: "#f1f5f9", label: "範囲外", opacity: 0.55 },
  correct: { border: "#16a34a", background: "#f0fdf4", label: "正解" },
  incorrect: { border: "#dc2626", background: "#fef2f2", label: "不正解" },
};

export const AlgorithmValueCard = ({
  value,
  index,
  state = "idle",
  compact = false,
  pointers = [],
  showIndex = true,
  disabled = false,
  onSelect,
}: {
  value: string | number;
  index: number;
  state?: AlgorithmCellState;
  compact?: boolean;
  pointers?: AlgorithmPointer[];
  showIndex?: boolean;
  disabled?: boolean;
  onSelect?: (index: number) => void;
}) => {
  const style = cellStyles[state];
  const interactive = Boolean(onSelect) && !disabled;
  const activate = () => {
    if (interactive) onSelect?.(index);
  };

  return (
    <Stack alignItems="center" sx={{ minWidth: compact ? 46 : 68, opacity: style.opacity ?? 1 }}>
      <Paper
        role={onSelect ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-disabled={onSelect ? disabled : undefined}
        aria-label={`添字${index}、値${value}${style.label ? `、${style.label}` : ""}`}
        onClick={activate}
        onKeyDown={(event) => {
          if (interactive && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            activate();
          }
        }}
        elevation={0}
        sx={{
          width: compact ? { xs: 40, sm: 46 } : { xs: 54, sm: 68 },
          height: compact ? { xs: 50, sm: 58 } : { xs: 64, sm: 78 },
          display: "grid",
          placeItems: "center",
          borderRadius: 2.5,
          border: `3px ${style.dashed ? "dashed" : "solid"} ${style.border}`,
          bgcolor: style.background,
          color: "#0f172a",
          fontSize: compact ? { xs: 22, sm: 26 } : { xs: 28, sm: 36 },
          fontWeight: 950,
          cursor: interactive ? "pointer" : "default",
          transition: "transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
          "&:hover": interactive ? { transform: "translateY(-2px)", boxShadow: "0 10px 24px rgba(37, 99, 235, 0.16)" } : undefined,
          "&:focus-visible": { outline: "3px solid rgba(37, 99, 235, 0.35)", outlineOffset: 3 },
        }}
      >
        {value}
      </Paper>
      <Typography sx={{ mt: 0.5, minHeight: 18, fontSize: 12, fontWeight: 800 }}>
        {style.label}
      </Typography>
      {showIndex && (
        <Typography component="span" color="text.secondary" fontSize={11} fontWeight={800}>
          index {index}
        </Typography>
      )}
      <Stack spacing={0.5} alignItems="center" sx={{ mt: 0.5, minHeight: pointers.length > 0 ? 30 : 0 }}>
        {pointers.map((pointer) => (
          <Chip
            key={`${pointer.label}-${pointer.index}`}
            size="small"
            color={pointer.tone ?? "primary"}
            label={`${pointer.label}: ${pointer.index}`}
            sx={{ fontWeight: 900 }}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export const AlgorithmArray = ({
  values,
  states = {},
  pointers = [],
  compact = false,
  showIndices = true,
  disabled = false,
  isIndexDisabled,
  onSelectIndex,
  ariaLabel = "アルゴリズムで扱う配列",
}: {
  values: readonly (string | number)[];
  states?: Partial<Record<number, AlgorithmCellState>>;
  pointers?: readonly AlgorithmPointer[];
  compact?: boolean;
  showIndices?: boolean;
  disabled?: boolean;
  isIndexDisabled?: (index: number) => boolean;
  onSelectIndex?: (index: number) => void;
  ariaLabel?: string;
}) => (
  <Box role="group" aria-label={ariaLabel} sx={{ overflowX: "auto", px: 0.5, py: 1 }}>
    <Stack direction="row" spacing={compact ? 0.75 : { xs: 1.25, sm: 2 }} sx={{ minWidth: "max-content" }}>
      {values.map((value, index) => (
        <AlgorithmValueCard
          key={`${index}-${String(value)}`}
          value={value}
          index={index}
          state={states[index] ?? "idle"}
          compact={compact}
          pointers={pointers.filter((pointer) => pointer.index === index)}
          showIndex={showIndices}
          disabled={disabled || isIndexDisabled?.(index) === true}
          onSelect={onSelectIndex}
        />
      ))}
    </Stack>
  </Box>
);

export const AlgorithmStateLegend = ({
  states = ["comparing", "swapping", "confirmed", "excluded"],
}: {
  states?: readonly AlgorithmCellState[];
}) => (
  <Stack direction="row" gap={1} flexWrap="wrap" aria-label="配列表示の凡例">
    {states.map((state) => {
      const style = cellStyles[state];
      return (
        <Chip
          key={state}
          label={style.label || state}
          sx={{ bgcolor: style.background, border: `1px solid ${style.border}`, fontWeight: 800 }}
        />
      );
    })}
  </Stack>
);
