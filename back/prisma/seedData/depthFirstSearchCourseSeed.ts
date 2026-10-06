/** 深さ優先探索。概念順・標準コードはdocs/course-designsの設計票を参照。 */
import { CourseCategoryType, CourseDifficulty, MissionActivityType, MissionType } from "@prisma/client";
import type { ActivitySeed, CourseSeed, MissionSeed } from "./learningSeedTypes";
import { estimateMissionMinutes, expectedMissionRewardExp } from "./learningSeedPolicy";

const code = (...lines: string[]) => lines.join("\n");
export const depthFirstSearchAnswerCode = code(
  "def dfs_order(graph, start):",
  "    visited = set()",
  "    order = []",
  "    def visit(node):",
  "        visited.add(node)",
  "        order.append(node)",
  "        for neighbor in graph.get(node, []):",
  "            if neighbor not in visited:",
  "                visit(neighbor)",
  "    visit(start)",
  "    return order",
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
  id: `dfs-${id}`,
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
  "現在地、発見済み、戻り先を分けて確かめよう。",
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
  "コードの形だけでなく、進む・戻るのどちらを表すか結びつけよう。",
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
    id: `dfs-${id}`,
    title,
    description,
    activities: activities.map((activity, index) => ({ ...activity, order: index + 1 })),
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/depth-first-search.svg",
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
  { id: "B", label: "B", x: 34, y: 14 },
  { id: "C", label: "C", x: 34, y: 54 },
  { id: "D", label: "D", x: 61, y: 10 },
  { id: "E", label: "E", x: 64, y: 43 },
  { id: "F", label: "F", x: 90, y: 25 },
];
const edges = [
  { from: "A", to: "B" }, { from: "A", to: "C" },
  { from: "B", to: "D" }, { from: "B", to: "E" },
  { from: "C", to: "E" }, { from: "D", to: "F" }, { from: "E", to: "F" },
];
const adjacency = { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "E"], D: ["B", "F"], E: ["B", "C", "F"], F: ["D", "E"] };
const graph = (steps: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
  nodes,
  edges,
  adjacency,
  steps,
  intervalMs: 1800,
  showQueue: true,
  currentNodeLabel: "現在調べている場所",
  waitingNodeLabel: "発見済み・処理途中",
  containerLabel: "呼び出しの積み重なり（右端が現在地）",
  containerLeadingLabel: "開始地点側",
  containerTrailingLabel: "現在の呼び出し",
  activeContainerItem: "LAST",
  ...extra,
});
const twoNodeGraph = (steps: Record<string, unknown>[]) => ({
  nodes: [{ id: "A", label: "A", x: 28, y: 34 }, { id: "B", label: "B", x: 72, y: 34 }],
  edges: [{ from: "A", to: "B" }],
  adjacency: { A: ["B"], B: ["A"] },
  steps,
  intervalMs: 1800,
  showQueue: true,
  currentNodeLabel: "現在調べている場所",
  waitingNodeLabel: "発見済み・処理途中",
  containerLabel: "呼び出しの積み重なり（右端が現在地）",
  containerLeadingLabel: "開始地点側",
  containerTrailingLabel: "現在の呼び出し",
  activeContainerItem: "LAST",
});

