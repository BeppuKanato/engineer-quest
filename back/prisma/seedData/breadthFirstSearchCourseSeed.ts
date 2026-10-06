/** 幅優先探索。概念順・標準コードはdocs/course-designsの設計票を参照。 */
import { CourseCategoryType, CourseDifficulty, MissionActivityType, MissionType } from "@prisma/client";
import type { ActivitySeed, CourseSeed, MissionSeed } from "./learningSeedTypes";
import { estimateMissionMinutes, expectedMissionRewardExp } from "./learningSeedPolicy";

const code = (...lines: string[]) => lines.join("\n");
export const breadthFirstSearchAnswerCode = code(
  "from collections import deque",
  "def bfs_distances(graph, start):",
  "    distances = {start: 0}",
  "    queue = deque([start])",
  "    while queue:",
  "        node = queue.popleft()",
  "        for neighbor in graph.get(node, []):",
  "            if neighbor not in distances:",
  "                distances[neighbor] = distances[node] + 1",
  "                queue.append(neighbor)",
  "    return distances",
);

const retry = { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 } as const;
const a = (
  id: string,
  title: string,
  instruction: string,
  body: string,
  rendererKey: ActivitySeed["content"]["rendererKey"] = "TEXT",
  data: Record<string, unknown> = {},
  mentorMessage = "",
  type: MissionActivityType = MissionActivityType.VIEW,
  learningRole: ActivitySeed["content"]["learningRole"] = "EXPLANATION",
): ActivitySeed => ({
  id: `bfs-${id}`,
  title,
  instruction,
  mentorMessage,
  type,
  actionLabel: type === MissionActivityType.VIEW ? "次へ" : "答えを確認する",
  order: 0,
  content: {
    rendererKey,
    learningRole,
    feedbackPolicy: type === MissionActivityType.VIEW ? { mode: "NONE" } : retry,
    data: { body, ...data },
  },
});
const choice = (
  id: string,
  title: string,
  body: string,
  options: [string, string, string],
  correct: number,
  feedback: string,
  hint: string,
  graphData?: Record<string, unknown>,
) => a(
  id,
  title,
  "図と現在の状態を確認し、当てはまるものを1つ選びましょう。",
  body,
  graphData ? "GRAPH_CHOICE" : "SINGLE_CHOICE",
  {
    ...graphData,
    question: title,
    choices: options.map((label, index) => ({ id: `option-${index}`, label, isCorrect: index === correct })),
    correctFeedback: feedback,
    incorrectFeedback: hint,
  },
  "現在地、発見済み、待ち行列を分けて確かめよう。",
  MissionActivityType.CHOICE,
  "MISSION_CHECK",
);
const mapping = (
  id: string,
  title: string,
  body: string,
  source: string,
  mappings: { id: string; label: string; lines: number[]; role: string; state: string }[],
) => a(
  id,
  title,
  "役割カードを選び、色がつくコード行と状態を見比べましょう。",
  body,
  "CODE_STATE_MAPPING",
  { code: source, mappings },
  "英語名だけで覚えず、どの状態を表すコードかを結びつけよう。",
  MissionActivityType.VIEW,
  "CODE_MAPPING",
);
const build = (
  id: string,
  title: string,
  body: string,
  prefix: string,
  slots: { label: string; indent: number }[],
  blocks: [string, string][],
  answers: string[],
  feedback: string,
  hint: string,
) => a(
  id,
  title,
  "候補をクリックして空欄へ置きましょう。置いたブロックは取り消して選び直せます。",
  body,
  "CODE_FILL",
  {
    question: title,
    codePreviewPrefix: prefix,
    builderSlots: slots,
    codeBlocks: blocks.map(([blockId, label]) => ({ id: blockId, label })),
    builderInstruction: "空欄を上から順に埋めてください。不要な候補もあります。",
    correctAnswers: answers,
    executionResult: feedback,
    correctFeedback: feedback,
    incorrectFeedback: hint,
    previewWaitingMessage: "空欄の役割と、図で起きた変化を見比べましょう。",
  },
  "空欄の日本語の役割から、必要な処理を選ぼう。",
  MissionActivityType.SELECT_FILL,
  "GUIDED_PRACTICE",
);
const m = (
  id: string,
  title: string,
  description: string,
  activities: ActivitySeed[],
  learnedItems: string[],
  type: MissionType = MissionType.MAIN,
): MissionSeed => {
  const result: MissionSeed = {
    id: `bfs-${id}`,
    title,
    description,
    activities: activities.map((activity, index) => ({ ...activity, order: index + 1 })),
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/breadth-first-search.svg",
    estimatedMinutes: 0,
    order: 0,
    type,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 0,
    learnedItems,
    isPublished: true,
  };
  result.estimatedMinutes = estimateMissionMinutes(result);
  result.rewardExp = expectedMissionRewardExp(result);
  return result;
};

