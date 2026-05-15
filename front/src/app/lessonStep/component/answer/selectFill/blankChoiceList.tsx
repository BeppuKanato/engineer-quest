import { Box, Stack, Grid, Button, Typography } from "@mui/material";

import { Blank, BlankChoice } from "../../../type";

type BlankChoiceListProps = {
    blanks: Blank[];
    blankChoices: BlankChoice[];
    answers: Record<string, string>;
    shouldLock: boolean;
    onSelect: (blankId: string, choiceId: string) => void;
  };
  
export const BlankChoiceList: React.FC<BlankChoiceListProps> = ({
    blanks,
    blankChoices,
    answers,
    shouldLock,
    onSelect,
  }) => {
    return (
      <Stack spacing={2}>
        {blanks.map((blank, index) => (
          <Box key={blank.id}>
            <Typography
              variant="body2"
              fontWeight={700}
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              空欄 {index + 1}
            </Typography>
  
            <Grid container spacing={2}>
              {blankChoices.map((choice) => {
                const isSelected = answers[blank.id] === choice.id;
  
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={choice.id}>
                    <Button
                      fullWidth
                      variant={isSelected ? "contained" : "outlined"}
                      disabled={shouldLock}
                      onClick={() => onSelect(blank.id, choice.id)}
                      sx={{
                        py: 1.75,
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
        ))}
      </Stack>
    );
  };