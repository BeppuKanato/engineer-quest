import { Button, Stack } from "@mui/material";

type LessonActionButtonsProps = {
  showBack: boolean;
  canAction: boolean;
  buttonLabel: string;
  onBack: () => void;
  onAction: () => void;
};

export const LessonActionButtons: React.FC<LessonActionButtonsProps> = ({
  showBack,
  canAction,
  buttonLabel,
  onBack,
  onAction,
}) => {
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end">
      {showBack && (
        <Button
          variant="outlined"
          size="large"
          onClick={onBack}
          sx={{
            px: 5,
            py: 1.5,
            borderRadius: 3,
            fontWeight: 800,
            bgcolor: "#FFFFFF",
          }}
        >
          戻る
        </Button>
      )}

      <Button
        variant="contained"
        size="large"
        disabled={!canAction}
        onClick={onAction}
        sx={{
          px: 5,
          py: 1.5,
          borderRadius: 3,
          fontWeight: 800,
          boxShadow: "0 8px 18px rgba(25, 118, 210, 0.24)",
        }}
      >
        {buttonLabel}
      </Button>
    </Stack>
  );
};