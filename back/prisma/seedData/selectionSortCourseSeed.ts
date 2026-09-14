/** 選択ソート。概念順・標準コードはdocs/course-designsの設計票を参照。 */
import { CourseCategoryType, CourseDifficulty, MissionActivityType, MissionType } from "@prisma/client";
import type { ActivitySeed, CourseSeed, MissionSeed } from "./learningSeedTypes";
import { estimateMissionMinutes, expectedMissionRewardExp } from "./learningSeedPolicy";

const code = (...lines: string[]) => lines.join("\n");
export const selectionSortAnswerCode = code(
  "def selection_sort(numbers):",
  "    n = len(numbers)",
  "    for i in range(n - 1):",
  "        min_index = i",
  "        for j in range(i + 1, n):",
  "            if numbers[j] < numbers[min_index]:",
  "                min_index = j",
  "        numbers[i], numbers[min_index] = numbers[min_index], numbers[i]",
  "    return numbers",
);
const swap = "numbers[i], numbers[min_index] = numbers[min_index], numbers[i]";
const condition = "if numbers[j] < numbers[min_index]:";
const a = (id: string, title: string, instruction: string, body: string,
  rendererKey: ActivitySeed["content"]["rendererKey"] = "TEXT",
  data: Record<string, unknown> = {}, mentorMessage = "", type: MissionActivityType = MissionActivityType.VIEW,
  learningRole: ActivitySeed["content"]["learningRole"] = "EXPLANATION",
): ActivitySeed => ({
  id: `selection-${id}`, title, instruction, mentorMessage, type, actionLabel: type === MissionActivityType.VIEW ? "次へ" : "答えを確認する", order: 0,
  content: { rendererKey, learningRole, feedbackPolicy: type === MissionActivityType.VIEW ? { mode: "NONE" } : { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 }, data: { body, ...data } },
});
const choice = (id: string, title: string, body: string, options: [string, string, string], correct: number, feedback: string, hint: string) =>
  a(id, title, "現在の状態から、当てはまるものを1つ選びましょう。", body, "SINGLE_CHOICE", {
    question: title, choices: options.map((label, index) => ({ id: `option-${index}`, label, isCorrect: index === correct })),
    correctFeedback: feedback, incorrectFeedback: hint,
  }, "データと、どこまで調べたかを確かめよう。", MissionActivityType.CHOICE, "MISSION_CHECK");
const build = (id: string, title: string, body: string, prefix: string, slots: { label: string; indent: number }[],
  blocks: [string, string][], answers: string[], feedback: string, hint: string) =>
  a(id, title, "候補をクリックして空欄へ置きましょう。置いたブロックは取り消して選び直せます。", body, "CODE_FILL", {
    question: title, codePreviewPrefix: prefix, builderSlots: slots, codeBlocks: blocks.map(([id, label]) => ({ id, label })),
    builderInstruction: "空欄を上から順に埋めてください。不要な候補もあります。", correctAnswers: answers,
    executionResult: feedback, correctFeedback: feedback, incorrectFeedback: hint,
    previewWaitingMessage: "コードと役割を見比べてから、答えを確認しましょう。",
  }, "何のための処理かを、空欄の説明と照らし合わせよう。", MissionActivityType.SELECT_FILL, "GUIDED_PRACTICE");
const mapping = (id: string, title: string, body: string, source: string, mappings: { id: string; label: string; lines: number[]; role: string; state: string }[]) =>
  a(id, title, "役割カードを選び、色がつくコード行と状態変化を見比べましょう。", body, "CODE_STATE_MAPPING", { code: source, mappings }, "コードの名前を、覚えたい場所の役割とつなげよう。", MissionActivityType.VIEW, "CODE_MAPPING");
const indices = (id: string, title: string, body: string, questions: Record<string, unknown>[], feedback: string, hint: string) =>
  a(id, title, "配列のカードを1つ選び、答えを確認しましょう。問題は1問ずつ進みます。", body, "INDEX_SELECT", {
    indexSelectionQuestions: questions, correctFeedback: feedback, incorrectFeedback: hint,
  }, "カードの値と、その下の位置番号を区別しよう。", MissionActivityType.CHOICE, "INDEPENDENT_PRACTICE");
