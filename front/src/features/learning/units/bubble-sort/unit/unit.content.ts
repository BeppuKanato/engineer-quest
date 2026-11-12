/**
 * バブルソート 単元フロー（Issue #235）の構成データ。
 * 遷移は BFS 単元と同じ統一モデル（2026-11-06、Issue #141 でブリッジへ統一）：
 * - bridge: 完了後にブリッジステップ（次のフェーズの目標を短く伝える）を挟んで次へ進む
 * - result: 完了後に単元側のリザルト画面（事実のみ）を出し、その後ブリッジへ進む（3→4、5→6）
 * - result-in-phase: フェーズ内の結果画面（フェーズ6）がリザルトを兼ね、そこからブリッジへ進む
 * - final: 単元完了時の最終リザルト（フェーズ7の後）
 * ブリッジは前進の完了フローでのみ出す。復習・ナビゲーションからの移動や途中再開では出さない。
 * カードのレアリティは基準データ §5 の配布位置（フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）。
 */
export type BubbleSortUnitTransition = "bridge" | "result" | "result-in-phase" | "final";

export type BubbleSortUnitPhase = {
  /** フェーズ番号（1〜7） */
  phase: number;
  /** 単品プレビューの contentId と対応する識別子 */
  id: string;
  /** 単元ナビゲーションの短い名前 */
  shortName: string;
  /** 正式名称（リザルトやブリッジで使う） */
  formalName: string;
  /** このフェーズの完了後にどう進むか */
  transitionOut: BubbleSortUnitTransition;
  /** このフェーズに入るときのブリッジ文（目標の提示）。フェーズ1は単元の入口なので持たない */
  bridge?: string;
  /**
   * この段階の区切りで知識カードが提示されうるとき、そのレアリティ。
   * 付与そのものの正本は seed のカードスケジュール（back/prisma/seedData/knowledgeCardSeed.ts）で、
   * ここは単元画面のノードに付けるバッジ表示のために持つ。
   */
  cardRarity?: "COMMON" | "RARE" | "EPIC";
  /** transitionOut が "result" のときのリザルト画面の文言（事実のみ。次の目標はブリッジが担う） */
  result?: {
    heading: string;
  };
};

export const bubbleSortUnitTitle = "バブルソート";

/** 単元画面のタイトル下に出す、その単元で何を学ぶかの1文（コース説明の要約）。 */
export const bubbleSortUnitIntro = "隣同士を比べて入れ替えるバブルソートを、数の並びの変化を一手ずつ追って学びます。";

export const bubbleSortUnitPhases: readonly BubbleSortUnitPhase[] = [
  { phase: 1, id: "bubble-sort-motivation", shortName: "導入", formalName: "導入", transitionOut: "bridge" },
  {
    phase: 2, id: "bubble-sort-execution", shortName: "動きの説明", formalName: "動きの説明", transitionOut: "bridge", cardRarity: "RARE",
    bridge: "では、コンピュータがどうやって数を小さい順に並べるのか、動きを見ていきましょう。",
  },
  {
    phase: 3, id: "bubble-sort-check", shortName: "動きの確認", formalName: "動きの確認問題", transitionOut: "result",
    bridge: "今の動きがつかめたか、問題で確かめましょう。間違えても、その場で考え直せます。",
    result: { heading: "動きの確認問題が終わりました" },
  },
  {
    phase: 4, id: "bubble-sort-code-mapping", shortName: "動きとコード", formalName: "動きとコードの対応", transitionOut: "bridge",
    bridge: "さっき見た動きが、コードではどう書かれているかを確かめます。",
  },
  {
    phase: 5, id: "bubble-sort-code-check", shortName: "コードの確認", formalName: "コードの確認問題", transitionOut: "result", cardRarity: "COMMON",
    bridge: "コードの動きが読めるようになったか、空欄を埋めて確かめましょう。",
    result: { heading: "コードの確認問題が終わりました" },
  },
  {
    phase: 6, id: "bubble-sort-consolidation", shortName: "応用問題", formalName: "応用問題", transitionOut: "result-in-phase",
    bridge: "別の並びでも、同じ考え方が使えるか確かめましょう。",
  },
  {
    phase: 7, id: "bubble-sort-implementation", shortName: "自分で実装", formalName: "自分で実装", transitionOut: "final", cardRarity: "EPIC",
    bridge: "最後は、自分の手でコードを書いてみましょう。詰まったらヒントも使えます。",
  },
] as const;

/** 遷移ボタンの文言は「次の段階の正式名称＋へ進む」で統一する（#142）。「フェーズ」は画面に出さない。 */
export const nextPhaseLabel = (phase: BubbleSortUnitPhase): string => {
  const next = bubbleSortUnitPhases[phase.phase];
  return next ? `${next.formalName}へ進む` : "次へ進む";
};

export const bubbleSortUnitText = {
  navLabel: "この単元の流れ",
  finalChip: "単元リザルト",
  summaryHeading: "この単元の到達状況",
  reviewNote: "気になる段階は、上のナビゲーションからいつでも戻って復習できます。",
  backToCourses: "コース一覧に戻る",
} as const;
