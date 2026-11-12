import { playerTokens } from "../../player/player.tokens";

/** 既存の表示契約。固定コード窓と全コード表示の差は残し、単元名では分岐しない。 */
export type LearningContentFrame = "standard" | "code-check" | "code-check-flow" | "check" | "check-flow" | "diagnostic-flow";

export function learningContentFrame(embedded: boolean, frame: LearningContentFrame) {
  const check = frame === "check" || frame === "check-flow";
  return {
    root: {
      minHeight: embedded ? 0 : "100dvh", height: embedded ? "100%" : undefined,
      display: "grid", placeItems: "center", bgcolor: playerTokens.background, color: playerTokens.text,
      ...(check || frame === "code-check-flow" ? { minWidth: 0 } : {}),
      ...(frame === "check" ? { width: "100%", gridTemplateColumns: "minmax(0, 1fr)" } : {}),
    },
    section: {
      width: embedded ? "100%" : "84vw", height: embedded ? "100%" : "84dvh",
      minHeight: embedded ? 0 : 500, p: 1, display: "flex", flexDirection: "column",
      ...(frame === "code-check" ? { minHeight: 0 } : {}),
      ...(check ? { width: embedded ? "100%" : { xs: "100%", sm: "84vw" }, maxWidth: "100%", minWidth: 0, boxSizing: "border-box" } : {}),
      ...(frame === "code-check-flow" ? { height: undefined, minHeight: embedded ? 0 : "84dvh", minWidth: 0, boxSizing: "border-box", justifyContent: "center" } : {}),
      ...(frame === "diagnostic-flow" ? { minHeight: undefined, minWidth: 0, boxSizing: "border-box" } : {}),
    },
  } as const;
}