const nodes = [
  { id: "A", label: "A", x: 10, y: 34 },
  { id: "B", label: "B", x: 35, y: 14 },
  { id: "C", label: "C", x: 35, y: 54 },
  { id: "D", label: "D", x: 65, y: 10 },
  { id: "E", label: "E", x: 65, y: 38 },
  { id: "F", label: "F", x: 90, y: 25 },
];
const edges = [
  { from: "A", to: "B" }, { from: "A", to: "C" },
  { from: "B", to: "D" }, { from: "B", to: "E" },
  { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" },
];
const adjacency = { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] };
const graph = (steps: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
  nodes, edges, adjacency, steps, intervalMs: 1800, showQueue: true, ...extra,
});
const cycleGraph = (steps: Record<string, unknown>[]) => ({
  nodes: [
    { id: "A", label: "A", x: 28, y: 34 },
    { id: "B", label: "B", x: 72, y: 34 },
  ],
  edges: [{ from: "A", to: "B" }],
  adjacency: { A: ["B"], B: ["A"] },
  steps,
  intervalMs: 1800,
  showQueue: true,
  showDistances: true,
});

const orientation = m("orientation", "近い場所から探す道筋を知ろう", "つながりをたどる問題と、幅優先探索で学ぶ内容を確認します。", [
  a("goal", "つながりをたどって、届く場所を探そう", "丸と線が何を表すかを確認しましょう。",
    "駅Aから線でつながる駅をたどると、直接行ける駅、その次に行ける駅が分かります。丸を場所、線を場所同士のつながりとして表したものをグラフと呼びます。このコースでは、開始地点から線を何本通れば各場所へ着くかを調べます。",
    "GRAPH_TRACE", graph([{ queue: [], discoveredNodes: ["A", "B", "C", "D", "E", "F"], processedNodes: ["A", "B", "C", "D", "E", "F"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 }, message: "Aに近い場所から、距離0、1、2、3の順に広がっています。" }], { adjacency: undefined, showQueue: false, showDistances: true }),
    "まずは丸が場所、線がつながりだと読めれば大丈夫。", MissionActivityType.VIEW, "ORIENTATION"),
  a("uses", "幅優先探索はどこで使われる？", "近いものから調べる場面を確認しましょう。",
    "幅優先探索は、開始地点に近い場所から順に、同じ距離の場所をまとめて調べる方法です。英語のBreadth-First Searchを略してBFSとも呼びます。",
    "TEXT", { listItems: ["乗り換え回数が少ない経路を探す", "迷路で少ない移動回数の道を探す", "SNSで知り合いから何段階離れているか調べる", "ゲーム盤で少ない手数で届く場所を調べる"] },
    "BFSは、線1本を同じ1歩として数えられる場面が得意だよ。", MissionActivityType.VIEW, "ORIENTATION"),
  a("scope", "BFS・DFS・ダイクストラの違い", "このコースで扱う範囲を確認しましょう。",
    "BFSは近い場所から広げます。深さ優先探索（DFS）は1本の道を奥まで進んでから戻ります。ダイクストラ法は線ごとに異なる料金や時間がある場合に使います。このコースでは、すべての線を同じ1歩として扱うBFSだけを学びます。",
    "TEXT", { comparison: { headers: ["方法", "調べ方", "このコース"], rows: [{ cells: ["BFS", "近い場所から順", "学ぶ"] }, { cells: ["DFS", "1本の道を奥へ", "名前だけ紹介"] }, { cells: ["ダイクストラ", "合計の重みが小さい順", "名前だけ紹介"] }] } },
    "線ごとの料金や時間は、まだ考えなくていいよ。", MissionActivityType.VIEW, "ORIENTATION"),
  a("roadmap", "図からPythonの関数へ", "一つずつできることを増やしていきましょう。",
    "つながりの読み方を確認してから、近い順、待ち行列、重複防止、距離の記録へ進みます。",
    "LEARNING_ROADMAP", { roadmapSteps: ["つながりを読む", "近い順に広げる", "待ち行列で順番を保つ", "一度だけ発見する", "距離を記録する", "コードを組み立てる", "自分で関数を完成させる"], emphasis: "ゴール：開始地点から各場所までの最少の辺数を返す" },
    "新しい言葉は、図で役割を確かめてからコードへつなげるよ。", MissionActivityType.VIEW, "ORIENTATION"),
], ["グラフ探索の目的", "BFSの利用場面", "他の探索との違い", "学習順"]);