const orientation = m("orientation", "一つの道を奥までたどる探索を知ろう", "深さ優先探索が解決する問題と、BFSとの違いを確認します。", [
  a("goal", "つながりを奥までたどって、届く場所を探そう", "DFSがどのように進むか全体像を確認しましょう。",
    "開始地点Aから、最初に選んだ道を進めるところまで進みます。行き止まりになったら一つ前へ戻り、まだ調べていない道を続けます。このコースでは、到達できる場所を初めて訪れた順に並べます。",
    "GRAPH_TRACE", graph([
      { queue: [], discoveredNodes: ["A", "B", "C", "D", "E", "F"], processedNodes: ["A", "B", "C", "D", "E", "F"], message: "Aから一つの道を奥へ進み、戻りながら残りの道も調べた後の状態です。" },
    ], { adjacency: undefined, showQueue: false }),
    "まずは、奥へ進んでから戻る探索だと分かれば大丈夫。", MissionActivityType.VIEW, "ORIENTATION"),
  a("uses", "深さ優先探索はどこで使われる？", "奥まで調べて戻る場面を確認しましょう。",
    "深さ優先探索は、英語のDepth-First Searchを略してDFSとも呼びます。一つの選択を先へ試し、続けられなければ戻る場面で使われます。",
    "TEXT", { listItems: ["迷路で一つの道を進み、行き止まりなら戻る", "フォルダの中のフォルダを順に調べる", "つながった場所を漏れなく列挙する", "後でサイクル検出や順序付けへ発展させる"] },
    "このコースでは、まず到達できる場所の訪問順に集中するよ。", MissionActivityType.VIEW, "ORIENTATION"),
  a("scope", "BFS・DFS・ダイクストラの違い", "DFSで扱う範囲を確認しましょう。",
    "BFSは開始地点に近い場所から調べ、少ない辺数を求めるのが得意です。DFSは一つの道を奥へ進み、戻りながら到達できる範囲を調べます。ダイクストラ法は料金や時間の合計が小さい経路を探します。DFSの訪問順は隣の並び方で変わり、最短距離は保証しません。",
    "TEXT", { comparison: { headers: ["方法", "調べ方", "得意なこと"], rows: [{ cells: ["BFS", "近い場所から", "少ない辺数"] }, { cells: ["DFS", "一つの道を奥へ", "到達範囲・構造"] }, { cells: ["ダイクストラ", "合計コストが小さい順", "重み付き最短路"] }] } },
    "今回はDFSの進む順番と戻る動きだけを学ぶよ。", MissionActivityType.VIEW, "ORIENTATION"),
  a("roadmap", "図から再帰のPython関数へ", "一つずつできることを増やしましょう。",
    "隣を選ぶ規則、行き止まりから戻る動き、再帰呼び出し、循環を止める記録、訪問順の保存を順に学びます。",
    "LEARNING_ROADMAP", { roadmapSteps: ["DFSの目的を知る", "一つの道を奥へ進む", "行き止まりで戻る", "再帰呼び出しを読む", "一度だけ訪れる", "訪問順を記録する", "コードを組み立てる", "自分で関数を完成させる"], emphasis: "ゴール：開始地点から届く場所をDFSで訪れた順に返す" },
    "新しい言葉は、図の動きが分かってからコードへつなげるよ。", MissionActivityType.VIEW, "ORIENTATION"),
], ["DFSの目的", "DFSの利用場面", "BFSとの違い", "学習順"]);