const m = (id: string, title: string, description: string, activities: ActivitySeed[], learnedItems: string[], type: MissionType = MissionType.MAIN): MissionSeed => {
  const result: MissionSeed = {
    id: `selection-${id}`, title, description, activities: activities.map((activity, index) => ({ ...activity, order: index + 1 })),
    difficulty: CourseDifficulty.EASY, goalImg: "/images/missions/selection-sort.svg", estimatedMinutes: 0, order: 0, type,
    isRequiredForCourseCompletion: true, parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 0, learnedItems, isPublished: true,
  };
  result.estimatedMinutes = estimateMissionMinutes(result);
  result.rewardExp = expectedMissionRewardExp(result);
  return result;
};
const pointer = (index: number, label: string) => ({ index, label });

const orientation = m("orientation", "小さい順に並べる道筋を知ろう", "選択ソートで何を解決し、どんな順番で学ぶかを確認します。", [
  a("goal", "値を残したまま、小さい順に並べよう", "並べ替える前と後で、使っている値が同じか見てみましょう。",
    "商品の価格が [7, 4, 6, 2] と並んでいます。小さい順なら [2, 4, 6, 7] になり、安いものから見られます。この小さい順を「昇順」、順番をそろえる処理を「ソート」と呼びます。値を消したり増やしたりせず、置き場所だけを変えます。",
    "TEXT", { comparison: { headers: ["並べ替え前", "目指す並び"], rows: [{ cells: ["7 → 4 → 6 → 2", "2 → 4 → 6 → 7"] }] }, conclusion: "このコースでは、残りの中の最小値を選んで左から順に置く「選択ソート」を学びます。" }, "並べ替えるのは場所。値は全部残すよ。"),
  a("roadmap", "小さな処理から、関数の完成へ", "1つずつできることを増やしていきましょう。", "最小値を見つける方法と、見つけた値を移動する方法を分けて学びます。",
    "LEARNING_ROADMAP", { roadmapSteps: ["目的を知る", "最小値の候補を探す", "2つの値を交換する", "残りで繰り返す", "コードを組み立てる", "自分で関数を完成させる"], emphasis: "図で次の変化を考え、Pythonとつなげます。" }, "まずは、一つの小さな処理が分かれば大丈夫。"),
  a("python-ready", "使うPythonと、これから学ぶこと", "知っている構文を確認し、完成時の姿をつかみましょう。",
    "変数、整数のリスト、if、for、len、range、簡単な関数を一度学んだことがあれば取り組めます。位置番号やrangeの範囲も具体例で確認します。最小値の位置の記録、値の交換、繰り返す範囲の決め方を、このコースで学びます。",
    "TEXT", { conclusion: "最後には selection_sort(numbers) という関数を完成させます。numbersは受け取る整数リストの名前です。たとえば [3, 1, 2] を渡すと [1, 2, 3] を返します。" }, "バブルソートを知らなくても、ここから始められるよ。"),
], ["選択ソートの目的", "必要なPython知識", "実装までの学習順"]);

