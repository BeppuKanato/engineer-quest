/**
 * BFS 単元フロー（Issue #77）の構成データ。
 * 遷移の3類型は教材指針の確定事項に従う：
 * - choice: 意思確認の区切り（フェーズ1→2。フェーズ1最終場面のボタンで進む）
 * - seamless: リザルト画面を挟まず次のフェーズへ直結（2→3、4→5。プレイヤーの最終ステップのアクションで進む）
 * - result: 完了後に単元側のリザルト画面を出す（3→4、5→6）
 * - result-in-phase: フェーズ内の結果画面（フェーズ6の診断）がリザルトを兼ね、そこから次へ進む
 * - final: 単元完了時の最終リザルト（フェーズ7の後）
 */
export type BfsUnitTransition = "choice" | "seamless" | "result" | "result-in-phase" | "final";

export type BfsUnitPhase = {
  /** フェーズ番号（1〜7） */
  phase: number;
  /** 単品プレビューの contentId と対応する識別子 */
  id: string;
  /** 単元ナビゲーションの短い名前 */
  shortName: string;
  /** 正式名称（リザルトや予告で使う） */
  formalName: string;
  /** このフェーズの完了後にどう進むか */
  transitionOut: BfsUnitTransition;
  /** プレイヤー最終ステップのアクションや、フェーズ6診断画面の次へボタンの文言 */
  /** transitionOut が "result" のときのリザルト画面の文言 */
  result?: {
    heading: string;
    /** 次フェーズの予告（1文） */
    nextPreview: string;
  };
};

export const bfsUnitTitle = "幅優先探索（BFS）";

export const bfsUnitPhases: readonly BfsUnitPhase[] = [
  { phase: 1, id: "bfs-motivation", shortName: "導入", formalName: "導入", transitionOut: "choice" },
  { phase: 2, id: "bfs-execution", shortName: "動きの説明", formalName: "動きの説明", transitionOut: "seamless" },
  {
    phase: 3, id: "bfs-check", shortName: "動きの確認", formalName: "動きの確認問題", transitionOut: "result",
    result: {
      heading: "動きの確認問題が終わりました",
      nextPreview: "次は「動きとコードの対応」です。動きの説明と同じ動きを、コードと並べて確かめます。",
    },
  },
  { phase: 4, id: "bfs-code-mapping", shortName: "動きとコード", formalName: "動きとコードの対応", transitionOut: "seamless" },
  {
    phase: 5, id: "bfs-code-check", shortName: "コードの確認", formalName: "コードの確認問題", transitionOut: "result",
    result: {
      heading: "コードの確認問題が終わりました",
      nextPreview: "次は「応用問題」です。別のグラフや例外ケースで、理解を確かめます。",
    },
  },
  { phase: 6, id: "bfs-consolidation", shortName: "応用問題", formalName: "応用問題", transitionOut: "result-in-phase" },
  { phase: 7, id: "bfs-implementation", shortName: "自分で実装", formalName: "自分で実装", transitionOut: "final" },
] as const;

/** 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で統一する（#142）。「フェーズ」は画面に出さない。 */
export const nextPhaseLabel = (phase: BfsUnitPhase): string => {
  const next = bfsUnitPhases[phase.phase];
  return next ? `${next.formalName}へ進む` : "次へ進む";
};

export const bfsUnitText = {
  navLabel: "この単元の流れ",
  finalChip: "単元リザルト",
  summaryHeading: "この単元の到達状況",
  reviewNote: "気になる段階は、上のナビゲーションからいつでも戻って復習できます。",
  backToCourses: "コース一覧に戻る",
} as const;
