/** マージソート。概念順・標準コードはdocs/course-designsの設計票を参照。 */
import { CourseCategoryType, CourseDifficulty, MissionActivityType, MissionType } from "@prisma/client";

import type { ActivitySeed, CourseSeed, MissionSeed } from "./learningSeedTypes";
import { estimateMissionMinutes, expectedMissionRewardExp } from "./learningSeedPolicy";

const code = (...lines: string[]) => lines.join("\n");
export const mergeSortAnswerCode = code(
  "def merge_sort(numbers):",
  "    if len(numbers) <= 1:",
  "        return numbers",
  "    middle = len(numbers) // 2",
  "    left = merge_sort(numbers[:middle])",
  "    right = merge_sort(numbers[middle:])",
  "    merged = []",
  "    i = 0",
  "    j = 0",
  "    while i < len(left) and j < len(right):",
  "        if left[i] <= right[j]:",
  "            merged.append(left[i])",
  "            i += 1",
  "        else:",
  "            merged.append(right[j])",
  "            j += 1",
  "    merged.extend(left[i:])",
  "    merged.extend(right[j:])",
  "    return merged",
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
  id: `merge-${id}`,
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
) => a(
  id,
  title,
  "現在のリストと規則を確認し、当てはまるものを1つ選びましょう。",
  body,
  "SINGLE_CHOICE",
  {
    question: title,
    choices: options.map((label, index) => ({ id: `option-${index}`, label, isCorrect: index === correct })),
    correctFeedback: feedback,
    incorrectFeedback: hint,
  },
  "どの段階のリストか、どこまで使ったかを確認しよう。",
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
  "役割カードを選び、色がつくコード行と状態変化を見比べましょう。",
  body,
  "CODE_STATE_MAPPING",
  { code: source, mappings },
  "コード行を、分割・停止・結合のどの動きか結びつけよう。",
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
    previewWaitingMessage: "空欄の日本語の役割と、リストの状態を見比べましょう。",
  },
  "空欄の役割から、必要な処理を選ぼう。",
  MissionActivityType.SELECT_FILL,
  "GUIDED_PRACTICE",
);