const candidate = m("find-candidate", "最小値の候補を、一つずつ調べよう", "見た範囲の最小値を記録する方法と、その位置を扱うPythonを学びます。", [
  a("minimum-need", "左端には何を置けばよい？", "[7, 4, 6, 2] の最初の置き場所を考えましょう。",
    "小さい順にするには、左端に全体の最小値を置けばよさそうです。ただし、途中で小さい値を見つけても、もっと右にさらに小さい値があるかもしれません。そこで左から一つずつ、最後まで調べます。まずは値を動かさず、最小値のある場所を覚える方法を考えましょう。",
    "TEXT", {}, "小さい値が見つかっても、まだ見ていない値があるね。"),
  a("candidate-rule", "見た中で最小の場所を覚えよう", "まず先頭を仮の最小とし、新しく見る値と比べます。",
    "[7, 4, 6, 2] で、先頭の7を仮の最小にします。次の4は7より小さいので、覚える場所を4の場所へ変えます。次の6は4より小さくないため、そのままです。この「見た範囲で最小の値のある場所」を、最小値の候補と呼びます。同じ値のときも候補は変えません。",
    "TEXT", { conclusion: "候補を覚え直しても、リストの並びは変えません。最後まで調べたとき、候補が全体の最小値の場所になります。" }, "候補は、ここまでに見た中で一番小さい値の場所だよ。"),
  a("candidate-trace", "候補だけが動く様子を追おう", "「比較する」「候補を更新する」を1段階ずつ確認しましょう。",
    "リストは [7, 4, 6, 2]。カードの下の index は位置番号で、左端を0と数えます。値が小さければ候補の位置を更新し、小さくなければ保ちます。走査中はカード自体を動かしません。",
    "ARRAY_TRACE", { values: [7, 4, 6, 2], intervalMs: 2200, steps: [
      { pointers: [pointer(0, "最小候補")], message: "先頭の位置0を候補として覚えます。まだ7しか見ていません。", nextLabel: "次の値と比べる" },
      { comparingIndices: [0, 1], pointers: [pointer(0, "最小候補")], message: "位置1の4と、候補の位置0の7を比較します。4の方が小さいです。", nextLabel: "候補を更新する" },
      { pointers: [pointer(1, "最小候補")], message: "候補を位置1へ更新しました。リストは [7, 4, 6, 2] のままです。", nextLabel: "次の値と比べる" },
      { comparingIndices: [1, 2], pointers: [pointer(1, "最小候補")], message: "位置2の6は、候補の4より小さくありません。候補は位置1のままです。", nextLabel: "次の値と比べる" },
      { comparingIndices: [1, 3], pointers: [pointer(1, "最小候補")], message: "位置3の2は、候補の4より小さいです。", nextLabel: "候補を更新する" },
      { pointers: [pointer(3, "最小候補")], message: "候補を位置3へ更新しました。最後まで見たので、ここにある2が全体の最小値です。" },
    ] }, "覚える場所が動いても、カードはまだ動かないよ。"),
  indices("candidate-check", "途中の候補を選ぼう", "見た範囲だけで候補を決めます。まだ見ていない値は候補にしません。同じ値なら、先に覚えた場所を保ちます。indexは0始まりの位置番号です。", [
    { id: "partial", prompt: "[8, 5, 7, 1] の位置0〜2まで調べました。位置3の1はまだ調べていません。今の候補の位置は？", values: [8, 5, 7, 1], correctIndex: 1, correctFeedback: "見た位置0〜2では5が最小なので位置1です。位置3はまだ候補にしません。", incorrectFeedback: "まだ調べていない位置3を除き、位置0〜2だけで考えましょう。" },
    { id: "equal", prompt: "[6, 3, 3, 1] の位置1の3が候補です。次に位置2の3を調べた直後、候補の位置は？ 位置3はまだ調べていません。", values: [6, 3, 3, 1], correctIndex: 1, correctFeedback: "3同士は同値なので、先に覚えた位置1を保ちます。", incorrectFeedback: "候補が変わるのは、調べる値の方が小さい場合です。" },
  ], "候補は見た範囲で決めます。同値では更新しないため、どちらも位置1です。", "問題文の『どこまで調べたか』と、同じ値のときの規則を確認しましょう。"),
  mapping("candidate-code", "値ではなく、位置を変数に記録しよう", "numbersは整数リスト。iは今回確定したい位置、jは今調べる位置、min_indexは最小候補の位置です。この例では i=0、j=1。位置1の4が候補の7より小さいので、候補を位置1にします。", code("numbers = [7, 4, 6, 2]", "i = 0", "min_index = i", "j = 1", condition, "    min_index = j"), [
    { id: "initial", label: "最初の候補を覚える", lines: [3], role: "今回の先頭iを候補にする", state: "min_index=0、候補の値はnumbers[0]の7" },
    { id: "compare", label: "2つの場所の値を比べる", lines: [5], role: "調べる値が候補の値より小さいか判定する", state: "numbers[1]の4とnumbers[0]の7を比べる" },
    { id: "update", label: "小さい値の位置を記録する", lines: [6], role: "候補をjへ更新する", state: "min_indexは0から1へ。4という値を代入するのではない。リストは変わらない" },
  ]),
  build("candidate-build", "候補を更新するコードを埋めよう", "numbers=[9, 6, 8, 2]。min_index=0は候補の位置、j=1は調べる位置です。必要なら候補の位置を覚え直す処理を作ります。", code("numbers = [9, 6, 8, 2]", "min_index = 0", "j = 1"),
    [{ label: "値を比較する条件", indent: 0 }, { label: "候補の位置を更新", indent: 1 }],
    [["update", "min_index = j"], ["greater", "if numbers[j] > numbers[min_index]:"], ["value", "min_index = numbers[j]"], ["condition", condition]], ["condition", "update"],
    "候補は位置1になり、値6の場所を覚えられました。リストはそのままです。", "比べるのは値、覚えるのは位置です。位置を使ってリストの値を読み出します。"),
  mapping("scan-code", "調べる位置を右へ進めよう", "候補の準備と更新はできました。今度は末尾まで比較します。nは要素数、iは今回の先頭、jは調べる位置です。range(開始, 終わり) は終わりの番号を含みません。i=0、n=4ならjは1、2、3。位置4へはアクセスしません。", code("numbers = [7, 4, 6, 2]", "n = len(numbers)", "i = 0", "min_index = i", "for j in range(i + 1, n):", `    ${condition}`, "        min_index = j"), [
    { id: "length", label: "要素数を求める", lines: [2], role: "リストの長さをnに記録する", state: "n=4。有効な位置は0〜3" },
    { id: "scan", label: "候補の右隣から末尾まで調べる", lines: [5], role: "先頭iは候補として見たので、i+1から比べる", state: "jが1→2→3と進み、それぞれの値をその時点の候補と比べる" },
  ]),
  build("scan-build", "途中の範囲から候補探しを始めよう", "numbers=[1, 8, 5, 3]。位置0の1は確定済みです。i=1から右を調べます。nは要素数、min_indexは候補の位置、jは調べる位置です。まず候補を準備し、その右隣から末尾まで見るコードを置きましょう。", code("numbers = [1, 8, 5, 3]", "n = len(numbers)", "i = 1"),
    [{ label: "今回の候補を準備", indent: 0 }, { label: "調べる位置を順に動かす（この下に比較処理が続く）", indent: 0 }],
    [["zero", "min_index = 0"], ["loop", "for j in range(i + 1, n):"], ["last", "for j in range(i + 1, n - 1):"], ["init", "min_index = i"]], ["init", "loop"],
    "候補は位置1から始め、jは2、3を調べます。確定済みの位置0には戻りません。", "先頭iを候補にして、その右隣から最後の有効な位置までを調べます。"),
  choice("candidate-transfer", "最小が最初にあったら、どうなる？", "[2, 7, 5, 9] で先頭の位置0を候補にし、最後まで調べます。交換はまだ行いません。走査を終えた状態は？", ["候補は位置3、リストは [2, 7, 5, 9]", "候補は位置0、リストは [2, 7, 5, 9]", "候補は位置0、リストは [2, 5, 7, 9]"], 1,
    "2より小さい値がないため候補は位置0のままです。候補探しだけではリストは並べ替わりません。", "候補を変える条件が一度でも成立するか、走査中に値を動かすかを考えましょう。"),
], ["最小候補の更新と保持", "値と位置の違い", "走査の範囲"]);

