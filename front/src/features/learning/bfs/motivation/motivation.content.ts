import { defineLearningContent } from "../../player/content.types";
import { bfsGraph, bfsMaze } from "../bfsGraph";
import { validateMotivationCanvas, type MotivationCanvasState, type MotivationContent, type VocabularyEntry } from "./motivation.types";

/**
 * 格子の配置は、正本グラフ（../bfsGraph）の辺がすべて隣接マス間の移動になるように置く。
 * A B D / C E F の2行3列で、全7辺が上下左右の1マス移動と1対1に対応する（#91）。
 */
const maze: MotivationCanvasState["data"]["maze"] = bfsMaze;

const routes: MotivationCanvasState["data"]["routes"] = [
  {
    id: "detour", places: ["A", "C", "E", "B", "D", "F"],
    labels: { maze: "5手", graph: "5本", rail: "5区間", social: "つながり5つ" },
    labelPosition: { maze: { x: 115, y: 290 }, graph: { x: 300, y: 290 } },
  },
  {
    id: "direct", places: ["A", "B", "E", "F"],
    labels: { maze: "3手", graph: "3本", rail: "3区間", social: "つながり3つ" },
    labelPosition: { maze: { x: 490, y: 290 }, graph: { x: 450, y: 35 } },
  },
];

/** 手数は実際にたどる道の移動回数、○歩は出発点からの最短距離の層。 */
export const bfsVocabulary: readonly VocabularyEntry[] = [
  { concept: "route", everyday: "たどる道", technical: "ルート", firstStepId: "compare-five", usage: "初出は道（ルート）、以降はルート。" },
  { concept: "move-count", everyday: "上下左右に1マス進む回数", technical: "手", firstStepId: "compare-five", usage: "出発点は数えず、隣のマスへ進むごとに1手。候補は5手と3手。" },
  { concept: "place", everyday: "場所", technical: "ノード", firstStepId: "map-to-graph", usage: "初出の図上タグは場所（ノード）。格子とグラフでA〜Fの同一IDを使う。" },
  { concept: "connection", everyday: "つながり", technical: "辺", firstStepId: "map-to-graph", usage: "初出はつながり（辺）。通れる隣接マス間の移動と1対1で対応。" },
  { concept: "rail-distance", everyday: "駅と駅の間", technical: "区間", firstStepId: "rail-transition", usage: "駅への切替予告で初出。駅間1本を1区間と数える最少区間数であり、所要時間や乗換回数ではない。" },
  { concept: "distance-layer", everyday: "出発点から何マス先か", technical: "○歩", firstStepId: "grid-origin", usage: "出発点は0歩、直接つながる場所は1歩。回り道の実際の手数と区別。" },
  { concept: "algorithm", everyday: "近い場所から順に調べる方法", technical: "幅優先探索", firstStepId: "name-and-exit", usage: "最終コマで初めて名称を示す。キューや探索全過程はフェーズ2以降。" },
];

const initialState: MotivationCanvasState["state"] = {
  start: "A", goal: "F", current: "A", trail: ["A"], shownRoutes: [],
  showNames: false, distances: [], annotations: [], exit: null,
};

function scene(
  view: MotivationCanvasState["data"]["view"] = "maze",
  state: Partial<MotivationCanvasState["state"]> = {},
  highlights: MotivationCanvasState["highlights"] = [],
): MotivationCanvasState {
  return {
    data: {
      kind: "bfs-motivation", view, graph: bfsGraph, maze, routes,
      labels: {
        start: "出発点", goal: "ゴール", moveUnit: "手", distanceUnit: "歩",
        nodeNames: Object.fromEntries(bfsGraph.nodes.map(({ id }) => [id, view === "rail" ? `${id}駅` : view === "social" ? `${id}さん` : id])),
      },
    },
    state: { ...initialState, ...state }, highlights,
  };
}

const terms: MotivationCanvasState["state"]["annotations"] = [
  { kind: "node", id: "A", label: "場所（ノード）" },
  { kind: "edge", id: "ab", label: "つながり（辺）" },
];
const entrance: MotivationCanvasState["highlights"] = [
  { kind: "node", id: "B" }, { kind: "node", id: "C" },
  { kind: "edge", id: "ab" }, { kind: "edge", id: "ac" },
];
const distances = [{ id: "A", value: 0 }, { id: "B", value: 1 }, { id: "C", value: 1 }];

