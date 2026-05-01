import { Box, Button, Grid, Typography } from "@mui/material";
import { Choice } from "../../type";

type ChoiceAnswerProps = {
  choices: Choice[];
  selectedChoiceId: string | null;
  checked: boolean;
  isCorrect: boolean | null;
  handleChoiceSelect: (choiceId: string) => void;
};

export const ChoiceAnswer: React.FC<ChoiceAnswerProps> = ({
  choices,
  selectedChoiceId,
  checked,
  isCorrect,
  handleChoiceSelect,
}) => {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={800}
        sx={{ mb: 2 }}
      >
        答えを選んでください
      </Typography>

      <Grid container spacing={2}>
        {choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;

          return (
            <Grid size={{ xs: 12, sm: 6 }} key={choice.id}>
              <Button
                fullWidth
                variant={isSelected ? "contained" : "outlined"}
                disabled={checked && isCorrect === true}
                onClick={() => handleChoiceSelect(choice.id)}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  bgcolor: isSelected ? undefined : "#FFFFFF",
                }}
              >
                {choice.label}
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};