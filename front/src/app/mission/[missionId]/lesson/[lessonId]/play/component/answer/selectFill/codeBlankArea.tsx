import { Box } from "@mui/material";
import { Blank, BlankChoice } from "../../../type";
import { BlankSlot } from "./blanckSlot";


type CodeBlankAreaProps = {
    template: string;
    blanks: Blank[];
    blankChoices: BlankChoice[];
    answers: Record<string, string>;
    checked: boolean;
  };
  
export const CodeBlankArea: React.FC<CodeBlankAreaProps> = ({
    template,
    blanks,
    blankChoices,
    answers,
    checked,
  }) => {
    const tokens = template.split(/(\{\{.+?\}\})/g);
  
    const getChoiceLabel = (choiceId?: string) => {
      return blankChoices.find((choice) => choice.id === choiceId)?.label;
    };

    const isBlankCorrect = (blank: Blank) => {
      return answers[blank.id] === blank.answerChoiceId;
    }
  
    return (
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: "#0F172A",
          color: "#E5E7EB",
          p: 3,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: 15,
          lineHeight: 2,
          whiteSpace: "pre-wrap",
          overflowX: "auto",
        }}
      >
        {tokens.map((token, index) => {
          const match = token.match(/\{\{(.+?)\}\}/);
  
          if (!match) {
            return (
              <Box component="span" key={`text-${index}`}>
                {token}
              </Box>
            );
          }
  
          const blankId = match[1];
          const blank = blanks.find((item) => item.id === blankId);
  
          if (!blank) {
            return (
              <Box component="span" key={`unknown-${index}`}>
                {token}
              </Box>
            );
          }
  
          const selectedChoiceId = answers[blank.id];
          const displayValue = getChoiceLabel(selectedChoiceId);
  
          return (
            <BlankSlot
              key={`${blankId}-${index}`}
              value={displayValue}
              placeholder={blank.placeholder}
              checked={checked}
              isCorrect={checked ? isBlankCorrect(blank) : null}
            />
          );
        })}
      </Box>
    );
  };