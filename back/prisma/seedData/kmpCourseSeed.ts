/** KMP法Courseの唯一のseed定義。course designと同じ概念順で構成する。 */
import { CourseCategoryType, CourseDifficulty, MissionActivityType, MissionType } from "@prisma/client";
import type { ActivitySeed, CourseSeed, MissionSeed } from "./learningSeedTypes";

const noFeedback = { mode: "NONE" } as const;
const retryWithHint = { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 } as const;
const joinCode = (lines: string[]) => lines.join("\n");
const lpsCode = joinCode([
  "lps = [0] * len(pattern)", "length = 0", "i = 1", "while i < len(pattern):",
  "    if pattern[i] == pattern[length]:", "        length += 1", "        lps[i] = length", "        i += 1",
  "    elif length > 0:", "        length = lps[length - 1]", "    else:", "        lps[i] = 0", "        i += 1",
]);
const completeKmpCode = joinCode([
  "def kmp_search(text, pattern):", "    if pattern == \"\":", "        return 0", "",
  ...lpsCode.split("\n").map((line) => `    ${line}`), "", "    text_index = 0", "    pattern_index = 0",
  "    while text_index < len(text):", "        if text[text_index] == pattern[pattern_index]:",
  "            text_index += 1", "            pattern_index += 1", "            if pattern_index == len(pattern):",
  "                return text_index - pattern_index", "        elif pattern_index > 0:",
  "            pattern_index = lps[pattern_index - 1]", "        else:", "            text_index += 1", "    return -1",
]);

const labels = {
  text: "長い文字列 =", pattern: "探す文字列 =", alignmentStart: "開始位置",
  textPointer: "比較位置", patternPointer: "比較位置", textActive: "比較する文字",
  patternActive: "比較する文字", textMatched: "一致", patternMatched: "一致", lpsTable: "LPS表",
};
const codeLabels = {
  ...labels, text: "text（長い文字列）", pattern: "pattern（探す文字列）",
  textPointer: "text_index（次に比べる位置）", patternPointer: "pattern_index（次に比べる位置）",
};

type ActivityArgs = {
  id: string; type?: MissionActivityType; title: string; instruction: string; mentorMessage: string;
  rendererKey: ActivitySeed["content"]["rendererKey"]; data: Record<string, unknown>;
  learningRole?: ActivitySeed["content"]["learningRole"];
  feedbackPolicy?: ActivitySeed["content"]["feedbackPolicy"]; actionLabel?: string;
};
const activity = ({ id, type = MissionActivityType.VIEW, title, instruction, mentorMessage, rendererKey, data, learningRole = "EXPLANATION", feedbackPolicy = noFeedback, actionLabel }: ActivityArgs): ActivitySeed => ({
  id, type, title, instruction, mentorMessage,
  content: { learningRole, rendererKey, feedbackPolicy, data }, preview: null,
  actionLabel: actionLabel ?? (type === MissionActivityType.VIEW ? "次へ" : "答えを確認する"), order: 0,
});
const mission = (value: Omit<MissionSeed, "activities"> & { activities: ActivitySeed[] }): MissionSeed => ({
  ...value,
  activities: value.activities.map((item, index) => ({
    ...item, order: index + 1,
    actionLabel: index === value.activities.length - 1 && item.type === MissionActivityType.VIEW ? "Missionを完了" : item.actionLabel,
  })),
});

const missionOne = mission({
  id: "algorithm-kmp-orientation", title: "文字列探索とKMP法を知ろう",
  description: "文字列探索の目的と利用場面を知り、調べ直しを減らすKMP法を学ぶ理由を確認します。",
  difficulty: CourseDifficulty.EASY, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=KMP+Introduction",
  estimatedMinutes: 6, order: 1, type: MissionType.MAIN, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 60,
  learnedItems: ["文字列探索の目的", "文字列探索の利用場面", "KMP法を学ぶ理由", "コースの学習順序"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-orientation-problem", title: "文字の並びを見つけよう", instruction: "長い文字列から目的の短い文字列を見つける、文字列探索の目的を確認しましょう。", mentorMessage: "長い文字列の中から目的の並びを見つける処理が文字列探索だよ。", rendererKey: "STRING_ALIGNMENT_TRACE", learningRole: "ORIENTATION", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: false, showPointers: false, showStateLabels: false, steps: [{ textIndex: 6, patternIndex: 4, patternStart: 2, matchedPatternIndices: [0, 1, 2, 3], message: "長い文字列ABABACには、探す文字列ABACが3文字目から続いています。" }] } }),
    activity({ id: "algorithm-kmp-orientation-use-cases", title: "文字列探索はどこで使われる？", instruction: "文字列探索が使われる場面を確認しましょう。", mentorMessage: "文書からDNAまで、長いデータから並びを探す場面はたくさんあるね。", rendererKey: "TEXT", learningRole: "ORIENTATION", data: { body: "完全に同じ文字の並びを、長い文字列の中から探す処理です。", listItems: ["文書やWebページのキーワード検索", "エディタ内のコード検索", "DNA配列の検索", "ログのエラー検索"] } }),
    activity({ id: "algorithm-kmp-orientation-kmp", title: "調べ直しを減らすKMP法を知ろう", instruction: "単純な探索の調べ直しと、KMP法が目指す改善を知りましょう。", mentorMessage: "一度分かった一致を使って、不要な調べ直しを減らすのがKMP法だよ。", rendererKey: "TEXT", learningRole: "ORIENTATION", data: { body: "単純な文字列探索は、不一致のたびに探す文字列を1文字ずらし、すでに見た文字を再び比べる場合があります。KMP法は、一致した情報を利用して不要な再比較を減らします。", emphasis: "KMP法：一致した情報を利用する文字列探索" } }),
    activity({ id: "algorithm-kmp-orientation-roadmap", title: "このコースで学ぶこと", instruction: "文字比較からPython実装までの学習順を確認しましょう。", mentorMessage: "KMP法を学んで、効率的な文字列探索を実装しよう！", rendererKey: "LEARNING_ROADMAP", learningRole: "ORIENTATION", data: { body: "文字列、リスト、添字、if文、while文、len、関数、returnの基本を使います。", roadmapSteps: ["文字を順番に比べる", "不一致後に使える並びを見つける", "LPS表へ記録する", "LPS表を検索に使う", "前の値を使ってLPS表を作る", "KMPコードを組み立てる", "テストで完成させる"], emphasis: "ゴール：KMP法を説明し、Pythonで実装する" } }),
  ],
});