const exchange = m("exchange", "見つけた最小値を、先頭と交換しよう", "値を失わずに入れ替え、今回の先頭を確定する方法を学びます。", [
  a("swap-need", "最小値を見つけた。その次は？", "[7, 4, 6, 2] の値をすべて残して、2を左端へ移しましょう。", "最後まで調べて、最小値は位置3の2だと分かりました。左端の7を2で上書きするだけでは [2, 4, 6, 2] となり、7がなくなります。そこで2を左端へ、元の7を2があった場所へ移す「交換」を行います。途中の4と6は動かしません。", "TEXT", {}, "最小値と元の先頭、その両方を残すための交換だよ。"),
  a("swap-trace", "2つの場所だけを入れ替えよう", "次の操作で、位置0と位置3の値を交換します。", "[7, 4, 6, 2] は全要素の比較を終えています。最小の2は位置3。左端へ置けば、他のどの値も2より小さくないので、位置0はもう動かす必要がありません。これを「確定」と呼びます。", "ARRAY_TRACE", { values: [7, 4, 6, 2], steps: [
    { swappingIndices: [0, 3], message: "これから交換するのは位置0の7と位置3の2です。", nextLabel: "2つの値を交換する" },
    { values: [2, 4, 6, 7], confirmedIndices: [0], message: "2と7を交換しました。位置0の2が確定しました。位置1〜3は次に調べる範囲です。" },
  ] }, "確定したのは左端。残りの並びは、まだ保証されないよ。"),
  choice("swap-check", "最初の交換後は、どの並び？", "[8, 3, 6, 1] を最後まで調べ、最小値の位置が3だと分かりました。今回確定するのは位置0です。交換を1回行った直後を選びましょう。", ["[1, 3, 6, 1]", "[1, 3, 6, 8]", "[1, 8, 3, 6]"], 1,
    "位置0の8と位置3の1だけを交換するので [1, 3, 6, 8] です。元の8も残ります。", "今回動かす2つの場所と、残しておく値を確認しましょう。"),
  mapping("swap-code", "交換をPythonの1行で表そう", "numbersはリスト、iは確定する位置、min_indexは全件を調べ終えた最小値の位置です。Pythonの同時代入は、右側の値を先に両方読み、左側へ順に入れます。だから元の値を失わずに交換できます。", code("numbers = [7, 4, 6, 2]", "i = 0", "min_index = 3", swap), [
    { id: "swap", label: "元の2つの値を交換する", lines: [4], role: "右辺の2と7を読み、左辺の位置0と3へ入れる", state: "位置0は7→2、位置3は2→7。結果は [2, 4, 6, 7]" },
  ]),
  build("swap-build", "値を失わない交換行を選ぼう", "numbers=[1, 9, 4, 6]。位置0は確定済み。i=1が今回確定する位置、min_index=2が最小値の位置です。調査済みの2つの値を交換してください。", code("numbers = [1, 9, 4, 6]", "i = 1", "min_index = 2"),
    [{ label: "2つの値を交換", indent: 0 }], [["overwrite", "numbers[i] = numbers[min_index]"], ["swap", swap], ["keep", "numbers[i], numbers[min_index] = numbers[i], numbers[min_index]"]], ["swap"],
    "9と4を交換し、[1, 4, 9, 6] になります。位置0の1はそのままです。", "元の値を2つとも使い、右側の順序を反対にします。"),
  choice("same-position", "交換先が同じ場所だったら？", "[1, 3, 7, 5] で位置0は確定済み。今回は位置1から右をすべて調べた結果、最小値も位置1の3でした。位置1と位置1を交換すると？", ["3が2個になり、7が消える", "位置1は確定できず、最初から探し直す", "値は変わらず、位置1を確定できる"], 2,
    "同じ位置の交換では値は変わりません。全件の比較で最小だと分かったので、位置1を確定できます。", "同じ場所に同じ値を戻したときと、最後まで調べた事実を考えましょう。"),
], ["走査後の交換", "同時代入", "同じ位置の交換"]);

