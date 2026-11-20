"use client";

import { Button, Stack, Typography } from "@mui/material";

import type { StepPrediction } from "./content.types";
import { playerTokens } from "./player.tokens";

export function PredictionChoices({ prediction, disabled, onAnswer, onSkip }: {
  prediction: StepPrediction; disabled: boolean; onAnswer: (choiceId: string) => void; onSkip: () => void;
}) {
  return <Stack role="group" aria-label="予想の選択肢" spacing={1.5} sx={{ justifyContent: "center", p: 1 }}>
    <Typography sx={{ color: playerTokens.text }}>今の図を見て、予想を選んでください。</Typography>
    {prediction.choices.map((choice, index) => <Button key={choice.id} variant="outlined" disabled={disabled} autoFocus={index === 0 && !disabled}
      onClick={() => onAnswer(choice.id)} sx={{ color: playerTokens.text, borderColor: playerTokens.control,
        justifyContent: "flex-start", textAlign: "left", fontSize: "clamp(16px, 1.2vw, 22px)", py: 1.5 }}>
      {choice.text}
    </Button>)}
    <Button disabled={disabled} onClick={onSkip} sx={{ color: playerTokens.text }}>予想を飛ばして続ける</Button>
  </Stack>;
}
