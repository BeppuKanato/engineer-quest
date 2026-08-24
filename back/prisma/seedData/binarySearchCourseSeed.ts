import {
  CourseCategoryType,
  CourseDifficulty,
  MissionActivityType,
  MissionType,
} from "@prisma/client";

import type { CourseSeed, MissionSeed } from "./learningSeedTypes";

const missionOne: MissionSeed = {
  id: "algorithm-binary-search-introduction",
  title: "探索アルゴリズムを知ろう",
  description:
    "データを探す処理の目的と、さまざまな探索アルゴリズムを知り、このコースで学ぶ内容を確認します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search",
  estimatedMinutes: 5,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 50,
  learnedItems: [
    "探索とは何か",
    "代表的な探索アルゴリズム",
    "二分探索コースの学習内容",
  ],
  isPublished: true,
  activities: [
    {
      id: "binary-search-introduction-find-user",
      type: MissionActivityType.VIEW,
      title: "探索とは何か",
      instruction:
        "複数のデータから目的のデータを見つける「探索」の意味を確認しましょう。",
      mentorMessage:
        "データの中から目的のものを見つける処理が「探索」なんだね。",
      content: {
        learningRole: "ORIENTATION",
        rendererKey: "TEXT",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body:
          "アプリやWebサービスでは、多くのデータの中から必要な情報を探す処理が行われています。\n\nこのように、複数のデータから目的のデータを見つける処理を「探索」と呼びます。\n\n例えば、ユーザー一覧から「U-204」を見つける処理も探索です。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 1,
    },
    {
      id: "binary-search-introduction-use-cases",
      type: MissionActivityType.VIEW,
      title: "探索はどこで使われる？",
      instruction:
        "身近なアプリやWebサービスで、探索が使われている場面を確認しましょう。",
      mentorMessage:
        "普段使っているサービスの中でも、いろいろな探索が行われているんだね。",
      content: {
        learningRole: "ORIENTATION",
        rendererKey: "TEXT",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body:
          "探索は、目的の情報を見つけるさまざまなサービスで使われています。",
          listItems: [
          "ユーザーIDからアカウントを探す",
          "商品番号や条件から商品を探す",
          "一覧に目的の値が含まれているか調べる",
          "マップから目的地までの道を探す",
          ],
          conclusion:
          "多くのデータを扱うサービスでは、目的のデータをプログラムで見つけるために探索が必要です。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 2,
    },
    {
      id: "binary-search-introduction-algorithms",
      type: MissionActivityType.VIEW,
      title: "いろいろな探索方法",
      instruction:
        "探す対象によって、使われる探索方法が異なることを比較して確認しましょう。",
      mentorMessage:
        "探すものに合わせて方法が変わるんだね。今回は二分探索に注目しよう！",
      content: {
        learningRole: "ORIENTATION",
        rendererKey: "TEXT",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body:
          "探索には、探す対象やデータの特徴に合った方法があります。代表的な3種類を比べてみましょう。",
          comparison: {
          headers: ["探索方法", "探し方", "主な対象"],
          rows: [
          {
          cells: ["線形探索", "最初から1つずつ確認する", "値の一覧"],
          },
          {
          cells: ["二分探索", "中央を手がかりに範囲を狭める", "順番に並んだ値"],
          label: "このコースで学習",
          },
          {
          cells: ["グラフ探索", "データ同士のつながりをたどる", "迷路・マップ・SNS"],
          note: "幅優先探索・深さ優先探索など",
          },
          ],
          },
          conclusion:
          "このコースでは、順番に並んだデータから目的の値を探す「二分探索」を学びます。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 3,
    },
    {
      id: "binary-search-introduction-course-roadmap",
      type: MissionActivityType.VIEW,
      title: "このコースで学ぶこと",
      instruction:
        "二分探索をどのような順序で学んでいくのか、コース全体の流れを確認しましょう。",
      mentorMessage:
        "まずは中央の値に注目するところから始めよう。動きを理解してからコードにつなげるから、順番に進めれば大丈夫だよ！",
      content: {
        learningRole: "ORIENTATION",
        rendererKey: "LEARNING_ROADMAP",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body:
          "このコースでは、二分探索の動きを操作しながら理解し、最後にPythonコードへつなげます。\n\nPythonの前提知識として、リスト、変数、if・elif・else、while、len()の基本的な使い方を理解しているものとして進めます。二分探索固有の範囲管理、中央位置の計算、比較と更新の対応は、このコース内で順番に学びます。",
          roadmapSteps: [
          "探索の目的と種類を知る",
          "中央との比較から探す側を決める",
          "探索範囲と中央を位置で表す",
          "探索範囲を更新する",
          "発見まで処理を繰り返す",
          "Pythonコードを組み立てる",
          "自分で二分探索を実装する",
          ],
          emphasis:
          "二分探索の動きとPythonコードの対応を、順番に身につけていきましょう！",
        },
      },
      preview: null,
      actionLabel: "Missionを完了",
      order: 4,
    },
  ],
};

const missionTwo: MissionSeed = {
  id: "algorithm-binary-search-compare-middle",
  title: "中央の値から探す範囲を決めよう",
  description:
    "探す値と中央の値を比較し、次にどちら側を探せばよいか判断します。",
  difficulty: CourseDifficulty.EASY,
  goalImg:
    "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search+Step+2",
  estimatedMinutes: 9,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 90,
  learnedItems: [
    "中央の値との比較",
    "比較結果から探索範囲を選ぶ方法",
    "二分探索で順番に並んだデータが必要な理由",
    "中央との比較を表すPythonの条件式",
  ],
  isPublished: true,
  activities: [
    {
      id: "binary-search-compare-middle-explanation",
      type: MissionActivityType.VIEW,
      title: "中央との比較で探す側を決める",
      instruction:
        "探す値と中央の値を比べると、次に探す側を判断できます。",
      mentorMessage:
        "中央との比較結果から、左・右・発見のどれになるかが決まるんだね。",
      content: {
        learningRole: "EXPLANATION",
        rendererKey: "BINARY_SEARCH_CENTRAL_COMPARISON",
        feedbackPolicy: { mode: "NONE" },
        data: {
          target: 18,
          values: [3, 6, 9, 12, 15, 18, 21],
          midIndex: 3,
          body:
          "二分探索では、探す値を配列の中央の値と比べます。比較結果から、次に左側と右側のどちらを探すか、または目的の値を発見したかを判断できます。",
          comparisonText: "18は12より大きい",
          nextRangeText: "次は中央より右側を探す",
          comparisonRules: [
          { condition: "探す値 < 中央の値", result: "左側を探す" },
          { condition: "探す値 > 中央の値", result: "右側を探す" },
          { condition: "探す値 = 中央の値", result: "発見" },
          ],
          pythonCode:
          "target < numbers[mid]   # 探す値が中央より小さい\ntarget > numbers[mid]   # 探す値が中央より大きい\ntarget == numbers[mid]  # 探す値が中央と同じ",
          midNote:
          "midは中央の位置を表すものです。計算方法は、後のMissionで学びます。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 1,
    },
    {
      id: "binary-search-compare-middle-practice",
      type: MissionActivityType.CHOICE,
      title: "次に探す範囲を選ぼう",
      instruction:
        "探す値と中央の値を比べて、次に探す範囲を選びましょう。",
      mentorMessage:
        "小さければ左、大きければ右、同じなら発見だよ！",
      content: {
        learningRole: "GUIDED_PRACTICE",
        rendererKey: "ARRAY_REGION_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          sequenceMode: "QUESTIONS",
          question:
          "3つの場面それぞれで、配列の左側・中央・右側を直接選んでください。",
          rangeDecisionQuestions: [
          {
          id: "target-6",
          target: 6,
          values: [3, 6, 9, 12, 15, 18, 21],
          midIndex: 3,
          correctRegion: "left",
          },
          {
          id: "target-18",
          target: 18,
          values: [3, 6, 9, 12, 15, 18, 21],
          midIndex: 3,
          correctRegion: "right",
          },
          {
          id: "target-12",
          target: 12,
          values: [3, 6, 9, 12, 15, 18, 21],
          midIndex: 3,
          correctRegion: "center",
          },
          ],
          correctFeedback:
          "3つの場面すべてで、中央との比較から次に探す範囲を判断できました。",
          incorrectFeedback:
          "探す値と中央の値を比べて、小さい・大きい・同じのどれかをもう一度確認しましょう。",
          completionLabel: "次へ",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 2,
    },
    {
      id: "binary-search-compare-middle-sorted-reason",
      type: MissionActivityType.VIEW,
      title: "なぜ片側を探さなくてよい？",
      instruction:
        "中央との比較だけで片側を除外できる理由を確認しましょう。",
      mentorMessage:
        "値が順番に並んでいるから、探さなくてよい側を決められるんだね。",
      content: {
        learningRole: "EXPLANATION",
        rendererKey: "BINARY_SEARCH_SORTED_REQUIREMENT",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body:
          "二分探索で片側を探さなくてよいと判断できるのは、値が順番に並んでいるためです。",
          target: 18,
          sortedValues: [3, 6, 9, 12, 15, 18, 21],
          midIndex: 3,
          sortedExplanation:
          "18は12より大きく、12より大きい値は右側に並んでいます。そのため、左側に18はないと判断できます。",
          unsortedValues: [15, 3, 18, 12, 6, 21, 9],
          unsortedExplanation:
          "値が順番に並んでいない場合は、大きい値が左右に分かれるため、中央との比較だけでは片側を除外できません。",
          premise:
          "二分探索では、`numbers`が小さい順に並んでいることを前提にします。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 3,
    },
    {
      id: "binary-search-compare-middle-check",
      type: MissionActivityType.CHOICE,
      title: "別のデータで探す側を決めよう",
      instruction:
        "別のデータでも、中央との比較から次に探す範囲を判断しましょう。",
      mentorMessage:
        "中央との比較から、次に探す範囲を正しく選べたね！",
      content: {
        learningRole: "INDEPENDENT_PRACTICE",
        rendererKey: "ARRAY_REGION_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          sequenceMode: "QUESTIONS",
          question: "次に探す範囲を選んでください。",
          rangeDecisionQuestions: [
          {
          id: "target-8",
          target: 8,
          values: [4, 8, 12, 16, 20, 24, 28],
          midIndex: 3,
          correctRegion: "left",
          correctExplanation: "8は16より小さい\n↓\n左側を探す",
          pythonCondition: "target < numbers[mid]",
          },
          ],
          correctFeedback:
          "8は16より小さいため、次に探す範囲は中央より左側です。",
          incorrectFeedback:
          "探す値8と中央の値16をもう一度比べてみましょう。",
          completionLabel: "Missionを完了",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 4,
    },
  ],
};

const missionThree: MissionSeed = {
  id: "algorithm-binary-search-index-range",
  title: "探索範囲を位置で表そう",
  description: "探索範囲の左端と右端を位置で表し、その中央の位置を求めます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search+Step+3",
  estimatedMinutes: 14,
  order: 3,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 140,
  learnedItems: ["leftとrightで表す探索範囲", "中央位置midの計算", "numbers[mid]で中央の値を取り出す方法"],
  isPublished: true,
  activities: [
    {
      id: "binary-search-index-range-left-right",
      type: MissionActivityType.VIEW,
      title: "探索範囲をleftとrightで表す",
      instruction: "配列の位置を使って、現在探している範囲の両端を表しましょう。",
      mentorMessage: "値そのものではなく、配列の位置で範囲を持つんだね。",
      content: {
        learningRole: "EXPLANATION",
        rendererKey: "BINARY_SEARCH_INDEX_RANGE",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "配列では、最初の位置を0として数えます。探索範囲の左端をleft、右端をrightで表します。最初は配列全体が探索範囲です。",
          values: [3, 6, 9, 12, 15, 18, 21],
          leftIndex: 0,
          rightIndex: 6,
          pythonCode: "left = 0\nright = len(numbers) - 1",
          sceneConclusion: "len(numbers) - 1 は、配列の最後の位置を表します。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 1,
    },
    {
      id: "binary-search-index-range-select-bounds",
      type: MissionActivityType.CHOICE,
      title: "現在の探索範囲を選ぼう",
      instruction: "示された探索範囲のleftとrightを、配列カードから選びましょう。",
      mentorMessage: "色が付いている範囲の、一番左と一番右の位置に注目しよう！",
      content: {
        learningRole: "GUIDED_PRACTICE",
        rendererKey: "INDEX_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          indexSelectionQuestions: [
          { id: "all-left", prompt: "配列全体のleftを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 6, correctIndex: 0 },
          { id: "all-right", prompt: "配列全体のrightを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 6, correctIndex: 6 },
          { id: "part-left", prompt: "位置2〜5が探索範囲のときleftを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 2, rightIndex: 5, correctIndex: 2 },
          { id: "part-right", prompt: "位置2〜5が探索範囲のときrightを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 2, rightIndex: 5, correctIndex: 5 },
          ],
          correctFeedback: "探索範囲の両端を、leftとrightの位置で表せました。",
          incorrectFeedback: "有効なカードの一番左と一番右のindexを確認しましょう。",
          completionLabel: "次へ",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 2,
    },
    {
      id: "binary-search-index-range-mid",
      type: MissionActivityType.VIEW,
      title: "中央の位置midを求める",
      instruction: "leftとrightから、探索範囲の中央の位置を求めましょう。",
      mentorMessage: "leftとrightの真ん中がmidになるんだね。",
      content: {
        learningRole: "CODE_MAPPING",
        rendererKey: "BINARY_SEARCH_MID_CALCULATION",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "中央の位置midは、leftとrightを足して2で割って求めます。Pythonの//は、割り算の小数部分を切り捨てる演算子です。",
          values: [3, 6, 9, 12, 15, 18, 21],
          leftIndex: 0,
          rightIndex: 6,
          midIndex: 3,
          formula: "mid = (left + right) // 2\nmid = (0 + 6) // 2 = 3",
          pythonCode: "mid = (left + right) // 2\ncenter_value = numbers[mid]  # numbers[3] は12",
          sceneConclusion: "numbers[mid]で、中央の位置にある値を取り出せます。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 3,
    },
    {
      id: "binary-search-index-range-select-mid",
      type: MissionActivityType.CHOICE,
      title: "中央の位置を選ぼう",
      instruction: "leftとrightからmidを計算し、該当するカードを選びましょう。",
      mentorMessage: "偶数個の範囲では、//によって左側の中央位置になるよ。",
      content: {
        learningRole: "GUIDED_PRACTICE",
        rendererKey: "INDEX_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          indexSelectionQuestions: [
          { id: "mid-all", prompt: "left=0、right=6のmidを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 6, midIndex: 3, visiblePointers: ["left", "right"], correctIndex: 3 },
          { id: "mid-part", prompt: "left=2、right=6のmidを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 2, rightIndex: 6, midIndex: 4, visiblePointers: ["left", "right"], correctIndex: 4 },
          { id: "mid-even", prompt: "left=1、right=4のmidを選ぶ", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 1, rightIndex: 4, midIndex: 2, visiblePointers: ["left", "right"], correctIndex: 2 },
          ],
          correctFeedback: "どの探索範囲でもmidを計算できました。偶数個では小数部分を切り捨てた位置になります。",
          incorrectFeedback: "(left + right) // 2 を計算し、値ではなくindexを選びましょう。",
          completionLabel: "次へ",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 4,
    },
    {
      id: "binary-search-index-range-review",
      type: MissionActivityType.CHOICE,
      title: "別の配列でleft・right・midを確認しよう",
      instruction: "新しい配列の探索範囲を、3つの位置で表しましょう。",
      mentorMessage: "left、right、midを位置として正しく表せたね！",
      content: {
        learningRole: "INDEPENDENT_PRACTICE",
        rendererKey: "INDEX_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          indexSelectionQuestions: [
          { id: "review-left", prompt: "leftを選ぶ", values: [4, 8, 12, 16, 20, 24, 28, 32], leftIndex: 1, rightIndex: 6, midIndex: 3, visiblePointers: ["mid", "right"], correctIndex: 1 },
          { id: "review-right", prompt: "rightを選ぶ", values: [4, 8, 12, 16, 20, 24, 28, 32], leftIndex: 1, rightIndex: 6, midIndex: 3, visiblePointers: ["left", "mid"], correctIndex: 6 },
          { id: "review-mid", prompt: "midを選ぶ", values: [4, 8, 12, 16, 20, 24, 28, 32], leftIndex: 1, rightIndex: 6, midIndex: 3, visiblePointers: ["left", "right"], correctIndex: 3 },
          ],
          correctFeedback: "探索範囲と中央を、配列の位置で管理できました。",
          incorrectFeedback: "left=1、right=6から、mid=(1+6)//2を計算してみましょう。",
          completionLabel: "Missionを完了",
        },
      },
      preview: null,
      actionLabel: "Missionを完了する",
      order: 5,
    },
  ],
};

const missionFour: MissionSeed = {
  id: "algorithm-binary-search-update-range",
  title: "探索範囲を狭めよう",
  description: "中央の値との比較結果に合わせてleftまたはrightを更新し、探索範囲を狭めます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search+Step+4",
  estimatedMinutes: 9,
  order: 4,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 90,
  learnedItems: ["leftとrightの更新", "中央位置を探索範囲から除外する理由", "更新後のmidの再計算"],
  isPublished: true,
  activities: [
    {
      id: "binary-search-update-range-rules",
      type: MissionActivityType.VIEW,
      title: "比較結果から探索範囲を更新する",
      instruction: "中央の値を調べ終えたあと、leftまたはrightを更新する方法を確認しましょう。",
      mentorMessage: "中央はもう確認済みだから、次の範囲には含めないんだね。",
      content: {
        learningRole: "CODE_MAPPING",
        rendererKey: "BINARY_SEARCH_RANGE_UPDATE",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "探す値が中央より小さいときは右端をmidの1つ左へ、大きいときは左端をmidの1つ右へ移します。",
          examples: [
          { id: "smaller", title: "探す値が中央より小さい", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 2, midIndex: 3, text: "right = mid - 1\n中央12と右側を除き、位置0〜2を残す", code: "if target < numbers[mid]:\n    right = mid - 1" },
          { id: "larger", title: "探す値が中央より大きい", values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 4, rightIndex: 6, midIndex: 3, text: "left = mid + 1\n中央12と左側を除き、位置4〜6を残す", code: "elif target > numbers[mid]:\n    left = mid + 1" },
          ],
          sceneConclusion: "midはすでに目的の値と違うと分かっているため、mid - 1 / mid + 1で中央を除外します。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 1,
    },
    {
      id: "binary-search-update-range-practice",
      type: MissionActivityType.CHOICE,
      title: "更新後に残す範囲を選ぼう",
      instruction: "中央との比較結果から、次に残す範囲を直接選びましょう。",
      mentorMessage: "小さければ左側、大きければ右側を残そう！",
      content: {
        learningRole: "GUIDED_PRACTICE",
        rendererKey: "ARRAY_REGION_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          sequenceMode: "QUESTIONS",
          rangeDecisionQuestions: [
          { id: "keep-left", stepLabel: "場面1", target: 6, values: [3, 6, 9, 12, 15, 18, 21], midIndex: 3, correctRegion: "left", resultText: "right = mid - 1" },
          { id: "keep-right", stepLabel: "場面2", target: 18, values: [3, 6, 9, 12, 15, 18, 21], midIndex: 3, correctRegion: "right", resultText: "left = mid + 1" },
          ],
          correctFeedback: "比較結果に合わせて、更新後の探索範囲を選べました。",
          incorrectFeedback: "探す値と中央の値を比べ、残す側をもう一度確認しましょう。",
          completionLabel: "次へ",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 2,
    },
    {
      id: "binary-search-update-range-recalculate-mid",
      type: MissionActivityType.VIEW,
      title: "狭めた範囲で中央を求め直す",
      instruction: "探索範囲を更新したら、新しいleftとrightからmidを求め直します。",
      mentorMessage: "範囲が変わるたびに、その範囲の中央を使うんだね。",
      content: {
        learningRole: "CODE_MAPPING",
        rendererKey: "BINARY_SEARCH_RECALCULATE_MID",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "探す値18は中央12より大きいのでleftを4へ更新します。新しい範囲4〜6の中央は位置5です。",
          values: [3, 6, 9, 12, 15, 18, 21],
          leftIndex: 4,
          rightIndex: 6,
          midIndex: 5,
          formula: "left = 4, right = 6\nmid = (4 + 6) // 2 = 5",
          sceneConclusion: "探索範囲を更新したあとは、新しい範囲を使ってmidを求め直します。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 3,
    },
    {
      id: "binary-search-update-range-one-step",
      type: MissionActivityType.ORDERED_STEPS,
      title: "探索を1回進める順番を並べよう",
      instruction: "中央を調べて次の探索範囲を作るまでの5つの処理を、実行順に並べましょう。",
      mentorMessage: "比較して、範囲を更新してから、新しい中央を求める順番だよ！",
      content: {
        learningRole: "INDEPENDENT_PRACTICE",
        rendererKey: "BINARY_SEARCH_ONE_ITERATION",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          values: [4, 8, 12, 16, 20, 24, 28],
          leftIndex: 0,
          rightIndex: 6,
          midIndex: 3,
          formula: "探す値：24　中央の値：16",
          steps: [
          { id: "recalc", label: "更新後のleftとrightからmidを求め直す" },
          { id: "compare", label: "探す値24と中央の値16を比べる" },
          { id: "read", label: "numbers[mid]で中央の値を取り出す" },
          { id: "update", label: "leftをmid + 1へ更新する" },
          { id: "mid", label: "leftとrightからmidを求める" },
          ],
          answerOrder: ["mid", "read", "compare", "update", "recalc"],
          correctFeedback: "1回分の比較・範囲更新・中央の再計算を正しい順番で整理できました。",
          incorrectFeedback: "まず現在のmidと中央の値を求め、比較後に範囲を更新します。",
          completionLabel: "Missionを完了",
        },
      },
      preview: null,
      actionLabel: "Missionを完了する",
      order: 4,
    },
  ],
};

const missionFive: MissionSeed = {
  id: "algorithm-binary-search-repeat",
  title: "見つかるまで探索を繰り返そう",
  description: "探索範囲が残っている間、中央の確認と範囲の更新を繰り返し、発見と未発見を判断します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search+Step+5",
  estimatedMinutes: 12,
  order: 5,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["whileによる探索の繰り返し", "発見時の終了", "見つからない場合の終了", "return midとreturn -1"],
  isPublished: true,
  activities: [
    {
      id: "binary-search-repeat-while",
      type: MissionActivityType.VIEW,
      title: "探索範囲がある間は繰り返す",
      instruction: "leftがrightを越えるまで、中央の確認と範囲更新を繰り返します。",
      mentorMessage: "範囲が残っているかをwhileで確認して、毎回midを求め直すんだね。",
      content: {
        learningRole: "CODE_MAPPING",
        rendererKey: "BINARY_SEARCH_WHILE_LOOP",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "left <= rightの間は、探索する位置が1つ以上残っています。ループの中でmidを求め、中央の値を比較し、leftまたはrightを更新します。",
          values: [3, 6, 9, 12, 15, 18, 21],
          leftIndex: 0,
          rightIndex: 6,
          midIndex: 3,
          pythonCode: "while left <= right:\n    mid = (left + right) // 2\n    # 中央の値を比較して探索範囲を更新する",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 1,
    },
    {
      id: "binary-search-repeat-endings",
      type: MissionActivityType.VIEW,
      title: "発見と未発見の終了を知る",
      instruction: "二分探索が終わる2つの状態を確認しましょう。",
      mentorMessage: "同じ値ならその位置を返し、範囲がなくなったら-1を返すんだね。",
      content: {
        learningRole: "CODE_MAPPING",
        rendererKey: "BINARY_SEARCH_ENDINGS",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "中央の値が探す値と同じなら、その位置midを返して終了します。更新を続けてleft > rightになった場合は、目的の値がないことを-1で表します。",
          examples: [
          { id: "found", title: "目的の値を発見", text: "targetは中央より小さくも大きくもない\n中央の位置を返して終了", code: "else:\n    return mid" },
          { id: "not-found", title: "探索範囲がなくなった", text: "left > right\n目的の値がないことを返す", code: "return -1" },
          ],
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 2,
    },
    {
      id: "binary-search-repeat-full-practice",
      type: MissionActivityType.CHOICE,
      title: "発見と未発見まで探索しよう",
      instruction: "各ステップで探す側を選び、探索が終わるまで処理を追いましょう。",
      mentorMessage: "left・right・midと、除外された範囲を毎回確認しよう！",
      content: {
        learningRole: "GUIDED_PRACTICE",
        rendererKey: "ARRAY_REGION_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          sequenceMode: "TRACE",
          rangeDecisionQuestions: [
          { id: "found-1", stepLabel: "発見ケース 1回目", target: 18, values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 6, midIndex: 3, correctRegion: "right", resultText: "18 > 12 → left = 4" },
          { id: "found-2", stepLabel: "発見ケース 2回目", target: 18, values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 4, rightIndex: 6, midIndex: 5, correctRegion: "center", resultText: "18 == 18 → return 5" },
          { id: "missing-1", stepLabel: "未発見ケース 1回目", target: 10, values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 6, midIndex: 3, correctRegion: "left", resultText: "10 < 12 → right = 2" },
          { id: "missing-2", stepLabel: "未発見ケース 2回目", target: 10, values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 0, rightIndex: 2, midIndex: 1, correctRegion: "right", resultText: "10 > 6 → left = 2" },
          { id: "missing-3", stepLabel: "未発見ケース 3回目", target: 10, values: [3, 6, 9, 12, 15, 18, 21], leftIndex: 2, rightIndex: 2, midIndex: 2, correctRegion: "right", resultText: "10 > 9 → left = 3、left > rightなのでreturn -1" },
          ],
          correctFeedback: "目的の値を発見する場合と、探索範囲がなくなる場合の両方を最後まで追えました。",
          incorrectFeedback: "各ステップに表示された探す値とmidの値を比べ直しましょう。",
          completionLabel: "次へ",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 3,
    },
    {
      id: "binary-search-repeat-review",
      type: MissionActivityType.CHOICE,
      title: "別の配列で最後まで探索しよう",
      instruction: "これまでと同じ手順で、目的の値を発見するまで探索を進めましょう。",
      mentorMessage: "比較と範囲更新を繰り返して、目的の値を見つけられたね！",
      content: {
        learningRole: "INDEPENDENT_PRACTICE",
        rendererKey: "ARRAY_REGION_SELECT",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          sequenceMode: "TRACE",
          rangeDecisionQuestions: [
          { id: "review-1", stepLabel: "1回目", target: 8, values: [2, 5, 8, 11, 14, 17, 20], leftIndex: 0, rightIndex: 6, midIndex: 3, correctRegion: "left", resultText: "8 < 11 → right = 2" },
          { id: "review-2", stepLabel: "2回目", target: 8, values: [2, 5, 8, 11, 14, 17, 20], leftIndex: 0, rightIndex: 2, midIndex: 1, correctRegion: "right", resultText: "8 > 5 → left = 2" },
          { id: "review-3", stepLabel: "3回目", target: 8, values: [2, 5, 8, 11, 14, 17, 20], leftIndex: 2, rightIndex: 2, midIndex: 2, correctRegion: "center", resultText: "8 == 8 → return 2" },
          ],
          correctFeedback: "探索範囲が残っている間、中央の比較と範囲更新を繰り返して発見できました。",
          incorrectFeedback: "現在の探索範囲のmidにある値を確認して、残す側を選びましょう。",
          completionLabel: "Missionを完了",
        },
      },
      preview: null,
      actionLabel: "Missionを完了する",
      order: 4,
    },
  ],
};

const missionSix: MissionSeed = {
  id: "algorithm-binary-search-python",
  title: "二分探索のコードを完成させよう",
  description: "これまで学んだ処理とPythonコードを対応させ、既習のコード要素を組み合わせて二分探索の関数を完成させます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search+Step+6",
  estimatedMinutes: 7,
  order: 6,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 70,
  learnedItems: ["二分探索の処理とコードの対応", "既習コードの組み立て", "完成コードの各処理の役割"],
  isPublished: true,
  activities: [
    {
      id: "binary-search-python-map",
      type: MissionActivityType.VIEW,
      title: "処理とPythonコードを対応させよう",
      instruction: "これまで学んだ二分探索の処理が、どのコードに対応するか確認しましょう。",
      mentorMessage: "一つずつ学んだ処理が、完成コードの各行につながっているね。",
      content: {
        learningRole: "SYNTHESIS",
        rendererKey: "TEXT",
        feedbackPolicy: { mode: "NONE" },
        data: {
          body: "探索範囲の初期化、繰り返し、中央の計算、比較、範囲更新、終了を順にコードへ対応させます。",
          comparison: {
          headers: ["処理", "Pythonコード"],
          rows: [
          { cells: ["探索範囲を初期化", "left = 0 / right = len(numbers) - 1"] },
          { cells: ["範囲がある間繰り返す", "while left <= right:"] },
          { cells: ["中央の位置を求める", "mid = (left + right) // 2"] },
          { cells: ["左側へ狭める", "if target < numbers[mid]: right = mid - 1"] },
          { cells: ["右側へ狭める", "elif target > numbers[mid]: left = mid + 1"] },
          { cells: ["中央で発見する", "else: return mid"] },
          { cells: ["未発見で終了する", "return -1"] },
          ],
          },
          conclusion: "それぞれのコードは、前のMissionで操作した処理をそのまま表しています。",
        },
      },
      preview: null,
      actionLabel: "次へ",
      order: 1,
    },
    {
      id: "binary-search-python-order-blocks",
      type: MissionActivityType.ORDERED_STEPS,
      title: "コードブロックを順番に並べよう",
      instruction: "二分探索関数の大きなコードブロックを、正しい順番へ並べましょう。",
      mentorMessage: "初期化してからwhileに入り、その中で比較と更新を行うよ。",
      content: {
        learningRole: "SYNTHESIS",
        rendererKey: "BLOCK_ORDER",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          steps: [
          { id: "not-found", label: "return -1" },
          { id: "right", label: "elif target > numbers[mid]: left = mid + 1" },
          { id: "init", label: "left = 0 / right = len(numbers) - 1" },
          { id: "mid", label: "mid = (left + right) // 2" },
          { id: "while", label: "while left <= right:" },
          { id: "left", label: "if target < numbers[mid]: right = mid - 1" },
          { id: "found", label: "else: return mid" },
          ],
          answerOrder: ["init", "while", "mid", "left", "right", "found", "not-found"],
          correctFeedback: "二分探索のコードブロックを、処理の流れと同じ順番に並べられました。",
          incorrectFeedback: "return -1はwhileが終わった後です。初期化、while、mid、分岐の順を確認しましょう。",
          completionLabel: "次へ",
        },
      },
      preview: null,
      actionLabel: "答えを確認する",
      order: 2,
    },
    {
      id: "binary-search-python-complete-code",
      type: MissionActivityType.SELECT_FILL,
      title: "二分探索のコードを完成させよう",
      instruction: "空欄へコードブロックを配置し、二分探索関数を完成させましょう。",
      mentorMessage: "これまでの処理をつなげれば、二分探索の完成コードになるよ！",
      content: {
        learningRole: "SYNTHESIS",
        rendererKey: "CODE_FILL",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          codeBlockBuilder: true,
          builderInstruction: "コードブロックを上から順に配置してください。インデントの位置にも注目しましょう。",
          codePreviewPrefix: "def binary_search(numbers, target):",
          builderSlots: [
          { label: "初期化1", indent: 1 }, { label: "初期化2", indent: 1 },
          { label: "繰り返し", indent: 1 }, { label: "中央", indent: 2 },
          { label: "左へ", indent: 2 }, { label: "右へ", indent: 2 },
          { label: "発見", indent: 2 }, { label: "未発見", indent: 1 },
          ],
          codeBlocks: [
          { id: "left", label: "left = 0" },
          { id: "right", label: "right = len(numbers) - 1" },
          { id: "while", label: "while left <= right:" },
          { id: "mid", label: "mid = (left + right) // 2" },
          { id: "smaller", label: "if target < numbers[mid]: right = mid - 1" },
          { id: "larger", label: "elif target > numbers[mid]: left = mid + 1" },
          { id: "found", label: "else: return mid" },
          { id: "missing", label: "return -1" },
          ],
          correctAnswers: ["left", "right", "while", "mid", "smaller", "larger", "found", "missing"],
          executionResult: "binary_search([3, 6, 9, 12, 15, 18, 21], 18) → 5",
          previewWaitingMessage: "8つのブロックを配置すると、完成した処理の結果を確認できます。",
          correctFeedback: "二分探索の完成コードを、処理の役割と対応させて組み立てられました。",
          incorrectFeedback: "初期化はwhileの前、midと比較分岐はwhileの中、return -1はwhileの後です。",
          completionLabel: "Missionを完了",
        },
      },
      preview: null,
      actionLabel: "Missionを完了する",
      order: 3,
    },
  ],
};

const courseMission: MissionSeed = {
  id: "binary-search-course-mission-v1",
  title: "Course Mission：二分探索を自分で実装する",
  description: "これまで学んだ範囲管理・中央との比較・繰り返しを使い、二分探索関数を自分で完成させます。すべてのテストケースを通過するとコースクリアです。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "https://placehold.co/800x450/EEF4FF/2563EB?text=Binary+Search+Course+Mission",
  estimatedMinutes: 15,
  order: 7,
  type: MissionType.COURSE_EXAM,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 150,
  learnedItems: ["二分探索の自力実装", "テスト結果を使った修正", "範囲管理・比較・繰り返しの統合"],
  isPublished: true,
  activities: [
    {
      id: "binary-search-course-mission-implementation",
      type: MissionActivityType.TRY_CODE,
      title: "二分探索を自分で実装しよう",
      instruction: "binary_search(numbers, target)を完成させ、見つかった位置、または見つからない場合の-1を返しましょう。",
      mentorMessage: "テスト結果とヒントを手がかりに、学んだ処理を一つずつ組み合わせよう！",
      content: {
        learningRole: "COURSE_EXAM",
        rendererKey: "CODE_EDITOR",
        feedbackPolicy: { mode: "RETRY_WITH_HINT", revealAfterAttempts: 2 },
        data: {
          evaluationMode: "TEST_CASES",
          functionName: "binary_search",
          courseResult: {
          masteryTitle: "二分探索をマスター",
          description: "二分探索コースをすべて修了しました。",
          learningOutcome: "順番に並んだデータを二分探索で検索できるようになりました。",
          },
          body: "関数名と2つの引数はそのまま使います。numbersは小さい順に並んでいます。見つかったときはindex、見つからないときは-1を返してください。",
          starterCode: `def binary_search(numbers, target):
          # ここに二分探索の処理を書こう
          pass`,
          testCases: [
          { id: "middle", label: "中央で発見", args: [[3, 6, 9, 12, 15, 18, 21], 12], displayInput: "numbers=[3, 6, 9, 12, 15, 18, 21], target=12", expected: 3 },
          { id: "right", label: "右側で発見", args: [[3, 6, 9, 12, 15, 18, 21], 18], displayInput: "numbers=[3, 6, 9, 12, 15, 18, 21], target=18", expected: 5 },
          { id: "left-edge", label: "左端で発見", args: [[4, 8, 12, 16, 20, 24, 28], 4], displayInput: "numbers=[4, 8, 12, 16, 20, 24, 28], target=4", expected: 0 },
          { id: "not-found", label: "値が見つからない", args: [[2, 5, 8, 11, 14, 17, 20], 10], displayInput: "numbers=[2, 5, 8, 11, 14, 17, 20], target=10", expected: -1 },
          { id: "empty", label: "空の配列", args: [[], 7], displayInput: "numbers=[], target=7", expected: -1 },
          ],
          hints: [
          { id: "range", title: "探索範囲を初期化する", body: "leftは最初の位置、rightは最後の位置です。", code: "left = 0\nright = len(numbers) - 1" },
          { id: "loop", title: "範囲がある間繰り返す", body: "leftがright以下の間、中央を求めて比較します。", code: "while left <= right:\n    mid = (left + right) // 2" },
          { id: "update", title: "比較して範囲を更新する", body: "小さければright、大きければleftを更新し、どちらでもなければmidを返します。", code: "if target < numbers[mid]:\n    right = mid - 1\nelif target > numbers[mid]:\n    left = mid + 1\nelse:\n    return mid" },
          { id: "missing", title: "見つからない場合を返す", body: "whileが終わった後は探索範囲が残っていません。", code: "return -1" },
          ],
          correctFeedback: "全テストケースを通過しました。二分探索を自分で実装できています。",
          incorrectFeedback: "未通過のテストケースとヒントを確認し、範囲更新や終了条件を見直しましょう。",
        },
      },
      preview: null,
      actionLabel: "提出する",
      order: 1,
    },
  ],
};

export const binarySearchCourseSeed: CourseSeed = {
  id: "course-algorithm-binary-search-v1",
  title: "二分探索",
  description:
    "順番に並んだデータから目的の値を効率よく見つける、二分探索の考え方とPythonコードへのつながりを学ぶコースです。Pythonのリスト、条件分岐、whileの基本を前提に、中央の値を手がかりに探索範囲を狭める動きを操作しながら段階的に理解します。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: true,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.SEARCH],
  missions: [missionOne, missionTwo, missionThree, missionFour, missionFive, missionSix, courseMission],
};
