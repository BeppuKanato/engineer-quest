import type { UnitPhase } from "../../../types/unit.types";

export const dfsUnitTitle = "深さ優先探索（DFS）";
export const dfsUnitIntro = "一つの道を奥まで進み、行き止まりから戻って別の道を調べる深さ優先探索を、図とスタックで学びます。";

export const dfsUnitPhases = [
  { phase: 1, id: "dfs-motivation", shortName: "導入", formalName: "導入", transitionOut: "bridge" },
  {
    phase: 2, id: "dfs-execution", shortName: "動きの説明", formalName: "動きの説明", transitionOut: "bridge", cardRarity: "RARE",
    bridge: "どこを次に調べるか、スタックに積む順番と取り出す順番を図で追いましょう。",
  },
  {
    phase: 3, id: "dfs-check", shortName: "動きの確認", formalName: "動きの確認問題", transitionOut: "result",
    bridge: "行き止まりから次にどこを調べるか、図を見て確かめましょう。",
    result: { heading: "動きの確認問題が終わりました" },
  },
  {
    phase: 4, id: "dfs-code-mapping", shortName: "動きとコード", formalName: "動きとコードの対応", transitionOut: "bridge",
    bridge: "スタックから取り出す動きと、隣の場所を追加する動きが、どの行に対応するかを見ていきましょう。",
  },
  {
    phase: 5, id: "dfs-code-check", shortName: "コードの確認", formalName: "コードの確認問題", transitionOut: "result", cardRarity: "COMMON",
    bridge: "コードの空欄を埋めて、スタックへの追加と未発見の判定を確かめましょう。",
    result: { heading: "コードの確認問題が終わりました" },
  },
  {
    phase: 6, id: "dfs-consolidation", shortName: "応用問題", formalName: "応用問題", transitionOut: "result-in-phase",
    bridge: "別の出発点やグラフで動きを考え、深さ優先探索のコードを並び替えてみましょう。",
  },
  {
    phase: 7, id: "dfs-implementation", shortName: "自分で実装", formalName: "自分で実装", transitionOut: "final", cardRarity: "EPIC",
    bridge: "訪れた順を返す深さ優先探索のコードを、自分で書いてテストしましょう。",
  },
] as const satisfies readonly UnitPhase[];