const depth = m("depth", "最初の未発見の隣へ、奥まで進もう", "隣接リストの左から、最初の未発見の隣を選んで進みます。", [
  a("bridge", "BFSと同じ図を、違う順番で調べる", "つながり一覧と今回の規則を確認しましょう。",
    "グラフの読み方はBFSと同じです。違うのは次に調べる場所です。DFSでは現在地のつながり一覧を左から見て、最初の未発見の隣が見つかったら、他の隣を後に残してその場所へ進みます。",
    "GRAPH_TRACE", graph([{ currentNode: "A", queue: [], discoveredNodes: ["A"], processedNodes: [], message: "Aのつながり一覧はB、Cです。DFSは最初の未発見Bへ進みます。" }], { showQueue: false }),
    "図の近さではなく、現在地の一覧を左から見よう。"),
  choice("first-neighbor", "Aの次に進む場所は？", "Aのつながり一覧はB、Cで、どちらも未発見です。DFSが最初に進む場所はどこですか？", ["B", "C", "BとCを同時に調べる"], 0,
    "一覧を左から見て、最初の未発見Bへ進みます。CはAへ戻ってから調べます。", "現在地Aの一覧を左から一つずつ確認しましょう。",
    graph([{ currentNode: "A", inspectingNode: "B", queue: [], discoveredNodes: ["A"], processedNodes: [], activeEdge: { from: "A", to: "B" }, message: "Aで最初の未発見の隣を確認しています。" }], { showQueue: false })),
  a("path", "選んだ先でも、同じ規則を繰り返す", "AからBへ進んだ後を追いましょう。",
    "Bへ着いたら、Aで残したCより先にBの隣を調べます。Bの一覧A、D、EのうちAは発見済みなので、最初の未発見Dへ進みます。Dでは同じ規則でFへ進みます。",
    "GRAPH_TRACE", graph([
      { currentNode: "A", inspectingNode: "B", queue: [], discoveredNodes: ["A"], processedNodes: [], activeEdge: { from: "A", to: "B" }, message: "Aから最初の未発見Bへ進みます。", nextLabel: "Bの隣を見る" },
      { currentNode: "B", inspectingNode: "D", queue: [], discoveredNodes: ["A", "B"], processedNodes: [], activeEdge: { from: "B", to: "D" }, message: "BではAを飛ばし、最初の未発見Dへ進みます。", nextLabel: "Dの隣を見る" },
      { currentNode: "D", inspectingNode: "F", queue: [], discoveredNodes: ["A", "B", "D"], processedNodes: [], activeEdge: { from: "D", to: "F" }, message: "DではBを飛ばし、未発見Fへ進みます。" },
    ], { showQueue: false }),
    "Aの残りのCより、今いるBやDの先を優先するのが深さ優先だよ。"),
  choice("after-b", "Bから次に進む場所は？", "AとBは発見済みです。Bのつながり一覧はA、D、Eです。次に進む場所は？", ["Aへ戻る", "Dへ進む", "Aへ戻ってCへ進む"], 1,
    "発見済みAを飛ばし、左から最初の未発見Dへ進みます。", "Bの一覧A、D、Eを左から見て、未発見か確認しましょう。"),
  a("rule", "奥へ進む規則を言葉でまとめよう", "ここまでの一手を整理しましょう。",
    "現在地のつながり一覧を左から見ます。発見済みの場所は飛ばします。最初の未発見の隣が見つかったら、現在地の残りを後にしてその隣へ進み、同じ規則を繰り返します。未発見の隣がない場合にどうするかは、次のMissionで学びます。",
    "TEXT", { steps: ["現在地の隣を左から見る", "発見済みなら飛ばす", "最初の未発見の隣へ進む", "進んだ先で同じ規則を繰り返す"] },
    "今は進む規則だけ。戻る方法は次に図で確かめよう。"),
], ["深さ優先の選択", "隣接リスト順", "発見済みを飛ばす", "奥へ進む規則"]);