const connections = m("connections", "場所とつながりを読み取ろう", "グラフの丸・線と、Pythonのつながり一覧を対応づけます。", [
  a("connections-bridge", "並びではなく、つながりを読む", "配列との違いから、今回のデータを確認しましょう。",
    "これまでの配列は左から右へ順番がありました。グラフでは、Aの次が必ずBとは限りません。Aから線で直接つながる場所だけを確認し、そこからさらに先へ進みます。丸を頂点、線を辺とも呼びますが、最初は場所とつながりとして考えます。",
    "GRAPH_TRACE", graph([{ currentNode: "A", inspectingNodes: ["B", "C"], queue: [], discoveredNodes: ["A"], processedNodes: [], activeEdges: [{ from: "A", to: "B" }, { from: "A", to: "C" }], message: "青のAから伸びる紫の2本の線に注目します。直接つながる隣は、同じ紫で示したBとCです。" }], { showQueue: false }),
    "図の左右ではなく、線があるかどうかを見よう。"),
  choice("neighbors", "Aから1本で行ける場所は？", "直接つながる場所だけを選びます。途中で別の場所を通るものは含めません。", ["BとC", "BとD", "B・C・D・E・F"], 0,
    "Aから出る線はA-BとA-Cなので、直接行けるのはBとCです。", "Aから出ている線を1本ずつたどりましょう。",
    graph([{ currentNode: "A", inspectingNode: "B", queue: [], discoveredNodes: ["A"], processedNodes: [], activeEdge: { from: "A", to: "B" }, message: "Aから出る線だけに注目します。" }], { showQueue: false })),
  a("adjacency", "つながりをPythonの辞書で表そう", "図とつながり一覧を見比べましょう。",
    "Pythonでは、場所ごとに直接つながる相手のリストを持つ辞書で表せます。graph[\"A\"]はAのつながり一覧で、[\"B\", \"C\"]です。AとBが双方向につながるため、Aの一覧にはB、Bの一覧にはAを書きます。",
    "GRAPH_TRACE", graph([{ queue: [], discoveredNodes: [], processedNodes: [], message: "図の各線を、両端の場所の一覧へ記録しています。" }], { showQueue: false }),
    "辞書のキーは場所、値のリストは直接つながる相手だよ。"),
  mapping("graph-code", "辞書から隣の場所を取り出そう",
    "graphはつながりの辞書、nodeは現在の場所、neighborは直接つながる相手を1つずつ表します。graph.get(node, [])なら、一覧がない場合も空リストとして扱えます。",
    code("graph = {", "    \"A\": [\"B\", \"C\"],", "    \"B\": [\"A\", \"D\", \"E\"]", "}", "node = \"A\"", "for neighbor in graph.get(node, []):", "    print(neighbor)"), [
      { id: "current", label: "現在の場所を決める", lines: [5], role: "今つながりを調べる場所", state: "nodeはA" },
      { id: "neighbors", label: "直接つながる相手を順に見る", lines: [6, 7], role: "Aの一覧から1件ずつ取り出す", state: "neighborはB、次にC" },
    ]),
  choice("indirect", "EはAの隣として取り出される？", "graph[\"A\"]は[\"B\", \"C\"]です。EへはBまたはCを経由すると行けます。Aを調べるforだけでEは取り出されますか？", ["取り出される。Aからいつか届くため", "取り出されない。Aと直接つながっていないため", "辞書では判断できない"], 1,
    "Aの一覧にあるBとCだけが取り出されます。EはBまたはCを調べる段階で見つかります。", "今見ている一覧がgraph[\"A\"]だけであることを確認しましょう。"),
], ["頂点と辺", "直接のつながり", "隣接リスト", "辞書から隣を取り出すfor"]);

