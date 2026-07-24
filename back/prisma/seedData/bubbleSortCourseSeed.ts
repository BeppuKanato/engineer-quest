import {
  CourseCategoryType,
  CourseDifficulty,
  MissionActivityType,
  MissionType,
} from "@prisma/client";
import type {
  ActivitySeed,
  CourseSeed,
  MissionSeed,
  SectionSeed,
} from "./learningSeedTypes";

type ActivityPlan = {
  slug: string;
  title: string;
  kind: "view" | "choice" | "order" | "fill";
  body: string;
  values?: number[];
  correct?: string;
  wrong?: string[];
  steps?: string[];
};

type SectionPlan = {
  slug: string;
  title: string;
  description: string;
  activities: ActivityPlan[];
};

const choiceContent = (plan: ActivityPlan) => ({
  body: plan.body,
  question: plan.body,
  choices: [
    {
      id: `${plan.slug}-correct`,
      label: plan.correct ?? "正しい処理",
      isCorrect: true,
      feedback: "正解です。直前に見た動きと理由を結び付けられています。",
    },
    ...(plan.wrong ?? ["別の処理", "まだ判断できない"]).map((label, index) => ({
      id: `${plan.slug}-wrong-${index + 1}`,
      label,
      isCorrect: false,
      feedback: "惜しいです。比較中の位置と、左の値が大きいかを確認しましょう。",
    })),
  ],
});

const toActivity = (
  missionSlug: string,
  plan: ActivityPlan,
  order: number,
  sectionOrder: number,
): ActivitySeed => {
  if (plan.kind === "choice") {
    return {
      id: `${missionSlug}-${plan.slug}`,
      type: MissionActivityType.CHOICE,
      title: plan.title,
      instruction: plan.title,
      mentorMessage: "まず予想し、理由を言葉にしてから選びましょう。",
      content: choiceContent(plan),
      preview: null,
      actionLabel: "答えを確認する",
      order,
      sectionOrder,
      isMissionCheck: false,
    };
  }

  if (plan.kind === "order") {
    const labels = plan.steps ?? [
      "隣り合う2つを見る",
      "左側が大きいか確認する",
      "必要なら交換する",
      "比較位置を右へ進める",
    ];
    const steps = labels.map((label, index) => ({
      id: `${missionSlug}-${plan.slug}-step-${index + 1}`,
      label,
    }));
    return {
      id: `${missionSlug}-${plan.slug}`,
      type: MissionActivityType.ORDERED_STEPS,
      title: plan.title,
      instruction: plan.body,
      mentorMessage: "動いた順番を、そのまま処理ブロックへ置き換えます。",
      content: {
        body: plan.body,
        steps,
        answerOrder: steps.map((step) => step.id),
        animationValues: plan.values,
        correctFeedback: "正解です。並べた処理に沿って動きを再生します。",
        incorrectFeedback: "ユーザーの並び順は保持されています。判断してから交換する順番を見直しましょう。",
      },
      preview: null,
      actionLabel: "順番を確認する",
      order,
      sectionOrder,
      isMissionCheck: false,
    };
  }

  if (plan.kind === "fill") {
    return {
      id: `${missionSlug}-${plan.slug}`,
      type: MissionActivityType.SELECT_FILL,
      title: plan.title,
      instruction: plan.body,
      mentorMessage: "図の位置とPythonの添字を対応させましょう。",
      content: {
        body: plan.body,
        correctAnswers: plan.correct ?? ">",
        correctFeedback: "正解です。動きとPythonコードが対応しています。",
        incorrectFeedback: "比較する2つの位置と確定済み範囲を確認しましょう。",
      },
      preview: null,
      actionLabel: "空欄を確認する",
      order,
      sectionOrder,
      isMissionCheck: false,
    };
  }

  return {
    id: `${missionSlug}-${plan.slug}`,
    type: MissionActivityType.VIEW,
    title: plan.title,
    instruction: plan.body,
    mentorMessage: "操作しながら、どの値と位置が変わるか観察しましょう。",
    content: {
      body: plan.body,
      ...(plan.values ? { algorithmValues: plan.values } : {}),
    },
    preview: null,
    actionLabel: "動きを確認した",
    order,
    sectionOrder,
    isMissionCheck: false,
  };
};

