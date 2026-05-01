import { Lesson } from "../type";

export const htmlSelfIntroductionLesson1: Lesson = {
  id: "lesson-1",
  courseId: "html-self-introduction-card-course",
  courseTitle: "HTMLで自己紹介カードを作ろう",
  title: "HTMLの基本を知ろう",
  description:
    "HTMLを使って、Webページに見出しや文章を表示する基本を学びます。自己紹介カードの土台になる、ページの内容と構造を作れるようになりましょう。",
  activities: [
    {
      id: "lesson-1-activity-1",
      type: "TUTORIAL",
      title: "HTMLとは？",
      instruction:
        "HTMLは、Webページに表示する内容と構造を書くための言語です。まずは、HTMLコードと表示結果の関係を見てみましょう。",
      mentorMessage:
        "HTMLを書くと、Webページに表示される内容を作ることができます。",
      goal: {
        type: "CODE_OUTPUT",
        title: "HTMLのイメージ",
        previewKey: "htmlIntroEditableTitle",
      },
      actionLabel: "次へ",
    },
    {
      id: "lesson-1-activity-2",
      type: "TUTORIAL",
      title: "タグで意味を表そう",
      instruction:
        "<h1> は大きな見出し、<p> は文章を表します。タグを使うことで、表示する内容の役割を決められます。",
      mentorMessage:
        "タグを切り替えると、同じ文字でも表示のされ方が変わります。",
      goal: {
        type: "CODE_OUTPUT",
        title: "タグの例",
        previewKey: "htmlHeadingTagSwitcher",
      },
      actionLabel: "次へ",
    },
    {
      id: "lesson-1-activity-3",
      type: "CHOICE",
      title: "見出しに使うタグを選ぼう",
      instruction:
        "ページの一番大きな見出しを表すタグはどれでしょう？表示結果を見ながら選んでみましょう。",
      mentorMessage:
        "さっき切り替えたタグを思い出して、見出しに合うものを選びましょう。",
      choices: [
        {
          id: "choice-1",
          label: "<h1>",
          isCorrect: true,
          feedback:
            "正解！<h1> はページの一番大きな見出しを表すタグです。",
        },
        {
          id: "choice-2",
          label: "<p>",
          isCorrect: false,
          feedback:
            "<p> は文章を表すタグです。大きな見出しには <h1> を使います。",
        },
        {
          id: "choice-3",
          label: "<img>",
          isCorrect: false,
          feedback:
            "<img> は画像を表示するためのタグです。見出しを表すタグではありません。",
        },
        {
          id: "choice-4",
          label: "<button>",
          isCorrect: false,
          feedback:
            "<button> はボタンを表示するためのタグです。見出しには使いません。",
        },
      ],
      goal: {
        type: "CODE_OUTPUT",
        title: "今回のゴール",
        previewKey: "htmlHeadingGoal",
      },
      actionLabel: "確認する",
    },
    {
      id: "lesson-1-activity-4",
      type: "FILL_BLANK",
      title: "見出しタグを埋めよう",
      instruction:
        "「自己紹介」を大きな見出しとして表示するために、空欄に入るタグを選びましょう。",
      mentorMessage:
        "選んだタグが、コードの空欄に入るイメージです。",
      codeTemplate: `<{{blank-1}}>自己紹介</{{blank-2}}>
<p>こんにちは。プログラミングを勉強中です。</p>`,
      blanks: [
        {
          id: "blank-1",
          answer: "h1",
          placeholder: "タグ名",
        },
        {
          id: "blank-2",
          answer: "h1",
          placeholder: "タグ名",
        },
      ],
      blankChoices: [
        {
          id: "blank-choice-1",
          label: "h1",
        },
        {
          id: "blank-choice-2",
          label: "p",
        },
        {
          id: "blank-choice-3",
          label: "img",
        },
        {
          id: "blank-choice-4",
          label: "button",
        },
      ],
      correctFeedback:
        "正解！<h1> で囲むことで、「自己紹介」を大きな見出しとして表示できます。",
      incorrectFeedback:
        "空欄には、見出しを表すタグ名を入れます。もう一度、表示結果を見て考えてみましょう。",
      goal: {
        type: "CODE_OUTPUT",
        title: "コードと表示",
        previewKey: "htmlHeadingBlank",
      },
      actionLabel: "確認する",
    },
    {
      id: "lesson-1-activity-5",
      type: "CHOICE",
      title: "文章に使うタグを選ぼう",
      instruction:
        "自己紹介文のような普通の文章を表示するときに使うタグはどれでしょう？",
      mentorMessage:
        "見出しではなく、文章として読ませたい内容に使うタグを選びましょう。",
      choices: [
        {
          id: "choice-1",
          label: "<p>",
          isCorrect: true,
          feedback:
            "正解！<p> は paragraph の略で、文章のまとまりを表すタグです。",
        },
        {
          id: "choice-2",
          label: "<h1>",
          isCorrect: false,
          feedback:
            "<h1> は大きな見出しを表すタグです。文章には <p> を使います。",
        },
        {
          id: "choice-3",
          label: "<img>",
          isCorrect: false,
          feedback:
            "<img> は画像を表示するタグです。文章を表示するタグではありません。",
        },
        {
          id: "choice-4",
          label: "<input>",
          isCorrect: false,
          feedback:
            "<input> は入力欄を作るタグです。文章を表示する目的とは違います。",
        },
      ],
      goal: {
        type: "CODE_OUTPUT",
        title: "文章の表示例",
        previewKey: "htmlParagraphGoal",
      },
      actionLabel: "確認する",
    },
    {
      id: "lesson-1-activity-6",
      type: "SHORT_INPUT",
      title: "自己紹介の見出しを書いてみよう",
      instruction:
        "自己紹介ページの一番上に表示する見出しを入力してみましょう。ここでは正解は1つではありません。",
      mentorMessage:
        "自分のページのタイトルになる短い言葉を書いてみましょう。",
      input: {
        placeholder: "例：自己紹介",
        minLength: 1,
        maxLength: 20,
        answer: "自己紹介",
      },
      correctFeedback:
        "いいですね！見出しを書くと、ページの内容が伝わりやすくなります。",
      incorrectFeedback:
        "1文字以上、20文字以内で見出しを入力してみましょう。",
      goal: {
        type: "CODE_OUTPUT",
        title: "見出しの表示",
        previewKey: "htmlCustomHeadingInput",
      },
      actionLabel: "確認する",
    },
    {
      id: "lesson-1-activity-7",
      type: "ORDERING",
      title: "HTMLの順番を並べよう",
      instruction:
        "自己紹介ページとして自然に見えるように、HTMLの要素を上から順に並べましょう。",
      mentorMessage:
        "Webページは、基本的に上に書いたものから順番に表示されます。",
      // ORDERING 用。今の型にまだないなら、後で追加するとよい
      orderingItems: [
        { id: "item-1", label: "<h1>自己紹介</h1>", order: 1 },
        { id: "item-2", label: "<p>こんにちは。プログラミングを勉強中です。</p>", order: 2 },
        { id: "item-3", label: "<button>もっと見る</button>", order: 3 },
      ],
      correctFeedback:
        "正解！見出し、文章、ボタンの順に並べると、自然な自己紹介ページになります。",
      incorrectFeedback:
        "まずページの見出し、そのあと説明文、最後に操作できるボタンを置くと自然です。",
      goal: {
        type: "CODE_OUTPUT",
        title: "表示の順番",
        previewKey: "htmlElementOrdering",
      },
      actionLabel: "確認する",
    },
    {
      id: "lesson-1-activity-8",
      type: "TRACE",
      title: "HTMLが表示される流れを確認しよう",
      instruction:
        "HTMLは、上から順番に読み取られて画面に表示されます。どの順番で表示されるか確認しましょう。",
      mentorMessage:
        "コードの上から順に、画面にも上から表示されるイメージです。",
      codeTemplate: `<h1>自己紹介</h1>
<p>こんにちは。プログラミングを勉強中です。</p>
<button>もっと見る</button>`,
      correctFeedback:
        "正解！HTMLは基本的に、上に書いた要素から順に表示されます。",
      incorrectFeedback:
        "コードの上から順番に、表示結果にも反映されると考えてみましょう。",
      goal: {
        type: "CODE_OUTPUT",
        title: "表示される順番",
        previewKey: "htmlRenderTrace",
      },
      actionLabel: "確認する",
    },
    {
      id: "lesson-1-activity-9",
      type: "VIEW",
      title: "HTMLの基本を確認できました",
      instruction:
        "このレッスンでは、HTMLがWebページの内容と構造を表すこと、<h1> が見出し、<p> が文章を表すことを学びました。",
      mentorMessage:
        "これで、自己紹介カードに入れる文字の土台を作る準備ができました！",
      summary: [
        "HTMLはWebページの内容と構造を書くための言語",
        "<h1> は大きな見出しを表す",
        "<p> は文章を表す",
        "HTMLは上に書いたものから順番に表示される",
      ],
      goal: {
        type: "CODE_OUTPUT",
        title: "今回のまとめ",
        previewKey: "htmlBasicSummary",
      },
      actionLabel: "レッスン完了",
    },
  ],
};