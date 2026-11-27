import { learningUnits } from "./unitRegistry";

export const GROUP_LABEL: Record<string, string> = {
  "course-algorithm-breadth-first-search-v1": "グラフ探索",
  "course-algorithm-depth-first-search-v1": "グラフ探索",
  "course-algorithm-dijkstra-v1": "グラフ探索",
  "course-algorithm-astar-v1": "グラフ探索",
  "course-algorithm-maze-digging-v1": "迷路生成",
  "course-algorithm-wall-extension-v1": "迷路生成",
  "course-algorithm-bubble-sort-v2": "並び替え",
  "course-algorithm-binary-search-v1": "配列の検索",
  "course-algorithm-greedy-coins-v1": "最適化問題",
};

export const FEATURE_TEXT: Record<string, string> = {
  "course-algorithm-breadth-first-search-v1": "近い場所から順に調べていくことで、最短ルートを見つける仕組みを学びます",
  "course-algorithm-depth-first-search-v1": "一本道を深く進み、行き止まりで戻ることで、場所を漏れなく調べる仕組みを学びます",
  "course-algorithm-dijkstra-v1": "移動コストを比べて更新することで、消費エネルギーが最小の経路を見つける仕組みを学びます",
  "course-algorithm-astar-v1": "ゴールまでのコストの見積もりを利用することで、効率よく最短経路を探す仕組みを学びます",
  "course-algorithm-maze-digging-v1": "壁を掘って通路を伸ばしていくことで、迷路を作る仕組みを学びます",
  "course-algorithm-wall-extension-v1": "柱から壁を倒して伸ばすことで、迷路を作る仕組みを学びます",
  "course-algorithm-bubble-sort-v2": "隣同士を比べて交換を繰り返すことで、並べ替える仕組みを学びます",
  "course-algorithm-binary-search-v1": "調べる範囲を半分ずつ絞り込むことで、効率よく探す仕組みを学びます",
  "course-algorithm-greedy-coins-v1": "その場で最良の選択を繰り返すことで、答えを出す考え方を学びます",
};

// 流す順序：同じ軸の単元を隣り合わせ、組が行の途中で割れないようにする。
const FLOW_ORDER = [
  "course-algorithm-breadth-first-search-v1",
  "course-algorithm-depth-first-search-v1",
  "course-algorithm-dijkstra-v1",
  "course-algorithm-astar-v1",
  "course-algorithm-bubble-sort-v2",
  "course-algorithm-maze-digging-v1",
  "course-algorithm-wall-extension-v1",
  "course-algorithm-binary-search-v1",
  "course-algorithm-greedy-coins-v1",
];

export const registeredUnitIds = new Set<string>(learningUnits.map(unit=>unit.courseId));
export const unitFlowOrder = [...FLOW_ORDER.filter(id=>registeredUnitIds.has(id)), ...learningUnits.map(unit=>unit.courseId).filter(id=>!FLOW_ORDER.includes(id))];

export const OTHER_IDS = [
  "course-algorithm-kmp-v1",
  "course-algorithm-selection-sort-v1",
  "course-algorithm-merge-sort-v1",
];


export const isModernUnit = (id:string): boolean => registeredUnitIds.has(id);