const sequence = (
  id: string,
  title: string,
  body: string,
  questions: {
    question: string;
    options: { id: string; label: string }[];
    correctFeedback: string;
    incorrectFeedback: string;
    leftValues?: number[];
    rightValues?: number[];
    leftIndex?: number;
    rightIndex?: number;
    resultValues?: number[];
  }[],
  answers: string[],
  feedback: string,
) => a(
  id,
  title,
  "問題を1つずつ進め、次に結合結果へ移す値を選びましょう。",
  body,
  "SEQUENTIAL_CHOICE",
  { question: title, sequenceQuestions: questions, correctAnswers: answers, correctFeedback: feedback, incorrectFeedback: "各列の未使用部分の先頭を比べましょう。" },
  "整列済みの列では、未使用部分の先頭が一番小さいよ。",
  MissionActivityType.SELECT_FILL,
  "INDEPENDENT_PRACTICE",
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
    id: `merge-${id}`,
    title,
    description,
    activities: activities.map((activity, index) => ({ ...activity, order: index + 1 })),
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/merge-sort.svg",
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

const divideLevels = [
  { label: "開始", phase: "DIVIDE", groups: [[7, 2, 5, 1]], message: "4つの値を持つ元のリストです。値の順番はまだ変えません。", nextLabel: "左右へ分ける" },
  { label: "2つずつ", phase: "DIVIDE", groups: [[7, 2], [5, 1]], message: "中央を境に、左2つと右2つへ分けました。", nextLabel: "1つずつへ分ける" },
  { label: "1つずつ", phase: "DIVIDE", groups: [[7], [2], [5], [1]], message: "1要素のリストまで分けました。1要素なら、それだけで小さい順です。" },
];

const fullLevels = [
  ...divideLevels.slice(0, 2),
  { ...divideLevels[2], nextLabel: "2つずつ結合する" },
  { label: "2つずつ整列", phase: "COMBINE", groups: [[2, 7], [1, 5]], message: "[7]と[2]を[2, 7]へ、[5]と[1]を[1, 5]へ結合しました。", nextLabel: "全体を結合する" },
  { label: "完成", phase: "COMBINE", groups: [[1, 2, 5, 7]], message: "整列済みの[2, 7]と[1, 5]を結合し、小さい順の全体が完成しました。" },
];

const orientation = m("orientation", "分けてから結合する並べ替えを知ろう", "マージソートが解決する問題と、学習する範囲を確認します。", [
  a("goal", "大きな並べ替えを、小さな並べ替えに分けよう", "マージソートの全体像を確認しましょう。",
    "[7, 2, 5, 1]を小さい順へ並べます。マージソートは、リストを小さく分け、分けた部分を小さい順に結合して全体を完成させます。値を消したり増やしたりせず、すべての値を結果へ残します。",
    "TEXT", { comparison: { headers: ["並べ替え前", "目指す並び"], rows: [{ cells: ["7 → 2 → 5 → 1", "1 → 2 → 5 → 7"] }] }, conclusion: "細かく分けることと、整列済みの部分を結合することを別々に学びます。" },
    "最初は、分ける・結合するの2つがあると分かれば大丈夫。", MissionActivityType.VIEW, "ORIENTATION"),
  a("uses", "マージソートはどこで使われる？", "特徴と利用場面を確認しましょう。",
    "要素が増えても処理時間が増えにくい並べ替えとして使われます。大量のデータを複数のまとまりに分けて処理するときや、すでに並んだ複数のデータを1つへまとめるときに考え方を利用できます。",
    "TEXT", { listItems: ["大きなリストも、分割と結合を使って効率よく並べ替える", "別々に整列したデータを1つの順序へまとめる", "大きな問題を小さな問題へ分けて解く考え方を学ぶ"] },
    "このコースでは整数リストを小さい順にすることへ集中するよ。", MissionActivityType.VIEW, "ORIENTATION"),
  a("scope", "既存ソートと、マージソートの違い", "このコースで扱う範囲を確認しましょう。",
    "バブルソートは隣同士の交換、選択ソートは残りの最小値探しを繰り返します。マージソートは小さく分け、整列済みの部分を結合します。追加のリストを使いますが、要素数が増えたときも比較回数が増えにくい方法です。厳密な計算量の証明や高度な省メモリ化は扱いません。",
    "TEXT", { comparison: { headers: ["方法", "中心となる操作", "このコースでの位置づけ"], rows: [{ cells: ["バブルソート", "隣同士を交換", "既習の基本ソート"] }, { cells: ["選択ソート", "残りの最小を選ぶ", "既習の基本ソート"] }, { cells: ["マージソート", "分割して結合", "今回学ぶ効率的なソート"] }] } },
    "交換の回数ではなく、問題を小さくする方法を学ぶよ。", MissionActivityType.VIEW, "ORIENTATION"),
  a("roadmap", "分割の図から、再帰するPython関数へ", "一つずつできることを増やしましょう。",
    "半分への分割、止まる条件、整列済み2列の結合、分割と結合の全体順、Pythonコードを順に学びます。",
    "LEARNING_ROADMAP", { roadmapSteps: ["目的を知る", "左右へ分ける", "1要素で止める", "左右へ同じ処理を使う", "整列済み2列を結合する", "残りを追加する", "全体を追う", "コードを組み立てる", "自分で関数を完成させる"], emphasis: "ゴール：整数リストをマージソートで小さい順にして返す" },
    "新しい記号は、リストの動きが分かってからコードへつなげるよ。", MissionActivityType.VIEW, "ORIENTATION"),
], ["マージソートの目的", "既存ソートとの違い", "利用場面", "学習順"]);

const divide = m("divide", "リストを中央で左右へ分けよう", "中央の境界とPythonのスライスを使い、値を落とさず左右へ分けます。", [
  a("divide-bridge", "値を動かす前に、小さなまとまりへ分ける", "分割する理由と、分割直後の状態を確認しましょう。",
    "これまでのソートは同じリストの中で比較と交換を繰り返しました。マージソートでは、まず[7, 2, 5, 1]を[7, 2]と[5, 1]へ分けます。この時点では値の順番を変えません。小さなまとまりへ同じ処理を使えるようにする準備です。",
    "TEXT", { conclusion: "分割は並べ替えの完成ではありません。元の順番を保ったまま、扱う範囲だけを小さくします。" },
    "分けるときは、値の順番と個数をそのまま保つよ。"),
  a("divide-trace", "4つを、1つずつになるまで分けよう", "分割の1段階ずつを追いましょう。",
    "元のリストを中央で左右へ分け、2要素の部分も同じように分けます。今は大小比較を行いません。",
    "DIVIDE_COMBINE_TRACE", { levels: divideLevels, intervalMs: 1900, finalMessage: "すべて1要素になりました。次は、ここで止められる理由を学びます。" },
    "1回の操作では、今の各リストを左右へ1段階だけ分けるよ。"),
  a("middle-rule", "中央は、要素数を2で割った境界", "奇数個も含めた分け方を確認しましょう。",
    "要素数4なら中央の境界は2で、位置0〜1が左、位置2〜3が右です。要素数5なら2で割った小数点以下を使わず、境界は2です。左は位置0〜1の2要素、右は位置2〜4の3要素になります。中央は特別な値ではなく、左右を分ける位置です。",
    "TEXT", { comparison: { headers: ["元のリスト", "中央の境界", "左", "右"], rows: [{ cells: ["[7, 2, 5, 1]", "2", "[7, 2]", "[5, 1]"] }, { cells: ["[8, 3, 6, 2, 5]", "2", "[8, 3]", "[6, 2, 5]"] }] } },
    "奇数個では、右側が1つ多くても値は全部残るよ。"),
  choice("split-choice", "5要素を左右へ分けると？", "numbers=[9, 4, 7, 1, 6]です。中央の境界は5//2=2。終了位置2は左に含めず、位置2から右に含めます。分割直後を選びましょう。",
    ["左[9, 4, 7]、右[1, 6]", "左[9, 4]、右[7, 1, 6]", "左[4, 9]、右[1, 6, 7]"], 1,
    "境界2より前の位置0〜1が左、位置2から末尾が右なので、[9, 4]と[7, 1, 6]です。まだ並べ替えません。",
    "境界の値2を、左側の終了位置と右側の開始位置として使いましょう。"),
  mapping("split-code", "中央と左右をPythonで表そう", "numbers=[9, 4, 7, 1, 6]です。//は小数点以下を使わない割り算です。スライスの終了位置は含まれません。",
    code("numbers = [9, 4, 7, 1, 6]", "middle = len(numbers) // 2", "left_part = numbers[:middle]", "right_part = numbers[middle:]"), [
      { id: "middle", label: "左右の境界を求める", lines: [2], role: "要素数5を2で割り、境界位置2を得る", state: "middle=2" },
      { id: "left", label: "境界より前を取り出す", lines: [3], role: "先頭から終了位置middleの直前まで", state: "left_part=[9, 4]" },
      { id: "right", label: "境界から末尾を取り出す", lines: [4], role: "開始位置middleを含めて末尾まで", state: "right_part=[7, 1, 6]" },
    ]),
  build("split-build", "左右へ分けるコードを完成させよう", "numbers=[8, 3, 6, 2, 5]を、境界位置を使って左と右へ分けます。スライスで値の順番を変えません。",
    "def merge_sort(numbers):", [
      { label: "中央の境界位置", indent: 1 },
      { label: "境界より前の左側", indent: 1 },
      { label: "境界から末尾の右側", indent: 1 },
    ], [
      ["middle", "middle = len(numbers) // 2"], ["wrong-middle", "middle = len(numbers) / 2"],
      ["left", "left_part = numbers[:middle]"], ["wrong-left", "left_part = numbers[middle:]"],
      ["right", "right_part = numbers[middle:]"], ["wrong-right", "right_part = numbers[:middle]"],
    ], ["middle", "left", "right"],
    "境界は2、左は[8, 3]、右は[6, 2, 5]です。元の順番と5つの値を保てました。",
    "//で整数の境界を作り、終了位置を含まない左と、開始位置を含む右に分けます。"),
], ["中央の境界", "偶数・奇数個の分割", "スライス", "値を保つ分割"]);

const recursion = m("recursion", "1要素で止め、左右にも同じ処理を使おう", "分割の停止条件と、左右の再帰呼び出しを学びます。", [
  a("base-bridge", "分け続けるには、止まる条件が必要", "1要素のリストを見て、次の問いを確認しましょう。",
    "左右へ分ける方法は分かりました。しかし[7]をさらに分けても、並べ替えは進みません。1要素のリストは、比較する相手がなく、すでに小さい順です。空リストも同じです。そこで要素数が1以下なら、そのまま返して分割を止めます。",
    "TEXT", { conclusion: "この『これ以上小さくしなくてよい場合』を停止条件と呼びます。" },
    "0個か1個なら、もう並べ替える必要はないよ。"),
  choice("base-choice", "どのリストなら、すぐ返せる？", "マージソートを呼び出した直後です。比較や分割をせず、そのまま小さい順だと言えるものを選びましょう。",
    ["[4, 1]だけ", "[]と[4]", "[4, 1]と[2, 3]"], 1,
    "空リストと1要素のリストは、値の順番を直す必要がないため、そのまま返せます。",
    "並べ替えるために、2つの値を比較する必要があるか考えましょう。"),
  mapping("base-code", "停止条件をPythonへつなげよう", "len(numbers)は要素数です。1以下なら現在のリストを返し、この呼び出しを終えます。",
    code("def merge_sort(numbers):", "    if len(numbers) <= 1:", "        return numbers"), [
      { id: "check", label: "要素数が1以下か調べる", lines: [2], role: "空または1要素なら分割不要と判断", state: "条件が成立すれば次の分割行へ進まない" },
      { id: "return", label: "整列済みとして返す", lines: [3], role: "現在のリストを呼び出し元へ返す", state: "[7]なら[7]、空なら[]が返る" },
    ]),
  build("base-build", "止まる条件を完成させよう", "2要素以上だけを分割するため、空または1要素では現在のリストを返します。",
    "def merge_sort(numbers):", [
      { label: "分割しなくてよい要素数を判定", indent: 1 },
      { label: "現在のリストを返して終了", indent: 2 },
    ], [
      ["condition", "if len(numbers) <= 1:"], ["wrong-condition", "if len(numbers) > 1:"],
      ["return", "return numbers"], ["wrong-return", "return []"],
    ], ["condition", "return"],
    "0個と1個で現在のリストを返し、2個以上だけが後続の分割へ進みます。",
    "止めたい側の要素数と、返しても値を失わない内容を確認しましょう。"),
  a("recursion-meaning", "左右にも、同じ並べ替えを任せよう", "分割後の左右が整列済みになるまでを確認しましょう。",
    "[7, 2, 5, 1]を[7, 2]と[5, 1]へ分けても、左右はまだ小さい順ではありません。そこで左へmerge_sort、右へmerge_sortを呼びます。それぞれが1要素まで分かれ、結合を終えると、左から[2, 7]、右から[1, 5]が返ります。同じ関数が自分自身を使うことを再帰と呼びます。",
    "DIVIDE_COMBINE_TRACE", { levels: fullLevels, intervalMs: 1900, finalMessage: "左右の呼び出しから整列済みのリストが返るため、最後の結合へ進めます。" },
    "呼び出した直後ではなく、その処理が終わってから整列済みの左右が返るよ。"),
  mapping("recursion-code", "再帰の戻り値を左右へ記録しよう", "スライスで作った部分をmerge_sortへ渡し、整列が終わって返ったリストをleftとrightへ記録します。",
    code("middle = len(numbers) // 2", "left = merge_sort(numbers[:middle])", "right = merge_sort(numbers[middle:])"), [
      { id: "left", label: "左側を最後まで整列", lines: [2], role: "左部分へ同じ処理を使い、返り値を記録", state: "[7, 2]からleft=[2, 7]が返る" },
      { id: "right", label: "右側を最後まで整列", lines: [3], role: "右部分へ同じ処理を使い、返り値を記録", state: "[5, 1]からright=[1, 5]が返る" },
    ]),
  build("recursion-build", "左右を整列する呼び出しを置こう", "middleは求め終えています。左右のスライスを同じmerge_sortへ渡し、返ってきた整列済みリストを記録します。",
    code("def merge_sort(numbers):", "    # 停止条件", "    middle = len(numbers) // 2"), [
      { label: "左側を整列して記録", indent: 1 },
      { label: "右側を整列して記録", indent: 1 },
    ], [
      ["left", "left = merge_sort(numbers[:middle])"], ["wrong-left", "left = numbers[:middle]"],
      ["right", "right = merge_sort(numbers[middle:])"], ["wrong-right", "right = merge_sort(numbers[:middle])"],
    ], ["left", "right"],
    "左と右の両方へ同じ処理を使い、整列済みのleftとrightを受け取れました。",
    "分割しただけのリストではなく、merge_sortの返り値を左右へ記録します。"),
], ["停止条件", "1要素以下は整列済み", "再帰", "左右の返り値"]);

const merge = m("merge", "整列済みの2列を、小さい順に結合しよう", "未使用部分の先頭を比較し、結果へ移して残りも追加します。", [
  a("merge-bridge", "左右が整列済みなら、先頭だけを比べられる", "結合前の前提と、新しい問いを確認しましょう。",
    "左の再帰から[2, 7]、右の再帰から[1, 5]が返りました。どちらも小さい順です。そのため、各列でまだ使っていない値のうち最小なのは先頭です。全4値を探し直さず、左の先頭2と右の先頭1だけを比べ、小さい1を結合結果へ移します。",
    "TEXT", { conclusion: "1を移した後は、左の2と右の次の5を比べます。各列の未使用の先頭だけを比べ続けます。" },
    "左右が整列済みだから、候補は未使用の先頭2つだけだよ。"),
  a("merge-trace", "先頭の小さい方を、結果へ1つずつ移そう", "2列を結合する全手順を追いましょう。",
    "左[2, 7]と右[1, 5]は整列済みです。緑は結果へ移し終えた値、青は次に比べる未使用の先頭です。",
    "TWO_LIST_MERGE_TRACE", { left: [2, 7], right: [1, 5], intervalMs: 1900, steps: [
      { leftIndex: 0, rightIndex: 0, result: [], message: "左の2と右の1を比べます。", nextLabel: "小さい1を移す" },
      { leftIndex: 0, rightIndex: 1, result: [1], message: "右の1を結果へ移しました。次は左の2と右の5を比べます。", nextLabel: "小さい2を移す" },
      { leftIndex: 1, rightIndex: 1, result: [1, 2], message: "左の2を移しました。次は左の7と右の5を比べます。", nextLabel: "小さい5を移す" },
      { leftIndex: 1, rightIndex: 2, result: [1, 2, 5], message: "右の5を移し、右は空になりました。", nextLabel: "左の残りを追加する" },
      { leftIndex: 2, rightIndex: 2, result: [1, 2, 5, 7], message: "左に残った7を末尾へ追加し、結合が完了しました。" },
    ], finalMessage: "結果は[1, 2, 5, 7]。4つの値を一度ずつ残せました。" },
    "1回の操作で、選んだ値を1つだけ結果へ移すよ。"),
  sequence("merge-decisions", "別の2列を順に結合しよう", "左[3, 6]と右[2, 4]は整列済みです。各問題では、表示された未使用の先頭だけを比べます。", [
    { question: "最初は左3と右2。次に結果へ移す値は？", leftValues: [3, 6], rightValues: [2, 4], leftIndex: 0, rightIndex: 0, resultValues: [], options: [{ id: "two", label: "右の2" }, { id: "three", label: "左の3" }, { id: "six", label: "左の6" }], correctFeedback: "2が小さいので、結果は[2]になります。", incorrectFeedback: "左3と右2だけを比べましょう。" },
    { question: "右2を使用済みにしました。左3と右4では？", leftValues: [3, 6], rightValues: [2, 4], leftIndex: 0, rightIndex: 1, resultValues: [2], options: [{ id: "three", label: "左の3" }, { id: "four", label: "右の4" }, { id: "six", label: "左の6" }], correctFeedback: "3が小さいので、結果は[2, 3]です。", incorrectFeedback: "現在の未使用の先頭は左3と右4です。" },
    { question: "左3を使用済みにしました。左6と右4では？", leftValues: [3, 6], rightValues: [2, 4], leftIndex: 1, rightIndex: 1, resultValues: [2, 3], options: [{ id: "four", label: "右の4" }, { id: "six", label: "左の6" }, { id: "done", label: "ここで終了" }], correctFeedback: "4を移し、結果は[2, 3, 4]です。", incorrectFeedback: "両方に未使用の値があるため、先頭を比較します。" },
    { question: "右は空になり、左に6が残りました。次は？", leftValues: [3, 6], rightValues: [2, 4], leftIndex: 1, rightIndex: 2, resultValues: [2, 3, 4], options: [{ id: "six", label: "左の6を追加" }, { id: "discard", label: "6を捨てて終了" }, { id: "restart", label: "最初から比較し直す" }], correctFeedback: "残りの6はすでに順序どおりなので末尾へ追加します。", incorrectFeedback: "値をすべて残すため、空でない側の残りを考えましょう。" },
  ], ["two", "three", "four", "six"], "[3, 6]と[2, 4]を[2, 3, 4, 6]へ結合できました。"),
  a("remainder", "片方が空なら、もう片方の残りを追加しよう", "比較を止める条件と、残りを使える理由を確認しましょう。",
    "両方に未使用の値がある間だけ、先頭を比較します。片方が空になった時点で、もう片方の未使用部分はすでに小さい順です。結合結果の末尾より小さい値も残っていないため、その順番のまま全部追加できます。値を捨てて終了してはいけません。",
    "TEXT", { comparison: { headers: ["現在の結果", "左の残り", "右の残り", "完成"], rows: [{ cells: ["[1, 2, 5]", "[7]", "[]", "[1, 2, 5, 7]"] }, { cells: ["[2, 3, 4]", "[6]", "[]", "[2, 3, 4, 6]"] }] } },
    "比較が終わっても、残った値を結果へ入れてから完成だよ。"),
  mapping("merge-code", "2つの位置を使って先頭を比べよう", "iはleftで次に使う位置、jはrightで次に使う位置です。追加した側の位置だけを1つ進めます。等しい場合は左を先に追加し、右の同じ値も後で残ります。",
    code("merged = []", "i = 0", "j = 0", "while i < len(left) and j < len(right):", "    if left[i] <= right[j]:", "        merged.append(left[i])", "        i += 1", "    else:", "        merged.append(right[j])", "        j += 1"), [
      { id: "prepare", label: "結果と2つの位置を準備", lines: [1, 2, 3], role: "結果は空、左右とも先頭から開始", state: "merged=[]、i=0、j=0" },
      { id: "continue", label: "両方に未使用の値がある間", lines: [4], role: "どちらかが空になるまで比較", state: "iとjが各リストの長さ未満か確認" },
      { id: "left", label: "左が小さいか等しければ左を追加", lines: [5, 6, 7], role: "left[i]を追加し、iだけ進める", state: "右の位置jはそのまま" },
      { id: "right", label: "右が小さければ右を追加", lines: [8, 9, 10], role: "right[j]を追加し、jだけ進める", state: "左の位置iはそのまま" },
    ]),
  build("merge-loop-build", "比較して1つ移す処理を完成させよう", "leftとrightは整列済みです。両方に未使用の値がある間、先頭の小さい方をmergedへ追加し、追加した側の位置だけを進めます。",
    code("merged = []", "i = 0", "j = 0"), [
      { label: "両方に未使用の値がある間", indent: 0 },
      { label: "左が小さいか等しい", indent: 1 },
      { label: "左の先頭を結果へ追加", indent: 2 },
      { label: "左の位置を1つ進める", indent: 2 },
      { label: "右の方が小さい場合", indent: 1 },
      { label: "右の先頭を結果へ追加", indent: 2 },
      { label: "右の位置を1つ進める", indent: 2 },
    ], [
      ["while", "while i < len(left) and j < len(right):"], ["wrong-while", "while i < len(left) or j < len(right):"],
      ["if", "if left[i] <= right[j]:"], ["wrong-if", "if left[i] >= right[j]:"],
      ["append-left", "merged.append(left[i])"], ["inc-left", "i += 1"],
      ["else", "else:"], ["append-right", "merged.append(right[j])"], ["inc-right", "j += 1"],
      ["wrong-inc", "i += 1; j += 1"],
    ], ["while", "if", "append-left", "inc-left", "else", "append-right", "inc-right"],
    "小さい方を1つ追加し、使った側だけを進める比較ループが完成しました。",
    "両方が残る条件、小さい側の追加、追加した側だけの位置更新を順に確認しましょう。"),
  build("remainder-build", "残りを追加して、結合結果を返そう", "比較ループが終わりました。iとjは各リストで次に使う位置です。片方または両方の残りを末尾へ追加して返します。空のスライスをextendしても変化しません。",
    "# 先頭比較のwhileが終了", [
      { label: "左の未使用部分を追加", indent: 0 },
      { label: "右の未使用部分を追加", indent: 0 },
      { label: "完成した結合結果を返す", indent: 0 },
    ], [
      ["left", "merged.extend(left[i:])"], ["wrong-left", "merged.append(left)"],
      ["right", "merged.extend(right[j:])"], ["wrong-right", "merged.extend(right[:j])"],
      ["return", "return merged"], ["wrong-return", "return left + right"],
    ], ["left", "right", "return"],
    "左右の未使用部分を順番のまま追加し、値をすべて含むmergedを返せました。",
    "現在位置から末尾までを追加し、結合して作ったリストを返します。"),
], ["整列済み2列の結合", "未使用の先頭", "2つの位置", "残りの追加"]);

const flow = m("flow", "分割から結合まで、全体の順を追おう", "呼び出しで小さく分け、戻りながら結合する全体像を確認します。", [
  a("flow-bridge", "分割と結合を、1本の流れに戻そう", "これまでの2つの処理をつなげましょう。",
    "左右へ分ける処理と、整列済み2列を結合する処理は分かりました。マージソートでは、先に1要素まで分けます。1要素から戻るときに小さい順へ結合し、最後に元の大きさのリストが完成します。分割中の左右は未整列、戻ってきた左右は整列済みです。",
    "TEXT", { conclusion: "分ける方向では問題を小さくし、戻る方向では解けた小問題を結合します。" },
    "同じ図でも、分ける途中と戻って結合する途中を区別しよう。"),
  a("flow-trace", "分ける方向と、戻って結合する方向を追おう", "全5段階を一手ずつ確認しましょう。",
    "[7, 2, 5, 1]を1要素まで分け、整列済みの小さな結果から順に結合します。",
    "DIVIDE_COMBINE_TRACE", { levels: fullLevels, intervalMs: 2000, finalMessage: "すべての値を保ったまま[1, 2, 5, 7]が完成しました。" },
    "分割は上から下、結合は小さい結果から元の大きさへ戻るよ。"),
  choice("flow-order", "処理の順序として正しいものは？", "numbers=[4, 1, 3, 2]をマージソートします。停止条件の確認を含む、大まかな処理順を選びましょう。",
    ["1要素以下なら返す→それ以外は左右へ分けて整列→整列済みの左右を結合", "全体の最小を探す→先頭と交換→繰り返す", "左右を結合→1要素まで分ける→比較する"], 0,
    "左右を小さく分け、再帰から整列済みの左右を受け取り、その2列を結合します。",
    "結合するとき、左右が整列済みであるために何を先に終えるか考えましょう。"),
  choice("flow-transfer", "奇数個と重複でも、何が変わらない？", "[3, 1, 3, 2, 1]を処理します。右側が1要素多く、同じ値もあります。正しい説明を選びましょう。",
    ["重複する3と1は1つずつ消してよい", "左右の大きさが違うためマージできない", "値を全部残し、整列済みの先頭比較と残り追加を同じように行う"], 2,
    "奇数個でも左右へ漏れなく分け、重複も別々の値として追加します。結果は[1, 1, 2, 3, 3]です。",
    "分割後の個数と、結果に残す元の値の個数を確認しましょう。"),
], ["分割と結合の全体順", "再帰から戻る流れ", "奇数個・重複への適用"]);

const assemblyPrefix = code(
  "def merge_sort(numbers):",
  "    if len(numbers) <= 1:",
  "        return numbers",
  "    middle = len(numbers) // 2",
  "    left = merge_sort(numbers[:middle])",
  "    right = merge_sort(numbers[middle:])",
  "    merged = []",
  "    i = 0",
  "    j = 0",
);

const assemble = m("assemble", "マージソートのコードを組み立てよう", "既習の分割、再帰、結合を1つの関数として統合します。", [
  mapping("full-code", "図の流れと、関数全体を対応させよう", "新しい処理はありません。停止、分割、左右の再帰、先頭比較、残り追加の順に役割を確認します。",
    mergeSortAnswerCode, [
      { id: "base", label: "1要素以下で止める", lines: [1, 2, 3], role: "これ以上分けなくてよいリストを返す", state: "空または1要素が整列済みとして戻る" },
      { id: "divide", label: "左右へ分けて整列する", lines: [4, 5, 6], role: "境界を作り、左右の再帰結果を受け取る", state: "leftとrightは整列済み" },
      { id: "prepare", label: "結合の記録を準備", lines: [7, 8, 9], role: "結果と左右の位置を初期化", state: "merged=[]、i=0、j=0" },
      { id: "compare", label: "未使用の先頭を比較", lines: [10, 11, 12, 13, 14, 15, 16], role: "小さい側を追加し、その側だけ進める", state: "片方が空になるまでmergedが伸びる" },
      { id: "finish", label: "残りを追加して返す", lines: [17, 18, 19], role: "未使用部分をすべて末尾へ置く", state: "全値を小さい順にしたリストを返す" },
    ]),
  a("section-order", "5つの処理を実行順に並べよう", "関数の大きな処理単位を、実行される順に並べましょう。",
    "停止条件を最初に確認した後の処理です。左右が整列済みになる前に先頭比較はできません。",
    "BLOCK_ORDER", {
      question: "処理の順序を並べてください。",
      steps: [
        { id: "base", label: "1要素以下なら返す" },
        { id: "divide", label: "中央で左右へ分ける" },
        { id: "recurse", label: "左右を再帰的に整列する" },
        { id: "merge", label: "整列済みの先頭を比べて結合する" },
        { id: "rest", label: "残りを追加して結果を返す" },
      ],
      answerOrder: ["base", "divide", "recurse", "merge", "rest"],
      correctFeedback: "停止→分割→左右の整列→先頭比較→残り追加の順に整理できました。",
      incorrectFeedback: "先頭比較を始めるために、左右がどの状態である必要があるか確認しましょう。",
    }, "左右が整列済みになってから、2列の結合を始めるよ。", MissionActivityType.ORDERED_STEPS, "SYNTHESIS"),
  build("full-build", "結合部分を完成させよう", "停止、分割、左右の再帰、準備は完成しています。既習コードだけで、先頭比較、残り追加、返却までを統合します。",
    assemblyPrefix, [
      { label: "両方に未使用の値がある間", indent: 1 },
      { label: "左が小さいか等しい", indent: 2 },
      { label: "左を追加", indent: 3 },
      { label: "左の位置を進める", indent: 3 },
      { label: "右の方が小さい場合", indent: 2 },
      { label: "右を追加", indent: 3 },
      { label: "右の位置を進める", indent: 3 },
      { label: "左の残りを追加", indent: 1 },
      { label: "右の残りを追加", indent: 1 },
      { label: "結合結果を返す", indent: 1 },
    ], [
      ["while", "while i < len(left) and j < len(right):"], ["wrong-while", "while i < len(left) or j < len(right):"],
      ["if", "if left[i] <= right[j]:"], ["wrong-if", "if left[i] >= right[j]:"],
      ["append-left", "merged.append(left[i])"], ["inc-left", "i += 1"], ["else", "else:"],
      ["append-right", "merged.append(right[j])"], ["inc-right", "j += 1"],
      ["rest-left", "merged.extend(left[i:])"], ["rest-right", "merged.extend(right[j:])"],
      ["return", "return merged"], ["wrong-return", "return left + right"],
    ], ["while", "if", "append-left", "inc-left", "else", "append-right", "inc-right", "rest-left", "rest-right", "return"],
    "先頭比較、位置更新、残り追加、返却を統合し、マージソートの結合部分が完成しました。",
    "小さい側だけを進め、比較後に両方の未使用部分を追加してmergedを返します。"),
], ["マージソートのコード統合", "処理順", "既習コードの組み立て"]);

assemble.activities[0].content.learningRole = "SYNTHESIS";
assemble.activities[2].content.learningRole = "SYNTHESIS";

const exam = m("course-mission", "Course Mission：マージソートを自分で実装しよう", "分割、再帰、結合を使って関数を完成させ、7つのケースで確かめます。", [
  a("implementation", "マージソートで小さい順のリストを作ろう", "merge_sort(numbers)を完成させ、整数リストを小さい順にした新しいリストを返しましょう。",
    "numbersは整数リストです。入力のnumbers自体は変更せず、同じ値をすべて残した新しいリストを返します。空リストなら[]を返してください。左右へ分けてそれぞれをmerge_sortで整列し、整列済みの2列の先頭を比べて結合します。sorted()やsort()は使いません。関数名と引数名を保ち、passを置き換えてください。",
    "CODE_EDITOR", {
      evaluationMode: "TEST_CASES",
      functionName: "merge_sort",
      answerCode: mergeSortAnswerCode,
      starterCode: code("def merge_sort(numbers):", "    # 小さい順の新しいリストを返してください", "    pass"),
      forbiddenCode: [
        { snippet: "sorted(", label: "sortedではなく、分割と結合の手順を使いましょう。" },
        { snippet: ".sort(", label: "sortではなく、左右を整列して結合する手順を使いましょう。" },
      ],
      testCases: [
        { id: "basic", label: "基本：4要素を分割して結合", args: [[7, 2, 5, 1]], expected: [1, 2, 5, 7] },
        { id: "odd", label: "奇数個：左右の個数が違う", args: [[8, 3, 6, 2, 5]], expected: [2, 3, 5, 6, 8] },
        { id: "reverse", label: "逆順：毎段階で並べ直す", args: [[5, 4, 3, 2, 1]], expected: [1, 2, 3, 4, 5] },
        { id: "sorted", label: "整列済み：順番を保つ", args: [[1, 2, 3, 4]], expected: [1, 2, 3, 4] },
        { id: "duplicates", label: "重複：同じ値をすべて残す", args: [[3, 1, 3, 2, 1]], expected: [1, 1, 2, 3, 3] },
        { id: "negative", label: "負数：0より小さくても同じ比較", args: [[0, -4, 2, -1]], expected: [-4, -1, 0, 2] },
        { id: "empty", label: "空リスト：停止条件ですぐ返す", args: [[]], expected: [] },
      ],
      hints: [
        { id: "base", title: "停止条件と中央", body: "要素数が1以下ならそのリストを返します。2個以上ならmiddleを整数の境界として求めます。", code: code("if len(numbers) <= 1:", "    return numbers", "middle = len(numbers) // 2") },
        { id: "recurse", title: "左右を整列する", body: "分割しただけの左右ではなく、merge_sortの返り値をleftとrightへ記録します。", code: code("left = merge_sort(numbers[:middle])", "right = merge_sort(numbers[middle:])") },
        { id: "compare", title: "未使用の先頭を比べる", body: "iとjを0から始め、両方が範囲内の間だけleft[i]とright[j]を比べます。小さい側をappendし、その側の位置だけ進めます。" },
        { id: "remainder", title: "残りを追加して返す", body: "比較ループの後、left[i:]とright[j:]をmergedへextendします。片方は空でも構いません。最後にmergedを返します。" },
      ],
      courseResult: {
        masteryTitle: "マージソートをマスター",
        description: "マージソートコースを修了しました。",
        learningOutcome: "問題を左右へ分け、整列済みの結果を先頭比較で結合し、再帰的なマージソートを実装できるようになりました。",
      },
      correctFeedback: "7つのテストを通過しました。停止、分割、左右の再帰、先頭比較、残り追加を組み合わせて並べ替えられました。",
      incorrectFeedback: "未通過のケースで、停止条件、左右の境界、位置の更新、残りの追加、returnを見直しましょう。",
    }, "未通過のケースは、分割・比較・残り追加のどの段階か分けて直そう。", MissionActivityType.TRY_CODE, "COURSE_EXAM"),
], ["マージソートの自力実装", "テスト結果を使った修正"], MissionType.COURSE_EXAM);

exam.activities[0].actionLabel = "提出する";

export const mergeSortCourseSeed: CourseSeed = {
  id: "course-algorithm-merge-sort-v1",
  title: "マージソート",
  difficulty: CourseDifficulty.EASY,
  description: "リストを小さく分け、整列済みの部分を先頭から結合するマージソートを学びます。分割と結合を図で一手ずつ追い、再帰するPythonコードへつなげ、最後は自分で並べ替え関数を完成させます。",
  isInitiallyUnlocked: true,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.SORT],
  missions: [orientation, divide, recursion, merge, flow, assemble, exam].map((mission, index) => ({ ...mission, order: index + 1 })),
};
