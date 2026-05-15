import { Box } from "@mui/material";

type BlankSlotProps = {
    value?: string;
    placeholder: string;
    checked: boolean;
    isCorrect: boolean | null;
  };
  
export const BlankSlot: React.FC<BlankSlotProps> = ({
    value,
    placeholder,
    checked,
    isCorrect,
  }) => {
    const hasValue = Boolean(value);
  
    const borderColor =
      checked && isCorrect === false
        ? "#F87171"
        : hasValue
          ? "#60A5FA"
          : "#F59E0B";
  
    const bgcolor =
      checked && isCorrect === false
        ? "#7F1D1D"
        : hasValue
          ? "#1D4ED8"
          : "#92400E";
  
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "baseline",
          mx: 0.35,
          px: 0.9,
          py: 0.15,
          minWidth: 36,
          borderRadius: 1,
          border: "1px solid",
          borderColor,
          bgcolor,
          color: "#FFFFFF",
          fontSize: 13,
          lineHeight: 1.4,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {hasValue ? value : placeholder}
      </Box>
    );
  };