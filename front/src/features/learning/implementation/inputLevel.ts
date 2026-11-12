/**
 * フェーズ7（自分で実装）の入力量レベル（Issue #328、2026-11-09 決定）。
 * 書く前に3段階から選び、初期テンプレートだけが変わる。テストと完了条件はレベルによらず同一。
 * 下書きはレベルごとに分け、「全部書く」だけは従来の下書きキー（baseKey）をそのまま使って既存の下書きを引き継ぐ。
 */
import type { ImplementationInputLevel } from "@/types/implementation";
export type { ImplementationInputLevel } from "@/types/implementation";

export const implementationInputLevels: readonly ImplementationInputLevel[] = ["full", "skeleton", "fill-in"];
export const defaultImplementationInputLevel: ImplementationInputLevel = "full";

export const implementationInputLevelText = {
  groupLabel: "書き方を選ぶ",
  note: "テストと完了の条件は、どの書き方でも同じです。切り替えても、書き方ごとの下書きはそれぞれ残ります。",
  levels: {
    full: { label: "全部書く", description: "テンプレートは最小限です。全部を自分の手で書きます。" },
    skeleton: { label: "骨格から書く", description: "ループや条件分岐の骨格は用意してあります。「ここを書く」の行を、自分のコードに置き換えて書きます。" },
    "fill-in": { label: "穴埋めで書く", description: "ほとんどのコードは用意してあります。要点の「ここを書く」の行だけを書きます。" },
  },
} as const;

/**
 * テンプレート内の未記入プレースホルダ行の目印。
 * プレースホルダは `raise NotImplementedError` の行とし、残したままでは必ずテストに失敗する。
 */
export const implementationPlaceholderStatement = "raise NotImplementedError";
export const implementationPlaceholderMarker = "ここを書く";
export const isImplementationPlaceholderLine = (line: string) =>
  line.includes(implementationPlaceholderStatement) && line.includes(implementationPlaceholderMarker);
export const countImplementationPlaceholders = (template: string) =>
  template.split("\n").filter(isImplementationPlaceholderLine).length;

/** レベル別下書きの保存キー。「全部書く」は従来キーを使い、既存の下書きと衝突しない。 */
export const implementationDraftKey = (baseKey: string, level: ImplementationInputLevel) =>
  level === "full" ? baseKey : `${baseKey}:level:${level}`;

export function readImplementationDraft(baseKey: string, level: ImplementationInputLevel): string | undefined {
  try { return localStorage.getItem(implementationDraftKey(baseKey, level)) ?? undefined; } catch { return undefined; }
}
export function writeImplementationDraft(baseKey: string, level: ImplementationInputLevel, code: string): boolean {
  try { localStorage.setItem(implementationDraftKey(baseKey, level), code); return true; } catch { return false; }
}
