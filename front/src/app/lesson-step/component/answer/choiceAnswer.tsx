import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { Choice } from "../../type";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";


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
          const isAnswered = checked;
          const isCorrectChoice = choice.isCorrect;
          const isSelectedCorrect = isAnswered && isSelected && isCorrectChoice;
          const isSelectedWrong = isAnswered && isSelected && !isCorrectChoice;
          const shouldLock = checked && isCorrect === true;

          return (
            <Grid size={{ xs: 12, sm: 6 }} key={choice.id}>
              <Button
                fullWidth
                variant={isSelected ? "contained" : "outlined"}
                disabled={shouldLock}
                onClick={() => handleChoiceSelect(choice.id)}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",

                  bgcolor: isSelectedCorrect
                    ? "#DCFCE7"
                    : isSelectedWrong
                      ? "#FFE4E6"
                      : isSelected
                        ? undefined
                        : "#FFFFFF",

                  color: isSelectedCorrect
                    ? "#15803D"
                    : isSelectedWrong
                      ? "#BE123C"
                      : undefined,

                  borderColor: isSelectedCorrect
                    ? "#86EFAC"
                    : isSelectedWrong
                      ? "#FDA4AF"
                      : undefined,

                  boxShadow: isSelectedCorrect
                    ? "0 10px 22px rgba(34, 197, 94, 0.16)"
                    : isSelected
                      ? "0 10px 22px rgba(25, 118, 210, 0.20)"
                      : "none",

                  "&.Mui-disabled": {
                    bgcolor: isSelectedCorrect ? "#DCFCE7" : "#F8FAFC",
                    color: isSelectedCorrect ? "#15803D" : "#94A3B8",
                    borderColor: isSelectedCorrect ? "#86EFAC" : "#E2E8F0",
                    opacity: 1,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                >
                  {isSelectedCorrect && (
                    <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
                  )}

                  {isSelectedWrong && (
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                  )}

                  <Box component="span">{choice.label}</Box>
                </Stack>
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};