const missionTwo = mission({
  id: "algorithm-kmp-naive-search", title: "文字を順番に比べて探そう",
  description: "textとpatternを1文字ずつ比較し、不一致後に1文字ずつずらす単純な探索を実行します。",
  difficulty: CourseDifficulty.EASY, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Naive+String+Search",
  estimatedMinutes: 14, order: 2, type: MissionType.MAIN, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 140,
  learnedItems: ["textとpatternの配置", "現在比較する2文字", "一致時と不一致時の更新", "単純探索のPythonコード", "再比較"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-naive-context", title: "textとpatternを配置しよう", instruction: "長い文字列と探す文字列を区別しましょう。", mentorMessage: "patternの先頭をtextのどこへ重ねるかで配置が決まるよ。", rendererKey: "TEXT", data: { body: "長い文字列をtext、探す文字列をpatternと呼びます。最初は両方の先頭を重ねます。", comparison: { headers: ["名前", "役割", "今回の値"], rows: [{ cells: ["text", "長い文字列", "ABABAC"] }, { cells: ["pattern", "探す文字列", "ABAC"] }] } } }),
    activity({ id: "algorithm-kmp-naive-compare", title: "現在の2文字を比べよう", instruction: "同じ位置に重なるtextとpatternの文字を比べましょう。", mentorMessage: "縦に重なる2文字を左から比べるよ。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: false, showPointers: false, showStateLabels: false, steps: [{ textIndex: 0, patternIndex: 0, patternStart: 0, matchedPatternIndices: [], message: "最初はAとAを比べます。" }, { textIndex: 1, patternIndex: 1, patternStart: 0, matchedPatternIndices: [0], message: "一致したので次はB同士です。" }] } }),
    activity({ id: "algorithm-kmp-naive-match-code", title: "一致時のコードを確認しよう", instruction: "一致したときに2つの確認位置を進めるコードを確認しましょう。", mentorMessage: "一致したらtext側とpattern側を一緒に進めるよ。", rendererKey: "CODE_STATE_MAPPING", learningRole: "CODE_MAPPING", data: { body: "text_indexとpattern_indexは次に比べる位置です。", code: joinCode(["if text[text_index] == pattern[pattern_index]:", "    text_index += 1", "    pattern_index += 1"]), mappings: [{ id: "compare", label: "2文字を比較", lines: [1], role: "現在の文字を比べる", state: "AとAは一致" }, { id: "advance", label: "両方を進める", lines: [2, 3], role: "次の2文字を指す", state: "両方を1増やす" }] } }),
    activity({ id: "algorithm-kmp-naive-shift", title: "不一致なら1文字ずらそう", instruction: "単純な探索の不一致後の動きを確認しましょう。", mentorMessage: "不一致ならpatternを1文字ずらして先頭から比べ直すよ。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, message: "ABAまで一致し、BとCが不一致です。" }, { textIndex: 1, patternIndex: 0, patternStart: 1, matchedPatternIndices: [], mismatch: true, message: "開始位置1へずらすとBとAが不一致です。" }, { textIndex: 2, patternIndex: 0, patternStart: 2, matchedPatternIndices: [], message: "開始位置2ではA同士が重なります。" }] } }),
    activity({ id: "algorithm-kmp-naive-practice", type: MissionActivityType.SELECT_FILL, title: "単純な探索を進めよう", instruction: "比較結果から次の操作を選びましょう。", mentorMessage: "一致なら両方、不一致なら開始位置を1つ進めるよ。", rendererKey: "STRING_SEARCH_DECISION_SEQUENCE", learningRole: "GUIDED_PRACTICE", feedbackPolicy: retryWithHint, data: { labels, question: "次の操作を選んでください。", sequenceQuestions: [{ question: "AとAが一致しました。", options: [{ id: "both", label: "2つの位置を進める" }, { id: "shift", label: "patternをずらす" }, { id: "text-only", label: "text側だけ進める" }] }, { question: "BとCが不一致です。", options: [{ id: "shift2", label: "開始位置を1つ進める" }, { id: "both2", label: "2つの位置を進める" }, { id: "keep", label: "同じ2文字をもう一度比べる" }] }], correctAnswers: ["both", "shift2"], visualizationStates: [{ text: "ABABAC", pattern: "ABAC", textIndex: 0, patternIndex: 0, patternStart: 0, matchedPatternIndices: [], message: "AとAを比較します。" }, { text: "ABABAC", pattern: "ABAC", textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, message: "BとCが不一致です。" }], correctFeedback: "単純な探索を進められました。", incorrectFeedback: "一致か不一致かを確認しましょう。" } }),
    activity({ id: "algorithm-kmp-naive-code-practice", type: MissionActivityType.SELECT_FILL, title: "単純な探索のコードを組み立てよう", instruction: "一致時と不一致時のコードブロックを配置しましょう。", mentorMessage: "比較結果に応じて、両方を進めるか開始位置を進めるかを分けよう。", rendererKey: "CODE_FILL", learningRole: "GUIDED_PRACTICE", feedbackPolicy: retryWithHint, data: { body: "startはpatternを重ねるtextの開始位置です。", question: "2つのブロックを配置してください。", codePreviewPrefix: "if text[text_index] == pattern[pattern_index]:", builderInstruction: "一致時と不一致時の更新を配置します", builderSlots: [{ label: "一致した", indent: 1 }, { label: "不一致だった", indent: 0 }], codeBlocks: [{ id: "match", label: "text_index += 1\npattern_index += 1" }, { id: "mismatch", label: "else:\n    start += 1\n    text_index = start\n    pattern_index = 0" }, { id: "wrong", label: "text_index = 0" }], correctAnswers: ["match", "mismatch"], executionResult: "一致なら両方、不一致なら次の開始位置", correctFeedback: "単純な探索の分岐を組み立てられました。", incorrectFeedback: "不一致では次の開始位置からpattern先頭を重ねます。" } }),
    activity({ id: "algorithm-kmp-naive-repeat", title: "同じ文字を調べ直す場面を見よう", instruction: "単純な探索で同じtextの文字が再び比較される場面を確認しましょう。", mentorMessage: "開始位置2ではtext[2]のAをもう一度比べることになるね。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 2, patternIndex: 2, patternStart: 0, matchedPatternIndices: [0, 1], message: "開始位置0でtext[2]のAとpattern[2]のAを比較済みです。" }, { textIndex: 2, patternIndex: 0, patternStart: 2, matchedPatternIndices: [], message: "開始位置2では同じtext[2]のAをpattern[0]のAと再比較します。" }], finalMessage: "この再比較を減らすことが次の課題です。" } }),
  ],
});

const missionThree = mission({
  id: "algorithm-kmp-reusable-part", title: "不一致後に残せる並びを見つけよう",
  description: "単純探索の再比較を確認し、patternの先頭と末尾の一致を事前記録する理由を組み立てます。",
  difficulty: CourseDifficulty.NORMAL, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Reusable+Match",
  estimatedMinutes: 13, order: 3, type: MissionType.MAIN, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 130,
  learnedItems: ["単純探索の再比較", "除外できる開始位置", "事前記録が必要な理由", "接頭辞と接尾辞"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-reuse-bridge", title: "不一致後の調べ直しを振り返ろう", instruction: "ABAまで一致した後の単純探索を確認しましょう。", mentorMessage: "単純探索は不一致後に開始位置を1つずつ試すよ。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, message: "ABAまで一致し、BとCが不一致です。" }, { textIndex: 1, patternIndex: 0, patternStart: 1, matchedPatternIndices: [], mismatch: true, message: "単純探索は開始位置1からpattern先頭を比べます。" }] } }),
    activity({ id: "algorithm-kmp-reuse-start-one", title: "開始位置1を除外しよう", instruction: "開始位置1で最初に重なる文字を確認しましょう。", mentorMessage: "BとAが異なるので、この配置ではpattern全体が一致しないね。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 1, patternIndex: 0, patternStart: 1, matchedPatternIndices: [], mismatch: true, message: "開始位置1ではtext[1]のBとpattern[0]のAが不一致です。" }] } }),
    activity({ id: "algorithm-kmp-reuse-start-two", title: "開始位置2ではAを再比較する", instruction: "単純探索が開始位置2で実際に実行する比較を確認しましょう。", mentorMessage: "記録がない単純探索は、A同士のif判定をもう一度行うよ。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 2, patternIndex: 0, patternStart: 2, matchedPatternIndices: [], message: "開始位置2ではtext[2]のAとpattern[0]のAを実際に再比較します。" }, { textIndex: 3, patternIndex: 1, patternStart: 2, matchedPatternIndices: [0], message: "Aが一致してからB同士へ進みます。" }] } }),
    activity({ id: "algorithm-kmp-reuse-question", title: "再比較前に分かることを整理しよう", instruction: "A同士を再比較せず判断するために必要な2つの事実を確認しましょう。", mentorMessage: "検索で確認した一致と、pattern内の一致を組み合わせるのが手がかりだよ。", rendererKey: "TEXT", data: { body: "開始位置0の比較でtext[2] = pattern[2]と確認済みです。さらに検索前にpattern[2] = pattern[0]を記録できれば、text[2] = pattern[0]と判断できます。単純探索はこの記録を持たないため再比較します。", comparison: { headers: ["事実", "いつ分かるか"], rows: [{ cells: ["text[2] = pattern[2]", "検索中に実際に比較した"] }, { cells: ["pattern[2] = pattern[0]", "patternを検索前に調べられる"] }] }, conclusion: "pattern内の一致を事前記録できれば、検索時の再比較を省けます。" } }),
    activity({ id: "algorithm-kmp-reuse-alignment", title: "次の配置に残るAを確認しよう", instruction: "開始位置2へ配置したとき、どのAが同じtext位置に重なるか確認しましょう。", mentorMessage: "一致済みABAの末尾Aとpattern先頭Aがtext[2]へ重なるよ。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, message: "最初の配置ではABAを比較して一致しました。" }, { textIndex: 3, patternIndex: 1, patternStart: 2, matchedPatternIndices: [0], message: "開始位置2では末尾Aと先頭Aがtext[2]に重なります。事前記録があればAを一致済みとしてB同士から続けられます。" }] } }),
    activity({ id: "algorithm-kmp-reuse-terms", title: "接頭辞と接尾辞を知ろう", instruction: "2文字残せる例で、先頭側と末尾側の呼び方を確認しましょう。", mentorMessage: "ABABでは先頭ABと末尾ABが同じ2文字の並びだよ。", rendererKey: "PREFIX_SUFFIX_EXPLANATION", data: { presentationMode: "TERMS", pattern: "ABAB", rangeLength: 4, candidates: [{ prefix: "AB", suffix: "AB", length: 2, isMatch: true }], longest: "AB", longestLength: 2, labels: { pattern: "以前に一致した並び", prefix: "接頭辞（先頭側）", suffix: "接尾辞（末尾側）" } } }),
    activity({ id: "algorithm-kmp-reuse-practice", type: MissionActivityType.SELECT_FILL, title: "残せる並びを選ぼう", instruction: "先頭側と末尾側で同じ最長の並びを選びましょう。", mentorMessage: "次の配置に残せるのは先頭と末尾で同じ並びだよ。", rendererKey: "SEQUENTIAL_CHOICE", learningRole: "INDEPENDENT_PRACTICE", feedbackPolicy: retryWithHint, data: { question: "ABCABで次の配置に残せる最長の並びは？", sequenceQuestions: [{ question: "先頭側と末尾側で同じ並びを選んでください。", options: [{ id: "ab", label: "AB" }, { id: "a", label: "A" }, { id: "abc", label: "ABC" }] }], correctAnswers: ["ab"], correctFeedback: "先頭ABと末尾ABが一致します。", incorrectFeedback: "同じ文字数の先頭側と末尾側を比べましょう。" } }),
  ],
});

const missionFour = mission({
  id: "algorithm-kmp-lps-meaning", title: "使える文字数をLPS表へ記録しよう",
  description: "pattern全文の各位置までを調べ、次の配置に残せる最大文字数をLPS表へ記録します。",
  difficulty: CourseDifficulty.NORMAL, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=LPS+Table+Meaning",
  estimatedMinutes: 13, order: 4, type: MissionType.MAIN, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 130,
  learnedItems: ["LPS値", "範囲の長さm", "比較する文字数x", "LPS表の添字と範囲", "LPS表の手計算"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-lps-bridge", title: "残せる最大文字数をLPS値と呼ぼう", instruction: "前Missionで見つけた『次の配置に残せる並び』を数で表しましょう。", mentorMessage: "次の配置に残せる最長の文字数がLPS値なんだね。", rendererKey: "PREFIX_SUFFIX_EXPLANATION", data: { presentationMode: "REUSE", pattern: "ABABC", rangeLength: 3, candidates: [{ prefix: "A", suffix: "A", length: 1, isMatch: true }], longest: "A", longestLength: 1, labels: { pattern: "pattern全文（色付き部分が今回の範囲）", prefix: "先頭側", suffix: "末尾側", longestLength: "LPS値" } } }),
    activity({ id: "algorithm-kmp-lps-definition", title: "LPS値の求め方を知ろう", instruction: "比較できる文字数の上限を確認してから、すべての候補を比べましょう。", mentorMessage: "文字列全体は候補から外し、残りの候補で最長の一致を選ぶよ。", rendererKey: "PREFIX_SUFFIX_EXPLANATION", data: { presentationMode: "CALCULATION", showRulePhase: true, pattern: "ABABC", rangeLength: 3, candidates: [{ prefix: "AB", suffix: "BA", length: 2, isMatch: false }, { prefix: "A", suffix: "A", length: 1, isMatch: true }], longest: "A", longestLength: 1, labels: { pattern: "pattern全文（色付き部分を調べる）", prefix: "先頭側", suffix: "末尾側", longestLength: "LPS値" } } }),
    activity({ id: "algorithm-kmp-lps-two-lengths", title: "mとxを区別しよう", instruction: "pattern全文から取る範囲mと、その先頭・末尾から比較する文字数xを確認しましょう。", mentorMessage: "mは調べる範囲、xはその範囲の両端から取る同じ文字数だよ。", rendererKey: "PREFIX_SUFFIX_EXPLANATION", data: { presentationMode: "LENGTHS", pattern: "ABABC", rangeLength: 3, candidates: [{ prefix: "AB", suffix: "BA", length: 2, isMatch: false }, { prefix: "A", suffix: "A", length: 1, isMatch: true }], longest: "A", longestLength: 1, labels: { pattern: "pattern全文（先頭m文字が今回の範囲）", prefix: "先頭側", suffix: "末尾側", excludedWholeRange: "x = m は範囲全体どうしになるため比較しない" } } }),
    activity({ id: "algorithm-kmp-lps-one-value", title: "m=4のLPS値を求めよう", instruction: "pattern ABABCの先頭4文字ABABについてLPS値を求めましょう。", mentorMessage: "ABABでは先頭ABと末尾ABが一致するのでLPS値は2だよ。", rendererKey: "PREFIX_SUFFIX_EXPLANATION", data: { presentationMode: "CALCULATION", showRulePhase: false, pattern: "ABABC", rangeLength: 4, candidates: [{ prefix: "ABA", suffix: "BAB", length: 3, isMatch: false }, { prefix: "AB", suffix: "AB", length: 2, isMatch: true }, { prefix: "A", suffix: "B", length: 1, isMatch: false }], longest: "AB", longestLength: 2, labels: { pattern: "pattern全文（先頭4文字を調べる）", prefix: "先頭側", suffix: "末尾側", longestLength: "LPS値" } } }),
    activity({ id: "algorithm-kmp-lps-table-map", title: "LPSの添字と範囲を対応させよう", instruction: "LPS[i]とpatternの先頭からiまでの範囲を対応させましょう。", mentorMessage: "LPS[i]にはpattern[0]からpattern[i]までを調べた値を入れるよ。", rendererKey: "TEXT", data: { body: "patternの位置iまでにはi+1文字あります。LPS[i]にはpattern[0]からpattern[i]までの範囲で求めたLPS値を記録します。", comparison: { headers: ["LPS表のマス", "対応する範囲", "範囲の長さm"], rows: [{ cells: ["LPS[0]", "pattern[0]", "1"] }, { cells: ["LPS[1]", "pattern[0..1]", "2"] }, { cells: ["LPS[2]", "pattern[0..2]", "3"] }, { cells: ["LPS[4]", "pattern[0..4]", "5"] }] }, conclusion: "LPSの添字iと今回の範囲の末尾位置iは一致します。" } }),
    activity({ id: "algorithm-kmp-lps-table-trace", title: "ABABCのLPS表を作ろう", instruction: "pattern全文を表示したまま、今回の範囲を1文字ずつ広げましょう。", mentorMessage: "全文の中で今どこまでを調べているか確認しながら記録しよう。", rendererKey: "PREFIX_TABLE_TRACE", data: { pattern: "ABABC", mode: "MEANING", stepGranularity: "RANGE", showIndices: true, labels: { currentRange: "今回調べる範囲", lpsTable: "LPS表" }, steps: [{ endIndex: 0, rangeLength: 1, overlapLength: 0, overlapText: "", candidates: [], lps: [0, null, null, null, null], message: "Aには比較候補がないためLPS[0]=0です。" }, { endIndex: 1, rangeLength: 2, overlapLength: 0, overlapText: "", candidates: [{ prefix: "A", suffix: "B", length: 1, isMatch: false }], lps: [0, 0, null, null, null], message: "ABはAとBが異なるためLPS[1]=0です。" }, { endIndex: 2, rangeLength: 3, overlapLength: 1, overlapText: "A", candidates: [{ prefix: "AB", suffix: "BA", length: 2, isMatch: false }, { prefix: "A", suffix: "A", length: 1, isMatch: true }], lps: [0, 0, 1, null, null], message: "ABAはAが一致するためLPS[2]=1です。" }, { endIndex: 3, rangeLength: 4, overlapLength: 2, overlapText: "AB", candidates: [{ prefix: "ABA", suffix: "BAB", length: 3, isMatch: false }, { prefix: "AB", suffix: "AB", length: 2, isMatch: true }, { prefix: "A", suffix: "B", length: 1, isMatch: false }], lps: [0, 0, 1, 2, null], message: "ABABはABが一致するためLPS[3]=2です。" }, { endIndex: 4, rangeLength: 5, overlapLength: 0, overlapText: "", candidates: [{ prefix: "ABAB", suffix: "BABC", length: 4, isMatch: false }, { prefix: "ABA", suffix: "ABC", length: 3, isMatch: false }, { prefix: "AB", suffix: "BC", length: 2, isMatch: false }, { prefix: "A", suffix: "C", length: 1, isMatch: false }], lps: [0, 0, 1, 2, 0], message: "ABABCには一致候補がないためLPS[4]=0です。" }], finalMessage: "ABABCのLPS表は[0, 0, 1, 2, 0]です。" } }),
    activity({ id: "algorithm-kmp-lps-practice", type: MissionActivityType.SELECT_FILL, title: "別のpatternのLPS値を求めよう", instruction: "調べる範囲と候補からLPS値を選びましょう。", mentorMessage: "一致した候補のうち最も大きいxを記録しよう。", rendererKey: "SEQUENTIAL_CHOICE", learningRole: "INDEPENDENT_PRACTICE", feedbackPolicy: retryWithHint, data: { question: "LPS値を選んでください。", sequenceQuestions: [{ question: "pattern=ABCAB、m=5。x=2のABとABが一致します。", options: [{ id: "two", label: "2" }, { id: "one", label: "1" }, { id: "five", label: "5" }] }, { question: "pattern=ABCD、m=4。x=3、2、1がすべて不一致です。", options: [{ id: "zero", label: "0" }, { id: "three", label: "3" }, { id: "four", label: "4" }] }], correctAnswers: ["two", "zero"], correctFeedback: "LPS値を求められました。", incorrectFeedback: "一致した候補の最大文字数を確認しましょう。" } }),
  ],
});

const missionFive = mission({
  id: "algorithm-kmp-use-lps", title: "LPS表を使って検索を続けよう",
  description: "検索中の不一致でLPS表を参照し、textを戻さずにpatternの次の配置を決めます。",
  difficulty: CourseDifficulty.NORMAL, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Use+LPS+In+Search",
  estimatedMinutes: 16, order: 5, type: MissionType.MAIN, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 160,
  learnedItems: ["LPS表の参照位置", "pattern_indexの更新", "次の配置の導出", "発見位置"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-use-lps-bridge", title: "不一致後に使うLPS値を見つけよう", instruction: "ABAまで一致した検索場面で、LPS表のどの値を使うか確認しましょう。", mentorMessage: "最後に一致したpattern[2]に対応するLPS[2]を使うよ。", rendererKey: "STRING_SEARCH_FALLBACK_TRACE", data: { text: "ABABAC", pattern: "ABAC", lps: [0, 0, 1, 0], labels, showIndices: true, showPointers: false, showStateLabels: false, steps: [{ textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, lpsActiveIndex: 2, message: "ABAまで一致してBとCが不一致です。最後に一致した位置2のLPS[2]=1を使います。" }] } }),
    activity({ id: "algorithm-kmp-use-lps-index", title: "pattern_indexをLPS値へ戻そう", instruction: "LPS[2]=1を次に比べるpatternの位置として使いましょう。", mentorMessage: "text_indexは3のまま、pattern_indexだけ1へ戻すよ。", rendererKey: "CODE_STATE_MAPPING", learningRole: "CODE_MAPPING", data: { body: "不一致位置pattern_indexは3です。最後に一致した位置は3-1=2なのでLPS[2]=1を読みます。", code: joinCode(["elif pattern_index > 0:", "    pattern_index = lps[pattern_index - 1]"]), mappings: [{ id: "condition", label: "一致済み文字がある", lines: [1], role: "LPS表を使える", state: "pattern_index=3" }, { id: "lookup", label: "最後に一致した位置を参照", lines: [2], role: "LPS[2]を読む", state: "pattern_index=1、text_index=3のまま" }] } }),
    activity({ id: "algorithm-kmp-use-lps-proof", title: "Aを再比較しなくてよい理由を確認しよう", instruction: "検索中の一致とLPS値が保証する一致を組み合わせましょう。", mentorMessage: "text[2]とpattern[2]は比較済みで、LPS[2]がpattern[2]とpattern[0]の一致を保証するよ。", rendererKey: "TEXT", data: { body: "検索でtext[2] = pattern[2]を確認済みです。LPS[2]=1はpattern[2] = pattern[0]を検索前に記録した値です。したがってtext[2] = pattern[0]であり、次の配置のAはif文で再比較せず一致済みとして扱えます。", conclusion: "配置だけで省略するのではなく、検索中の一致と事前計算したLPS値が根拠です。" } }),
    activity({ id: "algorithm-kmp-use-lps-next", title: "次の配置でB同士を比べよう", instruction: "Aを一致済みとして残し、次に実行する比較を図で確認しましょう。", mentorMessage: "開始位置2でAを残し、text[3]のBとpattern[1]のBから続けるよ。", rendererKey: "STRING_SEARCH_FALLBACK_TRACE", data: { text: "ABABAC", pattern: "ABAC", lps: [0, 0, 1, 0], labels: codeLabels, showIndices: true, showPointers: true, showStateLabels: false, steps: [{ textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, lpsActiveIndex: 2, message: "不一致前は開始位置0でABAまで一致しています。" }, { textIndex: 3, patternIndex: 1, patternStart: 2, matchedPatternIndices: [0], message: "LPS[2]=1により開始位置2でAを一致済みとして残し、B同士を次に比べます。" }] } }),
    activity({ id: "algorithm-kmp-use-lps-alignment", title: "次の開始位置を式で確かめよう", instruction: "text_index=3、pattern_index=1の配置を図と式で対応させましょう。", mentorMessage: "pattern[1]がtext[3]に重なるので、pattern先頭はtext[2]に重なるよ。", rendererKey: "STRING_ALIGNMENT_TRACE", data: { text: "ABABAC", pattern: "ABAC", lps: [0, 0, 1, 0], labels: codeLabels, showIndices: true, showPointers: true, showStateLabels: false, steps: [{ textIndex: 3, patternIndex: 1, patternStart: 2, matchedPatternIndices: [0], message: "次に比べる位置はtext[3]とpattern[1]です。patternの開始位置は3-1=2です。コードで開始位置を2増やすのではなく、pattern_indexを1へ変えた結果としてこの配置になります。" }] } }),
    activity({ id: "algorithm-kmp-use-lps-zero", title: "先頭で不一致ならtextだけ進めよう", instruction: "pattern_index=0で不一致の場合をLPS表とともに確認しましょう。", mentorMessage: "pattern先頭で不一致なら残せる文字はないので、text_indexだけ進めるよ。", rendererKey: "STRING_SEARCH_FALLBACK_TRACE", data: { text: "ZABAC", pattern: "ABAC", lps: [0, 0, 1, 0], labels: codeLabels, showIndices: true, showPointers: true, showStateLabels: false, steps: [{ textIndex: 0, patternIndex: 0, patternStart: 0, matchedPatternIndices: [], mismatch: true, lpsActiveIndex: 0, message: "pattern_index=0でZとAが不一致です。LPS[0]=0で残せる一致がないためtext_indexを1へ進めます。" }, { textIndex: 1, patternIndex: 0, patternStart: 1, matchedPatternIndices: [], message: "次はtext[1]のAとpattern[0]のAを比べます。" }] } }),
    activity({ id: "algorithm-kmp-use-lps-full", title: "先頭からLPS表を使って検索しよう", instruction: "text[0]とpattern[0]から始め、不一致後の配置変更を含めて発見まで追いましょう。", mentorMessage: "最初から比較し、不一致になったところでLPS表が働くよ。", rendererKey: "STRING_SEARCH_FULL_TRACE", data: { text: "ABABAC", pattern: "ABAC", lps: [0, 0, 1, 0], labels: codeLabels, code: joinCode(["if text[text_index] == pattern[pattern_index]:", "    text_index += 1", "    pattern_index += 1", "elif pattern_index > 0:", "    pattern_index = lps[pattern_index - 1]", "else:", "    text_index += 1"]), steps: [{ textIndex: 0, patternIndex: 0, patternStart: 0, matchedPatternIndices: [], activeCodeLines: [1], message: "text[0]とpattern[0]から比較を始めます。" }, { textIndex: 3, patternIndex: 3, patternStart: 0, matchedPatternIndices: [0, 1, 2], mismatch: true, lpsActiveIndex: 2, activeCodeLines: [4, 5], message: "ABAの後で不一致になりLPS[2]=1を使います。" }, { textIndex: 3, patternIndex: 1, patternStart: 2, matchedPatternIndices: [0], activeCodeLines: [1], message: "開始位置2でAを残しB同士から続けます。" }, { textIndex: 6, patternIndex: 4, patternStart: 2, matchedPatternIndices: [0, 1, 2, 3], activeCodeLines: [1, 2, 3], message: "ABAC全体が一致しました。開始位置は6-4=2です。" }], finalMessage: "index 2でpatternを発見しました。" } }),
    activity({ id: "algorithm-kmp-use-lps-code", type: MissionActivityType.SELECT_FILL, title: "検索中の不一致コードを組み立てよう", instruction: "pattern_indexに応じた2種類の不一致処理を配置しましょう。", mentorMessage: "一致済み文字があればLPS値、なければtext側だけを進めるよ。", rendererKey: "CODE_FILL", learningRole: "GUIDED_PRACTICE", feedbackPolicy: retryWithHint, data: { body: "一致時の処理は完成済みです。", question: "不一致処理を配置してください。", codePreviewPrefix: "elif pattern_index > 0:", builderInstruction: "2種類の不一致処理を配置します", builderSlots: [{ label: "一致済み文字がある", indent: 1 }, { label: "pattern先頭で不一致", indent: 0 }, { label: "text側を進める", indent: 1 }], codeBlocks: [{ id: "fallback", label: "pattern_index = lps[pattern_index - 1]" }, { id: "else", label: "else:" }, { id: "text", label: "text_index += 1" }, { id: "wrong", label: "text_index -= 1" }], correctAnswers: ["fallback", "else", "text"], executionResult: "textを戻さず次の比較へ", correctFeedback: "KMP検索の不一致処理を完成できました。", incorrectFeedback: "pattern_indexが0より大きい場合だけLPS表を使います。" } }),
  ],
});

const missionSix = mission({
  id: "algorithm-kmp-build-lps",
  title: "前のLPS値を使って効率よく表を作ろう",
  description: "前に求めたLPS値を利用し、一致時・不一致時の3つの更新規則でLPS表を効率よく作ります。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Build+LPS",
  estimatedMinutes: 14,
  order: 6,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 140,
  learnedItems: ["前のLPS値を使う理由", "一致時の更新", "不一致時の候補変更", "候補がない不一致", "LPS表作成コード"],
  isPublished: true,
  activities: [
    activity({
      id: "algorithm-kmp-build-cost",
      title: "毎回すべて調べる必要はある？",
      instruction: "これまでの求め方と、前のLPS値を使う求め方を比べましょう。",
      mentorMessage: "前の位置までに分かった一致を、次の位置でも利用できそうだね。",
      rendererKey: "TEXT",
      data: {
        body: "前のMissionでは、先頭と末尾から取る文字数を変え、すべての候補を比較してLPS値を求めました。しかし、LPS表には前の位置までに分かった一致がすでに記録されています。",
        comparison: {
          headers: ["これまで", "これから"],
          rows: [
            { cells: ["各位置ですべての候補を調べる", "前のLPS値が示す一致から続きを調べる"] },
            { cells: ["同じ部分を何度も確認する", "新しく増えた末尾との比較を中心に進める"] },
          ],
        },
        conclusion: "前のLPS値を利用し、必要な比較だけで次の値を求めます。",
      },
    }),
    activity({
      id: "algorithm-kmp-build-extend",
      title: "一致したら1文字伸ばそう",
      instruction: "すでに分かっている一致の次の2文字を比べ、LPS値を更新しましょう。",
      mentorMessage: "Aの次にあるB同士も一致したので、使える部分をABへ伸ばせるよ。",
      rendererKey: "PREFIX_TABLE_TRACE",
      data: {
        pattern: "ABAB",
        mode: "BUILD",
        showIndices: true,
        labels: { lpsTable: "ここまでに作ったLPS表" },
        steps: [{
          index: 3,
          length: 1,
          lengthAfter: 2,
          nextIndex: 4,
          action: "EXTEND",
          comparisonResult: "MATCH",
          lps: [0, 0, 1, 2],
          message: "B同士が一致したため、LPS[3]へ2を記録します。",
        }],
      },
    }),
    activity({
      id: "algorithm-kmp-build-zero",
      title: "候補がない不一致は0にしよう",
      instruction: "一致している候補がない状態で不一致になったときの更新を確認しましょう。",
      mentorMessage: "これ以上短い候補へ戻れないので、0を記録して次へ進むよ。",
      rendererKey: "PREFIX_TABLE_TRACE",
      data: {
        pattern: "AB",
        mode: "BUILD",
        showIndices: true,
        labels: { lpsTable: "ここまでに作ったLPS表" },
        steps: [{
          index: 1,
          length: 0,
          lengthAfter: 0,
          nextIndex: 2,
          action: "RECORD_ZERO",
          comparisonResult: "MISMATCH",
          lps: [0, 0],
          message: "AとBが不一致で候補もないため、LPS[1]へ0を記録します。",
        }],
      },
    }),
    activity({
      id: "algorithm-kmp-build-fallback",
      title: "不一致なら短い候補へ戻ろう",
      instruction: "候補ABAの次で不一致になったとき、前のLPS値から次の候補を選びましょう。",
      mentorMessage: "LPS[2]=1を使い、候補をABAからAへ戻して同じ末尾を調べ直すよ。",
      rendererKey: "PREFIX_TABLE_TRACE",
      data: {
        pattern: "ABABAA",
        mode: "BUILD",
        showIndices: true,
        labels: { lpsTable: "すでに作ったLPS表" },
        code: "length = lps[length - 1]",
        steps: [{
          index: 5,
          length: 3,
          lengthAfter: 1,
          nextIndex: 5,
          action: "FALLBACK",
          comparisonResult: "MISMATCH",
          fallbackFromLength: 3,
          fallbackLookupIndex: 2,
          fallbackValue: 1,
          lps: [0, 0, 1, 2, 3, null],
          message: "BとAが不一致なので、LPS[2]=1を使って候補をAへ戻します。",
        }],
      },
    }),
    activity({
      id: "algorithm-kmp-build-trace",
      title: "ABABAAのLPS表を完成させよう",
      instruction: "1回の比較と、その結果による更新を1ステップとしてLPS表を作りましょう。",
      mentorMessage: "比較後に値を記録できたときだけ、次の位置へ進むよ。",
      rendererKey: "PREFIX_TABLE_TRACE",
      data: {
        pattern: "ABABAA",
        mode: "BUILD",
        showIndices: true,
        nextLabel: "次の比較",
        stepDescriptions: [
          "LPS[1]：不一致なので0を記録",
          "LPS[2]：一致範囲を1文字へ伸ばす",
          "LPS[3]：一致範囲を2文字へ伸ばす",
          "LPS[4]：一致範囲を3文字へ伸ばす",
          "LPS[5]：候補を3文字から1文字へ戻す",
          "LPS[5]：候補を1文字から0文字へ戻す",
          "LPS[5]：一致して1を記録",
        ],
        labels: { lpsTable: "作成途中のLPS表" },
        steps: [
          {
            index: 1, length: 0, lengthAfter: 0, nextIndex: 2,
            action: "RECORD_ZERO", comparisonResult: "MISMATCH",
            lps: [0, 0, null, null, null, null],
            message: "AとBが不一致なので、LPS[1]へ0を記録します。",
          },
          {
            index: 2, length: 0, lengthAfter: 1, nextIndex: 3,
            action: "EXTEND", comparisonResult: "MATCH",
            lps: [0, 0, 1, null, null, null],
            message: "A同士が一致したため、LPS[2]へ1を記録します。",
          },
          {
            index: 3, length: 1, lengthAfter: 2, nextIndex: 4,
            action: "EXTEND", comparisonResult: "MATCH",
            lps: [0, 0, 1, 2, null, null],
            message: "B同士が一致したため、LPS[3]へ2を記録します。",
          },
          {
            index: 4, length: 2, lengthAfter: 3, nextIndex: 5,
            action: "EXTEND", comparisonResult: "MATCH",
            lps: [0, 0, 1, 2, 3, null],
            message: "A同士が一致したため、LPS[4]へ3を記録します。",
          },
          {
            index: 5, length: 3, lengthAfter: 1, nextIndex: 5,
            action: "FALLBACK", comparisonResult: "MISMATCH",
            fallbackFromLength: 3, fallbackLookupIndex: 2, fallbackValue: 1,
            lps: [0, 0, 1, 2, 3, null],
            message: "BとAが不一致なので、LPS[2]=1を使って候補を1文字へ戻します。",
          },
          {
            index: 5, length: 1, lengthAfter: 0, nextIndex: 5,
            action: "FALLBACK", comparisonResult: "MISMATCH",
            fallbackFromLength: 1, fallbackLookupIndex: 0, fallbackValue: 0,
            lps: [0, 0, 1, 2, 3, null],
            message: "BとAが不一致なので、LPS[0]=0を使って候補をなくします。",
          },
          {
            index: 5, length: 0, lengthAfter: 1, nextIndex: 6,
            action: "EXTEND", comparisonResult: "MATCH",
            lps: [0, 0, 1, 2, 3, 1],
            message: "A同士が一致したため、LPS[5]へ1を記録します。",
          },
        ],
        finalMessage: "完成したLPS表は[0, 0, 1, 2, 3, 1]です。",
      },
    }),
    activity({
      id: "algorithm-kmp-build-code",
      title: "3つの更新をPythonで表そう",
      instruction: "一致、候補ありの不一致、候補なしの不一致をコードへ対応させましょう。",
      mentorMessage: "不一致で候補へ戻るときだけ、iを進めず同じ末尾を調べ直すよ。",
      rendererKey: "CODE_STATE_MAPPING",
      learningRole: "CODE_MAPPING",
      data: {
        body: "pattern[i]とpattern[length]を比較し、結果に応じて状態を更新します。",
        code: joinCode([
          "if pattern[i] == pattern[length]:",
          "    length += 1",
          "    lps[i] = length",
          "    i += 1",
          "elif length > 0:",
          "    length = lps[length - 1]",
          "else:",
          "    lps[i] = 0",
          "    i += 1",
        ]),
        mappings: [
          { id: "match", label: "一致した", lines: [1, 2, 3, 4], role: "一致範囲を伸ばして記録", state: "lengthとiを進める" },
          { id: "fallback", label: "候補ありで不一致", lines: [5, 6], role: "前のLPS値へ戻る", state: "iはそのまま" },
          { id: "zero", label: "候補なしで不一致", lines: [7, 8, 9], role: "0を記録", state: "iを進める" },
        ],
      },
    }),
    activity({
      id: "algorithm-kmp-build-check",
      type: MissionActivityType.SELECT_FILL,
      title: "次の状態を判断しよう",
      instruction: "3つの比較結果について、更新後の状態を選びましょう。",
      mentorMessage: "LPS値を記録できたかどうかで、iを進めるか判断しよう。",
      rendererKey: "SEQUENTIAL_CHOICE",
      learningRole: "INDEPENDENT_PRACTICE",
      feedbackPolicy: retryWithHint,
      data: {
        question: "更新後の状態を選んでください。",
        sequenceQuestions: [
          {
            question: "i=3、length=1で、BとBが一致しました。",
            options: [
              { id: "q1", label: "length=2、lps[3]=2、i=4" },
              { id: "q1w", label: "length=2、lps[3]は未記録、i=3" },
              { id: "q1z", label: "length=0、lps[3]=0、i=4" },
            ],
          },
          {
            question: "i=5、length=3で不一致でした。lps[2]=1です。",
            options: [
              { id: "q2", label: "length=1、i=5、lps[5]は未記録" },
              { id: "q2w", label: "length=1、i=6、lps[5]は未記録" },
              { id: "q2z", label: "length=0、lps[5]=0、i=6" },
            ],
          },
          {
            question: "i=1、length=0で、BとAが不一致でした。",
            options: [
              { id: "q3", label: "length=0、lps[1]=0、i=2" },
              { id: "q3w", label: "length=0、lps[1]は未記録、i=1" },
              { id: "q3o", label: "length=1、lps[1]=1、i=2" },
            ],
          },
        ],
        correctAnswers: ["q1", "q2", "q3"],
        correctFeedback: "一致時と2種類の不一致時を正しく更新できました。",
        incorrectFeedback: "値を記録できたときだけ、次の位置へ進みます。",
      },
    }),
  ],
});

const missionSeven = mission({
  id: "algorithm-kmp-code-synthesis", title: "KMP法のPythonコードを完成させよう",
  description: "学習済みのLPS表作成と文字列検索を、並べ替え・穴埋め・修正問題で1つのコードへ統合します。",
  difficulty: CourseDifficulty.NORMAL, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=KMP+Code+Synthesis",
  estimatedMinutes: 19, order: 7, type: MissionType.MAIN, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 190,
  learnedItems: ["KMP法の2段階", "LPS表作成コード", "検索コード", "完成コードの役割"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-synthesis-bridge", title: "KMP法の2段階を整理しよう", instruction: "LPS表作成と検索を1つの処理へ統合しましょう。", mentorMessage: "patternから表を作ってから、その表を使ってtextを検索するよ。", rendererKey: "TEXT", learningRole: "SYNTHESIS", data: { body: "KMP法はpatternからLPS表を作る準備処理と、完成した表を使う検索処理の2段階です。ここでは新しい規則を増やさず、既習コードを組み合わせます。", comparison: { headers: ["段階", "入力", "結果"], rows: [{ cells: ["LPS表作成", "pattern", "LPS表"] }, { cells: ["検索", "text、pattern、LPS表", "開始indexまたは-1"] }] } } }),
    activity({ id: "algorithm-kmp-synthesis-lps-order", type: MissionActivityType.ORDERED_STEPS, title: "LPS表作成コードを並べよう", instruction: "初期化、比較、3つの更新、返却を実行順に並べましょう。", mentorMessage: "iを進めない不一致分岐に注意しよう。", rendererKey: "BLOCK_ORDER", learningRole: "SYNTHESIS", feedbackPolicy: retryWithHint, data: { question: "LPS表作成の順に並べてください。", steps: [{ id: "init", label: "lps、length、iを初期化" }, { id: "loop", label: "iがpatternの長さ未満の間繰り返す" }, { id: "compare", label: "pattern[i]とpattern[length]を比較" }, { id: "update", label: "結果に応じてlength、lps[i]、iを更新" }, { id: "return", label: "lpsを返す" }], answerOrder: ["init", "loop", "compare", "update", "return"], correctFeedback: "LPS表作成の流れを整理できました。", incorrectFeedback: "初期化、繰り返し、比較、更新、返却の順です。" } }),
    activity({ id: "algorithm-kmp-synthesis-lps-fill", type: MissionActivityType.SELECT_FILL, title: "LPS表作成コードを穴埋めしよう", instruction: "一致時と2種類の不一致処理を配置しましょう。", mentorMessage: "候補ありの不一致だけはiを進めないよ。", rendererKey: "CODE_FILL", learningRole: "SYNTHESIS", feedbackPolicy: retryWithHint, data: { body: "lps、length、iは初期化済みです。", question: "4つのブロックを配置してください。", codePreviewPrefix: "while i < len(pattern):", builderInstruction: "比較結果ごとの処理を配置します", builderSlots: [{ label: "一致条件", indent: 1 }, { label: "一致時の更新", indent: 2 }, { label: "候補あり不一致", indent: 1 }, { label: "候補なし不一致", indent: 1 }], codeBlocks: [{ id: "if", label: "if pattern[i] == pattern[length]:" }, { id: "match", label: "length += 1\nlps[i] = length\ni += 1" }, { id: "fallback", label: "elif length > 0:\n    length = lps[length - 1]" }, { id: "zero", label: "else:\n    lps[i] = 0\n    i += 1" }, { id: "wrong", label: "i = 0" }], correctAnswers: ["if", "match", "fallback", "zero"], executionResult: "LPS表作成ループが完成", correctFeedback: "3つの更新規則をコードにできました。", incorrectFeedback: "候補あり不一致では同じiを調べ直します。" } }),
    activity({ id: "algorithm-kmp-synthesis-search-order", type: MissionActivityType.ORDERED_STEPS, title: "KMP検索コードを並べよう", instruction: "検索中の比較と更新を実行順に並べましょう。", mentorMessage: "一致なら両方、不一致ならpattern_indexに応じて更新を分けるよ。", rendererKey: "BLOCK_ORDER", learningRole: "SYNTHESIS", feedbackPolicy: retryWithHint, data: { question: "検索処理の順に並べてください。", steps: [{ id: "init", label: "2つのindexを0にする" }, { id: "loop", label: "text末尾まで比較する" }, { id: "match", label: "一致なら両方を進め、発見を判定" }, { id: "mismatch", label: "不一致ならLPS値またはtext側を更新" }, { id: "missing", label: "未発見なら-1を返す" }], answerOrder: ["init", "loop", "match", "mismatch", "missing"], correctFeedback: "検索の流れを整理できました。", incorrectFeedback: "初期化後に比較を繰り返します。" } }),
    activity({ id: "algorithm-kmp-synthesis-fix", type: MissionActivityType.SELECT_FILL, title: "誤ったLPS参照を修正しよう", instruction: "最後に一致した位置を参照するコードへ修正しましょう。", mentorMessage: "pattern_indexは不一致位置なので、その1つ前を見るよ。", rendererKey: "CODE_FILL", learningRole: "SYNTHESIS", feedbackPolicy: retryWithHint, data: { question: "正しいブロックを配置してください。", codePreviewPrefix: "elif pattern_index > 0:", builderInstruction: "pattern_indexを更新します", builderSlots: [{ label: "最後に一致した位置のLPS値を読む", indent: 1 }], codeBlocks: [{ id: "correct", label: "pattern_index = lps[pattern_index - 1]" }, { id: "wrong", label: "pattern_index = lps[pattern_index]" }], correctAnswers: ["correct"], executionResult: "正しいLPS値を参照", correctFeedback: "最後に一致した位置を参照できました。", incorrectFeedback: "不一致位置の1つ前を使います。" } }),
    activity({ id: "algorithm-kmp-synthesis-search-fill", type: MissionActivityType.SELECT_FILL, title: "KMP検索コードを完成させよう", instruction: "検索ループをコードブロックで完成させましょう。", mentorMessage: "一致、発見、2種類の不一致を既習コードで組み立てよう。", rendererKey: "CODE_FILL", learningRole: "SYNTHESIS", feedbackPolicy: retryWithHint, data: { body: "text、pattern、lps、2つのindexは初期化済みです。", question: "7つのブロックを配置してください。", codePreviewPrefix: "while text_index < len(text):", builderInstruction: "検索ループを完成させます", builderSlots: [{ label: "一致条件", indent: 1 }, { label: "両方を進める", indent: 2 }, { label: "発見判定", indent: 2 }, { label: "一致済み文字ありの不一致", indent: 1 }, { label: "LPS値を使う", indent: 2 }, { label: "先頭で不一致", indent: 1 }, { label: "text側だけ進める", indent: 2 }], codeBlocks: [{ id: "match", label: "if text[text_index] == pattern[pattern_index]:" }, { id: "advance", label: "text_index += 1\npattern_index += 1" }, { id: "found", label: "if pattern_index == len(pattern):\n    return text_index - pattern_index" }, { id: "fallback-branch", label: "elif pattern_index > 0:" }, { id: "fallback", label: "pattern_index = lps[pattern_index - 1]" }, { id: "zero", label: "else:" }, { id: "text", label: "text_index += 1" }, { id: "wrong", label: "text_index -= 1" }], correctAnswers: ["match", "advance", "found", "fallback-branch", "fallback", "zero", "text"], executionResult: "KMP検索ループが完成", correctFeedback: "KMP検索コードを完成できました。", incorrectFeedback: "一致、発見、2種類の不一致を確認しましょう。" } }),
    activity({ id: "algorithm-kmp-synthesis-role", type: MissionActivityType.MATCH, title: "完成コードの役割を説明しよう", instruction: "コード断片を状態変化へ対応づけましょう。", mentorMessage: "変わる変数と画面上の変化を対応させよう。", rendererKey: "MATCH", learningRole: "SYNTHESIS", feedbackPolicy: retryWithHint, data: { question: "コードを役割へ配置してください。", items: [{ id: "lps", label: "length = lps[length - 1]" }, { id: "match", label: "text_index += 1 / pattern_index += 1" }, { id: "fallback", label: "pattern_index = lps[pattern_index - 1]" }, { id: "found", label: "return text_index - pattern_index" }], targets: [{ id: "lps-role", label: "LPS表作成中に候補を短くする" }, { id: "match-role", label: "検索中に一致した2位置を進める" }, { id: "fallback-role", label: "検索中に次の配置を決める" }, { id: "found-role", label: "発見した開始indexを返す" }], answers: [{ targetId: "lps-role", itemIds: ["lps"] }, { targetId: "match-role", itemIds: ["match"] }, { targetId: "fallback-role", itemIds: ["fallback"] }, { targetId: "found-role", itemIds: ["found"] }], correctFeedback: "コードと役割を対応できました。", incorrectFeedback: "lengthは表作成、pattern_indexは検索中の配置です。" } }),
  ],
});

const courseMission = mission({
  id: "algorithm-kmp-course-mission", title: "Course Mission：KMP法を実装してテストしよう",
  description: "LPS表作成と検索を含むkmp_search関数を実装し、7テストを通過させます。",
  difficulty: CourseDifficulty.NORMAL, goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=KMP+Course+Mission",
  estimatedMinutes: 15, order: 8, type: MissionType.COURSE_EXAM, isRequiredForCourseCompletion: true,
  parentMissionId: null, roadmapLane: 0, branchOrder: 0, rewardExp: 150,
  learnedItems: ["KMP法の自力実装", "テスト結果を使った修正", "LPS表と検索の統合"], isPublished: true,
  activities: [
    activity({ id: "algorithm-kmp-course-mission-implementation", type: MissionActivityType.TRY_CODE, title: "KMP法をPythonで実装しよう", instruction: "kmp_search(text, pattern)を完成させ、7つのテストを通過させましょう。", mentorMessage: "LPS表作成、検索中の配置、終了条件を分けて確認しよう。", rendererKey: "CODE_EDITOR", learningRole: "COURSE_EXAM", feedbackPolicy: retryWithHint, actionLabel: "提出する", data: { evaluationMode: "TEST_CASES", functionName: "kmp_search", courseResult: { masteryTitle: "KMP法をマスター", description: "KMP法コースをすべて修了しました。", learningOutcome: "LPS表を作り、比較済み情報を利用する文字列探索をPythonで実装できるようになりました。" }, body: "関数名と引数は変更しません。最初のindex、未発見-1、空pattern 0を返してください。完成済み検索機能は使いません。", starterCode: joinCode(["def kmp_search(text, pattern):", "    # 空のpatternを処理する", "", "    # patternのLPS表を作る", "", "    # LPS表を使ってtextを検索する", "    pass"]), answerCode: completeKmpCode, forbiddenCode: [{ snippet: ".find(", label: "findメソッド" }, { snippet: ".index(", label: "indexメソッド" }, { snippet: "pattern in text", label: "in演算子" }, { snippet: "import re", label: "正規表現" }], testCases: [{ id: "classic", label: "複数回のLPS利用", args: ["ABABDABACDABABCABAB", "ABABCABAB"], displayInput: "text='ABABDABACDABABCABAB', pattern='ABABCABAB'", expected: 10 }, { id: "start", label: "先頭で発見", args: ["ABACXYZ", "ABAC"], displayInput: "text='ABACXYZ', pattern='ABAC'", expected: 0 }, { id: "end", label: "末尾で発見", args: ["XYZABC", "ABC"], displayInput: "text='XYZABC', pattern='ABC'", expected: 3 }, { id: "overlap", label: "連続文字", args: ["AAAAA", "AAA"], displayInput: "text='AAAAA', pattern='AAA'", expected: 0 }, { id: "missing", label: "未発見", args: ["ABABABA", "AC"], displayInput: "text='ABABABA', pattern='AC'", expected: -1 }, { id: "empty", label: "空pattern", args: ["ABC", ""], displayInput: "text='ABC', pattern=''", expected: 0 }, { id: "longer", label: "patternが長い", args: ["ABC", "ABCDE"], displayInput: "text='ABC', pattern='ABCDE'", expected: -1 }], hints: [{ id: "empty", title: "空pattern", body: "文字へアクセスする前に空か確認します。", code: "if pattern == \"\":\n    return 0" }, { id: "lps-match", title: "LPS表の一致時", body: "lengthを増やして記録しiを進めます。", code: "length += 1\nlps[i] = length\ni += 1" }, { id: "lps-fallback", title: "LPS表の不一致時", body: "候補があればiを進めません。", code: "length = lps[length - 1]" }, { id: "search", title: "検索中の不一致", body: "一致済み文字があればLPS値を使います。", code: "pattern_index = lps[pattern_index - 1]" }, { id: "ending", title: "発見", body: "現在位置からpattern長を引きます。", code: "return text_index - pattern_index" }], correctFeedback: "全テストを通過しました。KMP法を実装できています。", incorrectFeedback: "未通過テストを確認し、LPS表、配置、終了条件を分けて見直しましょう。" } }),
  ],
});

export const kmpCourseSeed: CourseSeed = {
  id: "course-algorithm-kmp-v1", title: "KMP法",
  description: "長い文字列から目的の文字列を効率よく見つけるKMP法を学ぶコースです。単純探索の再比較、LPS値と表の意味、検索での利用、前の値を使った表作成、Python実装まで段階的に学びます。",
  difficulty: CourseDifficulty.NORMAL, isInitiallyUnlocked: true, isPublished: true, version: 8,
  categories: [CourseCategoryType.SEARCH],
  missions: [missionOne, missionTwo, missionThree, missionFour, missionFive, missionSix, missionSeven, courseMission],
};