const missionCheck = (
  missionSlug: string,
  order: number,
  sectionOrder: number,
  question: string,
  correct: string,
  wrong: string[],
): ActivitySeed => ({
  id: `${missionSlug}-check-${sectionOrder}`,
  type: MissionActivityType.MISSION_CHECK,
  title: `Mission Check ${sectionOrder}`,
  instruction: "このMissionで扱った内容だけを確認します。",
  mentorMessage: "答えだけでなく、なぜそうなるかも思い出しましょう。",
  content: {
    checkType: "CHOICE",
    question,
    choices: [
      {
        id: `${missionSlug}-check-${sectionOrder}-correct`,
        label: correct,
        isCorrect: true,
        feedback: "正解です。次のMissionでこの考え方を使います。",
      },
      ...wrong.map((label, index) => ({
        id: `${missionSlug}-check-${sectionOrder}-wrong-${index + 1}`,
        label,
        isCorrect: false,
        feedback: "直前のActivityの配列と強調表示をもう一度確認しましょう。",
      })),
    ],
  },
  preview: null,
  actionLabel: "理解を確認する",
  order,
  sectionOrder,
  isMissionCheck: true,
});

const buildMission = ({
  slug,
  order,
  title,
  description,
  learnedItems,
  sections,
  checks,
}: {
  slug: string;
  order: number;
  title: string;
  description: string;
  learnedItems: string[];
  sections: SectionPlan[];
  checks: Array<{ question: string; correct: string; wrong: string[] }>;
}): MissionSeed => {
  const missionId = `algorithm-${slug}`;
  let activityOrder = 0;
  const builtSections: SectionSeed[] = sections.map((section, sectionIndex) => ({
    id: `${missionId}-${section.slug}`,
    title: section.title,
    description: section.description,
    order: sectionIndex + 1,
    activities: section.activities.map((activity, activityIndex) =>
      toActivity(missionId, activity, ++activityOrder, activityIndex + 1),
    ),
  }));

  builtSections.push({
    id: `${missionId}-check-section`,
    title: "Mission Check",
    description: "このMissionで学んだ主要な内容を確認します。",
    order: builtSections.length + 1,
    activities: checks.map((check, index) =>
      missionCheck(
        missionId,
        ++activityOrder,
        index + 1,
        check.question,
        check.correct,
        check.wrong,
      ),
    ),
  });

  return {
    id: missionId,
    title,
    description,
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/web-flow.png",
    estimatedMinutes: order === 6 ? 8 : 4,
    order,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 80,
    learnedItems,
    isPublished: true,
    sections: builtSections,
  };
};