const recursion = m("recursion", "行き止まりで一つ前へ戻ろう", "戻り先を残す呼び出しの積み重なりと、再帰を学びます。", [
  a("dead-end", "Fで未発見の隣がなくなった", "進めないときに必要な情報を考えましょう。",
    "A→B→D→Fと進みました。Fの隣Dは発見済みで、ほかに進めません。しかし探索全体は終わりではなく、DやBにまだ確認途中の隣があります。Fへ来るまでのA、B、Dを戻り先として残す必要があります。",
    "GRAPH_TRACE", graph([{ currentNode: "F", queue: ["A", "B", "D", "F"], discoveredNodes: ["A", "B", "D", "F"], processedNodes: [], message: "Fから進めないので、右から一つ戻ってDの続きへ移ります。" }]),
    "右端が現在地F、その左のDが一つ前の戻り先だよ。"),
  a("call-stack", "調べる途中の場所を積み重ねよう", "進むときと戻るときの変化を追いましょう。",
    "Aを調べている途中でBへ進むと、Aの続きは待ったままです。同様にBの途中でD、Dの途中でFを調べます。Fが終わるとFの呼び出しだけがなくなりDへ戻ります。Dも終わればBへ戻ります。",
    "GRAPH_TRACE", graph([
      { currentNode: "A", queue: ["A"], discoveredNodes: ["A"], processedNodes: [], message: "Aを調べ始めました。", nextLabel: "Bを呼び出す" },
      { currentNode: "B", queue: ["A", "B"], discoveredNodes: ["A", "B"], processedNodes: [], activeEdge: { from: "A", to: "B" }, message: "Aの途中でBを調べ始めました。", nextLabel: "Dを呼び出す" },
      { currentNode: "D", queue: ["A", "B", "D"], discoveredNodes: ["A", "B", "D"], processedNodes: [], activeEdge: { from: "B", to: "D" }, message: "Bの途中でDを調べ始めました。", nextLabel: "Fを呼び出す" },
      { currentNode: "F", queue: ["A", "B", "D", "F"], discoveredNodes: ["A", "B", "D", "F"], processedNodes: [], activeEdge: { from: "D", to: "F" }, message: "Dの途中でFを調べ始めました。", nextLabel: "Fから戻る" },
      { currentNode: "D", queue: ["A", "B", "D"], discoveredNodes: ["A", "B", "D", "F"], processedNodes: ["F"], message: "Fが終わり、Dの残りの隣を確認します。", nextLabel: "Dから戻る" },
      { currentNode: "B", queue: ["A", "B"], discoveredNodes: ["A", "B", "D", "F"], processedNodes: ["D", "F"], message: "Dが終わり、Bの次の未発見の隣を探します。" },
    ]),
    "進むと右へ積み、終わると右端を一つ外して戻るよ。"),
  choice("return-from-f", "Fが終わったら、どこへ戻る？", "呼び出しの積み重なりはA、B、D、Fの順です。Fに未発見の隣がありません。次の現在地は？", ["A", "B", "D"], 2,
    "右端Fの呼び出しが終わると、一つ前のDへ戻って残りの隣を確認します。", "Fのすぐ左にある、Fを呼び出した場所を確認しましょう。",
    graph([{ currentNode: "F", queue: ["A", "B", "D", "F"], discoveredNodes: ["A", "B", "D", "F"], processedNodes: [], message: "Fの呼び出しが終わる直前です。" }])),
  a("recursive-name", "同じ調べ方を、進んだ先でも呼び出す", "再帰という言葉とコードを結びつけましょう。",
    "場所を調べる処理をvisitとします。visit(A)の途中でBへ進むときvisit(B)を呼び、visit(B)の途中でvisit(D)を呼びます。このように、関数の中から同じ関数を呼ぶことを再帰と呼びます。呼び出した処理が終わると、呼び出した行の次へ戻ります。",
    "TEXT", { code: code("def visit(node):", "    # nodeの隣を調べる", "    visit(neighbor)"), conclusion: "visit(neighbor)が終わると、現在のnodeのforの続きへ戻ります。" },
    "再帰は、進んだ先でも同じ規則を使い、終われば元の続きへ戻る書き方だよ。"),
  mapping("recursion-code", "進む呼び出しと、戻る位置を対応させよう",
    "neighborが未発見ならvisit(neighbor)でその場所を先に最後まで調べます。その呼び出しが終わった後で、元のforが次の隣へ進みます。",
    code("def visit(node):", "    for neighbor in graph.get(node, []):", "        if neighbor not in visited:", "            visit(neighbor)"), [
      { id: "current", label: "現在地の隣を順に見る", lines: [1, 2], role: "今のnodeの続き位置を残す", state: "forの途中で次の場所へ進む" },
      { id: "deeper", label: "未発見の隣を先に調べる", lines: [3, 4], role: "同じvisitを隣に対して呼ぶ", state: "呼び出しが終わるまで元のforは待つ" },
    ]),
  choice("after-d", "Dが終わってBへ戻った後は？", "Bのつながり一覧はA、D、Eです。AとDは発見済みで、Dの呼び出しが終わってBへ戻りました。次は？", ["Eへ進む", "Aへ戻る", "探索を終了する"], 0,
    "Bのforの続きでEを確認し、Eは未発見なのでvisit(E)を呼びます。", "Bの一覧でDの次に残っている場所を確認しましょう。"),
], ["行き止まりから戻る", "呼び出しの積み重なり", "再帰", "元のforの続き"]);

