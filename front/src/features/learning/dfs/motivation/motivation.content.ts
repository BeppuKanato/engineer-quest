import { defineLearningContent } from "../../player/content.types";
import { bfsGraph, bfsMaze } from "../../bfs/bfsGraph";
import { validateDfsMotivationCanvas, type DfsMotivationCanvasState, type DfsMotivationContent } from "./motivation.types";

/** 基準データ§3。座標・辺・格子はBFSの正本から参照する。 */
export const dfsMotivationWalk = ["A", "B", "D", "F", "E", "C"] as const;
const initial: DfsMotivationCanvasState["state"] = {
  current: "A", trail: ["A"], movement: ["A"], visited: ["A"], showNames: false,
  treasureVisible: false, preview: false, returnTrail: false, annotations: false, exit: false,
};
function scene(view: DfsMotivationCanvasState["data"]["view"] = "maze", state: Partial<DfsMotivationCanvasState["state"]> = {},
  highlights: DfsMotivationCanvasState["highlights"] = []): DfsMotivationCanvasState {
  return { data: { kind: "dfs-motivation", view, graph: bfsGraph, maze: bfsMaze, treasure: "C" }, state: { ...initial, ...state }, highlights };
}
function walk(count: number, movement: readonly string[]): Partial<DfsMotivationCanvasState["state"]> {
  const trail = dfsMotivationWalk.slice(0, count);
  return { current: trail.at(-1)!, trail, movement, visited: trail, treasureVisible: count === dfsMotivationWalk.length };
}
const found = walk(6, ["C"]);
const graphEnd = scene("graph", { ...walk(6, ["E", "C"]), showNames: true });
const sequence = defineLearningContent<DfsMotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "dfs-motivation", phase: 1, intervalMs: 3500,
  steps: [
    { id: "maze-question", caption: "どうすれば隠された宝を、漏れなく探し出せるでしょう？", canvas: scene() },
    { id: "compare-wander", caption: "行き当たりばったりに進むと、同じ場所を行き来して、まだ調べていない場所が残ってしまいます。",
      canvas: scene("maze", { current: "A", trail: ["A", "B", "A"], movement: ["A", "B", "A"], visited: ["A", "B"] }) },
    { id: "compare-dive", caption: "1本の道を奥まで進み、行き止まりでは来た道を戻れば、すべての場所を漏れなく調べられます。",
      canvas: scene("maze", { preview: true }) },
    { id: "dive-one", caption: "まず、1本の道を選んで進みます。", canvas: scene("maze", walk(2, ["A", "B"])) },
    { id: "dive-two", caption: "分かれ道では、片方を選んでさらに奥へ進みます。", canvas: scene("maze", walk(3, ["B", "D"])) },
    { id: "dive-three", caption: "道の奥まで進みましたが、ここには宝はありません。", canvas: scene("maze", walk(4, ["D", "F"])) },
    { id: "dive-four", caption: "まだ調べていないつながりを進みます。", canvas: scene("maze", walk(5, ["F", "E"])) },
    { id: "dive-five", caption: "最後に残った場所で、宝を見つけました。", canvas: scene("maze", walk(6, ["E", "C"])) },
    { id: "return-trail", caption: "進んできた道は、戻るときの道しるべにもなります。", canvas: scene("maze", { ...found, returnTrail: true }) },
    { id: "label-maze", caption: "この迷路の各マスに、AからFの名前を付けます。", canvas: scene("maze", { ...found, showNames: true }) },
    { id: "map-to-graph", caption: "マスの場所とつながりを、点と線の図に置き換えてみます。",
      canvas: scene("maze", { ...found, showNames: true, annotations: true }, [{ kind: "edge", id: "ab" }]) },
    { id: "graph-restart", caption: "グラフでもAに戻り、迷路と同じ道をたどります。", canvas: scene("graph", { showNames: true }) },
    { id: "graph-walk-one", caption: "グラフでも、1本の道を奥まで進みます。", canvas: scene("graph", { ...walk(3, ["A", "B", "D"]), showNames: true }) },
    { id: "graph-walk-two", caption: "奥まで進み、まだ調べていないつながりへ移ります。", canvas: scene("graph", { ...walk(5, ["D", "F", "E"]), showNames: true }) },
    { id: "graph-walk-three", caption: "迷路と同じ順で、すべての場所を訪れました。", canvas: graphEnd },
    { id: "utility-transition", caption: "この「奥まで進んで戻る」調べ方は、ほかの場面でも使われています。", canvas: graphEnd },
    { id: "utility-folder", caption: "パソコンのフォルダは、奥まで開けて戻りながらファイルを探せます。",
      canvas: scene("folders", { current: null, trail: [], movement: [], visited: [] }) },
    { id: "name-and-exit", caption: "出発点から1本の道を奥へ進み、進めなくなったら戻るこの方法を、深さ優先探索と呼びます。",
      canvas: scene("graph", { showNames: true, exit: true }, [{ kind: "node", id: "B" }, { kind: "edge", id: "ab" }]) },
  ],
}, validateDfsMotivationCanvas);

export const dfsMotivationContent: DfsMotivationContent = {
  ...sequence, stageName: "導入",
  vocabulary: [
    { concept: "place", everyday: "場所", technical: "ノード", firstStepId: "map-to-graph", usage: "具体的な迷路を表示したまま場所（ノード）のタグを示す。" },
    { concept: "connection", everyday: "つながり", technical: "辺", firstStepId: "map-to-graph", usage: "初出はつながり（辺）。格子とグラフで同じ接続を使う。" },
    { concept: "algorithm", everyday: "奥へ進み、進めなくなったら戻る調べ方", technical: "深さ優先探索", firstStepId: "name-and-exit", usage: "名称は最終場面で付ける。スタックとコードはこの導入では扱わない。" },
  ],
};