const missions: MissionSeed[] = [
  buildMission({
    slug: "bubble-sort-purpose",
    order: 1,
    title: "ソートとは何か",
    description: "数字を決められた順番へ並べ替え、昇順・降順と利点を理解します。",
    learnedItems: ["ソートの意味", "昇順と降順", "ソートの利点"],
    sections: [
      {
        slug: "arrange",
        title: "数字を並べ替える",
        description: "前提知識なしで、カードを小さい順へ並べる体験から始めます。",
        activities: [{
          slug: "experience-sort", title: "ソートを体験する", kind: "order",
          body: "4、1、3、2を小さい順へ並べ、並べ替える処理を体験します。",
          steps: ["1", "2", "3", "4"],
        }],
      },
      {
        slug: "ascending-descending",
        title: "昇順と降順を使い分ける",
        description: "同じ数字を、指定された方向へ並べます。",
        activities: [{
          slug: "choose-direction", title: "指定された順番に並べる", kind: "choice",
          body: "6、2、9、4を降順にした結果はどれですか。",
          correct: "[9, 6, 4, 2]", wrong: ["[2, 4, 6, 9]", "[9, 4, 6, 2]"],
        }],
      },
      {
        slug: "benefits",
        title: "ソートすると何が便利か",
        description: "並べ替え前後を比べ、探す・比較する利点を理解します。",
        activities: [
          {
            slug: "compare-before-after", title: "並べ替える前後を比較する", kind: "view",
            body: "17、4、12、1、9、15、6、3を並べ替える前後で、最小値や最大値の位置を比べます。",
          },
          {
            slug: "summarize-benefit", title: "ソートの利点をまとめる", kind: "choice",
            body: "数字をソートする利点として適切なものはどれですか。",
            correct: "数字を探しやすくなる", wrong: ["数字がすべて同じになる", "数字の個数が減る"],
          },
        ],
      },
    ],
    checks: [
      { question: "小さい順を表す言葉は？", correct: "昇順", wrong: ["降順", "交換"] },
      { question: "ソートの利点は？", correct: "条件に合う値を探しやすい", wrong: ["要素が消える", "値が同じになる"] },
    ],
  }),
  buildMission({
    slug: "bubble-sort-basic",
    order: 2,
    title: "バブルソートの基本動作を知る",
    description: "隣り合う数字を比較し、左が大きいときに交換します。",
    learnedItems: ["隣接比較", "交換条件"],
    sections: [
      {
        slug: "observe",
        title: "バブルソートの動きを見る",
        description: "5、2、4、1が少しずつ動く様子から共通点を見つけます。",
        activities: [
          { slug: "watch-values", title: "数字が動く様子を観察する", kind: "view", body: "次のステップを押し、比較と交換を観察します。", values: [5, 2, 4, 1] },
          { slug: "find-pattern", title: "動きの共通点を考える", kind: "choice", body: "交換したのはどのような場合ですか。", correct: "左の数字が右より大きい場合", wrong: ["左が小さい場合", "数字が同じ場合"] },
        ],
      },
      {
        slug: "compare-swap",
        title: "比較と交換のルールを使う",
        description: "複数の組について交換するか判断します。",
        activities: [
          { slug: "judge-swap", title: "交換するか判断する", kind: "choice", body: "5と2を昇順にするとき、どうしますか。", correct: "交換する", wrong: ["交換しない", "両方消す"] },
          { slug: "compare-to-swap", title: "比較から交換までの流れを確認する", kind: "order", body: "3、6、2、5で6と2を比較する処理を並べます。", values: [3, 6, 2, 5] },
        ],
      },
    ],
    checks: [
      { question: "最初に比較するのは？", correct: "隣り合う2つ", wrong: ["両端", "最大値と最小値"] },
      { question: "6と2はどうする？", correct: "交換する", wrong: ["そのまま", "削除する"] },
    ],
  }),
  buildMission({
    slug: "bubble-sort-one-pass",
    order: 3,
    title: "比較と交換を右端まで繰り返す",
    description: "比較位置を右へ動かし、1周で最大値が右端へ移る理由を理解します。",
    learnedItems: ["比較位置", "1周の走査", "最大値の確定"],
    sections: [
      {
        slug: "move-position", title: "比較する位置を右へ動かす",
        description: "現在位置と次の位置を区別します。",
        activities: [
          { slug: "predict-next-pair", title: "次に比較する数字を考える", kind: "choice", body: "5と2を交換した後、次に比較する組は？", correct: "5と4", wrong: ["2と1", "5と1"] },
          { slug: "continue-right", title: "右端まで処理を続ける", kind: "view", body: "比較位置jが右へ進む様子を確認します。", values: [6, 3, 5, 2] },
        ],
      },
      {
        slug: "largest-to-right", title: "右端へ移動する数字を考える",
        description: "最大値が交換を繰り返して右へ動く理由を考えます。",
        activities: [
          { slug: "why-largest", title: "なぜ最大値が右へ動くのか", kind: "choice", body: "5が右端へ移動した理由は？", correct: "右隣より大きいたびに交換されたから", wrong: ["最初から右端だったから", "同時に全要素が並んだから"] },
          { slug: "predict-rightmost", title: "右端へ移動する数字を予想する", kind: "choice", body: "3、7、2、4を1周すると右端へ移る値は？", correct: "7", wrong: ["2", "3"] },
        ],
      },
      {
        slug: "process-blocks", title: "処理の流れをまとめる",
        description: "見た動きを日本語の処理ブロックへ変換します。",
        activities: [
          { slug: "map-blocks", title: "処理ブロックと動きを対応させる", kind: "view", body: "比較、条件判断、交換、右へ進む、を画面の動きと対応させます。", values: [4, 1, 3, 2] },
          { slug: "order-blocks", title: "処理ブロックを並べる", kind: "order", body: "1周分の処理ブロックを正しい順番へ並べます。", values: [4, 1, 3, 2] },
        ],
      },
    ],
    checks: [
      { question: "1周後に右端で確定するのは？", correct: "未確定範囲の最大値", wrong: ["最小値", "左端の値"] },
      { question: "比較位置はどう動く？", correct: "1つずつ右へ動く", wrong: ["毎回左端へ戻る", "ランダムに動く"] },
    ],
  }),
  buildMission({
    slug: "bubble-sort-multiple-passes",
    order: 4,
    title: "複数回の処理で全体を並べ替える",
    description: "1周分の処理を繰り返し、配列全体が整列する流れを追います。",
    learnedItems: ["複数周", "全体の整列", "外側の繰り返し"],
    sections: [
      {
        slug: "why-repeat", title: "1回では完成しない理由を知る",
        description: "1周後にまだ未整列の部分が残ることを確認します。",
        activities: [
          { slug: "inspect-after-pass", title: "処理後の配列を確認する", kind: "view", body: "1周後は最大値だけが確定し、左側には未整列部分が残ります。", values: [5, 2, 4, 1] },
          { slug: "next-range", title: "次の周で処理する部分を見る", kind: "choice", body: "次の周で処理するのは？", correct: "確定した右端を除く部分", wrong: ["右端だけ", "何も処理しない"] },
        ],
      },
      {
        slug: "follow-passes", title: "複数周の動きを追う",
        description: "2周目以降の変化を操作して確認します。",
        activities: [
          { slug: "second-pass", title: "2周目を進める", kind: "view", body: "再生と前後移動で2周目を追います。", values: [6, 3, 5, 2, 4] },
          { slug: "remaining-passes", title: "残りの処理を進める", kind: "view", body: "確定領域が末尾から増える様子を確認します。", values: [6, 3, 5, 2, 4] },
        ],
      },
      {
        slug: "whole-process", title: "バブルソート全体を確認する",
        description: "予想、日本語ブロック、アニメーションを結び付けます。",
        activities: [
          { slug: "predict-passes", title: "複数周の変化を予想する", kind: "choice", body: "周回が進むと確定領域はどうなりますか。", correct: "末尾から増える", wrong: ["毎回消える", "左端だけになる"] },
          { slug: "review-whole-blocks", title: "全体の処理ブロックを確認する", kind: "view", body: "走査を繰り返す外側の処理と、比較する内側の処理を分けます。", values: [7, 3, 5, 2, 6] },
          { slug: "order-whole-blocks", title: "全体の処理ブロックを並べる", kind: "order", body: "複数周を含む全体の順序を並べます。", values: [7, 3, 5, 2, 6], steps: ["配列の長さを確認する", "走査を繰り返す", "未確定範囲を左から確認する", "隣接要素を比較する", "左が大きければ交換する", "末尾側を確定する"] },
        ],
      },
    ],
    checks: [
      { question: "1周だけで必ず全体が整列する？", correct: "しない。未整列部分が残る", wrong: ["必ず完成する", "要素が消える"] },
      { question: "全体を整列する方法は？", correct: "未確定範囲への走査を繰り返す", wrong: ["右端だけ比較する", "最初の2つだけ交換する"] },
    ],
  }),
  buildMission({
    slug: "bubble-sort-range",
    order: 5,
    title: "比較する範囲を整理する",
    description: "確定済み領域を除外し、周回ごとに比較範囲が短くなる理由を理解します。",
    learnedItems: ["確定済み領域", "比較範囲", "比較回数"],
    sections: [
      {
        slug: "find-sorted", title: "確定した数字を見つける",
        description: "1周後に確定する値と位置を確認します。",
        activities: [
          { slug: "see-sorted-value", title: "1周後に確定した数字を見る", kind: "view", body: "右端の確定ラベルに注目します。", values: [5, 2, 4, 1] },
          { slug: "see-sorted-range", title: "確定済みの範囲を確認する", kind: "choice", body: "2周後に確定済みなのは？", correct: "末尾側の2要素", wrong: ["先頭だけ", "すべて"] },
        ],
      },
      {
        slug: "shorten-range", title: "比較する範囲を短くする",
        description: "確定済みを再比較しない理由を考えます。",
        activities: [
          { slug: "select-next-range", title: "次の周の比較範囲を選ぶ", kind: "choice", body: "次の周で比較する範囲は？", correct: "確定済みを除く範囲", wrong: ["確定済みだけ", "配列の外側"] },
          { slug: "explain-no-recompare", title: "再比較しない理由を説明する", kind: "choice", body: "確定済みを除外できる理由は？", correct: "その位置に入る値が決まったから", wrong: ["値が削除されたから", "比較できない値だから"] },
        ],
      },
      {
        slug: "comparison-count", title: "比較回数の変化を考える",
        description: "数式より先に、画面上で範囲が短くなる様子を見ます。",
        activities: [
          { slug: "count-by-length", title: "要素数と比較回数を見る", kind: "view", body: "5要素の1周目では隣接比較が4回です。", values: [5, 1, 4, 2, 3] },
          { slug: "count-by-pass", title: "周回ごとの比較回数を確認する", kind: "choice", body: "5要素の2周目の比較回数は？", correct: "3回", wrong: ["4回", "5回"] },
        ],
      },
    ],
    checks: [
      { question: "比較範囲が短くなる理由は？", correct: "末尾側が確定済みになるから", wrong: ["値がなくなるから", "先頭を使わないから"] },
      { question: "5要素の1周目の比較回数は？", correct: "4回", wrong: ["5回", "1回"] },
    ],
  }),
  buildMission({
    slug: "bubble-sort-python",
    order: 6,
    title: "バブルソートをPythonで表す",
    description: "配列と添字から始め、比較・交換・内側と外側のループへ段階的に対応づけます。",
    learnedItems: ["配列と添字", "比較条件", "交換代入", "二重ループ", "n - i - 1"],
    sections: [
      {
        slug: "indices", title: "数字の位置をコードで表す",
        description: "配列のカード位置をPythonの添字へ置き換えます。",
        activities: [
          { slug: "map-index", title: "配列と添字を対応させる", kind: "choice", body: "array = [5, 2, 4, 1] の2を表すのは？", correct: "array[1]", wrong: ["array[2]", "array[5]"] },
          { slug: "adjacent-index", title: "隣り合う数字を表す", kind: "fill", body: "右隣の値は array[j + ___] と表します。", correct: "1" },
        ],
      },
      {
        slug: "compare-exchange-code", title: "比較と交換をコードにする",
        description: "先に見た動きを、短いPython式へ変換します。",
        activities: [
          { slug: "view-condition", title: "比較条件をコードで見る", kind: "view", body: "if array[j] > array[j + 1]: が左側の方が大きいかを判断します。", values: [5, 2, 4, 1] },
          { slug: "fill-condition", title: "比較条件を短く穴埋めする", kind: "fill", body: "if array[j] ___ array[j + 1]:", correct: ">" },
          { slug: "view-swap", title: "交換処理をコードで見る", kind: "view", body: "2つの代入先と値が反対になることを動きで確認します。", values: [5, 2, 4, 1] },
          { slug: "select-swap", title: "交換処理を選ぶ", kind: "choice", body: "正しい交換処理は？", correct: "array[j], array[j + 1] = array[j + 1], array[j]", wrong: ["array[j] = array[j]", "array[j + 1] = 0"] },
        ],
      },
      {
        slug: "inner-loop", title: "右端までの繰り返しをコードにする",
        description: "比較位置jと内側のループを対応づけます。",
        activities: [
          { slug: "map-j", title: "比較位置の変化とjを対応させる", kind: "view", body: "jが0、1、2と増えると、比較枠が右へ動きます。", values: [6, 3, 5, 2] },
          { slug: "view-inner-loop", title: "内側のループを見る", kind: "view", body: "for j in range(n - i - 1): が未確定範囲を走査します。", values: [6, 3, 5, 2] },
          { slug: "order-compare-code", title: "比較と交換のコードを並べる", kind: "order", body: "Pythonコードの役割を実行順へ並べます。", values: [6, 3, 5, 2], steps: ["jの範囲を決める", "隣り合う値を比較する", "左が大きければ交換する", "次のjへ進む"] },
        ],
      },
      {
        slug: "outer-loop", title: "複数周と比較範囲をコードにする",
        description: "周回iと短くなる比較範囲を対応づけます。",
        activities: [
          { slug: "learn-i", title: "周回を表すiを知る", kind: "choice", body: "外側のループのiが表すものは？", correct: "何周目か", wrong: ["現在の値", "交換した値"] },
          { slug: "decompose-range", title: "比較範囲の式を分解する", kind: "view", body: "nは要素数、iは確定した末尾側の個数、最後の1は右隣へはみ出さないためです。", values: [7, 3, 5, 2, 6] },
          { slug: "fill-range", title: "周回ごとの比較範囲を選ぶ", kind: "fill", body: "for j in range(n - i - ___):", correct: "1" },
        ],
      },
      {
        slug: "assemble-code", title: "完成コードを組み立てる",
        description: "日本語、処理ブロック、Pythonコードを一つにつなげます。",
        activities: [
          { slug: "map-language-code", title: "日本語とコードを対応させる", kind: "view", body: "各コード行が、比較・交換・周回・確定領域のどれに対応するか確認します。", values: [4, 2, 4, 1, 2] },
          { slug: "order-code-blocks", title: "コードブロックを並べる", kind: "order", body: "完成コードの大きなブロックを順番へ並べます。", values: [4, 2, 4, 1, 2], steps: ["配列の長さを取得する", "外側のループを書く", "内側のループを書く", "比較条件を書く", "交換処理を書く", "配列を返す"] },
          { slug: "finish-short-fill", title: "短い穴埋めで完成させる", kind: "fill", body: "if array[j] ___ array[j + 1]:", correct: ">" },
        ],
      },
    ],
    checks: [
      { question: "右隣を表す添字は？", correct: "j + 1", wrong: ["j - 2", "i + n"] },
      { question: "n - i - 1のiは何を除く？", correct: "末尾の確定済み領域", wrong: ["先頭の値", "配列全体"] },
      { question: "交換条件の演算子は？", correct: ">", wrong: ["<", "=="] },
    ],
  }),
];