const visitedMission = m("visited", "発見済みを記録して、循環を止めよう", "到着直後に集合へ記録し、同じ場所へ進まないようにします。", [
  a("cycle", "AとBを行き来し続けないために", "二つの場所だけの循環を確認しましょう。",
    "AからBへ進み、Bの隣Aを未発見だと思うと、再びAへ進みます。そのAからまたBへ進み、呼び出しが終わりません。場所へ初めて着いた直後に発見済みとして記録し、記録済みの隣へは進みません。",
    "GRAPH_TRACE", twoNodeGraph([
      { currentNode: "A", inspectingNode: "B", queue: ["A"], discoveredNodes: ["A"], processedNodes: [], activeEdge: { from: "A", to: "B" }, message: "Aは到着直後に発見済みです。未発見Bへ進みます。", nextLabel: "BからAを見る" },
      { currentNode: "B", inspectingNode: "A", queue: ["A", "B"], discoveredNodes: ["A", "B"], processedNodes: [], activeEdge: { from: "B", to: "A" }, message: "BからAが見えますが、Aは発見済みなので呼び出しません。" },
    ]),
    "次へ進む前に記録すれば、戻る線で同じ場所を呼び出さないよ。"),
  choice("mark-time", "Aを発見済みにするタイミングは？", "AからDFSを開始します。A→B→Aの呼び出しを防ぐには、いつAを発見済みにしますか？", ["visit(A)を始めた直後", "Aの隣をすべて調べ終えた後", "DFS全体が終わった後"], 0,
    "visit(A)を始めた直後に記録すれば、BからAを見たときに発見済みだと判断できます。", "Bへ進む前にAが記録済みになっている必要があります。",
    twoNodeGraph([{ currentNode: "A", queue: ["A"], discoveredNodes: ["A"], processedNodes: [], message: "Aを調べ始めた直後の状態です。" }])),
  mapping("visited-code", "集合を、発見済みの印として使おう",
    "visitedは発見済みの場所を持つ集合です。visitを始めた直後にnodeを追加し、neighborが集合にない場合だけ再帰します。集合は順序ではなく、重複防止に使います。",
    code("visited = set()", "def visit(node):", "    visited.add(node)", "    for neighbor in graph.get(node, []):", "        if neighbor not in visited:", "            visit(neighbor)"), [
      { id: "prepare", label: "空の発見済み集合を準備", lines: [1], role: "これから訪れる場所を記録する", state: "visitedは空" },
      { id: "mark", label: "到着直後に現在地を記録", lines: [2, 3], role: "戻る線から再訪しない", state: "nodeが発見済みになる" },
      { id: "guard", label: "未発見の隣だけ呼び出す", lines: [4, 5, 6], role: "循環と重複を止める", state: "visitedにないneighborだけ進む" },
    ]),
  build("visited-build", "記録してから、未発見の隣へ進もう",
    "visit(node)を始めた直後です。nodeを記録し、隣を左から見て、未発見の場合だけ再帰します。",
    "def visit(node):",
    [{ label: "現在地を発見済みにする", indent: 1 }, { label: "現在地の隣を順に見る", indent: 1 }, { label: "未発見なら処理する", indent: 2 }, { label: "隣を再帰的に調べる", indent: 3 }],
    [["mark-late", "visited.add(neighbor)"], ["mark", "visited.add(node)"], ["loop", "for neighbor in graph.get(node, []):"], ["wrong-condition", "if neighbor in visited:"], ["condition", "if neighbor not in visited:"], ["wrong-call", "visit(node)"], ["call", "visit(neighbor)"]],
    ["mark", "loop", "condition", "call"],
    "到着直後に記録し、未発見の隣だけを呼び出すため、循環があっても各場所を一度だけ訪れます。",
    "記録するのはnode、条件はnot in、呼び出すのはneighborです。"),
  choice("unreachable", "開始地点から届かない場所は訪れる？", "A-B-CのまとまりとX-Yのまとまりの間に線がありません。visit(A)だけを呼んだ結果にXとYは入りますか？", ["入る。graphの全キーを見るため", "入らない。Aから再帰で届かないため", "Xだけ最後に入る"], 1,
    "visitは現在地の隣からだけ広がるため、Aから届かないXとYは訪れません。", "最初に呼び出すのはvisit(A)だけです。"),
], ["集合による発見済み", "到着直後の記録", "循環の停止", "到達できる範囲"]);