const repeat = m("repeat", "確定した左側を残して、繰り返そう", "未確定の範囲へ進み、候補を準備し直す理由と、終了・戻り値を理解します。", [
  a("remaining", "左端の次は、残りの最小を探そう", "[6, 4, 7, 2] の1周目が終わった状態から続けます。", "最小の2を位置0と交換すると [2, 4, 7, 6] になります。2は全体で最小なので、もう動かしません。次は位置1〜3の中で最小を探し、位置1へ置けば、左から2つが小さい順になります。前回の候補をそのまま使わず、今回の先頭を新しい候補にします。", "TEXT", { conclusion: "1周とは、今回の範囲を最後まで調べ、先頭と最小値を交換するところまでです。" }, "確定済みの左側を外して、残りで同じことをするよ。"),
  indices("restart-check", "次の周の最初の候補を選ぼう", "各周の最初は、今回確定したい位置を候補にします。まだ見ていない値を先に候補にせず、そこから右を一つずつ調べます。indexは0から始まる位置番号です。", [
    { id: "second", prompt: "[1, 8, 5, 3] の位置0は確定済み。次は位置1を確定します。比較を始める前の候補はどこ？", values: [1, 8, 5, 3], correctIndex: 1, correctFeedback: "今回確定したい先頭の位置1を候補として走査を始めます。", incorrectFeedback: "探し終えた後ではなく、比較を始める前の候補です。" },
    { id: "third", prompt: "[1, 3, 8, 5] の位置0と1は確定済み。次は位置2を確定します。最初の候補はどこ？", values: [1, 3, 8, 5], correctIndex: 2, correctFeedback: "位置0と1は確定済み。残りの先頭、位置2から候補を準備します。", incorrectFeedback: "確定していない部分の先頭はどこでしょう。" },
  ], "今回の先頭を新しい候補にします。前の周で使った候補の位置を持ち越しません。", "最小値を探し終えた場所ではなく、今回の比較を始める前の候補を選びます。"),
  a("repeat-trace", "残りの範囲で、最後まで進めよう", "[2, 4, 7, 6] の位置0が確定した後を、比較から追いましょう。", "各周で、未確定の先頭を候補に戻し、その右隣から末尾まで調べます。調べ終えてから交換し、確定する位置を一つ右へ進めます。残りが1件なら、他の値はすでに小さい順に確定しているので、その1件も正しい場所です。", "ARRAY_TRACE", { values: [2, 4, 7, 6], intervalMs: 2200, steps: [
    { confirmedIndices: [0], pointers: [pointer(1, "最小候補")], message: "2周目。位置1〜3を調べます。最初の候補は位置1の4です。", nextLabel: "次の値と比べる" },
    { confirmedIndices: [0], comparingIndices: [1, 2], pointers: [pointer(1, "最小候補")], message: "位置2の7は候補の4より小さくないので、候補は位置1のまま。", nextLabel: "次の値と比べる" },
    { confirmedIndices: [0], comparingIndices: [1, 3], pointers: [pointer(1, "最小候補")], message: "位置3の6も4より小さくありません。全件を調べ終えました。", nextLabel: "候補の値と交換する" },
    { confirmedIndices: [0, 1], message: "位置1同士の交換なので並びは変わりません。位置1の4が確定しました。", nextLabel: "次の周を始める" },
    { confirmedIndices: [0, 1], pointers: [pointer(2, "最小候補")], message: "3周目。位置2〜3を調べます。最初の候補は位置2の7です。", nextLabel: "次の値と比べる" },
    { confirmedIndices: [0, 1], comparingIndices: [2, 3], pointers: [pointer(2, "最小候補")], message: "位置3の6は候補の7より小さいです。", nextLabel: "候補を更新する" },
    { confirmedIndices: [0, 1], pointers: [pointer(3, "最小候補")], message: "候補を位置3へ更新しました。調べる値はもうありません。", nextLabel: "2つの値を交換する" },
    { values: [2, 4, 6, 7], confirmedIndices: [0, 1, 2], message: "位置2の7と位置3の6を交換しました。位置2まで確定しました。", nextLabel: "残り1件を確認する" },
    { values: [2, 4, 6, 7], confirmedIndices: [0, 1, 2, 3], message: "残りは7だけ。先に小さい3件を確定したので、7も正しい位置です。" },
  ] }, "毎周、候補を準備し直す。左の確定部分が一つずつ伸びるよ。"),
  mapping("outer-code", "確定する位置を、外側のforで進めよう", "nは要素数、iは今回確定する位置です。4件なら位置0、1、2を確定すれば残り1件も決まるので3周です。range(n - 1) は0からn-2まで。各周でmin_indexをiにし直し、その内側でjによる走査を行います。", code("numbers = [6, 4, 7, 2]", "n = len(numbers)", "for i in range(n - 1):", "    min_index = i"), [
    { id: "outer", label: "確定する位置を右へ進める", lines: [3], role: "候補探しと交換を繰り返す外側のループ", state: "n=4なのでiは0→1→2。各回で右側の範囲が1件ずつ短くなる" },
    { id: "reset", label: "その周の最初の候補を準備する", lines: [4], role: "外側のforの中なので毎周実行される", state: "i=1の周ならmin_index=1、i=2の周ならmin_index=2" },
  ]),
  build("outer-build", "毎周の候補を、どこで準備する？", "nはリストの要素数。iで今回確定する位置を動かし、min_indexへその周の先頭を記録します。この後にjの走査と交換が続きます。", code("numbers = [5, 2, 8, 1]", "n = len(numbers)"),
    [{ label: "確定する位置を動かす", indent: 0 }, { label: "毎周の最初の候補", indent: 1 }],
    [["fixed", "min_index = 0"], ["init", "min_index = i"], ["short", "for i in range(n - 2):"], ["outer", "for i in range(n - 1):"]], ["outer", "init"],
    "iを0、1、2と動かし、各周でその位置を候補にできます。", "最後の1件以外を確定し、候補はその周の先頭から始めます。"),
  mapping("boundary-return", "空でも1件でも、リストを返そう", "nは要素数です。空リストならrange(-1)、1件ならrange(0)となり、どちらもループは0回です。候補の値を読まず、そのまま返せます。returnは呼び出し元へ値を返して関数を終えるため、全周の後に置きます。numbers.sort()やsorted()を使わず、学んだ処理を関数にまとめます。", selectionSortAnswerCode, [
    { id: "empty", label: "0件・1件なら周回しない", lines: [2, 3], role: "nが0または1ならforの中は実行しない", state: "[]や[5]は、値へのアクセスも交換も行わない" },
    { id: "return", label: "全周が終わったリストを返す", lines: [9], role: "外側のforと同じ深さに置き、処理後のnumbersを返す", state: "[6, 4, 7, 2]なら[2, 4, 6, 7]。[]なら[]、[5]なら[5]" },
  ]),
  choice("repeat-check", "1周だけで返してもよい？", "[4, 3, 2, 1] の1周目では最小の1を先頭と交換し、[1, 3, 2, 4] になりました。この直後にreturnで返すコードについて、正しい判断は？", ["先頭だけ確定しており、残りの周も必要", "最小値が先頭なので常に全体が完成", "4件なら4回の追加交換が必須"], 0,
    "3と2の順番がまだ逆です。returnは外側のforの後に置き、残りも確定してから返します。", "左端以外も小さい順か、残りのリストを確認しましょう。"),
], ["確定範囲の拡大", "候補の再初期化", "二重ループの役割", "空・1件と戻り値"]);

