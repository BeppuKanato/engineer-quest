export type PlaybackState = { index: number; playing: boolean };
export type PlaybackAction =
  | { type: "seek"; index: number }
  | { type: "toggle" }
  | { type: "tick" };

/** 手動操作は必ず停止。末尾では停止し、末尾からの再生は先頭から再開する。 */
export function advancePlayback(state: PlaybackState, action: PlaybackAction, count: number): PlaybackState {
  const last = Math.max(0, count - 1);
  if (action.type === "seek") {
    const index = Number.isFinite(action.index) ? Math.trunc(action.index) : 0;
    return { index: Math.max(0, Math.min(last, index)), playing: false };
  }
  if (action.type === "toggle") {
    if (count < 2) return { index: 0, playing: false };
    return { index: state.index === last ? 0 : state.index, playing: !state.playing };
  }
  if (!state.playing) return state;
  const index = Math.min(last, state.index + 1);
  return { index, playing: index < last };
}