const orderMission = m("order", "初めて着いた順を、リストへ残そう", "集合とは別に、DFSの訪問順をリストへ記録します。", [
  a("roles", "集合とリストは、役割が違う", "結果として順序を返す方法を確認しましょう。",
    "visitedは同じ場所へ進まないための集合で、並び順を答えとして使いません。orderは初めて着いた順を残すリストです。visit(node)を始めた直後、visitedへnodeを加え、同じタイミングでorderの末尾へnodeを加えます。",
    "TEXT", { comparison: { headers: ["入れ物", "役割", "使う操作"], rows: [{ cells: ["visited（集合）", "発見済みか判断", "add"] }, { cells: ["order（リスト）", "訪問順を保存", "append"] }] } },
    "重複防止と順序保存を、一つの入れ物に任せないよ。"),
  mapping("order-code", "初めて着いた直後に、順序へ追加しよう",
    "order.append(node)を再帰呼び出しより前に実行します。これにより、A→B→Dと初めて着いた順に記録されます。すべての隣を調べた後に追加すると、戻った順になってしまいます。",
    code("def visit(node):", "    visited.add(node)", "    order.append(node)", "    for neighbor in graph.get(node, []):", "        if neighbor not in visited:", "            visit(neighbor)"), [
      { id: "arrival", label: "初めて着いた場所を記録", lines: [1, 2, 3], role: "重複防止と訪問順を同時に更新", state: "nodeがorderの末尾へ入る" },
      { id: "deeper", label: "記録後に隣へ進む", lines: [4, 5, 6], role: "最初の未発見の隣を先に調べる", state: "進んだ先も到着直後にorderへ入る" },
    ]),
  choice("trace-order", "Aからの訪問順は？", "各つながり一覧を左から見ます。A:[B,C]、B:[A,D,E]、D:[B,F]、F:[D,E]、E:[B,C,F]、C:[A,E]です。", ["A、B、C、D、E、F", "A、B、D、F、E、C", "A、C、E、F、D、B"], 1,
    "A→B→D→F→E→Cと奥へ進みます。Cで行き止まりになった後は、戻っても全て発見済みなので順序への追加はありません。", "Aから最初のBへ進み、各場所でも最初の未発見の隣を選び続けましょう。",
    graph([
      { currentNode: "A", queue: ["A"], discoveredNodes: ["A"], processedNodes: [], message: "orderはAです。", nextLabel: "Bへ進む" },
      { currentNode: "B", queue: ["A", "B"], discoveredNodes: ["A", "B"], processedNodes: [], message: "orderはA、Bです。", nextLabel: "Dへ進む" },
      { currentNode: "D", queue: ["A", "B", "D"], discoveredNodes: ["A", "B", "D"], processedNodes: [], message: "orderはA、B、Dです。", nextLabel: "Fへ進む" },
      { currentNode: "F", queue: ["A", "B", "D", "F"], discoveredNodes: ["A", "B", "D", "F"], processedNodes: [], message: "orderはA、B、D、Fです。", nextLabel: "Eへ進む" },
      { currentNode: "E", queue: ["A", "B", "D", "F", "E"], discoveredNodes: ["A", "B", "D", "E", "F"], processedNodes: [], message: "orderはA、B、D、F、Eです。", nextLabel: "Cへ進む" },
      { currentNode: "C", queue: ["A", "B", "D", "F", "E", "C"], discoveredNodes: ["A", "B", "C", "D", "E", "F"], processedNodes: [], message: "orderはA、B、D、F、E、Cです。" },
    ], { finalMessage: "初めて着いた順はA、B、D、F、E、Cです。" })),
  build("order-build", "到着時の二つの記録を完成させよう",
    "visit(node)を始めた直後に、重複防止の集合と訪問順のリストを更新します。",
    "def visit(node):",
    [{ label: "現在地を発見済みにする", indent: 1 }, { label: "現在地を訪問順の末尾へ追加", indent: 1 }],
    [["mark", "visited.add(node)"], ["append", "order.append(node)"], ["wrong-mark", "visited.add(neighbor)"], ["wrong-append", "order.append(neighbor)"]],
    ["mark", "append"],
    "現在地を重複防止と訪問順の両方へ、初めて着いた直後に記録できました。",
    "どちらも今到着したnodeを記録します。"),
], ["集合とリストの役割", "行きがけの記録", "決定的なDFS順"]);