const synthesis = m("assemble-code", "学んだコードを組み立てよう", "候補探し・交換・繰り返しをまとめ、別のリストにも使えることを確認します。", [
  build("assemble", "選択ソート関数を完成させよう", "numbersは整数リスト、nは要素数、iは確定位置、jは調べる位置、min_indexは最小候補の位置です。全て既習のブロックです。", "def selection_sort(numbers):",
  [{ label: "要素数", indent: 1 }, { label: "確定位置の繰り返し", indent: 1 }, { label: "その周の候補の準備", indent: 2 }, { label: "末尾まで調べる", indent: 2 }, { label: "候補との比較", indent: 3 }, { label: "候補位置の更新", indent: 4 }, { label: "調べ終えてから交換", indent: 2 }, { label: "全周の後に返す", indent: 1 }],
  [["swap", swap], ["init", "min_index = i"], ["wrong", "min_index = numbers[j]"], ["return", "return numbers"], ["inner", "for j in range(i + 1, n):"], ["n", "n = len(numbers)"], ["update", "min_index = j"], ["condition", condition], ["outer", "for i in range(n - 1):"]], ["n", "outer", "init", "inner", "condition", "update", "swap", "return"],
  "候補の準備→走査→交換を繰り返し、最後にリストを返す関数が完成しました。", "内側のforで最小を探し終えてから交換します。各周で候補を準備し直すことも確認しましょう。"),
  choice("indentation-check", "交換を内側のforに入れると？", "次のコードでは、比較するたびに交換してしまいます。今回学んだ選択ソートに直すには、交換行をどこで実行する必要がありますか？ iは確定位置、jは調べる位置、min_indexは候補の位置です。", ["条件が成立した直後だけ", "jの走査が全部終わった後、iの周回の中", "すべてのiの周回が終わってから1回だけ"], 1,
    "1周の範囲を調べ終えた時点の最小値と交換します。交換行は内側のforの外、外側のforの中です。", "交換に必要なのは『ここまでの候補』と『今回の全体の最小』のどちらでしょう。"),
  choice("transfer", "負数や同じ値でも、同じ手順で考えよう", "[-1, 2, -1, 0] を最初から選択ソートします。同じ値なら候補を更新しません。最初の2周を終えたリストは？", ["[-1, 2, -1, 0]", "[-1, 0, 2]", "[-1, -1, 2, 0]"], 2,
    "1周目は先頭の-1を保持。2周目は位置2の-1と位置1の2を交換し、[-1, -1, 2, 0] になります。重複は消しません。", "各周の先頭から候補を準備し、交換する2箇所だけを書き換えてみましょう。"),
], ["選択ソートのコード統合", "交換行の位置", "未見データへの応用"]);

