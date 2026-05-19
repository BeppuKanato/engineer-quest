// prisma/seedData/learningSeed.ts

import {
  CourseCategoryType,
  CourseDifficulty,
  ExamDifficulty,
  LessonStepType,
} from "@prisma/client";

export const learningSeed = {
  course: {
    id: "course-web-basic",
    title: "Webページ制作入門",
    description:
      "HTML/CSSの基本を学び、簡単なWebページを作成するコースです。",
    difficulty: CourseDifficulty.EASY,
    isInitiallyUnlocked: true,
    isPublished: true,
    version: 1,
    categories: [CourseCategoryType.UI, CourseCategoryType.TOOL],
    missions: [
      {
        id: "mission-self-introduction-card",
        title: "自己紹介カードを作ろう",
        description:
          "見出し・文章・画像を並べた自己紹介カードUIを作成します。",
        difficulty: CourseDifficulty.EASY,
        goalImg: "/images/missions/self-introduction-card.png",
        order: 1,
        isPublished: true,
        lessons: [
          {
            id: "lesson-card-base",
            title: "カードの土台を作る",
            description: "divタグを使って、カードの基本構造を作ります。",
            order: 1,
            activities: [
              {
                id: "activity-card-base-tutorial",
                type: LessonStepType.TUTORIAL,
                title: "完成イメージを確認しよう",
                instruction:
                  "これから作る自己紹介カードの完成イメージを確認しましょう。",
                mentorMessage:
                  "まずは完成形を見ると、何を作るのかイメージしやすいよ！",
                content: {
                  summary: [
                    "自己紹介カードは、名前・説明文・好きなものを表示する小さなWeb部品です。",
                    "HTMLで構造を作り、CSSで見た目を整えていきます。",
                  ],
                },
                preview: {
                  type: "STATIC_HTML",
                  title: "完成イメージ",
                  html: `
<div style="padding:16px;border:1px solid #ddd;border-radius:12px;max-width:280px;">
  <h1 style="font-size:20px;margin:0 0 8px;">カナト</h1>
  <p style="margin:0;">情報系の大学院生です。</p>
</div>
                  `,
                  caption: "最終的にこのようなカードを作ります。",
                  minHeight: 180,
                },
                actionLabel: "次へ",
                order: 1,
              },
              {
                id: "activity-card-base-choice",
                type: LessonStepType.CHOICE,
                title: "カードの外枠に使うタグ",
                instruction:
                  "カード全体を囲むために使いやすいタグを選びましょう。",
                mentorMessage:
                  "複数の要素をまとめたいときは、箱のようなタグを使うと便利だよ。",
                content: {
                  choices: [
                    {
                      id: "choice-div",
                      label: "div",
                      isCorrect: true,
                      feedback:
                        "正解！divは複数の要素をまとめる箱としてよく使います。",
                    },
                    {
                      id: "choice-h1",
                      label: "h1",
                      isCorrect: false,
                      feedback: "h1は主見出しに使うタグです。",
                    },
                    {
                      id: "choice-p",
                      label: "p",
                      isCorrect: false,
                      feedback: "pは文章の段落に使うタグです。",
                    },
                  ],
                  correctFeedback:
                    "いいね！カードの土台にはdivが使いやすいです。",
                  incorrectFeedback: "タグの役割をもう一度確認してみよう。",
                },
                preview: {
                  type: "NO_PREVIEW",
                  title: "プレビューなし",
                },
                actionLabel: "答えを確認",
                order: 2,
              },
            ],
          },
          {
            id: "lesson-heading-and-text",
            title: "見出しと本文を追加する",
            description: "h1タグとpタグを使って、カードに文字を追加します。",
            order: 2,
            activities: [
              {
                id: "activity-heading-view",
                type: LessonStepType.VIEW,
                title: "h1とpの違いを知ろう",
                instruction:
                  "見出しと本文で使うタグの違いを確認しましょう。",
                mentorMessage:
                  "タグにはそれぞれ役割があるよ。見た目だけでなく意味も大事！",
                content: {
                  summary: [
                    "h1はページや部品の主見出しに使います。",
                    "pは説明文や本文の段落に使います。",
                  ],
                },
                preview: {
                  type: "STATIC_HTML",
                  title: "h1とpの例",
                  html: `
<h1>自己紹介カード</h1>
<p>これは自己紹介の本文です。</p>
                  `,
                  minHeight: 160,
                },
                actionLabel: "理解した",
                order: 1,
              },
              {
                id: "activity-heading-fill",
                type: LessonStepType.SELECT_FILL,
                title: "タグを穴埋めしよう",
                instruction:
                  "空欄に入るタグを選んで、見出しと本文を完成させましょう。",
                mentorMessage:
                  "開始タグと終了タグの対応に注目して選んでみよう。",
                content: {
                  blankArea: {
                    type: "CODE",
                    template:
                      "<__blank-1__>カナト</__blank-2__>\n<__blank-3__>情報系の大学院生です。</__blank-4__>",
                  },
                  blanks: [
                    {
                      id: "blank-1",
                      answerChoiceId: "choice-h1",
                      placeholder: "開始タグ",
                    },
                    {
                      id: "blank-2",
                      answerChoiceId: "choice-h1",
                      placeholder: "終了タグ",
                    },
                    {
                      id: "blank-3",
                      answerChoiceId: "choice-p",
                      placeholder: "開始タグ",
                    },
                    {
                      id: "blank-4",
                      answerChoiceId: "choice-p",
                      placeholder: "終了タグ",
                    },
                  ],
                  blankChoices: [
                    {
                      id: "choice-h1",
                      label: "h1",
                    },
                    {
                      id: "choice-p",
                      label: "p",
                    },
                    {
                      id: "choice-div",
                      label: "div",
                    },
                  ],
                  correctFeedback:
                    "正解！見出しと本文を正しく使い分けられています。",
                  incorrectFeedback:
                    "h1とpの役割をもう一度確認してみよう。",
                },
                preview: {
                  type: "STATIC_HTML",
                  title: "自己紹介カード",
                  html: `
<div style="padding:16px;border:1px solid #ddd;border-radius:12px;max-width:280px;">
  <h1>カナト</h1>
  <p>情報系の大学院生です。</p>
</div>
                  `,
                  minHeight: 180,
                },
                actionLabel: "確認する",
                order: 2,
              },
            ],
          },
        ],
        exam: {
          id: "exam-self-introduction-card",
          title: "自己紹介カードを完成させよう",
          description:
            "学んだタグを使って、自己紹介カードのHTMLを完成させましょう。",
          difficulty: ExamDifficulty.EASY,
          thumbnailUrl: "/images/missions/self-introduction-card.png",
          answerCode:
            '<div class="card">\n  <h1>カナト</h1>\n  <p>情報系の大学院生です。</p>\n</div>',
          initialCode: '<div class="card">\n  \n</div>',
          previewCss:
            ".card { padding: 16px; border: 1px solid #ddd; border-radius: 12px; max-width: 280px; }",
          estimatedTime: "5分",
          rewardExp: 30,
        },
      },
      {
        id: "mission-profile-layout",
        title: "プロフィール画面を整えよう",
        description:
          "画像とテキストを組み合わせて、見やすいプロフィール画面を作ります。",
        difficulty: CourseDifficulty.NORMAL,
        goalImg: "/images/missions/profile-layout.png",
        order: 2,
        isPublished: true,
        lessons: [],
        exam: {
          id: "exam-profile-layout",
          title: "プロフィール画面を完成させよう",
          description:
            "画像とテキストを並べたプロフィール画面を完成させましょう。",
          difficulty: ExamDifficulty.NORMAL,
          thumbnailUrl: "/images/missions/profile-layout.png",
          answerCode:
            '<div class="profile">\n  <img src="avatar.png" alt="avatar">\n  <p>よろしくお願いします。</p>\n</div>',
          initialCode: '<div class="profile">\n</div>',
          previewCss:
            ".profile { display: flex; gap: 12px; align-items: center; }",
          estimatedTime: "8分",
          rewardExp: 50,
        },
      },
      {
        id: "mission-news-card",
        title: "お知らせカードを作ろう",
        description:
          "リストとボタンを使って、簡単なお知らせカードを作ります。",
        difficulty: CourseDifficulty.NORMAL,
        goalImg: "/images/missions/news-card.png",
        order: 3,
        isPublished: true,
        lessons: [],
        exam: {
          id: "exam-news-card",
          title: "お知らせカードを完成させよう",
          description:
            "お知らせ本文とボタンを含むカードを完成させましょう。",
          difficulty: ExamDifficulty.NORMAL,
          thumbnailUrl: "/images/missions/news-card.png",
          answerCode:
            '<div class="news-card">\n  <p>新しいミッションが追加されました。</p>\n  <button>確認する</button>\n</div>',
          initialCode: '<div class="news-card">\n</div>',
          previewCss:
            ".news-card { padding: 16px; border: 1px solid #ddd; border-radius: 12px; }",
          estimatedTime: "8分",
          rewardExp: 50,
        },
      },
    ],
  },
};