const breadth = m("breadth", "近い場所から順に広げよう", "同じ距離の場所を先に発見すると、最少の辺数が決まる理由を学びます。", [
  a("need", "1本の道だけでは、近い順にならない", "AからFまでのつながりを見てみましょう。",
    "A→B→D→Fのように1本の道だけを先へ進むと、Aから1本で行けるCを後回しにします。開始地点から少ない辺数で届く場所を知るには、まずAから1本の場所を全部、その後で2本の場所を調べます。",
    "GRAPH_TRACE", graph([{ currentNode: "A", queue: [], discoveredNodes: ["A"], processedNodes: [], distances: { A: 0 }, message: "Aを距離0とし、次はAから1本で行ける場所を全部探します。" }], { showQueue: false, showDistances: true }),
    "奥へ急がず、今と同じ距離の場所をそろえてから次へ進むよ。"),
  a("layers", "距離ごとの層を一つずつ広げよう", "発見される距離を段階ごとに追いましょう。",
    "ここでの距離は、開始地点から通る辺の本数です。同じ距離の場所を同じ層として考えます。",
    "GRAPH_TRACE", graph([
      { currentNode: "A", queue: [], discoveredNodes: ["A"], processedNodes: [], distances: { A: 0 }, message: "距離0は開始地点Aだけです。", nextLabel: "距離1の隣を見る" },
      { currentNode: "A", inspectingNodes: ["B", "C"], queue: [], discoveredNodes: ["A"], processedNodes: [], distances: { A: 0 }, activeEdges: [{ from: "A", to: "B" }, { from: "A", to: "C" }], message: "Aの隣BとCを同時に確認します。どちらもAから辺1本の場所です。", nextLabel: "距離1として記録" },
      { queue: [], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, message: "BとCを同じ距離1として記録し、Aの確認を終えました。", nextLabel: "Bの隣を見る" },
      { currentNode: "B", inspectingNodes: ["D", "E"], queue: [], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, activeEdges: [{ from: "B", to: "D" }, { from: "B", to: "E" }], message: "距離1のBを起点に、未発見の隣DとEを確認します。", nextLabel: "距離2として記録" },
      { currentNode: "C", inspectingNode: "E", queue: [], discoveredNodes: ["A", "B", "C", "D", "E"], processedNodes: ["A", "B"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2 }, activeEdge: { from: "C", to: "E" }, message: "Bの確認を終え、同じ距離1のCを起点にします。Eはすでに距離2として発見済みです。", nextLabel: "距離1の確認を終える" },
      { queue: [], discoveredNodes: ["A", "B", "C", "D", "E"], processedNodes: ["A", "B", "C"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2 }, message: "距離1のBとCを両方調べ終え、距離2のDとEがそろいました。", nextLabel: "距離3を探す" },
      { currentNode: "E", inspectingNode: "F", queue: [], discoveredNodes: ["A", "B", "C", "D", "E"], processedNodes: ["A", "B", "C", "D"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2 }, activeEdge: { from: "E", to: "F" }, message: "距離2のEを起点に、未発見の隣Fを確認します。", nextLabel: "距離3として記録" },
      { queue: [], discoveredNodes: ["A", "B", "C", "D", "E", "F"], processedNodes: ["A", "B", "C", "D", "E", "F"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2, F: 3 }, message: "Fを距離3として記録し、すべての場所の確認が終わりました。" },
    ], { showQueue: false, showDistances: true, currentNodeLabel: "今調べている起点", waitingNodeLabel: "発見済み", finalMessage: "Aから近い順に、距離0→1→2→3の場所をすべて発見できました。" }),
    "層を順番に広げれば、初めて見つけた距離が最短になるよ。"),
  choice("next-layer", "距離1の次に調べる場所は？", "Aから開始し、BとCが距離1だと分かりました。次はどの場所を距離2の候補として調べますか？", ["Bの隣だけを最後まで奥へ進む", "BとCの隣を調べ、未発見の場所を集める", "Fから逆向きにAを探す"], 1,
    "距離1のBとCをどちらも調べると、距離2のDとEを漏れなく集められます。", "次の層は、現在の層にある全ての場所の隣から作ります。",
    graph([{ currentNode: "B", inspectingNode: "D", queue: ["B", "C"], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, activeEdge: { from: "B", to: "D" }, message: "距離1のBとCが、どちらも次に調べる対象です。" }], { showQueue: false, showDistances: true })),
  a("distance-rule", "隣の距離は、現在の距離に1を足す", "距離2の場所から新しい隣を見つけた場合を考えましょう。",
    "現在の場所まで辺を2本通り、そこから新しい隣へもう1本通るため、新しい場所の距離は3です。新しい隣の距離は、現在の距離に1を足して求めます。",
    "TEXT", { comparison: { headers: ["現在の場所", "現在の距離", "新しい隣の距離"], rows: [{ cells: ["E", "2", "2 + 1 = 3"] }] }, conclusion: "近い層から順に調べるため、初めて発見したときの距離が最少の辺数です。" },
    "新しい辺を1本通るから、距離も1増えるよ。"),
  choice("distance-check", "Gの距離はいくつ？", "開始地点Sから距離2の場所Xを調べ、未発見のGへ直接つながる辺を見つけました。Gの距離として記録する値は？", ["1", "2", "3"], 2,
    "SからXまで2本、XからGへ1本なので、Gの距離は3です。", "現在の場所までの辺数に、新しく通る1本を足しましょう。"),
], ["BFSの層", "辺数としての距離", "近い順に発見する理由", "隣の距離の計算"]);

