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
  { phase: 1, id: "bfs-motivation", shortName: "動機づけ", formalName: "動機づけ", transitionOut: "choice" },
  { phase: 2, id: "bfs-execution", shortName: "説明", formalName: "アルゴリズム説明", transitionOut: "seamless" },
  {
    phase: 3, id: "bfs-check", shortName: "概念確認", formalName: "理解度確認", transitionOut: "result",
    result: {
      heading: "理解度確認が終わりました",
      nextPreview: "次はフェーズ4「コードとの対応付け」です。フェーズ2と同じ動きを、コードと並べて確かめます。",
    },
  },
  { phase: 4, id: "bfs-code-mapping", shortName: "コード対応", formalName: "コードとの対応付け", transitionOut: "seamless" },
  {
    phase: 5, id: "bfs-code-check", shortName: "コード確認", formalName: "理解度確認（コード）", transitionOut: "result",
    result: {
      heading: "コードの理解度確認が終わりました",
      nextPreview: "次はフェーズ6「応用・総括」です。別のグラフや例外ケースで、理解を確かめます。",
    },
  },
  { phase: 6, id: "bfs-consolidation", shortName: "応用・総括", formalName: "応用・総括", transitionOut: "result-in-phase" },
  { phase: 7, id: "bfs-implementation", shortName: "自力実装", formalName: "自力実装", transitionOut: "final" },
] as const;

/** 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で統一する（#142）。「フェーズ」は画面に出さない。 */
export const nextPhaseLabel = (phase: BfsUnitPhase): string => {
  const next = bfsUnitPhases[phase.phase];
  return next ? `${next.formalName}へ進む` : "次へ進む";
};

export const bfsUnitText = {
  navLabel: "単元のフェーズ",
  finalChip: "単元リザルト",
  summaryHeading: "この単元の到達状況",
  reviewNote: "気になるフェーズは、上のナビゲーションからいつでも戻って復習できます。",
  backToCourses: "コース一覧に戻る",
} as const;
