export const createQuestProblemLabel = (problemType: string) => ({
  SORT: "並べ替え",
  BFS: "最短経路",
  DFS: "グラフ探索",
  KMP: "文字列検索",
  BINARY_SEARCH: "データ検索",
}[problemType] ?? problemType);

export const createQuestMethodMessage = (problemType: string) => ({
  SORT: "使用する並べ替え方法は自由です。",
  BFS: "使用する経路探索の方法は自由です。",
  DFS: "使用する探索方法や、結果を返す順番は自由です。",
  KMP: "使用する文字列検索の方法は自由です。",
  BINARY_SEARCH: "使用する商品検索の方法は自由です。",
}[problemType] ?? "実装方法は自由です。");
