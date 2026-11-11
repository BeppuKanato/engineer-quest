/**
 * 知識カードの seed（Issue #108 で作り直し）。
 * カードは「学んだ概念そのもの」ではなく関連概念を扱う（UI/UX 方針 論点3）。
 * 出現はスケジュール表方式：ユーザーに割り当たったテーブル番号ごとに、
 * どのフェーズ完了で・どのカードが出るかが決まる（見た目はランダム）。
 */
import { KnowledgeCardRarity, type Prisma } from "@prisma/client";

export const BFS_COURSE_ID = "course-algorithm-breadth-first-search-v1";
export const DFS_COURSE_ID = "course-algorithm-depth-first-search-v1";
export const WALL_EXTENSION_COURSE_ID = "course-algorithm-wall-extension-v1";
export const BUBBLE_SORT_COURSE_ID = "course-algorithm-bubble-sort-v2";
export const MAZE_DIGGING_COURSE_ID = "course-algorithm-maze-digging-v1";
export const BINARY_SEARCH_COURSE_ID = "course-algorithm-binary-search-v1";
export const GREEDY_COINS_COURSE_ID = "course-algorithm-greedy-coins-v1";

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
  {
    id: "knowledge-card-maze-digging-backtracking",
    courseId: MAZE_DIGGING_COURSE_ID,
    label: "探索",
    title: "バックトラッキング",
    description:
      "行き止まりまで進んでから、まだ試していない選択肢が残る場所まで戻って、別の道を試す考え方。",
    connection:
      "穴掘り法は、掘れる部屋がなくなったマスで行き止まりになる。そこで、候補が残っているマスまで戻って掘り直すことで、すべての部屋を掘り切る。",
    useCase:
      "迷路の経路探索や、数独のように候補を1つずつ試して合わなければ戻る問題で使える。",
    searchKeywords: ["バックトラッキング", "Backtracking", "深さ優先探索"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 10,
    isPublished: true,
  },
  {
    id: "knowledge-card-maze-digging-stack",
    courseId: MAZE_DIGGING_COURSE_ID,
    label: "データ構造",
    title: "スタック",
    description:
      "最後に積んだものを最初に取り出す（後入れ先出しの）データの入れ方。取り出すのは、いつも一番上のもの。",
    connection:
      "穴掘り法では、掘った部屋をスタックに積んでいき、行き止まりでは一番上の部屋を取り除いて1つ前の部屋に戻る。Python ではリストの append と pop で実現できる。",
    useCase:
      "ブラウザの「戻る」履歴や、操作の取り消し（アンドゥ）、深さ優先探索で使える。",
    searchKeywords: ["スタック", "Stack", "LIFO", "リスト"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 11,
    isPublished: true,
  },
  {
    id: "knowledge-card-maze-digging-spanning-tree",
    courseId: MAZE_DIGGING_COURSE_ID,
    label: "グラフ",
    title: "全域木",
    description:
      "すべての頂点をつなぎ、輪のないグラフ。頂点が n 個なら、辺は必ず n-1 本になる。",
    connection:
      "穴掘り法で掘った通路は、すべての部屋をつなぎ、輪が1つもない。そのため部屋を頂点とみると全域木になっていて、どの部屋と部屋の間にも経路がちょうど1つだけある。",
    useCase:
      "すべての地点をつなぐ配線や道路網を、無駄なく設計するとき（最小全域木）に使える。",
    searchKeywords: ["全域木", "Spanning Tree", "完全迷路", "木構造"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 12,
    isPublished: true,
  },
  {
    id: "knowledge-card-binary-search-halving-range",
    courseId: BINARY_SEARCH_COURSE_ID,
    label: "絞り込み",
    title: "探索範囲を半分にする",
    description:
      "並んだデータから目的の値を探すとき、真ん中の値と比べることで、まだ調べていない範囲を一度に半分にできる考え方。",
    connection:
      "二分探索は、中央の値より小さいか大きいかを見て、目的の値がないと分かる側を丸ごと捨てる。これを繰り返すたびに、残りの範囲は半分ずつ狭まっていく。",
    useCase:
      "辞書で単語を引くときや、並んだ名簿から名前を探すときに、端から1つずつ見るよりずっと少ない回数で見つけられる。",
    searchKeywords: ["二分探索", "Binary Search", "探索範囲", "半分"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 13,
    isPublished: true,
  },
  {
    id: "knowledge-card-binary-search-compare-middle",
    courseId: BINARY_SEARCH_COURSE_ID,
    label: "比較",
    title: "中央の値と比べる",
    description:
      "探す範囲のちょうど真ん中にある値を取り出し、目的の値と比べる操作。比べた結果によって、次に探すのが左側か右側かが決まる。",
    connection:
      "二分探索では、範囲の両端 lo と hi から真ん中の位置 (lo + hi) // 2 を計算し、その値と目的の値を比べる。一致すれば、その位置が答えになる。",
    useCase:
      "数当てゲームで真ん中の数を聞くのが最も効率がよいことと同じ発想で、絞り込み探索の中心になる操作。",
    searchKeywords: ["中央", "真ん中", "比較", "mid"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 14,
    isPublished: true,
  },
  {
    id: "knowledge-card-binary-search-logarithmic-time",
    courseId: BINARY_SEARCH_COURSE_ID,
    label: "計算量",
    title: "対数時間",
    description:
      "データの量が2倍になっても、必要な手間が一定量しか増えない処理の速さの目安。手間はデータ量の対数に比例して増える。",
    connection:
      "二分探索は1回の比較で範囲を半分にするため、n 個のデータでも約 log₂n 回の比較で済む。100個でも7回程度、100万個でも20回程度になる。",
    useCase:
      "大量のデータから検索するときに、端から順に見る方法（線形探索）との差が大きくなる場面で効いてくる。",
    searchKeywords: ["対数時間", "計算量", "log", "二分探索"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 15,
    isPublished: true,
  },
  {
    id: "knowledge-card-dfs-topological-sort",
    courseId: DFS_COURSE_ID,
    label: "並び替え",
    title: "トポロジカルソート",
    description: "矢印をたどって出発点へ戻る循環がないグラフでは、深さ優先探索で各場所を調べ終えた順を逆にすると、矢印の出発側が到着側より前に来る順序を作れる。",
    connection: "深さ優先探索では、訪れた順に加えて、先に進める場所をすべて調べ終えた順にも意味がある。その順を記録すると、依存関係の並び替えに使える。",
    useCase: "プログラムのビルド順や履修科目の順序など、先に済ませる必要がある作業を並べるときに使える。",
    searchKeywords: ["深さ優先探索", "DFS", "トポロジカルソート", "依存関係"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 16,
    isPublished: true,
  },
  {
    id: "knowledge-card-dfs-list-stack",
    courseId: DFS_COURSE_ID,
    label: "スタック",
    title: "リストで作るスタック",
    description: "Python のリストは、末尾に append で積み、末尾から pop で取り出すと、後入れ先出しのスタックとして使える。",
    connection: "深さ優先探索では、これから調べる場所をリストの末尾に積む。行き止まりに着いたら、残っている場所を末尾から取り出して探索を続ける。",
    useCase: "ブラウザの「戻る」履歴や、アプリの操作の取り消し（アンドゥ）の記録に使える。",
    searchKeywords: ["スタック", "リスト", "append", "pop", "LIFO"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 17,
    isPublished: true,
  },
  {
    id: "knowledge-card-dfs-backtracking",
    courseId: DFS_COURSE_ID,
    label: "探索",
    title: "バックトラッキング",
    description: "一つの手を試し、行き止まりなら前の分岐に戻って別の手を試す。答えが見つかるまでこの手順を繰り返す探索方法。",
    connection: "深さ優先探索の「奥へ進む・戻る」を、選択肢を順に試す問題へ応用する。戻ることで、試していない組み合わせを調べられる。",
    useCase: "数独や迷路の解法、パズルの答えをすべて探すプログラムに使える。",
    searchKeywords: ["深さ優先探索", "DFS", "バックトラッキング", "数独"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 18,
    isPublished: true,
  },
  {
    id: "knowledge-card-greedy-coins-greedy-choice",
    courseId: GREEDY_COINS_COURSE_ID,
    label: "選択",
    title: "貪欲な選択",
    description:
      "その時点で使える一番よい選択を、そのつど繰り返す考え方。先の展開は考えず、今の最良を積み重ねていく。",
    connection:
      "硬貨問題では、残額以下で一番大きい硬貨を選び続ける。786円なら500円から順に選んでいき、9枚で払える。",
    useCase:
      "支払いや両替で使う硬貨を少なくしたいとき、そのつど一番大きい硬貨から使う日常の工夫と同じ発想。",
    searchKeywords: ["貪欲法", "Greedy", "貪欲な選択", "硬貨問題"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 19,
    isPublished: true,
  },
  {
    id: "knowledge-card-greedy-coins-remaining",
    courseId: GREEDY_COINS_COURSE_ID,
    label: "残額",
    title: "残額を減らしていく",
    description:
      "使った分を全体から引いて、残りに対して同じ判断を続ける進め方。問題を少しずつ小さくしながら解いていく。",
    connection:
      "硬貨を1枚選ぶたびに、残額からその額面を引く（786→286→186→…→0）。残額が0になったら支払いは完了する。",
    useCase:
      "予算から使った分を引いて残りでやりくりする家計の管理や、残り時間に合わせて作業を割り当てる計画に使える。",
    searchKeywords: ["残額", "貪欲法", "硬貨問題", "繰り返し"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 20,
    isPublished: true,
  },
  {
    id: "knowledge-card-greedy-coins-not-always-optimal",
    courseId: GREEDY_COINS_COURSE_ID,
    label: "最適性",
    title: "最適とは限らない",
    description:
      "そのつど最良を選んでも、全体で最良の結果になるとは限らないこと。貪欲法がうまくいくかどうかは、問題の性質による。",
    connection:
      "額面が [4, 3, 1] の硬貨で6円を払うと、貪欲法では [4, 1, 1] の3枚になるが、[3, 3] の2枚が本当の最少になる。日本の硬貨では、貪欲法で最少になることが確かめられている。",
    useCase:
      "目先の得を優先する判断が長い目で見ると損になる場面を見分けるときに役立つ考え方。",
    searchKeywords: ["最適", "貪欲法", "反例", "硬貨問題"],
    catalogNumber: 3,
    rarity: KnowledgeCardRarity.EPIC,
    sortOrder: 21,
    isPublished: true,
  },
];

/** フェーズ完了のタイミングとカードの対応（この対応が「そのフェーズで理解できる関連概念」）。 */
export const BFS_CARD_PHASE_SLOTS = [
  { phaseKey: "bfs-execution", knowledgeCardId: "knowledge-card-bfs-shortest-path" },
  { phaseKey: "bfs-code-check", knowledgeCardId: "knowledge-card-bfs-deque" },
  { phaseKey: "bfs-implementation", knowledgeCardId: "knowledge-card-bfs-bidirectional" },
] as const;

export const DFS_CARD_PHASE_SLOTS = [
  { phaseKey: "dfs-execution", knowledgeCardId: "knowledge-card-dfs-topological-sort" },
  { phaseKey: "dfs-code-check", knowledgeCardId: "knowledge-card-dfs-list-stack" },
  { phaseKey: "dfs-implementation", knowledgeCardId: "knowledge-card-dfs-backtracking" },
] as const;

/** フェーズ完了のタイミングとカードの対応（棒倒し法。配布位置とレアリティは BFS と同じ）。 */
export const WALL_EXTENSION_CARD_PHASE_SLOTS = [
  { phaseKey: "wall-extension-execution", knowledgeCardId: "knowledge-card-wall-extension-procedural-generation" },
  { phaseKey: "wall-extension-code-check", knowledgeCardId: "knowledge-card-wall-extension-random-seed" },
  { phaseKey: "wall-extension-implementation", knowledgeCardId: "knowledge-card-wall-extension-perfect-maze" },
] as const;

/** フェーズ完了のタイミングとカードの対応（バブルソート。配布位置とレアリティは BFS と同じ）。 */
export const BUBBLE_SORT_CARD_PHASE_SLOTS = [
  { phaseKey: "bubble-sort-execution", knowledgeCardId: "knowledge-card-bubble-sort-stable-sort" },
  { phaseKey: "bubble-sort-code-check", knowledgeCardId: "knowledge-card-bubble-sort-swap" },
  { phaseKey: "bubble-sort-implementation", knowledgeCardId: "knowledge-card-bubble-sort-complexity" },
] as const;

/** フェーズ完了のタイミングとカードの対応（穴掘り法。配布位置とレアリティは BFS と同じ）。 */
export const MAZE_DIGGING_CARD_PHASE_SLOTS = [
  { phaseKey: "maze-digging-execution", knowledgeCardId: "knowledge-card-maze-digging-backtracking" },
  { phaseKey: "maze-digging-code-check", knowledgeCardId: "knowledge-card-maze-digging-stack" },
  { phaseKey: "maze-digging-implementation", knowledgeCardId: "knowledge-card-maze-digging-spanning-tree" },
] as const;

/** フェーズ完了のタイミングとカードの対応（二分探索。配布位置とレアリティは BFS と同じ）。 */
export const BINARY_SEARCH_CARD_PHASE_SLOTS = [
  { phaseKey: "binary-search-execution", knowledgeCardId: "knowledge-card-binary-search-halving-range" },
  { phaseKey: "binary-search-code-check", knowledgeCardId: "knowledge-card-binary-search-compare-middle" },
  { phaseKey: "binary-search-implementation", knowledgeCardId: "knowledge-card-binary-search-logarithmic-time" },
] as const;

/** フェーズ完了のタイミングとカードの対応（貪欲法。配布位置とレアリティは BFS と同じ）。 */
export const GREEDY_COINS_CARD_PHASE_SLOTS = [
  { phaseKey: "greedy-coins-execution", knowledgeCardId: "knowledge-card-greedy-coins-greedy-choice" },
  { phaseKey: "greedy-coins-code-check", knowledgeCardId: "knowledge-card-greedy-coins-remaining" },
  { phaseKey: "greedy-coins-implementation", knowledgeCardId: "knowledge-card-greedy-coins-not-always-optimal" },
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
  ...buildCardPhaseSchedule(BUBBLE_SORT_COURSE_ID, "bubble-sort", BUBBLE_SORT_CARD_PHASE_SLOTS),
  ...buildCardPhaseSchedule(MAZE_DIGGING_COURSE_ID, "maze-digging", MAZE_DIGGING_CARD_PHASE_SLOTS),
  ...buildCardPhaseSchedule(BINARY_SEARCH_COURSE_ID, "binary-search", BINARY_SEARCH_CARD_PHASE_SLOTS),
  ...buildCardPhaseSchedule(DFS_COURSE_ID, "dfs", DFS_CARD_PHASE_SLOTS),
  ...buildCardPhaseSchedule(GREEDY_COINS_COURSE_ID, "greedy-coins", GREEDY_COINS_CARD_PHASE_SLOTS),
];