const synthesis = m("assemble", "DFSのコードを組み立てよう", "進む・戻る・重複防止・訪問順を一つの関数へまとめます。", [
  mapping("full-code", "図の動きと、関数全体を対応させよう",
    "外側のdfs_orderが記録を準備し、内側のvisitが一つの場所を調べます。visit(neighbor)が終わると元のforへ戻り、最後にvisit(start)から得たorderを返します。",
    depthFirstSearchAnswerCode, [
      { id: "prepare", label: "二つの記録を準備", lines: [1, 2, 3], role: "重複防止と訪問順を分ける", state: "visitedとorderは空" },
      { id: "arrive", label: "現在地へ初めて到着", lines: [4, 5, 6], role: "到着直後に集合と順序へ記録", state: "nodeは発見済みでorder末尾にある" },
      { id: "deeper", label: "未発見の隣を先に調べる", lines: [7, 8, 9], role: "同じvisitを呼び、終わればforへ戻る", state: "一つの道を奥へ進む" },
      { id: "start", label: "開始して結果を返す", lines: [10, 11], role: "startから届く範囲を調べる", state: "orderが完成する" },
    ]),
  build("full-build", "DFS関数を完成させよう",
    "visitedとorderの準備は済んでいます。内側のvisitと、開始・返却を既習コードで組み立てます。",
    code("def dfs_order(graph, start):", "    visited = set()", "    order = []"),
    [
      { label: "一つの場所を調べる関数を定義", indent: 1 },
      { label: "現在地を発見済みにする", indent: 2 },
      { label: "現在地を訪問順へ追加", indent: 2 },
      { label: "現在地の隣を順に見る", indent: 2 },
      { label: "未発見なら処理する", indent: 3 },
      { label: "隣を再帰的に調べる", indent: 4 },
      { label: "開始地点から探索を始める", indent: 1 },
      { label: "完成した訪問順を返す", indent: 1 },
    ],
    [
      ["define", "def visit(node):"], ["mark", "visited.add(node)"], ["append", "order.append(node)"],
      ["loop", "for neighbor in graph.get(node, []):"], ["condition", "if neighbor not in visited:"], ["call", "visit(neighbor)"],
      ["start", "visit(start)"], ["return", "return order"], ["wrong-condition", "if neighbor in visited:"], ["wrong-call", "visit(node)"],
    ],
    ["define", "mark", "append", "loop", "condition", "call", "start", "return"],
    "奥へ進み、行き止まりで戻りながら、各場所を一度だけ訪問順へ追加する関数になりました。",
    "nodeを到着時に記録し、未発見のneighborへvisitを呼ぶ順を確認しましょう。"),
  choice("transfer", "別のグラフでも訪問順を追える？", "S:[P,Q]、P:[S,R]、Q:[S,R,T]、R:[P,Q]、T:[Q]を左から調べます。SからのDFS順は？", ["S、P、R、Q、T", "S、P、Q、R、T", "S、Q、T、R、P"], 0,
    "S→P→Rへ進み、Rから未発見Qへ進み、QからTへ進むため、S、P、R、Q、Tです。", "今いる場所の最初の未発見の隣を選び続けましょう。"),
], ["DFSコードの統合", "再帰と発見済みの役割", "別データへの適用"]);

synthesis.activities[1].content.learningRole = "SYNTHESIS";