const sequence = defineLearningContent<MotivationCanvasState>({
  version: 1, kind: "step-sequence", id: "bfs-motivation", phase: 1, intervalMs: 3500,
  steps: [
    {
      id: "maze-question", caption: "どの道をたどると、いちばん短くゴールへ着けるでしょう？",
      canvas: scene(),
    },
    {
      id: "compare-five", caption: "遠回りの道（ルート）では、ゴールまで5手かかります。",
      canvas: scene("maze", { shownRoutes: ["detour"] }, [{ kind: "route", id: "detour" }]),
    },
    {
      id: "compare-three", caption: "こちらのルートなら、3手でゴールに着けます。",
      canvas: scene("maze", { shownRoutes: ["detour", "direct"] }, [{ kind: "route", id: "direct" }]),
    },
    {
      id: "walk-one", caption: "まず右へ1マス進みます。",
      canvas: scene("maze", { current: "B", trail: ["A", "B"] }, [{ kind: "node", id: "B" }]),
    },
    {
      id: "walk-two", caption: "もう1マス下へ進みます。",
      canvas: scene("maze", { current: "E", trail: ["A", "B", "E"] }, [{ kind: "node", id: "E" }]),
    },
    {
      id: "walk-three", caption: "3手でゴールに着きました。",
      canvas: scene("maze", { current: "F", trail: ["A", "B", "E", "F"] }, [{ kind: "node", id: "F" }]),
    },
    {
      id: "goal-changes", caption: "今度は、ゴールの場所が変わりました。",
      canvas: scene("maze", { goal: "D", current: "F", trail: ["A", "B", "E", "F"] }, [{ kind: "node", id: "D" }]),
    },
    {
      id: "restart", caption: "出発点に戻り、短いルートをもう一度考えます。",
      canvas: scene("maze", { goal: "D" }),
    },
    {
      id: "new-goal-one", caption: "右へ1マス進みます。",
      canvas: scene("maze", { goal: "D", current: "B", trail: ["A", "B"] }, [{ kind: "node", id: "B" }]),
    },
    {
      id: "new-goal-two", caption: "右へ進むと、今度のゴールには2手で着きます。",
      canvas: scene("maze", { goal: "D", current: "D", trail: ["A", "B", "D"] }, [{ kind: "node", id: "D" }]),
    },
    {
      id: "label-maze", caption: "この迷路の各マスに、AからFの名前を付けます。",
      canvas: scene("maze", { goal: "D", current: "D", trail: ["A", "B", "D"], showNames: true }),
    },
    {
      id: "map-to-graph", caption: "マスの場所とつながりを、点と線の図に置き換えてみます。",
      canvas: scene("graph", { goal: "D", current: "D", trail: ["A", "B", "D"], showNames: true, annotations: terms }),
    },
    {
      id: "graph-restart", caption: "グラフでもAに戻り、迷路と同じ道をたどります。",
      canvas: scene("graph", { goal: "D", showNames: true }),
    },
    {
      id: "graph-walk-one", caption: "AからBへ、1本の辺をたどります。",
      canvas: scene("graph", { goal: "D", current: "B", trail: ["A", "B"], showNames: true }, [{ kind: "node", id: "B" }]),
    },
    {
      id: "graph-walk-two", caption: "BからDへ進むと、迷路と同じ2手でゴールに着きます。",
      canvas: scene("graph", { goal: "D", current: "D", trail: ["A", "B", "D"], showNames: true }, [{ kind: "node", id: "D" }]),
    },
    {
      id: "rail-transition", caption: "同じ形の図を駅のつながりと見立てると、A駅からF駅までの最少区間も同じように調べられます。",
      canvas: scene("graph", { goal: "D", current: "D", trail: ["A", "B", "D"], showNames: true }, [{ kind: "node", id: "D" }]),
    },
    {
      id: "rail-utility", caption: "駅と駅を1区間で結ぶと、A駅からF駅までは最少3区間で着きます。",
      canvas: scene("rail", { current: null, trail: [], showNames: true, shownRoutes: ["direct"] }, [{ kind: "route", id: "direct" }]),
    },
    {
      id: "method-transition", caption: "では、どうやって最少の手数を調べればよいのでしょうか？",
      canvas: scene("rail", { current: null, trail: [], showNames: true, shownRoutes: ["direct"] }, [{ kind: "route", id: "direct" }]),
    },
    {
      id: "grid-origin", caption: "出発点を0歩として、近い場所から調べてみます。",
      canvas: scene("maze", { showNames: true, distances: [{ id: "A", value: 0 }] }),
    },
    {
      id: "first-wave", caption: "まず出発点から1歩で届く場所を調べます。",
      canvas: scene("maze", { showNames: true, distances }, entrance),
    },
    {
      id: "bridge-entrance", caption: "この場所とつながりを、同じノードと辺の図で表せます。",
      canvas: scene("graph", { showNames: true, distances }, entrance),
    },
    {
      id: "name-and-exit", caption: "近い場所から順に調べるこの方法を、幅優先探索と呼びます。",
      canvas: scene("graph", {
        showNames: true, distances, exit: { label: "動きの説明へ進む", nextPhase: 2 },
      }, entrance),
    },
  ],
}, validateMotivationCanvas);

export const bfsMotivationContent: MotivationContent = { ...sequence, vocabulary: bfsVocabulary };

for (const entry of bfsMotivationContent.vocabulary) {
  if (!sequence.steps.some((step) => step.id === entry.firstStepId)) throw new Error("Unknown vocabulary introduction step");
}
