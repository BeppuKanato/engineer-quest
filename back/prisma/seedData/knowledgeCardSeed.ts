/**
 * 知識カードの seed（Issue #108 で作り直し）。
 * カードは「学んだ概念そのもの」ではなく関連概念を扱う（UI/UX 方針 論点3）。
 * 出現はスケジュール表方式：ユーザーに割り当たったテーブル番号ごとに、
 * どのフェーズ完了で・どのカードが出るかが決まる（見た目はランダム）。
 */
import { KnowledgeCardRarity, type Prisma } from "@prisma/client";

export const BFS_COURSE_ID = "course-algorithm-breadth-first-search-v1";
export const BUBBLE_SORT_COURSE_ID = "course-algorithm-bubble-sort-v2";

export const knowledgeCardSeed: Prisma.KnowledgeCardUncheckedCreateInput[] = [
  {
    id: "knowledge-card-bfs-shortest-path",
    courseId: BFS_COURSE_ID,
    label: "最短経路",
    title: "重みなし最短経路",
    description:
      "辺の重みがすべて等しいグラフでは、幅優先探索で最初にたどり着いた経路が、辺の数が最少の経路になる。",
    connection:
      "BFS は出発点から近い順に調べるため、距離の小さい場所から順に最短の距離が確定していく。",
    useCase:
      "乗り換え回数が最少の経路や、SNS で相手までの最少のつながり数を調べるときに使える。",
    searchKeywords: ["最短経路", "幅優先探索", "BFS", "距離"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: "knowledge-card-bfs-deque",
    courseId: BFS_COURSE_ID,
    label: "キュー",
    title: "collections.deque",
    description:
      "Python でキューを実装するための両端キュー。末尾への追加と先頭からの取り出しがどちらも速い。",
    connection:
      "BFS の待ち行列は、末尾に追加して先頭から取り出す動きの繰り返し。リストの先頭削除は遅いため、deque を使う。",
    useCase: "待ち行列の処理や、直近のデータを一定数だけ保持する処理に使える。",
    searchKeywords: ["deque", "キュー", "collections"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: "knowledge-card-bfs-bidirectional",
    courseId: BFS_COURSE_ID,
    label: "高速化",
    title: "双方向探索",
    description:
      "出発点とゴールの両側から同時に幅優先探索を行い、途中で出会ったところで経路をつなぐ方法。",
    connection:
      "片側だけの探索は調べる範囲が広がりやすい。両側から探すと、それぞれの探索範囲が小さく済むことが多い。",
    useCase: "地図の経路探索など、ゴールが分かっていて探索範囲が広い場面で有効。",
    searchKeywords: ["双方向探索", "Bidirectional Search", "高速化"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: "knowledge-card-bubble-sort-stable-sort",
    courseId: BUBBLE_SORT_COURSE_ID,
    label: "安定性",
    title: "安定なソート",
    description:
      "同じ値の要素どうしの順番が、並び替えた後も保たれる性質を安定といい、その性質を持つ並び替えを安定なソートという。",
    connection:
      "バブルソートは、左の値が大きいときだけ隣同士を交換する。同じ値どうしは決して追い越し合わないため、安定なソートになる。",
    useCase:
      "名前順に並べた後で点数順に並べ直すような二段がけの並び替えで、先の並び順を活かしたいときに使える。",
    searchKeywords: ["安定なソート", "安定性", "Stable Sort"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 7,
    isPublished: true,
  },
  {
    id: "knowledge-card-bubble-sort-swap",
    courseId: BUBBLE_SORT_COURSE_ID,
    label: "交換",
    title: "値の交換",
    description:
      "2つの変数の中身を入れ替える操作。Python では a, b = b, a というタプル代入で、一時的な変数を使わずに書ける。",
    connection:
      "バブルソートは、隣り合う値の順番が逆になっている場所でこの交換を繰り返し、大きい値を右へ運んでいく。",
    useCase: "並び替えに限らず、2つの値を入れ替える場面全般で使う、プログラムの基本操作の1つ。",
    searchKeywords: ["値の交換", "スワップ", "swap", "タプル代入"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 8,
    isPublished: true,
  },
  {
    id: "knowledge-card-bubble-sort-complexity",
    courseId: BUBBLE_SORT_COURSE_ID,
    label: "計算量",
    title: "計算量",
    description:
      "データの量が増えたときに、処理の回数がどれくらいの割合で増えるかを表す考え方。",
    connection:
      "バブルソートの比較は約 n² 回（n は要素の数）。データが2倍になると、かかる手間は約4倍になる。",
    useCase: "大量のデータを並び替えるときに、どの方法を選ぶかの判断材料になる。",
    searchKeywords: ["計算量", "時間計算量", "オーダー"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 9,
    isPublished: true,
  },
];

/** フェーズ完了のタイミングとカードの対応（この対応が「そのフェーズで理解できる関連概念」）。 */
export const BFS_CARD_PHASE_SLOTS = [
  { phaseKey: "bfs-execution", knowledgeCardId: "knowledge-card-bfs-shortest-path" },
  { phaseKey: "bfs-code-check", knowledgeCardId: "knowledge-card-bfs-deque" },
  { phaseKey: "bfs-implementation", knowledgeCardId: "knowledge-card-bfs-bidirectional" },
] as const;

/** フェーズ完了のタイミングとカードの対応（バブルソート。配布位置とレアリティは BFS と同じ）。 */
export const BUBBLE_SORT_CARD_PHASE_SLOTS = [
  { phaseKey: "bubble-sort-execution", knowledgeCardId: "knowledge-card-bubble-sort-stable-sort" },
  { phaseKey: "bubble-sort-code-check", knowledgeCardId: "knowledge-card-bubble-sort-swap" },
  { phaseKey: "bubble-sort-implementation", knowledgeCardId: "knowledge-card-bubble-sort-complexity" },
] as const;

/**
 * テーブルごとの出現スロット（A=1枚目, B=2枚目, C=3枚目。全単元で同じ表を使う）。
 * 1回の学習で出るのは平均して約6割。どのカードが出るかはテーブルで変わる。
 */
const TABLE_SUBSETS: string[][] = [
  ["A", "B", "C"], ["A", "B"], ["A", "C"], ["B", "C"], ["A"],
  ["B"], ["C"], ["A", "B", "C"], ["A", "B"], ["B", "C"],
  ["A", "C"], ["B"], ["A"], ["A", "B", "C"], ["C"],
];
const SLOT_INDEX_BY_LETTER: Record<string, number> = { A: 0, B: 1, C: 2 };

export const KNOWLEDGE_CARD_TABLE_COUNT = TABLE_SUBSETS.length;

type CardPhaseSlot = { phaseKey: string; knowledgeCardId: string };

const buildCardPhaseSchedule = (
  courseId: string,
  idPrefix: string,
  slots: readonly CardPhaseSlot[],
): Array<Prisma.KnowledgeCardPhaseScheduleEntryUncheckedCreateInput & { id: string }> =>
  TABLE_SUBSETS.flatMap((subset, index) => {
    const tableNumber = index + 1;
    return subset.map((letter) => {
      const slot = slots[SLOT_INDEX_BY_LETTER[letter]];
      return {
        id: `schedule-${idPrefix}-v1-t${tableNumber}-${slot.phaseKey}`,
        courseId,
        courseVersion: 1,
        tableNumber,
        phaseKey: slot.phaseKey,
        knowledgeCardId: slot.knowledgeCardId,
      };
    });
  });

export const knowledgeCardPhaseScheduleSeed: Array<
  Prisma.KnowledgeCardPhaseScheduleEntryUncheckedCreateInput & { id: string }
> = [
  ...buildCardPhaseSchedule(BFS_COURSE_ID, "bfs", BFS_CARD_PHASE_SLOTS),
  ...buildCardPhaseSchedule(BUBBLE_SORT_COURSE_ID, "bubble-sort", BUBBLE_SORT_CARD_PHASE_SLOTS),
];
