"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Paper, Stack, Typography } from "@mui/material";

export type SelectableCardState = "idle" | "selected" | "correct" | "incorrect";

export type SelectableCardItem = {
  id: string;
  label: string;
  state?: SelectableCardState;
};

export const SelectableCardList = ({
  items,
  disabled = false,
  onSelect,
  ariaLabel = "選択肢",
}: {
  items: readonly SelectableCardItem[];
  disabled?: boolean;
  onSelect: (id: string) => void;
  ariaLabel?: string;
}) => (
  <Stack role="radiogroup" aria-label={ariaLabel} spacing={1.25}>
    {items.map((item) => {
      const state = item.state ?? "idle";
      const selected = state !== "idle";
      const border = state === "correct" ? "#22c55e" : state === "incorrect" ? "#ef4444" : state === "selected" ? "#2563eb" : "#bfdbfe";
      const background = state === "correct" ? "#ecfdf5" : state === "incorrect" ? "#fef2f2" : state === "selected" ? "#eff6ff" : "#fff";

      return (
        <Paper
          key={item.id}
          component="button"
          type="button"
          role="radio"
          aria-checked={selected}
          disabled={disabled}
          onClick={() => onSelect(item.id)}
          sx={{
            width: "100%",
            minHeight: 64,
            px: 2,
            py: 1.4,
            display: "flex",
            alignItems: "center",
            gap: 1.4,
            textAlign: "left",
            borderRadius: 2,
            border: `${selected ? 2 : 1}px solid ${border}`,
            bgcolor: background,
            color: "#0f172a",
            cursor: disabled ? "default" : "pointer",
            boxShadow: state === "selected" ? "0 10px 24px rgba(37, 99, 235, 0.12)" : "none",
            transition: "transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
            "&:hover": disabled ? undefined : { transform: "translateY(-1px)", borderColor: "#2563eb", boxShadow: "0 12px 26px rgba(37, 99, 235, 0.14)" },
            "&:focus-visible": { outline: "3px solid rgba(37, 99, 235, 0.35)", outlineOffset: 2 },
          }}
        >
          {state === "correct" ? <CheckCircleIcon sx={{ color: "#16a34a" }} /> : state === "incorrect" ? <ErrorOutlineIcon sx={{ color: "#dc2626" }} /> : selected ? <CheckCircleIcon sx={{ color: "#2563eb" }} /> : <RadioButtonUncheckedIcon sx={{ color: "#64748b" }} />}
          <Typography fontWeight={900}>{item.label}</Typography>
        </Paper>
      );
    })}
  </Stack>
);