const queueMission = m("queue", "待ち行列で、近い順を保とう", "先に発見した場所から取り出す待ち行列と、dequeの操作を学びます。", [
  a("queue-bridge", "次に調べる場所を忘れずに並べよう", "距離1のBとCを、両方とも後で調べる方法を考えます。",
    "AからBとCを見つけた後、Bだけを覚えてCを忘れると、Cからしか行けない場所を見落とします。発見した順にB、Cと並べ、先に入れたBから取り出せば、同じ距離を先に調べられます。この入れ物を待ち行列（キュー）と呼びます。",
    "GRAPH_TRACE", graph([{ currentNode: "A", queue: ["B", "C"], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, message: "Aを調べ終え、B、Cの順で待ち行列に入っています。" }], { showDistances: true }),
    "先に見つけた場所を、左から先に取り出すよ。"),
  a("full-trace", "待ち行列と図を一緒に追おう", "取り出す・隣を見る・新しく追加する変化を1段階ずつ確認しましょう。",
    "待ち行列の左端から1件取り出します。未発見の隣は右端へ追加します。",
    "GRAPH_TRACE", graph([
      { currentNode: "A", queue: ["A"], discoveredNodes: ["A"], processedNodes: [], distances: { A: 0 }, message: "開始地点Aを距離0として記録し、待ち行列へ入れます。", nextLabel: "Aを取り出す" },
      { currentNode: "A", queue: [], discoveredNodes: ["A"], processedNodes: [], distances: { A: 0 }, message: "左端のAを取り出しました。Aの隣を調べます。", nextLabel: "Bを発見する" },
      { currentNode: "A", inspectingNode: "B", queue: ["B"], discoveredNodes: ["A", "B"], processedNodes: [], distances: { A: 0, B: 1 }, activeEdge: { from: "A", to: "B" }, message: "未発見のBを距離1として記録し、右端へ追加しました。", nextLabel: "Cを発見する" },
      { currentNode: "A", inspectingNode: "C", queue: ["B", "C"], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, activeEdge: { from: "A", to: "C" }, message: "未発見のCも距離1として右端へ追加。Aの確認は終わりです。", nextLabel: "Bを取り出す" },
      { currentNode: "B", queue: ["C"], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, message: "左端のBを取り出しました。Cより先に発見したBから調べます。", nextLabel: "Dを追加する" },
      { currentNode: "B", inspectingNode: "D", queue: ["C", "D"], discoveredNodes: ["A", "B", "C", "D"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1, D: 2 }, activeEdge: { from: "B", to: "D" }, message: "未発見のDを距離2として記録し、右端へ追加しました。", nextLabel: "Eを追加する" },
      { currentNode: "B", inspectingNode: "E", queue: ["C", "D", "E"], discoveredNodes: ["A", "B", "C", "D", "E"], processedNodes: ["A", "B"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2 }, activeEdge: { from: "B", to: "E" }, message: "続けてEも距離2として右端へ追加しました。距離1のCは、DとEより先に左端に残っています。" },
    ], { showDistances: true, finalMessage: "距離1のCが、距離2のD・Eより先に取り出される順番を保てました。" }),
    "左から取り出し、右へ追加する順番が近い層を守るよ。"),
  choice("next-pop", "次に取り出す場所は？", "Aを調べ終えた時点で待ち行列は左から[B, C]です。次に取り出す場所はどこ？", ["A", "B", "C"], 1,
    "左端のBを先に取り出します。Cはその次です。", "待ち行列の『次に取り出す側』を確認しましょう。",
    graph([{ queue: ["B", "C"], discoveredNodes: ["A", "B", "C"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1 }, message: "左端が次に取り出す側です。" }], { showDistances: true })),
  mapping("deque-code", "dequeで待ち行列を作ろう",
    "deque（デック）はPythonで待ち行列を扱う入れ物です。appendで右端へ追加し、popleftで左端から取り出します。nodeは取り出した現在の場所です。",
    code("from collections import deque", "queue = deque([start])", "node = queue.popleft()", "queue.append(neighbor)"), [
      { id: "prepare", label: "開始地点を入れて準備する", lines: [1, 2], role: "左から取り出せる待ち行列を作る", state: "queueは[start]" },
      { id: "remove", label: "左端から取り出す", lines: [3], role: "先に発見した場所を現在地にする", state: "nodeへ左端の場所が入り、queueからは消える" },
      { id: "add", label: "右端へ追加する", lines: [4], role: "新しく発見した隣を後で調べる", state: "neighborがqueueの最後へ加わる" },
    ]),
  build("queue-build", "取り出しと追加のコードを置こう",
    "queueは左から[B, C]、新しく見つけた場所はDです。Bを取り出し、Dを右端へ追加する2行を作ります。",
    "from collections import deque\nqueue = deque([\"B\", \"C\"])\nneighbor = \"D\"",
    [{ label: "左端から現在地を取り出す", indent: 0 }, { label: "新しい場所を右端へ追加する", indent: 0 }],
    [["pop-right", "node = queue.pop()"], ["pop-left", "node = queue.popleft()"], ["append-left", "queue.appendleft(neighbor)"], ["append", "queue.append(neighbor)"]],
    ["pop-left", "append"],
    "Bを取り出した後にDを加えるので、queueは[C, D]になります。",
    "先に入ったBは左から取り出し、新しいDは右へ追加します。"),
  choice("fifo", "右端から取り出すとどうなる？", "待ち行列[B, C, D]で、DはBとCより後に発見されました。右端からDを先に取り出すコードに変えると？", ["近い順が必ず保たれる", "後から見つけた場所を先に調べ、近い順が崩れることがある", "すべての場所が自動で削除される"], 1,
    "後から入ったDを先に取り出すと、同じ距離のB・Cを先に調べる保証がなくなります。BFSではpopleftを使います。", "BFSが守りたいのは、先に発見した場所を先に調べる順番です。"),
], ["待ち行列", "先入れ先出し", "deque", "appendとpopleft"]);

