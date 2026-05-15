import { isComponentType } from "@/app/problem/component/common/common";
import { LessonActivity } from "../../type";
import { ChoiceAnswer } from "./choiceAnswer";
import { SelectFillAnswer } from "./selectFillAnwer";
import { TryCodeAnswer } from "./tryCodeAnswer";

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
    
    case "SELECT_FILL":

      if (!activity.blankArea) return null;
      
      return(
          <SelectFillAnswer
              blankArea={activity.blankArea}
              blanks={activity.blanks ?? []}
              blankChoices={activity.blankChoices ?? []}
              userAnswer={userAnswer}
              checked={checked}
              isCorrect={isCorrect}
              onAnswerChange={onAnswerChange}
          />
      )
    case "TRY_CODE":
      return (
        <TryCodeAnswer
          starterCode={activity.starterCode}
          sampleCode={activity.sampleCode}
          userAnswer={userAnswer}
          onAnswerChange={onAnswerChange} 
        />
      )
    default:
      return null;
  }
};