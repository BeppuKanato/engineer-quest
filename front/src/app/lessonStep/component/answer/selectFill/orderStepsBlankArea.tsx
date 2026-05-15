import { Blank, BlankChoice } from "../../../type";
import { BlankSlot } from "./blanckSlot";

type OrderedStepsBlankAreaProps = {
  blanks: Blank[];
  blankChoices: BlankChoice[];
  answers: Record<string, string>;
  checked: boolean;
  isCorrect: boolean | null;
};

export const OrderedStepsBlankArea: React.FC<OrderedStepsBlankAreaProps> = ({
  blanks,
  blankChoices,
  answers,
  checked,
  isCorrect,
}) => {
  const getChoiceLabel = (choiceId?: string) => {
    return blankChoices.find((choice) => choice.id === choiceId)?.label;
  };

  return (
    <Stack spacing={1.5}>
      {blanks.map((blank, index) => {
        const selectedChoiceId = answers[blank.id];
        const displayValue = getChoiceLabel(selectedChoiceId);

        return (
          <Box
            key={blank.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              bgcolor: "#F8FBFF",
              p: 2,
            }}
          >
            <Typography fontWeight={800} color="primary.main">
              {index + 1}
            </Typography>

            <Box sx={{ flex: 1 }}>
              <BlankSlot
                value={displayValue}
                placeholder={blank.placeholder}
                checked={checked}
                isCorrect={isCorrect}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};