const discovery = m("discovery", "一度だけ発見して、距離を記録しよう", "循環するグラフでも重複追加せず、初回の距離を保存する方法を学びます。", [
  a("cycle-problem", "線を戻れると、同じ場所へ戻ってしまう", "AとBが互いにつながる場面を考えましょう。",
    "AからBを見つけ、Bを調べると隣にAがあります。何も記録していなければAをもう一度待ち行列へ入れ、A→B→Aと繰り返します。そこで、すでに発見した場所を見分けます。",
    "GRAPH_TRACE", cycleGraph([
      { currentNode: "A", inspectingNode: "B", queue: ["B"], discoveredNodes: ["A", "B"], processedNodes: ["A"], distances: { A: 0, B: 1 }, activeEdge: { from: "A", to: "B" }, message: "AからBを発見し、Bを待ち行列へ追加しました。", nextLabel: "BからAを見る" },
      { currentNode: "B", inspectingNode: "A", queue: [], discoveredNodes: ["A", "B"], processedNodes: ["A", "B"], distances: { A: 0, B: 1 }, activeEdge: { from: "B", to: "A" }, message: "BからAへ戻る線がありますが、Aは発見済みなので追加しません。" },
    ]),
    "発見済みなら、同じ場所を待ち行列へ戻さないよ。"),
  a("record-rule", "待ち行列へ入れる前に、発見済みにしよう", "同じ場所が2方向から見つかる場合を確認します。",
    "EはBからもCからもつながっています。距離を記録する辞書をdistancesと呼びます。BからEを見つけたとき、distancesへ記録してから待ち行列へ入れます。その後CからEを見ても、すでに記録があるので追加しません。取り出すまで記録を待つと、Eが2回追加される可能性があります。",
    "GRAPH_TRACE", graph([
      { currentNode: "B", inspectingNode: "E", queue: ["C", "D"], discoveredNodes: ["A", "B", "C", "D"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1, D: 2 }, activeEdge: { from: "B", to: "E" }, message: "Bから未発見のEを見つけました。", nextLabel: "距離を記録する" },
      { currentNode: "B", inspectingNode: "E", queue: ["C", "D", "E"], discoveredNodes: ["A", "B", "C", "D", "E"], processedNodes: ["A", "B"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2 }, activeEdge: { from: "B", to: "E" }, message: "Eの距離2を記録してから、待ち行列へ1回だけ追加しました。", nextLabel: "CからEを見る" },
      { currentNode: "C", inspectingNode: "E", queue: ["D", "E"], discoveredNodes: ["A", "B", "C", "D", "E"], processedNodes: ["A", "B", "C"], distances: { A: 0, B: 1, C: 1, D: 2, E: 2 }, activeEdge: { from: "C", to: "E" }, message: "CからもEが見えますが、distancesに記録済みなので追加しません。" },
    ], { showDistances: true }),
    "記録してから追加。この順なら、同じ場所は1回だけ待つよ。"),
  choice("mark-time", "Eを発見済みにするタイミングは？", "BとCの両方からEへ線があります。Eを待ち行列へ重複追加しないため、いつdistancesへEを記録しますか？", ["Eを待ち行列へ入れる直前", "Eを待ち行列から取り出した後", "探索がすべて終わった後"], 0,
    "待ち行列へ入れる前に記録すれば、別の場所からEを見たときに発見済みだと判断できます。", "取り出すまで待つ間に、別の線から同じ場所が見つかる可能性があります。",
    graph([{ currentNode: "B", inspectingNode: "E", queue: ["C", "D"], discoveredNodes: ["A", "B", "C", "D"], processedNodes: ["A"], distances: { A: 0, B: 1, C: 1, D: 2 }, activeEdge: { from: "B", to: "E" }, message: "Eを右端へ追加する前の状態です。" }], { showDistances: true })),
  mapping("distance-code", "距離の辞書を、発見済みの印にも使おう",
    "distancesは、発見した場所をキー、その最少の辺数を値として持つ辞書です。neighborがキーにないときだけ距離を記録し、待ち行列へ追加します。",
    code("distances = {start: 0}", "if neighbor not in distances:", "    distances[neighbor] = distances[node] + 1", "    queue.append(neighbor)"), [
      { id: "start", label: "開始地点を距離0で記録", lines: [1], role: "開始地点を最初から発見済みにする", state: "distancesは{start: 0}" },
      { id: "new", label: "未発見か確認する", lines: [2], role: "同じ場所の重複追加を防ぐ", state: "辞書にneighborがなければ初回の発見" },
      { id: "distance", label: "距離を記録して追加する", lines: [3, 4], role: "現在の距離+1を保存し、後で調べる", state: "記録後は別の線から見ても追加しない" },
    ]),
  build("discovery-build", "未発見の隣だけを追加しよう",
    "nodeは現在の場所、neighborは今見ている隣です。distancesを発見済みの記録として使います。",
    "for neighbor in graph.get(node, []):",
    [{ label: "未発見なら処理する", indent: 1 }, { label: "現在地より1大きい距離を記録", indent: 2 }, { label: "待ち行列の右端へ追加", indent: 2 }],
    [["wrong-condition", "if neighbor in distances:"], ["condition", "if neighbor not in distances:"], ["same", "distances[neighbor] = distances[node]"], ["distance", "distances[neighbor] = distances[node] + 1"], ["left", "queue.appendleft(neighbor)"], ["append", "queue.append(neighbor)"]],
    ["condition", "distance", "append"],
    "未発見の場所だけに距離を記録し、1回だけ待ち行列へ追加できます。",
    "not inで未発見を確認し、距離は現在地+1、新しい場所は右端へ置きます。"),
  choice("unreachable", "開始地点から届かない場所は？", "A-B-Cのまとまりと、X-Yのまとまりの間に線がありません。AからBFSを始めたとき、distancesへXとYは記録されますか？", ["記録される。辞書に存在する全頂点を見るため", "記録されない。Aからつながりをたどって届かないため", "Xだけ距離0で記録される"], 1,
    "BFSは開始地点からつながりをたどります。届かないXとYは発見されず、結果の辞書にも入りません。", "開始地点Aから線をたどって、Xのまとまりへ移れるか確認しましょう。"),
], ["循環での重複防止", "発見時の記録", "距離辞書", "到達できる範囲"]);

