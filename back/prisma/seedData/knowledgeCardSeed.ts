/**
 * 知識カードの seed（Issue #108 で作り直し）。
 * カードは「学んだ概念そのもの」ではなく関連概念を扱う（UI/UX 方針 論点3）。
 * 全員共通でフェーズ2・5・7の完了時に1枚ずつ取得する。
 */
import { courseSeed } from "./courseSeed";
import { FIXED_CARD_SCHEDULE } from "../../src/learning/knowledgeCardSchedule";
import { KnowledgeCardRarity, type Prisma } from "@prisma/client";

export const BFS_COURSE_ID = "course-algorithm-breadth-first-search-v1";
export const DFS_COURSE_ID = "course-algorithm-depth-first-search-v1";
export const WALL_EXTENSION_COURSE_ID = "course-algorithm-wall-extension-v1";
export const BUBBLE_SORT_COURSE_ID = "course-algorithm-bubble-sort-v2";
export const MAZE_DIGGING_COURSE_ID = "course-algorithm-maze-digging-v1";
export const BINARY_SEARCH_COURSE_ID = "course-algorithm-binary-search-v1";
export const GREEDY_COINS_COURSE_ID = "course-algorithm-greedy-coins-v1";

// 全カードに対応の有無を明示し、preserve seedでも配列を丸ごと置換できるようにする。
type KnowledgeCardSeed = Omit<Prisma.KnowledgeCardUncheckedCreateInput, "relatedCreateQuestIds"> & {
  relatedCreateQuestIds: string[];
};
export const knowledgeCardSeed: KnowledgeCardSeed[] = [
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
      "部屋のつながりから、移動回数が最少の経路を返したいときに使える。",
    relatedCreateQuestIds: ["create-quest-dungeon-route-v1"],
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
    useCase: "次に調べる場所を見つけた順に取り出し、待ち行列を効率よく処理したいときに使える。",
    relatedCreateQuestIds: ["create-quest-dungeon-route-v1", "create-quest-skill-tree-v1"],
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
    useCase: "出発点とゴールが決まった大きなグラフで、調べる場所を減らして経路を探したいときに使える。",
    relatedCreateQuestIds: ["create-quest-dungeon-route-v1"],
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
      "規則に従って盤面を組み立て、条件を変えていろいろな形を試したいときに使える。",
    relatedCreateQuestIds: [],
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
      "ランダムに選ぶ処理を試すとき、同じ盤面を再現して変更前後の動きを比べたい場面で使える。",
    relatedCreateQuestIds: [],
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
      "部屋のつながりを調べ、どの2部屋の間でも経路が1つだけになる盤面を確かめたいときに使える。",
    relatedCreateQuestIds: [],
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
      "同じ値どうしの順番を保ったまま、データを並び替えたい場面で使える。",
    relatedCreateQuestIds: ["create-quest-turn-order-v1"],
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
    useCase: "値を比べて順番が逆の2要素を入れ替え、並び替えの処理を自分で書きたいときに使える。",
    relatedCreateQuestIds: ["create-quest-turn-order-v1"],
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
    useCase: "データを増やしたときの処理回数を比べ、大きな入力でも動く方法を選びたい場面で使える。",
    relatedCreateQuestIds: ["create-quest-turn-order-v1", "create-quest-product-search-v1"],
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
      "経路の候補を試し、行き止まりなら分岐へ戻って別の候補を探したい場面で使える。",
    relatedCreateQuestIds: ["create-quest-dungeon-route-v1"],
    searchKeywords: ["バックトラッキング", "Backtracking", "深さ優先探索"],
    catalogNumber: 1,
    rarity: KnowledgeCardRarity.RARE,
    sortOrder: 10,
    isPublished: true,
  },
  {
    id: "knowledge-card-maze-digging-stack",
    courseId: MAZE_DIGGING_COURSE_ID,
    label: "関数の呼び出し",
    title: "再帰呼び出し",
    description:
      "関数の中から同じ関数を呼び出し、小さな部分に同じ処理を任せる書き方。呼び出しを終える条件を用意し、処理が終わると呼び出し元へ戻る。",
    connection:
      "穴掘り法の「隣の部屋へ進み、行き止まりなら戻る」は、隣の部屋の処理を同じ関数へ任せる形でも書ける。単元で使ったリストによる記録と比べられる。",
    useCase:
      "枝分かれしたつながりをたどる処理を、次の場所でも同じ関数を呼ぶ形で書きたいときに使える。",
    relatedCreateQuestIds: ["create-quest-skill-tree-v1"],
    searchKeywords: ["再帰", "再帰呼び出し", "終了条件", "関数"],
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
      "すべての部屋をつなぎながら輪を作らないように、通路を選びたい場面で使える。",
    relatedCreateQuestIds: [],
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
      "番号順に並んだデータから目的の値を探すとき、候補を半分ずつ減らして比較回数を抑えたい場面で使える。",
    relatedCreateQuestIds: ["create-quest-product-search-v1"],
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
      "整列済みのデータで中央の値を調べ、次に探す範囲を左か右へ絞りたいときに使える。",
    relatedCreateQuestIds: ["create-quest-product-search-v1"],
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
      "検索するデータを増やしても比較回数が少ししか増えないか、処理の効率を確かめたい場面で使える。",
    relatedCreateQuestIds: ["create-quest-product-search-v1"],
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
    useCase: "依存関係を矢印で表したデータから、前提を先に済ませられる処理順を組み立てたいときに使える。",
    relatedCreateQuestIds: [],
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
    useCase: "次に調べる場所をリストに積み、最後に追加した場所から先にたどる探索を書きたいときに使える。",
    relatedCreateQuestIds: ["create-quest-dungeon-route-v1", "create-quest-skill-tree-v1"],
    searchKeywords: ["スタック", "リスト", "append", "pop", "LIFO"],
    catalogNumber: 2,
    rarity: KnowledgeCardRarity.COMMON,
    sortOrder: 17,
    isPublished: true,
  },
  {
    id: "knowledge-card-dfs-backtracking",
    courseId: DFS_COURSE_ID,
    label: "探索の効率化",
    title: "枝刈り",
    description: "答えにならないと分かった候補や、今までの最良の答えを改善できない候補を、その先まで調べずに打ち切る工夫。",
    connection: "深さ優先探索は候補を奥へたどって調べる。そこに打ち切る条件を加えると、答えに必要のない枝を省いて探索できる。",
    useCase: "経路の候補を順に試すとき、すでに見つけた経路より短くならない枝の探索を省きたい場面で使える。",
    relatedCreateQuestIds: ["create-quest-dungeon-route-v1"],
    searchKeywords: ["枝刈り", "深さ優先探索", "探索の効率化", "分枝限定法"],
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
      "その時点で最もよさそうな候補を選ぶ処理を書き、選択を繰り返した結果を確かめたいときに使える。",
    relatedCreateQuestIds: [],
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
      "使った分だけ残りを減らす繰り返しを実装し、残りが0になるまでの動きを確かめたいときに使える。",
    relatedCreateQuestIds: [],
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
      "そのつど選ぶ方法が本当に最良の結果を返すか、別の候補や反例を作って比べたいときに使える。",
    relatedCreateQuestIds: [],
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

type CardPhaseSlot = { phaseKey: string; knowledgeCardId: string };
const buildCardPhaseSchedule = (courseId: string, idPrefix: string, slots: readonly CardPhaseSlot[]): Array<Prisma.KnowledgeCardPhaseScheduleEntryUncheckedCreateInput & { id: string }> => {
    const courseVersion = courseSeed.find(course => course.id === courseId)?.version;
    if (courseVersion === undefined) throw new Error(`Unknown card course: ${courseId}`);
    return slots.map(slot => ({
      id: `schedule-${idPrefix}-v${courseVersion}-fixed-${slot.phaseKey}`,
      courseId, courseVersion, tableNumber: FIXED_CARD_SCHEDULE, ...slot,
    }));
};

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