const sampleCode = `def bubble_sort(array):
    n = len(array)

    for i in range(n - 1):
        for j in range(n - i - 1):
            if array[j] > array[j + 1]:
                array[j], array[j + 1] = array[j + 1], array[j]

    return array


numbers = [5, 2, 4, 1, 3]
result = bubble_sort(numbers)
print(result)`;

const courseMission: MissionSeed = {
  id: "bubble-sort-course-mission",
  title: "Course Mission：バブルソートを完成させる",
  description: "新しい内容は増やさず、学習済みの完成コードを見ながら正確に写経します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/web-flow.png",
  estimatedMinutes: 6,
  order: 7,
  type: MissionType.COURSE_EXAM,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 150,
  learnedItems: ["完成コードの構造", "複数テストケース", "バブルソートの実行過程"],
  isPublished: true,
  sections: [
    {
      id: "bubble-sort-course-mission-prepare",
      title: "写経前の確認",
      description: "見本コードの各部分がどの処理に対応するか、最後に確認します。",
      order: 1,
      activities: [
        {
          id: "bubble-sort-course-mission-overview",
          type: MissionActivityType.VIEW,
          title: "完成コードの構造を確認する",
          instruction: "比較、交換、内側ループ、外側ループを確認します。",
          mentorMessage: "ここでは新しい構文を学びません。これまでの処理を一つにつなげます。",
          content: { body: "左の見本を上から追い、各行と配列の動きを対応づけます。", algorithmValues: [5, 2, 4, 1, 3] },
          preview: null,
          actionLabel: "写経へ進む",
          order: 1,
          sectionOrder: 1,
          isMissionCheck: false,
        },
      ],
    },
    {
      id: "bubble-sort-course-mission-transcription",
      title: "完成コードを写経する",
      description: "差分を直し、見本と一致したコードをブラウザ内で実行します。",
      order: 2,
      activities: [{
        id: "bubble-sort-course-mission-final",
        type: MissionActivityType.MISSION_CHECK,
        title: "バブルソートを完成させる",
        instruction: "見本と同じコードを入力し、差分確認後に実行します。",
        mentorMessage: "自由実装ではありません。空行とインデントもコードの構造として写します。",
        content: {
          checkType: "TRY_CODE",
          courseCheck: true,
          starterCode: "",
          sampleCode,
          answerCode: sampleCode,
          tests: [
            { input: [5, 2, 4, 1, 3], expected: [1, 2, 3, 4, 5] },
            { input: [9, 7, 5, 3, 1], expected: [1, 3, 5, 7, 9] },
            { input: [1, 2, 3, 4, 5], expected: [1, 2, 3, 4, 5] },
            { input: [4, 2, 4, 1, 2], expected: [1, 2, 2, 4, 4] },
          ],
          correctFeedback: "見本と一致し、すべてのテストを確認できました。",
          incorrectFeedback: "差分ラベルを確認し、見本と同じ構造へ修正しましょう。",
        },
        preview: null,
        actionLabel: "Course Missionを完了する",
        order: 2,
        sectionOrder: 1,
        isMissionCheck: true,
      }],
    },
  ],
};

missions.push(courseMission);

export const bubbleSortCourseSeed: CourseSeed = {
  id: "course-algorithm-bubble-sort",
  title: "バブルソートの動きを理解する",
  description: "数字カードとアニメーションで比較・交換・複数周・比較範囲を理解し、最後にPythonコードを写経して実行します。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: true,
  isPublished: true,
  version: 2,
  categories: [CourseCategoryType.SORT],
  missions,
};