const synthesis = m("assemble", "BFSのコードを組み立てよう", "既習のつながり・待ち行列・発見済み・距離を1つの関数へまとめます。", [
  mapping("full-code", "図の動きと、関数全体を対応させよう",
    "graphはつながりの辞書、startは開始地点です。distancesは発見済みと距離を兼ね、queueは次に調べる場所を発見順に保ちます。",
    breadthFirstSearchAnswerCode, [
      { id: "prepare", label: "開始地点を準備", lines: [1, 2, 3, 4], role: "距離0を記録し、待ち行列へ入れる", state: "startだけが発見済み" },
      { id: "take", label: "先に発見した場所を取り出す", lines: [5, 6], role: "待ち行列がある間、左端を現在地にする", state: "nodeの隣を調べる" },
      { id: "discover", label: "未発見の隣を記録", lines: [7, 8, 9, 10], role: "距離を保存して右端へ追加する", state: "同じ場所は1回だけ追加" },
      { id: "return", label: "届いた場所と距離を返す", lines: [11], role: "開始地点から到達できる結果を返す", state: "届かない場所は辞書にない" },
    ]),
  build("full-build", "BFS関数の中心を完成させよう",
    "開始地点の準備は済んでいます。待ち行列がある間、場所を取り出し、未発見の隣へ距離を付けて追加します。すべて既習の処理です。",
    code("from collections import deque", "def bfs_distances(graph, start):", "    distances = {start: 0}", "    queue = deque([start])"),
    [
      { label: "待ち行列がある間繰り返す", indent: 1 },
      { label: "左端から現在地を取り出す", indent: 2 },
      { label: "現在地の隣を順に見る", indent: 2 },
      { label: "未発見なら処理する", indent: 3 },
      { label: "隣の距離を記録", indent: 4 },
      { label: "隣を右端へ追加", indent: 4 },
      { label: "探索後の辞書を返す", indent: 1 },
    ],
    [
      ["return", "return distances"], ["while", "while queue:"], ["pop", "node = queue.popleft()"],
      ["neighbors", "for neighbor in graph.get(node, []):"], ["condition", "if neighbor not in distances:"],
      ["distance", "distances[neighbor] = distances[node] + 1"], ["append", "queue.append(neighbor)"],
      ["wrong-pop", "node = queue.pop()"], ["wrong-condition", "if neighbor in distances:"],
    ],
    ["while", "pop", "neighbors", "condition", "distance", "append", "return"],
    "近い順を保ち、各場所を1回だけ発見して距離を返す関数になりました。",
    "左から取り出すこと、未発見時に記録してから右へ追加することを確認しましょう。"),
  choice("transfer", "別のグラフでも距離を追える？", "Sの隣がPとQ、Pの隣にR、Qの隣にRとTがあります。SからBFSを始めると、RとTの距離は？", ["R=1、T=1", "R=2、T=2", "R=2、T=3"], 1,
    "PとQは距離1です。その隣として初めて見つかるRとTは、どちらも距離2です。Rは2方向から見えても1回だけ記録します。", "Sから通る辺を層ごとに数えましょう。"),
], ["BFSコードの統合", "待ち行列と距離辞書の役割", "別データへの適用"]);

synthesis.activities[1].content.learningRole = "SYNTHESIS";