synthesis.activities[0].content.learningRole = "SYNTHESIS";
synthesis.activities[1].content.data.promptCode = code("for j in range(i + 1, n):", "    if numbers[j] < numbers[min_index]:", "        min_index = j", `    ${swap}`);
synthesis.estimatedMinutes = estimateMissionMinutes(synthesis);
synthesis.rewardExp = expectedMissionRewardExp(synthesis);

const exam = m("course-mission", "Course Mission：選択ソートを自分で実装しよう", "候補探し、交換、繰り返しを使って関数を完成させ、7つのケースで確かめます。", [
  a("implementation", "選択ソートを自分で実装しよう", "selection_sort(numbers) を完成させ、整数リストを小さい順に並べ替えて返しましょう。", "numbersは整数リストです。入力のリスト自体を変更して構いません。重複する値もすべて残し、空リストなら[]を返してください。sorted()やsort()などの完成済みの並べ替えは使わず、最小値を探して交換する処理を書きます。関数名と引数名を保ち、passを置き換えてください。",
    "CODE_EDITOR", {
      evaluationMode: "TEST_CASES", functionName: "selection_sort", answerCode: selectionSortAnswerCode,
      starterCode: code("def selection_sort(numbers):", "    # 小さい順に並べ替えて返してください", "    pass"),
      forbiddenCode: [{ snippet: "sorted(", label: "sortedではなく、最小値を探して交換する手順を使いましょう。" }, { snippet: ".sort(", label: "sortではなく、学んだ候補探しと交換を組み合わせましょう。" }],
      testCases: [
        { id: "basic", label: "基本：途中にも最小候補", args: [[7, 4, 6, 2]], expected: [2, 4, 6, 7] },
        { id: "reverse", label: "逆順：末尾まで調べる", args: [[4, 3, 2, 1]], expected: [1, 2, 3, 4] },
        { id: "sorted", label: "整列済み：候補を保つ", args: [[1, 3, 5, 7]], expected: [1, 3, 5, 7] },
        { id: "duplicates", label: "重複：同じ値も残す", args: [[3, 1, 3, 1]], expected: [1, 1, 3, 3] },
        { id: "negative", label: "負数：0より小さくても同じ規則", args: [[0, -3, 2, -1]], expected: [-3, -1, 0, 2] },
        { id: "empty", label: "空リスト：そのまま返す", args: [[]], expected: [] },
        { id: "single", label: "1件：比較せず返す", args: [[5]], expected: [5] },
      ],
      hints: [
        { id: "outline", title: "全体の順序を思い出す", body: "確定したい位置を決め、その位置から右の最小を探します。全件を調べ終えてから交換し、次の位置へ進みます。『残りの範囲で、最後まで進めよう』で動きを復習できます。" },
        { id: "candidate", title: "候補は値ではなく位置", body: "iは確定位置、jは調べる位置、min_indexは最小候補の位置です。毎周min_index=iから始め、より小さい値があればmin_index=jで更新します。", code: code(condition, "    min_index = j") },
        { id: "range", title: "2つのforの範囲", body: "n=len(numbers)です。iは0からn-2、jはi+1からn-1まで。rangeは終わりの値を含みません。候補の準備は外側のforの中に置きます。", code: code("for i in range(n - 1):", "    min_index = i", "    for j in range(i + 1, n):", "        # ここで候補と比較する") },
        { id: "swap", title: "交換とreturnの位置", body: "交換は内側のforと同じ深さに置き、走査が全部終わってから実行します。return numbersは外側のforと同じ深さに置きます。空や1件でもreturnに到達することを確認しましょう。", code: swap },
      ],
      courseResult: { masteryTitle: "選択ソートをマスター", description: "選択ソートコースを修了しました。", learningOutcome: "最小候補の走査・交換・繰り返しを使って、選択ソートを実装できるようになりました。" },
      correctFeedback: "7つのテストを通過しました。候補探しと交換を組み合わせて、リストを小さい順に並べ替えられました。",
      incorrectFeedback: "未通過のケースで、候補の初期化・走査範囲・交換・returnの位置を見直しましょう。",
    }, "一度で完成しなくても大丈夫。未通過のケースを一つずつ直そう。", MissionActivityType.TRY_CODE, "COURSE_EXAM"),
], ["選択ソートの自力実装", "テスト結果を使った修正"], MissionType.COURSE_EXAM);

exam.activities[0].actionLabel = "提出する";

export const selectionSortCourseSeed: CourseSeed = {
  id: "course-algorithm-selection-sort-v1", title: "選択ソート", difficulty: CourseDifficulty.EASY,
  description: "残りの中から最小値を探し、左から順に確定する選択ソートを学びます。候補の位置とカードの動きを追い、短いPython練習を積み重ね、最後は自分で並べ替え関数を完成させます。変数・リスト・if・forを一度学んだ方が対象です。",
  isInitiallyUnlocked: true, isPublished: true, version: 1, categories: [CourseCategoryType.SORT],
  missions: [orientation, candidate, exchange, repeat, synthesis, exam].map((mission, index) => ({ ...mission, order: index + 1 })),
};
