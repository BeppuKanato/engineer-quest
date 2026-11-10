/**
 * Course（単元）マスタのseed。旧フローのMission/Activity配下のコンテンツは削除済みで、
 * Course行だけを単元として保持する。各単元の教材は新フローのコンテンツモジュールが正本。
 */
import { CourseCategoryType, CourseDifficulty } from "@prisma/client";

export type CourseSeedEntry = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  isInitiallyUnlocked: boolean;
  isPublished: boolean;
  version: number;
  categories: CourseCategoryType[];
};

export const courseSeed: CourseSeedEntry[] = [
  {
    id: "course-algorithm-bubble-sort-v2",
    title: "バブルソート",
    description: "数値を順番に並べ替えるバブルソートを、配列カードの動きとPythonコードを対応づけながら学ぶコースです。Pythonのリスト、変数、if文、for文、len、rangeを前提に、比較・交換・繰り返し・比較範囲の短縮を段階的に理解し、最後にbubble_sort関数を自分で実装します。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 2,
    categories: [CourseCategoryType.SORT],
  },
  {
    id: "course-algorithm-binary-search-v1",
    title: "二分探索",
    description: "順番に並んだデータから目的の値を効率よく見つける、二分探索の考え方とPythonコードへのつながりを学ぶコースです。Pythonのリスト、条件分岐、whileの基本を前提に、中央の値を手がかりに探索範囲を狭める動きを操作しながら段階的に理解します。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.SEARCH],
  },
  {
    id: "course-algorithm-kmp-v1",
    title: "KMP法",
    description: "長い文字列から目的の文字列を効率よく見つけるKMP法を学ぶコースです。単純探索の再比較、LPS値と表の意味、検索での利用、前の値を使った表作成、Python実装まで段階的に学びます。",
    difficulty: CourseDifficulty.NORMAL,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 8,
    categories: [CourseCategoryType.SEARCH],
  },
  {
    id: "course-algorithm-selection-sort-v1",
    title: "選択ソート",
    description: "残りの中から最小値を探し、左から順に確定する選択ソートを学びます。候補の位置とカードの動きを追い、短いPython練習を積み重ね、最後は自分で並べ替え関数を完成させます。変数・リスト・if・forを一度学んだ方が対象です。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.SORT],
  },
  {
    id: "course-algorithm-breadth-first-search-v1",
    title: "幅優先探索（BFS）",
    description: "場所同士のつながりを、開始地点に近い順から調べる幅優先探索を学びます。図と待ち行列を一手ずつ追い、重複を防ぎながら最少の辺数を求め、最後はPython関数を完成させます。辞書・リスト・if・for・while・関数を一度学んだ方が対象です。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.GRAPH, CourseCategoryType.SEARCH],
  },
  {
    id: "course-algorithm-depth-first-search-v1",
    title: "深さ優先探索（DFS）",
    description: "一つの道を進めるところまで進み、行き止まりで戻りながらつながりを調べる深さ優先探索を学びます。図と呼び出しの積み重なりを追い、循環を防ぎながら訪問順を記録し、最後は再帰するPython関数を完成させます。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.GRAPH, CourseCategoryType.SEARCH],
  },
  {
    id: "course-algorithm-wall-extension-v1",
    title: "棒倒し法",
    description: "ゲームの迷路を自動で作る棒倒し法を学びます。盤面の変化を一手ずつ追い、柱を立てて決まった規則で壁を伸ばす動きを理解し、最後はPythonで迷路生成関数を完成させます。辞書・リスト・for・関数を一度学んだ方が対象です。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.GAME, CourseCategoryType.ALGORITHM],
  },
  {
    id: "course-algorithm-maze-digging-v1",
    title: "穴掘り法",
    description: "ゲームの迷路を自動で作る穴掘り法を学びます。盤面の変化を一手ずつ追い、壁の塊から通路を掘り、行き止まりでは戻って掘り直す動きを理解し、最後はPythonで迷路生成関数を完成させます。リスト・for・while・関数を一度学んだ方が対象です。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.GAME, CourseCategoryType.ALGORITHM],
  },
  {
    id: "course-algorithm-merge-sort-v1",
    title: "マージソート",
    description: "リストを小さく分け、整列済みの部分を先頭から結合するマージソートを学びます。分割と結合を図で一手ずつ追い、再帰するPythonコードへつなげ、最後は自分で並べ替え関数を完成させます。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.SORT],
  },
];

/**
 * BFS単元の標準コード。旧コースseedに置かれていたものを、教材（フェーズ4の表示コード）の
 * 正として移設した。フロントのコード契約検証（verify:bfs-code-mapping）がこの文字列と照合する。
 */
export const breadthFirstSearchAnswerCode =
  "from collections import deque\n" +
  "def bfs_distances(graph, start):\n" +
  "    distances = {start: 0}\n" +
  "    queue = deque([start])\n" +
  "    while queue:\n" +
  "        node = queue.popleft()\n" +
  "        for neighbor in graph.get(node, []):\n" +
  "            if neighbor not in distances:\n" +
  "                distances[neighbor] = distances[node] + 1\n" +
  "                queue.append(neighbor)\n" +
  "    return distances";