const exam = m("course-mission", "Course Mission：幅優先探索を自分で実装しよう", "待ち行列と距離の記録を使い、開始地点から各場所までの最少の辺数を求めます。", [
  a("implementation", "幅優先探索で距離を求めよう",
    "bfs_distances(graph, start)を完成させ、startから届く各場所までの最少の辺数を辞書で返しましょう。",
    "graphは、場所名をキー、直接つながる場所名のリストを値とする辞書です。線はすべて同じ1歩として数えます。戻り値にはstartを距離0で含め、startから届かない場所は含めません。同じ場所を重複して待ち行列へ入れず、先に発見した場所から調べてください。関数名と引数名を保ち、passを置き換えてください。",
    "CODE_EDITOR", {
      evaluationMode: "TEST_CASES",
      functionName: "bfs_distances",
      answerCode: breadthFirstSearchAnswerCode,
      starterCode: code("from collections import deque", "", "def bfs_distances(graph, start):", "    # startから各場所までの最少の辺数を返してください", "    pass"),
      forbiddenCode: [
        { snippet: "networkx", label: "完成済みのグラフ探索ライブラリではなく、待ち行列を使うBFSを書きましょう。" },
        { snippet: "shortest_path", label: "完成済みの最短路関数ではなく、学んだ距離の記録を使いましょう。" },
      ],
      testCases: [
        { id: "line", label: "一本道：距離が1ずつ増える", args: [{ A: ["B"], B: ["A", "C"], C: ["B"] }, "A"], expected: { A: 0, B: 1, C: 2 } },
        { id: "branch", label: "分岐：同じ距離をそろえる", args: [{ A: ["B", "C"], B: ["A", "D"], C: ["A", "E"], D: ["B"], E: ["C"] }, "A"], expected: { A: 0, B: 1, C: 1, D: 2, E: 2 } },
        { id: "cycle", label: "循環：同じ場所を繰り返さない", args: [{ A: ["B", "C"], B: ["A", "C"], C: ["A", "B"] }, "A"], expected: { A: 0, B: 1, C: 1 } },
        { id: "two-routes", label: "複数経路：短い方を保つ", args: [{ A: ["B", "C"], B: ["A", "D"], C: ["A", "E"], D: ["B", "E"], E: ["C", "D"] }, "A"], expected: { A: 0, B: 1, C: 1, D: 2, E: 2 } },
        { id: "disconnected", label: "非連結：届かない場所を含めない", args: [{ A: ["B"], B: ["A"], X: ["Y"], Y: ["X"] }, "A"], expected: { A: 0, B: 1 } },
        { id: "isolated", label: "孤立：開始地点だけを返す", args: [{ A: [] }, "A"], expected: { A: 0 } },
        { id: "labels", label: "文字列ラベル：名前が長くても同じ", args: [{ home: ["park", "shop"], park: ["home"], shop: ["home", "station"], station: ["shop"] }, "home"], expected: { home: 0, park: 1, shop: 1, station: 2 } },
      ],
      hints: [
        { id: "prepare", title: "開始地点を準備する", body: "開始地点は距離0です。distancesへ記録してから、dequeの待ち行列へ入れます。", code: code("distances = {start: 0}", "queue = deque([start])") },
        { id: "queue", title: "近い順を保つ", body: "待ち行列が空でない間、先に入った左端からpopleftで取り出します。右端からpopするとBFSの順番になりません。", code: code("while queue:", "    node = queue.popleft()") },
        { id: "neighbors", title: "未発見の隣だけを見る", body: "graph.get(node, [])で隣を順に見ます。neighborがdistancesにない場合だけ初回の発見です。", code: code("for neighbor in graph.get(node, []):", "    if neighbor not in distances:") },
        { id: "record", title: "距離を記録してから追加する", body: "隣の距離は現在地の距離+1です。記録後に右端へ追加し、最後にdistancesを返します。", code: code("distances[neighbor] = distances[node] + 1", "queue.append(neighbor)", "return distances") },
      ],
      courseResult: {
        masteryTitle: "幅優先探索をマスター",
        description: "幅優先探索コースを修了しました。",
        learningOutcome: "つながりを近い順に調べ、重複を防ぎながら各場所までの最少の辺数を求められるようになりました。",
      },
      correctFeedback: "7つのテストを通過しました。待ち行列で近い順を守り、各場所を一度だけ発見して距離を求められました。",
      incorrectFeedback: "未通過のケースで、左端からの取り出し、発見時の距離記録、重複追加、届かない場所の扱いを見直しましょう。",
    },
    "未通過のケースは、どの場所がいつ待ち行列へ入るかを図に戻って確認しよう。",
    MissionActivityType.TRY_CODE,
    "COURSE_EXAM"),
], ["幅優先探索の自力実装", "テスト結果を使った修正"], MissionType.COURSE_EXAM);

exam.activities[0].actionLabel = "提出する";

export const breadthFirstSearchCourseSeed: CourseSeed = {
  id: "course-algorithm-breadth-first-search-v1",
  title: "幅優先探索（BFS）",
  description: "場所同士のつながりを、開始地点に近い順から調べる幅優先探索を学びます。図と待ち行列を一手ずつ追い、重複を防ぎながら最少の辺数を求め、最後はPython関数を完成させます。辞書・リスト・if・for・while・関数を一度学んだ方が対象です。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: true,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.GRAPH, CourseCategoryType.SEARCH],
  missions: [orientation, connections, breadth, queueMission, discovery, synthesis, exam]
    .map((mission, index) => ({ ...mission, order: index + 1 })),
};
