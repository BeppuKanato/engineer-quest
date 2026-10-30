export const learningBlockCardSx = ({
  selected = false,
  disabled = false,
  dragging = false,
}: {
  selected?: boolean;
  disabled?: boolean;
  dragging?: boolean;
}): SystemStyleObject<Theme> => ({
  minWidth: 0,
  minHeight: 52,
  px: 1.25,
  py: 1,
  display: "flex",
  alignItems: "center",
  gap: 1,
  borderRadius: 2,
  border: dragging || selected ? "2px solid #2563eb" : "1px solid #cbd5e1",
  bgcolor: dragging || selected ? "#eff6ff" : "#fff",
  boxShadow: dragging
    ? "0 14px 28px rgba(37, 99, 235, 0.18)"
    : selected
      ? "0 0 0 3px rgba(37, 99, 235, 0.10)"
      : "0 3px 10px rgba(15, 23, 42, 0.05)",
  cursor: disabled ? "default" : dragging ? "grabbing" : "grab",
  transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
  userSelect: "none",
  touchAction: "none",
  "&:hover": disabled
    ? undefined
    : {
        borderColor: "#2563eb",
        bgcolor: "#f8fbff",
        boxShadow: "0 8px 18px rgba(37, 99, 235, 0.12)",
      },
  "&:focus-visible": {
    outline: "3px solid rgba(37, 99, 235, 0.35)",
    outlineOffset: 2,
  },
  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
  },
});
import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
