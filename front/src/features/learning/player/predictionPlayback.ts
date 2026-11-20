import type { CanvasSnapshot, LearningContent } from "./content.types";
import { advancePlayback, type PlaybackAction, type PlaybackState } from "./playback";

export type PredictionPlaybackState = {
  playback: PlaybackState;
  pendingIndex: number | null;
  resolvedStepIds: readonly string[];
  feedback: { stepId: string; correct: boolean | null } | null;
};
export type PredictionPlaybackAction = PlaybackAction | { type: "answer"; choiceId: string } | { type: "skip" };

export const initialPredictionPlayback = (): PredictionPlaybackState => ({
  playback: { index: 0, playing: false }, pendingIndex: null, resolvedStepIds: [], feedback: null,
});

/** 図を切り替える前に停止する。予想は各再生セッションで一度だけ、正誤によらず解放する。 */
export function advancePredictionPlayback<TCanvas extends CanvasSnapshot>(
  state: PredictionPlaybackState, action: PredictionPlaybackAction, content: LearningContent<TCanvas>,
): PredictionPlaybackState {
  if (state.pendingIndex !== null) {
    if (action.type !== "answer" && action.type !== "skip") return state;
    const step = content.steps[state.pendingIndex];
    const prediction = step.prediction!;
    if (action.type === "answer" && !prediction.choices.some(choice => choice.id === action.choiceId)) return state;
    return {
      playback: { index: state.pendingIndex, playing: state.pendingIndex < content.steps.length - 1 },
      pendingIndex: null, resolvedStepIds: [...state.resolvedStepIds, step.id],
      feedback: { stepId: step.id, correct: action.type === "skip" ? null : action.choiceId === prediction.correctChoiceId },
    };
  }
  if (action.type === "answer" || action.type === "skip") return state;
  const next = advancePlayback(state.playback, action, content.steps.length);
  const restarting = action.type === "toggle" && state.playback.index === content.steps.length - 1 && next.playing;
  const resolvedStepIds = restarting ? [] : state.resolvedStepIds;
  if (next.index !== state.playback.index && content.steps[next.index].prediction &&
    !resolvedStepIds.includes(content.steps[next.index].id)) {
    return { playback: { index: next.index - 1, playing: false }, pendingIndex: next.index, resolvedStepIds, feedback: null };
  }
  return { playback: next, pendingIndex: null, resolvedStepIds,
    feedback: next.index === state.playback.index ? state.feedback : null };
}