const exam = m("course-mission", "Course Mission：深さ優先探索を自分で実装しよう", "再帰と発見済みの記録を使い、到達できる場所の訪問順を返します。", [
  a("implementation", "深さ優先探索で訪問順を求めよう",
    "dfs_order(graph, start)を完成させ、startから届く場所をDFSで初めて訪れた順にリストで返しましょう。",
    "graphは場所名をキー、直接つながる場所名のリストを値とする辞書です。各リストは左から確認します。未発見の隣があれば、その場所を先に最後まで調べてから元の場所の続きへ戻ってください。startを結果の先頭に含め、届かない場所は含めません。最短距離を求める課題ではありません。関数名と引数名を保ち、passを置き換えてください。",
    "CODE_EDITOR", {
      evaluationMode: "TEST_CASES",
      functionName: "dfs_order",
      answerCode: depthFirstSearchAnswerCode,
      starterCode: code("def dfs_order(graph, start):", "    # startから届く場所をDFSで訪れた順に返してください", "    pass"),
      forbiddenCode: [
        { snippet: "networkx", label: "完成済みのグラフ探索ライブラリではなく、再帰するDFSを書きましょう。" },
        { snippet: "depth_first", label: "完成済みのDFS関数ではなく、学んだvisit関数を使いましょう。" },
      ],
      testCases: [
        { id: "line", label: "一本道：奥へ順に進む", args: [{ A: ["B"], B: ["A", "C"], C: ["B"] }, "A"], expected: ["A", "B", "C"] },
        { id: "branch", label: "分岐：一つの枝を先に終える", args: [{ A: ["B", "C"], B: ["A", "D"], C: ["A", "E"], D: ["B"], E: ["C"] }, "A"], expected: ["A", "B", "D", "C", "E"] },
        { id: "cycle", label: "循環：同じ場所を繰り返さない", args: [{ A: ["B", "C"], B: ["A", "C"], C: ["A", "B"] }, "A"], expected: ["A", "B", "C"] },
        { id: "merge", label: "合流：発見済みを飛ばす", args: [{ A: ["B", "C"], B: ["A", "D"], C: ["A", "D", "E"], D: ["B", "C"], E: ["C"] }, "A"], expected: ["A", "B", "D", "C", "E"] },
        { id: "disconnected", label: "非連結：届かない場所を含めない", args: [{ A: ["B"], B: ["A"], X: ["Y"], Y: ["X"] }, "A"], expected: ["A", "B"] },
        { id: "isolated", label: "孤立：開始地点だけを返す", args: [{ A: [] }, "A"], expected: ["A"] },
        { id: "labels", label: "文字列ラベル：名前が長くても同じ", args: [{ home: ["park", "shop"], park: ["home", "station"], shop: ["home"], station: ["park"] }, "home"], expected: ["home", "park", "station", "shop"] },
      ],
      hints: [
        { id: "prepare", title: "二つの記録を準備する", body: "visitedは重複防止の集合、orderは初めて訪れた順を残すリストです。", code: code("visited = set()", "order = []") },
        { id: "arrive", title: "到着直後に記録する", body: "visit(node)を始めた直後に、nodeをvisitedとorderへ入れます。", code: code("def visit(node):", "    visited.add(node)", "    order.append(node)") },
        { id: "deeper", title: "未発見の隣を先に調べる", body: "隣を左から見て、未発見ならvisit(neighbor)を呼びます。呼び出しが終わるとforの続きへ戻ります。", code: code("for neighbor in graph.get(node, []):", "    if neighbor not in visited:", "        visit(neighbor)") },
        { id: "finish", title: "開始して順序を返す", body: "内側のvisitを定義した後、visit(start)を1回呼び、完成したorderを返します。", code: code("visit(start)", "return order") },
      ],
      courseResult: {
        masteryTitle: "深さ優先探索をマスター",
        description: "深さ優先探索コースを修了しました。",
        learningOutcome: "一つの道を奥へ進み、行き止まりで戻りながら、循環があっても到達できる場所を一度ずつ訪れられるようになりました。",
      },
      correctFeedback: "7つのテストを通過しました。未発見の隣を再帰的に先まで調べ、戻りながら残りの道も漏れなく訪問できました。",
      incorrectFeedback: "未通過のケースで、到着直後の記録、未発見判定、再帰呼び出し、visit(start)、orderを返す位置を見直しましょう。",
    },
    "未通過のケースは、現在の呼び出しと一つ前の戻り先を図に書いて確かめよう。",
    MissionActivityType.TRY_CODE,
    "COURSE_EXAM"),
], ["深さ優先探索の自力実装", "テスト結果を使った修正"], MissionType.COURSE_EXAM);

exam.activities[0].actionLabel = "提出する";

export const depthFirstSearchCourseSeed: CourseSeed = {
  id: "course-algorithm-depth-first-search-v1",
  title: "深さ優先探索（DFS）",
  description: "一つの道を進めるところまで進み、行き止まりで戻りながらつながりを調べる深さ優先探索を学びます。図と呼び出しの積み重なりを追い、循環を防ぎながら訪問順を記録し、最後は再帰するPython関数を完成させます。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: true,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.GRAPH, CourseCategoryType.SEARCH],
  missions: [orientation, depth, recursion, visitedMission, orderMission, synthesis, exam]
    .map((mission, index) => ({ ...mission, order: index + 1 })),
};
