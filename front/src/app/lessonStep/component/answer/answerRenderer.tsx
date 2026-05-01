import { isComponentType } from "@/app/problem/component/common/common";
import { LessonActivity } from "../../type";
import { ChoiceAnswer } from "./choiceAnswer";
import { FillBlankAnswer } from "./fillBlankAnswer";

type AnswerRendererProps = {
  activity: LessonActivity;
  selectedChoiceId: string | null;
  checked: boolean;
  isCorrect: boolean | null;
  userAnswer: unknown;
  onChoiceSelect: (choiceId: string) => void;
  onAnswerChange: (answer: unknown) => void;
};

export const AnswerRenderer: React.FC<AnswerRendererProps> = ({
  activity,
  selectedChoiceId,
  checked,
  isCorrect,
  userAnswer,
  onChoiceSelect,
  onAnswerChange
}) => {
  switch (activity.type) {
    case "CHOICE":
      return (
        <ChoiceAnswer
          choices={activity.choices ?? []}
          selectedChoiceId={selectedChoiceId}
          checked={checked}
          isCorrect={isCorrect}
          handleChoiceSelect={onChoiceSelect}
        />
      );
    
    case "FILL_BLANK":
        return(
            <FillBlankAnswer
                codeTemplate={activity.codeTemplate ?? ""}
                blanks={activity.blanks ?? []}
                blankChoices={activity.blankChoices ?? []}
                userAnswer={userAnswer}
                checked={checked}
                isCorrect={isCorrect}
                onAnswerChange={onAnswerChange}
            />
        )
    default:
      return null;
  }
};