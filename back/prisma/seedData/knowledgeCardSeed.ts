/**
 * 知識カードの seed（Issue #108 で作り直し）。
 * カードは「学んだ概念そのもの」ではなく関連概念を扱う（UI/UX 方針 論点3）。
 * 出現はスケジュール表方式：ユーザーに割り当たったテーブル番号ごとに、
 * どのフェーズ完了で・どのカードが出るかが決まる（見た目はランダム）。
 */
import { KnowledgeCardRarity, type Prisma } from "@prisma/client";

export const BFS_COURSE_ID = "course-algorithm-breadth-first-search-v1";
export const WALL_EXTENSION_COURSE_ID = "course-algorithm-wall-extension-v1";

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
    id: "knowledge-card-wall-extension-procedural-generation",
    courseId: WALL_EXTENSION_COURSE_ID,
    label: "自動生成",
    title: "手続き型生成",
    description:
      "ゲームのステージや迷路などのコンテンツを、決まった手順（手続き）に従ってプログラムに自動で作らせる考え方。",
    connection:
      "棒倒し法は、外周と柱を置き、規則に従って壁を伸ばすという手続きの繰り返しで迷路全体を生成する、手続き型生成の代表例。",
    useCase:
      "ゲームのダンジョンやマップを、プレイするたびに新しい形で自動生成するときに使える。",
    searchKeywords: ["手続き型生成", "Procedural Generation", "自動生成", "迷路生成"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 4,
    isPublished: true,
  },
  {
    id: "knowledge-card-wall-extension-random-seed",
    courseId: WALL_EXTENSION_COURSE_ID,
    label: "シード",
    title: "乱数とシード",
    description:
      "乱数の種（シード）を決めると、そこから作られる乱数の並びが固定され、同じ結果を何度でも再現できる。",
    connection:
      "この単元では、方向の選び方を乱数そのものではなく、選び方の記録として外から与えることで、生成される迷路を完全に再現できるようにしている。",
    useCase:
      "ゲームのステージ生成やプログラムのテストで、同じ条件を再現して確かめたいときに使える。",
    searchKeywords: ["乱数", "シード", "seed", "再現性"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 5,
    isPublished: true,
  },
  {
    id: "knowledge-card-wall-extension-perfect-maze",
    courseId: WALL_EXTENSION_COURSE_ID,
    label: "迷路",
    title: "完全迷路",
    description:
      "輪（ループ）がなく、すべての場所が互いにつながっている迷路。どの2つの場所の間にも、たどる経路がちょうど1つだけある。",
    connection:
      "棒倒し法は、柱の数だけ壁を伸ばし、一番上の段以外では上へ伸ばさない規則で輪ができるのを防ぐため、完成した迷路は完全迷路になる。",
    useCase:
      "解が1つに定まる迷路ゲームや、経路探索の練習問題の盤面を作るときに使える。",
    searchKeywords: ["完全迷路", "Perfect Maze", "全域木"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 6,
    isPublished: true,
  },
];

/** フェーズ完了のタイミングとカードの対応（この対応が「そのフェーズで理解できる関連概念」）。 */
export const BFS_CARD_PHASE_SLOTS = [
  { phaseKey: "bfs-execution", knowledgeCardId: "knowledge-card-bfs-shortest-path" },
  { phaseKey: "bfs-code-check", knowledgeCardId: "knowledge-card-bfs-deque" },
  { phaseKey: "bfs-implementation", knowledgeCardId: "knowledge-card-bfs-bidirectional" },
] as const;

/** フェーズ完了のタイミングとカードの対応（棒倒し法。配布位置とレアリティは BFS と同じ）。 */
export const WALL_EXTENSION_CARD_PHASE_SLOTS = [
  { phaseKey: "wall-extension-execution", knowledgeCardId: "knowledge-card-wall-extension-procedural-generation" },
  { phaseKey: "wall-extension-code-check", knowledgeCardId: "knowledge-card-wall-extension-random-seed" },
  { phaseKey: "wall-extension-implementation", knowledgeCardId: "knowledge-card-wall-extension-perfect-maze" },
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
  ...buildCardPhaseSchedule(WALL_EXTENSION_COURSE_ID, "wall-extension", WALL_EXTENSION_CARD_PHASE_SLOTS),
];
