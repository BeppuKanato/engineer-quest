// prisma/seedData/learningSeed.ts

import {
  CourseCategoryType,
  CourseDifficulty,
  MissionActivityType,
  MissionType,
} from "@prisma/client";

import {
  defineMissionVisual,
  type MissionVisualContent,
} from "../../src/type/missionVisual";

type ChoiceItem = {
  id: string;
  label: string;
  isCorrect: boolean;
  feedback: string;
};

type MatchAnswer = {
  targetId: string;
  itemIds: string[];
};

type ActivitySeed = {
  id: string;
  type: MissionActivityType;
  title: string;
  instruction: string;
  mentorMessage: string;
  content: Record<string, unknown> & {
    visual?: MissionVisualContent;
  };
  preview: Record<string, unknown> | null;
  actionLabel: string;
  order: number;
  sectionOrder: number | null;
  isMissionCheck: boolean;
};

type SectionSeed = {
  id: string;
  title: string;
  description?: string;
  order: number;
  activities: ActivitySeed[];
};

type MissionSeed = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  goalImg: string;
  estimatedMinutes: number;
  order: number;
  type: MissionType;
  isRequiredForCourseCompletion: boolean;
  parentMissionId: string | null;
  roadmapLane: number;
  branchOrder: number;
  rewardExp: number;
  learnedItems: string[];
  isPublished: boolean;
  sections: SectionSeed[];
};

type CourseSeed = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  isInitiallyUnlocked: boolean;
  isPublished: boolean;
  version: number;
  categories: CourseCategoryType[];
  missions: MissionSeed[];
};

const noPreview = null;

const courseVisuals = {
  requestResponse: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "FLOW_DIAGRAM",
      title: "ブラウザとサーバのやり取り",
      caption: "ブラウザのお願いに対して、サーバが返事を返します。",
      nodes: [
        {
          id: "browser",
          label: "ブラウザ",
          description: "ページをお願いする",
          icon: "browser",
          tone: "blue",
        },
        {
          id: "server",
          label: "サーバ",
          description: "内容を用意して返す",
          icon: "server",
          tone: "gray",
        },
      ],
      edges: [
        {
          id: "browser-server",
          from: "browser",
          to: "server",
          label: "リクエスト（お願い）",
          reverseLabel: "レスポンス（返事）",
          bidirectional: true,
        },
      ],
    },
  }),
  frontendBackend: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "見える部分と裏側の処理",
      caption: "ユーザーに見える部分と、サーバ側で動く処理を分けて考えます。",
      panels: [
        {
          id: "frontend",
          title: "フロントエンド",
          subtitle: "画面側",
          tone: "blue",
          items: ["HTML / CSS", "見た目を作る", "ユーザーの操作を受け取る"],
        },
        {
          id: "backend",
          title: "バックエンド",
          subtitle: "サーバ側",
          tone: "green",
          items: ["Python / Flask", "データを処理する", "保存や取得を行う"],
        },
      ],
    },
  }),
  responseKinds: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "COMPARE_PANEL",
      title: "レスポンスの代表例",
      caption: "サーバから返るものは、画面だけとは限りません。",
      panels: [
        {
          id: "html",
          title: "HTML",
          tone: "blue",
          items: ["Webページの内容", "ブラウザが画面として表示"],
        },
        {
          id: "json",
          title: "JSON",
          tone: "green",
          items: ["データのまとまり", "APIのやり取りでよく使う"],
        },
        {
          id: "error",
          title: "エラー",
          tone: "orange",
          items: ["処理できなかったことを伝える", "原因を確認する手がかり"],
        },
      ],
    },
  }),
  localhost: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "ILLUSTRATION_PANEL",
      title: "自分のPC内で通信を試す",
      caption: "ブラウザと開発用サーバを、同じPCで動かして確認できます。",
      image: {
        src: "/images/visuals/localhost-development.png",
        alt: "学生が自分のパソコン内でブラウザと開発用サーバの通信を確認しているイラスト",
        width: 1672,
        height: 941,
      },
    },
  }),
  developmentProduction: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "開発環境と公開環境",
      panels: [
        {
          id: "development",
          title: "開発環境",
          subtitle: "作りながら試す場所",
          tone: "blue",
          items: ["自分や開発者が使う", "変更と確認を繰り返す"],
        },
        {
          id: "production",
          title: "公開環境",
          subtitle: "利用者が使う場所",
          tone: "green",
          items: ["他の人がアクセスする", "安定して動くことを重視する"],
        },
      ],
    },
  }),
  htmlCss: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "HTMLとCSSの担当",
      panels: [
        {
          id: "html",
          title: "HTML",
          subtitle: "内容と構造",
          tone: "blue",
          items: ["見出し", "文章", "入力欄やボタン"],
        },
        {
          id: "css",
          title: "CSS",
          subtitle: "見た目",
          tone: "purple",
          items: ["色", "余白", "配置や大きさ"],
        },
      ],
    },
  }),
  pythonFlask: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "PythonとFlaskの関係",
      panels: [
        {
          id: "python",
          title: "Python",
          subtitle: "処理を書く言語",
          tone: "blue",
          items: ["計算や条件分岐", "データを扱う処理"],
        },
        {
          id: "flask",
          title: "Flask",
          subtitle: "Webアプリ化を助ける道具",
          tone: "green",
          items: ["URLと処理をつなぐ", "HTMLやデータを返す"],
        },
      ],
    },
  }),
  databaseApi: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "DBとAPIの担当",
      panels: [
        {
          id: "database",
          title: "データベース",
          subtitle: "保存",
          tone: "green",
          items: ["予約や投稿を残す", "あとから検索・取得する"],
        },
        {
          id: "api",
          title: "API",
          subtitle: "外部連携",
          tone: "orange",
          items: ["別サービスへ依頼する", "結果をデータで受け取る"],
        },
      ],
    },
  }),
  formProcessing: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "フォーム入力が表示されるまで",
      caption: "入力はブラウザからサーバへ送られ、処理結果が画面へ返ります。",
      nodes: [
        {
          id: "browser-input",
          label: "入力画面",
          description: "フォームへ入力する",
          icon: "browser",
          tone: "blue",
        },
        {
          id: "server-process",
          label: "サーバ処理",
          description: "入力を受け取る",
          icon: "server",
          tone: "orange",
        },
        {
          id: "browser-result",
          label: "結果画面",
          description: "処理結果を表示する",
          icon: "browser",
          tone: "green",
        },
      ],
      edges: [
        {
          id: "input-server",
          from: "browser-input",
          to: "server-process",
          label: "送信",
        },
        {
          id: "server-result",
          from: "server-process",
          to: "browser-result",
          label: "レスポンス",
        },
      ],
    },
  }),
  communicationWithDatabase: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "保存を含むWebアプリの流れ",
      caption: "保存が必要な場合は、サーバがデータベースともやり取りします。",
      nodes: [
        {
          id: "browser",
          label: "ブラウザ",
          description: "入力・表示",
          icon: "browser",
          tone: "blue",
        },
        {
          id: "server",
          label: "サーバ",
          description: "処理",
          icon: "server",
          tone: "orange",
        },
        {
          id: "database",
          label: "データベース",
          description: "保存・取得",
          icon: "database",
          tone: "green",
        },
      ],
      edges: [
        {
          id: "browser-server",
          from: "browser",
          to: "server",
          label: "リクエスト",
          reverseLabel: "レスポンス",
          bidirectional: true,
        },
        {
          id: "server-database",
          from: "server",
          to: "database",
          label: "保存・取得",
          reverseLabel: "結果",
          bidirectional: true,
        },
      ],
    },
  }),
} as const;

const tutorial = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction?: string;
  mentorMessage: string;
  body: string;
  summary?: string[];
  visual?: MissionVisualContent;
}): ActivitySeed => ({
  id: params.id,
  type: MissionActivityType.TUTORIAL,
  title: params.title,
  instruction: params.instruction ?? "内容を確認して、次へ進みましょう。",
  mentorMessage: params.mentorMessage,
  content: {
    body: params.body,
    summary: params.summary ?? [],
    ...(params.visual ? { visual: params.visual } : {}),
  },
  preview: noPreview,
  actionLabel: "理解した",
  order: params.order,
  sectionOrder: params.sectionOrder,
  isMissionCheck: false,
});

const choice = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction: string;
  mentorMessage: string;
  question: string;
  choices: ChoiceItem[];
  isMissionCheck?: boolean;
}): ActivitySeed => ({
  id: params.id,
  type: params.isMissionCheck ? MissionActivityType.MISSION_CHECK : MissionActivityType.CHOICE,
  title: params.title,
  instruction: params.instruction,
  mentorMessage: params.mentorMessage,
  content: {
    checkType: "CHOICE",
    question: params.question,
    choices: params.choices,
  },
  preview: noPreview,
  actionLabel: params.isMissionCheck ? "確認する" : "答えを確認",
  order: params.order,
  sectionOrder: params.sectionOrder,
  isMissionCheck: params.isMissionCheck ?? false,
});

const match = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction: string;
  mentorMessage: string;
  items: { id: string; label: string }[];
  targets: { id: string; label: string }[];
  answers: MatchAnswer[];
  correctFeedback: string;
  incorrectFeedback: string;
  isMissionCheck?: boolean;
}): ActivitySeed => ({
  id: params.id,
  type: params.isMissionCheck ? MissionActivityType.MISSION_CHECK : MissionActivityType.MATCH,
  title: params.title,
  instruction: params.instruction,
  mentorMessage: params.mentorMessage,
  content: {
    checkType: "MATCH",
    items: params.items,
    targets: params.targets,
    answers: params.answers,
    correctFeedback: params.correctFeedback,
    incorrectFeedback: params.incorrectFeedback,
  },
  preview: noPreview,
  actionLabel: params.isMissionCheck ? "確認する" : "答えを確認",
  order: params.order,
  sectionOrder: params.sectionOrder,
  isMissionCheck: params.isMissionCheck ?? false,
});

const orderedSteps = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction: string;
  mentorMessage: string;
  steps: { id: string; label: string }[];
  answerOrder: string[];
  correctFeedback: string;
  incorrectFeedback: string;
  isMissionCheck?: boolean;
}): ActivitySeed => ({
  id: params.id,
  type: params.isMissionCheck ? MissionActivityType.MISSION_CHECK : MissionActivityType.ORDERED_STEPS,
  title: params.title,
  instruction: params.instruction,
  mentorMessage: params.mentorMessage,
  content: {
    checkType: "ORDERED_STEPS",
    steps: params.steps,
    answerOrder: params.answerOrder,
    correctFeedback: params.correctFeedback,
    incorrectFeedback: params.incorrectFeedback,
  },
  preview: noPreview,
  actionLabel: params.isMissionCheck ? "確認する" : "並べ替えを確認",
  order: params.order,
  sectionOrder: params.sectionOrder,
  isMissionCheck: params.isMissionCheck ?? false,
});

const webFlowMission: MissionSeed = {
  id: "web-flow",
  title: "Webページが表示される流れを知る",
  description: "URLにアクセスしてからWebページが表示されるまでの大きな流れをつかみます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/web-flow.png",
  estimatedMinutes: 10,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "ブラウザはWebページを取りに行き、画面に表示する",
    "サーバは要求を受け取り、ページの内容を返す",
    "HTMLは画面を表示するための材料になる",
    "表示されないときは流れのどこで止まっていそうか考える",
  ],
  isPublished: true,
  sections: [
    {
      id: "web-flow-browser-section",
      title: "ブラウザの役割を知る",
      description: "Webページを見るとき、ブラウザが最初に何をしているのかを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "web-flow-a01-browser-intro",
          order: 1,
          sectionOrder: 1,
          title: "Webページを見るとき、最初に動くのはブラウザ",
          mentorMessage:
            "Webページを見るとき、最初に動くのはブラウザです。ChromeやEdgeのようなブラウザは、ユーザーの代わりにWebページを取りに行く役割を持っています。",
          body: [
            "普段Webページを見るとき、私たちはURLを入力したり、リンクをクリックしたりします。",
            "そのときブラウザは、指定されたページを表示するために、サーバへ「このページをください」とお願いしています。",
            "まずは、ブラウザを「Webページを取りに行く係」と考えてみましょう。",
          ].join("\n\n"),
          summary: [
            "URLを入力するとブラウザが動く",
            "ブラウザはサーバへページを要求する",
            "返ってきた内容を画面に表示する",
          ],
        }),
        choice({
          id: "web-flow-a02-browser-request-choice",
          order: 2,
          sectionOrder: 2,
          title: "URLを入力したとき、ブラウザは何をする？",
          instruction: "URLを入力したときに、ブラウザが最初にすることを選びましょう。",
          mentorMessage: "まずは、ユーザーの操作のあとにブラウザが何をするかに注目しましょう。",
          question:
            "Webページを見るためにURLを入力しました。このとき、ブラウザが最初にすることとして近いものはどれ？",
          choices: [
            {
              id: "web-flow-a02-correct",
              label: "サーバにページを要求する",
              isCorrect: true,
              feedback:
                "その通りです。URLを入力すると、ブラウザはそのページを表示するためにサーバへ要求を送ります。",
            },
            {
              id: "web-flow-a02-wrong-db",
              label: "データベースに予約情報を保存する",
              isCorrect: false,
              feedback:
                "惜しいです。データベースへの保存は、ページを見る最初の動きではありません。まずブラウザはサーバへページを要求します。",
            },
            {
              id: "web-flow-a02-wrong-python",
              label: "Pythonのコードを自動で書き換える",
              isCorrect: false,
              feedback:
                "惜しいです。ブラウザはPythonコードを書き換えるのではなく、サーバへページを要求します。",
            },
            {
              id: "web-flow-a02-wrong-css",
              label: "CSSを自動で作る",
              isCorrect: false,
              feedback:
                "惜しいです。CSSは見た目を整えるための情報ですが、ブラウザが最初にすることはページの要求です。",
            },
          ],
        }),
        choice({
          id: "web-flow-a03-browser-role-choice",
          order: 3,
          sectionOrder: 3,
          title: "ブラウザに近い役割はどれ？",
          instruction: "ブラウザの役割として近いものを選びましょう。",
          mentorMessage: "ブラウザはユーザー側で動く道具です。保存やサーバ内の処理とは分けて考えましょう。",
          question: "次のうち、ブラウザの役割として一番近いものはどれ？",
          choices: [
            {
              id: "web-flow-a03-correct",
              label: "ユーザーの代わりにWebページを取りに行き、画面に表示する",
              isCorrect: true,
              feedback:
                "いいですね。ブラウザは、Webページを取りに行き、返ってきた内容を画面として表示する役割を持ちます。",
            },
            {
              id: "web-flow-a03-wrong-db",
              label: "予約情報を長期間保存する",
              isCorrect: false,
              feedback:
                "惜しいです。長期間の保存はDB側の役割として扱うことが多いです。",
            },
            {
              id: "web-flow-a03-wrong-server",
              label: "サーバの中でPythonの処理を実行する",
              isCorrect: false,
              feedback:
                "惜しいです。Pythonの処理はサーバ側で行うことが多く、ブラウザの主な役割ではありません。",
            },
            {
              id: "web-flow-a03-wrong-ai",
              label: "外部AIサービスに必ず質問する",
              isCorrect: false,
              feedback:
                "惜しいです。AI連携をするWebアプリもありますが、ブラウザの基本的な役割ではありません。",
            },
          ],
        }),
      ],
    },
    {
      id: "web-flow-server-html-section",
      title: "サーバとHTMLの役割を知る",
      description: "サーバが返すものと、HTMLが画面の材料になることを確認します。",
      order: 2,
      activities: [
        tutorial({
          id: "web-flow-a04-server-intro",
          order: 4,
          sectionOrder: 1,
          title: "サーバはページを返す係",
          mentorMessage:
            "ブラウザがページを要求すると、その要求を受け取る相手がサーバです。サーバは、要求されたページに対して返事を作ります。",
          body: [
            "Webページを見る流れでは、ブラウザだけでなくサーバも登場します。",
            "サーバは、ブラウザからの要求を受け取り、必要な内容を返す役割を持ちます。",
            "ここでは、サーバを「要求に対して返事をする係」と考えましょう。",
          ].join("\n\n"),
          summary: ["サーバはブラウザからの要求を受け取る", "サーバはHTMLなどの内容を返す"],
        }),
        choice({
          id: "web-flow-a05-server-role-choice",
          order: 5,
          sectionOrder: 2,
          title: "サーバの役割はどれ？",
          instruction: "サーバの役割として近いものを選びましょう。",
          mentorMessage: "サーバは、ブラウザから見て相手側にいる返事を作る係です。",
          question: "Webページを表示するとき、サーバの役割として近いものはどれ？",
          choices: [
            {
              id: "web-flow-a05-correct",
              label: "ブラウザからの要求を受け取り、ページの内容を返す",
              isCorrect: true,
              feedback:
                "その通りです。サーバはブラウザからの要求を受け取り、HTMLなどの内容を返します。",
            },
            {
              id: "web-flow-a05-wrong-direct-ui",
              label: "ユーザーがマウスで直接操作する",
              isCorrect: false,
              feedback:
                "惜しいです。ユーザーが直接操作するのはブラウザ上の画面です。サーバは裏側で要求に返事をします。",
            },
            {
              id: "web-flow-a05-wrong-reader",
              label: "画面の文字を読むためのアプリとして動く",
              isCorrect: false,
              feedback:
                "惜しいです。画面を表示して読む入口になるのはブラウザです。",
            },
            {
              id: "web-flow-a05-wrong-keyboard",
              label: "キーボード入力だけを担当する",
              isCorrect: false,
              feedback:
                "惜しいです。キーボード入力はユーザー操作の一部ですが、サーバの役割ではありません。",
            },
          ],
        }),
        tutorial({
          id: "web-flow-a06-html-intro",
          order: 6,
          sectionOrder: 3,
          title: "HTMLは画面の中身になる",
          mentorMessage:
            "サーバが返す内容の代表例がHTMLです。HTMLは、ブラウザが画面を表示するための材料になります。",
          body: [
            "HTMLは、Webページの中身や構造を表すものです。",
            "HTMLには、見出し、本文、画像、リンク、ボタン、入力フォームなどの情報が書かれます。",
            "サーバからHTMLが返ってくると、ブラウザはそれを読み取り、ユーザーが見られる画面として表示します。",
            "つまり、HTMLは「画面を作るための材料」と考えると分かりやすいです。",
          ].join("\n\n"),
          summary: ["HTMLはWebページの中身や構造を表す", "ブラウザはHTMLを読み取って画面に表示する"],
        }),
        match({
          id: "web-flow-a07-role-match",
          order: 7,
          sectionOrder: 4,
          title: "ブラウザ・サーバ・HTMLを役割に分けよう",
          instruction: "次の3つを、それぞれの役割に対応づけましょう。",
          mentorMessage: "似て見える単語も、役割で分けると整理しやすくなります。",
          items: [
            { id: "browser", label: "ブラウザ" },
            { id: "server", label: "サーバ" },
            { id: "html", label: "HTML" },
          ],
          targets: [
            { id: "take-and-show", label: "ユーザーの代わりにWebページを取りに行き、画面に表示する" },
            { id: "receive-and-return", label: "ブラウザからの要求を受け取り、ページの内容を返す" },
            { id: "page-material", label: "ブラウザが画面を表示するための材料になる" },
          ],
          answers: [
            { targetId: "take-and-show", itemIds: ["browser"] },
            { targetId: "receive-and-return", itemIds: ["server"] },
            { targetId: "page-material", itemIds: ["html"] },
          ],
          correctFeedback:
            "よく整理できています。ブラウザ、サーバ、HTMLは、それぞれ違う役割を持ってWebページ表示に関わっています。",
          incorrectFeedback:
            "もう一度役割を整理してみましょう。ブラウザは取りに行って表示する係、サーバは要求に返事をする係、HTMLは表示するための材料です。",
        }),
      ],
    },
    {
      id: "web-flow-order-section",
      title: "Webページ表示の流れを並べる",
      description: "URL入力から画面表示までを、順番と担当で整理します。",
      order: 3,
      activities: [
        tutorial({
          id: "web-flow-a08-flow-intro",
          order: 8,
          sectionOrder: 1,
          title: "Webページ表示は「お願い」と「返事」の流れ",
          mentorMessage:
            "ここまでで、ブラウザ、サーバ、HTMLの役割を確認しました。次は、それらがどの順番で動くのかを見ていきます。",
          body: [
            "Webページが表示されるまでの基本的な流れは、次のように考えられます。",
            "1. ユーザーがURLを入力する\n2. ブラウザがサーバにページを要求する\n3. サーバがHTMLを返す\n4. ブラウザがHTMLを読み取る\n5. Webページが画面に表示される",
            "この流れは、ざっくり言うと「ブラウザのお願い」と「サーバの返事」です。",
          ].join("\n\n"),
          summary: ["URL入力から表示までは順番がある", "ブラウザのお願いとサーバの返事で考える"],
          visual: courseVisuals.requestResponse,
        }),
        orderedSteps({
          id: "web-flow-a09-flow-order",
          order: 9,
          sectionOrder: 2,
          title: "Webページ表示の順番を並べよう",
          instruction: "Webページが表示されるまでの流れを、正しい順番に並べましょう。",
          mentorMessage: "最初はユーザーの操作、その後にブラウザとサーバのやり取りが続きます。",
          steps: [
            { id: "input-url", label: "ユーザーがURLを入力する" },
            { id: "browser-request", label: "ブラウザがサーバにページを要求する" },
            { id: "server-return", label: "サーバがHTMLを返す" },
            { id: "browser-read", label: "ブラウザがHTMLを読み取る" },
            { id: "show-page", label: "Webページが画面に表示される" },
          ],
          answerOrder: ["input-url", "browser-request", "server-return", "browser-read", "show-page"],
          correctFeedback:
            "いい流れです。URL入力から始まり、ブラウザが要求し、サーバがHTMLを返し、ブラウザが表示します。",
          incorrectFeedback:
            "もう一度、ユーザーの操作から考えてみましょう。最初はURL入力、その後にブラウザがサーバへページを要求します。",
        }),
        match({
          id: "web-flow-a10-who-does-what",
          order: 10,
          sectionOrder: 3,
          title: "誰が何をしている？",
          instruction: "Webページ表示の流れに出てくる動きを、担当するものに分けましょう。",
          mentorMessage: "順番だけでなく、誰が担当しているかも見ると理解しやすくなります。",
          items: [
            { id: "input-url", label: "URLを入力する" },
            { id: "request-page", label: "ページを要求する" },
            { id: "receive-request", label: "要求を受け取る" },
            { id: "return-html", label: "HTMLを返す" },
            { id: "show-html", label: "HTMLを画面に表示する" },
          ],
          targets: [
            { id: "user", label: "ユーザー" },
            { id: "browser", label: "ブラウザ" },
            { id: "server", label: "サーバ" },
          ],
          answers: [
            { targetId: "user", itemIds: ["input-url"] },
            { targetId: "browser", itemIds: ["request-page", "show-html"] },
            { targetId: "server", itemIds: ["receive-request", "return-html"] },
          ],
          correctFeedback:
            "よくできています。ユーザー、ブラウザ、サーバの担当を分けて考えられています。",
          incorrectFeedback:
            "もう一度、誰が動いているかを考えてみましょう。ユーザーはURLを入力し、ブラウザは要求と表示を行い、サーバは要求を受け取ってHTMLを返します。",
        }),
      ],
    },
    {
      id: "web-flow-trouble-section",
      title: "表示されないときの確認場所を考える",
      description: "表示されないときも、表示までの流れに沿って確認場所を考えます。",
      order: 4,
      activities: [
        tutorial({
          id: "web-flow-a11-trouble-intro",
          order: 11,
          sectionOrder: 1,
          title: "表示されないときも、流れで考えればよい",
          mentorMessage:
            "Webページが表示されないと、何が悪いのか分からなくて不安になりやすいです。でも、表示までの流れを分けて考えると、確認する場所を決めやすくなります。",
          body: [
            "Webページが表示されないとき、原因はいろいろあります。",
            "たとえば、URLが間違っている、サーバが起動していない、サーバ側の処理でエラーが起きている、HTMLファイルが見つからない、HTMLの内容が想定と違う、などです。",
            "大切なのは、最初から全部を直そうとしないことです。まずは、Webページ表示の流れに沿って、どこで止まっていそうかを考えます。",
          ].join("\n\n"),
          summary: ["表示されない原因は複数ある", "まずは流れのどこで止まったか考える"],
        }),
        choice({
          id: "web-flow-a12-first-check-choice",
          order: 12,
          sectionOrder: 2,
          title: "ページが表示されないとき、まず何を見る？",
          instruction: "ページが表示されないときに、最初に確認することとして自然なものを選びましょう。",
          mentorMessage: "表示の入口に近いところから確認すると、原因を切り分けやすくなります。",
          question:
            "localhost:5000 にアクセスしても、ページが表示されません。最初に確認することとして自然なものはどれ？",
          choices: [
            {
              id: "web-flow-a12-correct",
              label: "URLが正しいか、サーバが起動しているかを確認する",
              isCorrect: true,
              feedback:
                "その通りです。ページが表示されないときは、まずURLやサーバ起動など、表示の入口に近い部分を確認するとよいです。",
            },
            {
              id: "web-flow-a12-wrong-db-delete",
              label: "いきなりデータベースの中身を全部消す",
              isCorrect: false,
              feedback:
                "それは危険です。表示されないだけなら、まずURLやサーバ起動など入口に近い場所から確認しましょう。",
            },
            {
              id: "web-flow-a12-wrong-css-color",
              label: "CSSの色を全部変える",
              isCorrect: false,
              feedback:
                "惜しいです。色の問題ではなく、ページ自体が表示されないなら、まずURLやサーバ起動を確認する方が自然です。",
            },
            {
              id: "web-flow-a12-wrong-heading",
              label: "HTMLの見出しを大きくする",
              isCorrect: false,
              feedback:
                "惜しいです。見出しの大きさは表示された後の見た目の話です。まずは表示までの入口を確認しましょう。",
            },
          ],
        }),
        choice({
          id: "web-flow-a13-html-trouble-choice",
          order: 13,
          sectionOrder: 3,
          title: "HTMLが関係していそうなトラブルはどれ？",
          instruction: "HTMLが関係していそうなトラブルを選びましょう。",
          mentorMessage: "HTMLは画面の中身や構造に関係します。画面に出る内容の違いに注目しましょう。",
          question: "次のうち、HTMLの内容や返し方が関係していそうなものはどれ？",
          choices: [
            {
              id: "web-flow-a13-correct",
              label: "画面に表示される文章が想定と違う",
              isCorrect: true,
              feedback:
                "その通りです。表示される文章や見出しが違う場合、HTMLの内容やサーバが返しているHTMLを確認する候補になります。",
            },
            {
              id: "web-flow-a13-wrong-power",
              label: "PCの電源が入らない",
              isCorrect: false,
              feedback:
                "惜しいです。それはWebページのHTMLというより、PC本体の問題です。",
            },
            {
              id: "web-flow-a13-wrong-mouse",
              label: "マウスの電池が切れている",
              isCorrect: false,
              feedback:
                "惜しいです。マウスの電池はHTMLの内容とは関係が薄いです。",
            },
            {
              id: "web-flow-a13-wrong-keyboard",
              label: "キーボードのキーが外れている",
              isCorrect: false,
              feedback:
                "惜しいです。キーボードの物理的な問題はHTMLの内容とは関係が薄いです。",
            },
          ],
        }),
      ],
    },
    {
      id: "web-flow-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 5,
      activities: [
        match({
          id: "web-flow-c01-role-check",
          order: 14,
          sectionOrder: 1,
          title: "役割を対応づけよう",
          instruction: "ブラウザ、サーバ、HTMLを、それぞれの役割に対応づけましょう。",
          mentorMessage: "Missionの最後に、基本の3つの役割をもう一度整理しましょう。",
          items: [
            { id: "browser", label: "ブラウザ" },
            { id: "server", label: "サーバ" },
            { id: "html", label: "HTML" },
          ],
          targets: [
            { id: "browser-role", label: "Webページを取りに行き、画面に表示する" },
            { id: "server-role", label: "要求を受け取り、ページの内容を返す" },
            { id: "html-role", label: "画面を表示するための材料になる" },
          ],
          answers: [
            { targetId: "browser-role", itemIds: ["browser"] },
            { targetId: "server-role", itemIds: ["server"] },
            { targetId: "html-role", itemIds: ["html"] },
          ],
          correctFeedback: "OKです。ブラウザ、サーバ、HTMLの役割を整理できています。",
          incorrectFeedback: "もう一度、ブラウザは表示、サーバは返事、HTMLは材料という見方で考えてみましょう。",
          isMissionCheck: true,
        }),
        orderedSteps({
          id: "web-flow-c02-flow-check",
          order: 15,
          sectionOrder: 2,
          title: "Webページ表示の流れを確認しよう",
          instruction: "Webページが表示されるまでの流れを正しい順番に並べましょう。",
          mentorMessage: "ユーザーの操作から画面表示までを、順番で確認します。",
          steps: [
            { id: "input-url", label: "ユーザーがURLを入力する" },
            { id: "browser-request", label: "ブラウザがサーバにページを要求する" },
            { id: "server-return", label: "サーバがHTMLを返す" },
            { id: "browser-read", label: "ブラウザがHTMLを読み取る" },
            { id: "show-page", label: "Webページが表示される" },
          ],
          answerOrder: ["input-url", "browser-request", "server-return", "browser-read", "show-page"],
          correctFeedback: "OKです。Webページ表示の基本的な流れを確認できました。",
          incorrectFeedback: "最初はURL入力です。その後、ブラウザがサーバへページを要求します。",
          isMissionCheck: true,
        }),
        choice({
          id: "web-flow-c03-trouble-check",
          order: 16,
          sectionOrder: 3,
          title: "表示されないときの確認場所",
          instruction: "表示されないときに最初に確認することとして自然なものを選びましょう。",
          mentorMessage: "トラブル時も、表示までの流れの入口から考えると確認しやすくなります。",
          question:
            "localhost:5000 にアクセスしてもページが表示されません。最初に確認することとして自然なものはどれ？",
          choices: [
            {
              id: "web-flow-c03-correct",
              label: "URLが正しいか、サーバが起動しているか",
              isCorrect: true,
              feedback: "OKです。まずはURLやサーバ起動など、表示の入口に近い部分を確認しましょう。",
            },
            {
              id: "web-flow-c03-wrong-color",
              label: "ボタンの色をもっと派手にするか",
              isCorrect: false,
              feedback: "惜しいです。ページ自体が表示されないなら、見た目より先にURLやサーバ起動を確認しましょう。",
            },
            {
              id: "web-flow-c03-wrong-text",
              label: "表示する文章を長くするか",
              isCorrect: false,
              feedback: "惜しいです。文章量の問題ではなく、まずページが返ってきているかを確認しましょう。",
            },
            {
              id: "web-flow-c03-wrong-title",
              label: "ページのタイトルを英語にするか",
              isCorrect: false,
              feedback: "惜しいです。タイトルの言語より、まずURLやサーバ起動の確認が自然です。",
            },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const frontendBackendMission: MissionSeed = {
  id: "frontend-backend",
  title: "フロントエンドとバックエンドを区別する",
  description: "HTML/CSSとPython/Flaskの担当範囲を、画面側と裏側の処理側に分けて考えます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/frontend-backend.png",
  estimatedMinutes: 10,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "フロントエンドは、ユーザーが見る画面や操作に近い部分",
    "バックエンドは、画面の裏側で処理や保存を行う部分",
    "HTML/CSSは画面作り、Python/Flaskはサーバ側の処理に近い",
    "フォーム送信では、フロントエンドとバックエンドがつながる",
  ],
  isPublished: true,
  sections: [
    {
      id: "frontend-backend-basic-section",
      title: "まずは画面側と裏側に分けてみる",
      description: "Webアプリを見える部分と裏側の処理に分けて考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "frontend-backend-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "Webアプリは「見える部分」と「裏側の部分」に分けられる",
          mentorMessage:
            "Webアプリは、ユーザーに見えている画面だけで動いているわけではありません。画面に近い部分と、裏側の処理が協力して動いています。",
          body: [
            "たとえば予約サイトでは、ユーザーは画面上で日付や名前を入力します。",
            "でも、その入力を受け取ったり、予約情報として保存したりする処理は画面の裏側で行われます。",
            "フロントエンドはユーザーが見る画面や操作に近い部分、バックエンドは画面の裏側で処理や保存を行う部分です。",
          ].join("\n\n"),
          summary: ["フロントエンドは画面側", "バックエンドは裏側の処理側"],
          visual: courseVisuals.frontendBackend,
        }),
        choice({
          id: "frontend-backend-a02-front-choice",
          order: 2,
          sectionOrder: 2,
          title: "画面に近いものはどれ？",
          instruction: "次のうち、フロントエンドに近いものを選びましょう。",
          mentorMessage: "ユーザーが直接見たり操作したりするものに注目しましょう。",
          question: "予約サイトの画面を作るとき、フロントエンドに近いものはどれ？",
          choices: [
            {
              id: "frontend-backend-a02-correct",
              label: "予約ボタンの色や形",
              isCorrect: true,
              feedback: "その通りです。ボタンの色や形のように、ユーザーが画面で見たり操作したりする部分はフロントエンドに近いです。",
            },
            {
              id: "frontend-backend-a02-wrong-db",
              label: "予約情報をデータベースに保存する処理",
              isCorrect: false,
              feedback: "惜しいです。保存する処理は、画面の裏側で行われることが多いです。",
            },
            {
              id: "frontend-backend-a02-wrong-request",
              label: "入力された名前をサーバで受け取る処理",
              isCorrect: false,
              feedback: "惜しいです。入力を受け取る処理はバックエンド寄りです。",
            },
            {
              id: "frontend-backend-a02-wrong-search",
              label: "保存された予約を検索する処理",
              isCorrect: false,
              feedback: "惜しいです。検索処理は裏側の処理に近いです。",
            },
          ],
        }),
        choice({
          id: "frontend-backend-a03-back-choice",
          order: 3,
          sectionOrder: 3,
          title: "裏側の処理はどれ？",
          instruction: "次のうち、バックエンドに近いものを選びましょう。",
          mentorMessage: "保存・判定・受け取りのような処理に注目しましょう。",
          question: "予約サイトで、バックエンドに近い処理はどれ？",
          choices: [
            {
              id: "frontend-backend-a03-wrong-button",
              label: "ボタンの背景色を青くする",
              isCorrect: false,
              feedback: "惜しいです。色の変更は見た目に関係するのでフロントエンド寄りです。",
            },
            {
              id: "frontend-backend-a03-wrong-heading",
              label: "見出しの文字を大きくする",
              isCorrect: false,
              feedback: "惜しいです。文字サイズの変更は見た目に関係するのでフロントエンド寄りです。",
            },
            {
              id: "frontend-backend-a03-correct",
              label: "入力された予約内容を保存する",
              isCorrect: true,
              feedback: "その通りです。入力された内容を受け取ったり保存したりする処理は、バックエンドに近い役割です。",
            },
            {
              id: "frontend-backend-a03-wrong-image",
              label: "画像を画面に表示する",
              isCorrect: false,
              feedback: "惜しいです。画像を画面に表示する部分はフロントエンド寄りです。",
            },
          ],
        }),
      ],
    },
    {
      id: "frontend-backend-tech-section",
      title: "技術名を役割に対応づける",
      description: "HTML/CSS/Python/Flaskを、Webアプリ内の担当として整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "frontend-backend-a04-tech-intro",
          order: 4,
          sectionOrder: 1,
          title: "HTML/CSS と Python/Flask の担当を見てみる",
          mentorMessage:
            "ここからは、講義で出てくる技術名をWebアプリの役割に対応づけていきます。全部を完璧に覚える必要はありません。まずは、どのあたりを担当するのかを見ていきましょう。",
          body: [
            "HTMLは画面に表示する文章やボタンなどの構造を作ります。",
            "CSSは色、余白、文字サイズなどの見た目を整えます。",
            "Pythonは裏側の処理を書く言語で、FlaskはPythonでWebアプリを作るための道具です。",
            "ざっくり分けると、HTML/CSSはフロントエンド寄り、Python/Flaskはバックエンド寄りです。",
          ].join("\n\n"),
          summary: ["HTML/CSSは画面作りに近い", "Python/Flaskはサーバ側の処理に近い"],
        }),
        match({
          id: "frontend-backend-a05-tech-match",
          order: 5,
          sectionOrder: 2,
          title: "技術名を担当に分けよう",
          instruction: "次の技術を、フロントエンド寄り・バックエンド寄りに分けましょう。",
          mentorMessage: "技術名を暗記するより、担当する場所で分けてみましょう。",
          items: [
            { id: "html", label: "HTML" },
            { id: "css", label: "CSS" },
            { id: "python", label: "Python" },
            { id: "flask", label: "Flask" },
          ],
          targets: [
            { id: "front", label: "フロントエンド寄り" },
            { id: "back", label: "バックエンド寄り" },
          ],
          answers: [
            { targetId: "front", itemIds: ["html", "css"] },
            { targetId: "back", itemIds: ["python", "flask"] },
          ],
          correctFeedback:
            "いい感じです。HTML/CSSは画面作りに近く、Python/Flaskは裏側の処理に近い役割を持ちます。",
          incorrectFeedback:
            "画面の構造や見た目に関係するものはフロントエンド寄り、処理やサーバ側に関係するものはバックエンド寄りです。",
        }),
        match({
          id: "frontend-backend-a06-work-match",
          order: 6,
          sectionOrder: 3,
          title: "画面の部品と処理を分けよう",
          instruction: "次の項目を、フロントエンド寄り・バックエンド寄りに分けましょう。",
          mentorMessage: "技術名だけでなく、実際の作業内容でも分けてみましょう。",
          items: [
            { id: "show-heading", label: "見出しを表示する" },
            { id: "button-color", label: "ボタンの色を変える" },
            { id: "receive-name", label: "入力された名前を受け取る" },
            { id: "save-reservation", label: "予約情報を保存する" },
            { id: "decide-message", label: "結果画面に表示する内容を決める" },
          ],
          targets: [
            { id: "front", label: "フロントエンド寄り" },
            { id: "back", label: "バックエンド寄り" },
          ],
          answers: [
            { targetId: "front", itemIds: ["show-heading", "button-color"] },
            { targetId: "back", itemIds: ["receive-name", "save-reservation", "decide-message"] },
          ],
          correctFeedback:
            "よく整理できています。画面に見える形を作る部分と、裏側で処理する部分を分けられています。",
          incorrectFeedback:
            "ユーザーが直接見る見た目はフロントエンド寄り、入力を受け取る・保存する・表示内容を決める処理はバックエンド寄りです。",
        }),
        choice({
          id: "frontend-backend-a07-flask-choice",
          order: 7,
          sectionOrder: 4,
          title: "Flaskが担当しそうなことは？",
          instruction: "Flaskが担当しそうな処理を選びましょう。",
          mentorMessage: "Flaskは、URLと処理をつないだり、HTMLを返したりするバックエンド寄りの道具です。",
          question: "次のうち、Flaskが担当しそうなものはどれ？",
          choices: [
            {
              id: "frontend-backend-a07-wrong-round",
              label: "ボタンを丸くする",
              isCorrect: false,
              feedback: "惜しいです。ボタンの形はCSSで扱うことが多いです。",
            },
            {
              id: "frontend-backend-a07-wrong-bg",
              label: "画面の背景色を変える",
              isCorrect: false,
              feedback: "惜しいです。背景色はCSSで扱うことが多いです。",
            },
            {
              id: "frontend-backend-a07-correct",
              label: "/reserve にアクセスされたときの処理を決める",
              isCorrect: true,
              feedback: "その通りです。Flaskは、URLに対応する処理を決めたり、HTMLを返したりするバックエンド寄りの役割を持ちます。",
            },
            {
              id: "frontend-backend-a07-wrong-size",
              label: "見出しの文字サイズを変える",
              isCorrect: false,
              feedback: "惜しいです。文字サイズの変更はCSSで扱うことが多いです。",
            },
          ],
        }),
      ],
    },
    {
      id: "frontend-backend-form-section",
      title: "フォーム送信でつながりを見る",
      description: "画面側の入力が、サーバ側の処理につながる流れを確認します。",
      order: 3,
      activities: [
        tutorial({
          id: "frontend-backend-a08-form-intro",
          order: 8,
          sectionOrder: 1,
          title: "フロントエンドとバックエンドは通信でつながる",
          mentorMessage:
            "フロントエンドとバックエンドは別々に考えられますが、完全に分かれているわけではありません。フォーム送信のような場面では、画面側の入力がサーバ側の処理につながります。",
          body: [
            "たとえば予約フォームでは、ユーザーが画面で名前や日付を入力し、送信ボタンを押します。",
            "その入力内容はサーバに送られ、サーバ側で受け取られます。必要ならDBに保存され、最後に結果画面が返されます。",
            "このように、フロントエンドとバックエンドは通信によってつながっています。",
          ].join("\n\n"),
          summary: ["フォームは画面にある", "送信後の受け取りや保存はバックエンドに近い"],
          visual: courseVisuals.formProcessing,
        }),
        orderedSteps({
          id: "frontend-backend-a09-form-order",
          order: 9,
          sectionOrder: 2,
          title: "予約フォームの流れを並べよう",
          instruction: "予約フォームを送信して結果が表示されるまでの流れを、正しい順番に並べましょう。",
          mentorMessage: "ユーザーの操作から、サーバ側の受け取りまでを順番に見てみましょう。",
          steps: [
            { id: "input-form", label: "ユーザーがフォームに入力する" },
            { id: "click-submit", label: "送信ボタンを押す" },
            { id: "send-server", label: "入力内容がサーバに送られる" },
            { id: "server-receive", label: "サーバが入力内容を受け取る" },
            { id: "return-result", label: "結果画面を返す" },
          ],
          answerOrder: ["input-form", "click-submit", "send-server", "server-receive", "return-result"],
          correctFeedback: "いい流れです。画面で入力した内容は、送信によってサーバ側の処理につながります。",
          incorrectFeedback: "まず画面で入力し、送信すると、その内容がサーバに届きます。ユーザーの操作から考えてみましょう。",
        }),
        match({
          id: "frontend-backend-a10-form-match",
          order: 10,
          sectionOrder: 3,
          title: "フォーム送信の担当を分けよう",
          instruction: "予約フォームの流れに出てくる作業を、フロントエンド寄り・バックエンド寄りに分けましょう。",
          mentorMessage: "フォームそのものは画面にありますが、送信された後の処理は裏側に近くなります。",
          items: [
            { id: "show-input", label: "入力欄を表示する" },
            { id: "show-button", label: "送信ボタンを表示する" },
            { id: "receive-input", label: "入力内容を受け取る" },
            { id: "save-reservation", label: "予約情報を保存する" },
            { id: "decide-message", label: "結果画面に表示するメッセージを決める" },
          ],
          targets: [
            { id: "front", label: "フロントエンド寄り" },
            { id: "back", label: "バックエンド寄り" },
          ],
          answers: [
            { targetId: "front", itemIds: ["show-input", "show-button"] },
            { targetId: "back", itemIds: ["receive-input", "save-reservation", "decide-message"] },
          ],
          correctFeedback: "よくできています。フォームは画面にありますが、送信後の受け取りや保存はバックエンド側の役割になります。",
          incorrectFeedback: "入力欄やボタンは画面に見えるのでフロントエンド寄りです。送信された後の受け取りや保存はバックエンド寄りです。",
        }),
      ],
    },
    {
      id: "frontend-backend-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 4,
      activities: [
        choice({
          id: "frontend-backend-c01-front-check",
          order: 11,
          sectionOrder: 1,
          title: "フロントエンドに近いものを選ぼう",
          instruction: "次のうち、フロントエンドに近いものを選びましょう。",
          mentorMessage: "画面に見える部分や、ユーザーが操作する部分に注目しましょう。",
          question: "次のうち、フロントエンドに近いものはどれ？",
          choices: [
            {
              id: "frontend-backend-c01-correct",
              label: "画面に表示する見出しを作る",
              isCorrect: true,
              feedback: "OKです。画面に表示する見出しはフロントエンドに近いです。",
            },
            {
              id: "frontend-backend-c01-wrong-db",
              label: "予約情報をDBに保存する",
              isCorrect: false,
              feedback: "惜しいです。DBに保存する処理はバックエンド寄りです。",
            },
            {
              id: "frontend-backend-c01-wrong-request",
              label: "入力内容をサーバで受け取る",
              isCorrect: false,
              feedback: "惜しいです。サーバで受け取る処理はバックエンド寄りです。",
            },
            {
              id: "frontend-backend-c01-wrong-login",
              label: "ログインできるか判定する",
              isCorrect: false,
              feedback: "惜しいです。ログイン判定は裏側の処理に近いです。",
            },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "frontend-backend-c02-tech-check",
          order: 12,
          sectionOrder: 2,
          title: "技術と役割を対応づけよう",
          instruction: "技術名と役割を対応づけましょう。",
          mentorMessage: "HTML、CSS、Python、Flaskの担当を確認します。",
          items: [
            { id: "html", label: "HTML" },
            { id: "css", label: "CSS" },
            { id: "python", label: "Python" },
            { id: "flask", label: "Flask" },
          ],
          targets: [
            { id: "structure", label: "画面の構造を作る" },
            { id: "style", label: "見た目を整える" },
            { id: "logic", label: "処理を書く" },
            { id: "web-tool", label: "PythonでWebアプリを作るための道具" },
          ],
          answers: [
            { targetId: "structure", itemIds: ["html"] },
            { targetId: "style", itemIds: ["css"] },
            { targetId: "logic", itemIds: ["python"] },
            { targetId: "web-tool", itemIds: ["flask"] },
          ],
          correctFeedback: "OKです。技術名と役割を整理できています。",
          incorrectFeedback: "HTMLは構造、CSSは見た目、Pythonは処理、FlaskはWebアプリを作る道具として考えてみましょう。",
          isMissionCheck: true,
        }),
        orderedSteps({
          id: "frontend-backend-c03-form-check",
          order: 13,
          sectionOrder: 3,
          title: "フォーム送信の流れを確認しよう",
          instruction: "フォーム送信の流れを正しい順番に並べましょう。",
          mentorMessage: "画面側の入力が、送信によってサーバ側の処理につながります。",
          steps: [
            { id: "input-form", label: "フォームに入力する" },
            { id: "click-submit", label: "送信ボタンを押す" },
            { id: "server-receive", label: "サーバが入力内容を受け取る" },
            { id: "process", label: "必要な処理を行う" },
            { id: "return-result", label: "結果画面を返す" },
          ],
          answerOrder: ["input-form", "click-submit", "server-receive", "process", "return-result"],
          correctFeedback: "OKです。フォーム送信でフロントエンドとバックエンドがつながる流れを確認できました。",
          incorrectFeedback: "まず画面で入力し、送信ボタンを押したあと、サーバが入力内容を受け取ります。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};



// ==============================
// Course 1 additional missions
// MissionExamなし / MissionCheckあり
// 既存の webFlowMission, frontendBackendMission の後ろに追記する想定
// ==============================

const requestResponseMission: MissionSeed = {
  id: "request-response",
  title: "リクエストとレスポンスを知る",
  description: "Webアプリの通信を、ブラウザからの「お願い」とサーバからの「返事」として理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/request-response.png",
  estimatedMinutes: 10,
  order: 3,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "リクエストはブラウザからサーバへのお願い",
    "レスポンスはサーバからブラウザへの返事",
    "HTMLやJSONはレスポンスとして返ることがある",
    "GETとPOSTは通信の目的が異なる",
  ],
  isPublished: true,
  sections: [
    {
      id: "request-response-basic-section",
      title: "リクエストとレスポンスの基本",
      description: "Web通信をお願いと返事で考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "request-response-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "Web通信は「お願い」と「返事」で考える",
          mentorMessage:
            "Webアプリの通信は、難しい言葉で見るよりも、まずはブラウザからのお願いとサーバからの返事で考えると分かりやすいです。",
          body: [
            "ブラウザがサーバへ送るお願いをリクエストと呼びます。",
            "サーバがブラウザへ返す返事をレスポンスと呼びます。",
            "ページを見る、フォームを送る、APIから結果を受け取る、といった動きは、このリクエストとレスポンスの組み合わせで動いています。",
          ].join("\n\n"),
          summary: ["リクエストはお願い", "レスポンスは返事", "Webアプリは通信の往復で動く"],
          visual: courseVisuals.requestResponse,
        }),
        choice({
          id: "request-response-a02-request-choice",
          order: 2,
          sectionOrder: 2,
          title: "リクエストに近いものはどれ？",
          instruction: "ブラウザからサーバへのリクエストに近い動きを選びましょう。",
          mentorMessage: "リクエストは、ブラウザがサーバに何かをお願いする動きです。",
          question: "次のうち、リクエストとして考えやすいものはどれ？",
          choices: [
            {
              id: "request-response-a02-correct",
              label: "ブラウザがサーバにトップページを要求する",
              isCorrect: true,
              feedback: "その通りです。ページをください、とサーバにお願いする動きはリクエストです。",
            },
            {
              id: "request-response-a02-wrong-html",
              label: "サーバがHTMLをブラウザに返す",
              isCorrect: false,
              feedback: "惜しいです。それはリクエストではなく、サーバからのレスポンスです。",
            },
            {
              id: "request-response-a02-wrong-display",
              label: "ブラウザがHTMLを画面に表示する",
              isCorrect: false,
              feedback: "惜しいです。表示はブラウザ内の処理で、サーバへのお願いとは少し違います。",
            },
            {
              id: "request-response-a02-wrong-css",
              label: "CSSで文字色を変える",
              isCorrect: false,
              feedback: "惜しいです。CSSは見た目を変えるための情報で、通信そのものではありません。",
            },
          ],
        }),
        choice({
          id: "request-response-a03-response-choice",
          order: 3,
          sectionOrder: 3,
          title: "レスポンスに近いものはどれ？",
          instruction: "サーバからブラウザへのレスポンスに近いものを選びましょう。",
          mentorMessage: "レスポンスは、サーバがブラウザのお願いに対して返す返事です。",
          question: "次のうち、レスポンスとして考えやすいものはどれ？",
          choices: [
            {
              id: "request-response-a03-wrong-url",
              label: "ユーザーがURLを入力する",
              isCorrect: false,
              feedback: "惜しいです。URL入力はユーザーの操作で、そのあとブラウザがリクエストを送ります。",
            },
            {
              id: "request-response-a03-correct",
              label: "サーバがHTMLを返す",
              isCorrect: true,
              feedback: "その通りです。サーバがHTMLなどを返す動きはレスポンスです。",
            },
            {
              id: "request-response-a03-wrong-form",
              label: "フォームに名前を入力する",
              isCorrect: false,
              feedback: "惜しいです。入力は画面上の操作です。送信するとリクエストにつながります。",
            },
            {
              id: "request-response-a03-wrong-save",
              label: "HTMLファイルをVS Codeで保存する",
              isCorrect: false,
              feedback: "惜しいです。ファイル保存は開発中の操作で、サーバからの返事ではありません。",
            },
          ],
        }),
      ],
    },
    {
      id: "request-response-content-section",
      title: "返ってくるものを整理する",
      description: "HTML、JSON、エラー画面などをレスポンスとして見ます。",
      order: 2,
      activities: [
        tutorial({
          id: "request-response-a04-response-kinds",
          order: 4,
          sectionOrder: 1,
          title: "レスポンスにはいろいろな形がある",
          mentorMessage:
            "サーバから返ってくるものは、HTMLだけではありません。Webアプリでは、目的に応じていろいろな形の返事が返ってきます。",
          body: [
            "Webページを表示するときは、HTMLが返ってくることが多いです。",
            "APIを使うときは、JSONというデータ形式で結果が返ってくることがあります。",
            "また、指定したページがないときやサーバで問題が起きたときは、エラー画面やエラーメッセージが返ることもあります。",
          ].join("\n\n"),
          summary: ["HTMLはページ表示に使われる", "JSONはデータのやり取りで使われる", "エラーもレスポンスの一種"],
          visual: courseVisuals.responseKinds,
        }),
        match({
          id: "request-response-a05-response-match",
          order: 5,
          sectionOrder: 2,
          title: "返ってくるものを場面に分けよう",
          instruction: "次のレスポンスを、使われやすい場面に対応づけましょう。",
          mentorMessage: "何が返ってくるかは、ブラウザが何をお願いしたかによって変わります。",
          items: [
            { id: "html", label: "HTML" },
            { id: "json", label: "JSON" },
            { id: "error", label: "エラー画面" },
          ],
          targets: [
            { id: "page", label: "ページを表示したいとき" },
            { id: "data", label: "データだけを受け取りたいとき" },
            { id: "trouble", label: "ページが見つからない・処理に失敗したとき" },
          ],
          answers: [
            { targetId: "page", itemIds: ["html"] },
            { targetId: "data", itemIds: ["json"] },
            { targetId: "trouble", itemIds: ["error"] },
          ],
          correctFeedback: "いい整理です。レスポンスの形は、ページ表示、データ取得、エラーなどの目的で変わります。",
          incorrectFeedback: "HTMLはページ表示、JSONはデータ、エラー画面は失敗時の返事として考えてみましょう。",
        }),
        choice({
          id: "request-response-a06-json-choice",
          order: 6,
          sectionOrder: 3,
          title: "APIの返事に近いものはどれ？",
          instruction: "APIから返ってくるデータとして考えやすいものを選びましょう。",
          mentorMessage: "APIでは、画面そのものではなくデータが返ってくることがあります。",
          question: "天気APIに今日の天気を問い合わせたとき、返ってくるものとして近いものはどれ？",
          choices: [
            {
              id: "request-response-a06-correct",
              label: "{ \"weather\": \"sunny\" } のようなデータ",
              isCorrect: true,
              feedback: "その通りです。APIではJSONのようなデータが返ってくることがあります。",
            },
            {
              id: "request-response-a06-wrong-css",
              label: "ボタンの角を丸くするCSS",
              isCorrect: false,
              feedback: "惜しいです。CSSは見た目を整える情報で、天気APIの結果とは違います。",
            },
            {
              id: "request-response-a06-wrong-pc",
              label: "PC本体のシリアル番号",
              isCorrect: false,
              feedback: "惜しいです。天気APIの返事としては不自然です。",
            },
            {
              id: "request-response-a06-wrong-keyboard",
              label: "キーボードの入力方式",
              isCorrect: false,
              feedback: "惜しいです。APIの返事は、問い合わせた内容に対応するデータです。",
            },
          ],
        }),
      ],
    },
    {
      id: "request-response-get-post-section",
      title: "GETとPOSTの入口",
      description: "ページを見る通信と、データを送る通信の違いをざっくり理解します。",
      order: 3,
      activities: [
        tutorial({
          id: "request-response-a07-get-post-intro",
          order: 7,
          sectionOrder: 1,
          title: "GETは見る、POSTは送るでまず考える",
          mentorMessage:
            "GETとPOSTは厳密にはもう少し深い話がありますが、最初はページを見る通信と、フォームの内容を送る通信として分けると理解しやすいです。",
          body: [
            "GETは、ページを見たい、情報を取得したい、という場面でよく使われます。",
            "POSTは、フォームに入力した内容をサーバへ送る場面でよく使われます。",
            "講義では、まず「ページを見るGET」「入力を送るPOST」という感覚で十分です。",
          ].join("\n\n"),
          summary: ["GETは取得に近い", "POSTは送信に近い", "フォーム送信ではPOSTがよく使われる"],
        }),
        match({
          id: "request-response-a08-get-post-match",
          order: 8,
          sectionOrder: 2,
          title: "GETとPOSTを場面に分けよう",
          instruction: "次の場面を、GETに近いもの・POSTに近いものに分けましょう。",
          mentorMessage: "見るだけなのか、入力内容を送るのかに注目しましょう。",
          items: [
            { id: "open-top", label: "トップページを開く" },
            { id: "open-list", label: "予約一覧を見る" },
            { id: "send-form", label: "予約フォームを送信する" },
            { id: "send-comment", label: "コメント内容を送信する" },
          ],
          targets: [
            { id: "get", label: "GETに近い" },
            { id: "post", label: "POSTに近い" },
          ],
          answers: [
            { targetId: "get", itemIds: ["open-top", "open-list"] },
            { targetId: "post", itemIds: ["send-form", "send-comment"] },
          ],
          correctFeedback: "よくできています。ページを見る動きはGET、入力内容を送る動きはPOSTに近いです。",
          incorrectFeedback: "見るだけか、入力した内容を送るかで分けてみましょう。",
        }),
        orderedSteps({
          id: "request-response-a09-form-request-order",
          order: 9,
          sectionOrder: 3,
          title: "フォーム送信の通信を並べよう",
          instruction: "フォーム送信で起きる通信の流れを、正しい順番に並べましょう。",
          mentorMessage: "入力、送信、サーバ処理、レスポンスの順で考えます。",
          steps: [
            { id: "input", label: "ユーザーがフォームに入力する" },
            { id: "submit", label: "送信ボタンを押す" },
            { id: "request", label: "ブラウザが入力内容をリクエストとして送る" },
            { id: "server", label: "サーバが入力内容を受け取る" },
            { id: "response", label: "サーバが結果画面をレスポンスとして返す" },
          ],
          answerOrder: ["input", "submit", "request", "server", "response"],
          correctFeedback: "いい流れです。フォーム送信もリクエストとレスポンスの組み合わせで動きます。",
          incorrectFeedback: "まずユーザーが入力し、送信ボタンを押すと、ブラウザがサーバへリクエストを送ります。",
        }),
      ],
    },
    {
      id: "request-response-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 4,
      activities: [
        match({
          id: "request-response-c01-basic-check",
          order: 10,
          sectionOrder: 1,
          title: "リクエストとレスポンスを対応づけよう",
          instruction: "リクエストとレスポンスを、それぞれの意味に対応づけましょう。",
          mentorMessage: "Web通信の基本を最後に確認します。",
          items: [
            { id: "request", label: "リクエスト" },
            { id: "response", label: "レスポンス" },
          ],
          targets: [
            { id: "ask", label: "ブラウザからサーバへのお願い" },
            { id: "reply", label: "サーバからブラウザへの返事" },
          ],
          answers: [
            { targetId: "ask", itemIds: ["request"] },
            { targetId: "reply", itemIds: ["response"] },
          ],
          correctFeedback: "OKです。リクエストとレスポンスの基本を整理できています。",
          incorrectFeedback: "リクエストはお願い、レスポンスは返事として考えてみましょう。",
          isMissionCheck: true,
        }),
        choice({
          id: "request-response-c02-get-post-check",
          order: 11,
          sectionOrder: 2,
          title: "フォーム送信に近い通信は？",
          instruction: "フォーム送信に近い通信を選びましょう。",
          mentorMessage: "入力内容をサーバへ送る場面を思い出しましょう。",
          question: "予約フォームの入力内容をサーバへ送るとき、まず近いものはどれ？",
          choices: [
            {
              id: "request-response-c02-correct",
              label: "POST",
              isCorrect: true,
              feedback: "OKです。フォーム入力を送る場面ではPOSTがよく使われます。",
            },
            {
              id: "request-response-c02-wrong-get",
              label: "GET",
              isCorrect: false,
              feedback: "惜しいです。GETはページや情報を見る場面でよく使われます。",
            },
            {
              id: "request-response-c02-wrong-css",
              label: "CSS",
              isCorrect: false,
              feedback: "惜しいです。CSSは通信の種類ではなく、見た目を整えるものです。",
            },
            {
              id: "request-response-c02-wrong-html",
              label: "HTML",
              isCorrect: false,
              feedback: "惜しいです。HTMLはページの構造を表すもので、通信の方法ではありません。",
            },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const localhostMission: MissionSeed = {
  id: "localhost-dev-server",
  title: "localhostと開発環境を知る",
  description: "自分のPCでWebアプリを動かして確認するための、localhostと開発用サーバの考え方を学びます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/localhost-dev-server.png",
  estimatedMinutes: 9,
  order: 4,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "localhostは自分のPCを指す名前",
    "ポート番号はアプリの入口を区別する番号",
    "開発中は自分のPCでサーバを動かして確認する",
    "公開環境と開発環境は目的が異なる",
  ],
  isPublished: true,
  sections: [
    {
      id: "localhost-basic-section",
      title: "localhostの意味を知る",
      description: "localhost:5000 のようなURLを分解して考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "localhost-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "localhostは自分のPCを指す名前",
          mentorMessage:
            "Flaskを動かすと、localhost:5000 のようなURLにアクセスすることがあります。これはインターネット上の遠いサーバではなく、自分のPCで動いている開発用サーバを見るための入口です。",
          body: [
            "localhost は、自分のPC自身を指す特別な名前です。",
            "講義でFlaskを起動したあとに localhost:5000 を開くのは、自分のPCで動いているWebアプリをブラウザから見に行くためです。",
            "つまり、localhost は「自分のPCの中で動いているWebアプリを見る場所」と考えると分かりやすいです。",
          ].join("\n\n"),
          summary: ["localhostは自分のPCを指す", "Flaskの開発用サーバを確認するときに使う"],
          visual: courseVisuals.localhost,
        }),
        choice({
          id: "localhost-a02-meaning-choice",
          order: 2,
          sectionOrder: 2,
          title: "localhostの意味は？",
          instruction: "localhostの意味として近いものを選びましょう。",
          mentorMessage: "localhostは、どこか遠くのサービス名ではなく、自分のPCを指す名前です。",
          question: "localhost という名前が指しているものとして近いものはどれ？",
          choices: [
            {
              id: "localhost-a02-correct",
              label: "自分のPC",
              isCorrect: true,
              feedback: "その通りです。localhostは自分のPCを指します。",
            },
            {
              id: "localhost-a02-wrong-google",
              label: "Googleのサーバ",
              isCorrect: false,
              feedback: "惜しいです。localhostは外部サービスではなく、自分のPCを指します。",
            },
            {
              id: "localhost-a02-wrong-db",
              label: "必ずデータベースだけを指す名前",
              isCorrect: false,
              feedback: "惜しいです。localhostはDBだけでなく、自分のPCを指す名前です。",
            },
            {
              id: "localhost-a02-wrong-html",
              label: "HTMLファイルの拡張子",
              isCorrect: false,
              feedback: "惜しいです。localhostはファイル名ではなく、自分のPCを指す名前です。",
            },
          ],
        }),
        choice({
          id: "localhost-a03-port-choice",
          order: 3,
          sectionOrder: 3,
          title: "5000のような番号は何？",
          instruction: "localhost:5000 の 5000 が何を表しているか選びましょう。",
          mentorMessage: "ポート番号は、同じPCの中で入口を分けるための番号として考えると分かりやすいです。",
          question: "localhost:5000 の 5000 に近い説明はどれ？",
          choices: [
            {
              id: "localhost-a03-correct",
              label: "アプリの入口を区別する番号",
              isCorrect: true,
              feedback: "その通りです。5000のような番号はポート番号で、どの入口にアクセスするかを表します。",
            },
            {
              id: "localhost-a03-wrong-year",
              label: "Webアプリを作った年",
              isCorrect: false,
              feedback: "惜しいです。5000は年ではなく、アクセス先の入口を表す番号です。",
            },
            {
              id: "localhost-a03-wrong-exp",
              label: "ミッションでもらえる経験値",
              isCorrect: false,
              feedback: "惜しいです。ここでの5000は経験値ではなく、ポート番号です。",
            },
            {
              id: "localhost-a03-wrong-html",
              label: "HTMLの文字数",
              isCorrect: false,
              feedback: "惜しいです。5000はHTMLの文字数ではありません。",
            },
          ],
        }),
      ],
    },
    {
      id: "localhost-env-section",
      title: "開発環境と公開環境を分ける",
      description: "自分だけが確認する環境と、他の人も使う環境を比べます。",
      order: 2,
      activities: [
        tutorial({
          id: "localhost-a04-env-intro",
          order: 4,
          sectionOrder: 1,
          title: "開発環境は作りながら確認する場所",
          mentorMessage:
            "授業では、まず自分のPC上でWebアプリを動かして確認します。これを公開前の練習場所として考えると分かりやすいです。",
          body: [
            "開発環境は、作りながら動きを確認するための環境です。",
            "公開環境は、他の人もアクセスできるように置く環境です。",
            "最初から公開環境で作業すると、失敗したときに他の人にも影響が出るため、まずは開発環境で確認します。",
          ].join("\n\n"),
          summary: ["開発環境は作りながら確認する場所", "公開環境は他の人も使う場所"],
          visual: courseVisuals.developmentProduction,
        }),
        match({
          id: "localhost-a05-env-match",
          order: 5,
          sectionOrder: 2,
          title: "開発環境と公開環境を分けよう",
          instruction: "次の説明を、開発環境・公開環境に分けましょう。",
          mentorMessage: "誰が使うのか、何のために使うのかに注目しましょう。",
          items: [
            { id: "local-check", label: "自分のPCで動かして確認する" },
            { id: "try-error", label: "失敗しながら直す" },
            { id: "users-access", label: "他の人もアクセスする" },
            { id: "real-use", label: "実際に使ってもらう" },
          ],
          targets: [
            { id: "dev", label: "開発環境" },
            { id: "prod", label: "公開環境" },
          ],
          answers: [
            { targetId: "dev", itemIds: ["local-check", "try-error"] },
            { targetId: "prod", itemIds: ["users-access", "real-use"] },
          ],
          correctFeedback: "よく整理できています。開発環境は作りながら確認する場所、公開環境は実際に使ってもらう場所です。",
          incorrectFeedback: "自分で作りながら確認するものは開発環境、他の人も使うものは公開環境です。",
        }),
        orderedSteps({
          id: "localhost-a06-check-order",
          order: 6,
          sectionOrder: 3,
          title: "開発中の確認手順を並べよう",
          instruction: "Flaskアプリを自分のPCで確認する流れを並べましょう。",
          mentorMessage: "コードを書いたあと、サーバを起動してブラウザで確認します。",
          steps: [
            { id: "edit", label: "コードを編集する" },
            { id: "save", label: "ファイルを保存する" },
            { id: "start", label: "開発用サーバを起動する" },
            { id: "open", label: "ブラウザで localhost:5000 を開く" },
            { id: "check", label: "表示を確認する" },
          ],
          answerOrder: ["edit", "save", "start", "open", "check"],
          correctFeedback: "いい流れです。開発中は編集、保存、起動、ブラウザ確認を繰り返します。",
          incorrectFeedback: "まずコードを編集して保存し、そのあと開発用サーバを起動してブラウザで確認します。",
        }),
      ],
    },
    {
      id: "localhost-trouble-section",
      title: "localhostで表示されないとき",
      description: "localhostで見られないときの確認候補を整理します。",
      order: 3,
      activities: [
        choice({
          id: "localhost-a07-trouble-choice",
          order: 7,
          sectionOrder: 1,
          title: "localhostで見られないときの確認",
          instruction: "localhost:5000 を開いても表示されないとき、最初に確認することを選びましょう。",
          mentorMessage: "表示されないときは、サーバ起動とURLの確認から始めると切り分けやすいです。",
          question: "localhost:5000 にアクセスしてもページが表示されません。まず確認することとして自然なものはどれ？",
          choices: [
            {
              id: "localhost-a07-correct",
              label: "Flaskの開発用サーバが起動しているか確認する",
              isCorrect: true,
              feedback: "その通りです。localhostで確認するには、開発用サーバが起動している必要があります。",
            },
            {
              id: "localhost-a07-wrong-color",
              label: "ボタンの色を赤に変える",
              isCorrect: false,
              feedback: "惜しいです。ページ自体が表示されないなら、まずサーバ起動を確認しましょう。",
            },
            {
              id: "localhost-a07-wrong-db",
              label: "すべてのDBデータを削除する",
              isCorrect: false,
              feedback: "危険です。まずはURLやサーバ起動の確認から始めましょう。",
            },
            {
              id: "localhost-a07-wrong-title",
              label: "ページタイトルを長くする",
              isCorrect: false,
              feedback: "惜しいです。タイトルより先に、サーバが動いているか確認しましょう。",
            },
          ],
        }),
      ],
    },
    {
      id: "localhost-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 4,
      activities: [
        choice({
          id: "localhost-c01-meaning-check",
          order: 8,
          sectionOrder: 1,
          title: "localhostの意味を確認しよう",
          instruction: "localhostの意味として近いものを選びましょう。",
          mentorMessage: "localhostは自分のPCを指す名前でした。",
          question: "localhost が指すものとして近いものはどれ？",
          choices: [
            {
              id: "localhost-c01-correct",
              label: "自分のPC",
              isCorrect: true,
              feedback: "OKです。localhostは自分のPCを指します。",
            },
            {
              id: "localhost-c01-wrong-api",
              label: "外部AIサービス",
              isCorrect: false,
              feedback: "惜しいです。localhostは外部サービスではありません。",
            },
            {
              id: "localhost-c01-wrong-css",
              label: "CSSファイル",
              isCorrect: false,
              feedback: "惜しいです。localhostはファイルではありません。",
            },
            {
              id: "localhost-c01-wrong-title",
              label: "ページタイトル",
              isCorrect: false,
              feedback: "惜しいです。localhostはページタイトルではありません。",
            },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "localhost-c02-env-check",
          order: 9,
          sectionOrder: 2,
          title: "環境の違いを確認しよう",
          instruction: "開発環境と公開環境を対応づけましょう。",
          mentorMessage: "誰が使う環境なのかを確認します。",
          items: [
            { id: "dev-work", label: "作りながら自分で確認する" },
            { id: "prod-work", label: "他の人にも使ってもらう" },
          ],
          targets: [
            { id: "dev", label: "開発環境" },
            { id: "prod", label: "公開環境" },
          ],
          answers: [
            { targetId: "dev", itemIds: ["dev-work"] },
            { targetId: "prod", itemIds: ["prod-work"] },
          ],
          correctFeedback: "OKです。開発環境と公開環境の違いを整理できています。",
          incorrectFeedback: "自分で確認する場所が開発環境、他の人も使う場所が公開環境です。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const techMapMission: MissionSeed = {
  id: "tech-role-map",
  title: "HTML/CSS/Python/DB/APIの位置づけを知る",
  description: "今後出てくる技術がWebアプリのどこを担当するのか、先に見取り図として理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/tech-role-map.png",
  estimatedMinutes: 12,
  order: 5,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: [
    "HTMLは画面の構造を作る",
    "CSSは見た目を整える",
    "Python/Flaskはサーバ側の処理に関係する",
    "DBはデータ保存、APIは外部連携に関係する",
  ],
  isPublished: true,
  sections: [
    {
      id: "tech-map-front-section",
      title: "HTMLとCSSの位置づけ",
      description: "画面を作る技術を整理します。",
      order: 1,
      activities: [
        tutorial({
          id: "tech-map-a01-html-css",
          order: 1,
          sectionOrder: 1,
          title: "HTMLは構造、CSSは見た目",
          mentorMessage:
            "Webページを作るとき、HTMLとCSSはどちらも画面に関係します。ただし担当は違います。",
          body: [
            "HTMLは、見出し、本文、画像、リンク、入力欄など、画面の構造を作ります。",
            "CSSは、色、余白、文字サイズ、配置など、見た目を整えます。",
            "まずは、HTMLは骨組み、CSSは見た目の調整と考えましょう。",
          ].join("\n\n"),
          summary: ["HTMLは構造", "CSSは見た目"],
          visual: courseVisuals.htmlCss,
        }),
        match({
          id: "tech-map-a02-html-css-match",
          order: 2,
          sectionOrder: 2,
          title: "HTMLとCSSの担当を分けよう",
          instruction: "次の作業を、HTML寄り・CSS寄りに分けましょう。",
          mentorMessage: "画面の中身を置くのか、見た目を変えるのかに注目しましょう。",
          items: [
            { id: "heading", label: "見出しを書く" },
            { id: "paragraph", label: "本文を書く" },
            { id: "color", label: "文字色を変える" },
            { id: "margin", label: "余白を調整する" },
          ],
          targets: [
            { id: "html", label: "HTML寄り" },
            { id: "css", label: "CSS寄り" },
          ],
          answers: [
            { targetId: "html", itemIds: ["heading", "paragraph"] },
            { targetId: "css", itemIds: ["color", "margin"] },
          ],
          correctFeedback: "よく整理できています。HTMLは中身や構造、CSSは見た目に関係します。",
          incorrectFeedback: "見出しや本文はHTML、色や余白はCSSとして考えてみましょう。",
        }),
      ],
    },
    {
      id: "tech-map-back-section",
      title: "PythonとFlaskの位置づけ",
      description: "サーバ側の処理を作る技術を整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "tech-map-a03-python-flask",
          order: 3,
          sectionOrder: 1,
          title: "Pythonは処理、FlaskはWebアプリ化の道具",
          mentorMessage:
            "Pythonは計算や条件分岐などの処理を書く言語です。FlaskはPythonでWebアプリを作るための道具です。",
          body: [
            "Pythonでは、入力を受け取る、条件で表示を変える、データを整理する、といった処理を書けます。",
            "Flaskを使うと、URLにアクセスされたときにPythonの関数を動かし、HTMLを返すようなWebアプリを作れます。",
            "つまり、Pythonは処理を書く言語、Flaskはその処理をWebアプリとして動かすための道具です。",
          ].join("\n\n"),
          summary: ["Pythonは処理を書く", "FlaskはPythonでWebアプリを作る道具"],
          visual: courseVisuals.pythonFlask,
        }),
        choice({
          id: "tech-map-a04-flask-role-choice",
          order: 4,
          sectionOrder: 2,
          title: "Flaskに近い役割は？",
          instruction: "Flaskの役割として近いものを選びましょう。",
          mentorMessage: "Flaskは、URLとPythonの処理をつなぎ、HTMLを返すために使います。",
          question: "次のうち、Flaskが担当しそうなものはどれ？",
          choices: [
            {
              id: "tech-map-a04-correct",
              label: "/ にアクセスされたら index.html を返す",
              isCorrect: true,
              feedback: "その通りです。FlaskはURLに対応する処理を書き、HTMLを返すために使えます。",
            },
            {
              id: "tech-map-a04-wrong-css",
              label: "文字色を青にする",
              isCorrect: false,
              feedback: "惜しいです。文字色はCSSで扱うことが多いです。",
            },
            {
              id: "tech-map-a04-wrong-image",
              label: "画像の明るさを自動で上げる",
              isCorrect: false,
              feedback: "惜しいです。画像処理もできますが、Flaskの基本的な役割としてはURLと処理をつなぐことです。",
            },
            {
              id: "tech-map-a04-wrong-key",
              label: "キーボードのキーを修理する",
              isCorrect: false,
              feedback: "惜しいです。これはWebアプリの技術ではありません。",
            },
          ],
        }),
      ],
    },
    {
      id: "tech-map-db-api-section",
      title: "DBとAPIの位置づけ",
      description: "保存と外部連携に関係する技術を整理します。",
      order: 3,
      activities: [
        tutorial({
          id: "tech-map-a05-db-api",
          order: 5,
          sectionOrder: 1,
          title: "DBは保存、APIは外部連携",
          mentorMessage:
            "Webアプリが少し本格的になると、DBやAPIという言葉が出てきます。まずは保存と外部連携として分けて考えましょう。",
          body: [
            "DBはデータベースのことで、予約情報や投稿内容など、あとから使いたいデータを保存するために使います。",
            "APIは、外部サービスや別の機能とやり取りするための入口です。",
            "たとえば、天気情報を取得したり、AIに文章を送って返答をもらったりするときにAPIを使うことがあります。",
          ].join("\n\n"),
          summary: ["DBは保存", "APIは外部連携"],
          visual: courseVisuals.databaseApi,
        }),
        match({
          id: "tech-map-a06-tech-match",
          order: 6,
          sectionOrder: 2,
          title: "技術と役割を対応づけよう",
          instruction: "次の技術を、それぞれの役割に対応づけましょう。",
          mentorMessage: "このコースの大きな見取り図を作ります。",
          items: [
            { id: "html", label: "HTML" },
            { id: "css", label: "CSS" },
            { id: "python-flask", label: "Python/Flask" },
            { id: "db", label: "DB" },
            { id: "api", label: "API" },
          ],
          targets: [
            { id: "structure", label: "画面の構造" },
            { id: "style", label: "見た目" },
            { id: "server", label: "サーバ側の処理" },
            { id: "save", label: "データ保存" },
            { id: "external", label: "外部連携" },
          ],
          answers: [
            { targetId: "structure", itemIds: ["html"] },
            { targetId: "style", itemIds: ["css"] },
            { targetId: "server", itemIds: ["python-flask"] },
            { targetId: "save", itemIds: ["db"] },
            { targetId: "external", itemIds: ["api"] },
          ],
          correctFeedback: "いい感じです。Webアプリの中で各技術がどこを担当するか整理できています。",
          incorrectFeedback: "HTMLは構造、CSSは見た目、Python/Flaskは処理、DBは保存、APIは外部連携です。",
        }),
        choice({
          id: "tech-map-a07-reservation-choice",
          order: 7,
          sectionOrder: 3,
          title: "予約アプリに必要な技術は？",
          instruction: "予約アプリの機能に必要な技術を考えましょう。",
          mentorMessage: "画面、入力、保存を分けると必要な技術が見えてきます。",
          question: "予約内容を入力して保存し、一覧で見られるアプリに特に必要になりそうなものはどれ？",
          choices: [
            {
              id: "tech-map-a07-correct",
              label: "HTML/CSS、Python/Flask、DB",
              isCorrect: true,
              feedback: "その通りです。画面を作り、サーバ側で処理し、予約内容をDBに保存する必要があります。",
            },
            {
              id: "tech-map-a07-wrong-css-only",
              label: "CSSだけ",
              isCorrect: false,
              feedback: "惜しいです。見た目だけでなく、入力を受け取る処理や保存も必要です。",
            },
            {
              id: "tech-map-a07-wrong-html-only",
              label: "HTMLだけ",
              isCorrect: false,
              feedback: "惜しいです。HTMLだけでは保存やサーバ側の処理までは扱えません。",
            },
            {
              id: "tech-map-a07-wrong-keyboard",
              label: "キーボードの掃除道具だけ",
              isCorrect: false,
              feedback: "惜しいです。Webアプリ制作の技術ではありません。",
            },
          ],
        }),
      ],
    },
    {
      id: "tech-map-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 4,
      activities: [
        match({
          id: "tech-map-c01-role-check",
          order: 8,
          sectionOrder: 1,
          title: "技術の位置づけを確認しよう",
          instruction: "技術名と役割を対応づけましょう。",
          mentorMessage: "Course1の見取り図として重要な確認です。",
          items: [
            { id: "html", label: "HTML" },
            { id: "css", label: "CSS" },
            { id: "python-flask", label: "Python/Flask" },
            { id: "db", label: "DB" },
            { id: "api", label: "API" },
          ],
          targets: [
            { id: "structure", label: "画面の構造" },
            { id: "style", label: "見た目" },
            { id: "server", label: "サーバ側の処理" },
            { id: "save", label: "保存" },
            { id: "external", label: "外部連携" },
          ],
          answers: [
            { targetId: "structure", itemIds: ["html"] },
            { targetId: "style", itemIds: ["css"] },
            { targetId: "server", itemIds: ["python-flask"] },
            { targetId: "save", itemIds: ["db"] },
            { targetId: "external", itemIds: ["api"] },
          ],
          correctFeedback: "OKです。技術の位置づけを整理できています。",
          incorrectFeedback: "HTML/CSSは画面、Python/Flaskは処理、DBは保存、APIは外部連携です。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const troubleShootingMission: MissionSeed = {
  id: "web-trouble-location",
  title: "エラーが起きた場所を大まかに考える",
  description: "画面が出ない、保存されない、見た目が変わらないときに、どこを確認するかを考えます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/web-trouble-location.png",
  estimatedMinutes: 12,
  order: 6,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: [
    "画面が出ないときはURLやサーバ起動を確認する",
    "見た目が変わらないときはCSS読み込みやclass名を確認する",
    "入力が反映されないときはフォーム、サーバ、テンプレートを分けて考える",
    "症状から疑う場所を切り分ける",
  ],
  isPublished: true,
  sections: [
    {
      id: "trouble-screen-section",
      title: "画面が表示されないとき",
      description: "表示の入口に近い場所から確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "trouble-a01-screen-intro",
          order: 1,
          sectionOrder: 1,
          title: "画面が出ないときは入口から確認する",
          mentorMessage:
            "エラーが出ると焦りやすいですが、最初から全部を疑う必要はありません。まずは症状を見て、確認場所を絞ります。",
          body: [
            "ページがまったく表示されない場合は、まずURLが正しいか、サーバが起動しているかを確認します。",
            "次に、Flask側のルートがあるか、返しているテンプレート名が正しいかを確認します。",
            "表示されない問題は、画面の中身より前の段階で止まっていることがあります。",
          ].join("\n\n"),
          summary: ["まずURLとサーバ起動", "次にrouteやテンプレート名を確認する"],
        }),
        choice({
          id: "trouble-a02-screen-choice",
          order: 2,
          sectionOrder: 2,
          title: "ページが出ないとき、まず疑う場所は？",
          instruction: "ページがまったく表示されないときの確認場所を選びましょう。",
          mentorMessage: "表示の入口から順番に確認しましょう。",
          question: "localhost:5000 にアクセスしてもページが表示されません。最初に確認するものとして自然なのはどれ？",
          choices: [
            {
              id: "trouble-a02-correct",
              label: "URLが正しいか、サーバが起動しているか",
              isCorrect: true,
              feedback: "その通りです。まずは入口に近いURLとサーバ起動を確認します。",
            },
            {
              id: "trouble-a02-wrong-font",
              label: "フォントの種類が好みか",
              isCorrect: false,
              feedback: "惜しいです。ページ自体が出ないなら、見た目より先にURLやサーバ起動です。",
            },
            {
              id: "trouble-a02-wrong-image",
              label: "画像がきれいか",
              isCorrect: false,
              feedback: "惜しいです。画像の品質は表示後の話です。",
            },
            {
              id: "trouble-a02-wrong-exp",
              label: "経験値が十分に高いか",
              isCorrect: false,
              feedback: "惜しいです。アプリの表示問題とは直接関係しません。",
            },
          ],
        }),
        choice({
          id: "trouble-a03-template-choice",
          order: 3,
          sectionOrder: 3,
          title: "テンプレート名が怪しい場面",
          instruction: "テンプレート名の間違いが関係しそうな症状を選びましょう。",
          mentorMessage: "FlaskでHTMLを返す場合、指定したテンプレート名と実際のファイル名が合っている必要があります。",
          question: "次のうち、テンプレート名の指定ミスが関係しそうなものはどれ？",
          choices: [
            {
              id: "trouble-a03-correct",
              label: "index.htmlはあるが、Flask側で別のテンプレート名を指定している",
              isCorrect: true,
              feedback: "その通りです。render_templateで指定する名前と実際のファイル名が合っているか確認します。",
            },
            {
              id: "trouble-a03-wrong-mouse",
              label: "マウスの電池が切れている",
              isCorrect: false,
              feedback: "惜しいです。これはテンプレート名とは関係が薄いです。",
            },
            {
              id: "trouble-a03-wrong-desk",
              label: "机の上が散らかっている",
              isCorrect: false,
              feedback: "惜しいです。開発環境は整えるとよいですが、テンプレート名の問題ではありません。",
            },
            {
              id: "trouble-a03-wrong-title",
              label: "ページタイトルが短い",
              isCorrect: false,
              feedback: "惜しいです。タイトルの長さより、指定ファイル名の一致を確認しましょう。",
            },
          ],
        }),
      ],
    },
    {
      id: "trouble-style-section",
      title: "見た目が変わらないとき",
      description: "CSSが効かないときの確認候補を整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "trouble-a04-css-intro",
          order: 4,
          sectionOrder: 1,
          title: "見た目が変わらないときはCSS周辺を見る",
          mentorMessage:
            "HTMLは表示されているのに色や余白が変わらない場合、CSSの読み込みやclass名が怪しいことがあります。",
          body: [
            "CSSを書いたのに見た目が変わらない場合は、まずCSSファイルが読み込まれているか確認します。",
            "次に、HTML側のclass名とCSS側のセレクタが一致しているか確認します。",
            "保存忘れやブラウザの再読み込み忘れもよくある原因です。",
          ].join("\n\n"),
          summary: ["CSS読み込み", "class名とセレクタ", "保存と再読み込み"],
        }),
        match({
          id: "trouble-a05-css-match",
          order: 5,
          sectionOrder: 2,
          title: "CSSが効かない原因を分けよう",
          instruction: "次の症状と確認場所を対応づけましょう。",
          mentorMessage: "CSSが効かないときは、読み込み、名前、保存を順に見ます。",
          items: [
            { id: "link", label: "CSSファイルを読み込むlinkタグ" },
            { id: "class", label: "HTMLのclass名とCSSのセレクタ" },
            { id: "save", label: "ファイル保存と再読み込み" },
          ],
          targets: [
            { id: "not-loaded", label: "CSS全体がまったく効かない" },
            { id: "one-part", label: "一部の部品だけ見た目が変わらない" },
            { id: "old-view", label: "変更前の表示のままに見える" },
          ],
          answers: [
            { targetId: "not-loaded", itemIds: ["link"] },
            { targetId: "one-part", itemIds: ["class"] },
            { targetId: "old-view", itemIds: ["save"] },
          ],
          correctFeedback: "よくできています。症状ごとに確認場所を分けられています。",
          incorrectFeedback: "CSS全体なら読み込み、一部ならclass名、古い表示なら保存や再読み込みを疑います。",
        }),
      ],
    },
    {
      id: "trouble-input-section",
      title: "入力が反映されないとき",
      description: "フォーム、サーバ処理、テンプレート表示を分けて考えます。",
      order: 3,
      activities: [
        tutorial({
          id: "trouble-a06-input-intro",
          order: 6,
          sectionOrder: 1,
          title: "入力が反映されないときは流れを分ける",
          mentorMessage:
            "フォームに入力した内容が画面に出ないときは、入力欄、送信、受け取り、表示のどこで止まっているかを分けて考えます。",
          body: [
            "入力が反映されない場合、フォームのname属性がない、サーバ側でrequest.formから取り出せていない、テンプレートに値を渡していない、などの原因が考えられます。",
            "大切なのは、入力がどこまで届いているかを順番に確認することです。",
          ].join("\n\n"),
          summary: ["フォームのname", "サーバでの受け取り", "テンプレートへの表示"],
          visual: courseVisuals.formProcessing,
        }),
        orderedSteps({
          id: "trouble-a07-input-order",
          order: 7,
          sectionOrder: 2,
          title: "入力が表示されるまでを並べよう",
          instruction: "フォーム入力が結果画面に表示されるまでの流れを並べましょう。",
          mentorMessage: "どこで止まっていそうか考えるために、まず流れを整理します。",
          steps: [
            { id: "form-name", label: "フォームのname属性で入力名を決める" },
            { id: "submit", label: "フォームを送信する" },
            { id: "request-form", label: "サーバでrequest.formから値を受け取る" },
            { id: "pass-template", label: "テンプレートに値を渡す" },
            { id: "show-value", label: "HTML側で値を表示する" },
          ],
          answerOrder: ["form-name", "submit", "request-form", "pass-template", "show-value"],
          correctFeedback: "いい流れです。入力はフォームからサーバへ届き、テンプレートに渡されて表示されます。",
          incorrectFeedback: "まずフォームの入力名があり、送信後にサーバで受け取り、テンプレートに渡して表示します。",
        }),
        match({
          id: "trouble-a08-location-match",
          order: 8,
          sectionOrder: 3,
          title: "症状から確認場所を考えよう",
          instruction: "次の症状を、確認場所に対応づけましょう。",
          mentorMessage: "症状を見ると、どのあたりを確認すべきか絞りやすくなります。",
          items: [
            { id: "no-page", label: "ページがまったく表示されない" },
            { id: "no-style", label: "色や余白が変わらない" },
            { id: "no-input", label: "入力した名前が結果画面に出ない" },
          ],
          targets: [
            { id: "server-url", label: "URL・サーバ起動・route" },
            { id: "css", label: "CSS読み込み・class名" },
            { id: "form-server-template", label: "フォーム・受け取り・テンプレート表示" },
          ],
          answers: [
            { targetId: "server-url", itemIds: ["no-page"] },
            { targetId: "css", itemIds: ["no-style"] },
            { targetId: "form-server-template", itemIds: ["no-input"] },
          ],
          correctFeedback: "よく整理できています。症状から確認場所を大まかに切り分けられています。",
          incorrectFeedback: "表示されないなら入口、見た目ならCSS、入力ならフォームから表示までの流れを確認しましょう。",
        }),
      ],
    },
    {
      id: "trouble-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 4,
      activities: [
        match({
          id: "trouble-c01-location-check",
          order: 9,
          sectionOrder: 1,
          title: "症状と確認場所を対応づけよう",
          instruction: "症状から、最初に確認する場所を選びましょう。",
          mentorMessage: "トラブル時の切り分けを確認します。",
          items: [
            { id: "page-not-show", label: "ページが表示されない" },
            { id: "style-not-change", label: "CSSを書いたのに見た目が変わらない" },
            { id: "input-not-show", label: "入力した内容が画面に出ない" },
          ],
          targets: [
            { id: "server", label: "URLやサーバ起動" },
            { id: "css", label: "CSS読み込みやclass名" },
            { id: "input", label: "フォーム、受け取り、表示" },
          ],
          answers: [
            { targetId: "server", itemIds: ["page-not-show"] },
            { targetId: "css", itemIds: ["style-not-change"] },
            { targetId: "input", itemIds: ["input-not-show"] },
          ],
          correctFeedback: "OKです。症状ごとの確認場所を整理できています。",
          incorrectFeedback: "ページ、見た目、入力のどこに問題が出ているかで確認場所を分けましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const appThinkingMission: MissionSeed = {
  id: "app-thinking-parts",
  title: "最終制作で使う考え方を知る",
  description: "Webアプリを画面、入力、処理、保存、外部連携に分けて考える準備をします。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/app-thinking-parts.png",
  estimatedMinutes: 10,
  order: 7,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: [
    "アプリは画面・入力・処理・保存・外部連携に分けて考えられる",
    "作る前に誰が何に困っているかを整理する",
    "最初は最小機能から考える",
    "制作タスクを技術ごとに分ける",
  ],
  isPublished: true,
  sections: [
    {
      id: "app-thinking-parts-section",
      title: "アプリを部品で見る",
      description: "身近なアプリを構成要素に分けます。",
      order: 1,
      activities: [
        tutorial({
          id: "app-thinking-a01-parts-intro",
          order: 1,
          sectionOrder: 1,
          title: "アプリは部品に分けると考えやすい",
          mentorMessage:
            "最終制作でいきなり全部を作ろうとすると難しく感じます。まずはアプリを小さな部品に分けて考えましょう。",
          body: [
            "Webアプリは、画面、入力、処理、保存、外部連携などに分けて考えられます。",
            "たとえば予約アプリなら、予約フォーム画面、入力欄、予約を受け取る処理、予約を保存するDB、必要なら通知やAI/API連携があります。",
            "部品に分けると、自分が今どこを作っているのかが分かりやすくなります。",
          ].join("\n\n"),
          summary: ["画面", "入力", "処理", "保存", "外部連携"],
        }),
        match({
          id: "app-thinking-a02-parts-match",
          order: 2,
          sectionOrder: 2,
          title: "予約アプリを部品に分けよう",
          instruction: "予約アプリの要素を、画面・入力・処理・保存に分けましょう。",
          mentorMessage: "最終制作でも使える分け方です。",
          items: [
            { id: "top-page", label: "予約トップページ" },
            { id: "name-input", label: "名前入力欄" },
            { id: "validate", label: "空欄かどうか確認する" },
            { id: "save-db", label: "予約情報をDBに保存する" },
          ],
          targets: [
            { id: "screen", label: "画面" },
            { id: "input", label: "入力" },
            { id: "process", label: "処理" },
            { id: "save", label: "保存" },
          ],
          answers: [
            { targetId: "screen", itemIds: ["top-page"] },
            { targetId: "input", itemIds: ["name-input"] },
            { targetId: "process", itemIds: ["validate"] },
            { targetId: "save", itemIds: ["save-db"] },
          ],
          correctFeedback: "よく整理できています。アプリを部品に分けると制作の見通しが立てやすくなります。",
          incorrectFeedback: "画面に見えるもの、ユーザーが入れるもの、裏側の処理、保存するものに分けましょう。",
        }),
        choice({
          id: "app-thinking-a03-sns-choice",
          order: 3,
          sectionOrder: 3,
          title: "SNS風アプリの保存に近いものは？",
          instruction: "投稿アプリで保存に近い要素を選びましょう。",
          mentorMessage: "投稿したあとも残しておきたい情報は保存が必要です。",
          question: "SNS風アプリで、DBに保存する必要が高いものはどれ？",
          choices: [
            {
              id: "app-thinking-a03-correct",
              label: "投稿した本文",
              isCorrect: true,
              feedback: "その通りです。投稿本文はあとから一覧表示するために保存が必要です。",
            },
            {
              id: "app-thinking-a03-wrong-hover",
              label: "ボタンにマウスを乗せた瞬間の色",
              isCorrect: false,
              feedback: "惜しいです。これは見た目の動きで、保存する中心データではありません。",
            },
            {
              id: "app-thinking-a03-wrong-monitor",
              label: "使っているモニターの明るさ",
              isCorrect: false,
              feedback: "惜しいです。アプリの投稿データとは関係が薄いです。",
            },
            {
              id: "app-thinking-a03-wrong-font",
              label: "開発者の好きなフォント名",
              isCorrect: false,
              feedback: "惜しいです。アプリの主要データとして保存する必要は低いです。",
            },
          ],
        }),
      ],
    },
    {
      id: "app-thinking-planning-section",
      title: "作る前に考えること",
      description: "ユーザー、困りごと、最小機能を整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "app-thinking-a04-planning-intro",
          order: 4,
          sectionOrder: 1,
          title: "最初から全部作らなくてよい",
          mentorMessage:
            "最終制作では、最初から大きなアプリを完成させようとすると大変です。まずは最小機能を決めることが重要です。",
          body: [
            "アプリを考えるときは、誰が、いつ、何に困っているのかを整理します。",
            "その上で、最初に作るべき最小機能を1つ選びます。",
            "たとえば予約アプリなら、最初は予約を入力して保存できるところまでで十分です。通知やAIおすすめ機能は後から追加できます。",
          ].join("\n\n"),
          summary: ["誰のためか", "何に困っているか", "最小機能は何か"],
        }),
        match({
          id: "app-thinking-a05-planning-match",
          order: 5,
          sectionOrder: 2,
          title: "アプリ案を整理しよう",
          instruction: "次の項目を、ユーザー・困りごと・最小機能・発展機能に分けましょう。",
          mentorMessage: "企画を小さく整理する練習です。",
          items: [
            { id: "student", label: "授業の課題を管理したい学生" },
            { id: "forget", label: "締切を忘れやすい" },
            { id: "task-list", label: "課題名と締切を登録して一覧表示する" },
            { id: "ai-advice", label: "AIが優先順位を提案する" },
          ],
          targets: [
            { id: "user", label: "ユーザー" },
            { id: "problem", label: "困りごと" },
            { id: "minimum", label: "最小機能" },
            { id: "advanced", label: "発展機能" },
          ],
          answers: [
            { targetId: "user", itemIds: ["student"] },
            { targetId: "problem", itemIds: ["forget"] },
            { targetId: "minimum", itemIds: ["task-list"] },
            { targetId: "advanced", itemIds: ["ai-advice"] },
          ],
          correctFeedback: "いい整理です。最初に作る機能と、後から足す機能を分けられています。",
          incorrectFeedback: "誰が使うか、何に困っているか、最初に作るもの、後から足すものに分けましょう。",
        }),
        choice({
          id: "app-thinking-a06-minimum-choice",
          order: 6,
          sectionOrder: 3,
          title: "最小機能として自然なものは？",
          instruction: "最初に作る機能として自然なものを選びましょう。",
          mentorMessage: "最小機能は、アプリの価値を一番小さく試せる機能です。",
          question: "予約アプリを最初に作るとき、最小機能として自然なものはどれ？",
          choices: [
            {
              id: "app-thinking-a06-correct",
              label: "予約内容を入力して保存し、一覧で見られる",
              isCorrect: true,
              feedback: "その通りです。予約アプリの中心価値を小さく試せる機能です。",
            },
            {
              id: "app-thinking-a06-wrong-all",
              label: "ログイン、AI推薦、決済、通知を全部最初に作る",
              isCorrect: false,
              feedback: "惜しいです。最初から全部入れると大きすぎます。まず中心機能を小さく作りましょう。",
            },
            {
              id: "app-thinking-a06-wrong-color",
              label: "背景色だけを決めて終わる",
              isCorrect: false,
              feedback: "惜しいです。見た目も大切ですが、予約アプリとしての中心機能が必要です。",
            },
            {
              id: "app-thinking-a06-wrong-logo",
              label: "ロゴだけを作る",
              isCorrect: false,
              feedback: "惜しいです。ロゴだけではアプリの中心機能を試せません。",
            },
          ],
        }),
      ],
    },
    {
      id: "app-thinking-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "app-thinking-c01-parts-check",
          order: 7,
          sectionOrder: 1,
          title: "アプリの部品を確認しよう",
          instruction: "次の要素を、画面・入力・処理・保存に分けましょう。",
          mentorMessage: "最終制作で使う基本の分け方です。",
          items: [
            { id: "form-page", label: "入力フォーム画面" },
            { id: "date-input", label: "日付入力欄" },
            { id: "empty-check", label: "空欄か判定する" },
            { id: "save-db", label: "DBに登録する" },
          ],
          targets: [
            { id: "screen", label: "画面" },
            { id: "input", label: "入力" },
            { id: "process", label: "処理" },
            { id: "save", label: "保存" },
          ],
          answers: [
            { targetId: "screen", itemIds: ["form-page"] },
            { targetId: "input", itemIds: ["date-input"] },
            { targetId: "process", itemIds: ["empty-check"] },
            { targetId: "save", itemIds: ["save-db"] },
          ],
          correctFeedback: "OKです。アプリを部品に分けて考えられています。",
          incorrectFeedback: "画面、入力、処理、保存のどれに近いかを考えてみましょう。",
          isMissionCheck: true,
        }),
        choice({
          id: "app-thinking-c02-minimum-check",
          order: 8,
          sectionOrder: 2,
          title: "最小機能を確認しよう",
          instruction: "最初に作る機能として自然なものを選びましょう。",
          mentorMessage: "まず中心となる小さな機能を作る考え方を確認します。",
          question: "課題管理アプリを最初に作るなら、最小機能として自然なのはどれ？",
          choices: [
            {
              id: "app-thinking-c02-correct",
              label: "課題名と締切を登録して一覧表示する",
              isCorrect: true,
              feedback: "OKです。中心機能を小さく試せる形です。",
            },
            {
              id: "app-thinking-c02-wrong-ai",
              label: "AI、通知、共有、ランキングを全部入れる",
              isCorrect: false,
              feedback: "惜しいです。最初から全部入れると大きすぎます。",
            },
            {
              id: "app-thinking-c02-wrong-theme",
              label: "テーマカラーだけ決める",
              isCorrect: false,
              feedback: "惜しいです。見た目だけではアプリの中心機能を試せません。",
            },
            {
              id: "app-thinking-c02-wrong-sound",
              label: "効果音だけ作る",
              isCorrect: false,
              feedback: "惜しいです。まず課題管理としての中心機能を考えましょう。",
            },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const communicationDiagramChallenge: MissionSeed = {
  id: "challenge-communication-diagram",
  title: "通信の流れを図にする",
  description: "リクエスト、レスポンス、HTML、DB保存を図として整理します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-communication-diagram.png",
  estimatedMinutes: 8,
  order: 8,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "request-response",
  roadmapLane: 1,
  branchOrder: 1,
  rewardExp: 80,
  learnedItems: [
    "通信の矢印の向きを整理する",
    "フォーム送信にDB保存を追加して考える",
  ],
  isPublished: true,
  sections: [
    {
      id: "communication-diagram-section",
      title: "通信を図として整理する",
      description: "矢印の向きと担当を確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "communication-diagram-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "図にすると流れが見えやすくなる",
          mentorMessage:
            "通信の流れは文章だけでなく図にすると整理しやすくなります。矢印の向きに注目しましょう。",
          body: [
            "ブラウザからサーバへ向かう矢印はリクエストです。",
            "サーバからブラウザへ戻る矢印はレスポンスです。",
            "フォーム送信では、サーバが入力内容を受け取ったあと、DBに保存する流れを追加して考えられます。",
          ].join("\n\n"),
          summary: ["ブラウザ→サーバがリクエスト", "サーバ→ブラウザがレスポンス", "保存がある場合はサーバ→DBも考える"],
          visual: courseVisuals.communicationWithDatabase,
        }),
        match({
          id: "communication-diagram-a02-arrow-match",
          order: 2,
          sectionOrder: 2,
          title: "矢印の意味を対応づけよう",
          instruction: "通信の矢印を意味に対応づけましょう。",
          mentorMessage: "矢印の向きを見ると、誰から誰への動きか分かります。",
          items: [
            { id: "browser-to-server", label: "ブラウザ → サーバ" },
            { id: "server-to-browser", label: "サーバ → ブラウザ" },
            { id: "server-to-db", label: "サーバ → DB" },
          ],
          targets: [
            { id: "request", label: "リクエスト" },
            { id: "response", label: "レスポンス" },
            { id: "save", label: "保存" },
          ],
          answers: [
            { targetId: "request", itemIds: ["browser-to-server"] },
            { targetId: "response", itemIds: ["server-to-browser"] },
            { targetId: "save", itemIds: ["server-to-db"] },
          ],
          correctFeedback: "いい整理です。通信図の矢印の意味を理解できています。",
          incorrectFeedback: "ブラウザからサーバはお願い、サーバからブラウザは返事、サーバからDBは保存です。",
        }),
        orderedSteps({
          id: "communication-diagram-c01-check",
          order: 3,
          sectionOrder: 3,
          title: "DB保存を含む流れを並べよう",
          instruction: "フォーム送信からDB保存、結果表示までの流れを並べましょう。",
          mentorMessage: "Challengeの確認です。保存が入る位置に注目しましょう。",
          steps: [
            { id: "input", label: "フォームに入力する" },
            { id: "request", label: "ブラウザがサーバへ送信する" },
            { id: "receive", label: "サーバが入力内容を受け取る" },
            { id: "save", label: "DBに保存する" },
            { id: "response", label: "結果画面を返す" },
          ],
          answerOrder: ["input", "request", "receive", "save", "response"],
          correctFeedback: "OKです。DB保存を含む通信の流れを整理できています。",
          incorrectFeedback: "入力後にサーバへ送信され、サーバが受け取ってからDBに保存します。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const troubleOrderChallenge: MissionSeed = {
  id: "challenge-trouble-order",
  title: "エラー調査の順番を作る",
  description: "不具合が起きたときの確認順を自分で組み立てます。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-trouble-order.png",
  estimatedMinutes: 8,
  order: 9,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "web-trouble-location",
  roadmapLane: 1,
  branchOrder: 2,
  rewardExp: 80,
  learnedItems: [
    "不具合調査では入口から順に確認する",
    "症状に応じて確認順を変える",
  ],
  isPublished: true,
  sections: [
    {
      id: "trouble-order-section",
      title: "確認順を考える",
      description: "よくある不具合の調査順を作ります。",
      order: 1,
      activities: [
        tutorial({
          id: "trouble-order-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "調査順を決めると迷いにくい",
          mentorMessage:
            "エラー調査では、思いついた場所を全部触るより、入口から順番に確認する方が安全です。",
          body: [
            "ページが表示されないなら、URL、サーバ起動、route、テンプレート名の順に見ると切り分けやすいです。",
            "見た目が変わらないなら、CSS読み込み、class名、保存と再読み込みを確認します。",
            "入力が出ないなら、フォームのname、request.form、templateへの受け渡しを確認します。",
          ].join("\n\n"),
          summary: ["症状ごとに確認順を作る", "入口から順番に見る"],
        }),
        orderedSteps({
          id: "trouble-order-a02-page-order",
          order: 2,
          sectionOrder: 2,
          title: "ページが表示されないときの確認順",
          instruction: "ページが表示されないときの確認順として自然な順番に並べましょう。",
          mentorMessage: "まず入口、それからFlask側の設定を見ます。",
          steps: [
            { id: "url", label: "アクセスしているURLを確認する" },
            { id: "server", label: "開発用サーバが起動しているか確認する" },
            { id: "route", label: "対応するrouteがあるか確認する" },
            { id: "template", label: "指定したテンプレート名が正しいか確認する" },
          ],
          answerOrder: ["url", "server", "route", "template"],
          correctFeedback: "いい順番です。入口から順に確認できています。",
          incorrectFeedback: "まずURLとサーバ起動、その後にrouteやテンプレート名を見ます。",
        }),
        orderedSteps({
          id: "trouble-order-c01-check",
          order: 3,
          sectionOrder: 3,
          title: "入力が表示されないときの確認順",
          instruction: "入力値が結果画面に表示されないときの確認順を並べましょう。",
          mentorMessage: "Challengeの確認です。フォームから表示までの流れを追います。",
          steps: [
            { id: "name", label: "フォームのname属性を確認する" },
            { id: "method", label: "フォームのmethod/actionを確認する" },
            { id: "request", label: "request.formで受け取れているか確認する" },
            { id: "template", label: "テンプレートに値を渡しているか確認する" },
            { id: "display", label: "HTML側で値を表示しているか確認する" },
          ],
          answerOrder: ["name", "method", "request", "template", "display"],
          correctFeedback: "OKです。入力値がどこで止まっているか順番に確認できます。",
          incorrectFeedback: "フォーム側からサーバ側、最後にHTML表示の順で追いましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const appStructureChallenge: MissionSeed = {
  id: "challenge-app-structure",
  title: "アプリの構成を推理する",
  description: "身近なWebサービスを、画面・入力・処理・保存・外部連携に分解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-app-structure.png",
  estimatedMinutes: 8,
  order: 10,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "app-thinking-parts",
  roadmapLane: 1,
  branchOrder: 3,
  rewardExp: 80,
  learnedItems: [
    "既存サービスを構成要素に分解する",
    "APIやAIが入る場所を推理する",
  ],
  isPublished: true,
  sections: [
    {
      id: "app-structure-section",
      title: "既存サービスを観察する",
      description: "ログイン、検索、投稿、予約などを構成要素に分けます。",
      order: 1,
      activities: [
        tutorial({
          id: "app-structure-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "身近なサービスも部品に分けられる",
          mentorMessage:
            "普段使っているWebサービスも、画面、入力、処理、保存、外部連携に分けて見ると、作るときのヒントになります。",
          body: [
            "投稿アプリなら、投稿画面、本文入力、投稿保存、投稿一覧表示があります。",
            "検索アプリなら、検索画面、キーワード入力、検索処理、結果表示があります。",
            "AI機能がある場合は、ユーザー入力をAI APIに送り、返答を画面に表示する流れが加わります。",
          ].join("\n\n"),
          summary: ["既存サービスも画面・入力・処理・保存に分けられる", "AI/APIは外部連携として見る"],
        }),
        match({
          id: "app-structure-a02-search-match",
          order: 2,
          sectionOrder: 2,
          title: "検索アプリを分解しよう",
          instruction: "検索アプリの要素を、画面・入力・処理・表示に分けましょう。",
          mentorMessage: "検索という機能も、小さな部品に分けると理解しやすくなります。",
          items: [
            { id: "search-page", label: "検索画面" },
            { id: "keyword", label: "キーワード入力欄" },
            { id: "search-process", label: "キーワードに合うデータを探す" },
            { id: "result-list", label: "検索結果一覧" },
          ],
          targets: [
            { id: "screen", label: "画面" },
            { id: "input", label: "入力" },
            { id: "process", label: "処理" },
            { id: "display", label: "表示" },
          ],
          answers: [
            { targetId: "screen", itemIds: ["search-page"] },
            { targetId: "input", itemIds: ["keyword"] },
            { targetId: "process", itemIds: ["search-process"] },
            { targetId: "display", itemIds: ["result-list"] },
          ],
          correctFeedback: "よく整理できています。検索アプリも部品に分けて考えられます。",
          incorrectFeedback: "画面、入力、処理、結果表示に分けて考えてみましょう。",
        }),
        choice({
          id: "app-structure-c01-ai-check",
          order: 3,
          sectionOrder: 3,
          title: "AI/APIが入る場所を考えよう",
          instruction: "AI/APIが入る場所として自然なものを選びましょう。",
          mentorMessage: "Challengeの確認です。外部サービスに処理を依頼する場面を探しましょう。",
          question: "文章を入力するとAIが要約してくれるアプリで、AI/APIが関係する場所として近いものはどれ？",
          choices: [
            {
              id: "app-structure-c01-correct",
              label: "入力された文章をサーバからAI APIに送り、返答を受け取る",
              isCorrect: true,
              feedback: "OKです。AI/APIは外部サービスに処理を依頼して結果を受け取る場面で使います。",
            },
            {
              id: "app-structure-c01-wrong-css",
              label: "ボタンの角を丸くする",
              isCorrect: false,
              feedback: "惜しいです。これはCSSで扱う見た目の調整です。",
            },
            {
              id: "app-structure-c01-wrong-html",
              label: "見出しタグをh1にする",
              isCorrect: false,
              feedback: "惜しいです。これはHTMLの構造に関係します。",
            },
            {
              id: "app-structure-c01-wrong-desk",
              label: "机の上を片付ける",
              isCorrect: false,
              feedback: "惜しいです。制作環境としては大事ですが、AI/APIの役割ではありません。",
            },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

// prisma/seedData/course2SeedAppend.ts
// Course 2: Flaskでページを表示する
// 既存の learningSeed.ts と同じ型・helper(tutorial/choice/match/orderedSteps) を利用して、
// webFlowMission 等の定義後、learningSeed export 前に追記する想定です。

const course2Visuals = {
  flaskFlow: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "Flaskでページが表示される流れ",
      caption: "ブラウザのアクセスがviews.pyの処理につながり、HTMLテンプレートが返されます。",
      nodes: [
        { id: "browser", label: "ブラウザ", description: "URLへアクセス", icon: "browser", tone: "blue" },
        { id: "views", label: "views.py", description: "URLごとの処理", icon: "server", tone: "orange" },
        { id: "template", label: "index.html", description: "返すHTML", icon: "html", tone: "green" },
      ],
      edges: [
        { id: "browser-views", from: "browser", to: "views", label: "GET /" },
        { id: "views-template", from: "views", to: "template", label: "render_template" },
      ],
    },
  }),
  fileTree: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "ILLUSTRATION_PANEL",
      title: "Flaskプロジェクトの最小構成",
      caption: "app.py、views.py、templates/index.html の3つをまず押さえます。",
      image: {
        src: "/images/visuals/flask-file-tree.png",
        alt: "Flaskプロジェクトのファイル構成図",
        width: 1600,
        height: 900,
      },
    },
  }),
  stringVsTemplate: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "文字列を返す / HTMLを返す",
      caption: "小さな確認なら文字列、本格的な画面ならHTMLテンプレートを返します。",
      panels: [
        { id: "string", title: "文字列", subtitle: "小さな確認", tone: "blue", items: ["return \"Hello\"", "すぐ試せる", "構造は作りにくい"] },
        { id: "template", title: "HTML", subtitle: "画面作成", tone: "green", items: ["render_template", "HTMLで構造化", "CSSとつなげやすい"] },
      ],
    },
  }),
  editReload: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "編集して表示を変える流れ",
      caption: "HTMLを編集したら保存し、ブラウザを再読み込みして確認します。",
      nodes: [
        { id: "edit", label: "編集", description: "index.htmlを変更", icon: "html", tone: "blue" },
        { id: "save", label: "保存", description: "ファイルを保存", icon: "file", tone: "orange" },
        { id: "reload", label: "再読み込み", description: "ブラウザで確認", icon: "browser", tone: "green" },
      ],
      edges: [
        { id: "edit-save", from: "edit", to: "save", label: "Ctrl+S" },
        { id: "save-reload", from: "save", to: "reload", label: "更新" },
      ],
    },
  }),
} as const;

const flaskProjectStructureMission: MissionSeed = {
  id: "flask-project-structure",
  title: "プロジェクトを開いて構成を見る",
  description: "VS CodeでFlaskプロジェクトを開き、どのファイルが何を担当するのかをざっくり理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/flask-project-structure.png",
  estimatedMinutes: 10,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: ["フォルダ全体で開く理由", "app.pyの役割", "views.pyの役割", "templates/index.htmlの役割"],
  isPublished: true,
  sections: [
    {
      id: "flask-project-open-section",
      title: "フォルダを開く意味を知る",
      description: "Webアプリは複数ファイルが協力して動くことを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "flask-project-a01-folder-intro",
          order: 1,
          sectionOrder: 1,
          title: "Webアプリはフォルダ全体で動く",
          mentorMessage: "FlaskのWebアプリは、PythonファイルやHTMLファイルなど複数のファイルが協力して動きます。",
          body: ["HTMLだけを見ると画面の中身は分かりますが、どのURLで表示するかは分かりません。", "Pythonだけを見ると処理は分かりますが、返すHTMLとのつながりが見えにくくなります。", "まずはプロジェクト全体を開き、ファイル同士の関係を見る準備をしましょう。"].join("\n\n"),
          summary: ["Flaskアプリは複数ファイルで動く", "VS Codeではフォルダ全体を開く"],
          visual: course2Visuals.fileTree,
        }),
        choice({
          id: "flask-project-a02-folder-choice",
          order: 2,
          sectionOrder: 2,
          title: "なぜフォルダ全体を開くの？",
          instruction: "FlaskプロジェクトをVS Codeで開くときの考え方として近いものを選びましょう。",
          mentorMessage: "Webアプリは1つのファイルだけで完結しないことが多いです。",
          question: "フォルダ全体を開く理由として自然なものはどれ？",
          choices: [
            { id: "correct", label: "PythonやHTMLなど複数ファイルの関係を見ながら作業するため", isCorrect: true, feedback: "その通りです。複数ファイルの関係を追いやすくなります。" },
            { id: "wrong-html", label: "HTMLファイルだけを編集すれば必ず動くから", isCorrect: false, feedback: "惜しいです。Flask側の処理やファイル配置も関係します。" },
            { id: "wrong-css", label: "CSSの色を自動で決めてもらうため", isCorrect: false, feedback: "惜しいです。自動で見た目を決めるためではありません。" },
            { id: "wrong-db", label: "DBの中身を自動で全部消すため", isCorrect: false, feedback: "危険です。フォルダを開くことはDB削除とは関係ありません。" },
          ],
        }),
      ],
    },
    {
      id: "flask-project-files-section",
      title: "Flaskプロジェクトの主要ファイルを見る",
      description: "app.py、views.py、templates/index.htmlの役割を整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "flask-project-a03-file-tree",
          order: 3,
          sectionOrder: 1,
          title: "最初に見る3つの場所",
          mentorMessage: "Flaskプロジェクトでは、まず app.py、views.py、templates/index.html の3つを見ると全体像をつかみやすいです。",
          body: ["app.py はアプリを作って起動する入口に近いファイルです。", "views.py はURLにアクセスされたとき、どの処理を動かすかを書く場所です。", "templates/index.html はブラウザに返すHTMLを置く場所です。"].join("\n\n"),
          summary: ["app.pyは入口", "views.pyはURLごとの処理", "templates/index.htmlは返す画面"],
          visual: course2Visuals.fileTree,
        }),
        match({
          id: "flask-project-a04-file-role-match",
          order: 4,
          sectionOrder: 2,
          title: "ファイル名と役割を対応づけよう",
          instruction: "Flaskプロジェクトのファイル名を役割に対応づけましょう。",
          mentorMessage: "ファイル名を暗記するより、役割で整理しましょう。",
          items: [{ id: "app", label: "app.py" }, { id: "views", label: "views.py" }, { id: "index", label: "templates/index.html" }],
          targets: [{ id: "entry", label: "アプリの入口に近い" }, { id: "route", label: "URLごとの処理を書く" }, { id: "screen", label: "ブラウザに返す画面の中身" }],
          answers: [{ targetId: "entry", itemIds: ["app"] }, { targetId: "route", itemIds: ["views"] }, { targetId: "screen", itemIds: ["index"] }],
          correctFeedback: "よく整理できています。3つのファイルの役割が見えてきました。",
          incorrectFeedback: "app.pyは入口、views.pyはURLごとの処理、index.htmlは画面の中身として考えましょう。",
        }),
      ],
    },
    {
      id: "flask-project-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "flask-project-c01-file-check",
          order: 5,
          sectionOrder: 1,
          title: "ファイル名と役割を確認しよう",
          instruction: "ファイル名と役割を対応づけましょう。",
          mentorMessage: "Missionの最後に、最小構成の役割を確認します。",
          items: [{ id: "app", label: "app.py" }, { id: "views", label: "views.py" }, { id: "template", label: "templates/index.html" }],
          targets: [{ id: "entry", label: "アプリの入口" }, { id: "url", label: "URLと処理をつなぐ" }, { id: "html", label: "画面として返すHTML" }],
          answers: [{ targetId: "entry", itemIds: ["app"] }, { targetId: "url", itemIds: ["views"] }, { targetId: "html", itemIds: ["template"] }],
          correctFeedback: "OKです。Flaskプロジェクトの基本的なファイル構成を確認できました。",
          incorrectFeedback: "app.py、views.py、templates/index.html の役割をもう一度整理しましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const appPyRoleMission: MissionSeed = {
  id: "flask-app-py-role",
  title: "app.pyの役割を知る",
  description: "Flaskアプリの入口として、app.pyが何をしているかを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/flask-app-py-role.png",
  estimatedMinutes: 10,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: ["Flask(__name__)はアプリを作る", "app.runは開発用サーバを起動する", "register_blueprintは処理のまとまりを登録する"],
  isPublished: true,
  sections: [
    {
      id: "app-py-entry-section",
      title: "アプリの入口を見る",
      description: "Flaskアプリを作る行と、実行時の入口を確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "app-py-a01-flask-app-intro",
          order: 1,
          sectionOrder: 1,
          title: "Flaskアプリを作る行を見る",
          mentorMessage: "app.pyでは、まずFlaskアプリ本体を作ります。",
          body: ["app = Flask(__name__)", "これはFlaskを使って、Webアプリとして動くものを用意している行です。", "最初は『ここでアプリを作っている』と見られれば十分です。"].join("\n\n"),
          summary: ["app = Flask(__name__) はアプリを作る行", "app.pyは起動や登録に近い場所"],
        }),
        choice({
          id: "app-py-a02-flask-line-choice",
          order: 2,
          sectionOrder: 2,
          title: "アプリを作っている行はどれ？",
          instruction: "Flaskアプリ本体を作っている行として近いものを選びましょう。",
          mentorMessage: "Flaskという名前が出てくる行に注目しましょう。",
          question: "次のうち、Flaskアプリを作っている行として近いものはどれ？",
          choices: [
            { id: "correct", label: "app = Flask(__name__)", isCorrect: true, feedback: "その通りです。この行でFlaskアプリ本体を用意しています。" },
            { id: "wrong-html", label: "<h1>Hello</h1>", isCorrect: false, feedback: "惜しいです。これはHTMLの見出しです。" },
            { id: "wrong-css", label: "color: blue;", isCorrect: false, feedback: "惜しいです。これはCSSです。" },
            { id: "wrong-print", label: "print(\"Hello\")", isCorrect: false, feedback: "惜しいです。Flaskアプリ本体を作る行ではありません。" },
          ],
        }),
      ],
    },
    {
      id: "app-py-blueprint-section",
      title: "Blueprint登録を知る",
      description: "URLごとの処理を別ファイルに分ける考え方を見ます。",
      order: 2,
      activities: [
        tutorial({
          id: "app-py-a03-blueprint-intro",
          order: 3,
          sectionOrder: 1,
          title: "処理を別ファイルに分けて登録する",
          mentorMessage: "URLごとの処理をapp.pyだけに全部書くと読みにくくなるので、views.pyなどに分けて登録することがあります。",
          body: ["register_blueprintは、別ファイルにある処理のまとまりをアプリに登録するイメージです。", "app.pyは、アプリ本体を作り、必要な処理のまとまりを登録する場所として見ると分かりやすいです。"].join("\n\n"),
          summary: ["処理を分けると見通しがよくなる", "register_blueprintは処理のまとまりを登録する"],
        }),
        match({
          id: "app-py-a04-role-match",
          order: 4,
          sectionOrder: 2,
          title: "app.pyで見かける処理を整理しよう",
          instruction: "app.pyで見かける処理を役割に対応づけましょう。",
          mentorMessage: "アプリを作る、処理を登録する、起動する、の3つで整理しましょう。",
          items: [{ id: "flask", label: "app = Flask(__name__)" }, { id: "blueprint", label: "app.register_blueprint(...)" }, { id: "run", label: "app.run(debug=True)" }],
          targets: [{ id: "create", label: "アプリ本体を作る" }, { id: "register", label: "URL処理のまとまりを登録する" }, { id: "start", label: "開発用サーバを起動する" }],
          answers: [{ targetId: "create", itemIds: ["flask"] }, { targetId: "register", itemIds: ["blueprint"] }, { targetId: "start", itemIds: ["run"] }],
          correctFeedback: "よく整理できています。app.pyの役割が見えてきました。",
          incorrectFeedback: "Flaskで作る、blueprintで登録する、runで起動する、の流れで考えましょう。",
        }),
      ],
    },
    {
      id: "app-py-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        choice({
          id: "app-py-c01-role-check",
          order: 5,
          sectionOrder: 1,
          title: "app.pyの役割を確認しよう",
          instruction: "app.pyの役割として近いものを選びましょう。",
          mentorMessage: "入口、登録、起動に近い場所でした。",
          question: "app.pyの役割として一番近いものはどれ？",
          choices: [
            { id: "correct", label: "Flaskアプリを作り、必要な処理を登録して起動する", isCorrect: true, feedback: "OKです。app.pyはアプリの入口に近い役割を持ちます。" },
            { id: "wrong-html", label: "画面の見出しだけを書く", isCorrect: false, feedback: "惜しいです。見出しはHTML側に書くことが多いです。" },
            { id: "wrong-css", label: "色と余白だけを決める", isCorrect: false, feedback: "惜しいです。これはCSSに近い役割です。" },
            { id: "wrong-image", label: "画像だけを保存する", isCorrect: false, feedback: "惜しいです。画像保管だけの場所ではありません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const viewsRouteMission: MissionSeed = {
  id: "flask-views-route",
  title: "views.pyでURLと処理をつなぐ",
  description: "@routeがURLとPythonの関数をつなぐことを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/flask-views-route.png",
  estimatedMinutes: 11,
  order: 3,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: ["@routeはURLと関数をつなぐ", "/ はトップページを表すことが多い", "returnした内容がレスポンスになる"],
  isPublished: true,
  sections: [
    {
      id: "views-route-basic-section",
      title: "routeの意味",
      description: "URLと関数がつながることを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "views-route-a01-route-intro",
          order: 1,
          sectionOrder: 1,
          title: "@routeはURLと関数をつなぐ",
          mentorMessage: "Flaskでは、どのURLにアクセスされたときにどのPython関数を動かすかを決めます。そのつなぎ目になるのが @route です。",
          body: ["@bp.route(\"/\") のような行は、URL「/」にアクセスされたときに、下の関数を動かすという意味に近いです。", "関数名はPython側の名前で、URLとは別に考えます。"].join("\n\n"),
          summary: ["@routeはURLと関数をつなぐ", "/ はトップページに使われやすい"],
          visual: course2Visuals.flaskFlow,
        }),
        choice({
          id: "views-route-a02-url-choice",
          order: 2,
          sectionOrder: 2,
          title: "/ に対応する処理はどれ？",
          instruction: "routeと関数の対応を見て、/ にアクセスされたときに動く関数を選びましょう。",
          mentorMessage: "routeのすぐ下にある関数が、対応する処理です。",
          question: "@bp.route(\"/\") のすぐ下に def index(): があるとき、/ にアクセスされたら何が動く？",
          choices: [
            { id: "correct", label: "index関数", isCorrect: true, feedback: "その通りです。routeの下にあるindex関数が、/ に対応する処理です。" },
            { id: "wrong-css", label: "CSSの色設定", isCorrect: false, feedback: "惜しいです。CSSは見た目の設定です。" },
            { id: "wrong-db", label: "DBの全削除", isCorrect: false, feedback: "危険です。routeはDB全削除とは別です。" },
            { id: "wrong-title", label: "ブラウザのタブ名だけ", isCorrect: false, feedback: "惜しいです。タブ名はHTMLのtitleに関係します。" },
          ],
        }),
        orderedSteps({
          id: "views-route-a03-access-order",
          order: 3,
          sectionOrder: 3,
          title: "URLアクセスから表示までを並べよう",
          instruction: "ブラウザでURLにアクセスしてからレスポンスが返るまでを並べましょう。",
          mentorMessage: "ブラウザ、route、関数、returnの順で考えます。",
          steps: [
            { id: "open", label: "ブラウザでURLにアクセスする" },
            { id: "route", label: "Flaskが対応するrouteを探す" },
            { id: "function", label: "routeの下の関数が動く" },
            { id: "return", label: "returnした内容が返る" },
            { id: "display", label: "ブラウザに表示される" },
          ],
          answerOrder: ["open", "route", "function", "return", "display"],
          correctFeedback: "いい流れです。URLアクセスからレスポンスまでを整理できています。",
          incorrectFeedback: "まずブラウザのアクセス、その後にroute、関数、return、表示の順で考えましょう。",
        }),
      ],
    },
    {
      id: "views-route-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 2,
      activities: [
        match({
          id: "views-route-c01-url-function-check",
          order: 4,
          sectionOrder: 1,
          title: "URLと関数を確認しよう",
          instruction: "URLと関数の役割を対応づけましょう。",
          mentorMessage: "URLは入口、関数は動く処理です。",
          items: [{ id: "url", label: "URL" }, { id: "route", label: "@route" }, { id: "function", label: "関数" }, { id: "return", label: "return" }],
          targets: [{ id: "entry", label: "ブラウザからアクセスする入口" }, { id: "connect", label: "URLと処理をつなぐ" }, { id: "process", label: "アクセス時に動く処理" }, { id: "response", label: "ブラウザへ返す内容を決める" }],
          answers: [{ targetId: "entry", itemIds: ["url"] }, { targetId: "connect", itemIds: ["route"] }, { targetId: "process", itemIds: ["function"] }, { targetId: "response", itemIds: ["return"] }],
          correctFeedback: "OKです。views.pyで見るべき基本要素を整理できています。",
          incorrectFeedback: "URL、route、関数、returnの役割を分けて考えましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const renderTemplateMission: MissionSeed = {
  id: "flask-render-template",
  title: "render_templateでHTMLを返す",
  description: "Python側の処理からHTMLテンプレートをブラウザへ返す流れを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/flask-render-template.png",
  estimatedMinutes: 11,
  order: 4,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: ["render_templateはHTMLテンプレートを返す", "テンプレートはtemplatesフォルダに置く", "テンプレート名のミスはエラーにつながる"],
  isPublished: true,
  sections: [
    {
      id: "render-template-basic-section",
      title: "テンプレートを返す",
      description: "render_templateの基本を見ます。",
      order: 1,
      activities: [
        tutorial({
          id: "render-template-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "HTMLを返すときはrender_templateを使う",
          mentorMessage: "FlaskでHTMLファイルを画面として返したいときは、render_templateを使います。",
          body: ["return render_template(\"index.html\")", "このコードは、templatesフォルダにある index.html を探して、ブラウザに返す処理です。", "HTMLファイルとして画面を作れるので、見出しや本文、ボタンなどを整理しやすくなります。"].join("\n\n"),
          summary: ["render_templateはHTMLを返す", "index.htmlというテンプレート名を指定する"],
          visual: course2Visuals.stringVsTemplate,
        }),
        choice({
          id: "render-template-a02-file-choice",
          order: 2,
          sectionOrder: 2,
          title: "返されるHTMLはどれ？",
          instruction: "render_templateで指定されたHTMLファイルを選びましょう。",
          mentorMessage: "かっこの中のファイル名に注目しましょう。",
          question: "return render_template(\"index.html\") と書かれているとき、返そうとしているHTMLはどれ？",
          choices: [
            { id: "correct", label: "index.html", isCorrect: true, feedback: "その通りです。render_templateの中で指定したindex.htmlを返そうとしています。" },
            { id: "wrong-app", label: "app.py", isCorrect: false, feedback: "惜しいです。app.pyはPython側の入口に近いファイルです。" },
            { id: "wrong-css", label: "style.css", isCorrect: false, feedback: "惜しいです。CSSは見た目を整えるファイルです。" },
            { id: "wrong-db", label: "database.sqlite", isCorrect: false, feedback: "惜しいです。DBファイルはデータ保存に関係します。" },
          ],
        }),
      ],
    },
    {
      id: "render-template-folder-section",
      title: "templatesフォルダの役割",
      description: "FlaskがHTMLテンプレートを探す場所を理解します。",
      order: 2,
      activities: [
        tutorial({
          id: "render-template-a03-folder-intro",
          order: 3,
          sectionOrder: 1,
          title: "templatesフォルダにHTMLを置く",
          mentorMessage: "Flaskはrender_templateで指定されたHTMLを、基本的にtemplatesフォルダから探します。",
          body: ["たとえば render_template(\"index.html\") と書いた場合、Flaskは templates/index.html を探します。", "ファイル名や置き場所が違うと、テンプレートが見つからないエラーにつながります。"].join("\n\n"),
          summary: ["HTMLテンプレートはtemplatesに置く", "ファイル名と指定名を一致させる"],
          visual: course2Visuals.fileTree,
        }),
        choice({
          id: "render-template-a04-error-choice",
          order: 4,
          sectionOrder: 2,
          title: "テンプレート名ミスで起きそうなこと",
          instruction: "テンプレート名の指定ミスが関係しそうな症状を選びましょう。",
          mentorMessage: "指定した名前と実際のファイル名が一致しているかが大切です。",
          question: "views.pyでは render_template(\"home.html\") と書いたのに、templatesには index.html しかありません。起きそうなことは？",
          choices: [
            { id: "correct", label: "指定したテンプレートが見つからずエラーになる", isCorrect: true, feedback: "その通りです。指定名と実ファイル名が合っていないと原因になります。" },
            { id: "wrong-color", label: "ボタンの色だけが変わる", isCorrect: false, feedback: "惜しいです。これはCSSに近い問題です。" },
            { id: "wrong-db", label: "DBの予約が自動で増える", isCorrect: false, feedback: "惜しいです。DBデータが自動で増えるわけではありません。" },
            { id: "wrong-login", label: "必ずログインできるようになる", isCorrect: false, feedback: "惜しいです。ログイン機能とは関係ありません。" },
          ],
        }),
      ],
    },
    {
      id: "render-template-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        choice({
          id: "render-template-c01-role-check",
          order: 5,
          sectionOrder: 1,
          title: "render_templateの役割を確認しよう",
          instruction: "render_templateの役割として近いものを選びましょう。",
          mentorMessage: "HTMLテンプレートを返すために使うものでした。",
          question: "render_template(\"index.html\") の役割として近いものはどれ？",
          choices: [
            { id: "correct", label: "index.htmlをHTMLテンプレートとして返す", isCorrect: true, feedback: "OKです。render_templateは指定したHTMLテンプレートを返すために使います。" },
            { id: "wrong-css", label: "CSSの色だけを変える", isCorrect: false, feedback: "惜しいです。色はCSSに近い役割です。" },
            { id: "wrong-db", label: "DBを必ず作成する", isCorrect: false, feedback: "惜しいです。DB作成のための関数ではありません。" },
            { id: "wrong-folder", label: "フォルダ名を自動で変更する", isCorrect: false, feedback: "惜しいです。フォルダ名を自動変更するものではありません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const flaskServerRunMission: MissionSeed = {
  id: "flask-server-run",
  title: "サーバを起動してブラウザで確認する",
  description: "Flaskサーバを起動し、localhostにアクセスして確認する流れを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/flask-server-run.png",
  estimatedMinutes: 10,
  order: 5,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: ["サーバ起動中はブラウザからアクセスできる", "localhostは自分のPCで動くサーバを見る入口", "Ctrl+Cで停止できる"],
  isPublished: true,
  sections: [
    {
      id: "server-run-start-section",
      title: "起動コマンドを知る",
      description: "サーバ起動とターミナル表示を確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "server-run-a01-start-intro",
          order: 1,
          sectionOrder: 1,
          title: "Flaskサーバを起動すると確認できる",
          mentorMessage: "Flaskアプリは、ファイルを保存しただけではブラウザから見られません。開発用サーバを起動すると、localhostから確認できるようになります。",
          body: ["授業では、ターミナルでコマンドを実行してFlaskの開発用サーバを起動します。", "起動中は、ブラウザで localhost:5000 のようなURLにアクセスして表示を確認できます。"].join("\n\n"),
          summary: ["コードを書いたらサーバを起動する", "起動中はlocalhostで確認できる"],
        }),
        choice({
          id: "server-run-a02-url-choice",
          order: 2,
          sectionOrder: 2,
          title: "ブラウザで確認するURLは？",
          instruction: "Flaskの開発用サーバを確認するURLとして自然なものを選びましょう。",
          mentorMessage: "授業ではlocalhostとポート番号で確認することが多いです。",
          question: "Flaskサーバが5000番で動いているとき、確認するURLとして近いものはどれ？",
          choices: [
            { id: "correct", label: "http://localhost:5000", isCorrect: true, feedback: "その通りです。自分のPCで動く開発用サーバを見る入口です。" },
            { id: "wrong-css", label: "style.css", isCorrect: false, feedback: "惜しいです。これはCSSファイル名です。" },
            { id: "wrong-html", label: "<h1>localhost</h1>", isCorrect: false, feedback: "惜しいです。これはHTMLタグです。" },
            { id: "wrong-db", label: "database.sqlite", isCorrect: false, feedback: "惜しいです。これはDBファイル名です。" },
          ],
        }),
      ],
    },
    {
      id: "server-run-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 2,
      activities: [
        orderedSteps({
          id: "server-run-c01-order-check",
          order: 3,
          sectionOrder: 1,
          title: "起動から確認までを並べよう",
          instruction: "Flaskアプリを確認する流れを自然な順番に並べましょう。",
          mentorMessage: "編集、保存、起動、ブラウザ確認の流れです。",
          steps: [{ id: "edit", label: "コードを編集する" }, { id: "save", label: "ファイルを保存する" }, { id: "run", label: "Flaskの開発用サーバを起動する" }, { id: "open", label: "ブラウザでlocalhostにアクセスする" }, { id: "check", label: "表示を確認する" }],
          answerOrder: ["edit", "save", "run", "open", "check"],
          correctFeedback: "OKです。起動から確認までの流れを整理できました。",
          incorrectFeedback: "編集して保存し、サーバを起動してからブラウザで確認します。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const editHtmlDisplayMission: MissionSeed = {
  id: "flask-edit-html-display",
  title: "HTMLを編集して表示を変える",
  description: "index.htmlを編集し、保存と再読み込みで画面が変わることを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/flask-edit-html-display.png",
  estimatedMinutes: 10,
  order: 6,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: ["index.htmlを編集すると画面の中身を変えられる", "h1は見出し、pは本文", "保存と再読み込みで変更を確認する"],
  isPublished: true,
  sections: [
    {
      id: "edit-html-section",
      title: "index.htmlを編集する",
      description: "HTMLを書き換えると画面表示が変わることを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "edit-html-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "index.htmlの文章を変える",
          mentorMessage: "ブラウザに表示される見出しや本文は、HTML側に書かれていることが多いです。",
          body: ["<h1>予約フォーム</h1>", "<p>希望日を入力してください。</p>", "h1は大きな見出し、pは本文として表示されます。"].join("\n\n"),
          summary: ["h1は大きな見出し", "pは本文", "HTMLを変えると画面の中身が変わる"],
        }),
        match({
          id: "edit-html-a02-tag-match",
          order: 2,
          sectionOrder: 2,
          title: "タグと表示を対応づけよう",
          instruction: "HTMLタグと表示される役割を対応づけましょう。",
          mentorMessage: "まずはh1とpの違いを見分けられれば十分です。",
          items: [{ id: "h1", label: "<h1>タイトル</h1>" }, { id: "p", label: "<p>説明文</p>" }],
          targets: [{ id: "heading", label: "大きな見出し" }, { id: "paragraph", label: "本文・説明文" }],
          answers: [{ targetId: "heading", itemIds: ["h1"] }, { targetId: "paragraph", itemIds: ["p"] }],
          correctFeedback: "いい感じです。見出しと本文の基本を整理できています。",
          incorrectFeedback: "h1は見出し、pは本文として考えましょう。",
        }),
      ],
    },
    {
      id: "edit-html-save-section",
      title: "保存と再読み込み",
      description: "変更を画面に反映する流れを確認します。",
      order: 2,
      activities: [
        tutorial({
          id: "edit-html-a03-save-reload",
          order: 3,
          sectionOrder: 1,
          title: "保存して再読み込みすると変化を確認できる",
          mentorMessage: "HTMLを書き換えても、保存していなかったりブラウザを再読み込みしていなかったりすると、変更が見えないことがあります。",
          body: ["HTMLを編集したら、まずファイルを保存します。", "その後、ブラウザを再読み込みして表示を確認します。"].join("\n\n"),
          summary: ["編集したら保存", "ブラウザで再読み込み", "正しいファイルを編集しているか確認"],
          visual: course2Visuals.editReload,
        }),
      ],
    },
    {
      id: "edit-html-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "edit-html-c01-reflect-order",
          order: 4,
          sectionOrder: 1,
          title: "変更を確認する流れ",
          instruction: "HTMLを編集して画面に反映する流れを並べましょう。",
          mentorMessage: "編集、保存、再読み込み、確認の流れです。",
          steps: [{ id: "edit", label: "index.htmlを編集する" }, { id: "save", label: "ファイルを保存する" }, { id: "reload", label: "ブラウザを再読み込みする" }, { id: "check", label: "表示が変わったか確認する" }],
          answerOrder: ["edit", "save", "reload", "check"],
          correctFeedback: "OKです。HTML編集後の確認手順を整理できました。",
          incorrectFeedback: "編集したら保存し、ブラウザを再読み込みして確認します。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const templateValueMission: MissionSeed = {
  id: "flask-template-values",
  title: "テンプレートへ値を渡す",
  description: "Python側で用意した値をHTML側に表示する流れを理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/flask-template-values.png",
  estimatedMinutes: 12,
  order: 7,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["Python側で表示したい値を用意する", "render_templateで値をHTMLへ渡す", "{{ message }} のようにHTML側で値を表示する"],
  isPublished: true,
  sections: [
    {
      id: "template-value-basic-section",
      title: "Python側の値をHTMLで表示する",
      description: "{{ message }} のようなテンプレート変数を見ます。",
      order: 1,
      activities: [
        tutorial({
          id: "template-value-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "Python側で用意した値をHTMLへ渡す",
          mentorMessage: "HTMLに毎回同じ文字だけを書くのではなく、Python側で用意した値をHTMLに渡して表示することがあります。",
          body: ["message = \"ようこそ\"", "return render_template(\"index.html\", message=message)", "<h1>{{ message }}</h1>", "Python側で message に入れた内容が、HTML側のこの場所に表示されます。"].join("\n\n"),
          summary: ["Python側で値を用意する", "render_templateでHTMLへ渡す", "{{ message }} で表示する"],
          visual: course2Visuals.flaskFlow,
        }),
        match({
          id: "template-value-a02-flow-match",
          order: 2,
          sectionOrder: 2,
          title: "値を表示する流れを対応づけよう",
          instruction: "PythonからHTML表示までの役割を対応づけましょう。",
          mentorMessage: "値を用意する、渡す、表示する、の流れです。",
          items: [{ id: "prepare", label: "message = \"ようこそ\"" }, { id: "pass", label: "render_template(..., message=message)" }, { id: "show", label: "{{ message }}" }],
          targets: [{ id: "python", label: "Python側で値を用意する" }, { id: "send", label: "HTMLへ値を渡す" }, { id: "html", label: "HTML側で値を表示する" }],
          answers: [{ targetId: "python", itemIds: ["prepare"] }, { targetId: "send", itemIds: ["pass"] }, { targetId: "html", itemIds: ["show"] }],
          correctFeedback: "いい整理です。PythonからHTMLへ値を渡す流れを理解できています。",
          incorrectFeedback: "Pythonで用意し、render_templateで渡し、HTMLの {{ ... }} で表示します。",
        }),
      ],
    },
    {
      id: "template-value-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 2,
      activities: [
        choice({
          id: "template-value-c01-variable-check",
          order: 3,
          sectionOrder: 1,
          title: "{{ message }} の意味を確認しよう",
          instruction: "{{ message }} の役割として近いものを選びましょう。",
          mentorMessage: "HTML側でPythonから渡された値を表示する場所です。",
          question: "HTMLテンプレート内の {{ message }} の説明として近いものはどれ？",
          choices: [
            { id: "correct", label: "Python側から渡されたmessageの値を表示する", isCorrect: true, feedback: "OKです。{{ message }} はテンプレート変数を表示する書き方です。" },
            { id: "wrong-css", label: "文字色を必ず青にする", isCorrect: false, feedback: "惜しいです。色の指定ではありません。" },
            { id: "wrong-db", label: "DBを必ず削除する", isCorrect: false, feedback: "危険です。テンプレート変数はDB削除とは関係ありません。" },
            { id: "wrong-route", label: "URLを必ず/aboutに変える", isCorrect: false, feedback: "惜しいです。URLを変えるものではありません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const flaskMinimumPageMission: MissionSeed = {
  id: "flask-minimum-page",
  title: "Flaskの最小ページを一通り説明する",
  description: "app.py、views.py、index.htmlのつながりを説明できるようにします。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/flask-minimum-page.png",
  estimatedMinutes: 12,
  order: 8,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 130,
  learnedItems: ["app.py、views.py、index.htmlのつながりを説明できる", "URL、関数、template、表示の順番を整理できる"],
  isPublished: true,
  sections: [
    {
      id: "minimum-page-connection-section",
      title: "ファイル間のつながりを復習する",
      description: "3つのファイルがどうつながるか確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "minimum-page-a01-connection-intro",
          order: 1,
          sectionOrder: 1,
          title: "3つのファイルがつながってページになる",
          mentorMessage: "ここまで見てきた app.py、views.py、index.html は別々の役割を持っています。最後に、1つのページ表示になる流れを整理します。",
          body: ["app.py はアプリ本体を用意して起動します。", "views.py はURLに対応する関数を動かし、HTMLテンプレートを返します。", "templates/index.html はブラウザに表示される画面の中身です。"].join("\n\n"),
          summary: ["app.pyは入口", "views.pyはURLごとの処理", "index.htmlは画面の中身"],
          visual: course2Visuals.flaskFlow,
        }),
        orderedSteps({
          id: "minimum-page-a02-full-order",
          order: 2,
          sectionOrder: 2,
          title: "URLから表示までを並べよう",
          instruction: "Flaskでトップページが表示される流れを並べましょう。",
          mentorMessage: "Course2全体のまとめになる流れです。",
          steps: [{ id: "browser", label: "ブラウザで / にアクセスする" }, { id: "views", label: "views.pyの対応する関数が動く" }, { id: "render", label: "render_templateでindex.htmlを返す" }, { id: "template", label: "templates/index.htmlが読み込まれる" }, { id: "show", label: "ブラウザに画面として表示される" }],
          answerOrder: ["browser", "views", "render", "template", "show"],
          correctFeedback: "いい流れです。Flaskでページが出る流れを説明できる状態に近づいています。",
          incorrectFeedback: "ブラウザアクセス、views.pyの処理、render_template、HTML、表示の順で考えましょう。",
        }),
      ],
    },
    {
      id: "minimum-page-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 2,
      activities: [
        match({
          id: "minimum-page-c01-three-files-check",
          order: 3,
          sectionOrder: 1,
          title: "3ファイルの役割を確認しよう",
          instruction: "ファイル名と役割を対応づけましょう。",
          mentorMessage: "Course2全体の重要ポイントです。",
          items: [{ id: "app", label: "app.py" }, { id: "views", label: "views.py" }, { id: "index", label: "templates/index.html" }],
          targets: [{ id: "entry", label: "アプリ本体や起動に近い" }, { id: "route", label: "URLごとの処理を書く" }, { id: "screen", label: "画面に表示するHTML" }],
          answers: [{ targetId: "entry", itemIds: ["app"] }, { targetId: "route", itemIds: ["views"] }, { targetId: "screen", itemIds: ["index"] }],
          correctFeedback: "OKです。3ファイルの役割を確認できました。",
          incorrectFeedback: "app.py、views.py、templates/index.htmlの役割をもう一度整理しましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const twoPageChallengeMission: MissionSeed = {
  id: "challenge-flask-two-pages",
  title: "2ページ構成にする",
  description: "トップページとは別のURLとテンプレートを追加する考え方を学びます。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-flask-two-pages.png",
  estimatedMinutes: 8,
  order: 9,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "flask-render-template",
  roadmapLane: 1,
  branchOrder: 1,
  rewardExp: 80,
  learnedItems: ["別URLを追加するにはrouteを増やす", "別ページには別テンプレートを返せる"],
  isPublished: true,
  sections: [
    {
      id: "two-pages-section",
      title: "別URLを追加する",
      description: "/about のような別ページを考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "two-pages-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "別ページは別URLとして追加できる",
          mentorMessage: "トップページ以外にも、/about のようなURLを追加すると、別ページを作れます。",
          body: ["@route(\"/about\") の下に about関数を作り、about.htmlを返すようにすると、Aboutページを作れます。", "URL、関数、テンプレートをセットで考えましょう。"].join("\n\n"),
          summary: ["/aboutのようなURLを追加できる", "URLごとに返すテンプレートを変えられる"],
        }),
        choice({
          id: "two-pages-c01-check",
          order: 2,
          sectionOrder: 2,
          title: "Aboutページを返す処理は？",
          instruction: "/about で about.html を返す処理として自然なものを選びましょう。",
          mentorMessage: "Challengeの確認です。URLとテンプレート名に注目しましょう。",
          question: "/about にアクセスされたら about.html を返したいとき、自然な組み合わせはどれ？",
          choices: [
            { id: "correct", label: "@route(\"/about\") と render_template(\"about.html\")", isCorrect: true, feedback: "OKです。/aboutとabout.htmlの対応を作れています。" },
            { id: "wrong-css", label: "color: about;", isCorrect: false, feedback: "惜しいです。これはCSSのような書き方です。" },
            { id: "wrong-db", label: "DBを削除する", isCorrect: false, feedback: "危険です。別ページ追加にDB削除は不要です。" },
            { id: "wrong-h1", label: "<h1>/about</h1> だけを書く", isCorrect: false, feedback: "惜しいです。HTMLだけではURLとの対応は作れません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const smartphoneCheckChallengeMission: MissionSeed = {
  id: "challenge-flask-smartphone-check",
  title: "スマホから確認する考え方を知る",
  description: "localhostとPCのIPアドレスの違いをざっくり理解し、同じネットワークから確認する考え方を学びます。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-flask-smartphone-check.png",
  estimatedMinutes: 8,
  order: 10,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "flask-server-run",
  roadmapLane: 1,
  branchOrder: 2,
  rewardExp: 80,
  learnedItems: ["localhostはその端末自身を指す", "スマホからPCを見るにはPCのIPアドレスを使う考え方がある"],
  isPublished: true,
  sections: [
    {
      id: "smartphone-check-section",
      title: "同じネットワークから見る",
      description: "PCとスマホから見たlocalhostの違いを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "smartphone-check-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "スマホのlocalhostはスマホ自身を指す",
          mentorMessage: "PCでlocalhost:5000を開くとPCの中のサーバを見ます。しかしスマホでlocalhostと入力すると、スマホ自身を見に行きます。",
          body: ["スマホからPCで動いている開発用サーバを見るには、PCのIPアドレスを使う考え方があります。", "また、PCとスマホが同じネットワークにいる必要があります。"].join("\n\n"),
          summary: ["localhostはその端末自身", "スマホからPCを見るにはPCのIPを使う考え方がある", "同じネットワークが必要"],
        }),
        choice({
          id: "smartphone-check-c01-check",
          order: 2,
          sectionOrder: 2,
          title: "スマホ確認で必要な条件は？",
          instruction: "スマホからPCの開発用サーバを確認するときに必要な条件として近いものを選びましょう。",
          mentorMessage: "Challengeの確認です。同じネットワークという条件が大切です。",
          question: "スマホからPCで動く開発用サーバを確認したいとき、必要になりやすい条件はどれ？",
          choices: [
            { id: "correct", label: "PCとスマホが同じネットワークにいる", isCorrect: true, feedback: "OKです。同じネットワークにいることが重要な条件になります。" },
            { id: "wrong-color", label: "スマホケースの色が青である", isCorrect: false, feedback: "惜しいです。ケースの色は関係ありません。" },
            { id: "wrong-html", label: "HTMLの見出しが必ず英語である", isCorrect: false, feedback: "惜しいです。見出しの言語はネットワーク条件とは関係ありません。" },
            { id: "wrong-db", label: "DBを必ず削除する", isCorrect: false, feedback: "危険です。スマホ確認のためにDBを削除する必要はありません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const commonLayoutChallengeMission: MissionSeed = {
  id: "challenge-flask-common-layout",
  title: "共通レイアウトを考える",
  description: "複数ページで同じヘッダーやナビゲーションを使う考え方を学びます。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-flask-common-layout.png",
  estimatedMinutes: 8,
  order: 11,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "flask-minimum-page",
  roadmapLane: 1,
  branchOrder: 3,
  rewardExp: 80,
  learnedItems: ["複数ページで同じ部品を使うと統一感が出る", "ヘッダーやナビゲーションは共通化しやすい"],
  isPublished: true,
  sections: [
    {
      id: "common-layout-section",
      title: "複数ページで同じ部品を使う",
      description: "ヘッダーやナビゲーションを例に共通化を考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "common-layout-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "同じ部品は共通にすると分かりやすい",
          mentorMessage: "トップページとAboutページの両方に同じヘッダーがあると、ユーザーは同じサービス内にいると分かりやすくなります。",
          body: ["複数ページで共通にしやすい部品には、ロゴ、ヘッダー、ナビゲーション、フッターなどがあります。", "一方で、ページごとのメイン内容は変える必要があります。"].join("\n\n"),
          summary: ["ヘッダーやナビは共通化しやすい", "メイン内容はページごとに変わる"],
        }),
        match({
          id: "common-layout-a02-parts-match",
          order: 2,
          sectionOrder: 2,
          title: "共通にしやすい部品を分けよう",
          instruction: "部品を、共通にしやすいもの・ページごとに変わるものに分けましょう。",
          mentorMessage: "全ページで同じものか、ページ固有のものかに注目しましょう。",
          items: [{ id: "header", label: "ヘッダー" }, { id: "nav", label: "ナビゲーション" }, { id: "main-about", label: "Aboutページの説明文" }, { id: "main-top", label: "トップページの紹介文" }],
          targets: [{ id: "common", label: "共通にしやすい" }, { id: "page-specific", label: "ページごとに変わる" }],
          answers: [{ targetId: "common", itemIds: ["header", "nav"] }, { targetId: "page-specific", itemIds: ["main-about", "main-top"] }],
          correctFeedback: "いい整理です。共通部分とページ固有部分を分けられています。",
          incorrectFeedback: "全ページで同じ見た目にしたい部分と、ページごとの内容を分けましょう。",
        }),
      ],
    },
  ],
};

const course2FlaskPageCourse: CourseSeed = {
  id: "course-flask-page-display",
  title: "Flaskでページを表示する",
  description:
    "Flaskプロジェクトの構成を理解し、Python側の処理からHTMLテンプレートを返してブラウザで確認できるようにするコースです。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.TOOL, CourseCategoryType.UI],
  missions: [
    flaskProjectStructureMission,
    appPyRoleMission,
    viewsRouteMission,
    renderTemplateMission,
    flaskServerRunMission,
    editHtmlDisplayMission,
    templateValueMission,
    flaskMinimumPageMission,
    twoPageChallengeMission,
    smartphoneCheckChallengeMission,
    commonLayoutChallengeMission,
  ],
};

// ==============================
// Course 3 seed append: HTML/CSSで画面を作る
// 既存の learningSeed.ts の helper / type 定義の後ろに追記する想定
// 前提: tutorial / choice / match / orderedSteps / defineMissionVisual / CourseDifficulty / MissionType / CourseCategoryType が既存スコープにある
// ==============================

const course3Visuals = {
  htmlDocumentParts: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "COMPARE_PANEL",
      title: "HTML文書の大きな場所",
      caption: "head は設定、body は画面に表示される中身を書く場所です。",
      panels: [
        { id: "head", title: "head", subtitle: "設定を書く場所", tone: "blue", items: ["title", "meta charset", "読み込み設定"] },
        { id: "body", title: "body", subtitle: "画面に出る場所", tone: "green", items: ["見出し", "本文", "リンク・画像・ボタン"] },
      ],
    },
  }),
  titleBody: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "title と h1 の違い",
      caption: "title はブラウザのタブ名、h1 はページ本文の大きな見出しです。",
      panels: [
        { id: "title", title: "title", subtitle: "タブ名", tone: "blue", items: ["head に書く", "画面本文には出ない", "ページ名を表す"] },
        { id: "h1", title: "h1", subtitle: "本文の見出し", tone: "green", items: ["body に書く", "画面に表示される", "ページ内容の主題"] },
      ],
    },
  }),
  textStructure: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "文章タグの役割",
      panels: [
        { id: "h1", title: "h1", subtitle: "ページ全体の見出し", tone: "blue", items: ["一番大きな主題", "ページに1つが基本"] },
        { id: "h2", title: "h2", subtitle: "小さなまとまりの見出し", tone: "green", items: ["セクションのタイトル", "内容を分ける"] },
        { id: "p", title: "p", subtitle: "本文", tone: "gray", items: ["説明文", "普通の文章"] },
      ],
    },
  }),
  linkImage: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "リンクと画像の基本",
      panels: [
        { id: "a", title: "a", subtitle: "リンク", tone: "blue", items: ["href に移動先を書く", "クリックできる文字を作る"] },
        { id: "img", title: "img", subtitle: "画像", tone: "purple", items: ["src に画像の場所を書く", "alt に説明を書く"] },
      ],
    },
  }),
  listTable: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "リストと表の使い分け",
      panels: [
        { id: "list", title: "リスト", subtitle: "並べて見せる", tone: "blue", items: ["特徴", "手順", "メニュー"] },
        { id: "table", title: "表", subtitle: "行と列で整理", tone: "green", items: ["予約一覧", "成績表", "比較表"] },
      ],
    },
  }),
  divClass: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "div と class の役割",
      panels: [
        { id: "div", title: "div", subtitle: "まとまりを作る", tone: "blue", items: ["カード全体", "ヘッダー全体", "部品を囲む"] },
        { id: "class", title: "class", subtitle: "名前を付ける", tone: "green", items: ["CSSを当てる目印", "同じ部品をまとめて指定"] },
      ],
    },
  }),
  cssBasics: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "CSSで変える代表的な見た目",
      panels: [
        { id: "color", title: "色・文字", subtitle: "見た目の印象", tone: "blue", items: ["color", "background-color", "font-size"] },
        { id: "space", title: "余白・枠", subtitle: "読みやすさ", tone: "orange", items: ["margin", "padding", "border"] },
      ],
    },
  }),
  flexbox: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "Flexboxの入口",
      panels: [
        { id: "display", title: "display: flex", subtitle: "横並びの入口", tone: "blue", items: ["子要素を並べる", "カード一覧に使いやすい"] },
        { id: "gap", title: "gap", subtitle: "要素同士の間隔", tone: "green", items: ["カード間の余白", "詰まりを防ぐ"] },
        { id: "align", title: "align-items", subtitle: "縦方向のそろえ", tone: "purple", items: ["中央ぞろえ", "高さの違いを整える"] },
      ],
    },
  }),
  servicePageParts: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "サービス風トップページの部品",
      caption: "上から順に、ヘッダー、メイン、カード、ボタンを組み合わせます。",
      nodes: [
        { id: "header", label: "ヘッダー", description: "ロゴ・ナビ", icon: "html", tone: "blue" },
        { id: "main", label: "メイン", description: "ページの中心", icon: "html", tone: "green" },
        { id: "card", label: "カード", description: "情報のまとまり", icon: "html", tone: "orange" },
        { id: "button", label: "ボタン", description: "行動の入口", icon: "html", tone: "purple" },
      ],
      edges: [
        { id: "header-main", from: "header", to: "main", label: "下に続く" },
        { id: "main-card", from: "main", to: "card", label: "情報を置く" },
        { id: "card-button", from: "card", to: "button", label: "操作を置く" },
      ],
    },
  }),
  responsive: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "PCとスマホで変える見方",
      panels: [
        { id: "pc", title: "PC", subtitle: "広い画面", tone: "blue", items: ["横並びが使いやすい", "情報を並べて比較しやすい"] },
        { id: "phone", title: "スマホ", subtitle: "狭い画面", tone: "green", items: ["1列が読みやすい", "横スクロールを避ける"] },
      ],
    },
  }),
} as const;

const c3Choice = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction: string;
  mentorMessage: string;
  question: string;
  correct: string;
  correctFeedback: string;
  wrongs: string[];
  isMissionCheck?: boolean;
}): ActivitySeed =>
  choice({
    id: params.id,
    order: params.order,
    sectionOrder: params.sectionOrder,
    title: params.title,
    instruction: params.instruction,
    mentorMessage: params.mentorMessage,
    question: params.question,
    choices: [
      { id: `${params.id}-correct`, label: params.correct, isCorrect: true, feedback: params.correctFeedback },
      ...params.wrongs.map((label, index) => ({
        id: `${params.id}-wrong-${index + 1}`,
        label,
        isCorrect: false,
        feedback: "惜しいです。タグやプロパティの役割をもう一度確認してみましょう。",
      })),
    ],
    isMissionCheck: params.isMissionCheck,
  });

const c3Match = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction: string;
  mentorMessage: string;
  items: { id: string; label: string }[];
  targets: { id: string; label: string }[];
  answers: MatchAnswer[];
  isMissionCheck?: boolean;
}): ActivitySeed =>
  match({
    ...params,
    correctFeedback: "よく整理できています。HTML/CSSの役割を使い分けられています。",
    incorrectFeedback: "もう一度、それぞれのタグやプロパティが何を担当するかを確認してみましょう。",
  });

const c3CodeOrder = (params: {
  id: string;
  order: number;
  sectionOrder: number;
  title: string;
  instruction: string;
  mentorMessage: string;
  steps: { id: string; label: string }[];
  answerOrder: string[];
  isMissionCheck?: boolean;
}): ActivitySeed =>
  orderedSteps({
    ...params,
    correctFeedback: "OKです。コードの並びと役割を整理できています。",
    incorrectFeedback: "上から順に、外側のまとまりから中身へ入るように考えてみましょう。",
  });

const htmlSkeletonMission: MissionSeed = {
  id: "html-skeleton",
  title: "HTMLの骨組みを知る",
  description: "HTML文書の基本形と、画面に表示される場所・設定を書く場所を区別します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/html-skeleton.png",
  estimatedMinutes: 12,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["HTML文書の基本形", "headとbodyの違い", "titleとh1の違い", "最小HTMLの構造"],
  isPublished: true,
  sections: [
    {
      id: "html-skeleton-basic-section",
      title: "HTML文書の基本形",
      description: "doctype、html、head、bodyの役割を見ます。",
      order: 1,
      activities: [
        tutorial({
          id: "html-skeleton-a01-document-intro",
          order: 1,
          sectionOrder: 1,
          title: "HTML文書には外側の決まった形がある",
          mentorMessage: "HTMLは、画面に出したい内容だけを書けばよいわけではありません。ブラウザがHTMLとして読めるように、外側の形も必要です。",
          body: [
            "HTML文書では、最初にDOCTYPEでHTML文書であることを示します。",
            "htmlタグの中に、設定を書くheadと、画面に表示するbodyを置きます。",
            "まずは、headは設定、bodyは画面に出る中身、と分けて考えましょう。",
            "例:\n<!DOCTYPE html>\n<html>\n  <head>...</head>\n  <body>...</body>\n</html>",
          ].join("\n\n"),
          summary: ["HTML文書には基本形がある", "headは設定", "bodyは画面に表示する中身"],
          visual: course3Visuals.htmlDocumentParts,
        }),
        c3Match({
          id: "html-skeleton-a02-area-match",
          order: 2,
          sectionOrder: 2,
          title: "表示される場所と設定を書く場所を分けよう",
          instruction: "次の要素を、headに近いもの・bodyに近いものに分けましょう。",
          mentorMessage: "画面に見えるか、ページの設定かに注目しましょう。",
          items: [
            { id: "meta", label: "meta charset" },
            { id: "title", label: "title" },
            { id: "h1", label: "h1" },
            { id: "p", label: "p" },
          ],
          targets: [
            { id: "head", label: "headに書く設定" },
            { id: "body", label: "bodyに書く表示内容" },
          ],
          answers: [
            { targetId: "head", itemIds: ["meta", "title"] },
            { targetId: "body", itemIds: ["h1", "p"] },
          ],
        }),
        c3CodeOrder({
          id: "html-skeleton-a03-minimum-order",
          order: 3,
          sectionOrder: 3,
          title: "最小HTMLを並べよう",
          instruction: "HTML文書の基本形になるように、コード行を並べましょう。",
          mentorMessage: "外側から内側へ入るように並べると考えやすいです。",
          steps: [
            { id: "doctype", label: "<!DOCTYPE html>" },
            { id: "html-open", label: "<html>" },
            { id: "head", label: "<head><title>自己紹介</title></head>" },
            { id: "body", label: "<body><h1>こんにちは</h1></body>" },
            { id: "html-close", label: "</html>" },
          ],
          answerOrder: ["doctype", "html-open", "head", "body", "html-close"],
        }),
      ],
    },
    {
      id: "html-skeleton-title-section",
      title: "タイトルと本文",
      description: "titleとh1の違いを確認します。",
      order: 2,
      activities: [
        tutorial({
          id: "html-skeleton-a04-title-h1-intro",
          order: 4,
          sectionOrder: 1,
          title: "titleはタブ名、h1は画面の見出し",
          mentorMessage: "titleとh1はどちらもページ名のように見えますが、表示される場所が違います。",
          body: [
            "titleタグはheadの中に書き、ブラウザのタブ名などに使われます。",
            "h1タグはbodyの中に書き、ページ本文の大きな見出しとして表示されます。",
            "ユーザーが画面で読む見出しを作りたいときはh1を使います。",
          ].join("\n\n"),
          summary: ["titleはタブ名", "h1は画面本文の見出し"],
          visual: course3Visuals.titleBody,
        }),
        c3Choice({
          id: "html-skeleton-a05-visible-tag-choice",
          order: 5,
          sectionOrder: 2,
          title: "画面に表示されるタグはどれ？",
          instruction: "画面本文に表示されるタグを選びましょう。",
          mentorMessage: "bodyの中に書くものが画面本文として表示されます。",
          question: "ページ本文の大きな見出しとして表示したいときに使うタグはどれ？",
          correct: "<h1>予約サイト</h1>",
          correctFeedback: "その通りです。h1は画面本文の大きな見出しとして表示されます。",
          wrongs: ["<title>予約サイト</title>", "<meta charset=\"UTF-8\">", "<!DOCTYPE html>"],
        }),
        c3Choice({
          id: "html-skeleton-a06-tab-body-choice",
          order: 6,
          sectionOrder: 3,
          title: "ブラウザのタブ名に関係するのは？",
          instruction: "タブ名に関係するタグを選びましょう。",
          mentorMessage: "titleは画面本文ではなく、ページ設定として扱います。",
          question: "ブラウザのタブ名として使われるタグはどれ？",
          correct: "<title>自己紹介ページ</title>",
          correctFeedback: "その通りです。titleはページのタイトルとして、ブラウザのタブ名などに使われます。",
          wrongs: ["<h1>自己紹介ページ</h1>", "<p>自己紹介ページ</p>", "<button>自己紹介ページ</button>"],
        }),
      ],
    },
    {
      id: "html-skeleton-check-section",
      title: "Mission Check",
      description: "HTMLの基本形を確認します。",
      order: 3,
      activities: [
        c3CodeOrder({
          id: "html-skeleton-c01-h1-p-check",
          order: 7,
          sectionOrder: 1,
          title: "h1とpを完成させよう",
          instruction: "見出しと本文を正しい順番に並べましょう。",
          mentorMessage: "画面に表示する見出しと本文を確認します。",
          steps: [
            { id: "body-open", label: "<body>" },
            { id: "h1", label: "<h1>自己紹介</h1>" },
            { id: "p", label: "<p>Webアプリを学んでいます。</p>" },
            { id: "body-close", label: "</body>" },
          ],
          answerOrder: ["body-open", "h1", "p", "body-close"],
          isMissionCheck: true,
        }),
        c3CodeOrder({
          id: "html-skeleton-c02-basic-check",
          order: 8,
          sectionOrder: 2,
          title: "HTMLの基本形を完成させよう",
          instruction: "HTML文書として自然な順番に並べましょう。",
          mentorMessage: "headとbodyの位置を確認します。",
          steps: [
            { id: "doctype", label: "<!DOCTYPE html>" },
            { id: "html-open", label: "<html>" },
            { id: "head", label: "<head><title>ページ</title></head>" },
            { id: "body", label: "<body><h1>ページ</h1></body>" },
            { id: "html-close", label: "</html>" },
          ],
          answerOrder: ["doctype", "html-open", "head", "body", "html-close"],
          isMissionCheck: true,
        }),
        c3CodeOrder({
          id: "html-skeleton-c03-meta-check",
          order: 9,
          sectionOrder: 3,
          title: "meta charsetを含むHTMLを再現しよう",
          instruction: "文字コード設定を含むHTML文書を並べましょう。",
          mentorMessage: "meta charsetはheadの中に入ります。",
          steps: [
            { id: "doctype", label: "<!DOCTYPE html>" },
            { id: "html-open", label: "<html lang=\"ja\">" },
            { id: "meta", label: "<head><meta charset=\"UTF-8\"><title>自己紹介</title></head>" },
            { id: "body", label: "<body><h1>自己紹介</h1><p>こんにちは。</p></body>" },
            { id: "html-close", label: "</html>" },
          ],
          answerOrder: ["doctype", "html-open", "meta", "body", "html-close"],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};


type C3ActivitySpec = any;
type C3MissionSpec = any;

const toC3Activity = (spec: C3ActivitySpec, order: number, sectionOrder: number, isMissionCheck = false): ActivitySeed => {
  if (spec.kind === "tutorial") {
    return tutorial({
      id: spec.id,
      order,
      sectionOrder,
      title: spec.title,
      mentorMessage: spec.mentorMessage,
      body: Array.isArray(spec.body) ? spec.body.join("\n\n") : spec.body,
      summary: spec.summary ?? [],
      visual: spec.visualKey ? course3Visuals[spec.visualKey as keyof typeof course3Visuals] : undefined,
    });
  }

  if (spec.kind === "choice") {
    return c3Choice({
      id: spec.id,
      order,
      sectionOrder,
      title: spec.title,
      instruction: spec.instruction,
      mentorMessage: spec.mentorMessage,
      question: spec.question,
      correct: spec.correct,
      correctFeedback: spec.correctFeedback,
      wrongs: spec.wrongs,
      isMissionCheck,
    });
  }

  if (spec.kind === "match") {
    return c3Match({
      id: spec.id,
      order,
      sectionOrder,
      title: spec.title,
      instruction: spec.instruction,
      mentorMessage: spec.mentorMessage,
      items: spec.items.map(([id, label]: [string, string]) => ({ id, label })),
      targets: spec.targets.map(([id, label]: [string, string]) => ({ id, label })),
      answers: spec.answers.map(([targetId, itemIds]: [string, string[]]) => ({ targetId, itemIds })),
      isMissionCheck,
    });
  }

  return c3CodeOrder({
    id: spec.id,
    order,
    sectionOrder,
    title: spec.title,
    instruction: spec.instruction,
    mentorMessage: spec.mentorMessage,
    steps: spec.steps.map((label: string, index: number) => ({ id: `${spec.id}-step-${index + 1}`, label })),
    answerOrder: spec.steps.map((_: string, index: number) => `${spec.id}-step-${index + 1}`),
    isMissionCheck,
  });
};

const buildCourse3Mission = (spec: C3MissionSpec): MissionSeed => {
  let activityOrder = 1;
  const normalSections = spec.sections.map((section: any, sectionIndex: number) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: sectionIndex + 1,
    activities: section.activities.map((activity: C3ActivitySpec, activityIndex: number) =>
      toC3Activity(activity, activityOrder++, activityIndex + 1),
    ),
  }));

  const checkSection: SectionSeed = {
    id: `${spec.id}-check-section`,
    title: "Mission Check",
    description: "このMissionで学んだことを確認します。",
    order: normalSections.length + 1,
    activities: spec.check.map((activity: C3ActivitySpec, activityIndex: number) =>
      toC3Activity(activity, activityOrder++, activityIndex + 1, true),
    ),
  };

  return {
    id: spec.id,
    title: spec.title,
    description: spec.description,
    difficulty: spec.type === "CHALLENGE" ? CourseDifficulty.NORMAL : CourseDifficulty.EASY,
    goalImg: spec.goalImg,
    estimatedMinutes: spec.estimatedMinutes,
    order: spec.order,
    type: spec.type === "CHALLENGE" ? MissionType.CHALLENGE : MissionType.MAIN,
    isRequiredForCourseCompletion: spec.isRequiredForCourseCompletion ?? true,
    parentMissionId: spec.parentMissionId ?? null,
    roadmapLane: spec.type === "CHALLENGE" ? 1 : 0,
    branchOrder: spec.type === "CHALLENGE" ? spec.order : 0,
    rewardExp: spec.rewardExp,
    learnedItems: spec.learnedItems,
    isPublished: true,
    sections: [...normalSections, checkSection],
  };
};

const course3MissionSpecs = [
  {
    "id": "html-links-images",
    "title": "リンクと画像を使う",
    "description": "別ページへの移動や画像表示を使って、Webページらしい表現を作ります。",
    "estimatedMinutes": 12,
    "order": 3,
    "rewardExp": 120,
    "goalImg": "/images/missions/html-links-images.png",
    "learnedItems": [
      "aとhrefの役割",
      "imgとsrcの役割",
      "altの意味",
      "リンクと画像を含むブロック"
    ],
    "sections": [
      {
        "id": "html-link-section",
        "title": "リンクを作る",
        "description": "aタグとhref属性を使ってリンクを作ります。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "html-link-a01-intro",
            "title": "aタグはクリックできるリンクを作る",
            "mentorMessage": "Webページでは、別ページへ移動する入口としてリンクをよく使います。",
            "body": [
              "aタグはリンクを作るタグです。",
              "href属性には、クリックしたときの移動先を書きます。",
              "例: <a href=\"/about\">詳しく見る</a>"
            ],
            "summary": [
              "aはリンク",
              "hrefは移動先"
            ],
            "visualKey": "linkImage"
          },
          {
            "kind": "choice",
            "id": "html-link-a02-click-text",
            "title": "クリックできる文字はどれ？",
            "instruction": "リンクとして表示される文字を選びましょう。",
            "mentorMessage": "aタグの開始タグと終了タグの間にある文字がクリックできる部分です。",
            "question": "<a href=\"/about\">詳しく見る</a> でクリックできる文字はどれ？",
            "correct": "詳しく見る",
            "correctFeedback": "その通りです。タグに挟まれた文字がリンクとして表示されます。",
            "wrongs": [
              "/about",
              "href",
              "a"
            ]
          },
          {
            "kind": "order",
            "id": "html-link-a03-code-order",
            "title": "リンクタグを組み立てよう",
            "instruction": "リンクタグとして自然な順番に並べましょう。",
            "mentorMessage": "開始タグ、表示文字、終了タグの順に考えます。",
            "steps": [
              "<a href=\"/about\">",
              "詳しく見る",
              "</a>"
            ]
          }
        ]
      },
      {
        "id": "html-image-section",
        "title": "画像を表示する",
        "description": "imgタグ、src、altの役割を確認します。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "html-image-a04-intro",
            "title": "imgタグは画像を表示する",
            "mentorMessage": "画像を使うと、ページの内容を直感的に伝えやすくなります。",
            "body": [
              "imgタグは画像を表示するタグです。",
              "src属性には画像ファイルの場所を書きます。",
              "alt属性には、画像が表示されないときや読み上げのための説明を書きます。",
              "例: <img src=\"/static/cafe.png\" alt=\"カフェの写真\">"
            ],
            "summary": [
              "imgは画像",
              "srcは画像の場所",
              "altは画像の説明"
            ]
          },
          {
            "kind": "choice",
            "id": "html-image-a05-missing-choice",
            "title": "画像が出ない原因は？",
            "instruction": "画像が表示されない原因として自然なものを選びましょう。",
            "mentorMessage": "画像が出ないときは、画像の場所やファイル名を確認します。",
            "question": "imgタグを書いたのに画像が表示されません。まず疑う場所として自然なのはどれ？",
            "correct": "srcのファイル名やパスが間違っている",
            "correctFeedback": "その通りです。画像が出ないときはsrcの指定を確認します。",
            "wrongs": [
              "h1の文字が大きすぎる",
              "pタグが短すぎる",
              "titleタグが英語ではない"
            ]
          },
          {
            "kind": "choice",
            "id": "html-image-a06-alt-choice",
            "title": "altの意味は？",
            "instruction": "alt属性の説明として近いものを選びましょう。",
            "mentorMessage": "altは画像の代わりになる説明です。",
            "question": "alt属性の役割として近いものはどれ？",
            "correct": "画像の内容を説明する文字を書く",
            "correctFeedback": "その通りです。altには画像の内容を説明する文字を書きます。",
            "wrongs": [
              "画像の横幅だけを決める",
              "リンク先URLを書く",
              "Pythonの処理を書く"
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "order",
        "id": "html-link-image-c01-link-check",
        "title": "リンクタグを完成させよう",
        "instruction": "リンクタグとして自然な順番に並べましょう。",
        "mentorMessage": "aタグとhrefを確認します。",
        "steps": [
          "<a href=\"/reserve\">",
          "予約する",
          "</a>"
        ]
      },
      {
        "kind": "order",
        "id": "html-link-image-c02-card-check",
        "title": "画像つき紹介カードを再現しよう",
        "instruction": "画像、見出し、説明文の順に並べましょう。",
        "mentorMessage": "カードの中に画像と説明を入れます。",
        "steps": [
          "<div class=\"card\">",
          "<img src=\"/static/cafe.png\" alt=\"カフェの写真\">",
          "<h2>カフェ予約</h2>",
          "<p>席を予約できます。</p>",
          "</div>"
        ]
      },
      {
        "kind": "order",
        "id": "html-link-image-c03-block-check",
        "title": "リンク、画像、説明文を含むブロックを再現しよう",
        "instruction": "紹介ブロックとして自然な順に並べましょう。",
        "mentorMessage": "画像、説明、リンクを組み合わせます。",
        "steps": [
          "<section>",
          "<img src=\"/static/app.png\" alt=\"アプリ画面\">",
          "<h2>便利な予約アプリ</h2>",
          "<p>空き時間をすぐに確認できます。</p>",
          "<a href=\"/reserve\">予約する</a>",
          "</section>"
        ]
      }
    ]
  },
  {
    "id": "html-list-table",
    "title": "リストと表で情報を整理する",
    "description": "箇条書きや表を使って、複数の情報を見やすく整理します。",
    "estimatedMinutes": 12,
    "order": 4,
    "rewardExp": 120,
    "goalImg": "/images/missions/html-list-table.png",
    "learnedItems": [
      "ul/ol/liの違い",
      "table/tr/th/tdの役割",
      "予約一覧に必要な列",
      "リストと表の使い分け"
    ],
    "sections": [
      {
        "id": "html-list-table-s1",
        "title": "リストを使う",
        "description": "ulは順序のないリスト、olは順序のあるリスト、liは1つの項目です。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "html-list-table-a01-intro",
            "title": "リストを使う",
            "mentorMessage": "リストを使うについて、まず役割を確認しましょう。",
            "body": [
              "ulは順序のないリスト、olは順序のあるリスト、liは1つの項目です。",
              "特徴やメニューはul、手順やランキングはolが向いています。"
            ],
            "summary": [
              "ulは順序のないリスト、olは順序のあるリスト、liは1つの項目です",
              "使う場面を見分ける"
            ],
            "visualKey": "listTable"
          },
          {
            "kind": "choice",
            "id": "html-list-table-a02-choice",
            "title": "リストを使うに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "箇条書きに向く情報はどれ？",
            "correct": "サービスの特徴を3つ並べる",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "html-list-table-a03-match",
            "title": "リストを使うの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "html-list-table-s2",
        "title": "表を使う",
        "description": "表は行と列で情報を整理します。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "html-list-table-a04-intro",
            "title": "表を使う",
            "mentorMessage": "表を使うについて、まず役割を確認しましょう。",
            "body": [
              "表は行と列で情報を整理します。",
              "予約一覧では、名前、日付、人数のような列を作ると読みやすくなります。"
            ],
            "summary": [
              "表は行と列で情報を整理します",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "html-list-table-a05-choice",
            "title": "表を使うに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "予約一覧の列として自然なのは？",
            "correct": "名前・日付・人数",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "html-list-table-a06-match",
            "title": "表を使うの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "html-list-table-c01-check",
        "title": "リストと表で情報を整理するの基本を確認しよう",
        "instruction": "もっとも自然な答えを選びましょう。",
        "mentorMessage": "このMissionの中心だけを確認します。",
        "question": "箇条書きに向く情報はどれ？",
        "correct": "サービスの特徴を3つ並べる",
        "correctFeedback": "OKです。中心となる考え方を確認できています。",
        "wrongs": [
          "関係のないPC設定だけを見る",
          "すべてDBで解決する",
          "画像だけで説明する"
        ]
      },
      {
        "kind": "order",
        "id": "html-list-table-c02-code-check",
        "title": "リストと表で情報を整理するのコード断片を並べよう",
        "instruction": "HTML/CSSとして自然な順番に並べましょう。",
        "mentorMessage": "外側から内側へ、または目的に合う順番を考えます。",
        "steps": [
          "<div class=\"card\">",
          "<h2>タイトル</h2>",
          "<p>説明文</p>",
          "</div>"
        ]
      }
    ]
  },
  {
    "id": "html-div-class",
    "title": "divとclassで部品を作る",
    "description": "画面のまとまりに名前を付け、CSSを当てやすい構造を作ります。",
    "estimatedMinutes": 12,
    "order": 5,
    "rewardExp": 120,
    "goalImg": "/images/missions/html-div-class.png",
    "learnedItems": [
      "divでまとまりを作る",
      "classで名前を付ける",
      "カードUIの構造",
      "CSSセレクタとの対応"
    ],
    "sections": [
      {
        "id": "html-div-class-s1",
        "title": "divでまとまりを作る",
        "description": "divは画面上のまとまりを作るためによく使います。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "html-div-class-a01-intro",
            "title": "divでまとまりを作る",
            "mentorMessage": "divでまとまりを作るについて、まず役割を確認しましょう。",
            "body": [
              "divは画面上のまとまりを作るためによく使います。",
              "カード全体、ヘッダー全体、一覧全体のような部品を囲めます。"
            ],
            "summary": [
              "divは画面上のまとまりを作るためによく使います",
              "使う場面を見分ける"
            ],
            "visualKey": "divClass"
          },
          {
            "kind": "choice",
            "id": "html-div-class-a02-choice",
            "title": "divでまとまりを作るに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "カード全体を囲むときに使いやすいタグは？",
            "correct": "<div class=\"card\">",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "html-div-class-a03-match",
            "title": "divでまとまりを作るの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "html-div-class-s2",
        "title": "classで名前をつける",
        "description": "classはHTMLの部品に名前を付けるために使います。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "html-div-class-a04-intro",
            "title": "classで名前をつける",
            "mentorMessage": "classで名前をつけるについて、まず役割を確認しましょう。",
            "body": [
              "classはHTMLの部品に名前を付けるために使います。",
              "CSSでは.cardのように書いて、そのclassが付いた部品へ見た目を当てます。"
            ],
            "summary": [
              "classはHTMLの部品に名前を付けるために使います",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "html-div-class-a05-choice",
            "title": "classで名前をつけるに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "class=\"card\"に対応するCSSセレクタは？",
            "correct": ".card",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "html-div-class-a06-match",
            "title": "classで名前をつけるの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "html-div-class-c01-check",
        "title": "divとclassで部品を作るの基本を確認しよう",
        "instruction": "もっとも自然な答えを選びましょう。",
        "mentorMessage": "このMissionの中心だけを確認します。",
        "question": "カード全体を囲むときに使いやすいタグは？",
        "correct": "<div class=\"card\">",
        "correctFeedback": "OKです。中心となる考え方を確認できています。",
        "wrongs": [
          "関係のないPC設定だけを見る",
          "すべてDBで解決する",
          "画像だけで説明する"
        ]
      },
      {
        "kind": "order",
        "id": "html-div-class-c02-code-check",
        "title": "divとclassで部品を作るのコード断片を並べよう",
        "instruction": "HTML/CSSとして自然な順番に並べましょう。",
        "mentorMessage": "外側から内側へ、または目的に合う順番を考えます。",
        "steps": [
          "<div class=\"card\">",
          "<h2>タイトル</h2>",
          "<p>説明文</p>",
          "</div>"
        ]
      }
    ]
  },
  {
    "id": "css-linking",
    "title": "CSSを読み込む",
    "description": "HTMLとCSSを分け、CSSファイルをHTMLから読み込めるようにします。",
    "estimatedMinutes": 12,
    "order": 6,
    "rewardExp": 120,
    "goalImg": "/images/missions/css-linking.png",
    "learnedItems": [
      "HTMLとCSSの分担",
      "link rel=stylesheet",
      "staticフォルダとの関係",
      "CSSが効かない原因"
    ],
    "sections": [
      {
        "id": "css-linking-s1",
        "title": "CSSファイルの役割",
        "description": "HTMLは内容や構造、CSSは見た目を担当します。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "css-linking-a01-intro",
            "title": "CSSファイルの役割",
            "mentorMessage": "CSSファイルの役割について、まず役割を確認しましょう。",
            "body": [
              "HTMLは内容や構造、CSSは見た目を担当します。",
              "同じHTMLでもCSSを変えると、色、余白、配置が変わります。"
            ],
            "summary": [
              "HTMLは内容や構造、CSSは見た目を担当します",
              "使う場面を見分ける"
            ],
            "visualKey": "htmlCss"
          },
          {
            "kind": "choice",
            "id": "css-linking-a02-choice",
            "title": "CSSファイルの役割に近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "見た目を変えるコードとして近いものは？",
            "correct": "color: blue;",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "css-linking-a03-match",
            "title": "CSSファイルの役割の役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "css-linking-s2",
        "title": "CSSをHTMLに読み込む",
        "description": "外部CSSを使うにはlinkタグで読み込みます。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "css-linking-a04-intro",
            "title": "CSSをHTMLに読み込む",
            "mentorMessage": "CSSをHTMLに読み込むについて、まず役割を確認しましょう。",
            "body": [
              "外部CSSを使うにはlinkタグで読み込みます。",
              "Flaskではstaticフォルダに置いたCSSを読み込む形がよく使われます。"
            ],
            "summary": [
              "外部CSSを使うにはlinkタグで読み込みます",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "css-linking-a05-choice",
            "title": "CSSをHTMLに読み込むに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "CSSを読み込むタグとして自然なのは？",
            "correct": "<link rel=\"stylesheet\" href=\"/static/style.css\">",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "css-linking-a06-match",
            "title": "CSSをHTMLに読み込むの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "css-linking-c01-check",
        "title": "CSSを読み込むの基本を確認しよう",
        "instruction": "もっとも自然な答えを選びましょう。",
        "mentorMessage": "このMissionの中心だけを確認します。",
        "question": "見た目を変えるコードとして近いものは？",
        "correct": "color: blue;",
        "correctFeedback": "OKです。中心となる考え方を確認できています。",
        "wrongs": [
          "関係のないPC設定だけを見る",
          "すべてDBで解決する",
          "画像だけで説明する"
        ]
      },
      {
        "kind": "order",
        "id": "css-linking-c02-code-check",
        "title": "CSSを読み込むのコード断片を並べよう",
        "instruction": "HTML/CSSとして自然な順番に並べましょう。",
        "mentorMessage": "外側から内側へ、または目的に合う順番を考えます。",
        "steps": [
          "<div class=\"card\">",
          "<h2>タイトル</h2>",
          "<p>説明文</p>",
          "</div>"
        ]
      }
    ]
  },
  {
    "id": "css-basic-style",
    "title": "色・文字・余白を変える",
    "description": "CSSの基本プロパティで、カードや本文の見た目を整えます。",
    "estimatedMinutes": 12,
    "order": 7,
    "rewardExp": 120,
    "goalImg": "/images/missions/css-basic-style.png",
    "learnedItems": [
      "color/background-color/font-size",
      "margin/padding/border",
      "カードUIの余白",
      "読みやすいCSS"
    ],
    "sections": [
      {
        "id": "css-basic-style-s1",
        "title": "色と文字サイズ",
        "description": "colorは文字色、background-colorは背景色、font-sizeは文字サイズを変えます。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "css-basic-style-a01-intro",
            "title": "色と文字サイズ",
            "mentorMessage": "色と文字サイズについて、まず役割を確認しましょう。",
            "body": [
              "colorは文字色、background-colorは背景色、font-sizeは文字サイズを変えます。",
              "まずは何を変えたいのかをプロパティで選びます。"
            ],
            "summary": [
              "colorは文字色、background-colorは背景色、font-sizeは文字サイズを変えます",
              "使う場面を見分ける"
            ],
            "visualKey": "cssBasics"
          },
          {
            "kind": "choice",
            "id": "css-basic-style-a02-choice",
            "title": "色と文字サイズに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "文字色を青にするCSSは？",
            "correct": "color: blue;",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "css-basic-style-a03-match",
            "title": "色と文字サイズの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "css-basic-style-s2",
        "title": "余白と枠線",
        "description": "marginは外側の余白、paddingは内側の余白、borderは枠線です。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "css-basic-style-a04-intro",
            "title": "余白と枠線",
            "mentorMessage": "余白と枠線について、まず役割を確認しましょう。",
            "body": [
              "marginは外側の余白、paddingは内側の余白、borderは枠線です。",
              "カードUIでは、内側の余白と枠線を整えると読みやすくなります。"
            ],
            "summary": [
              "marginは外側の余白、paddingは内側の余白、borderは枠線です",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "css-basic-style-a05-choice",
            "title": "余白と枠線に近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "カードの内側に余白を作るCSSは？",
            "correct": "padding: 16px;",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "css-basic-style-a06-match",
            "title": "余白と枠線の役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "css-basic-style-c01-check",
        "title": "色・文字・余白を変えるの基本を確認しよう",
        "instruction": "もっとも自然な答えを選びましょう。",
        "mentorMessage": "このMissionの中心だけを確認します。",
        "question": "文字色を青にするCSSは？",
        "correct": "color: blue;",
        "correctFeedback": "OKです。中心となる考え方を確認できています。",
        "wrongs": [
          "関係のないPC設定だけを見る",
          "すべてDBで解決する",
          "画像だけで説明する"
        ]
      },
      {
        "kind": "order",
        "id": "css-basic-style-c02-code-check",
        "title": "色・文字・余白を変えるのコード断片を並べよう",
        "instruction": "HTML/CSSとして自然な順番に並べましょう。",
        "mentorMessage": "外側から内側へ、または目的に合う順番を考えます。",
        "steps": [
          "<div class=\"card\">",
          "<h2>タイトル</h2>",
          "<p>説明文</p>",
          "</div>"
        ]
      }
    ]
  },
  {
    "id": "css-layout-flex",
    "title": "レイアウトを整える",
    "description": "縦並び・横並びを理解し、Flexboxの入口を扱います。",
    "estimatedMinutes": 12,
    "order": 8,
    "rewardExp": 120,
    "goalImg": "/images/missions/css-layout-flex.png",
    "learnedItems": [
      "縦並びと横並び",
      "display:flex",
      "gapとalign-items",
      "カード一覧のレイアウト"
    ],
    "sections": [
      {
        "id": "css-layout-flex-s1",
        "title": "縦に並べる、横に並べる",
        "description": "文章は縦に並ぶと読みやすいことが多いです。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "css-layout-flex-a01-intro",
            "title": "縦に並べる、横に並べる",
            "mentorMessage": "縦に並べる、横に並べるについて、まず役割を確認しましょう。",
            "body": [
              "文章は縦に並ぶと読みやすいことが多いです。",
              "カード一覧やナビゲーションは、横並びにすると比較しやすい場面があります。"
            ],
            "summary": [
              "文章は縦に並ぶと読みやすいことが多いです",
              "使う場面を見分ける"
            ],
            "visualKey": "flexbox"
          },
          {
            "kind": "choice",
            "id": "css-layout-flex-a02-choice",
            "title": "縦に並べる、横に並べるに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "横並びに向きやすいものは？",
            "correct": "複数のカードを横に並べて比較する",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "css-layout-flex-a03-match",
            "title": "縦に並べる、横に並べるの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "css-layout-flex-s2",
        "title": "Flexboxの入口",
        "description": "display: flexを指定すると、子要素を並べるレイアウトを作りやすくなります。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "css-layout-flex-a04-intro",
            "title": "Flexboxの入口",
            "mentorMessage": "Flexboxの入口について、まず役割を確認しましょう。",
            "body": [
              "display: flexを指定すると、子要素を並べるレイアウトを作りやすくなります。",
              "gapで要素同士の間隔、align-itemsで縦方向のそろえを調整できます。"
            ],
            "summary": [
              "display: flexを指定すると、子要素を並べるレイアウトを作りやすくなります",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "css-layout-flex-a05-choice",
            "title": "Flexboxの入口に近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "横並びの入口になるCSSは？",
            "correct": "display: flex;",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "css-layout-flex-a06-match",
            "title": "Flexboxの入口の役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "css-layout-flex-c01-check",
        "title": "レイアウトを整えるの基本を確認しよう",
        "instruction": "もっとも自然な答えを選びましょう。",
        "mentorMessage": "このMissionの中心だけを確認します。",
        "question": "横並びに向きやすいものは？",
        "correct": "複数のカードを横に並べて比較する",
        "correctFeedback": "OKです。中心となる考え方を確認できています。",
        "wrongs": [
          "関係のないPC設定だけを見る",
          "すべてDBで解決する",
          "画像だけで説明する"
        ]
      },
      {
        "kind": "order",
        "id": "css-layout-flex-c02-code-check",
        "title": "レイアウトを整えるのコード断片を並べよう",
        "instruction": "HTML/CSSとして自然な順番に並べましょう。",
        "mentorMessage": "外側から内側へ、または目的に合う順番を考えます。",
        "steps": [
          "<div class=\"card\">",
          "<h2>タイトル</h2>",
          "<p>説明文</p>",
          "</div>"
        ]
      }
    ]
  },
  {
    "id": "service-top-page",
    "title": "サービス風トップページを組む",
    "description": "ヘッダー、メイン、カード、ボタンを組み合わせて、サービス風のトップページを作ります。",
    "estimatedMinutes": 15,
    "order": 9,
    "rewardExp": 150,
    "goalImg": "/images/missions/service-top-page.png",
    "learnedItems": [
      "ページ部品の分解",
      "トップページHTML",
      "カード一覧",
      "最低限のCSS"
    ],
    "sections": [
      {
        "id": "service-top-page-s1",
        "title": "ページの部品を決める",
        "description": "サービス風のトップページは、ヘッダー、メイン、カード、ボタンなどの部品に分けると作りやすくなります。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "service-top-page-a01-intro",
            "title": "ページの部品を決める",
            "mentorMessage": "ページの部品を決めるについて、まず役割を確認しましょう。",
            "body": [
              "サービス風のトップページは、ヘッダー、メイン、カード、ボタンなどの部品に分けると作りやすくなります。",
              "まずは画面を上から順に観察して、必要な部品を洗い出します。"
            ],
            "summary": [
              "サービス風のトップページは、ヘッダー、メイン、カード、ボタンなどの部品に分けると作りやすくなります",
              "使う場面を見分ける"
            ],
            "visualKey": "servicePageParts"
          },
          {
            "kind": "choice",
            "id": "service-top-page-a02-choice",
            "title": "ページの部品を決めるに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "トップページの部品として自然なのは？",
            "correct": "ヘッダー、メイン、カード、ボタン",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "service-top-page-a03-match",
            "title": "ページの部品を決めるの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "service-top-page-s2",
        "title": "HTMLを組み立てる",
        "description": "HTMLでは、ヘッダー、メイン、カード一覧のように部品ごとにまとまりを作ります。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "service-top-page-a04-intro",
            "title": "HTMLを組み立てる",
            "mentorMessage": "HTMLを組み立てるについて、まず役割を確認しましょう。",
            "body": [
              "HTMLでは、ヘッダー、メイン、カード一覧のように部品ごとにまとまりを作ります。",
              "カードには見出し、説明文、ボタンを入れるとサービス紹介らしくなります。"
            ],
            "summary": [
              "HTMLでは、ヘッダー、メイン、カード一覧のように部品ごとにまとまりを作ります",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "service-top-page-a05-choice",
            "title": "HTMLを組み立てるに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "カードのHTMLとして自然なのは？",
            "correct": "div.card の中に h2、p、a を入れる",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "service-top-page-a06-match",
            "title": "HTMLを組み立てるの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      },
      {
        "id": "service-top-page-s3",
        "title": "CSSを当てる",
        "description": "完成例に近づけるには、背景色、余白、カードの枠線、ボタンの色を整えます。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "service-top-page-a07-intro",
            "title": "CSSを当てる",
            "mentorMessage": "CSSを当てるについて、まず役割を確認しましょう。",
            "body": [
              "完成例に近づけるには、背景色、余白、カードの枠線、ボタンの色を整えます。",
              "全部を派手にするより、読みやすい余白と配置を優先します。"
            ],
            "summary": [
              "完成例に近づけるには、背景色、余白、カードの枠線、ボタンの色を整えます",
              "使う場面を見分ける"
            ],
            "visualKey": null
          },
          {
            "kind": "choice",
            "id": "service-top-page-a08-choice",
            "title": "CSSを当てるに近いものは？",
            "instruction": "役割に合うものを選びましょう。",
            "mentorMessage": "何を作りたいか、何を変えたいかに注目します。",
            "question": "見やすいトップページに必要な調整は？",
            "correct": "余白、カード、ボタンの見た目を整える",
            "correctFeedback": "その通りです。役割に合うものを選べています。",
            "wrongs": [
              "titleタグだけを書く",
              "Pythonの変数だけを変更する",
              "DBの中身を削除する"
            ]
          },
          {
            "kind": "match",
            "id": "service-top-page-a09-match",
            "title": "CSSを当てるの役割を対応づけよう",
            "instruction": "用語と役割を対応づけましょう。",
            "mentorMessage": "名前だけでなく、何を担当するかで整理します。",
            "items": [
              [
                "html",
                "HTML"
              ],
              [
                "css",
                "CSS"
              ],
              [
                "page",
                "画面表示"
              ]
            ],
            "targets": [
              [
                "structure",
                "構造"
              ],
              [
                "style",
                "見た目"
              ],
              [
                "result",
                "ブラウザで見える結果"
              ]
            ],
            "answers": [
              [
                "structure",
                [
                  "html"
                ]
              ],
              [
                "style",
                [
                  "css"
                ]
              ],
              [
                "result",
                [
                  "page"
                ]
              ]
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "service-top-page-c01-check",
        "title": "サービス風トップページを組むの基本を確認しよう",
        "instruction": "もっとも自然な答えを選びましょう。",
        "mentorMessage": "このMissionの中心だけを確認します。",
        "question": "トップページの部品として自然なのは？",
        "correct": "ヘッダー、メイン、カード、ボタン",
        "correctFeedback": "OKです。中心となる考え方を確認できています。",
        "wrongs": [
          "関係のないPC設定だけを見る",
          "すべてDBで解決する",
          "画像だけで説明する"
        ]
      },
      {
        "kind": "order",
        "id": "service-top-page-c02-code-check",
        "title": "サービス風トップページを組むのコード断片を並べよう",
        "instruction": "HTML/CSSとして自然な順番に並べましょう。",
        "mentorMessage": "外側から内側へ、または目的に合う順番を考えます。",
        "steps": [
          "<div class=\"card\">",
          "<h2>タイトル</h2>",
          "<p>説明文</p>",
          "</div>"
        ]
      }
    ]
  },
  {
    "id": "challenge-navigation",
    "title": "ナビゲーションを追加する",
    "description": "ヘッダー内に複数ページへ移動するリンクを追加します。",
    "order": 10,
    "parentMissionId": "html-links-images",
    "goalImg": "/images/missions/challenge-navigation.png",
    "learnedItems": [
      "ナビゲーションの役割",
      "複数リンクのHTML",
      "ヘッダー内の配置"
    ],
    "visualKey": "linkImage",
    "question": "ナビゲーションとして自然なのは？",
    "correct": "ヘッダー内に複数のaタグを並べる",
    "estimatedMinutes": 8,
    "rewardExp": 80,
    "type": "CHALLENGE",
    "isRequiredForCourseCompletion": false,
    "sections": [
      {
        "id": "challenge-navigation-section",
        "title": "ナビゲーションを追加する",
        "description": "ヘッダー内に複数ページへ移動するリンクを追加します。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "challenge-navigation-a01-intro",
            "title": "ナビゲーションを追加する",
            "mentorMessage": "挑戦ミッションです。基本を少し広げて使ってみましょう。",
            "body": [
              "ヘッダー内に複数ページへ移動するリンクを追加します。",
              "ここでは、これまで学んだHTML/CSSを使って、より実際のページに近い形へ広げます。"
            ],
            "summary": [
              "ナビゲーションの役割",
              "複数リンクのHTML"
            ],
            "visualKey": "linkImage"
          },
          {
            "kind": "choice",
            "id": "challenge-navigation-a02-choice",
            "title": "自然な実装方針を選ぼう",
            "instruction": "目的に合う実装方針を選びましょう。",
            "mentorMessage": "見た目だけでなく、ページの役割に合っているかを見ます。",
            "question": "ナビゲーションとして自然なのは？",
            "correct": "ヘッダー内に複数のaタグを並べる",
            "correctFeedback": "その通りです。目的に合った変更を選べています。",
            "wrongs": [
              "titleタグだけを変えて終わる",
              "DBを全削除する",
              "画像を消して何も表示しない"
            ]
          },
          {
            "kind": "order",
            "id": "challenge-navigation-a03-order",
            "title": "主要コードを並べよう",
            "instruction": "主要なHTML断片を自然な順番に並べましょう。",
            "mentorMessage": "部品の外側から中身へ考えます。",
            "steps": [
              "<header>",
              "<nav><a href=\"/\">Home</a><a href=\"/reserve\">Reserve</a></nav>",
              "</header>",
              "<main>",
              "<section class=\"card\">内容</section>",
              "</main>"
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "challenge-navigation-c01-check",
        "title": "Challenge Check",
        "instruction": "このChallengeの中心を確認しましょう。",
        "mentorMessage": "目的に合う変更を選びます。",
        "question": "ナビゲーションとして自然なのは？",
        "correct": "ヘッダー内に複数のaタグを並べる",
        "correctFeedback": "OKです。Challengeのポイントを確認できています。",
        "wrongs": [
          "関係ない設定だけ変える",
          "画面の主要部分を消す",
          "サーバ起動だけ確認する"
        ]
      }
    ]
  },
  {
    "id": "challenge-responsive-layout",
    "title": "スマホでも見やすい画面を考える",
    "description": "画面幅が狭いときに1列表示へ変える考え方を学びます。",
    "order": 11,
    "parentMissionId": "css-layout-flex",
    "goalImg": "/images/missions/challenge-responsive-layout.png",
    "learnedItems": [
      "スマホで困る横並び",
      "1列表示",
      "メディアクエリの入口"
    ],
    "visualKey": "responsive",
    "question": "スマホで見やすい配置として自然なのは？",
    "correct": "横並びカードを1列にする",
    "estimatedMinutes": 8,
    "rewardExp": 80,
    "type": "CHALLENGE",
    "isRequiredForCourseCompletion": false,
    "sections": [
      {
        "id": "challenge-responsive-layout-section",
        "title": "スマホでも見やすい画面を考える",
        "description": "画面幅が狭いときに1列表示へ変える考え方を学びます。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "challenge-responsive-layout-a01-intro",
            "title": "スマホでも見やすい画面を考える",
            "mentorMessage": "挑戦ミッションです。基本を少し広げて使ってみましょう。",
            "body": [
              "画面幅が狭いときに1列表示へ変える考え方を学びます。",
              "ここでは、これまで学んだHTML/CSSを使って、より実際のページに近い形へ広げます。"
            ],
            "summary": [
              "スマホで困る横並び",
              "1列表示"
            ],
            "visualKey": "responsive"
          },
          {
            "kind": "choice",
            "id": "challenge-responsive-layout-a02-choice",
            "title": "自然な実装方針を選ぼう",
            "instruction": "目的に合う実装方針を選びましょう。",
            "mentorMessage": "見た目だけでなく、ページの役割に合っているかを見ます。",
            "question": "スマホで見やすい配置として自然なのは？",
            "correct": "横並びカードを1列にする",
            "correctFeedback": "その通りです。目的に合った変更を選べています。",
            "wrongs": [
              "titleタグだけを変えて終わる",
              "DBを全削除する",
              "画像を消して何も表示しない"
            ]
          },
          {
            "kind": "order",
            "id": "challenge-responsive-layout-a03-order",
            "title": "主要コードを並べよう",
            "instruction": "主要なHTML断片を自然な順番に並べましょう。",
            "mentorMessage": "部品の外側から中身へ考えます。",
            "steps": [
              "<header>",
              "<nav><a href=\"/\">Home</a><a href=\"/reserve\">Reserve</a></nav>",
              "</header>",
              "<main>",
              "<section class=\"card\">内容</section>",
              "</main>"
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "challenge-responsive-layout-c01-check",
        "title": "Challenge Check",
        "instruction": "このChallengeの中心を確認しましょう。",
        "mentorMessage": "目的に合う変更を選びます。",
        "question": "スマホで見やすい配置として自然なのは？",
        "correct": "横並びカードを1列にする",
        "correctFeedback": "OKです。Challengeのポイントを確認できています。",
        "wrongs": [
          "関係ない設定だけ変える",
          "画面の主要部分を消す",
          "サーバ起動だけ確認する"
        ]
      }
    ]
  },
  {
    "id": "challenge-reservation-top",
    "title": "予約サイトのトップページを整える",
    "description": "予約ボタンやカードを使って、予約サイトらしいトップページにします。",
    "order": 12,
    "parentMissionId": "service-top-page",
    "goalImg": "/images/missions/challenge-reservation-top.png",
    "learnedItems": [
      "予約ボタン",
      "予約カード",
      "トップページHTML/CSS"
    ],
    "visualKey": "servicePageParts",
    "question": "予約サイトの中心導線として自然なのは？",
    "correct": "予約するボタンを目立つ場所に置く",
    "estimatedMinutes": 8,
    "rewardExp": 80,
    "type": "CHALLENGE",
    "isRequiredForCourseCompletion": false,
    "sections": [
      {
        "id": "challenge-reservation-top-section",
        "title": "予約サイトのトップページを整える",
        "description": "予約ボタンやカードを使って、予約サイトらしいトップページにします。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "challenge-reservation-top-a01-intro",
            "title": "予約サイトのトップページを整える",
            "mentorMessage": "挑戦ミッションです。基本を少し広げて使ってみましょう。",
            "body": [
              "予約ボタンやカードを使って、予約サイトらしいトップページにします。",
              "ここでは、これまで学んだHTML/CSSを使って、より実際のページに近い形へ広げます。"
            ],
            "summary": [
              "予約ボタン",
              "予約カード"
            ],
            "visualKey": "servicePageParts"
          },
          {
            "kind": "choice",
            "id": "challenge-reservation-top-a02-choice",
            "title": "自然な実装方針を選ぼう",
            "instruction": "目的に合う実装方針を選びましょう。",
            "mentorMessage": "見た目だけでなく、ページの役割に合っているかを見ます。",
            "question": "予約サイトの中心導線として自然なのは？",
            "correct": "予約するボタンを目立つ場所に置く",
            "correctFeedback": "その通りです。目的に合った変更を選べています。",
            "wrongs": [
              "titleタグだけを変えて終わる",
              "DBを全削除する",
              "画像を消して何も表示しない"
            ]
          },
          {
            "kind": "order",
            "id": "challenge-reservation-top-a03-order",
            "title": "主要コードを並べよう",
            "instruction": "主要なHTML断片を自然な順番に並べましょう。",
            "mentorMessage": "部品の外側から中身へ考えます。",
            "steps": [
              "<header>",
              "<nav><a href=\"/\">Home</a><a href=\"/reserve\">Reserve</a></nav>",
              "</header>",
              "<main>",
              "<section class=\"card\">内容</section>",
              "</main>"
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "challenge-reservation-top-c01-check",
        "title": "Challenge Check",
        "instruction": "このChallengeの中心を確認しましょう。",
        "mentorMessage": "目的に合う変更を選びます。",
        "question": "予約サイトの中心導線として自然なのは？",
        "correct": "予約するボタンを目立つ場所に置く",
        "correctFeedback": "OKです。Challengeのポイントを確認できています。",
        "wrongs": [
          "関係ない設定だけ変える",
          "画面の主要部分を消す",
          "サーバ起動だけ確認する"
        ]
      }
    ]
  },
  {
    "id": "challenge-theme-customize",
    "title": "自分のテーマに置き換える",
    "description": "文言、カード内容、色などを自分のテーマに合わせて変更します。",
    "order": 13,
    "parentMissionId": "service-top-page",
    "goalImg": "/images/missions/challenge-theme-customize.png",
    "learnedItems": [
      "テーマに合わせた文言変更",
      "カード内容の置き換え",
      "色と画像領域の調整"
    ],
    "visualKey": "servicePageParts",
    "question": "テーマ変更として自然なのは？",
    "correct": "見出し、カード文言、色をテーマに合わせて変える",
    "estimatedMinutes": 8,
    "rewardExp": 80,
    "type": "CHALLENGE",
    "isRequiredForCourseCompletion": false,
    "sections": [
      {
        "id": "challenge-theme-customize-section",
        "title": "自分のテーマに置き換える",
        "description": "文言、カード内容、色などを自分のテーマに合わせて変更します。",
        "activities": [
          {
            "kind": "tutorial",
            "id": "challenge-theme-customize-a01-intro",
            "title": "自分のテーマに置き換える",
            "mentorMessage": "挑戦ミッションです。基本を少し広げて使ってみましょう。",
            "body": [
              "文言、カード内容、色などを自分のテーマに合わせて変更します。",
              "ここでは、これまで学んだHTML/CSSを使って、より実際のページに近い形へ広げます。"
            ],
            "summary": [
              "テーマに合わせた文言変更",
              "カード内容の置き換え"
            ],
            "visualKey": "servicePageParts"
          },
          {
            "kind": "choice",
            "id": "challenge-theme-customize-a02-choice",
            "title": "自然な実装方針を選ぼう",
            "instruction": "目的に合う実装方針を選びましょう。",
            "mentorMessage": "見た目だけでなく、ページの役割に合っているかを見ます。",
            "question": "テーマ変更として自然なのは？",
            "correct": "見出し、カード文言、色をテーマに合わせて変える",
            "correctFeedback": "その通りです。目的に合った変更を選べています。",
            "wrongs": [
              "titleタグだけを変えて終わる",
              "DBを全削除する",
              "画像を消して何も表示しない"
            ]
          },
          {
            "kind": "order",
            "id": "challenge-theme-customize-a03-order",
            "title": "主要コードを並べよう",
            "instruction": "主要なHTML断片を自然な順番に並べましょう。",
            "mentorMessage": "部品の外側から中身へ考えます。",
            "steps": [
              "<header>",
              "<nav><a href=\"/\">Home</a><a href=\"/reserve\">Reserve</a></nav>",
              "</header>",
              "<main>",
              "<section class=\"card\">内容</section>",
              "</main>"
            ]
          }
        ]
      }
    ],
    "check": [
      {
        "kind": "choice",
        "id": "challenge-theme-customize-c01-check",
        "title": "Challenge Check",
        "instruction": "このChallengeの中心を確認しましょう。",
        "mentorMessage": "目的に合う変更を選びます。",
        "question": "テーマ変更として自然なのは？",
        "correct": "見出し、カード文言、色をテーマに合わせて変える",
        "correctFeedback": "OKです。Challengeのポイントを確認できています。",
        "wrongs": [
          "関係ない設定だけ変える",
          "画面の主要部分を消す",
          "サーバ起動だけ確認する"
        ]
      }
    ]
  }
] as const;

const htmlTextStructureMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[0]);
const htmlLinksImagesMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[1]);
const htmlListTableMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[2]);
const htmlDivClassMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[3]);
const cssLinkingMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[4]);
const cssBasicStyleMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[5]);
const cssLayoutFlexMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[6]);
const serviceTopPageMission: MissionSeed = buildCourse3Mission(course3MissionSpecs[7]);
const navigationChallenge: MissionSeed = buildCourse3Mission(course3MissionSpecs[8]);
const responsiveLayoutChallenge: MissionSeed = buildCourse3Mission(course3MissionSpecs[9]);
const reservationTopChallenge: MissionSeed = buildCourse3Mission(course3MissionSpecs[10]);

const course3HtmlCss: CourseSeed = {
  id: "html-css",
  title: "HTML/CSSで画面を作る",
  description: "HTMLで情報の構造を作り、CSSで見た目を整え、簡単なサービス風トップページを組めるようにします。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.UI],
  missions: [
    htmlSkeletonMission,
    htmlTextStructureMission,
    htmlLinksImagesMission,
    htmlListTableMission,
    htmlDivClassMission,
    cssLinkingMission,
    cssBasicStyleMission,
    cssLayoutFlexMission,
    serviceTopPageMission,
    navigationChallenge,
    responsiveLayoutChallenge,
    reservationTopChallenge,
  ],
};
// 既存の courses 配列に htmlCssCourse を追加する想定:
// const courses: CourseSeed[] = [webAppOverviewCourse, flaskPageCourse, htmlCssCourse, ...];

// ==============================
// Course 4 seed append: PythonでWebの入力を扱う
// 既存の learningSeed.ts の helper / type 定義の後ろに追記する想定
// 前提: tutorial / choice / match / orderedSteps / defineMissionVisual / CourseDifficulty / MissionType / CourseCategoryType が既存スコープにある
// Prisma enumは GAME / ALGORITHM / TOOL / UI / DATA のみを使用
// ==============================

const course4Visuals = {
  pythonRole: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "WebアプリでのPythonの役割",
      caption: "Pythonは画面を直接飾るより、画面の裏側で入力を受け取り、判定し、結果を返す処理を担当します。",
      panels: [
        { id: "screen", title: "HTML/CSS", subtitle: "画面側", tone: "blue", items: ["見出しや入力欄を表示", "色や余白を整える", "ユーザーが操作する入口"] },
        { id: "python", title: "Python", subtitle: "処理側", tone: "green", items: ["入力を受け取る", "条件で結果を変える", "結果をテンプレートへ渡す"] },
      ],
    },
  }),
  ifBranch: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "FLOW_DIAGRAM",
      title: "条件で結果を分ける流れ",
      caption: "入力値を見て、条件に合う場合と合わない場合で表示する内容を変えます。",
      nodes: [
        { id: "input", label: "入力値", description: "例: age = 20", icon: "user", tone: "blue" },
        { id: "condition", label: "if条件", description: "age >= 18 ?", icon: "code", tone: "orange" },
        { id: "result", label: "結果表示", description: "OK / NG を返す", icon: "browser", tone: "green" },
      ],
      edges: [
        { id: "input-condition", from: "input", to: "condition", label: "判定する" },
        { id: "condition-result", from: "condition", to: "result", label: "結果を決める" },
      ],
    },
  }),
  listDict: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "list と dict の使い分け",
      caption: "複数件を並べたいときは list、1件のデータを項目名つきで持ちたいときは dict が向いています。",
      panels: [
        { id: "list", title: "list", subtitle: "複数を並べる", tone: "blue", items: ["予約の一覧", "名前の一覧", "順番で取り出す"] },
        { id: "dict", title: "dict", subtitle: "1件を項目で表す", tone: "green", items: ["name: 田中", "date: 6/20", "key と value"] },
      ],
    },
  }),
  formParts: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "フォームの基本部品",
      panels: [
        { id: "form", title: "form", subtitle: "入力を送るまとまり", tone: "blue", items: ["action", "method", "送信範囲を囲む"] },
        { id: "input", title: "input", subtitle: "入力欄", tone: "green", items: ["name属性", "ユーザーが入力", "サーバへ送る値"] },
        { id: "button", title: "button", subtitle: "送信ボタン", tone: "orange", items: ["クリックで送信", "処理のきっかけ"] },
      ],
    },
  }),
  postFlow: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "フォーム入力がサーバへ届く流れ",
      caption: "フォームに入力した値は、送信ボタンを押すことでブラウザからFlask側へ送られます。",
      nodes: [
        { id: "form", label: "入力フォーム", description: "name属性つきの入力欄", icon: "browser", tone: "blue" },
        { id: "request", label: "POST送信", description: "入力値をサーバへ送る", icon: "cloud", tone: "orange" },
        { id: "flask", label: "Flask処理", description: "request.formで受け取る", icon: "server", tone: "green" },
      ],
      edges: [
        { id: "form-request", from: "form", to: "request", label: "送信" },
        { id: "request-flask", from: "request", to: "flask", label: "受け取り" },
      ],
    },
  }),
  requestForm: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "name属性と request.form の対応",
      caption: "HTML側の name と、Python側で読む名前を一致させます。",
      panels: [
        { id: "html", title: "HTML", subtitle: "送る名前", tone: "blue", items: ['<input name="user_name">', 'name="age"', "入力欄につける名前"] },
        { id: "python", title: "Python", subtitle: "受け取る名前", tone: "green", items: ['request.form["user_name"]', 'request.form["age"]', "同じ名前で読む"] },
      ],
    },
  }),
  templateResult: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "入力値を結果画面に返す流れ",
      caption: "受け取った値をテンプレートへ渡し、HTML側の {{ name }} で表示します。",
      nodes: [
        { id: "receive", label: "受け取る", description: 'name = request.form["name"]', icon: "server", tone: "blue" },
        { id: "template", label: "渡す", description: "render_template(..., name=name)", icon: "code", tone: "orange" },
        { id: "show", label: "表示する", description: "{{ name }}", icon: "browser", tone: "green" },
      ],
      edges: [
        { id: "receive-template", from: "receive", to: "template", label: "値を渡す" },
        { id: "template-show", from: "template", to: "show", label: "HTMLに表示" },
      ],
    },
  }),
  diagnosisParts: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "小さな診断アプリの3部品",
      caption: "入力、判定、結果表示を組み合わせると、最小の診断アプリになります。",
      nodes: [
        { id: "input", label: "入力", description: "ユーザーが選ぶ・書く", icon: "user", tone: "blue" },
        { id: "judge", label: "判定", description: "ifで結果を決める", icon: "code", tone: "orange" },
        { id: "result", label: "結果表示", description: "メッセージを返す", icon: "browser", tone: "green" },
      ],
      edges: [
        { id: "input-judge", from: "input", to: "judge", label: "条件を見る" },
        { id: "judge-result", from: "judge", to: "result", label: "表示する" },
      ],
    },
  }),
} as const;

type Course4ChoiceSpec = {
  kind: "choice";
  id: string;
  title: string;
  instruction: string;
  mentorMessage: string;
  question: string;
  correct: string;
  wrongs: string[];
  correctFeedback?: string;
  isMissionCheck?: boolean;
};

type Course4MatchSpec = {
  kind: "match";
  id: string;
  title: string;
  instruction: string;
  mentorMessage: string;
  items: string[];
  targets: string[];
  answerMap: Record<string, string[]>;
  isMissionCheck?: boolean;
};

type Course4OrderSpec = {
  kind: "order";
  id: string;
  title: string;
  instruction: string;
  mentorMessage: string;
  steps: string[];
  isMissionCheck?: boolean;
};

type Course4TutorialSpec = {
  kind: "tutorial";
  id: string;
  title: string;
  mentorMessage: string;
  body: string[];
  summary: string[];
  visual?: MissionVisualContent;
};

type Course4ActivitySpec = Course4TutorialSpec | Course4ChoiceSpec | Course4MatchSpec | Course4OrderSpec;

type Course4SectionSpec = {
  id: string;
  title: string;
  description: string;
  activities: Course4ActivitySpec[];
};

type Course4MissionSpec = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  goalImg: string;
  estimatedMinutes: number;
  order: number;
  type: MissionType;
  isRequiredForCourseCompletion: boolean;
  parentMissionId: string | null;
  roadmapLane: number;
  branchOrder: number;
  rewardExp: number;
  learnedItems: string[];
  sections: Course4SectionSpec[];
  check: Course4ActivitySpec[];
};

const toKey = (value: string): string =>
  value
    .replace(/[\s`"'{}<>/()\[\]:=.,]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48);

const buildCourse4Activity = (
  spec: Course4ActivitySpec,
  order: number,
  sectionOrder: number,
  isMissionCheckSection = false,
): ActivitySeed => {
  if (spec.kind === "tutorial") {
    return tutorial({
      id: spec.id,
      order,
      sectionOrder,
      title: spec.title,
      mentorMessage: spec.mentorMessage,
      body: spec.body.join("\n\n"),
      summary: spec.summary,
      visual: spec.visual,
    });
  }

  if (spec.kind === "choice") {
    return choice({
      id: spec.id,
      order,
      sectionOrder,
      title: spec.title,
      instruction: spec.instruction,
      mentorMessage: spec.mentorMessage,
      question: spec.question,
      choices: [
        {
          id: `${spec.id}-correct`,
          label: spec.correct,
          isCorrect: true,
          feedback: spec.correctFeedback ?? "OKです。ポイントを確認できています。",
        },
        ...spec.wrongs.map((wrong, index) => ({
          id: `${spec.id}-wrong-${index + 1}`,
          label: wrong,
          isCorrect: false,
          feedback: "惜しいです。画面側の部品、サーバ側の処理、入力値の流れをもう一度分けて考えてみましょう。",
        })),
      ],
      isMissionCheck: spec.isMissionCheck ?? isMissionCheckSection,
    });
  }

  if (spec.kind === "match") {
    const targets = spec.targets.map((target) => ({ id: toKey(target), label: target }));
    const items = spec.items.map((item) => ({ id: toKey(item), label: item }));
    return match({
      id: spec.id,
      order,
      sectionOrder,
      title: spec.title,
      instruction: spec.instruction,
      mentorMessage: spec.mentorMessage,
      items,
      targets,
      answers: targets.map((target) => ({
        targetId: target.id,
        itemIds: (spec.answerMap[target.label] ?? []).map(toKey),
      })),
      correctFeedback: "よく整理できています。役割や流れを対応づけられています。",
      incorrectFeedback: "もう一度、どの値がどこからどこへ渡されるのかを確認してみましょう。",
      isMissionCheck: spec.isMissionCheck ?? isMissionCheckSection,
    });
  }

  return orderedSteps({
    id: spec.id,
    order,
    sectionOrder,
    title: spec.title,
    instruction: spec.instruction,
    mentorMessage: spec.mentorMessage,
    steps: spec.steps.map((step) => ({ id: toKey(step), label: step })),
    answerOrder: spec.steps.map(toKey),
    correctFeedback: "いい順番です。入力から処理、表示までの流れを追えています。",
    incorrectFeedback: "まずユーザー操作から始め、ブラウザ、Flask処理、結果表示の順で考えてみましょう。",
    isMissionCheck: spec.isMissionCheck ?? isMissionCheckSection,
  });
};

const buildCourse4Mission = (spec: Course4MissionSpec): MissionSeed => {
  let activityOrder = 1;

  const sections = spec.sections.map((section, sectionIndex) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    order: sectionIndex + 1,
    activities: section.activities.map((activity, activityIndex) =>
      buildCourse4Activity(activity, activityOrder++, activityIndex + 1),
    ),
  }));

  sections.push({
    id: `${spec.id}-check-section`,
    title: "Mission Check",
    description: "このMissionで学んだことを確認します。",
    order: sections.length + 1,
    activities: spec.check.map((activity, activityIndex) =>
      buildCourse4Activity(activity, activityOrder++, activityIndex + 1, true),
    ),
  });

  return {
    id: spec.id,
    title: spec.title,
    description: spec.description,
    difficulty: spec.difficulty,
    goalImg: spec.goalImg,
    estimatedMinutes: spec.estimatedMinutes,
    order: spec.order,
    type: spec.type,
    isRequiredForCourseCompletion: spec.isRequiredForCourseCompletion,
    parentMissionId: spec.parentMissionId,
    roadmapLane: spec.roadmapLane,
    branchOrder: spec.branchOrder,
    rewardExp: spec.rewardExp,
    learnedItems: spec.learnedItems,
    isPublished: true,
    sections,
  };
};

const course4MissionSpecs: Course4MissionSpec[] = [
  {
    id: "python-web-role",
    title: "Webで使うPythonの範囲を知る",
    description: "WebアプリではPythonを画面の裏側で処理するために使うことを理解します。",
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/python-web-role.png",
    estimatedMinutes: 10,
    order: 1,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 100,
    learnedItems: ["Pythonは画面の裏側で処理を担当する", "変数は値に名前をつける", "文字列と数値は扱いが違う", "Web入力はPython側で受け取って処理できる"],
    sections: [
      {
        id: "python-web-role-variable-section",
        title: "変数と文字列を見る",
        description: "Pythonで値に名前をつける基本を確認します。",
        activities: [
          { kind: "tutorial", id: "python-web-role-a01-variable-intro", title: "変数は値に名前をつけるもの", mentorMessage: "Webアプリでも、入力された名前や人数を一度変数に入れて扱うことがあります。", body: ["Pythonでは、message = \"こんにちは\" のように、値に名前をつけて持っておけます。", "この message のような名前を変数と呼びます。", "画面に出したい文章や、フォームから受け取った値を一時的に入れておくときに使います。"], summary: ["変数は値に名前をつける", "文字列は引用符で囲む", "Web入力も変数に入れて扱える"], visual: course4Visuals.pythonRole },
          { kind: "match", id: "python-web-role-a02-variable-match", title: "変数名と表示内容を対応づけよう", instruction: "Pythonの変数と中に入っている値を対応づけましょう。", mentorMessage: "= の右側が実際に入っている値です。", items: ["message", "user_name", "count"], targets: ["こんにちは", "田中", "3"], answerMap: { "こんにちは": ["message"], "田中": ["user_name"], "3": ["count"] } },
          { kind: "choice", id: "python-web-role-a03-string-number-choice", title: "文字列と数値の違い", instruction: "文字列として扱うものを選びましょう。", mentorMessage: "文字として表示したい値は引用符で囲むことが多いです。", question: "次のうち、Pythonで文字列として書くのが自然なものはどれ？", correct: 'name = "田中"', wrongs: ["age = 20", "people = 3", "price = 500"], correctFeedback: "その通りです。名前のような文字データは引用符で囲んで文字列として扱います。" },
        ],
      },
      {
        id: "python-web-role-web-section",
        title: "WebアプリでのPythonの役割",
        description: "Pythonがどの部分を担当するのかを画面側と分けます。",
        activities: [
          { kind: "tutorial", id: "python-web-role-a04-web-python-intro", title: "Pythonは画面を直接飾るものではない", mentorMessage: "PythonはHTMLやCSSの代わりに画面の色を変えるというより、裏側で入力を受け取ったり判定したりする役割です。", body: ["HTMLは画面の構造、CSSは見た目を担当します。", "Pythonは、送られてきた入力を受け取る、条件に合わせて結果を決める、保存するデータを作る、といった処理に向いています。", "Webアプリでは、画面側と処理側を分けて考えると整理しやすくなります。"], summary: ["HTML/CSSは画面側", "Pythonは処理側", "入力を受け取る・判定する・保存する"], visual: course4Visuals.pythonRole },
          { kind: "match", id: "python-web-role-a05-work-match", title: "画面側と処理側を分類しよう", instruction: "次の作業を、画面側・Python処理側に分けましょう。", mentorMessage: "見た目を作るのか、入力を処理するのかで分けます。", items: ["ボタンの色を変える", "入力された名前を受け取る", "年齢が18以上か判定する", "見出しを表示する"], targets: ["画面側", "Python処理側"], answerMap: { "画面側": ["ボタンの色を変える", "見出しを表示する"], "Python処理側": ["入力された名前を受け取る", "年齢が18以上か判定する"] } },
          { kind: "choice", id: "python-web-role-a06-python-work-choice", title: "Pythonが担当しそうな処理は？", instruction: "Pythonが担当しそうな処理を選びましょう。", mentorMessage: "処理や判定に注目しましょう。", question: "WebアプリでPythonが担当しそうなものはどれ？", correct: "フォームで送られた人数を受け取り、空欄かどうか判定する", wrongs: ["見出しの文字色を青くする", "ページの余白を広げる", "画像の表示サイズをCSSで整える"], correctFeedback: "その通りです。入力を受け取って判定する処理はPython側で扱うことが多いです。" },
        ],
      },
    ],
    check: [
      { kind: "match", id: "python-web-role-c01-variable-check", title: "変数と表示内容を確認しよう", instruction: "変数と値を対応づけましょう。", mentorMessage: "= の右側を見ます。", items: ["message", "age"], targets: ["ようこそ", "18"], answerMap: { "ようこそ": ["message"], "18": ["age"] } },
      { kind: "choice", id: "python-web-role-c02-python-role-check", title: "Pythonが担当する処理を選ぼう", instruction: "WebアプリでPythonが担当する処理を選びましょう。", mentorMessage: "画面を飾る処理と裏側の処理を分けます。", question: "Python側に近い処理はどれ？", correct: "入力された値を受け取り、条件でメッセージを変える", wrongs: ["CSSで背景色を変える", "HTMLで見出しを書く", "画像の横幅を指定する"] },
    ],
  },
  {
    id: "python-if-branch",
    title: "ifで処理を分ける",
    description: "入力値や条件によって表示するメッセージや処理を変える考え方を学びます。",
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/python-if-branch.png",
    estimatedMinutes: 10,
    order: 2,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 100,
    learnedItems: ["ifは条件に応じて処理を分ける", "条件に合うときだけ実行される行がある", "Web入力に応じて結果表示を変えられる"],
    sections: [
      {
        id: "python-if-basic-section",
        title: "条件でメッセージを変える",
        description: "ifの基本形を見て、条件と結果の関係を確認します。",
        activities: [
          { kind: "tutorial", id: "python-if-a01-basic-intro", title: "ifは条件に合うときだけ動く", mentorMessage: "ifを使うと、入力値に応じて表示するメッセージを変えられます。", body: ["たとえば age >= 18 なら OK、それ以外なら NG のように分けられます。", "Webアプリでは、人数が0ならエラー、名前が空欄なら入力してください、といった判定にも使えます。", "まずは、条件に合うときだけ実行されるという感覚をつかみましょう。"], summary: ["ifは条件で処理を分ける", "条件に合うときだけ実行される", "入力値に応じた表示に使える"], visual: course4Visuals.ifBranch },
          { kind: "choice", id: "python-if-a02-line-choice", title: "条件に合うときだけ実行される行は？", instruction: "age >= 18 のときに表示される内容を選びましょう。", mentorMessage: "条件式のすぐ下にある処理に注目します。", question: "age = 20 のとき、if age >= 18: の下で表示されるのはどれ？", correct: "OK", wrongs: ["NG", "CSS", "index.html"], correctFeedback: "その通りです。20は18以上なのでOK側の処理が実行されます。" },
          { kind: "match", id: "python-if-a03-condition-match", title: "条件と結果を対応づけよう", instruction: "条件と表示するメッセージを対応づけましょう。", mentorMessage: "条件を満たすかどうかで結果が変わります。", items: ["age = 20", "age = 15", "name = \"\""], targets: ["18歳以上なのでOK", "18歳未満なのでNG", "名前が空欄なので入力が必要"], answerMap: { "18歳以上なのでOK": ["age = 20"], "18歳未満なのでNG": ["age = 15"], "名前が空欄なので入力が必要": ["name = \"\""] } },
        ],
      },
      {
        id: "python-if-web-section",
        title: "Web入力と条件分岐",
        description: "入力値に応じて結果画面を変える場面を考えます。",
        activities: [
          { kind: "tutorial", id: "python-if-a04-web-input-intro", title: "入力値によって結果文を変える", mentorMessage: "Webフォームで受け取った値も、Python側で条件分岐に使えます。", body: ["たとえば人数が1人なら「1名で予約しました」、2人以上なら「複数名で予約しました」と表示を変えられます。", "空欄の場合には「入力してください」と返すこともできます。", "診断アプリや予約フォームでは、この条件分岐が中心になります。"], summary: ["入力値を条件に使える", "空欄チェックにも使える", "結果画面の文言を変えられる"], visual: course4Visuals.ifBranch },
          { kind: "choice", id: "python-if-a05-empty-choice", title: "空欄チェックの条件は？", instruction: "名前が空欄かどうかを確認する条件として近いものを選びましょう。", mentorMessage: "空文字は \"\" で表せます。", question: "name が空欄か確認する条件として近いものはどれ？", correct: 'name == ""', wrongs: ["name = 10", "color: blue", "<h1>name</h1>"], correctFeedback: "その通りです。空欄かどうかを見るときは空文字と比較できます。" },
          { kind: "order", id: "python-if-a06-branch-order", title: "条件分岐の流れを並べよう", instruction: "入力値に応じて結果を返す流れを並べましょう。", mentorMessage: "受け取り、判定、結果決定、表示の順です。", steps: ["フォームから値を受け取る", "値が条件に合うか確認する", "表示するメッセージを決める", "結果画面にメッセージを表示する"] },
        ],
      },
    ],
    check: [
      { kind: "match", id: "python-if-c01-condition-check", title: "ifの条件と結果を確認しよう", instruction: "条件と結果を対応づけましょう。", mentorMessage: "条件を満たすかを見ます。", items: ["age = 20", "age = 15"], targets: ["OK", "NG"], answerMap: { "OK": ["age = 20"], "NG": ["age = 15"] } },
      { kind: "choice", id: "python-if-c02-code-check", title: "入力値に応じて表示を変える", instruction: "空欄のときの処理として自然なものを選びましょう。", mentorMessage: "空欄ならユーザーに入力を促します。", question: "name が空欄のときに表示するメッセージとして自然なのは？", correct: "名前を入力してください", wrongs: ["予約できました", "CSSを読み込みました", "DBを削除しました"] },
    ],
  },
  {
    id: "python-list-dict-data",
    title: "list と dict でデータを扱う",
    description: "複数のデータや1件分のデータをPythonで表す方法を理解します。",
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/python-list-dict-data.png",
    estimatedMinutes: 10,
    order: 3,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 100,
    learnedItems: ["listは複数データを並べる", "dictは1件分のデータを項目名つきで表す", "keyとvalueを対応づけて読む", "予約データをPythonで表せる"],
    sections: [
      {
        id: "python-list-section",
        title: "listで複数データを持つ",
        description: "複数の名前や予約を並べる考え方を学びます。",
        activities: [
          { kind: "tutorial", id: "python-list-dict-a01-list-intro", title: "listは複数の値を並べる", mentorMessage: "予約一覧や名前一覧のように、複数のデータを順番に持ちたいときにlistが使えます。", body: ["names = [\"田中\", \"佐藤\", \"鈴木\"] のように書くと、複数の名前を1つの変数で扱えます。", "Webアプリでは、DBから取り出した複数件の予約を一覧として扱う場面につながります。"], summary: ["listは複数の値を並べる", "一覧表示につながる", "順番で取り出せる"], visual: course4Visuals.listDict },
          { kind: "choice", id: "python-list-dict-a02-list-choice", title: "listに向くデータは？", instruction: "listで持つのに向いているものを選びましょう。", mentorMessage: "複数件を並べたい場面に注目です。", question: "listで持つのに向いているデータはどれ？", correct: "予約者名の一覧", wrongs: ["1件の予約の名前だけ", "CSSの背景色", "HTMLのtitleタグだけ"], correctFeedback: "その通りです。複数の名前を並べたいときはlistが向いています。" },
          { kind: "match", id: "python-list-dict-a03-index-match", title: "何番目のデータかを読もう", instruction: "list内の位置と値を対応づけましょう。", mentorMessage: "ここでは左から順に見る練習として扱います。", items: ["1番目", "2番目", "3番目"], targets: ["田中", "佐藤", "鈴木"], answerMap: { "田中": ["1番目"], "佐藤": ["2番目"], "鈴木": ["3番目"] } },
        ],
      },
      {
        id: "python-dict-section",
        title: "dictで1件分のデータを持つ",
        description: "予約1件を項目名つきで表す方法を確認します。",
        activities: [
          { kind: "tutorial", id: "python-list-dict-a04-dict-intro", title: "dictは項目名つきの1件データ", mentorMessage: "予約1件の中には、名前、日付、人数など複数の項目があります。", body: ["reservation = {\"name\": \"田中\", \"date\": \"6/20\", \"people\": 3} のように書くと、1件の予約データをまとめて表せます。", "name や date のような項目名を key、田中 や 6/20 のような中身を value と呼びます。"], summary: ["dictは1件分のデータを表す", "keyは項目名", "valueは中身"], visual: course4Visuals.listDict },
          { kind: "match", id: "python-list-dict-a05-key-value-match", title: "key と value を対応づけよう", instruction: "予約データのkeyとvalueを対応づけましょう。", mentorMessage: "項目名と中身を分けます。", items: ["name", "date", "people"], targets: ["田中", "6/20", "3"], answerMap: { "田中": ["name"], "6/20": ["date"], "3": ["people"] } },
          { kind: "choice", id: "python-list-dict-a06-reservation-dict-choice", title: "予約データとして自然なdictは？", instruction: "予約1件を表すdictとして自然なものを選びましょう。", mentorMessage: "名前、日付、人数が項目名つきでまとまっているものを探します。", question: "予約1件のデータとして自然なのはどれ？", correct: '{"name": "田中", "date": "6/20", "people": 3}', wrongs: ['["田中", "佐藤", "鈴木"]', 'color: blue;', '<h1>予約</h1>'], correctFeedback: "その通りです。予約1件を項目名つきで表せています。" },
        ],
      },
    ],
    check: [
      { kind: "match", id: "python-list-dict-c01-type-check", title: "list と dict に向くデータを分けよう", instruction: "データをlist向き・dict向きに分けましょう。", mentorMessage: "複数件か、1件の項目つきデータかで分けます。", items: ["予約者名の一覧", "予約1件のname/date/people", "投稿一覧", "1人のプロフィール"], targets: ["list向き", "dict向き"], answerMap: { "list向き": ["予約者名の一覧", "投稿一覧"], "dict向き": ["予約1件のname/date/people", "1人のプロフィール"] } },
      { kind: "choice", id: "python-list-dict-c02-dict-check", title: "予約データのdictを確認しよう", instruction: "予約1件のdictとして自然なものを選びましょう。", mentorMessage: "項目名と中身が対応しているか見ます。", question: "予約1件を表すものは？", correct: '{"name": "佐藤", "date": "7/1", "people": 2}', wrongs: ['["佐藤", "田中"]', "background-color: white;", "<button>送信</button>"] },
    ],
  },
  {
    id: "html-form-basic",
    title: "form の基本を知る",
    description: "HTMLのフォームがユーザー入力をサーバへ送る入口になることを理解します。",
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/html-form-basic.png",
    estimatedMinutes: 11,
    order: 4,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 110,
    learnedItems: ["formは入力を送るまとまり", "inputは入力欄", "buttonは送信のきっかけ", "name属性はサーバへ送る名前になる"],
    sections: [
      {
        id: "html-form-parts-section",
        title: "formの部品を見る",
        description: "form、input、buttonの役割を分けます。",
        activities: [
          { kind: "tutorial", id: "html-form-a01-parts-intro", title: "formは入力を送るまとまり", mentorMessage: "フォームは、ユーザーが入力した内容をサーバへ送るための入口です。", body: ["<form> は、入力欄や送信ボタンをまとめる範囲です。", "<input> はユーザーが値を入力する部品です。", "<button> は送信のきっかけになる部品です。"], summary: ["formは送信する範囲", "inputは入力欄", "buttonは送信ボタン"], visual: course4Visuals.formParts },
          { kind: "match", id: "html-form-a02-parts-match", title: "フォーム部品を役割に対応づけよう", instruction: "form、input、buttonを役割に対応づけましょう。", mentorMessage: "それぞれの部品の役割を確認します。", items: ["form", "input", "button"], targets: ["入力を送る範囲", "ユーザーが値を入れる欄", "送信のきっかけ"], answerMap: { "入力を送る範囲": ["form"], "ユーザーが値を入れる欄": ["input"], "送信のきっかけ": ["button"] } },
          { kind: "choice", id: "html-form-a03-input-choice", title: "入力欄に近いタグは？", instruction: "入力欄を作るタグを選びましょう。", mentorMessage: "ユーザーが文字を入れる場所を探します。", question: "名前入力欄を作るときに使うタグとして近いものはどれ？", correct: '<input name="name">', wrongs: ["<h1>名前</h1>", "<p>名前</p>", "background-color: blue;"], correctFeedback: "その通りです。inputは入力欄を作るタグです。" },
        ],
      },
      {
        id: "html-form-name-section",
        title: "name属性を知る",
        description: "HTML側のnameがサーバ側の受け取り名になることを確認します。",
        activities: [
          { kind: "tutorial", id: "html-form-a04-name-intro", title: "name属性はサーバへ送る名前", mentorMessage: "入力欄にname属性をつけると、サーバ側でその名前を使って値を受け取れます。", body: ['<input name="user_name"> のように書くと、入力された値は user_name という名前で送られます。', 'Python側では request.form["user_name"] のように同じ名前で読み取ります。', "表示ラベルの文字と、サーバへ送るnameは別物として考えると分かりやすいです。"], summary: ["name属性はサーバへ送る名前", "表示ラベルとは別", "request.formと対応する"], visual: course4Visuals.requestForm },
          { kind: "match", id: "html-form-a05-name-match", title: "name属性と受け取り側を対応づけよう", instruction: "HTMLのnameとPython側の読み取りを対応づけましょう。", mentorMessage: "同じ名前を使って受け取ります。", items: ['name="user_name"', 'name="date"', 'name="people"'], targets: ['request.form["user_name"]', 'request.form["date"]', 'request.form["people"]'], answerMap: { 'request.form["user_name"]': ['name="user_name"'], 'request.form["date"]': ['name="date"'], 'request.form["people"]': ['name="people"'] } },
          { kind: "choice", id: "html-form-a06-label-name-choice", title: "表示ラベルとnameの違い", instruction: "サーバ側で読む名前として使うものを選びましょう。", mentorMessage: "画面に見える文字と、送信される名前を分けます。", question: '<label>お名前</label><input name="user_name"> のとき、Python側で読む名前は？', correct: "user_name", wrongs: ["お名前", "label", "input"], correctFeedback: "その通りです。サーバ側ではname属性の user_name を使って読みます。" },
        ],
      },
    ],
    check: [
      { kind: "choice", id: "html-form-c01-form-check", title: "入力フォームHTMLを確認しよう", instruction: "名前入力欄として自然なHTMLを選びましょう。", mentorMessage: "inputとname属性に注目します。", question: "名前をサーバへ送る入力欄として自然なのは？", correct: '<input name="name">', wrongs: ["<h1>name</h1>", "color: name;", "request.form[name]"] },
      { kind: "match", id: "html-form-c02-name-check", title: "name属性と受け取り側を確認しよう", instruction: "name属性とrequest.formを対応づけましょう。", mentorMessage: "同じ名前を使います。", items: ['name="email"', 'name="date"'], targets: ['request.form["email"]', 'request.form["date"]'], answerMap: { 'request.form["email"]': ['name="email"'], 'request.form["date"]': ['name="date"'] } },
    ],
  },
  {
    id: "form-post-submit",
    title: "POSTで入力を送る",
    description: "フォーム入力をサーバへ送信するときのmethodとactionの意味を理解します。",
    difficulty: CourseDifficulty.EASY,
    goalImg: "/images/missions/form-post-submit.png",
    estimatedMinutes: 10,
    order: 5,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 110,
    learnedItems: ["actionは送信先", "method=postは入力内容を送る通信", "フォーム送信はブラウザからサーバへのリクエスト", "GETとPOSTの違いを場面で判断できる"],
    sections: [
      {
        id: "form-post-action-section",
        title: "送信先とmethodを見る",
        description: "formのactionとmethodを確認します。",
        activities: [
          { kind: "tutorial", id: "form-post-a01-action-intro", title: "actionは送信先、methodは送り方", mentorMessage: "フォームには、どこへ送るか、どんな方法で送るかを書く場所があります。", body: ['<form action="/reserve" method="post"> の action は送信先URLです。', 'method="post" は、入力内容をサーバへ送る場面でよく使われます。', "予約フォームやコメント投稿のように、入力内容を送る場合はPOSTとして考えると分かりやすいです。"], summary: ["actionは送信先", "methodは送り方", "POSTは入力内容を送る場面に近い"], visual: course4Visuals.postFlow },
          { kind: "choice", id: "form-post-a02-action-choice", title: "送信先URLはどれ？", instruction: "formタグの中で送信先を表す部分を選びましょう。", mentorMessage: "actionの値に注目します。", question: '<form action="/reserve" method="post"> の送信先はどれ？', correct: "/reserve", wrongs: ["post", "form", "input"], correctFeedback: "その通りです。actionの値が送信先URLです。" },
          { kind: "choice", id: "form-post-a03-method-choice", title: "POSTが向く場面は？", instruction: "POSTが向いている場面を選びましょう。", mentorMessage: "入力した内容をサーバへ送る場面に注目です。", question: "POSTに近い場面はどれ？", correct: "予約フォームの入力内容を送信する", wrongs: ["トップページを見る", "CSSで色を変える", "HTMLの見出しを書く"], correctFeedback: "その通りです。入力内容を送るフォーム送信ではPOSTがよく使われます。" },
        ],
      },
      {
        id: "form-post-flow-section",
        title: "入力からサーバへ届く流れ",
        description: "フォーム入力がどの順番でFlaskへ届くか整理します。",
        activities: [
          { kind: "tutorial", id: "form-post-a04-flow-intro", title: "入力、送信、サーバ受け取りの順で考える", mentorMessage: "フォーム送信も、リクエストとレスポンスの流れで考えられます。", body: ["ユーザーがフォームに入力し、送信ボタンを押します。", "ブラウザは入力内容をPOSTリクエストとしてサーバへ送ります。", "Flask側では、送られてきた値をrequest.formで受け取ります。"], summary: ["入力する", "POSTで送る", "Flaskで受け取る"], visual: course4Visuals.postFlow },
          { kind: "choice", id: "form-post-a05-method-action-fill-choice", title: "method と action を選ぼう", instruction: "予約送信フォームとして自然な書き方を選びましょう。", mentorMessage: "送信先とPOSTを入れます。", question: "予約内容を /reserve にPOST送信するformとして自然なのは？", correct: '<form action="/reserve" method="post">', wrongs: ['<form action="post" method="/reserve">', '<h1 action="/reserve">', '<input method="post">'], correctFeedback: "その通りです。actionに送信先、methodにpostを書きます。" },
          { kind: "order", id: "form-post-a06-submit-order", title: "入力送信の流れを並べよう", instruction: "フォーム送信の流れを正しい順番に並べましょう。", mentorMessage: "ユーザー操作からFlaskでの受け取りまでを追います。", steps: ["ユーザーがフォームに入力する", "送信ボタンを押す", "ブラウザがPOSTリクエストを送る", "Flaskが入力内容を受け取る", "結果画面を返す"] },
        ],
      },
    ],
    check: [
      { kind: "choice", id: "form-post-c01-form-tag-check", title: "methodとactionを確認しよう", instruction: "正しいformタグを選びましょう。", mentorMessage: "actionとmethodの場所を確認します。", question: "/submit にPOSTするformは？", correct: '<form action="/submit" method="post">', wrongs: ['<form action="post" method="/submit">', '<button action="/submit">', '<input action="/submit">'] },
      { kind: "order", id: "form-post-c02-order-check", title: "入力送信の流れを確認しよう", instruction: "入力送信の流れを並べましょう。", mentorMessage: "フォームからサーバへ届く順番です。", steps: ["フォームに入力する", "送信ボタンを押す", "POSTリクエストが送られる", "Flaskがrequest.formで受け取る"] },
    ],
  },
  {
    id: "flask-request-form",
    title: "Flaskで入力を受け取る",
    description: "Flaskのrequest.formでフォーム入力を受け取る流れを理解します。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/flask-request-form.png",
    estimatedMinutes: 11,
    order: 6,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 120,
    learnedItems: ["request.formでPOSTされた値を読む", "HTMLのname属性とPython側の名前を一致させる", "受け取った値を変数に入れる", "空欄の可能性を考える"],
    sections: [
      {
        id: "flask-request-form-entry-section",
        title: "request.formの入口",
        description: "request.formがどの入力欄を読むのか確認します。",
        activities: [
          { kind: "tutorial", id: "flask-request-form-a01-intro", title: "request.formで送られた値を読む", mentorMessage: "フォームから送られた値は、Flask側で request.form を使って取り出します。", body: ['HTML側に <input name="name"> がある場合、Python側では request.form["name"] のように読みます。', "ここで大切なのは、HTML側のname属性とPython側で読む名前が一致していることです。"], summary: ["request.formでフォーム値を読む", "name属性と同じ名前を使う", "受け取った値は変数に入れられる"], visual: course4Visuals.requestForm },
          { kind: "choice", id: "flask-request-form-a02-read-choice", title: "request.form[\"name\"] は何を読む？", instruction: "request.formが読んでいる値を選びましょう。", mentorMessage: "HTML側のname属性に注目します。", question: '<input name="name"> に入力された値を読むコードはどれ？', correct: 'request.form["name"]', wrongs: ['request.form["date"]', '<input name="name">', 'render_template("index.html")'], correctFeedback: "その通りです。name属性がnameなら、request.form[\"name\"]で読みます。" },
          { kind: "match", id: "flask-request-form-a03-name-match", title: "name属性と受け取りを対応づけよう", instruction: "入力欄とrequest.formの読み取りを対応づけましょう。", mentorMessage: "同じ名前同士をつなぎます。", items: ['<input name="name">', '<input name="date">', '<input name="people">'], targets: ['request.form["name"]', 'request.form["date"]', 'request.form["people"]'], answerMap: { 'request.form["name"]': ['<input name="name">'], 'request.form["date"]': ['<input name="date">'], 'request.form["people"]': ['<input name="people">'] } },
        ],
      },
      {
        id: "flask-request-form-process-section",
        title: "受け取った値を処理する",
        description: "入力値を変数に入れ、必要なら空欄も考えます。",
        activities: [
          { kind: "tutorial", id: "flask-request-form-a04-variable-intro", title: "受け取った値は変数に入れて使う", mentorMessage: "request.formで取り出した値は、name = request.form[\"name\"] のように変数に入れて使えます。", body: ['name = request.form["name"] と書くと、フォームで送られた名前を name という変数で扱えます。', "その後、空欄かどうかを確認したり、結果画面へ渡したりできます。", "入力欄が空のまま送られることもあるため、必要に応じてチェックします。"], summary: ["受け取った値を変数に入れる", "空欄の可能性を考える", "結果表示や判定に使う"], visual: course4Visuals.requestForm },
          { kind: "choice", id: "flask-request-form-a05-variable-choice", title: "入力値を変数に入れるコードは？", instruction: "name入力を変数に入れるコードを選びましょう。", mentorMessage: "request.formで読んだ値を左側の変数に入れます。", question: "フォームのnameを変数nameに入れるコードとして自然なのは？", correct: 'name = request.form["name"]', wrongs: ['name: request.form["name"]', '<input name="name">', 'color = "blue"'], correctFeedback: "その通りです。request.formで読んだ値を変数nameに入れています。" },
          { kind: "choice", id: "flask-request-form-a06-empty-choice", title: "空欄の可能性を考える", instruction: "空欄のときの対応として自然なものを選びましょう。", mentorMessage: "入力が空のまま送られることもあります。", question: "名前が空欄だったときの対応として自然なのは？", correct: "名前を入力してください、というメッセージを返す", wrongs: ["何も確認せずDBを全部消す", "CSSの色だけ変える", "サーバを必ず停止する"], correctFeedback: "その通りです。空欄ならユーザーに入力を促すのが自然です。" },
        ],
      },
    ],
    check: [
      { kind: "choice", id: "flask-request-form-c01-read-check", title: "request.formの読み取りを確認しよう", instruction: "email入力を読むコードを選びましょう。", mentorMessage: "name属性と同じ名前を使います。", question: '<input name="email"> の値を読むコードは？', correct: 'request.form["email"]', wrongs: ['request.form["name"]', '<input name="email">', 'email.css'] },
      { kind: "match", id: "flask-request-form-c02-name-check", title: "nameと受け取り側を確認しよう", instruction: "HTML側とPython側を対応づけましょう。", mentorMessage: "同じ名前を探します。", items: ['name="title"', 'name="comment"'], targets: ['request.form["title"]', 'request.form["comment"]'], answerMap: { 'request.form["title"]': ['name="title"'], 'request.form["comment"]': ['name="comment"'] } },
    ],
  },
  {
    id: "input-result-template",
    title: "入力結果を画面に返す",
    description: "受け取った値をテンプレートへ渡し、結果画面に表示する流れを理解します。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/input-result-template.png",
    estimatedMinutes: 11,
    order: 7,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 120,
    learnedItems: ["render_templateに値を渡せる", "HTML側では{{ name }}で表示できる", "Python側の変数名とテンプレート側の名前を対応づける", "入力から結果表示までの流れを説明できる"],
    sections: [
      {
        id: "input-result-pass-section",
        title: "受け取った値をtemplateに渡す",
        description: "render_templateでテンプレート変数へ値を渡します。",
        activities: [
          { kind: "tutorial", id: "input-result-a01-pass-intro", title: "render_templateに値を渡す", mentorMessage: "受け取った入力値は、render_templateの引数としてHTMLテンプレートへ渡せます。", body: ['name = request.form["name"]', 'return render_template("result.html", name=name)', "このように書くと、HTML側で name という名前を使って入力値を表示できます。"], summary: ["request.formで受け取る", "render_templateに渡す", "HTML側で表示する"], visual: course4Visuals.templateResult },
          { kind: "match", id: "input-result-a02-variable-match", title: "Python側とHTML側の名前を対応づけよう", instruction: "render_templateで渡した名前とHTML側で使う名前を対応づけましょう。", mentorMessage: "テンプレートへ渡した名前をHTML側で使います。", items: ['name=name', 'message=message', 'result=result'], targets: ['{{ name }}', '{{ message }}', '{{ result }}'], answerMap: { '{{ name }}': ['name=name'], '{{ message }}': ['message=message'], '{{ result }}': ['result=result'] } },
          { kind: "choice", id: "input-result-a03-pass-code-choice", title: "値を渡すコードを選ぼう", instruction: "nameをresult.htmlに渡すコードとして自然なものを選びましょう。", mentorMessage: "render_templateの中に渡す名前を書きます。", question: "nameをresult.htmlに渡すコードは？", correct: 'return render_template("result.html", name=name)', wrongs: ['return render_template(name)', '<h1>{{ name }}</h1>', 'color: name;'], correctFeedback: "その通りです。result.htmlへnameという値を渡しています。" },
        ],
      },
      {
        id: "input-result-show-section",
        title: "結果画面で表示する",
        description: "テンプレート変数をHTMLに表示します。",
        activities: [
          { kind: "tutorial", id: "input-result-a04-show-intro", title: "{{ name }} で入力値を表示する", mentorMessage: "テンプレートに渡された値は、HTML側で {{ name }} のように書いて表示できます。", body: ["固定文字列なら <h1>予約完了</h1> のようにそのまま書きます。", "入力された名前のようにPythonから渡された値は、{{ name }} のようにテンプレート変数として表示します。", "変数名がPython側と合っていないと、思った値が表示されません。"], summary: ["固定文字列と変数表示を分ける", "{{ name }}で値を出す", "名前の一致が大事"], visual: course4Visuals.templateResult },
          { kind: "choice", id: "input-result-a05-html-variable-choice", title: "入力名を表示するHTMLは？", instruction: "Pythonから渡したnameを表示するHTMLを選びましょう。", mentorMessage: "テンプレート変数を使います。", question: "nameをHTMLに表示する書き方として自然なのは？", correct: "<p>{{ name }}さん、予約を受け付けました</p>", wrongs: ["<p>nameさん、予約を受け付けました</p>", "request.form[\"name\"]", "background-color: name;"], correctFeedback: "その通りです。{{ name }} の部分に渡された値が表示されます。" },
          { kind: "order", id: "input-result-a06-flow-order", title: "入力から表示までを並べよう", instruction: "入力値が結果画面に表示されるまでの流れを並べましょう。", mentorMessage: "フォーム、受け取り、テンプレート、表示の順です。", steps: ["フォームに名前を入力する", "POSTでサーバへ送る", "Flaskでrequest.formから受け取る", "render_templateで値を渡す", "HTML側の{{ name }}で表示する"] },
        ],
      },
    ],
    check: [
      { kind: "choice", id: "input-result-c01-code-check", title: "入力値を画面に表示するコードを確認しよう", instruction: "nameをテンプレートへ渡すコードを選びましょう。", mentorMessage: "render_templateに渡します。", question: "nameをresult.htmlへ渡すコードは？", correct: 'return render_template("result.html", name=name)', wrongs: ['return "result.html"', '<input name="name">', 'name == ""'] },
      { kind: "match", id: "input-result-c02-three-point-check", title: "フォーム・受け取り・表示を対応づけよう", instruction: "3つの部品を対応づけましょう。", mentorMessage: "同じ名前が流れていくことを確認します。", items: ['<input name="name">', 'request.form["name"]', '{{ name }}'], targets: ["フォームで送る", "Flaskで受け取る", "HTMLで表示する"], answerMap: { "フォームで送る": ['<input name="name">'], "Flaskで受け取る": ['request.form["name"]'], "HTMLで表示する": ['{{ name }}'] } },
    ],
  },
  {
    id: "small-diagnosis-app",
    title: "小さな診断アプリを作る",
    description: "入力、条件分岐、結果表示を組み合わせて最小のWebアプリ機能を作ります。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/small-diagnosis-app.png",
    estimatedMinutes: 12,
    order: 8,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 130,
    learnedItems: ["診断アプリは入力・判定・結果表示で作れる", "最小機能を先に決める", "ifで結果メッセージを変える", "フォームとPythonとHTML表示をつなげる"],
    sections: [
      {
        id: "small-diagnosis-structure-section",
        title: "診断アプリの構造を見る",
        description: "入力、判定、結果表示の3部品に分けます。",
        activities: [
          { kind: "tutorial", id: "small-diagnosis-a01-structure-intro", title: "診断アプリは3部品で考える", mentorMessage: "小さな診断アプリは、入力、判定、結果表示の3つに分けると作りやすくなります。", body: ["ユーザーはフォームに情報を入力します。", "Python側では、その入力値をifで判定します。", "最後に、判定結果をテンプレートへ渡して画面に表示します。"], summary: ["入力", "判定", "結果表示"], visual: course4Visuals.diagnosisParts },
          { kind: "match", id: "small-diagnosis-a02-parts-match", title: "診断アプリの部品を分けよう", instruction: "各作業を入力・判定・結果表示に分けましょう。", mentorMessage: "3部品に分けると見通しがよくなります。", items: ["好みを選ぶフォーム", "ifでおすすめ文を決める", "結果メッセージを表示する"], targets: ["入力", "判定", "結果表示"], answerMap: { "入力": ["好みを選ぶフォーム"], "判定": ["ifでおすすめ文を決める"], "結果表示": ["結果メッセージを表示する"] } },
          { kind: "choice", id: "small-diagnosis-a03-minimum-choice", title: "最小機能として自然なのは？", instruction: "最初に作る診断アプリの機能として自然なものを選びましょう。", mentorMessage: "最初は小さく、入力と結果がつながるところまでで十分です。", question: "最小の診断アプリとして自然なのはどれ？", correct: "1つの質問に答えると、条件に応じた結果文が表示される", wrongs: ["ログイン、決済、通知、AIを全部入れる", "背景色だけ決めて終わる", "DBを必ず100個作る"], correctFeedback: "その通りです。入力、判定、結果表示がつながれば最小機能として成立します。" },
        ],
      },
      {
        id: "small-diagnosis-branch-section",
        title: "条件分岐と結果表示を組み合わせる",
        description: "入力値によって結果文を変える流れを作ります。",
        activities: [
          { kind: "tutorial", id: "small-diagnosis-a04-result-intro", title: "入力値で結果文を変える", mentorMessage: "診断らしさは、入力に応じて結果が変わるところにあります。", body: ["たとえば choice が \"morning\" なら「朝型タイプです」と表示します。", "choice が \"night\" なら「夜型タイプです」と表示します。", "この結果文を result 変数に入れて、HTML側に渡します。"], summary: ["入力値を見る", "ifでresultを決める", "resultを画面に表示する"], visual: course4Visuals.diagnosisParts },
          { kind: "choice", id: "small-diagnosis-a05-message-choice", title: "条件に合う結果メッセージを選ぼう", instruction: "入力値に合う結果文を選びましょう。", mentorMessage: "条件と表示文が対応しているか見ます。", question: 'choice == "morning" のときに自然な結果文は？', correct: "朝型タイプです", wrongs: ["夜型タイプです", "CSSを読み込みました", "予約を削除しました"], correctFeedback: "その通りです。条件に合う結果文を返しています。" },
          { kind: "order", id: "small-diagnosis-a06-main-order", title: "診断フォームと結果表示の流れを並べよう", instruction: "診断アプリの主要な流れを並べましょう。", mentorMessage: "入力、送信、判定、表示の順です。", steps: ["ユーザーが診断フォームに答える", "POSTでサーバへ送る", "request.formで選択値を受け取る", "ifでresultを決める", "resultをテンプレートに渡して表示する"] },
        ],
      },
    ],
    check: [
      { kind: "order", id: "small-diagnosis-c01-flow-check", title: "診断フォームと結果表示の流れを確認しよう", instruction: "流れを正しい順番に並べましょう。", mentorMessage: "入力から結果表示までを確認します。", steps: ["フォームに入力する", "Flaskで値を受け取る", "ifで結果を決める", "結果画面に表示する"] },
      { kind: "choice", id: "small-diagnosis-c02-combine-check", title: "入力・条件分岐・結果表示を組み合わせる", instruction: "診断アプリの中心になる処理を選びましょう。", mentorMessage: "入力を使って結果を変えます。", question: "診断アプリの中心処理として自然なのは？", correct: "受け取った入力値をifで判定し、結果文をテンプレートに渡す", wrongs: ["CSSだけを書いて判定しない", "入力を受け取らず結果も表示しない", "HTMLファイル名をランダムに変える"] },
    ],
  },
  {
    id: "challenge-input-validation",
    title: "入力チェックを追加する",
    description: "空欄のまま送られた場合にメッセージを出す処理を考えます。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/challenge-input-validation.png",
    estimatedMinutes: 8,
    order: 9,
    type: MissionType.CHALLENGE,
    isRequiredForCourseCompletion: false,
    parentMissionId: "flask-request-form",
    roadmapLane: 1,
    branchOrder: 1,
    rewardExp: 80,
    learnedItems: ["空欄の入力をチェックできる", "ユーザーに入力を促すメッセージを返せる"],
    sections: [
      {
        id: "challenge-input-validation-section",
        title: "空欄をチェックする",
        description: "空欄時の処理を追加します。",
        activities: [
          { kind: "tutorial", id: "challenge-input-validation-a01-intro", title: "空欄のまま送られることもある", mentorMessage: "フォームは必ず正しい値が入って送られるとは限りません。空欄のときの対応も考えます。", body: ["name が空欄なら、予約完了ではなく「名前を入力してください」と返す方が自然です。", "Python側では、name == \"\" のような条件で空欄を確認できます。"], summary: ["空欄の可能性を考える", "条件でエラー文を返す", "ユーザーに次の行動を伝える"], visual: course4Visuals.ifBranch },
          { kind: "choice", id: "challenge-input-validation-a02-condition-choice", title: "空欄チェックの条件を選ぼう", instruction: "nameが空欄かどうかを確認する条件を選びましょう。", mentorMessage: "空文字と比較します。", question: "nameが空欄のときの条件として近いものは？", correct: 'name == ""', wrongs: ["name >= 18", "color: blue", "<input name=\"name\">"] },
          { kind: "choice", id: "challenge-input-validation-a03-message-choice", title: "空欄時のメッセージを選ぼう", instruction: "ユーザーに伝わるメッセージを選びましょう。", mentorMessage: "何を直せばよいか分かる文がよいです。", question: "名前が空欄のときに自然な表示は？", correct: "名前を入力してください", wrongs: ["成功しました", "CSSを変更しました", "サーバを停止します"] },
        ],
      },
    ],
    check: [
      { kind: "choice", id: "challenge-input-validation-c01-check", title: "空欄チェックを確認しよう", instruction: "空欄時の処理として自然なものを選びましょう。", mentorMessage: "入力を促すメッセージを返します。", question: "nameが空欄ならどうするのが自然？", correct: "名前を入力してくださいと表示する", wrongs: ["予約完了と表示する", "DBを削除する", "背景色だけ変える"] },
    ],
  },
  {
    id: "challenge-multi-field-form",
    title: "複数項目のフォームを作る",
    description: "名前と日付など複数の入力欄を持つフォームを扱います。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/challenge-multi-field-form.png",
    estimatedMinutes: 8,
    order: 10,
    type: MissionType.CHALLENGE,
    isRequiredForCourseCompletion: false,
    parentMissionId: "input-result-template",
    roadmapLane: 1,
    branchOrder: 2,
    rewardExp: 80,
    learnedItems: ["複数のinputに別々のnameを付けられる", "複数項目をrequest.formで受け取れる", "名前と日付を結果画面に表示できる"],
    sections: [
      {
        id: "challenge-multi-field-form-section",
        title: "名前と日付を受け取る",
        description: "複数項目のフォームと受け取り側を対応づけます。",
        activities: [
          { kind: "tutorial", id: "challenge-multi-field-form-a01-intro", title: "入力欄ごとにnameを分ける", mentorMessage: "複数の入力欄がある場合、それぞれに違うnameをつけて送ります。", body: ['名前欄には name="name"、日付欄には name="date" のように付けます。', 'Python側では request.form["name"] と request.form["date"] で別々に受け取れます。'], summary: ["入力欄ごとにnameを分ける", "request.formで別々に読む", "複数の値を結果画面へ渡せる"], visual: course4Visuals.requestForm },
          { kind: "match", id: "challenge-multi-field-form-a02-name-match", title: "複数inputと受け取り側を対応づけよう", instruction: "HTML側のnameとPython側を対応づけましょう。", mentorMessage: "同じ名前を探します。", items: ['<input name="name">', '<input name="date">'], targets: ['request.form["name"]', 'request.form["date"]'], answerMap: { 'request.form["name"]': ['<input name="name">'], 'request.form["date"]': ['<input name="date">'] } },
          { kind: "order", id: "challenge-multi-field-form-a03-order", title: "複数項目を表示する流れ", instruction: "名前と日付を受け取って表示する流れを並べましょう。", mentorMessage: "2つの値を別々に扱います。", steps: ["名前と日付をフォームに入力する", "POSTでサーバへ送る", "nameとdateをrequest.formで受け取る", "render_templateにnameとdateを渡す", "HTML側で{{ name }}と{{ date }}を表示する"] },
        ],
      },
    ],
    check: [
      { kind: "choice", id: "challenge-multi-field-form-c01-check", title: "名前と日付を受け取るフォーム", instruction: "名前と日付を送るフォームとして自然なものを選びましょう。", mentorMessage: "2つのname属性が必要です。", question: "名前と日付を送る入力欄として自然なのは？", correct: '<input name="name"><input name="date">', wrongs: ['<input name="name"><input name="name">', '<h1>name date</h1>', 'color: date;'] },
    ],
  },
  {
    id: "challenge-multiple-results",
    title: "結果メッセージを複数パターンにする",
    description: "条件を増やし、入力に応じて複数の結果メッセージを返します。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/challenge-multiple-results.png",
    estimatedMinutes: 8,
    order: 11,
    type: MissionType.CHALLENGE,
    isRequiredForCourseCompletion: false,
    parentMissionId: "small-diagnosis-app",
    roadmapLane: 1,
    branchOrder: 3,
    rewardExp: 80,
    learnedItems: ["複数条件で結果を分けられる", "条件の順番を考えられる", "ユーザーに伝わる結果文を選べる"],
    sections: [
      {
        id: "challenge-multiple-results-section",
        title: "条件を増やす",
        description: "2パターンから3パターンへ結果を増やします。",
        activities: [
          { kind: "tutorial", id: "challenge-multiple-results-a01-intro", title: "結果を3パターンに増やす", mentorMessage: "診断アプリでは、条件を増やすことで結果の種類を増やせます。", body: ["朝型、昼型、夜型のように、入力値ごとに結果文を分けます。", "条件が増えるほど、どの条件を先に見るかが重要になります。", "ユーザーが読んで納得できる結果文を返すことも大切です。"], summary: ["条件を増やす", "結果文を分ける", "伝わる文章にする"], visual: course4Visuals.ifBranch },
          { kind: "match", id: "challenge-multiple-results-a02-result-match", title: "条件と結果文を対応づけよう", instruction: "入力値と結果文を対応づけましょう。", mentorMessage: "入力値に合う文を選びます。", items: ['choice = "morning"', 'choice = "afternoon"', 'choice = "night"'], targets: ["朝型タイプです", "昼型タイプです", "夜型タイプです"], answerMap: { "朝型タイプです": ['choice = "morning"'], "昼型タイプです": ['choice = "afternoon"'], "夜型タイプです": ['choice = "night"'] } },
          { kind: "choice", id: "challenge-multiple-results-a03-message-choice", title: "ユーザーに伝わる結果文は？", instruction: "診断結果として自然な文を選びましょう。", mentorMessage: "結果を見た人が理解しやすい文にします。", question: "夜型を選んだ人への結果文として自然なのは？", correct: "夜に集中しやすいタイプです。予定は夜の作業時間を活かして立ててみましょう。", wrongs: ["エラー番号だけを表示する", "CSSを読み込みました", "意味のないランダム文字列を表示する"] },
        ],
      },
    ],
    check: [
      { kind: "match", id: "challenge-multiple-results-c01-check", title: "条件に応じた結果を確認しよう", instruction: "条件と結果を対応づけましょう。", mentorMessage: "入力値ごとに結果を変えます。", items: ['choice = "morning"', 'choice = "night"'], targets: ["朝型タイプ", "夜型タイプ"], answerMap: { "朝型タイプ": ['choice = "morning"'], "夜型タイプ": ['choice = "night"'] } },
    ],
  },
] as const;

const pythonWebRoleMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[0]);
const pythonIfBranchMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[1]);
const pythonListDictDataMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[2]);
const htmlFormBasicMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[3]);
const formPostSubmitMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[4]);
const flaskRequestFormMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[5]);
const inputResultTemplateMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[6]);
const smallDiagnosisAppMission: MissionSeed = buildCourse4Mission(course4MissionSpecs[7]);
const inputValidationChallenge: MissionSeed = buildCourse4Mission(course4MissionSpecs[8]);
const multiFieldFormChallenge: MissionSeed = buildCourse4Mission(course4MissionSpecs[9]);
const multipleResultsChallenge: MissionSeed = buildCourse4Mission(course4MissionSpecs[10]);

const pythonWebInputCourse: CourseSeed = {
  id: "python-web-input",
  title: "PythonでWebの入力を扱う",
  description: "Webアプリで必要になるPythonの最小知識を学び、フォーム入力をサーバ側で受け取って画面に反映できるようにします。",
  difficulty: CourseDifficulty.EASY,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.TOOL, CourseCategoryType.ALGORITHM],
  missions: [
    pythonWebRoleMission,
    pythonIfBranchMission,
    pythonListDictDataMission,
    htmlFormBasicMission,
    formPostSubmitMission,
    flaskRequestFormMission,
    inputResultTemplateMission,
    smallDiagnosisAppMission,
    inputValidationChallenge,
    multiFieldFormChallenge,
    multipleResultsChallenge,
  ],
};

// 既存の courses 配列に pythonWebInputCourse を追加する想定:
// const courses: CourseSeed[] = [webAppOverviewCourse, flaskPageCourse, htmlCssCourse, pythonWebInputCourse, ...];

// ==============================
// Course 5 seed append: データを保存して使う
// 既存の learningSeed.ts の helper / type 定義の後ろに追記する想定
// 前提: tutorial / choice / match / orderedSteps / defineMissionVisual / CourseDifficulty / MissionType / CourseCategoryType が既存スコープにある
// Prisma enumは GAME / ALGORITHM / TOOL / UI / DATA のみを使用
// ==============================

const course5Visuals = {
  whyDatabase: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "一時的な表示と保存データ",
      caption: "画面を閉じても残したい情報は、DBに保存する必要があります。",
      panels: [
        { id: "temporary", title: "一時的な表示", subtitle: "残さなくてよい", tone: "blue", items: ["今だけの計算結果", "一時的なメッセージ", "画面を閉じると消えてよい"] },
        { id: "stored", title: "保存データ", subtitle: "あとから使う", tone: "green", items: ["予約情報", "メモ", "出欠記録"] },
      ],
    },
  }),
  tableRowsColumns: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "COMPARE_PANEL",
      title: "テーブル・行・列の見方",
      caption: "予約表で考えると、テーブルは表全体、行は1件、列は項目です。",
      panels: [
        { id: "table", title: "テーブル", subtitle: "表全体", tone: "blue", items: ["reservations", "予約をまとめる場所"] },
        { id: "row", title: "行", subtitle: "1件のデータ", tone: "green", items: ["田中 / 6月20日 / 2人", "1つの予約"] },
        { id: "column", title: "列", subtitle: "項目", tone: "orange", items: ["name", "date", "people"] },
      ],
    },
  }),
  formToDatabase: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "フォーム項目とDB項目の対応",
      caption: "フォームから送られた値を、DBの列に対応させて保存します。",
      nodes: [
        { id: "form", label: "フォーム", description: "name / date / people", icon: "browser", tone: "blue" },
        { id: "server", label: "サーバ", description: "受け取って整える", icon: "server", tone: "orange" },
        { id: "db", label: "DB", description: "列として保存", icon: "database", tone: "green" },
      ],
      edges: [
        { id: "form-server", from: "form", to: "server", label: "POST送信" },
        { id: "server-db", from: "server", to: "db", label: "登録" },
      ],
    },
  }),
  modelTable: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "モデルとテーブルの関係",
      caption: "モデルは、アプリ内で扱うデータの形を決める設計図として考えられます。",
      panels: [
        { id: "model", title: "モデル", subtitle: "アプリ内の形", tone: "blue", items: ["Reservation", "name / date / people", "1件の予約を表す"] },
        { id: "table", title: "テーブル", subtitle: "DB内の形", tone: "green", items: ["reservations", "列として保存", "複数件をためる"] },
      ],
    },
  }),
  saveFlow: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "入力からDB保存までの流れ",
      caption: "フォーム入力はサーバで受け取られ、保存データに整えられてDBへ登録されます。",
      nodes: [
        { id: "input", label: "入力", description: "フォームに入力", icon: "user", tone: "blue" },
        { id: "receive", label: "受け取り", description: "request.form", icon: "server", tone: "orange" },
        { id: "save", label: "保存", description: "DBへ登録", icon: "database", tone: "green" },
        { id: "list", label: "一覧", description: "保存後に表示", icon: "browser", tone: "purple" },
      ],
      edges: [
        { id: "input-receive", from: "input", to: "receive", label: "送信" },
        { id: "receive-save", from: "receive", to: "save", label: "登録" },
        { id: "save-list", from: "save", to: "list", label: "確認" },
      ],
    },
  }),
  fetchFlow: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "DBから取り出して表示する流れ",
      caption: "保存済みデータをDBから取り出し、テンプレートへ渡して一覧画面に表示します。",
      nodes: [
        { id: "db", label: "DB", description: "予約データ", icon: "database", tone: "green" },
        { id: "server", label: "サーバ", description: "全件取得", icon: "server", tone: "orange" },
        { id: "template", label: "テンプレート", description: "reservationsを表示", icon: "code", tone: "blue" },
        { id: "browser", label: "一覧画面", description: "表やカードで表示", icon: "browser", tone: "purple" },
      ],
      edges: [
        { id: "db-server", from: "db", to: "server", label: "取得" },
        { id: "server-template", from: "server", to: "template", label: "渡す" },
        { id: "template-browser", from: "template", to: "browser", label: "表示" },
      ],
    },
  }),
  listViewTypes: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "table表示とcard表示",
      caption: "一覧の見せ方は、情報量や画面幅に合わせて選びます。",
      panels: [
        { id: "table", title: "table", subtitle: "一覧性が高い", tone: "blue", items: ["列で比較しやすい", "予約一覧", "PC画面に向く"] },
        { id: "card", title: "card", subtitle: "1件が見やすい", tone: "green", items: ["1件ずつ読める", "スマホでも見やすい", "余白を作りやすい"] },
      ],
    },
  }),
  reservationWholeFlow: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "予約サイトの基本形",
      caption: "入力、保存、一覧表示を、画面・サーバ・DBの役割で整理します。",
      nodes: [
        { id: "screen", label: "画面", description: "フォーム・一覧", icon: "browser", tone: "blue" },
        { id: "server", label: "サーバ", description: "受け取り・取得", icon: "server", tone: "orange" },
        { id: "db", label: "DB", description: "保存・取り出し", icon: "database", tone: "green" },
      ],
      edges: [
        { id: "screen-server", from: "screen", to: "server", label: "入力を送る", reverseLabel: "一覧を返す", bidirectional: true },
        { id: "server-db", from: "server", to: "db", label: "保存する", reverseLabel: "取り出す", bidirectional: true },
      ],
    },
  }),
} as const;

const databaseReasonMission: MissionSeed = {
  id: "db-why-needed",
  title: "DBが必要な理由を知る",
  description: "画面を閉じても残したいデータにはDBが必要になることを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/db-why-needed.png",
  estimatedMinutes: 10,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: [
    "画面を閉じても残したい情報には保存が必要",
    "DBはあとから使うデータを残すために使う",
    "一時的な表示と保存すべきデータを区別する",
  ],
  isPublished: true,
  sections: [
    {
      id: "db-why-data-section",
      title: "残したいデータを見る",
      description: "メモ、予約、出欠など、あとから使いたい情報を整理します。",
      order: 1,
      activities: [
        tutorial({
          id: "db-why-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "画面を閉じても残したい情報がある",
          mentorMessage: "Webアプリでは、入力した情報をあとからもう一度使いたい場面があります。そのような情報を残すためにDBを使います。",
          body: [
            "たとえば、予約アプリでは名前、日付、人数などをあとから一覧で確認したいです。",
            "メモアプリなら、書いたメモを次に開いたときも読みたいです。",
            "このように、画面を閉じても残したい情報は、DBのような保存場所に残す必要があります。",
          ].join("\n\n"),
          summary: ["あとから使う情報は保存する", "予約やメモはDBに残す候補", "今だけの表示とは分けて考える"],
          visual: course5Visuals.whyDatabase,
        }),
        choice({
          id: "db-why-a02-stored-choice",
          order: 2,
          sectionOrder: 2,
          title: "画面を閉じても残したい情報は？",
          instruction: "DBに保存する必要が高い情報を選びましょう。",
          mentorMessage: "あとから見返したい情報かどうかに注目しましょう。",
          question: "予約アプリで、DBに保存する必要が高いものはどれ？",
          choices: [
            { id: "db-why-a02-correct", label: "予約した人の名前と日付", isCorrect: true, feedback: "その通りです。予約情報はあとから確認するために保存する必要があります。" },
            { id: "db-why-a02-wrong-hover", label: "ボタンにマウスを乗せた瞬間の色", isCorrect: false, feedback: "惜しいです。これは一時的な見た目の変化で、中心データとして保存する必要は低いです。" },
            { id: "db-why-a02-wrong-width", label: "ブラウザの横幅", isCorrect: false, feedback: "惜しいです。画面幅は表示調整に関係しますが、予約データとして残す情報ではありません。" },
            { id: "db-why-a02-wrong-title", label: "ページを開いた瞬間のスクロール位置", isCorrect: false, feedback: "惜しいです。予約アプリの中心データとして残すものではありません。" },
          ],
        }),
        match({
          id: "db-why-a03-temp-stored-match",
          order: 3,
          sectionOrder: 3,
          title: "一時的な表示と保存データを分けよう",
          instruction: "次の項目を、一時的な表示・保存データに分けましょう。",
          mentorMessage: "残すべき情報か、今だけ表示されればよい情報かで分けます。",
          items: [
            { id: "reservation", label: "予約内容" },
            { id: "memo", label: "保存したメモ" },
            { id: "hover", label: "ボタンに触れたときの色" },
            { id: "loading", label: "読み込み中メッセージ" },
          ],
          targets: [
            { id: "stored", label: "保存データ" },
            { id: "temporary", label: "一時的な表示" },
          ],
          answers: [
            { targetId: "stored", itemIds: ["reservation", "memo"] },
            { targetId: "temporary", itemIds: ["hover", "loading"] },
          ],
          correctFeedback: "よく整理できています。あとから必要な情報を保存データとして考えられています。",
          incorrectFeedback: "あとから見返す必要があるかを基準に分けてみましょう。",
        }),
      ],
    },
    {
      id: "db-why-use-section",
      title: "DBを使う場面を選ぶ",
      description: "DBが必要な場面と、DBなしでもよい場面を比べます。",
      order: 2,
      activities: [
        choice({
          id: "db-why-a04-need-db-choice",
          order: 4,
          sectionOrder: 1,
          title: "DBが必要な場面は？",
          instruction: "DBを使う場面として自然なものを選びましょう。",
          mentorMessage: "画面を閉じたあとも残す必要があるかを考えます。",
          question: "次のうち、DBを使う必要が高い場面はどれ？",
          choices: [
            { id: "db-why-a04-correct", label: "入力された予約をあとから一覧表示する", isCorrect: true, feedback: "その通りです。あとから一覧表示するには、予約データを保存しておく必要があります。" },
            { id: "db-why-a04-wrong-color", label: "見出しの文字色を青にする", isCorrect: false, feedback: "惜しいです。文字色はCSSで扱う見た目の話で、DBは必要ありません。" },
            { id: "db-why-a04-wrong-margin", label: "カードの余白を広げる", isCorrect: false, feedback: "惜しいです。余白の変更はCSSで行うため、DBとは関係が薄いです。" },
            { id: "db-why-a04-wrong-title", label: "ページタイトルを変更する", isCorrect: false, feedback: "惜しいです。ページタイトル変更はHTML側の内容で、DB保存の話ではありません。" },
          ],
        }),
        choice({
          id: "db-why-a05-no-db-choice",
          order: 5,
          sectionOrder: 2,
          title: "DBがなくてもよい場面は？",
          instruction: "DBを使わなくてもよさそうな場面を選びましょう。",
          mentorMessage: "保存せず、画面表示だけ変える作業ならDBは不要なことが多いです。",
          question: "次のうち、DBがなくても実現しやすいものはどれ？",
          choices: [
            { id: "db-why-a05-wrong-reservation", label: "予約履歴を翌日も残す", isCorrect: false, feedback: "惜しいです。翌日も残すならDBが必要になる可能性が高いです。" },
            { id: "db-why-a05-correct", label: "見出しの背景色を変える", isCorrect: true, feedback: "その通りです。見た目の変更はCSSでできるため、DBは基本的に不要です。" },
            { id: "db-why-a05-wrong-list", label: "登録済みメモを一覧で表示する", isCorrect: false, feedback: "惜しいです。登録済みメモを残すには保存場所が必要です。" },
            { id: "db-why-a05-wrong-attendance", label: "出欠記録を保存する", isCorrect: false, feedback: "惜しいです。出欠記録はあとから使うため、保存が必要です。" },
          ],
        }),
        tutorial({
          id: "db-why-a06-reservation-data",
          order: 6,
          sectionOrder: 3,
          title: "予約アプリで残すべき情報を見る",
          mentorMessage: "予約アプリでは、誰が、いつ、何人で予約したかのように、あとから確認する情報を残します。",
          body: [
            "予約アプリで保存する候補は、名前、日付、人数、連絡先、備考などです。",
            "一方で、ボタンの色やページ上の一時的なメッセージは、予約データとしてDBに残す必要は低いです。",
            "DBを使う前に、何を残すべきかを決めることが大切です。",
          ].join("\n\n"),
          summary: ["保存する項目を先に決める", "予約データと見た目の情報を分ける"],
        }),
      ],
    },
    {
      id: "db-why-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        choice({
          id: "db-why-c01-needed-check",
          order: 7,
          sectionOrder: 1,
          title: "DBが必要な場面を選ぼう",
          instruction: "DBが必要な場面として自然なものを選びましょう。",
          mentorMessage: "画面を閉じた後も残したいかが判断ポイントです。",
          question: "DBが必要になりやすい場面はどれ？",
          choices: [
            { id: "db-why-c01-correct", label: "入力された予約を保存して翌日も確認する", isCorrect: true, feedback: "OKです。あとから確認する予約情報はDBに保存する候補です。" },
            { id: "db-why-c01-wrong-css", label: "文字色を赤くする", isCorrect: false, feedback: "惜しいです。文字色はCSSで扱えます。" },
            { id: "db-why-c01-wrong-layout", label: "カードを横並びにする", isCorrect: false, feedback: "惜しいです。レイアウトはCSSで扱います。" },
            { id: "db-why-c01-wrong-font", label: "文字サイズを大きくする", isCorrect: false, feedback: "惜しいです。文字サイズはCSSで扱えます。" },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "db-why-c02-stored-check",
          order: 8,
          sectionOrder: 2,
          title: "保存すべき情報を分けよう",
          instruction: "保存すべき情報と、保存しなくてもよい情報を分けましょう。",
          mentorMessage: "あとから見返す情報かどうかで判断します。",
          items: [
            { id: "name", label: "予約者名" },
            { id: "date", label: "予約日" },
            { id: "button-color", label: "ボタンの色" },
            { id: "card-margin", label: "カードの余白" },
          ],
          targets: [
            { id: "store", label: "保存すべき情報" },
            { id: "no-store", label: "保存しなくてもよい情報" },
          ],
          answers: [
            { targetId: "store", itemIds: ["name", "date"] },
            { targetId: "no-store", itemIds: ["button-color", "card-margin"] },
          ],
          correctFeedback: "OKです。予約データと見た目の情報を分けられています。",
          incorrectFeedback: "予約としてあとから必要な情報か、見た目の調整かを考えてみましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const dbTableMission: MissionSeed = {
  id: "db-table-row-column",
  title: "テーブル・行・列を知る",
  description: "DBの基本用語を予約表のイメージで理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/db-table-row-column.png",
  estimatedMinutes: 10,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: ["テーブルはデータをまとめる表", "行は1件のデータ", "列は名前や日付などの項目"],
  isPublished: true,
  sections: [
    {
      id: "db-table-basic-section",
      title: "予約表で用語を見る",
      description: "テーブル、行、列を予約表で整理します。",
      order: 1,
      activities: [
        tutorial({
          id: "db-table-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "DBは表のようにデータを整理できる",
          mentorMessage: "DBの基本は、表のようにデータを整理するイメージで考えると分かりやすいです。",
          body: [
            "予約データなら、予約をまとめる表全体をテーブルと考えます。",
            "1件の予約は1行として表されます。",
            "名前、日付、人数のような項目は列として表されます。",
          ].join("\n\n"),
          summary: ["テーブルは表全体", "行は1件", "列は項目"],
          visual: course5Visuals.tableRowsColumns,
        }),
        match({
          id: "db-table-a02-term-match",
          order: 2,
          sectionOrder: 2,
          title: "1件の予約と1列の意味を分けよう",
          instruction: "DB用語を予約表の意味に対応づけましょう。",
          mentorMessage: "表全体、1件、項目という3つに分けて考えます。",
          items: [
            { id: "table", label: "テーブル" },
            { id: "row", label: "行" },
            { id: "column", label: "列" },
          ],
          targets: [
            { id: "whole", label: "予約をまとめる表全体" },
            { id: "one", label: "1件の予約データ" },
            { id: "field", label: "名前・日付・人数などの項目" },
          ],
          answers: [
            { targetId: "whole", itemIds: ["table"] },
            { targetId: "one", itemIds: ["row"] },
            { targetId: "field", itemIds: ["column"] },
          ],
          correctFeedback: "よくできています。テーブル、行、列の関係を整理できています。",
          incorrectFeedback: "表全体がテーブル、1件が行、項目が列です。",
        }),
        choice({
          id: "db-table-a03-row-column-choice",
          order: 3,
          sectionOrder: 3,
          title: "行と列を見分けよう",
          instruction: "予約表の中で、行に近いものを選びましょう。",
          mentorMessage: "行は1件分のまとまりです。",
          question: "予約表で1行として考えやすいものはどれ？",
          choices: [
            { id: "db-table-a03-correct", label: "田中さん・6月20日・2人の予約", isCorrect: true, feedback: "その通りです。1件の予約データは1行として考えます。" },
            { id: "db-table-a03-wrong-name", label: "nameという項目名", isCorrect: false, feedback: "惜しいです。nameは列名として考えられます。" },
            { id: "db-table-a03-wrong-date", label: "dateという項目名", isCorrect: false, feedback: "惜しいです。dateは列名です。" },
            { id: "db-table-a03-wrong-table", label: "reservationsという表全体", isCorrect: false, feedback: "惜しいです。表全体はテーブルです。" },
          ],
        }),
      ],
    },
    {
      id: "db-table-read-section",
      title: "データの読み取り",
      description: "予約テーブルから1件分のデータを読み取ります。",
      order: 2,
      activities: [
        tutorial({
          id: "db-table-a04-read-row",
          order: 4,
          sectionOrder: 1,
          title: "予約テーブルから1件分を読む",
          mentorMessage: "DBのデータは、列名と値の組み合わせとして読むと分かりやすいです。",
          body: [
            "たとえば、name が 田中、date が 6月20日、people が 2 なら、田中さんが6月20日に2人で予約したという意味になります。",
            "列名はデータの種類を表し、値は実際に保存された内容を表します。",
          ].join("\n\n"),
          summary: ["列名はデータの種類", "値は保存された内容", "1行で1件の予約を表す"],
        }),
        match({
          id: "db-table-a05-value-match",
          order: 5,
          sectionOrder: 2,
          title: "列名と値を対応づけよう",
          instruction: "次の列名を、保存されている値の意味に対応づけましょう。",
          mentorMessage: "列名が何を表すかを確認しましょう。",
          items: [
            { id: "name", label: "name" },
            { id: "date", label: "date" },
            { id: "people", label: "people" },
          ],
          targets: [
            { id: "person", label: "予約者名" },
            { id: "day", label: "予約日" },
            { id: "count", label: "人数" },
          ],
          answers: [
            { targetId: "person", itemIds: ["name"] },
            { targetId: "day", itemIds: ["date"] },
            { targetId: "count", itemIds: ["people"] },
          ],
          correctFeedback: "いい感じです。列名と値の意味を対応づけられています。",
          incorrectFeedback: "nameは名前、dateは日付、peopleは人数です。",
        }),
        choice({
          id: "db-table-a06-column-choice",
          order: 6,
          sectionOrder: 3,
          title: "どの列が何を表す？",
          instruction: "予約人数を保存する列として自然なものを選びましょう。",
          mentorMessage: "列名は、その列に保存する情報の種類を表します。",
          question: "予約人数を保存する列名として自然なのはどれ？",
          choices: [
            { id: "db-table-a06-correct", label: "people", isCorrect: true, feedback: "その通りです。peopleは人数を表す列名として自然です。" },
            { id: "db-table-a06-wrong-name", label: "name", isCorrect: false, feedback: "惜しいです。nameは予約者名に向いています。" },
            { id: "db-table-a06-wrong-date", label: "date", isCorrect: false, feedback: "惜しいです。dateは日付に向いています。" },
            { id: "db-table-a06-wrong-color", label: "button_color", isCorrect: false, feedback: "惜しいです。ボタン色は予約人数とは関係が薄いです。" },
          ],
        }),
      ],
    },
    {
      id: "db-table-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "db-table-c01-term-check",
          order: 7,
          sectionOrder: 1,
          title: "テーブル・行・列を対応づけよう",
          instruction: "DB用語と意味を対応づけましょう。",
          mentorMessage: "表全体、1件、項目の違いを確認します。",
          items: [
            { id: "table", label: "テーブル" },
            { id: "row", label: "行" },
            { id: "column", label: "列" },
          ],
          targets: [
            { id: "whole", label: "表全体" },
            { id: "one", label: "1件のデータ" },
            { id: "field", label: "項目" },
          ],
          answers: [
            { targetId: "whole", itemIds: ["table"] },
            { targetId: "one", itemIds: ["row"] },
            { targetId: "field", itemIds: ["column"] },
          ],
          correctFeedback: "OKです。DBの基本用語を整理できています。",
          incorrectFeedback: "テーブルは表全体、行は1件、列は項目です。",
          isMissionCheck: true,
        }),
        choice({
          id: "db-table-c02-read-check",
          order: 8,
          sectionOrder: 2,
          title: "予約テーブルを読み取ろう",
          instruction: "保存された値の意味として自然なものを選びましょう。",
          mentorMessage: "列名と値を組み合わせて読みます。",
          question: "name='佐藤', date='7月1日', people=3 の行は何を表している？",
          choices: [
            { id: "db-table-c02-correct", label: "佐藤さんが7月1日に3人で予約した", isCorrect: true, feedback: "OKです。1行で1件の予約を表しています。" },
            { id: "db-table-c02-wrong-css", label: "佐藤というCSSクラスを作った", isCorrect: false, feedback: "惜しいです。これは予約データの行です。" },
            { id: "db-table-c02-wrong-table", label: "7月1日というテーブルを作った", isCorrect: false, feedback: "惜しいです。dateは列の値です。" },
            { id: "db-table-c02-wrong-color", label: "人数に合わせて背景色を変えた", isCorrect: false, feedback: "惜しいです。peopleは人数の値です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const saveItemsMission: MissionSeed = {
  id: "db-save-items",
  title: "保存する項目を決める",
  description: "フォーム項目とDBに保存する項目を対応づけます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/db-save-items.png",
  estimatedMinutes: 11,
  order: 3,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: ["予約アプリに必要な項目を選ぶ", "フォームのnameとDBの列を対応づける", "保存しなくてよい情報を判断する"],
  isPublished: true,
  sections: [
    {
      id: "save-items-reservation-section",
      title: "予約アプリに必要な項目",
      description: "名前、日付、人数など、予約として残す情報を整理します。",
      order: 1,
      activities: [
        choice({
          id: "save-items-a01-needed-choice",
          order: 1,
          sectionOrder: 1,
          title: "予約に必要な項目を選ぼう",
          instruction: "予約データとして保存する必要が高い項目を選びましょう。",
          mentorMessage: "あとから予約を確認するために必要な情報を考えます。",
          question: "予約アプリで保存する項目として自然なのはどれ？",
          choices: [
            { id: "save-items-a01-correct", label: "名前・日付・人数", isCorrect: true, feedback: "その通りです。予約を確認するために必要な基本項目です。" },
            { id: "save-items-a01-wrong-color", label: "ボタン色・余白・文字サイズ", isCorrect: false, feedback: "惜しいです。これは見た目の情報で、予約データではありません。" },
            { id: "save-items-a01-wrong-device", label: "キーボードの種類・机の色", isCorrect: false, feedback: "惜しいです。予約情報として残す必要は低いです。" },
            { id: "save-items-a01-wrong-hover", label: "ホバー時の影・背景グラデーション", isCorrect: false, feedback: "惜しいです。見た目の表現であり、DB項目ではありません。" },
          ],
        }),
        match({
          id: "save-items-a02-item-match",
          order: 2,
          sectionOrder: 2,
          title: "名前、日付、人数を整理しよう",
          instruction: "予約アプリの入力項目を、保存する意味に対応づけましょう。",
          mentorMessage: "何を知るための項目かを考えます。",
          items: [
            { id: "name", label: "名前" },
            { id: "date", label: "日付" },
            { id: "people", label: "人数" },
          ],
          targets: [
            { id: "who", label: "誰の予約か" },
            { id: "when", label: "いつの予約か" },
            { id: "count", label: "何人の予約か" },
          ],
          answers: [
            { targetId: "who", itemIds: ["name"] },
            { targetId: "when", itemIds: ["date"] },
            { targetId: "count", itemIds: ["people"] },
          ],
          correctFeedback: "よくできています。予約に必要な情報を意味で整理できています。",
          incorrectFeedback: "名前は誰、日付はいつ、人数は何人かを表します。",
        }),
        choice({
          id: "save-items-a03-no-save-choice",
          order: 3,
          sectionOrder: 3,
          title: "保存しなくてよい情報は？",
          instruction: "予約データとして保存しなくてもよい情報を選びましょう。",
          mentorMessage: "予約の内容そのものか、見た目の調整かを分けます。",
          question: "予約データとして保存する必要が低いものはどれ？",
          choices: [
            { id: "save-items-a03-wrong-name", label: "予約者名", isCorrect: false, feedback: "惜しいです。予約者名は保存したい基本情報です。" },
            { id: "save-items-a03-wrong-date", label: "予約日", isCorrect: false, feedback: "惜しいです。予約日はあとから確認するために必要です。" },
            { id: "save-items-a03-correct", label: "送信ボタンの角丸の大きさ", isCorrect: true, feedback: "その通りです。ボタンの角丸は見た目の設定で、予約データとして保存する必要は低いです。" },
            { id: "save-items-a03-wrong-people", label: "予約人数", isCorrect: false, feedback: "惜しいです。予約人数は保存したい情報です。" },
          ],
        }),
      ],
    },
    {
      id: "save-items-form-db-section",
      title: "フォーム項目とDB項目",
      description: "フォームのname属性とDBの列名を対応づけます。",
      order: 2,
      activities: [
        tutorial({
          id: "save-items-a04-form-db-intro",
          order: 4,
          sectionOrder: 1,
          title: "フォームのnameとDBの列を対応させる",
          mentorMessage: "フォームから送られる名前と、DBに保存する列を対応させると、どの入力がどこへ保存されるか分かりやすくなります。",
          body: [
            "HTMLの input には name 属性があります。たとえば name=\"date\" は日付入力としてサーバに送れます。",
            "DB側にも date のような列を用意しておくと、フォーム項目と保存先が対応します。",
            "この対応がずれると、入力した値をどこに保存すればよいか分かりにくくなります。",
          ].join("\n\n"),
          summary: ["フォームのnameは送る名前", "DBの列は保存する場所", "同じ意味の項目を対応づける"],
          visual: course5Visuals.formToDatabase,
        }),
        match({
          id: "save-items-a05-label-data-match",
          order: 5,
          sectionOrder: 2,
          title: "表示用の文言と保存データを分けよう",
          instruction: "次の項目を、表示用の文言・保存データに分けましょう。",
          mentorMessage: "ユーザーに見せるラベルと、DBに残す値を区別します。",
          items: [
            { id: "label-name", label: "お名前" },
            { id: "label-date", label: "希望日" },
            { id: "value-name", label: "田中" },
            { id: "value-date", label: "2026-07-01" },
          ],
          targets: [
            { id: "label", label: "表示用の文言" },
            { id: "data", label: "保存する値" },
          ],
          answers: [
            { targetId: "label", itemIds: ["label-name", "label-date"] },
            { targetId: "data", itemIds: ["value-name", "value-date"] },
          ],
          correctFeedback: "いい整理です。ラベルと実際に保存する値を分けられています。",
          incorrectFeedback: "画面に表示する説明文か、ユーザーが入力した保存対象の値かを考えましょう。",
        }),
        match({
          id: "save-items-a06-form-db-match",
          order: 6,
          sectionOrder: 3,
          title: "フォーム項目とDB項目を対応づけよう",
          instruction: "フォームのname属性を、DBの列に対応づけましょう。",
          mentorMessage: "入力欄の名前と保存先の列を合わせます。",
          items: [
            { id: "input-name", label: "input name=\"name\"" },
            { id: "input-date", label: "input name=\"date\"" },
            { id: "input-people", label: "input name=\"people\"" },
          ],
          targets: [
            { id: "col-name", label: "DB列: name" },
            { id: "col-date", label: "DB列: date" },
            { id: "col-people", label: "DB列: people" },
          ],
          answers: [
            { targetId: "col-name", itemIds: ["input-name"] },
            { targetId: "col-date", itemIds: ["input-date"] },
            { targetId: "col-people", itemIds: ["input-people"] },
          ],
          correctFeedback: "よくできています。フォーム項目とDB項目の対応が見えています。",
          incorrectFeedback: "同じ意味を持つname属性と列名を対応づけましょう。",
        }),
      ],
    },
    {
      id: "save-items-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "save-items-c01-form-db-check",
          order: 7,
          sectionOrder: 1,
          title: "フォーム項目とDB項目を確認しよう",
          instruction: "フォーム項目をDB列に対応づけましょう。",
          mentorMessage: "保存先の列を意識して対応させます。",
          items: [
            { id: "name", label: "名前入力" },
            { id: "date", label: "日付入力" },
            { id: "people", label: "人数入力" },
          ],
          targets: [
            { id: "name-col", label: "name列" },
            { id: "date-col", label: "date列" },
            { id: "people-col", label: "people列" },
          ],
          answers: [
            { targetId: "name-col", itemIds: ["name"] },
            { targetId: "date-col", itemIds: ["date"] },
            { targetId: "people-col", itemIds: ["people"] },
          ],
          correctFeedback: "OKです。フォーム項目とDB項目を対応づけられています。",
          incorrectFeedback: "名前はname列、日付はdate列、人数はpeople列に対応します。",
          isMissionCheck: true,
        }),
        choice({
          id: "save-items-c02-needed-check",
          order: 8,
          sectionOrder: 2,
          title: "予約アプリに必要な項目を選ぼう",
          instruction: "予約アプリで保存する項目として自然なものを選びましょう。",
          mentorMessage: "あとから予約内容を確認するために必要な情報を選びます。",
          question: "予約アプリのDB項目として自然なのはどれ？",
          choices: [
            { id: "save-items-c02-correct", label: "name, date, people", isCorrect: true, feedback: "OKです。予約者名、日付、人数は基本的な保存項目です。" },
            { id: "save-items-c02-wrong-css", label: "color, margin, font_size", isCorrect: false, feedback: "惜しいです。これは見た目の設定です。" },
            { id: "save-items-c02-wrong-device", label: "desk, chair, keyboard", isCorrect: false, feedback: "惜しいです。予約データとしては不自然です。" },
            { id: "save-items-c02-wrong-animation", label: "hover, shadow, gradient", isCorrect: false, feedback: "惜しいです。これは見た目の効果です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const dataModelMission: MissionSeed = {
  id: "db-model-thinking",
  title: "モデルの考え方を知る",
  description: "アプリ内で扱うデータの形を決める考え方を理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/db-model-thinking.png",
  estimatedMinutes: 10,
  order: 4,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["モデルはアプリ内で扱うデータの形", "モデルの項目はDBの列に近い", "不要な項目を入れすぎない"],
  isPublished: true,
  sections: [
    {
      id: "data-model-shape-section",
      title: "データの形を決める",
      description: "予約モデルの項目を見ながら、1件のデータの形を整理します。",
      order: 1,
      activities: [
        tutorial({
          id: "data-model-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "モデルはデータの形を決める考え方",
          mentorMessage: "DBに保存する前に、アプリの中で1件の予約をどんな形で扱うかを決めます。これをモデルとして考えると整理しやすくなります。",
          body: [
            "予約アプリなら、Reservationというモデルを考えられます。",
            "Reservationには、name、date、peopleのような項目を持たせます。",
            "モデルは、アプリ内で扱うデータの設計図のようなものです。",
          ].join("\n\n"),
          summary: ["モデルはデータの形", "1件の予約に必要な項目を決める", "DBの列にもつながる"],
          visual: course5Visuals.modelTable,
        }),
        match({
          id: "data-model-a02-field-match",
          order: 2,
          sectionOrder: 2,
          title: "予約モデルの項目を分類しよう",
          instruction: "予約モデルの項目を、それぞれの意味に対応づけましょう。",
          mentorMessage: "モデルの項目が何を表しているか確認します。",
          items: [
            { id: "name", label: "name" },
            { id: "date", label: "date" },
            { id: "people", label: "people" },
          ],
          targets: [
            { id: "who", label: "予約者名" },
            { id: "when", label: "予約日" },
            { id: "count", label: "人数" },
          ],
          answers: [
            { targetId: "who", itemIds: ["name"] },
            { targetId: "when", itemIds: ["date"] },
            { targetId: "count", itemIds: ["people"] },
          ],
          correctFeedback: "よくできています。モデルの項目と意味を対応づけられています。",
          incorrectFeedback: "nameは名前、dateは日付、peopleは人数です。",
        }),
        choice({
          id: "data-model-a03-read-choice",
          order: 3,
          sectionOrder: 3,
          title: "1件の予約データを読もう",
          instruction: "予約データの読み取りとして自然なものを選びましょう。",
          mentorMessage: "1件のモデルデータを、項目と値で読み取ります。",
          question: "{ name: '田中', date: '7/10', people: 2 } は何を表している？",
          choices: [
            { id: "data-model-a03-correct", label: "田中さんが7月10日に2人で予約したデータ", isCorrect: true, feedback: "その通りです。1件の予約データとして読めます。" },
            { id: "data-model-a03-wrong-css", label: "田中というCSSクラスの設定", isCorrect: false, feedback: "惜しいです。これは予約データの形です。" },
            { id: "data-model-a03-wrong-html", label: "HTMLの見出し構造", isCorrect: false, feedback: "惜しいです。これは画面構造ではなく、データです。" },
            { id: "data-model-a03-wrong-api", label: "外部APIのURL", isCorrect: false, feedback: "惜しいです。ここでは予約1件のデータを表しています。" },
          ],
        }),
      ],
    },
    {
      id: "data-model-table-section",
      title: "モデルとテーブルの関係",
      description: "モデルの項目がDBテーブルの列に近いことを理解します。",
      order: 2,
      activities: [
        tutorial({
          id: "data-model-a04-model-table",
          order: 4,
          sectionOrder: 1,
          title: "モデルの項目はDBの列に近い",
          mentorMessage: "モデルで決めた項目は、DBのテーブルに保存するときの列と対応して考えられます。",
          body: [
            "Reservationモデルに name, date, people があるなら、DBのreservationsテーブルにも同じような列を用意します。",
            "モデルとテーブルを対応させると、アプリ内のデータとDB上の保存先を整理しやすくなります。",
          ].join("\n\n"),
          summary: ["モデルはアプリ内の形", "テーブルはDB内の保存先", "項目と列を対応させる"],
        }),
        match({
          id: "data-model-a05-complete-match",
          order: 5,
          sectionOrder: 2,
          title: "予約モデルの項目を完成させよう",
          instruction: "予約モデルに必要な項目を選びましょう。",
          mentorMessage: "予約としてあとから使う情報をモデルに入れます。",
          items: [
            { id: "name", label: "name" },
            { id: "date", label: "date" },
            { id: "people", label: "people" },
            { id: "button_color", label: "button_color" },
          ],
          targets: [
            { id: "needed", label: "予約モデルに必要" },
            { id: "not-needed", label: "モデルには不要寄り" },
          ],
          answers: [
            { targetId: "needed", itemIds: ["name", "date", "people"] },
            { targetId: "not-needed", itemIds: ["button_color"] },
          ],
          correctFeedback: "いい感じです。予約データとして必要な項目を選べています。",
          incorrectFeedback: "予約内容として残す項目か、見た目の設定かを分けましょう。",
        }),
        choice({
          id: "data-model-a06-unneeded-choice",
          order: 6,
          sectionOrder: 3,
          title: "不要な項目を判断しよう",
          instruction: "予約モデルに入れる必要が低い項目を選びましょう。",
          mentorMessage: "モデルには、あとから使うデータを中心に入れます。",
          question: "予約モデルの項目として必要性が低いものはどれ？",
          choices: [
            { id: "data-model-a06-wrong-name", label: "name", isCorrect: false, feedback: "惜しいです。予約者名は必要な項目です。" },
            { id: "data-model-a06-wrong-date", label: "date", isCorrect: false, feedback: "惜しいです。予約日は必要な項目です。" },
            { id: "data-model-a06-wrong-people", label: "people", isCorrect: false, feedback: "惜しいです。人数は必要な項目です。" },
            { id: "data-model-a06-correct", label: "card_shadow", isCorrect: true, feedback: "その通りです。カードの影は見た目の設定で、予約モデルに入れる必要は低いです。" },
          ],
        }),
      ],
    },
    {
      id: "data-model-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "data-model-c01-fields-check",
          order: 7,
          sectionOrder: 1,
          title: "予約モデルの項目を確認しよう",
          instruction: "予約モデルの項目を意味に対応づけましょう。",
          mentorMessage: "モデルの基本項目を確認します。",
          items: [
            { id: "name", label: "name" },
            { id: "date", label: "date" },
            { id: "people", label: "people" },
          ],
          targets: [
            { id: "who", label: "誰の予約か" },
            { id: "when", label: "いつの予約か" },
            { id: "count", label: "何人の予約か" },
          ],
          answers: [
            { targetId: "who", itemIds: ["name"] },
            { targetId: "when", itemIds: ["date"] },
            { targetId: "count", itemIds: ["people"] },
          ],
          correctFeedback: "OKです。予約モデルの項目を整理できています。",
          incorrectFeedback: "name、date、peopleの意味を確認しましょう。",
          isMissionCheck: true,
        }),
        choice({
          id: "data-model-c02-model-table-check",
          order: 8,
          sectionOrder: 2,
          title: "モデルとテーブルの関係を選ぼう",
          instruction: "モデルとテーブルの関係として自然なものを選びましょう。",
          mentorMessage: "アプリ内のデータの形とDBの保存先をつなげて考えます。",
          question: "モデルとテーブルの関係として近いものはどれ？",
          choices: [
            { id: "data-model-c02-correct", label: "モデルの項目はDBテーブルの列と対応して考えられる", isCorrect: true, feedback: "OKです。モデルの項目とDBの列を対応させると整理しやすいです。" },
            { id: "data-model-c02-wrong-css", label: "モデルはCSSの色だけを決める", isCorrect: false, feedback: "惜しいです。モデルはデータの形を決める考え方です。" },
            { id: "data-model-c02-wrong-html", label: "テーブルはHTMLのh1だけを表す", isCorrect: false, feedback: "惜しいです。ここでのテーブルはDBの表です。" },
            { id: "data-model-c02-wrong-api", label: "モデルは必ず外部APIだけを表す", isCorrect: false, feedback: "惜しいです。モデルはアプリ内のデータの形です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const saveInputMission: MissionSeed = {
  id: "db-save-input",
  title: "入力データを保存する",
  description: "フォームから受け取った値をDBに登録する流れを理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/db-save-input.png",
  estimatedMinutes: 12,
  order: 5,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 130,
  learnedItems: ["フォームから入力値を受け取る", "受け取った値を保存データにする", "DB登録後に一覧へ移動する流れを理解する"],
  isPublished: true,
  sections: [
    {
      id: "save-input-form-section",
      title: "form から受け取る",
      description: "Course4で学んだ入力受け取りを、保存処理につなげます。",
      order: 1,
      activities: [
        tutorial({
          id: "save-input-a01-review-receive",
          order: 1,
          sectionOrder: 1,
          title: "入力値を受け取る処理を復習する",
          mentorMessage: "DBに保存する前に、まずフォームから送られた値をサーバで受け取る必要があります。",
          body: [
            "フォームの input name=\"name\" で送った値は、サーバ側で request.form[\"name\"] のように受け取れます。",
            "日付や人数も同じように、name属性に対応する名前で取り出します。",
            "保存処理は、この受け取った値をもとに行います。",
          ].join("\n\n"),
          summary: ["保存の前に入力を受け取る", "name属性とrequest.formを対応させる"],
        }),
        orderedSteps({
          id: "save-input-a02-save-data-order",
          order: 2,
          sectionOrder: 2,
          title: "受け取った値を保存データにする流れ",
          instruction: "フォーム入力を保存データにする流れを並べましょう。",
          mentorMessage: "入力、受け取り、保存用データ作成の順で考えます。",
          steps: [
            { id: "input", label: "ユーザーがフォームに入力する" },
            { id: "submit", label: "送信ボタンを押す" },
            { id: "receive", label: "request.formで値を受け取る" },
            { id: "make-data", label: "予約データとしてまとめる" },
          ],
          answerOrder: ["input", "submit", "receive", "make-data"],
          correctFeedback: "いい流れです。保存処理の前に、入力を受け取ってデータとしてまとめます。",
          incorrectFeedback: "まず入力して送信し、その後サーバ側で値を受け取ります。",
        }),
        match({
          id: "save-input-a03-name-column-match",
          order: 3,
          sectionOrder: 3,
          title: "name と列名の対応を確認しよう",
          instruction: "フォームのname属性をDB列に対応づけましょう。",
          mentorMessage: "どの入力値をどの列に保存するかを確認します。",
          items: [
            { id: "form-name", label: "name=\"name\"" },
            { id: "form-date", label: "name=\"date\"" },
            { id: "form-people", label: "name=\"people\"" },
          ],
          targets: [
            { id: "db-name", label: "name列" },
            { id: "db-date", label: "date列" },
            { id: "db-people", label: "people列" },
          ],
          answers: [
            { targetId: "db-name", itemIds: ["form-name"] },
            { targetId: "db-date", itemIds: ["form-date"] },
            { targetId: "db-people", itemIds: ["form-people"] },
          ],
          correctFeedback: "よくできています。入力名と保存先の列を対応づけられています。",
          incorrectFeedback: "同じ意味を持つ項目どうしを対応させましょう。",
        }),
      ],
    },
    {
      id: "save-input-db-section",
      title: "DBへ登録する",
      description: "受け取ったデータをDBへ登録し、保存後の流れを整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "save-input-a04-db-position",
          order: 4,
          sectionOrder: 1,
          title: "DB登録はサーバ側の処理で行う",
          mentorMessage: "DBへ登録する処理は、ブラウザではなくサーバ側で行います。ユーザーはフォームを送信し、サーバが受け取ってDBに保存します。",
          body: [
            "ユーザーが入力した値は、POST送信でサーバへ届きます。",
            "サーバは request.form で値を受け取り、予約データとしてDBに登録します。",
            "登録後は、予約一覧画面へ移動すると、保存できたことを確認しやすくなります。",
          ].join("\n\n"),
          summary: ["DB登録はサーバ側", "保存後は一覧に移動すると確認しやすい"],
          visual: course5Visuals.saveFlow,
        }),
        orderedSteps({
          id: "save-input-a05-save-order",
          order: 5,
          sectionOrder: 2,
          title: "保存処理の順番を並べよう",
          instruction: "フォーム送信からDB登録までの流れを正しい順番に並べましょう。",
          mentorMessage: "入力から保存完了までを順番で確認します。",
          steps: [
            { id: "input", label: "フォームに入力する" },
            { id: "post", label: "POSTでサーバへ送る" },
            { id: "receive", label: "request.formで値を受け取る" },
            { id: "save", label: "DBへ登録する" },
            { id: "redirect", label: "一覧画面へ移動する" },
          ],
          answerOrder: ["input", "post", "receive", "save", "redirect"],
          correctFeedback: "いい流れです。入力、送信、受け取り、保存、一覧確認の順で考えられています。",
          incorrectFeedback: "まず入力と送信、その後サーバ側で受け取り、DBに保存します。",
        }),
        choice({
          id: "save-input-a06-after-save-choice",
          order: 6,
          sectionOrder: 3,
          title: "保存後に一覧へ移動する理由は？",
          instruction: "保存後に一覧画面へ移動する理由として自然なものを選びましょう。",
          mentorMessage: "保存できたデータを確認できる画面に進むと、ユーザーにも伝わりやすいです。",
          question: "予約保存後に一覧画面へ移動する理由として自然なのはどれ？",
          choices: [
            { id: "save-input-a06-correct", label: "保存された予約を確認しやすくするため", isCorrect: true, feedback: "その通りです。一覧に移動すると、登録された予約を確認できます。" },
            { id: "save-input-a06-wrong-color", label: "ボタンの色を必ず変えるため", isCorrect: false, feedback: "惜しいです。保存後の移動は見た目の色変更が目的ではありません。" },
            { id: "save-input-a06-wrong-delete", label: "保存したデータをすぐ消すため", isCorrect: false, feedback: "惜しいです。保存後はまず確認できるとよいです。" },
            { id: "save-input-a06-wrong-api", label: "必ず外部APIを呼ぶため", isCorrect: false, feedback: "惜しいです。予約保存だけなら外部APIは必須ではありません。" },
          ],
        }),
      ],
    },
    {
      id: "save-input-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "save-input-c01-save-order-check",
          order: 7,
          sectionOrder: 1,
          title: "保存処理の順番を確認しよう",
          instruction: "入力からDB登録までを並べましょう。",
          mentorMessage: "保存処理の全体順を確認します。",
          steps: [
            { id: "input", label: "フォームに入力する" },
            { id: "post", label: "POSTで送信する" },
            { id: "receive", label: "サーバで値を受け取る" },
            { id: "save", label: "DBへ登録する" },
            { id: "list", label: "一覧画面で確認する" },
          ],
          answerOrder: ["input", "post", "receive", "save", "list"],
          correctFeedback: "OKです。入力からDB登録までの流れを整理できています。",
          incorrectFeedback: "入力、送信、受け取り、保存、確認の順で考えましょう。",
          isMissionCheck: true,
        }),
        match({
          id: "save-input-c02-flow-check",
          order: 8,
          sectionOrder: 2,
          title: "入力からDB登録までを完成させよう",
          instruction: "それぞれの処理を担当に対応づけましょう。",
          mentorMessage: "画面、サーバ、DBの役割を確認します。",
          items: [
            { id: "form", label: "入力フォームを表示する" },
            { id: "receive", label: "request.formで受け取る" },
            { id: "insert", label: "DBへ登録する" },
          ],
          targets: [
            { id: "screen", label: "画面側" },
            { id: "server", label: "サーバ側" },
            { id: "db", label: "DB側" },
          ],
          answers: [
            { targetId: "screen", itemIds: ["form"] },
            { targetId: "server", itemIds: ["receive"] },
            { targetId: "db", itemIds: ["insert"] },
          ],
          correctFeedback: "OKです。入力からDB登録までの担当を分けられています。",
          incorrectFeedback: "フォームは画面、受け取りはサーバ、登録はDB側です。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const fetchDataMission: MissionSeed = {
  id: "db-fetch-data",
  title: "保存したデータを取り出す",
  description: "DBから保存済みデータを取り出し、テンプレートへ渡す流れを理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/db-fetch-data.png",
  estimatedMinutes: 12,
  order: 6,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 130,
  learnedItems: ["DBから保存済みデータを取得する", "複数件のデータを扱う", "取得結果をテンプレートへ渡す"],
  isPublished: true,
  sections: [
    {
      id: "fetch-data-all-section",
      title: "全件取得の考え方",
      description: "保存された予約をまとめて取り出す考え方を学びます。",
      order: 1,
      activities: [
        tutorial({
          id: "fetch-data-a01-all-intro",
          order: 1,
          sectionOrder: 1,
          title: "保存された予約を全部取り出す",
          mentorMessage: "一覧画面を作るには、DBに保存されている予約データを取り出して画面へ渡す必要があります。",
          body: [
            "予約一覧では、保存された予約を1件だけでなく、複数件まとめて表示することが多いです。",
            "サーバ側でDBから全件取得し、その結果をテンプレートへ渡します。",
            "テンプレート側では、受け取った予約一覧を表やカードとして表示します。",
          ].join("\n\n"),
          summary: ["一覧画面では複数件を取得する", "サーバがDBから取り出す", "テンプレートへ渡して表示する"],
          visual: course5Visuals.fetchFlow,
        }),
        choice({
          id: "fetch-data-a02-multiple-choice",
          order: 2,
          sectionOrder: 2,
          title: "取得結果が複数件になる場面は？",
          instruction: "DBから複数件取り出す場面として自然なものを選びましょう。",
          mentorMessage: "一覧画面では、複数の保存データを扱うことが多いです。",
          question: "予約一覧画面でDBから取り出すものとして自然なのはどれ？",
          choices: [
            { id: "fetch-data-a02-correct", label: "保存済みの予約データを複数件取り出す", isCorrect: true, feedback: "その通りです。一覧画面では複数件の予約を表示することが多いです。" },
            { id: "fetch-data-a02-wrong-css", label: "CSSの文字色だけを取り出す", isCorrect: false, feedback: "惜しいです。予約一覧で扱うのは保存された予約データです。" },
            { id: "fetch-data-a02-wrong-title", label: "ページタイトルだけを取り出す", isCorrect: false, feedback: "惜しいです。タイトルではなく、予約データを取り出します。" },
            { id: "fetch-data-a02-wrong-keyboard", label: "キーボード配列を取り出す", isCorrect: false, feedback: "惜しいです。予約アプリのDBデータとは関係が薄いです。" },
          ],
        }),
        match({
          id: "fetch-data-a03-variable-match",
          order: 3,
          sectionOrder: 3,
          title: "取り出したデータを変数に入れよう",
          instruction: "変数名と入れるデータを対応づけましょう。",
          mentorMessage: "取得結果を分かりやすい変数名で持つと、テンプレートへ渡しやすくなります。",
          items: [
            { id: "reservations", label: "reservations" },
            { id: "reservation", label: "reservation" },
            { id: "count", label: "count" },
          ],
          targets: [
            { id: "many", label: "複数件の予約一覧" },
            { id: "one", label: "1件の予約" },
            { id: "number", label: "件数" },
          ],
          answers: [
            { targetId: "many", itemIds: ["reservations"] },
            { targetId: "one", itemIds: ["reservation"] },
            { targetId: "number", itemIds: ["count"] },
          ],
          correctFeedback: "いい感じです。複数形の変数名と1件分の変数名を分けられています。",
          incorrectFeedback: "reservationsは複数件、reservationは1件として考えると分かりやすいです。",
        }),
      ],
    },
    {
      id: "fetch-data-template-section",
      title: "template に渡す",
      description: "取得したデータを画面側で使えるように渡します。",
      order: 2,
      activities: [
        tutorial({
          id: "fetch-data-a04-template-intro",
          order: 4,
          sectionOrder: 1,
          title: "取得結果をテンプレートへ渡す",
          mentorMessage: "DBから取り出しただけでは、まだブラウザには表示されません。テンプレートへ渡して、HTML側で使えるようにします。",
          body: [
            "サーバ側で reservations という変数に予約一覧を入れたら、render_templateでテンプレートへ渡します。",
            "HTML側では、渡された reservations を使って予約一覧を表示します。",
            "この流れで、DBの中身がブラウザ上の一覧画面になります。",
          ].join("\n\n"),
          summary: ["DBから取得する", "テンプレートへ渡す", "HTML側で一覧表示する"],
        }),
        choice({
          id: "fetch-data-a05-template-name-choice",
          order: 5,
          sectionOrder: 2,
          title: "画面側で使う変数名は？",
          instruction: "テンプレートで予約一覧として使いやすい変数名を選びましょう。",
          mentorMessage: "複数件の予約を表すなら、複数形の名前が分かりやすいです。",
          question: "予約一覧をテンプレートへ渡す変数名として自然なのはどれ？",
          choices: [
            { id: "fetch-data-a05-correct", label: "reservations", isCorrect: true, feedback: "その通りです。複数件の予約一覧として分かりやすい名前です。" },
            { id: "fetch-data-a05-wrong-color", label: "buttonColor", isCorrect: false, feedback: "惜しいです。ボタン色ではなく予約一覧を表す名前が自然です。" },
            { id: "fetch-data-a05-wrong-title", label: "pageTitleOnly", isCorrect: false, feedback: "惜しいです。予約一覧を表す名前ではありません。" },
            { id: "fetch-data-a05-wrong-css", label: "cssFile", isCorrect: false, feedback: "惜しいです。CSSファイルではなく予約データです。" },
          ],
        }),
        orderedSteps({
          id: "fetch-data-a06-display-order",
          order: 6,
          sectionOrder: 3,
          title: "取得から表示までを並べよう",
          instruction: "DBから取り出して画面に表示するまでの流れを並べましょう。",
          mentorMessage: "DB、サーバ、テンプレート、ブラウザの順で流れを追います。",
          steps: [
            { id: "db", label: "DBに予約データが保存されている" },
            { id: "fetch", label: "サーバがDBから予約一覧を取得する" },
            { id: "pass", label: "取得結果をテンプレートへ渡す" },
            { id: "render", label: "HTMLとして一覧を表示する" },
          ],
          answerOrder: ["db", "fetch", "pass", "render"],
          correctFeedback: "いい流れです。保存済みデータを取り出して、テンプレートを通して表示します。",
          incorrectFeedback: "まずDBにあるデータをサーバで取得し、それをテンプレートへ渡します。",
        }),
      ],
    },
    {
      id: "fetch-data-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "fetch-data-c01-flow-check",
          order: 7,
          sectionOrder: 1,
          title: "取得から表示までの流れを確認しよう",
          instruction: "DBから取り出して一覧表示するまでを並べましょう。",
          mentorMessage: "一覧画面の基本の流れを確認します。",
          steps: [
            { id: "saved", label: "DBに保存済みデータがある" },
            { id: "get", label: "サーバがデータを取得する" },
            { id: "template", label: "テンプレートへ渡す" },
            { id: "show", label: "ブラウザで一覧表示する" },
          ],
          answerOrder: ["saved", "get", "template", "show"],
          correctFeedback: "OKです。取得から表示までの流れを整理できています。",
          incorrectFeedback: "DBから取得し、テンプレートへ渡して表示します。",
          isMissionCheck: true,
        }),
        choice({
          id: "fetch-data-c02-use-check",
          order: 8,
          sectionOrder: 2,
          title: "DBから取り出したデータの使い方",
          instruction: "DBから取り出した予約一覧の使い方として自然なものを選びましょう。",
          mentorMessage: "取り出したデータは、画面に表示してユーザーが確認できるようにします。",
          question: "DBから取り出した reservations の使い方として自然なのはどれ？",
          choices: [
            { id: "fetch-data-c02-correct", label: "テンプレートへ渡して一覧表示する", isCorrect: true, feedback: "OKです。予約一覧として画面に表示できます。" },
            { id: "fetch-data-c02-wrong-delete", label: "必ずすぐ削除する", isCorrect: false, feedback: "惜しいです。まず一覧表示に使うのが自然です。" },
            { id: "fetch-data-c02-wrong-css", label: "CSSの色名として使う", isCorrect: false, feedback: "惜しいです。予約データは表示内容として使います。" },
            { id: "fetch-data-c02-wrong-key", label: "APIキーとして公開する", isCorrect: false, feedback: "惜しいです。予約一覧はAPIキーではありません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const listScreenMission: MissionSeed = {
  id: "db-list-screen",
  title: "一覧画面を作る",
  description: "保存したデータをtableやcardで見やすく一覧表示します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/db-list-screen.png",
  estimatedMinutes: 13,
  order: 7,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 130,
  learnedItems: ["tableで一覧を表示する", "cardで1件ずつ表示する", "表示形式の向き不向きを判断する"],
  isPublished: true,
  sections: [
    {
      id: "list-screen-table-section",
      title: "table 表示",
      description: "予約一覧を表として表示する考え方を復習します。",
      order: 1,
      activities: [
        tutorial({
          id: "list-screen-a01-table-intro",
          order: 1,
          sectionOrder: 1,
          title: "予約一覧はtableで見せやすい",
          mentorMessage: "名前、日付、人数のように同じ項目を持つデータは、tableで表示すると比較しやすくなります。",
          body: [
            "tableでは、1行を1件の予約として表示できます。",
            "thは見出し、tdは各データの値、trは1行を表します。",
            "予約一覧のように列が決まっているデータは、table表示と相性がよいです。",
          ].join("\n\n"),
          summary: ["trは1行", "thは見出し", "tdは値"],
          visual: course5Visuals.listViewTypes,
        }),
        match({
          id: "list-screen-a02-table-tag-match",
          order: 2,
          sectionOrder: 2,
          title: "tr, th, td を復習しよう",
          instruction: "tableタグの役割を対応づけましょう。",
          mentorMessage: "Course3の表の知識を、保存データの一覧表示に使います。",
          items: [
            { id: "tr", label: "tr" },
            { id: "th", label: "th" },
            { id: "td", label: "td" },
          ],
          targets: [
            { id: "row", label: "表の1行" },
            { id: "header", label: "列の見出し" },
            { id: "data", label: "実際の値" },
          ],
          answers: [
            { targetId: "row", itemIds: ["tr"] },
            { targetId: "header", itemIds: ["th"] },
            { targetId: "data", itemIds: ["td"] },
          ],
          correctFeedback: "よくできています。tableの基本タグを一覧表示に使えます。",
          incorrectFeedback: "trは行、thは見出し、tdはデータの値です。",
        }),
        choice({
          id: "list-screen-a03-column-choice",
          order: 3,
          sectionOrder: 3,
          title: "予約一覧に必要な列は？",
          instruction: "予約一覧の列として自然なものを選びましょう。",
          mentorMessage: "一覧で確認したい情報を列にします。",
          question: "予約一覧の列として自然なのはどれ？",
          choices: [
            { id: "list-screen-a03-correct", label: "名前・日付・人数", isCorrect: true, feedback: "その通りです。予約一覧で確認したい基本項目です。" },
            { id: "list-screen-a03-wrong-css", label: "文字色・角丸・影", isCorrect: false, feedback: "惜しいです。これは見た目の設定です。" },
            { id: "list-screen-a03-wrong-device", label: "机・椅子・照明", isCorrect: false, feedback: "惜しいです。予約一覧の列としては不自然です。" },
            { id: "list-screen-a03-wrong-hover", label: "ホバー・アニメーション・余白", isCorrect: false, feedback: "惜しいです。一覧のデータ列ではありません。" },
          ],
        }),
      ],
    },
    {
      id: "list-screen-card-section",
      title: "card 表示",
      description: "1件の予約をカードで表示する考え方を学びます。",
      order: 2,
      activities: [
        tutorial({
          id: "list-screen-a04-card-intro",
          order: 4,
          sectionOrder: 1,
          title: "カード表示は1件ずつ読みやすい",
          mentorMessage: "予約1件をカードとして表示すると、スマホでも読みやすく、情報のまとまりが見えやすくなります。",
          body: [
            "カード表示では、1件の予約を1つのまとまりとして見せます。",
            "名前、日付、人数をカードの中に並べると、1件ごとの情報が読みやすくなります。",
            "件数が多い場合はtable、スマホや見やすさ重視ならcardのように使い分けます。",
          ].join("\n\n"),
          summary: ["cardは1件ごとのまとまり", "スマホで読みやすい", "tableと使い分ける"],
        }),
        choice({
          id: "list-screen-a05-table-card-choice",
          order: 5,
          sectionOrder: 2,
          title: "table と card の向き不向き",
          instruction: "card表示が向いている場面を選びましょう。",
          mentorMessage: "情報を比較したいか、1件ずつ読みたいかで考えます。",
          question: "card表示が向いている場面として自然なのはどれ？",
          choices: [
            { id: "list-screen-a05-correct", label: "スマホで1件ずつ予約内容を読みやすく見せたい", isCorrect: true, feedback: "その通りです。cardは1件ずつ読みやすく見せたい場面に向いています。" },
            { id: "list-screen-a05-wrong-many", label: "100件を細かく列で比較したい", isCorrect: false, feedback: "惜しいです。列で比較したいならtableが向いています。" },
            { id: "list-screen-a05-wrong-css", label: "CSSファイルを読み込みたい", isCorrect: false, feedback: "惜しいです。表示形式の向き不向きとは少し違います。" },
            { id: "list-screen-a05-wrong-db", label: "DBの列名だけを変更したい", isCorrect: false, feedback: "惜しいです。card表示の話ではありません。" },
          ],
        }),
        match({
          id: "list-screen-a06-html-match",
          order: 6,
          sectionOrder: 3,
          title: "一覧表示のHTMLを考えよう",
          instruction: "一覧表示の部品を役割に対応づけましょう。",
          mentorMessage: "HTMLの部品が何を表示しているか考えます。",
          items: [
            { id: "table", label: "table" },
            { id: "card", label: "div class=\"reservation-card\"" },
            { id: "loop", label: "予約の数だけ繰り返す部分" },
          ],
          targets: [
            { id: "grid", label: "表として表示" },
            { id: "one", label: "1件をカードで表示" },
            { id: "many", label: "複数件を表示" },
          ],
          answers: [
            { targetId: "grid", itemIds: ["table"] },
            { targetId: "one", itemIds: ["card"] },
            { targetId: "many", itemIds: ["loop"] },
          ],
          correctFeedback: "いい感じです。一覧画面のHTML部品と役割を整理できています。",
          incorrectFeedback: "tableは表、cardは1件、繰り返しは複数件表示に関係します。",
        }),
      ],
    },
    {
      id: "list-screen-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "list-screen-c01-html-check",
          order: 7,
          sectionOrder: 1,
          title: "予約一覧HTMLを確認しよう",
          instruction: "table表示のタグを役割に対応づけましょう。",
          mentorMessage: "保存データの一覧表示に必要なHTMLを確認します。",
          items: [
            { id: "tr", label: "tr" },
            { id: "th", label: "th" },
            { id: "td", label: "td" },
          ],
          targets: [
            { id: "row", label: "1行" },
            { id: "header", label: "見出し" },
            { id: "value", label: "値" },
          ],
          answers: [
            { targetId: "row", itemIds: ["tr"] },
            { targetId: "header", itemIds: ["th"] },
            { targetId: "value", itemIds: ["td"] },
          ],
          correctFeedback: "OKです。予約一覧HTMLの基本を確認できています。",
          incorrectFeedback: "tr, th, td の役割を復習しましょう。",
          isMissionCheck: true,
        }),
        choice({
          id: "list-screen-c02-type-check",
          order: 8,
          sectionOrder: 2,
          title: "表示形式を選ぼう",
          instruction: "table表示とcard表示の使い分けとして自然なものを選びましょう。",
          mentorMessage: "一覧性と読みやすさのどちらを重視するかで考えます。",
          question: "table表示が特に向いている場面はどれ？",
          choices: [
            { id: "list-screen-c02-correct", label: "名前・日付・人数を列で比較したい", isCorrect: true, feedback: "OKです。列で比較したい場合はtableが向いています。" },
            { id: "list-screen-c02-wrong-one", label: "1件の内容を大きくカードで見せたい", isCorrect: false, feedback: "惜しいです。それはcard表示が向いています。" },
            { id: "list-screen-c02-wrong-css", label: "CSSファイルを保存したい", isCorrect: false, feedback: "惜しいです。表示形式の選択とは違います。" },
            { id: "list-screen-c02-wrong-api", label: "外部APIキーを隠したい", isCorrect: false, feedback: "惜しいです。これはAPI安全性の話です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const reservationBasicMission: MissionSeed = {
  id: "db-reservation-basic-flow",
  title: "予約サイトの基本形を説明する",
  description: "入力、保存、一覧の流れを画面・サーバ・DBに分解して説明できるようにします。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/db-reservation-basic-flow.png",
  estimatedMinutes: 12,
  order: 8,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 140,
  learnedItems: ["入力フォームから保存までの流れを説明する", "保存後に一覧表示する流れを説明する", "画面・サーバ・DBの役割に分解する"],
  isPublished: true,
  sections: [
    {
      id: "reservation-basic-review-section",
      title: "入力、保存、一覧を復習する",
      description: "予約サイトの中心になる3つの流れを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "reservation-basic-a01-review",
          order: 1,
          sectionOrder: 1,
          title: "予約サイトは入力・保存・一覧で考える",
          mentorMessage: "ここまで学んだ内容を、予約サイトの基本形としてまとめます。",
          body: [
            "予約サイトの最小機能は、予約を入力する、DBに保存する、保存済み予約を一覧で見る、という流れです。",
            "画面は入力フォームや一覧を表示し、サーバは入力を受け取ってDBとやり取りします。",
            "DBは予約データを保存し、必要なときに取り出します。",
          ].join("\n\n"),
          summary: ["入力する", "DBに保存する", "一覧で確認する"],
          visual: course5Visuals.reservationWholeFlow,
        }),
        orderedSteps({
          id: "reservation-basic-a02-save-list-order",
          order: 2,
          sectionOrder: 2,
          title: "保存後に一覧へ出る流れを並べよう",
          instruction: "予約入力から一覧表示までの流れを並べましょう。",
          mentorMessage: "予約サイト全体の中心になる流れです。",
          steps: [
            { id: "form", label: "フォームに予約を入力する" },
            { id: "receive", label: "サーバが入力を受け取る" },
            { id: "save", label: "DBに保存する" },
            { id: "fetch", label: "DBから予約一覧を取得する" },
            { id: "show", label: "一覧画面に表示する" },
          ],
          answerOrder: ["form", "receive", "save", "fetch", "show"],
          correctFeedback: "いい流れです。入力、保存、取得、一覧表示まで整理できています。",
          incorrectFeedback: "まず入力し、サーバが受け取り、DBに保存してから一覧表示します。",
        }),
        match({
          id: "reservation-basic-a03-db-use-match",
          order: 3,
          sectionOrder: 3,
          title: "どこでDBを使っている？",
          instruction: "予約サイトの処理を、DBを使う処理・使わない処理に分けましょう。",
          mentorMessage: "保存や取得はDBに関係します。見た目の表示だけならDBではありません。",
          items: [
            { id: "save", label: "予約を保存する" },
            { id: "fetch", label: "保存済み予約を取り出す" },
            { id: "button-color", label: "ボタンの色を変える" },
            { id: "heading", label: "見出しを表示する" },
          ],
          targets: [
            { id: "uses-db", label: "DBを使う" },
            { id: "no-db", label: "DBを使わない寄り" },
          ],
          answers: [
            { targetId: "uses-db", itemIds: ["save", "fetch"] },
            { targetId: "no-db", itemIds: ["button-color", "heading"] },
          ],
          correctFeedback: "よく整理できています。保存と取得がDBに関係します。",
          incorrectFeedback: "DBは保存と取り出しに関係します。見た目はHTML/CSS寄りです。",
        }),
      ],
    },
    {
      id: "reservation-basic-role-section",
      title: "画面/サーバ/DBに分ける",
      description: "予約サイトの処理を役割ごとに分類します。",
      order: 2,
      activities: [
        match({
          id: "reservation-basic-a04-role-match",
          order: 4,
          sectionOrder: 1,
          title: "予約サイトの処理を役割ごとに分けよう",
          instruction: "次の処理を、画面側・サーバ側・DB側に分けましょう。",
          mentorMessage: "どこで動いている処理かを考えます。",
          items: [
            { id: "show-form", label: "予約フォームを表示する" },
            { id: "receive", label: "入力値を受け取る" },
            { id: "save", label: "予約を保存する" },
            { id: "show-list", label: "予約一覧を表示する" },
          ],
          targets: [
            { id: "screen", label: "画面側" },
            { id: "server", label: "サーバ側" },
            { id: "db", label: "DB側" },
          ],
          answers: [
            { targetId: "screen", itemIds: ["show-form", "show-list"] },
            { targetId: "server", itemIds: ["receive"] },
            { targetId: "db", itemIds: ["save"] },
          ],
          correctFeedback: "いい感じです。画面、サーバ、DBの役割を分けられています。",
          incorrectFeedback: "フォームと一覧は画面、受け取りはサーバ、保存はDBです。",
        }),
        choice({
          id: "reservation-basic-a05-minimum-choice",
          order: 5,
          sectionOrder: 2,
          title: "最小の予約サイトに必要な機能は？",
          instruction: "最小の予約サイトとして必要な機能を選びましょう。",
          mentorMessage: "最初は入力、保存、一覧の基本形で十分です。",
          question: "予約サイトの最小機能として自然なのはどれ？",
          choices: [
            { id: "reservation-basic-a05-correct", label: "予約を入力し、DBに保存し、一覧で確認できる", isCorrect: true, feedback: "その通りです。予約サイトの中心機能を小さく作れています。" },
            { id: "reservation-basic-a05-wrong-all", label: "決済、AI推薦、通知、ランキングを全部入れる", isCorrect: false, feedback: "惜しいです。最初から全部入れると大きすぎます。" },
            { id: "reservation-basic-a05-wrong-color", label: "背景色だけを変える", isCorrect: false, feedback: "惜しいです。見た目だけでは予約サイトの中心機能になりません。" },
            { id: "reservation-basic-a05-wrong-logo", label: "ロゴだけを作る", isCorrect: false, feedback: "惜しいです。ロゴだけでは予約の入力や保存ができません。" },
          ],
        }),
      ],
    },
    {
      id: "reservation-basic-check-section",
      title: "Mission Check",
      description: "このMissionで学んだことを確認します。",
      order: 3,
      activities: [
        match({
          id: "reservation-basic-c01-role-check",
          order: 6,
          sectionOrder: 1,
          title: "予約サイトの処理を分解しよう",
          instruction: "処理を画面・サーバ・DBに分けましょう。",
          mentorMessage: "Course5全体のまとめです。",
          items: [
            { id: "form", label: "フォームを表示する" },
            { id: "request", label: "入力値を受け取る" },
            { id: "insert", label: "DBに登録する" },
            { id: "select", label: "DBから取得する" },
            { id: "list", label: "一覧を表示する" },
          ],
          targets: [
            { id: "screen", label: "画面" },
            { id: "server", label: "サーバ" },
            { id: "db", label: "DB" },
          ],
          answers: [
            { targetId: "screen", itemIds: ["form", "list"] },
            { targetId: "server", itemIds: ["request"] },
            { targetId: "db", itemIds: ["insert", "select"] },
          ],
          correctFeedback: "OKです。予約サイトの処理を役割ごとに分解できています。",
          incorrectFeedback: "画面表示、サーバ処理、DB保存・取得に分けて考えましょう。",
          isMissionCheck: true,
        }),
        orderedSteps({
          id: "reservation-basic-c02-whole-order-check",
          order: 7,
          sectionOrder: 2,
          title: "入力、保存、一覧の全体順を並べよう",
          instruction: "予約サイトの基本的な流れを並べましょう。",
          mentorMessage: "入力、保存、取得、表示の順番を確認します。",
          steps: [
            { id: "input", label: "フォームに入力する" },
            { id: "receive", label: "サーバが受け取る" },
            { id: "save", label: "DBに保存する" },
            { id: "fetch", label: "DBから取り出す" },
            { id: "show", label: "一覧に表示する" },
          ],
          answerOrder: ["input", "receive", "save", "fetch", "show"],
          correctFeedback: "OKです。予約サイトの基本形を順番で説明できています。",
          incorrectFeedback: "入力後に保存し、保存済みデータを取り出して一覧表示します。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const deleteReservationChallenge: MissionSeed = {
  id: "challenge-delete-reservation",
  title: "予約を削除する",
  description: "予約ごとのIDを使って、削除対象を指定する考え方を理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-delete-reservation.png",
  estimatedMinutes: 8,
  order: 9,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "db-list-screen",
  roadmapLane: 1,
  branchOrder: 1,
  rewardExp: 90,
  learnedItems: ["削除対象をIDで指定する", "削除ボタンから対象IDを送る", "一覧画面の操作とDB処理をつなげる"],
  isPublished: true,
  sections: [
    {
      id: "delete-reservation-section",
      title: "削除対象を指定する",
      description: "どの予約を削除するかをIDで指定します。",
      order: 1,
      activities: [
        tutorial({
          id: "delete-reservation-a01-id-intro",
          order: 1,
          sectionOrder: 1,
          title: "削除には対象を区別するIDが必要",
          mentorMessage: "予約一覧に複数の予約があるとき、どれを削除するかを正確に指定する必要があります。そのためにIDを使います。",
          body: [
            "同じ名前や同じ日付の予約が複数ある場合、名前だけでは削除対象を間違える可能性があります。",
            "各予約にIDがあると、削除したい1件を正確に指定できます。",
            "削除ボタンを押したときは、その予約のIDをサーバへ送ると考えます。",
          ].join("\n\n"),
          summary: ["IDで1件を区別する", "削除ボタンからIDを送る", "サーバが対象を削除する"],
        }),
        match({
          id: "delete-reservation-a02-button-id-match",
          order: 2,
          sectionOrder: 2,
          title: "削除ボタンからIDを送る考え方",
          instruction: "削除処理の部品を役割に対応づけましょう。",
          mentorMessage: "一覧画面のボタンとサーバ側の削除処理をつなげます。",
          items: [
            { id: "button", label: "削除ボタン" },
            { id: "id", label: "予約ID" },
            { id: "delete", label: "削除処理" },
          ],
          targets: [
            { id: "trigger", label: "操作のきっかけ" },
            { id: "target", label: "削除対象の指定" },
            { id: "server", label: "サーバ側で実行" },
          ],
          answers: [
            { targetId: "trigger", itemIds: ["button"] },
            { targetId: "target", itemIds: ["id"] },
            { targetId: "server", itemIds: ["delete"] },
          ],
          correctFeedback: "いい整理です。ボタン、ID、削除処理の関係を理解できています。",
          incorrectFeedback: "ボタンは操作、IDは対象指定、削除処理はサーバ側です。",
        }),
        choice({
          id: "delete-reservation-a03-target-choice",
          order: 3,
          sectionOrder: 3,
          title: "削除対象のIDを選ぼう",
          instruction: "どの情報を送れば削除対象を指定しやすいか選びましょう。",
          mentorMessage: "1件を正確に指定する情報に注目します。",
          question: "予約を1件だけ削除したいとき、サーバへ送る情報として特に重要なのはどれ？",
          choices: [
            { id: "delete-reservation-a03-correct", label: "削除したい予約のID", isCorrect: true, feedback: "その通りです。IDを送ると削除対象を正確に指定できます。" },
            { id: "delete-reservation-a03-wrong-color", label: "削除ボタンの色", isCorrect: false, feedback: "惜しいです。色では削除対象を指定できません。" },
            { id: "delete-reservation-a03-wrong-title", label: "ページタイトル", isCorrect: false, feedback: "惜しいです。ページタイトルではどの予約か分かりません。" },
            { id: "delete-reservation-a03-wrong-hover", label: "ホバー時の影", isCorrect: false, feedback: "惜しいです。見た目の効果では対象を指定できません。" },
          ],
        }),
        orderedSteps({
          id: "delete-reservation-c01-check",
          order: 4,
          sectionOrder: 4,
          title: "削除対象のIDを送る流れを完成させよう",
          instruction: "削除ボタンを押してDBから削除するまでを並べましょう。",
          mentorMessage: "Challengeの確認です。IDがどこで使われるかを意識しましょう。",
          steps: [
            { id: "show", label: "予約一覧に削除ボタンを表示する" },
            { id: "click", label: "削除したい予約のボタンを押す" },
            { id: "send-id", label: "予約IDをサーバへ送る" },
            { id: "delete", label: "サーバがDBから対象予約を削除する" },
            { id: "refresh", label: "一覧を更新する" },
          ],
          answerOrder: ["show", "click", "send-id", "delete", "refresh"],
          correctFeedback: "OKです。IDを使った削除の流れを整理できています。",
          incorrectFeedback: "一覧のボタン操作からIDを送り、サーバが対象を削除します。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const updateReservationChallenge: MissionSeed = {
  id: "challenge-update-reservation",
  title: "予約を更新する",
  description: "既存データをフォームに表示し、編集後に更新する流れを理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-update-reservation.png",
  estimatedMinutes: 8,
  order: 10,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "db-list-screen",
  roadmapLane: 1,
  branchOrder: 2,
  rewardExp: 90,
  learnedItems: ["編集フォームに既存データを表示する", "更新対象のIDを扱う", "編集後の値でDBを更新する"],
  isPublished: true,
  sections: [
    {
      id: "update-reservation-section",
      title: "編集フォームを使う",
      description: "既存データをフォームに表示し、編集後に更新します。",
      order: 1,
      activities: [
        tutorial({
          id: "update-reservation-a01-edit-form",
          order: 1,
          sectionOrder: 1,
          title: "編集フォームには既存データを入れておく",
          mentorMessage: "予約を更新するときは、空のフォームではなく、今保存されている値をフォームに入れておくと編集しやすくなります。",
          body: [
            "予約者名や日付を変更するには、まず現在の予約データを取り出します。",
            "その値を編集フォームに表示し、ユーザーが必要な部分だけ変更します。",
            "送信後は、同じ予約IDのデータを新しい値で更新します。",
          ].join("\n\n"),
          summary: ["既存データをフォームに表示", "変更後の値を送信", "IDで同じ予約を更新"],
        }),
        orderedSteps({
          id: "update-reservation-a02-update-order",
          order: 2,
          sectionOrder: 2,
          title: "編集後に更新処理へ送る流れ",
          instruction: "予約を編集して更新する流れを並べましょう。",
          mentorMessage: "取得、表示、編集、更新の順で考えます。",
          steps: [
            { id: "fetch", label: "編集したい予約をIDで取得する" },
            { id: "show", label: "既存データをフォームに表示する" },
            { id: "edit", label: "ユーザーが内容を編集する" },
            { id: "send", label: "変更後の値を送信する" },
            { id: "update", label: "DBの対象予約を更新する" },
          ],
          answerOrder: ["fetch", "show", "edit", "send", "update"],
          correctFeedback: "いい流れです。編集フォームと更新処理のつながりを整理できています。",
          incorrectFeedback: "まず既存データを取得して表示し、編集後に送信して更新します。",
        }),
        choice({
          id: "update-reservation-a03-id-reason-choice",
          order: 3,
          sectionOrder: 3,
          title: "更新対象のIDを扱う理由",
          instruction: "更新でIDが必要な理由を選びましょう。",
          mentorMessage: "どの予約を変更するのかを正確に指定する必要があります。",
          question: "予約更新でIDが必要な理由として自然なのはどれ？",
          choices: [
            { id: "update-reservation-a03-correct", label: "どの予約を更新するかを指定するため", isCorrect: true, feedback: "その通りです。IDがあると更新対象を正確に指定できます。" },
            { id: "update-reservation-a03-wrong-color", label: "フォームの色を決めるため", isCorrect: false, feedback: "惜しいです。IDは見た目ではなく対象指定に使います。" },
            { id: "update-reservation-a03-wrong-font", label: "文字サイズを変えるため", isCorrect: false, feedback: "惜しいです。文字サイズはCSSの話です。" },
            { id: "update-reservation-a03-wrong-api", label: "必ず外部APIを呼ぶため", isCorrect: false, feedback: "惜しいです。更新対象の指定にIDを使います。" },
          ],
        }),
        orderedSteps({
          id: "update-reservation-c01-check",
          order: 4,
          sectionOrder: 4,
          title: "編集フォームと更新処理の流れを並べよう",
          instruction: "予約更新の流れを正しい順番に並べましょう。",
          mentorMessage: "Challengeの確認です。既存データを使う点に注目しましょう。",
          steps: [
            { id: "get", label: "対象予約を取得する" },
            { id: "form", label: "編集フォームに表示する" },
            { id: "submit", label: "変更後の値を送信する" },
            { id: "update", label: "DBを更新する" },
            { id: "list", label: "一覧で確認する" },
          ],
          answerOrder: ["get", "form", "submit", "update", "list"],
          correctFeedback: "OKです。更新処理の流れを整理できています。",
          incorrectFeedback: "取得、表示、編集送信、更新、確認の順で考えましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const filterReservationChallenge: MissionSeed = {
  id: "challenge-filter-reservation",
  title: "条件で絞り込む",
  description: "日付や名前で条件に合う予約だけを表示する考え方を理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-filter-reservation.png",
  estimatedMinutes: 8,
  order: 11,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "db-fetch-data",
  roadmapLane: 1,
  branchOrder: 3,
  rewardExp: 90,
  learnedItems: ["検索条件を考える", "条件に合うデータだけ取得する", "絞り込み条件を選ぶ"],
  isPublished: true,
  sections: [
    {
      id: "filter-reservation-section",
      title: "検索条件を考える",
      description: "日付や名前など、絞り込みに使う条件を考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "filter-reservation-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "条件に合う予約だけ表示する",
          mentorMessage: "予約が増えると、すべてを一覧表示するだけでは探しにくくなります。日付や名前で絞り込むと、必要なデータを見つけやすくなります。",
          body: [
            "たとえば、7月1日の予約だけを見たい場合は、date が 7月1日 の予約だけを取得します。",
            "田中さんの予約だけを探したい場合は、name が 田中 の予約に絞ります。",
            "条件で絞り込むことで、一覧画面を使いやすくできます。",
          ].join("\n\n"),
          summary: ["条件に合う予約だけ表示する", "日付や名前で絞り込む", "一覧を探しやすくする"],
        }),
        choice({
          id: "filter-reservation-a02-condition-choice",
          order: 2,
          sectionOrder: 2,
          title: "条件に合う予約だけ表示する考え方",
          instruction: "日付で絞り込む条件として自然なものを選びましょう。",
          mentorMessage: "どの列を条件にするかを考えます。",
          question: "7月1日の予約だけを表示したいとき、条件として自然なのはどれ？",
          choices: [
            { id: "filter-reservation-a02-correct", label: "date が 7月1日 の予約を取り出す", isCorrect: true, feedback: "その通りです。日付で絞り込むならdate列を条件にします。" },
            { id: "filter-reservation-a02-wrong-color", label: "ボタン色が青の予約を取り出す", isCorrect: false, feedback: "惜しいです。予約日で絞り込みたいのでdateを見ます。" },
            { id: "filter-reservation-a02-wrong-font", label: "文字サイズが大きい予約を取り出す", isCorrect: false, feedback: "惜しいです。文字サイズは予約日とは関係ありません。" },
            { id: "filter-reservation-a02-wrong-title", label: "ページタイトルが長い予約を取り出す", isCorrect: false, feedback: "惜しいです。予約データのdate列を使います。" },
          ],
        }),
        match({
          id: "filter-reservation-a03-filter-match",
          order: 3,
          sectionOrder: 3,
          title: "絞り込み条件を選ぼう",
          instruction: "探したい内容を、使う列に対応づけましょう。",
          mentorMessage: "何で探したいかによって、条件に使う列が変わります。",
          items: [
            { id: "by-name", label: "田中さんの予約だけ見たい" },
            { id: "by-date", label: "7月1日の予約だけ見たい" },
            { id: "by-people", label: "3人以上の予約だけ見たい" },
          ],
          targets: [
            { id: "name", label: "name列" },
            { id: "date", label: "date列" },
            { id: "people", label: "people列" },
          ],
          answers: [
            { targetId: "name", itemIds: ["by-name"] },
            { targetId: "date", itemIds: ["by-date"] },
            { targetId: "people", itemIds: ["by-people"] },
          ],
          correctFeedback: "いい整理です。絞り込みたい内容と使う列を対応づけられています。",
          incorrectFeedback: "名前ならname、日付ならdate、人数ならpeopleを条件にします。",
        }),
        choice({
          id: "filter-reservation-c01-check",
          order: 4,
          sectionOrder: 4,
          title: "日付や名前で絞り込む条件を確認しよう",
          instruction: "名前で絞り込む条件として自然なものを選びましょう。",
          mentorMessage: "Challengeの確認です。使う列に注目しましょう。",
          question: "田中さんの予約だけを表示したいとき、条件として自然なのはどれ？",
          choices: [
            { id: "filter-reservation-c01-correct", label: "name が 田中 の予約を取り出す", isCorrect: true, feedback: "OKです。名前で絞り込むならname列を使います。" },
            { id: "filter-reservation-c01-wrong-date", label: "date が 田中 の予約を取り出す", isCorrect: false, feedback: "惜しいです。田中は日付ではなく名前です。" },
            { id: "filter-reservation-c01-wrong-people", label: "people が 田中 の予約を取り出す", isCorrect: false, feedback: "惜しいです。peopleは人数です。" },
            { id: "filter-reservation-c01-wrong-css", label: "button_color が 田中 の予約を取り出す", isCorrect: false, feedback: "惜しいです。見た目の色ではなくnameを使います。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const improveDbDesignChallenge: MissionSeed = {
  id: "challenge-improve-db-design",
  title: "DB設計を少し改善する",
  description: "必要な列と不要な列を判断し、1つの列に複数情報を入れない考え方を学びます。",
  difficulty: CourseDifficulty.HARD,
  goalImg: "/images/missions/challenge-improve-db-design.png",
  estimatedMinutes: 9,
  order: 12,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "db-reservation-basic-flow",
  roadmapLane: 1,
  branchOrder: 4,
  rewardExp: 100,
  learnedItems: ["必要な列と不要な列を判断する", "1つの列に複数情報を入れない", "予約アプリの列を見直す"],
  isPublished: true,
  sections: [
    {
      id: "improve-db-design-section",
      title: "列を見直す",
      description: "予約アプリのDB列をより扱いやすくする考え方を確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "improve-db-design-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "DBの列はあとから使いやすい形にする",
          mentorMessage: "DBの列は、ただ保存できればよいだけではなく、あとから検索・表示・更新しやすい形にしておくと扱いやすくなります。",
          body: [
            "たとえば、name_and_date という1つの列に名前と日付をまとめて入れると、日付だけで検索しにくくなります。",
            "name と date を別々の列にしておくと、名前でも日付でも条件を指定しやすくなります。",
            "必要な情報を、意味ごとに分けて列にすることが大切です。",
          ].join("\n\n"),
          summary: ["意味ごとに列を分ける", "検索や更新をしやすくする", "不要な列を増やしすぎない"],
        }),
        match({
          id: "improve-db-design-a02-needed-match",
          order: 2,
          sectionOrder: 2,
          title: "必要な列と不要な列を判断しよう",
          instruction: "予約アプリに必要な列と不要寄りの列を分けましょう。",
          mentorMessage: "予約データとしてあとから使う情報かどうかを考えます。",
          items: [
            { id: "name", label: "name" },
            { id: "date", label: "date" },
            { id: "people", label: "people" },
            { id: "button_shadow", label: "button_shadow" },
          ],
          targets: [
            { id: "needed", label: "必要な列" },
            { id: "unneeded", label: "不要寄りの列" },
          ],
          answers: [
            { targetId: "needed", itemIds: ["name", "date", "people"] },
            { targetId: "unneeded", itemIds: ["button_shadow"] },
          ],
          correctFeedback: "よくできています。予約データとして必要な列を選べています。",
          incorrectFeedback: "予約内容そのものか、見た目の設定かを分けましょう。",
        }),
        choice({
          id: "improve-db-design-a03-one-column-choice",
          order: 3,
          sectionOrder: 3,
          title: "1つの列に複数情報を入れない理由",
          instruction: "名前と日付を別々の列にする理由として自然なものを選びましょう。",
          mentorMessage: "あとから検索や更新をしやすいかを考えます。",
          question: "name と date を別々の列にする理由として自然なのはどれ？",
          choices: [
            { id: "improve-db-design-a03-correct", label: "名前だけ・日付だけで検索しやすくするため", isCorrect: true, feedback: "その通りです。意味ごとに列を分けると、検索や更新がしやすくなります。" },
            { id: "improve-db-design-a03-wrong-color", label: "背景色を必ず変えるため", isCorrect: false, feedback: "惜しいです。列を分ける理由は見た目ではなくデータの扱いやすさです。" },
            { id: "improve-db-design-a03-wrong-short", label: "ファイル名を短くするため", isCorrect: false, feedback: "惜しいです。DB列の設計とは違います。" },
            { id: "improve-db-design-a03-wrong-api", label: "必ず外部APIを使うため", isCorrect: false, feedback: "惜しいです。列の分け方はDB設計の話です。" },
          ],
        }),
        match({
          id: "improve-db-design-c01-check",
          order: 4,
          sectionOrder: 4,
          title: "予約アプリに必要な列を判断しよう",
          instruction: "予約アプリの列として必要なものと不要寄りのものを分けましょう。",
          mentorMessage: "Challengeの確認です。あとから使うデータを中心に選びます。",
          items: [
            { id: "name", label: "予約者名" },
            { id: "date", label: "予約日" },
            { id: "people", label: "人数" },
            { id: "gradient", label: "背景グラデーション" },
          ],
          targets: [
            { id: "needed", label: "必要な列" },
            { id: "not-needed", label: "不要寄り" },
          ],
          answers: [
            { targetId: "needed", itemIds: ["name", "date", "people"] },
            { targetId: "not-needed", itemIds: ["gradient"] },
          ],
          correctFeedback: "OKです。予約アプリに必要な列を判断できています。",
          incorrectFeedback: "予約内容としてあとから使う情報か、見た目の設定かを分けましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const dataStorageCourse: CourseSeed = {
  id: "data-storage",
  title: "データを保存して使う",
  description: "DBを使ってフォーム入力を保存し、保存したデータを一覧表示するWebアプリの基本を理解するコースです。",
  difficulty: CourseDifficulty.NORMAL,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.DATA, CourseCategoryType.TOOL],
  missions: [
    databaseReasonMission,
    dbTableMission,
    saveItemsMission,
    dataModelMission,
    saveInputMission,
    fetchDataMission,
    listScreenMission,
    reservationBasicMission,
    deleteReservationChallenge,
    updateReservationChallenge,
    filterReservationChallenge,
    improveDbDesignChallenge,
  ],
};

// Course 6 seed append
// 既存の learningSeed.ts の helper(tutorial / choice / match / orderedSteps) と型定義の後ろに追記する想定。
// Prisma enum前提: CourseCategoryType = GAME | ALGORITHM | TOOL | UI | DATA

const course6Visuals = {
  apiFlow: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "APIを使うときの流れ",
      caption: "自分のアプリだけで完結せず、サーバから外部サービスへ処理を依頼します。",
      nodes: [
        { id: "browser", label: "ブラウザ", description: "入力・表示", icon: "browser", tone: "blue" },
        { id: "server", label: "自分のサーバ", description: "依頼を中継する", icon: "server", tone: "orange" },
        { id: "api", label: "外部API", description: "天気・地図・AIなど", icon: "cloud", tone: "green" },
      ],
      edges: [
        { id: "browser-server", from: "browser", to: "server", label: "リクエスト", reverseLabel: "結果表示", bidirectional: true },
        { id: "server-api", from: "server", to: "api", label: "APIへ依頼", reverseLabel: "APIの返答", bidirectional: true },
      ],
    },
  }),
  jsonParts: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "JSONのkeyとvalue",
      caption: "JSONは、名前(key)と値(value)の組み合わせでデータを表します。",
      panels: [
        { id: "key", title: "key", subtitle: "取り出す名前", tone: "blue", items: ["weather", "temperature", "message"] },
        { id: "value", title: "value", subtitle: "実際の値", tone: "green", items: ["sunny", "24", "こんにちは"] },
      ],
    },
  }),
  aiInput: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "AIに送る情報の分け方",
      caption: "必要な情報だけを送り、個人情報や秘密情報は送らないようにします。",
      panels: [
        { id: "ok", title: "送ってよい", subtitle: "目的に必要", tone: "green", items: ["要約したい文章", "質問文", "出力形式の指定"] },
        { id: "ng", title: "送らない", subtitle: "秘密・個人情報", tone: "orange", items: ["パスワード", "APIキー", "個人を特定できる情報"] },
      ],
    },
  }),
  safeApiKey: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "APIキーはサーバ側で使う",
      caption: "ブラウザに秘密の鍵を置かず、サーバ側から外部APIを呼び出します。",
      nodes: [
        { id: "browser", label: "ブラウザ", description: "APIキーを持たない", icon: "browser", tone: "blue" },
        { id: "server", label: "サーバ", description: "APIキーを安全に扱う", icon: "server", tone: "orange" },
        { id: "api", label: "外部API", description: "キーで利用を確認", icon: "cloud", tone: "green" },
      ],
      edges: [
        { id: "browser-server", from: "browser", to: "server", label: "通常の送信" },
        { id: "server-api", from: "server", to: "api", label: "APIキー付きで依頼" },
      ],
    },
  }),
} as const;

const apiConceptMission: MissionSeed = {
  id: "api-concept",
  title: "APIとは何かを知る",
  description: "APIを、外部サービスへ処理を依頼する入口として理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/api-concept.png",
  estimatedMinutes: 10,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: ["APIは外部サービスへ依頼する入口", "自分のアプリだけでできない処理を外部に頼める", "ブラウザ・サーバ・外部APIの役割を分けて考える"],
  isPublished: true,
  sections: [
    {
      id: "api-concept-service-section",
      title: "外部サービスへ依頼する",
      description: "天気、地図、AIなどを例に、APIが必要になる場面を見ます。",
      order: 1,
      activities: [
        tutorial({
          id: "api-concept-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "APIは外部サービスへお願いする入口",
          mentorMessage: "Webアプリでは、自分のアプリだけではできない処理を外部サービスにお願いすることがあります。その入口になるのがAPIです。",
          body: [
            "たとえば、天気情報を取得したい、地図を表示したい、AIに文章を要約してほしい、といった場面があります。",
            "このような機能をすべて自分で作るのは大変です。そこで、外部サービスが用意しているAPIにリクエストを送り、結果を受け取ります。",
            "APIは、外部サービスの機能をWebアプリから使うための入口と考えると分かりやすいです。",
          ].join("\n\n"),
          summary: ["APIは外部サービスを使う入口", "天気・地図・AIなどで使われる", "依頼して結果を受け取る"],
        }),
        choice({
          id: "api-concept-a02-needed-choice",
          order: 2,
          sectionOrder: 2,
          title: "APIが必要になりやすい場面は？",
          instruction: "外部サービスの力を借りる場面を選びましょう。",
          mentorMessage: "自分のアプリの中だけで完結するか、外部サービスに依頼するかに注目しましょう。",
          question: "次のうち、APIを使う場面として考えやすいものはどれ？",
          choices: [
            { id: "api-concept-a02-correct", label: "天気サービスから今日の天気を取得する", isCorrect: true, feedback: "その通りです。外部の天気サービスから情報を受け取る場面ではAPIを使うことがあります。" },
            { id: "api-concept-a02-wrong-color", label: "CSSでボタンの色を青くする", isCorrect: false, feedback: "惜しいです。ボタンの色変更はCSSで行う見た目の調整です。" },
            { id: "api-concept-a02-wrong-heading", label: "HTMLで見出しを書く", isCorrect: false, feedback: "惜しいです。HTMLで画面の構造を書くこと自体は外部サービスへの依頼ではありません。" },
            { id: "api-concept-a02-wrong-margin", label: "カードの余白を広げる", isCorrect: false, feedback: "惜しいです。余白調整はCSSの役割です。" },
          ],
        }),
        match({
          id: "api-concept-a03-app-only-match",
          order: 3,
          sectionOrder: 3,
          title: "自分のアプリだけでできることと外部に頼ること",
          instruction: "次の機能を、自分のアプリ内でできること・外部サービスに頼りやすいことに分けましょう。",
          mentorMessage: "外部の最新情報やAI処理はAPIを使う候補になりやすいです。",
          items: [
            { id: "show-card", label: "カードの見た目を整える" },
            { id: "save-db", label: "入力内容をDBに保存する" },
            { id: "weather", label: "今日の天気を取得する" },
            { id: "ai-summary", label: "AIに文章を要約してもらう" },
          ],
          targets: [
            { id: "inside", label: "自分のアプリ内で扱いやすい" },
            { id: "external", label: "外部サービスに頼りやすい" },
          ],
          answers: [
            { targetId: "inside", itemIds: ["show-card", "save-db"] },
            { targetId: "external", itemIds: ["weather", "ai-summary"] },
          ],
          correctFeedback: "いい整理です。外部の情報やAI処理はAPIの候補になります。",
          incorrectFeedback: "見た目や保存は自分のアプリ内、天気やAI要約は外部サービスに頼りやすいです。",
        }),
      ],
    },
    {
      id: "api-concept-position-section",
      title: "アプリ、サーバ、外部APIの位置関係",
      description: "どこからどこへ依頼しているかを図で整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "api-concept-a04-flow",
          order: 4,
          sectionOrder: 1,
          title: "APIはサーバから呼び出すことが多い",
          mentorMessage: "APIを使う流れでは、ブラウザ、自分のサーバ、外部APIの3つを分けて考えると理解しやすいです。",
          body: [
            "ユーザーはブラウザから自分のアプリへ操作を送ります。",
            "自分のサーバは必要に応じて外部APIへ依頼し、その結果を受け取ります。",
            "最後に、自分のサーバが結果を画面へ返します。",
          ].join("\n\n"),
          summary: ["ブラウザは入力と表示", "サーバは外部APIへ依頼", "外部APIは結果を返す"],
          visual: course6Visuals.apiFlow,
        }),
        match({
          id: "api-concept-a05-position-match",
          order: 5,
          sectionOrder: 2,
          title: "どこが何をしている？",
          instruction: "APIを使う流れに出てくる役割を対応づけましょう。",
          mentorMessage: "ブラウザ、サーバ、外部APIの担当を分けます。",
          items: [
            { id: "input-display", label: "入力と結果表示" },
            { id: "call-api", label: "外部APIへ依頼する" },
            { id: "make-result", label: "依頼に対して結果を返す" },
          ],
          targets: [
            { id: "browser", label: "ブラウザ" },
            { id: "server", label: "自分のサーバ" },
            { id: "api", label: "外部API" },
          ],
          answers: [
            { targetId: "browser", itemIds: ["input-display"] },
            { targetId: "server", itemIds: ["call-api"] },
            { targetId: "api", itemIds: ["make-result"] },
          ],
          correctFeedback: "よくできています。APIを使う流れの役割を分けられています。",
          incorrectFeedback: "ブラウザは入力と表示、自分のサーバは外部APIへ依頼、外部APIは結果を返す役割です。",
        }),
        orderedSteps({
          id: "api-concept-a06-flow-order",
          order: 6,
          sectionOrder: 3,
          title: "APIの返答が画面に出るまで",
          instruction: "API結果が画面に表示されるまでの流れを並べましょう。",
          mentorMessage: "ユーザー操作から外部APIの結果表示までを順番に考えます。",
          steps: [
            { id: "user-input", label: "ユーザーがブラウザで操作する" },
            { id: "send-server", label: "ブラウザが自分のサーバへ送る" },
            { id: "call-api", label: "サーバが外部APIへ依頼する" },
            { id: "api-response", label: "外部APIが結果を返す" },
            { id: "show", label: "結果を画面に表示する" },
          ],
          answerOrder: ["user-input", "send-server", "call-api", "api-response", "show"],
          correctFeedback: "いい流れです。API結果は外部APIから返り、自分のサーバを通って画面に表示されます。",
          incorrectFeedback: "まずユーザー操作、その後に自分のサーバ、外部API、結果表示の順で考えます。",
        }),
      ],
    },
    {
      id: "api-concept-check-section",
      title: "Mission Check",
      description: "APIの基本的な考え方を確認します。",
      order: 3,
      activities: [
        choice({
          id: "api-concept-c01-needed-check",
          order: 7,
          sectionOrder: 1,
          title: "APIが必要な場面を選ぼう",
          instruction: "APIを使う場面として自然なものを選びましょう。",
          mentorMessage: "外部サービスへ依頼する場面を選びます。",
          question: "APIを使う場面として一番自然なのはどれ？",
          choices: [
            { id: "api-concept-c01-correct", label: "外部AIサービスに文章の要約を依頼する", isCorrect: true, feedback: "OKです。外部AIサービスへ依頼する場面ではAPIを使うことがあります。" },
            { id: "api-concept-c01-wrong-html", label: "h1タグで見出しを書く", isCorrect: false, feedback: "惜しいです。HTMLを書くこと自体はAPI利用ではありません。" },
            { id: "api-concept-c01-wrong-css", label: "CSSで余白を変える", isCorrect: false, feedback: "惜しいです。CSSの見た目調整はAPI利用ではありません。" },
            { id: "api-concept-c01-wrong-font", label: "フォントサイズを変える", isCorrect: false, feedback: "惜しいです。フォントサイズ変更はCSSで行います。" },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "api-concept-c02-role-check",
          order: 8,
          sectionOrder: 2,
          title: "アプリ、サーバ、外部APIを対応づけよう",
          instruction: "それぞれの役割を対応づけましょう。",
          mentorMessage: "APIを使うときの3者の関係を確認します。",
          items: [
            { id: "browser", label: "ブラウザ" },
            { id: "server", label: "自分のサーバ" },
            { id: "api", label: "外部API" },
          ],
          targets: [
            { id: "input", label: "入力と表示を担当する" },
            { id: "relay", label: "外部APIへ依頼する" },
            { id: "external-result", label: "外部サービスの結果を返す" },
          ],
          answers: [
            { targetId: "input", itemIds: ["browser"] },
            { targetId: "relay", itemIds: ["server"] },
            { targetId: "external-result", itemIds: ["api"] },
          ],
          correctFeedback: "OKです。API利用時の役割を整理できています。",
          incorrectFeedback: "ブラウザは入力と表示、サーバは依頼、外部APIは結果を返す役割です。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const apiRequestResponseMission: MissionSeed = {
  id: "api-request-response",
  title: "リクエストとレスポンスを復習する",
  description: "API通信もリクエストとレスポンスの流れで理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/api-request-response.png",
  estimatedMinutes: 9,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: ["APIへ送るデータと返るデータを分ける", "成功時と失敗時のレスポンスを区別する", "API通信の順番を説明できる"],
  isPublished: true,
  sections: [
    {
      id: "api-reqres-data-section",
      title: "送るデータと返るデータ",
      description: "API通信で何を送り、何が返ってくるかを整理します。",
      order: 1,
      activities: [
        tutorial({
          id: "api-reqres-a01-send-return",
          order: 1,
          sectionOrder: 1,
          title: "APIにもお願いと返事がある",
          mentorMessage: "Course1で学んだリクエストとレスポンスは、API通信でも同じように使えます。",
          body: [
            "APIへ送る情報はリクエストです。たとえば、都市名、検索キーワード、ユーザーの質問文などがあります。",
            "APIから返ってくる情報はレスポンスです。たとえば、天気、検索結果、AIの返答などがあります。",
            "API通信も、送るものと返るものを分けて考えると整理しやすくなります。",
          ].join("\n\n"),
          summary: ["送る情報はリクエスト", "返る情報はレスポンス", "API通信もお願いと返事で考える"],
          visual: course6Visuals.apiFlow,
        }),
        match({
          id: "api-reqres-a02-send-return-match",
          order: 2,
          sectionOrder: 2,
          title: "送るデータと返るデータを分けよう",
          instruction: "API通信に出てくる情報を、送るデータ・返るデータに分けましょう。",
          mentorMessage: "天気APIを例に、依頼する内容と結果を分けます。",
          items: [
            { id: "city", label: "福岡という都市名" },
            { id: "weather", label: "晴れという天気" },
            { id: "temperature", label: "24℃という気温" },
            { id: "date", label: "今日の天気を知りたいという条件" },
          ],
          targets: [
            { id: "send", label: "APIへ送るデータ" },
            { id: "return", label: "APIから返るデータ" },
          ],
          answers: [
            { targetId: "send", itemIds: ["city", "date"] },
            { targetId: "return", itemIds: ["weather", "temperature"] },
          ],
          correctFeedback: "いい整理です。都市名や条件を送り、天気や気温が返ってきます。",
          incorrectFeedback: "APIに依頼するための条件が送るデータ、APIが教えてくれる結果が返るデータです。",
        }),
        choice({
          id: "api-reqres-a03-return-choice",
          order: 3,
          sectionOrder: 3,
          title: "APIから返る情報はどれ？",
          instruction: "天気APIのレスポンスとして自然なものを選びましょう。",
          mentorMessage: "APIが返す結果に注目しましょう。",
          question: "天気APIへ都市名を送ったあと、レスポンスとして自然なのはどれ？",
          choices: [
            { id: "api-reqres-a03-correct", label: "天気や気温のデータ", isCorrect: true, feedback: "その通りです。天気APIは天気や気温などの結果を返します。" },
            { id: "api-reqres-a03-wrong-css", label: "CSSの余白設定", isCorrect: false, feedback: "惜しいです。CSSの余白設定は天気APIの結果ではありません。" },
            { id: "api-reqres-a03-wrong-password", label: "利用者のパスワード", isCorrect: false, feedback: "危険です。パスワードをAPIレスポンスとして扱うのは不自然です。" },
            { id: "api-reqres-a03-wrong-html-tag", label: "h1タグの閉じ忘れ", isCorrect: false, feedback: "惜しいです。HTMLの書き方の問題で、APIの結果ではありません。" },
          ],
        }),
      ],
    },
    {
      id: "api-reqres-success-section",
      title: "成功時と失敗時の違い",
      description: "APIが成功した場合と失敗した場合の返事を比べます。",
      order: 2,
      activities: [
        tutorial({
          id: "api-reqres-a04-success-fail",
          order: 4,
          sectionOrder: 1,
          title: "APIの返事には成功と失敗がある",
          mentorMessage: "APIへ依頼しても、いつも成功するとは限りません。失敗したときの返事も考えておく必要があります。",
          body: [
            "成功時には、必要なデータが返ってきます。たとえば天気APIなら天気や気温です。",
            "失敗時には、エラー内容や失敗を表す情報が返ることがあります。通信できない、入力が足りない、利用制限を超えた、などの原因があります。",
            "Webアプリでは、成功時だけでなく失敗時にユーザーへ何を表示するかも大切です。",
          ].join("\n\n"),
          summary: ["成功時は必要なデータが返る", "失敗時はエラー情報が返る", "失敗時の表示も考える"],
        }),
        match({
          id: "api-reqres-a05-success-fail-match",
          order: 5,
          sectionOrder: 2,
          title: "成功時と失敗時を分けよう",
          instruction: "次の返答を、成功時・失敗時に分けましょう。",
          mentorMessage: "必要なデータが返っているか、エラーを知らせているかに注目します。",
          items: [
            { id: "sunny", label: "weather: sunny" },
            { id: "summary", label: "summary: 要約文" },
            { id: "not-found", label: "error: city not found" },
            { id: "limit", label: "error: rate limit exceeded" },
          ],
          targets: [
            { id: "success", label: "成功時の返答" },
            { id: "fail", label: "失敗時の返答" },
          ],
          answers: [
            { targetId: "success", itemIds: ["sunny", "summary"] },
            { targetId: "fail", itemIds: ["not-found", "limit"] },
          ],
          correctFeedback: "よくできています。必要な結果とエラー情報を分けられています。",
          incorrectFeedback: "結果データが返っていれば成功、errorが返っていれば失敗として考えます。",
        }),
        orderedSteps({
          id: "api-reqres-a06-order",
          order: 6,
          sectionOrder: 3,
          title: "API通信の順番を並べよう",
          instruction: "API通信の基本的な順番を並べましょう。",
          mentorMessage: "送る、処理される、返る、表示するの順で考えます。",
          steps: [
            { id: "input", label: "ユーザーが条件を入力する" },
            { id: "server", label: "サーバがAPIへリクエストを送る" },
            { id: "api", label: "外部APIが処理する" },
            { id: "response", label: "APIからレスポンスが返る" },
            { id: "show", label: "結果やエラーを画面に表示する" },
          ],
          answerOrder: ["input", "server", "api", "response", "show"],
          correctFeedback: "いい順番です。API通信の基本的な流れを整理できています。",
          incorrectFeedback: "まずユーザー入力があり、サーバがAPIへ送り、返ってきた結果を画面に表示します。",
        }),
      ],
    },
    {
      id: "api-reqres-check-section",
      title: "Mission Check",
      description: "API通信のリクエストとレスポンスを確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "api-reqres-c01-order-check",
          order: 7,
          sectionOrder: 1,
          title: "API通信の流れを確認しよう",
          instruction: "API通信の順番を正しく並べましょう。",
          mentorMessage: "APIへの依頼から画面表示までを確認します。",
          steps: [
            { id: "request", label: "サーバがAPIへ依頼する" },
            { id: "process", label: "APIが処理する" },
            { id: "response", label: "APIが結果を返す" },
            { id: "display", label: "結果を画面に表示する" },
          ],
          answerOrder: ["request", "process", "response", "display"],
          correctFeedback: "OKです。API通信の順番を確認できています。",
          incorrectFeedback: "依頼、処理、返答、表示の順で考えましょう。",
          isMissionCheck: true,
        }),
        choice({
          id: "api-reqres-c02-fail-check",
          order: 8,
          sectionOrder: 2,
          title: "失敗時の返答を選ぼう",
          instruction: "APIが失敗したときの返答として自然なものを選びましょう。",
          mentorMessage: "エラー情報を含む返答を探します。",
          question: "APIの失敗時レスポンスとして自然なのはどれ？",
          choices: [
            { id: "api-reqres-c02-correct", label: "error: API limit exceeded", isCorrect: true, feedback: "OKです。利用制限超過を示すエラーは失敗時の返答として自然です。" },
            { id: "api-reqres-c02-wrong-sunny", label: "weather: sunny", isCorrect: false, feedback: "惜しいです。これは成功時の天気データとして考えられます。" },
            { id: "api-reqres-c02-wrong-title", label: "title: 今日の天気", isCorrect: false, feedback: "惜しいです。タイトルだけでは失敗時の返答とは言いにくいです。" },
            { id: "api-reqres-c02-wrong-css", label: "color: blue", isCorrect: false, feedback: "惜しいです。これはCSSの見た目設定です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const jsonReadingMission: MissionSeed = {
  id: "json-reading",
  title: "JSONを読む",
  description: "APIの返答としてよく使われるJSONから、必要な値を読み取ります。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/json-reading.png",
  estimatedMinutes: 10,
  order: 3,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: ["JSONはkeyとvalueでデータを表す", "必要なkeyを見つけてvalueを読む", "入れ子のJSONは外側から順に読む"],
  isPublished: true,
  sections: [
    {
      id: "json-key-value-section",
      title: "key と value",
      description: "JSONの基本的な読み方を確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "json-reading-a01-key-value",
          order: 1,
          sectionOrder: 1,
          title: "JSONは名前と値の組み合わせで読む",
          mentorMessage: "APIの返答では、JSONというデータ形式がよく使われます。まずはkeyとvalueの組み合わせで見てみましょう。",
          body: [
            "JSONでは、データの名前をkey、実際の中身をvalueとして表します。",
            "たとえば { \"weather\": \"sunny\" } なら、weather がkeyで、sunny がvalueです。",
            "Pythonのdictに似ているので、名前を使って必要な値を取り出すイメージで考えられます。",
          ].join("\n\n"),
          summary: ["keyはデータの名前", "valueは実際の値", "Pythonのdictに似ている"],
          visual: course6Visuals.jsonParts,
        }),
        choice({
          id: "json-reading-a02-value-choice",
          order: 2,
          sectionOrder: 2,
          title: "keyに対応するvalueはどれ？",
          instruction: "JSONのkeyとvalueの関係を読み取りましょう。",
          mentorMessage: "weatherというkeyに対応する値を探します。",
          question: "{ \"weather\": \"sunny\", \"temperature\": 24 } で weather のvalueはどれ？",
          choices: [
            { id: "json-reading-a02-correct", label: "sunny", isCorrect: true, feedback: "その通りです。weatherというkeyに対応するvalueはsunnyです。" },
            { id: "json-reading-a02-wrong-weather", label: "weather", isCorrect: false, feedback: "惜しいです。weatherはkeyです。" },
            { id: "json-reading-a02-wrong-temp", label: "temperature", isCorrect: false, feedback: "惜しいです。temperatureは別のkeyです。" },
            { id: "json-reading-a02-wrong-24", label: "24", isCorrect: false, feedback: "惜しいです。24はtemperatureに対応するvalueです。" },
          ],
        }),
        match({
          id: "json-reading-a03-key-value-match",
          order: 3,
          sectionOrder: 3,
          title: "keyとvalueを対応づけよう",
          instruction: "JSONのkeyに対応するvalueを選びましょう。",
          mentorMessage: "名前と値をセットで読みます。",
          items: [
            { id: "sunny", label: "sunny" },
            { id: "24", label: "24" },
            { id: "Fukuoka", label: "Fukuoka" },
          ],
          targets: [
            { id: "weather", label: "weather" },
            { id: "temperature", label: "temperature" },
            { id: "city", label: "city" },
          ],
          answers: [
            { targetId: "weather", itemIds: ["sunny"] },
            { targetId: "temperature", itemIds: ["24"] },
            { targetId: "city", itemIds: ["Fukuoka"] },
          ],
          correctFeedback: "よく読めています。keyとvalueを対応づけられています。",
          incorrectFeedback: "weatherはsunny、temperatureは24、cityはFukuokaに対応します。",
        }),
      ],
    },
    {
      id: "json-display-section",
      title: "表示したい値を選ぶ",
      description: "JSONの中から画面に表示したい値を選びます。",
      order: 2,
      activities: [
        tutorial({
          id: "json-reading-a04-display-value",
          order: 4,
          sectionOrder: 1,
          title: "画面に使う値を選ぶ",
          mentorMessage: "APIの返答には複数の値が含まれることがあります。画面に表示したい値を選ぶことが大切です。",
          body: [
            "たとえば記事APIの返答に、title、description、url、id が含まれているとします。",
            "一覧画面に出したいのは、タイトルや説明文かもしれません。内部処理用のidは、ユーザーに見せない場合もあります。",
            "JSONを読むときは、全部を表示するのではなく、目的に合うkeyを選びます。",
          ].join("\n\n"),
          summary: ["APIの返答には複数の値がある", "画面に必要な値を選ぶ", "内部用の値は見せないこともある"],
        }),
        choice({
          id: "json-reading-a05-display-choice",
          order: 5,
          sectionOrder: 2,
          title: "一覧に表示したい値はどれ？",
          instruction: "記事一覧に表示する値として自然なものを選びましょう。",
          mentorMessage: "ユーザーが内容を理解するために必要な値を考えます。",
          question: "記事一覧カードに表示する値として特に自然なのはどれ？",
          choices: [
            { id: "json-reading-a05-correct", label: "title と description", isCorrect: true, feedback: "その通りです。タイトルと説明文は一覧で内容を伝えるのに使いやすいです。" },
            { id: "json-reading-a05-wrong-secret", label: "APIキー", isCorrect: false, feedback: "危険です。APIキーは画面に表示しません。" },
            { id: "json-reading-a05-wrong-password", label: "パスワード", isCorrect: false, feedback: "危険です。パスワードは表示すべき情報ではありません。" },
            { id: "json-reading-a05-wrong-css", label: "CSSファイル名だけ", isCorrect: false, feedback: "惜しいです。記事一覧の内容としてはタイトルや説明文の方が自然です。" },
          ],
        }),
        choice({
          id: "json-reading-a06-nested-choice",
          order: 6,
          sectionOrder: 3,
          title: "入れ子のJSONは外側から読む",
          instruction: "入れ子になったJSONから値を読む入口を選びましょう。",
          mentorMessage: "外側のkeyを見て、その中の値へ進みます。",
          question: "{ \"weather\": { \"main\": \"Clouds\" } } で main を読むには、最初に見るkeyはどれ？",
          choices: [
            { id: "json-reading-a06-correct", label: "weather", isCorrect: true, feedback: "その通りです。まず外側のweatherを見て、その中のmainを読みます。" },
            { id: "json-reading-a06-wrong-main", label: "mainだけ", isCorrect: false, feedback: "惜しいです。mainはweatherの中にあるので、まず外側のweatherを見ます。" },
            { id: "json-reading-a06-wrong-clouds", label: "Clouds", isCorrect: false, feedback: "惜しいです。Cloudsはvalueです。" },
            { id: "json-reading-a06-wrong-html", label: "html", isCorrect: false, feedback: "惜しいです。このJSONにはhtmlというkeyはありません。" },
          ],
        }),
      ],
    },
    {
      id: "json-reading-check-section",
      title: "Mission Check",
      description: "JSONの読み取りを確認します。",
      order: 3,
      activities: [
        choice({
          id: "json-reading-c01-value-check",
          order: 7,
          sectionOrder: 1,
          title: "JSONから値を読み取ろう",
          instruction: "keyに対応するvalueを選びましょう。",
          mentorMessage: "JSONの基本を確認します。",
          question: "{ \"message\": \"Hello\" } で message のvalueはどれ？",
          choices: [
            { id: "json-reading-c01-correct", label: "Hello", isCorrect: true, feedback: "OKです。messageのvalueはHelloです。" },
            { id: "json-reading-c01-wrong-message", label: "message", isCorrect: false, feedback: "惜しいです。messageはkeyです。" },
            { id: "json-reading-c01-wrong-json", label: "JSON", isCorrect: false, feedback: "惜しいです。JSONは形式の名前です。" },
            { id: "json-reading-c01-wrong-none", label: "何も返らない", isCorrect: false, feedback: "惜しいです。Helloという値が返っています。" },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "json-reading-c02-display-check",
          order: 8,
          sectionOrder: 2,
          title: "表示に使う値を選ぼう",
          instruction: "API結果のうち、画面表示に使いやすい値を選びましょう。",
          mentorMessage: "ユーザーに見せる値と見せない値を分けます。",
          items: [
            { id: "title", label: "記事タイトル" },
            { id: "description", label: "記事説明文" },
            { id: "api-key", label: "APIキー" },
          ],
          targets: [
            { id: "show", label: "画面に表示しやすい" },
            { id: "hide", label: "表示しない" },
          ],
          answers: [
            { targetId: "show", itemIds: ["title", "description"] },
            { targetId: "hide", itemIds: ["api-key"] },
          ],
          correctFeedback: "OKです。表示する値と秘密情報を分けられています。",
          incorrectFeedback: "タイトルや説明文は表示向きですが、APIキーは表示しません。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const apiResultDisplayMission: MissionSeed = {
  id: "api-result-display",
  title: "APIの結果を画面に表示する",
  description: "APIから返ってきた値をHTMLに入れて表示する流れを理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/api-result-display.png",
  estimatedMinutes: 11,
  order: 4,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["API結果を変数としてtemplateへ渡す", "HTML側でAPI結果を表示する", "読み込み中や失敗時の表示も用意する"],
  isPublished: true,
  sections: [
    {
      id: "api-display-template-section",
      title: "結果をHTMLに入れる",
      description: "API結果を変数としてテンプレートに渡し、HTML側で表示します。",
      order: 1,
      activities: [
        tutorial({
          id: "api-display-a01-template",
          order: 1,
          sectionOrder: 1,
          title: "API結果は変数としてHTMLへ渡す",
          mentorMessage: "APIから受け取った結果は、Python側で変数に入れ、render_templateでHTMLへ渡して表示できます。",
          body: [
            "たとえば、APIから天気の値として sunny が返ってきたとします。",
            "Python側では weather = \"sunny\" のように変数に入れ、render_template(\"result.html\", weather=weather) のようにテンプレートへ渡します。",
            "HTML側では {{ weather }} のように書くことで、画面にAPI結果を表示できます。",
          ].join("\n\n"),
          summary: ["API結果を変数に入れる", "render_templateで渡す", "HTML側で{{ }}を使って表示する"],
        }),
        choice({
          id: "api-display-a02-html-choice",
          order: 2,
          sectionOrder: 2,
          title: "HTML側で表示する書き方は？",
          instruction: "テンプレート変数を表示する書き方を選びましょう。",
          mentorMessage: "Flaskのテンプレートで値を表示する書き方を思い出します。",
          question: "Pythonから渡された weather をHTMLに表示する書き方として近いものはどれ？",
          choices: [
            { id: "api-display-a02-correct", label: "{{ weather }}", isCorrect: true, feedback: "その通りです。Flaskテンプレートでは{{ weather }}のように値を表示できます。" },
            { id: "api-display-a02-wrong-css", label: "weather: blue;", isCorrect: false, feedback: "惜しいです。これはCSSのプロパティのような書き方です。" },
            { id: "api-display-a02-wrong-href", label: "href=\"weather\"", isCorrect: false, feedback: "惜しいです。リンク先を指定する書き方に近いです。" },
            { id: "api-display-a02-wrong-print", label: "print(weather)", isCorrect: false, feedback: "惜しいです。Python上で出力する書き方で、HTML表示とは違います。" },
          ],
        }),
        orderedSteps({
          id: "api-display-a03-render-order",
          order: 3,
          sectionOrder: 3,
          title: "API結果表示の流れを並べよう",
          instruction: "API結果を画面に表示するまでの流れを並べましょう。",
          mentorMessage: "取得、変数化、templateへ渡す、表示の順で考えます。",
          steps: [
            { id: "get-api", label: "APIから結果を受け取る" },
            { id: "save-var", label: "結果をPythonの変数に入れる" },
            { id: "render", label: "render_templateでtemplateへ渡す" },
            { id: "html", label: "HTML側で{{ }}を使って表示する" },
          ],
          answerOrder: ["get-api", "save-var", "render", "html"],
          correctFeedback: "いい流れです。API結果をPython側からHTML側へ渡して表示できます。",
          incorrectFeedback: "API結果を受け取り、変数に入れ、templateへ渡して、HTMLで表示します。",
        }),
      ],
    },
    {
      id: "api-display-error-section",
      title: "読み込み中や失敗時の表示",
      description: "ユーザーに状態が伝わる表示を考えます。",
      order: 2,
      activities: [
        tutorial({
          id: "api-display-a04-loading-error",
          order: 4,
          sectionOrder: 1,
          title: "API結果がすぐ返るとは限らない",
          mentorMessage: "APIを使う機能では、読み込み中や失敗時の表示も重要です。何も表示されないと、ユーザーは止まったのか分からなくなります。",
          body: [
            "API通信には時間がかかることがあります。その間は「読み込み中です」のような表示があると安心です。",
            "通信に失敗した場合は、「取得に失敗しました。時間をおいて再度お試しください」のように、ユーザーが次に何をすればよいかを伝えます。",
            "技術的なエラーだけをそのまま出すより、ユーザーに分かる表現に直すことが大切です。",
          ].join("\n\n"),
          summary: ["読み込み中を伝える", "失敗時は次の行動を伝える", "技術的すぎる表示は避ける"],
        }),
        choice({
          id: "api-display-a05-loading-choice",
          order: 5,
          sectionOrder: 2,
          title: "読み込み中の表示として自然なのは？",
          instruction: "API結果を待っている間の表示として自然なものを選びましょう。",
          mentorMessage: "ユーザーに状態が伝わる表現を選びます。",
          question: "API結果を待っている間に表示する文として自然なのはどれ？",
          choices: [
            { id: "api-display-a05-correct", label: "結果を読み込んでいます...", isCorrect: true, feedback: "その通りです。読み込み中であることが伝わります。" },
            { id: "api-display-a05-wrong-secret", label: "APIキーを表示します", isCorrect: false, feedback: "危険です。APIキーは表示してはいけません。" },
            { id: "api-display-a05-wrong-empty", label: "何も表示しない", isCorrect: false, feedback: "惜しいです。何も表示しないと、止まったように見えることがあります。" },
            { id: "api-display-a05-wrong-error-only", label: "Tracebackだけを表示する", isCorrect: false, feedback: "惜しいです。技術的すぎるエラーはユーザーに伝わりにくいです。" },
          ],
        }),
        choice({
          id: "api-display-a06-error-choice",
          order: 6,
          sectionOrder: 3,
          title: "失敗時の表示として自然なのは？",
          instruction: "API取得に失敗したときの表示として自然なものを選びましょう。",
          mentorMessage: "何が起きたか、次にどうすればよいかが伝わる文を選びます。",
          question: "API取得に失敗したとき、ユーザー向け表示として自然なのはどれ？",
          choices: [
            { id: "api-display-a06-correct", label: "情報を取得できませんでした。時間をおいて再度お試しください。", isCorrect: true, feedback: "その通りです。失敗したことと次の行動が伝わります。" },
            { id: "api-display-a06-wrong-key", label: "sk-xxxx...", isCorrect: false, feedback: "危険です。APIキーのような秘密情報を表示してはいけません。" },
            { id: "api-display-a06-wrong-none", label: "成功しました", isCorrect: false, feedback: "惜しいです。失敗時に成功と表示すると混乱します。" },
            { id: "api-display-a06-wrong-db", label: "DBを全部削除してください", isCorrect: false, feedback: "危険です。API取得失敗時の対応として不適切です。" },
          ],
        }),
      ],
    },
    {
      id: "api-display-check-section",
      title: "Mission Check",
      description: "API結果表示と状態表示を確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "api-display-c01-flow-check",
          order: 7,
          sectionOrder: 1,
          title: "API結果表示の流れを確認しよう",
          instruction: "API結果を画面に表示する流れを並べましょう。",
          mentorMessage: "API結果をHTMLに出すまでを確認します。",
          steps: [
            { id: "api", label: "APIから結果を受け取る" },
            { id: "var", label: "結果を変数に入れる" },
            { id: "template", label: "templateに渡す" },
            { id: "display", label: "HTMLで表示する" },
          ],
          answerOrder: ["api", "var", "template", "display"],
          correctFeedback: "OKです。API結果表示の流れを整理できています。",
          incorrectFeedback: "API結果を受け取り、変数に入れ、templateへ渡し、HTMLで表示します。",
          isMissionCheck: true,
        }),
        choice({
          id: "api-display-c02-error-check",
          order: 8,
          sectionOrder: 2,
          title: "失敗時の表示を選ぼう",
          instruction: "ユーザーに伝わる失敗時表示を選びましょう。",
          mentorMessage: "秘密情報を出さず、次の行動が分かる表示を選びます。",
          question: "API失敗時の表示として自然なのはどれ？",
          choices: [
            { id: "api-display-c02-correct", label: "取得に失敗しました。あとでもう一度試してください。", isCorrect: true, feedback: "OKです。ユーザーに状態と次の行動が伝わります。" },
            { id: "api-display-c02-wrong-secret", label: "APIキーを画面に出す", isCorrect: false, feedback: "危険です。APIキーは表示しません。" },
            { id: "api-display-c02-wrong-empty", label: "何も出さない", isCorrect: false, feedback: "惜しいです。何も出さないと状態が分かりません。" },
            { id: "api-display-c02-wrong-success", label: "常に成功と表示する", isCorrect: false, feedback: "惜しいです。失敗時に成功と表示すると混乱します。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const aiInputMission: MissionSeed = {
  id: "ai-input-design",
  title: "AIに送る情報を考える",
  description: "AIに渡す入力や指示文を考え、不要な情報を送らない判断をします。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/ai-input-design.png",
  estimatedMinutes: 10,
  order: 5,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["ユーザー入力とAIへの指示文を分ける", "目的に合う指示文を選ぶ", "個人情報や秘密情報を送らない"],
  isPublished: true,
  sections: [
    {
      id: "ai-input-prompt-section",
      title: "ユーザー入力と指示文",
      description: "AIに送る内容を、入力と指示に分けます。",
      order: 1,
      activities: [
        tutorial({
          id: "ai-input-a01-prompt",
          order: 1,
          sectionOrder: 1,
          title: "AIには入力だけでなく指示文も送る",
          mentorMessage: "AI機能では、ユーザーが入力した文章だけでなく、AIにどう答えてほしいかを伝える指示文も重要です。",
          body: [
            "たとえば、ユーザーが課題文を入力したとします。AIにただ送るだけだと、どんな形式で返してほしいかが曖昧になります。",
            "そこで、「初心者向けに3行で要約してください」「箇条書きで返してください」のような指示文を加えます。",
            "ユーザー入力とAIへの指示文を分けて考えると、AI機能を設計しやすくなります。",
          ].join("\n\n"),
          summary: ["ユーザー入力は材料", "指示文は答え方の指定", "目的に合う指示にする"],
        }),
        match({
          id: "ai-input-a02-input-instruction-match",
          order: 2,
          sectionOrder: 2,
          title: "入力と指示文を分けよう",
          instruction: "次の文を、ユーザー入力・AIへの指示文に分けましょう。",
          mentorMessage: "何を材料として送るか、どう答えてほしいかを分けます。",
          items: [
            { id: "article", label: "この文章を要約したい" },
            { id: "question", label: "予約アプリの作り方を知りたい" },
            { id: "three-lines", label: "3行で説明してください" },
            { id: "bullet", label: "箇条書きで返してください" },
          ],
          targets: [
            { id: "input", label: "ユーザー入力" },
            { id: "instruction", label: "AIへの指示文" },
          ],
          answers: [
            { targetId: "input", itemIds: ["article", "question"] },
            { targetId: "instruction", itemIds: ["three-lines", "bullet"] },
          ],
          correctFeedback: "いい整理です。材料になる入力と、答え方を指定する指示文を分けられています。",
          incorrectFeedback: "ユーザーが知りたい内容は入力、AIへの答え方の指定は指示文です。",
        }),
        choice({
          id: "ai-input-a03-purpose-choice",
          order: 3,
          sectionOrder: 3,
          title: "目的に合う指示文は？",
          instruction: "初心者向けの説明を得たいときの指示文を選びましょう。",
          mentorMessage: "誰に向けて、どんな形式で答えるかを指定すると結果が安定しやすくなります。",
          question: "初心者に分かりやすく説明してほしいとき、指示文として自然なのはどれ？",
          choices: [
            { id: "ai-input-a03-correct", label: "初心者向けに、専門用語を避けて3つのポイントで説明してください。", isCorrect: true, feedback: "その通りです。対象と形式が具体的で、目的に合っています。" },
            { id: "ai-input-a03-wrong-any", label: "なんかいい感じにして", isCorrect: false, feedback: "惜しいです。曖昧すぎると期待した返答になりにくいです。" },
            { id: "ai-input-a03-wrong-secret", label: "APIキーも一緒に表示してください", isCorrect: false, feedback: "危険です。秘密情報を表示させる指示は避けます。" },
            { id: "ai-input-a03-wrong-css", label: "文字色を赤にしてください", isCorrect: false, feedback: "惜しいです。説明内容を得たい場面では、CSS指定より説明の条件が必要です。" },
          ],
        }),
      ],
    },
    {
      id: "ai-input-safety-section",
      title: "送ってよい情報、送らない情報",
      description: "AIに渡す情報の安全性を考えます。",
      order: 2,
      activities: [
        tutorial({
          id: "ai-input-a04-safety",
          order: 4,
          sectionOrder: 1,
          title: "AIには必要最小限の情報を送る",
          mentorMessage: "AIを使うときは、便利さだけでなく、送る情報にも注意が必要です。秘密情報や個人情報は送らないようにします。",
          body: [
            "AIに送る情報は、目的を達成するために必要な範囲にします。",
            "パスワード、APIキー、個人を特定できる情報、公開してはいけないデータは送らないようにします。",
            "たとえば文章要約なら、要約したい文章と出力形式の指示だけを送れば十分な場合があります。",
          ].join("\n\n"),
          summary: ["必要最小限にする", "秘密情報は送らない", "個人情報にも注意する"],
          visual: course6Visuals.aiInput,
        }),
        match({
          id: "ai-input-a05-safe-match",
          order: 5,
          sectionOrder: 2,
          title: "AIに送ってよい情報を分けよう",
          instruction: "次の情報を、送ってよい・送らないに分けましょう。",
          mentorMessage: "目的に必要か、秘密情報かに注目します。",
          items: [
            { id: "summary-text", label: "要約したい文章" },
            { id: "format", label: "箇条書きで返す指示" },
            { id: "api-key", label: "APIキー" },
            { id: "password", label: "パスワード" },
          ],
          targets: [
            { id: "ok", label: "目的に必要なら送ってよい" },
            { id: "ng", label: "送らない" },
          ],
          answers: [
            { targetId: "ok", itemIds: ["summary-text", "format"] },
            { targetId: "ng", itemIds: ["api-key", "password"] },
          ],
          correctFeedback: "よくできています。AIに送る情報と送らない情報を分けられています。",
          incorrectFeedback: "要約したい文章や指示は必要なら送れますが、APIキーやパスワードは送ってはいけません。",
        }),
        choice({
          id: "ai-input-a06-minimum-choice",
          order: 6,
          sectionOrder: 3,
          title: "必要最小限の情報はどれ？",
          instruction: "文章要約AIに送る情報として自然なものを選びましょう。",
          mentorMessage: "目的に不要な秘密情報を含めないようにします。",
          question: "文章を要約するAI機能で、送る情報として最も自然なのはどれ？",
          choices: [
            { id: "ai-input-a06-correct", label: "要約したい文章と、短くまとめる指示", isCorrect: true, feedback: "その通りです。目的に必要な情報に絞れています。" },
            { id: "ai-input-a06-wrong-key", label: "要約文とAPIキーを画面表示用に送る", isCorrect: false, feedback: "危険です。APIキーは送ったり表示したりしません。" },
            { id: "ai-input-a06-wrong-all", label: "関係ない個人情報をすべて送る", isCorrect: false, feedback: "危険です。目的に不要な個人情報は送らないようにします。" },
            { id: "ai-input-a06-wrong-empty", label: "何も送らずに正確な要約を期待する", isCorrect: false, feedback: "惜しいです。要約したい文章は必要です。" },
          ],
        }),
      ],
    },
    {
      id: "ai-input-check-section",
      title: "Mission Check",
      description: "AIに送る入力と安全性を確認します。",
      order: 3,
      activities: [
        match({
          id: "ai-input-c01-safe-check",
          order: 7,
          sectionOrder: 1,
          title: "AIに送る情報を選ぼう",
          instruction: "送ってよい情報と送らない情報を分けましょう。",
          mentorMessage: "AIに送る情報の安全性を確認します。",
          items: [
            { id: "question", label: "ユーザーの質問文" },
            { id: "instruction", label: "出力形式の指示" },
            { id: "password", label: "パスワード" },
          ],
          targets: [
            { id: "ok", label: "目的に必要なら送ってよい" },
            { id: "ng", label: "送らない" },
          ],
          answers: [
            { targetId: "ok", itemIds: ["question", "instruction"] },
            { targetId: "ng", itemIds: ["password"] },
          ],
          correctFeedback: "OKです。AIに送る情報を安全に分けられています。",
          incorrectFeedback: "質問や指示は必要なら送れますが、パスワードは送りません。",
          isMissionCheck: true,
        }),
        choice({
          id: "ai-input-c02-prompt-check",
          order: 8,
          sectionOrder: 2,
          title: "目的に合う指示文を選ぼう",
          instruction: "要約AIに合う指示文を選びましょう。",
          mentorMessage: "答え方が分かる具体的な指示を選びます。",
          question: "要約AIへの指示として自然なのはどれ？",
          choices: [
            { id: "ai-input-c02-correct", label: "次の文章を3行で要約してください。", isCorrect: true, feedback: "OKです。目的と形式が明確です。" },
            { id: "ai-input-c02-wrong-vague", label: "よろしく", isCorrect: false, feedback: "惜しいです。何をしてほしいかが曖昧です。" },
            { id: "ai-input-c02-wrong-key", label: "APIキーを返してください", isCorrect: false, feedback: "危険です。秘密情報を返す指示は避けます。" },
            { id: "ai-input-c02-wrong-css", label: "背景色を青くしてください", isCorrect: false, feedback: "惜しいです。要約AIの指示としては目的が違います。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const aiDisplayMission: MissionSeed = {
  id: "ai-response-display",
  title: "AIの返答を画面に表示する",
  description: "質問、送信、返答表示の流れをWebアプリ機能として理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/ai-response-display.png",
  estimatedMinutes: 11,
  order: 6,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["AI質問フォームの流れを理解する", "質問文をサーバで受け取る", "AI返答を結果カードとして表示する"],
  isPublished: true,
  sections: [
    {
      id: "ai-display-question-section",
      title: "質問と送信",
      description: "AI質問フォームからサーバへ送る流れを見ます。",
      order: 1,
      activities: [
        tutorial({
          id: "ai-display-a01-form",
          order: 1,
          sectionOrder: 1,
          title: "AI質問フォームは入力と送信でできている",
          mentorMessage: "AI機能も、Webアプリとして見るとフォーム入力、サーバ送信、結果表示の流れで作れます。",
          body: [
            "ユーザーは質問文や相談内容をフォームに入力します。",
            "送信ボタンを押すと、その内容がサーバへ送られます。",
            "サーバは受け取った質問文をもとにAIへ依頼し、返答を画面に返します。",
          ].join("\n\n"),
          summary: ["質問文を入力する", "サーバへ送る", "AI返答を画面に返す"],
          visual: course6Visuals.apiFlow,
        }),
        orderedSteps({
          id: "ai-display-a02-submit-order",
          order: 2,
          sectionOrder: 2,
          title: "AI質問の送信順を並べよう",
          instruction: "AI質問フォームの流れを並べましょう。",
          mentorMessage: "入力、送信、受け取り、AI依頼の順で考えます。",
          steps: [
            { id: "input", label: "ユーザーが質問文を入力する" },
            { id: "submit", label: "送信ボタンを押す" },
            { id: "receive", label: "サーバが質問文を受け取る" },
            { id: "ai", label: "サーバがAIへ依頼する" },
            { id: "response", label: "AIの返答を受け取る" },
          ],
          answerOrder: ["input", "submit", "receive", "ai", "response"],
          correctFeedback: "いい順番です。AI機能もフォーム送信の流れで考えられます。",
          incorrectFeedback: "まず入力し、送信後にサーバが受け取り、AIへ依頼します。",
        }),
        choice({
          id: "ai-display-a03-question-receive-choice",
          order: 3,
          sectionOrder: 3,
          title: "質問文を受け取る処理はどれ？",
          instruction: "フォームから質問文を受け取る処理として近いものを選びましょう。",
          mentorMessage: "Course4のrequest.formを思い出します。",
          question: "フォームの name=\"question\" に入った質問文を受け取る処理として近いものはどれ？",
          choices: [
            { id: "ai-display-a03-correct", label: "question = request.form[\"question\"]", isCorrect: true, feedback: "その通りです。name=\"question\"の入力値をrequest.formで受け取ります。" },
            { id: "ai-display-a03-wrong-css", label: "question { color: blue; }", isCorrect: false, feedback: "惜しいです。これはCSSのような書き方です。" },
            { id: "ai-display-a03-wrong-html", label: "<h1>question</h1>", isCorrect: false, feedback: "惜しいです。これはHTML表示で、フォーム受け取りではありません。" },
            { id: "ai-display-a03-wrong-db", label: "db.drop_all()", isCorrect: false, feedback: "危険です。質問文を受け取る処理ではありません。" },
          ],
        }),
      ],
    },
    {
      id: "ai-display-result-section",
      title: "返答表示",
      description: "AIの返答を見やすく表示する画面を考えます。",
      order: 2,
      activities: [
        tutorial({
          id: "ai-display-a04-result-card",
          order: 4,
          sectionOrder: 1,
          title: "AIの返答は結果カードで見せると分かりやすい",
          mentorMessage: "AIの返答は文章量が多くなりやすいので、見出しやカードで整理すると読みやすくなります。",
          body: [
            "たとえば、AIから返ってきた文章を answer という変数に入れます。",
            "HTML側では、<section class=\"answer-card\"> のようなまとまりを作り、{{ answer }} を表示します。",
            "結果カードにすると、質問フォームとAIの返答を画面上で分けて見せられます。",
          ].join("\n\n"),
          summary: ["AI返答はanswerなどの変数に入れる", "HTML側で{{ answer }}を表示する", "カードで見せると読みやすい"],
        }),
        choice({
          id: "ai-display-a05-answer-html-choice",
          order: 5,
          sectionOrder: 2,
          title: "AI返答を表示するHTMLは？",
          instruction: "AI返答を表示するHTMLとして自然なものを選びましょう。",
          mentorMessage: "answerという変数を表示する想定です。",
          question: "AIの返答 answer を画面に表示する書き方として近いものはどれ？",
          choices: [
            { id: "ai-display-a05-correct", label: "<p>{{ answer }}</p>", isCorrect: true, feedback: "その通りです。answerの中身をpタグ内に表示できます。" },
            { id: "ai-display-a05-wrong-key", label: "<p>{{ api_key }}</p>", isCorrect: false, feedback: "危険です。APIキーを表示してはいけません。" },
            { id: "ai-display-a05-wrong-css", label: "answer: blue;", isCorrect: false, feedback: "惜しいです。CSSのような書き方です。" },
            { id: "ai-display-a05-wrong-input", label: "<input>{{ answer }}</input>", isCorrect: false, feedback: "惜しいです。inputタグはこのように返答文を囲む用途には向きません。" },
          ],
        }),
        match({
          id: "ai-display-a06-ui-parts-match",
          order: 6,
          sectionOrder: 3,
          title: "AI返答画面の部品を分けよう",
          instruction: "AI機能の画面部品を役割に対応づけましょう。",
          mentorMessage: "質問を入力する部分と返答を見る部分を分けます。",
          items: [
            { id: "textarea", label: "質問入力欄" },
            { id: "submit", label: "送信ボタン" },
            { id: "answer-card", label: "AI返答カード" },
          ],
          targets: [
            { id: "input", label: "ユーザーが入力する" },
            { id: "action", label: "サーバへ送る" },
            { id: "result", label: "結果を表示する" },
          ],
          answers: [
            { targetId: "input", itemIds: ["textarea"] },
            { targetId: "action", itemIds: ["submit"] },
            { targetId: "result", itemIds: ["answer-card"] },
          ],
          correctFeedback: "よくできています。質問入力、送信、返答表示を分けられています。",
          incorrectFeedback: "入力欄で質問し、ボタンで送信し、返答カードで結果を見せます。",
        }),
      ],
    },
    {
      id: "ai-display-check-section",
      title: "Mission Check",
      description: "AI返答表示の流れを確認します。",
      order: 3,
      activities: [
        choice({
          id: "ai-display-c01-html-check",
          order: 7,
          sectionOrder: 1,
          title: "AI返答表示のHTMLを選ぼう",
          instruction: "answerを表示するHTMLとして自然なものを選びましょう。",
          mentorMessage: "AI返答をHTMLに出す書き方を確認します。",
          question: "AI返答 answer を表示するHTMLとして自然なのはどれ？",
          choices: [
            { id: "ai-display-c01-correct", label: "<div class=\"answer-card\"><p>{{ answer }}</p></div>", isCorrect: true, feedback: "OKです。カード内にanswerを表示できます。" },
            { id: "ai-display-c01-wrong-key", label: "<p>{{ api_key }}</p>", isCorrect: false, feedback: "危険です。APIキーを表示してはいけません。" },
            { id: "ai-display-c01-wrong-css", label: ".answer-card { }", isCorrect: false, feedback: "惜しいです。これはCSSで、HTML表示そのものではありません。" },
            { id: "ai-display-c01-wrong-none", label: "何も書かない", isCorrect: false, feedback: "惜しいです。返答を表示する場所が必要です。" },
          ],
          isMissionCheck: true,
        }),
        orderedSteps({
          id: "ai-display-c02-flow-check",
          order: 8,
          sectionOrder: 2,
          title: "質問、送信、返答表示の流れを完成させよう",
          instruction: "AI機能の流れを正しい順番に並べましょう。",
          mentorMessage: "入力からAI返答表示までを確認します。",
          steps: [
            { id: "input", label: "質問文を入力する" },
            { id: "send", label: "サーバへ送信する" },
            { id: "ai", label: "AIへ依頼する" },
            { id: "answer", label: "AI返答を受け取る" },
            { id: "display", label: "画面に表示する" },
          ],
          answerOrder: ["input", "send", "ai", "answer", "display"],
          correctFeedback: "OKです。AI機能の基本的な流れを確認できています。",
          incorrectFeedback: "入力、送信、AI依頼、返答受け取り、表示の順です。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const apiKeySafetyMission: MissionSeed = {
  id: "api-key-safety",
  title: "APIキーと安全性を知る",
  description: "APIキーをフロントに置かず、サーバ側で扱う理由を理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/api-key-safety.png",
  estimatedMinutes: 10,
  order: 7,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 120,
  learnedItems: ["APIキーは外部サービスを使うための鍵に近い", "APIキーは画面やフロントに置かない", "サーバ側から外部APIを呼ぶ"],
  isPublished: true,
  sections: [
    {
      id: "api-key-meaning-section",
      title: "APIキーとは何か",
      description: "APIキーが秘密の鍵に近い情報であることを確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "api-key-a01-meaning",
          order: 1,
          sectionOrder: 1,
          title: "APIキーは外部サービスを使うための鍵に近い",
          mentorMessage: "APIキーは、外部サービスを利用するときに使う秘密の情報です。画面に出したり、誰でも見える場所に置いたりしないようにします。",
          body: [
            "APIキーは、外部サービスが「誰が使っているか」を確認するために使われます。",
            "鍵のようなものなので、他の人に見られると勝手に使われる危険があります。",
            "そのため、APIキーはHTMLやJavaScriptに直接書いて画面側へ渡すのではなく、サーバ側で扱うのが基本です。",
          ].join("\n\n"),
          summary: ["APIキーは秘密情報", "勝手に使われる危険がある", "画面に表示しない"],
        }),
        choice({
          id: "api-key-a02-secret-choice",
          order: 2,
          sectionOrder: 2,
          title: "見せてはいけない情報は？",
          instruction: "画面に表示してはいけない情報を選びましょう。",
          mentorMessage: "秘密情報にあたるものを見つけます。",
          question: "次のうち、画面に表示してはいけないものとして最も自然なのはどれ？",
          choices: [
            { id: "api-key-a02-correct", label: "APIキー", isCorrect: true, feedback: "その通りです。APIキーは秘密情報として扱い、画面には表示しません。" },
            { id: "api-key-a02-wrong-title", label: "ページタイトル", isCorrect: false, feedback: "惜しいです。ページタイトルは通常画面に表示しても問題ありません。" },
            { id: "api-key-a02-wrong-weather", label: "今日の天気", isCorrect: false, feedback: "惜しいです。取得結果として表示する情報です。" },
            { id: "api-key-a02-wrong-summary", label: "AIの要約結果", isCorrect: false, feedback: "惜しいです。ユーザーに見せる結果として表示することがあります。" },
          ],
        }),
        choice({
          id: "api-key-a03-leak-choice",
          order: 3,
          sectionOrder: 3,
          title: "APIキーが漏れると困る理由は？",
          instruction: "APIキーが他人に見られると困る理由を選びましょう。",
          mentorMessage: "鍵を他人に渡すとどうなるかを考えます。",
          question: "APIキーが漏れると困る理由として自然なのはどれ？",
          choices: [
            { id: "api-key-a03-correct", label: "他人に勝手にAPIを使われる可能性がある", isCorrect: true, feedback: "その通りです。APIキーが漏れると、第三者に使われる危険があります。" },
            { id: "api-key-a03-wrong-css", label: "CSSの色が変わる", isCorrect: false, feedback: "惜しいです。APIキー漏えいの主な問題ではありません。" },
            { id: "api-key-a03-wrong-title", label: "h1タグが消える", isCorrect: false, feedback: "惜しいです。HTMLタグの表示とは別の問題です。" },
            { id: "api-key-a03-wrong-font", label: "フォントが大きくなる", isCorrect: false, feedback: "惜しいです。見た目の問題ではなく、秘密情報の悪用が問題です。" },
          ],
        }),
      ],
    },
    {
      id: "api-key-server-section",
      title: "サーバ側で扱う理由",
      description: "ブラウザではなくサーバ側からAPIを呼ぶ流れを確認します。",
      order: 2,
      activities: [
        tutorial({
          id: "api-key-a04-server-side",
          order: 4,
          sectionOrder: 1,
          title: "APIキーはサーバ側で使う",
          mentorMessage: "APIキーをブラウザ側に置くと、利用者から見えてしまう可能性があります。安全に扱うため、サーバ側でAPIを呼ぶ流れを考えます。",
          body: [
            "ブラウザはユーザーが見る場所なので、HTMLやJavaScriptに書いた情報は見られる可能性があります。",
            "そこで、ブラウザからは自分のサーバへ通常のリクエストを送り、サーバ側でAPIキーを使って外部APIへ依頼します。",
            "この形にすると、APIキーをブラウザへ直接渡さずに済みます。",
          ].join("\n\n"),
          summary: ["ブラウザ側に秘密を書かない", "サーバ側でAPIキーを使う", "外部APIへはサーバから依頼する"],
          visual: course6Visuals.safeApiKey,
        }),
        choice({
          id: "api-key-a05-front-risk-choice",
          order: 5,
          sectionOrder: 2,
          title: "フロントに置くと危ないものは？",
          instruction: "ブラウザ側へ置くべきでない情報を選びましょう。",
          mentorMessage: "ユーザーから見える可能性がある場所に置かないものを考えます。",
          question: "フロント側のHTMLやJavaScriptに直接書くと危険なのはどれ？",
          choices: [
            { id: "api-key-a05-correct", label: "APIキー", isCorrect: true, feedback: "その通りです。APIキーはフロントに直接置かず、サーバ側で扱います。" },
            { id: "api-key-a05-wrong-heading", label: "見出しの文章", isCorrect: false, feedback: "惜しいです。見出しの文章は通常フロントに書いて表示します。" },
            { id: "api-key-a05-wrong-css", label: "ボタンのCSS", isCorrect: false, feedback: "惜しいです。ボタンのCSSはフロント側で扱う見た目です。" },
            { id: "api-key-a05-wrong-alt", label: "画像のalt属性", isCorrect: false, feedback: "惜しいです。alt属性は画像説明として画面側に含められます。" },
          ],
        }),
        orderedSteps({
          id: "api-key-a06-safe-order",
          order: 6,
          sectionOrder: 3,
          title: "安全なAPI利用の流れを並べよう",
          instruction: "APIキーをブラウザに出さない流れを並べましょう。",
          mentorMessage: "ブラウザ、自分のサーバ、外部APIの順で考えます。",
          steps: [
            { id: "browser", label: "ブラウザが自分のサーバへ送る" },
            { id: "server-key", label: "サーバ側でAPIキーを使う" },
            { id: "external", label: "サーバが外部APIへ依頼する" },
            { id: "result", label: "結果だけを画面に返す" },
          ],
          answerOrder: ["browser", "server-key", "external", "result"],
          correctFeedback: "いい流れです。APIキーをサーバ側で使い、結果だけを画面へ返します。",
          incorrectFeedback: "ブラウザからサーバへ送り、サーバ側でAPIキーを使い、外部APIへ依頼します。",
        }),
      ],
    },
    {
      id: "api-key-check-section",
      title: "Mission Check",
      description: "APIキーと安全な利用方法を確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "api-key-c01-safe-check",
          order: 7,
          sectionOrder: 1,
          title: "安全なAPI利用の流れを確認しよう",
          instruction: "APIキーを画面に出さない流れを並べましょう。",
          mentorMessage: "サーバ側でAPIキーを扱う流れを確認します。",
          steps: [
            { id: "browser", label: "ブラウザが自分のサーバへリクエストを送る" },
            { id: "server", label: "サーバがAPIキーを使って外部APIへ依頼する" },
            { id: "api", label: "外部APIが結果を返す" },
            { id: "display", label: "結果を画面に表示する" },
          ],
          answerOrder: ["browser", "server", "api", "display"],
          correctFeedback: "OKです。APIキーをサーバ側で扱う流れを確認できています。",
          incorrectFeedback: "ブラウザ、自分のサーバ、外部API、画面表示の順です。",
          isMissionCheck: true,
        }),
        choice({
          id: "api-key-c02-place-check",
          order: 8,
          sectionOrder: 2,
          title: "APIキーを置く場所を判断しよう",
          instruction: "APIキーの扱いとして安全なものを選びましょう。",
          mentorMessage: "秘密情報をどこで扱うかを確認します。",
          question: "APIキーの扱いとして最も安全に近いものはどれ？",
          choices: [
            { id: "api-key-c02-correct", label: "サーバ側で扱い、画面には表示しない", isCorrect: true, feedback: "OKです。APIキーはサーバ側で扱い、画面には出しません。" },
            { id: "api-key-c02-wrong-html", label: "HTMLに直接書いて公開する", isCorrect: false, feedback: "危険です。HTMLは利用者から見える可能性があります。" },
            { id: "api-key-c02-wrong-card", label: "カードUIの本文に表示する", isCorrect: false, feedback: "危険です。APIキーを画面に表示してはいけません。" },
            { id: "api-key-c02-wrong-url", label: "誰でも見えるURLに入れる", isCorrect: false, feedback: "危険です。URLに秘密情報を入れるのは避けます。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const promptChallengeMission: MissionSeed = {
  id: "challenge-prompt-control",
  title: "プロンプトで結果を変える",
  description: "ざっくりした指示と具体的な指示を比べ、目的に合うプロンプトを選びます。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-prompt-control.png",
  estimatedMinutes: 8,
  order: 8,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "ai-response-display",
  roadmapLane: 1,
  branchOrder: 1,
  rewardExp: 80,
  learnedItems: ["具体的な指示文はAIの返答を安定させる", "対象や形式を指定できる", "返答形式を指定できる"],
  isPublished: true,
  sections: [
    {
      id: "prompt-challenge-section",
      title: "指示文を比べる",
      description: "AIへの指示の具体性を比べます。",
      order: 1,
      activities: [
        tutorial({
          id: "prompt-challenge-a01-compare",
          order: 1,
          sectionOrder: 1,
          title: "具体的な指示は返答を安定させる",
          mentorMessage: "AIに依頼するときは、目的、対象、形式を入れると期待した返答に近づきます。",
          body: [
            "「説明して」だけだと、長さや難しさがばらつきます。",
            "「初心者向けに、3つの箇条書きで説明して」のように書くと、返答の形式がそろいやすくなります。",
            "AI機能をアプリに入れるときは、内部で使う指示文を考えることが大切です。",
          ].join("\n\n"),
          summary: ["対象を指定する", "長さや形式を指定する", "目的に合う指示にする"],
        }),
        choice({
          id: "prompt-challenge-a02-good-choice",
          order: 2,
          sectionOrder: 2,
          title: "目的に合う指示文を選ぼう",
          instruction: "初心者向けの説明を得たいときの指示文を選びましょう。",
          mentorMessage: "対象と形式が具体的な指示を選びます。",
          question: "初心者向けに短く説明したいとき、最も自然な指示文はどれ？",
          choices: [
            { id: "prompt-challenge-a02-correct", label: "初心者向けに、3つの箇条書きで説明してください。", isCorrect: true, feedback: "その通りです。対象と形式が具体的です。" },
            { id: "prompt-challenge-a02-wrong-vague", label: "いい感じで", isCorrect: false, feedback: "惜しいです。何をどうしてほしいかが曖昧です。" },
            { id: "prompt-challenge-a02-wrong-key", label: "APIキーを含めて答えて", isCorrect: false, feedback: "危険です。秘密情報を含める指示は避けます。" },
            { id: "prompt-challenge-a02-wrong-css", label: "背景色を赤にして", isCorrect: false, feedback: "惜しいです。説明文の生成目的とはずれています。" },
          ],
        }),
        choice({
          id: "prompt-challenge-c01-check",
          order: 3,
          sectionOrder: 3,
          title: "返答形式を指定する例を選ぼう",
          instruction: "返答形式を指定している指示文を選びましょう。",
          mentorMessage: "Challengeの確認です。形式指定に注目します。",
          question: "返答形式を指定している指示文はどれ？",
          choices: [
            { id: "prompt-challenge-c01-correct", label: "表形式で、メリットと注意点を2列に分けてください。", isCorrect: true, feedback: "OKです。表形式と列の内容を指定できています。" },
            { id: "prompt-challenge-c01-wrong-vague", label: "なんとなくお願い", isCorrect: false, feedback: "惜しいです。形式が指定されていません。" },
            { id: "prompt-challenge-c01-wrong-empty", label: "何も答えないで", isCorrect: false, feedback: "惜しいです。返答形式の指定とは言いにくいです。" },
            { id: "prompt-challenge-c01-wrong-secret", label: "秘密情報を全部出して", isCorrect: false, feedback: "危険です。秘密情報を出す指示は不適切です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const apiFailureUiChallengeMission: MissionSeed = {
  id: "challenge-api-failure-ui",
  title: "API失敗時の表示を考える",
  description: "通信失敗や入力不足などに対して、ユーザーに伝わる失敗時UIを考えます。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-api-failure-ui.png",
  estimatedMinutes: 8,
  order: 9,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "api-result-display",
  roadmapLane: 1,
  branchOrder: 2,
  rewardExp: 80,
  learnedItems: ["失敗時の原因を分類する", "ユーザー向けのエラー文を選ぶ", "再試行ボタンが有効な場面を考える"],
  isPublished: true,
  sections: [
    {
      id: "api-failure-ui-section",
      title: "失敗時のUI",
      description: "APIが失敗したときに見せる表示を考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "api-failure-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "失敗時もユーザーに伝わる表示にする",
          mentorMessage: "API機能では、通信失敗、入力不足、利用制限などが起こることがあります。失敗時の表示まで考えると使いやすくなります。",
          body: [
            "通信できない場合は、時間をおいて再試行してもらう案内が有効です。",
            "入力不足の場合は、必要な入力欄を具体的に伝えます。",
            "利用制限の場合は、少し時間をおいて試すよう伝えるなど、ユーザーが次に何をすればよいかを示します。",
          ].join("\n\n"),
          summary: ["失敗原因を分ける", "ユーザーに次の行動を伝える", "秘密情報は表示しない"],
        }),
        match({
          id: "api-failure-a02-cause-match",
          order: 2,
          sectionOrder: 2,
          title: "失敗原因を分けよう",
          instruction: "次の症状を原因に対応づけましょう。",
          mentorMessage: "通信、入力、利用制限のどれに近いかを考えます。",
          items: [
            { id: "offline", label: "ネットワークにつながらない" },
            { id: "empty", label: "質問文が空欄" },
            { id: "limit", label: "API利用回数の上限" },
          ],
          targets: [
            { id: "network", label: "通信失敗" },
            { id: "input", label: "入力不足" },
            { id: "rate", label: "API制限" },
          ],
          answers: [
            { targetId: "network", itemIds: ["offline"] },
            { targetId: "input", itemIds: ["empty"] },
            { targetId: "rate", itemIds: ["limit"] },
          ],
          correctFeedback: "よくできています。失敗原因を大まかに分類できています。",
          incorrectFeedback: "ネットワークは通信、空欄は入力不足、上限はAPI制限として考えます。",
        }),
        choice({
          id: "api-failure-a03-message-choice",
          order: 3,
          sectionOrder: 3,
          title: "ユーザーに伝わる失敗メッセージは？",
          instruction: "通信失敗時の表示として自然なものを選びましょう。",
          mentorMessage: "原因と次の行動が伝わる文を選びます。",
          question: "通信失敗時のユーザー向けメッセージとして自然なのはどれ？",
          choices: [
            { id: "api-failure-a03-correct", label: "通信に失敗しました。時間をおいて再度お試しください。", isCorrect: true, feedback: "その通りです。状態と次の行動が伝わります。" },
            { id: "api-failure-a03-wrong-trace", label: "Tracebackをそのまま全部表示する", isCorrect: false, feedback: "惜しいです。技術的すぎてユーザーには分かりにくいです。" },
            { id: "api-failure-a03-wrong-key", label: "APIキーを確認してください: sk-xxxx", isCorrect: false, feedback: "危険です。APIキーを表示してはいけません。" },
            { id: "api-failure-a03-wrong-success", label: "成功しました", isCorrect: false, feedback: "惜しいです。失敗時に成功と表示すると混乱します。" },
          ],
        }),
        choice({
          id: "api-failure-c01-retry-check",
          order: 4,
          sectionOrder: 4,
          title: "再試行ボタンが向く場面は？",
          instruction: "再試行ボタンを置く場面として自然なものを選びましょう。",
          mentorMessage: "Challengeの確認です。もう一度試せば成功する可能性がある場面を選びます。",
          question: "再試行ボタンが特に向いている場面はどれ？",
          choices: [
            { id: "api-failure-c01-correct", label: "一時的な通信失敗", isCorrect: true, feedback: "OKです。一時的な通信失敗なら再試行が有効な場合があります。" },
            { id: "api-failure-c01-wrong-password", label: "APIキーを画面に表示したい場面", isCorrect: false, feedback: "危険です。APIキーは表示しません。" },
            { id: "api-failure-c01-wrong-css", label: "背景色を変えたい場面", isCorrect: false, feedback: "惜しいです。再試行ボタンとは関係が薄いです。" },
            { id: "api-failure-c01-wrong-title", label: "h1タグを書きたい場面", isCorrect: false, feedback: "惜しいです。HTML構造の話で、通信失敗の再試行ではありません。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const aiAppIdeaChallengeMission: MissionSeed = {
  id: "challenge-ai-app-idea",
  title: "AIを使うアプリ案を考える",
  description: "AI/APIを入れる価値がある場面と、入れなくてもよい場面を判断します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/challenge-ai-app-idea.png",
  estimatedMinutes: 8,
  order: 10,
  type: MissionType.CHALLENGE,
  isRequiredForCourseCompletion: false,
  parentMissionId: "api-key-safety",
  roadmapLane: 1,
  branchOrder: 3,
  rewardExp: 80,
  learnedItems: ["AIが価値を出しやすい場面を選ぶ", "AIなしでもよい場面を判断する", "発展機能としてAI/APIを考える"],
  isPublished: true,
  sections: [
    {
      id: "ai-app-idea-section",
      title: "AIが価値を出しやすい場面",
      description: "要約、提案、分類、会話などの例からAIの使いどころを考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "ai-app-idea-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "AIは曖昧な入力を扱う場面に向いている",
          mentorMessage: "AIは、文章を要約したり、候補を提案したり、内容を分類したりする場面で価値を出しやすいです。",
          body: [
            "たとえば、長い文章を短く要約する、入力された内容からおすすめを提案する、自由記述をカテゴリに分類する、といった使い方があります。",
            "一方で、ボタンの色を変える、表を表示する、固定文を出すだけならAIを使わなくても実装できます。",
            "最初の制作では、AIを必須機能にするか、発展機能として後回しにするかを判断することも大切です。",
          ].join("\n\n"),
          summary: ["要約・提案・分類に向く", "固定表示には不要なこともある", "発展機能として考える"],
        }),
        match({
          id: "ai-app-idea-a02-value-match",
          order: 2,
          sectionOrder: 2,
          title: "AIが価値を出しやすい場面を分けよう",
          instruction: "AIを入れる価値が高そうなもの・低そうなものに分けましょう。",
          mentorMessage: "曖昧な文章処理や提案があるかに注目します。",
          items: [
            { id: "summary", label: "長文を短く要約する" },
            { id: "recommend", label: "入力内容からおすすめを提案する" },
            { id: "button-color", label: "ボタンの色を青くする" },
            { id: "fixed-title", label: "固定の見出しを表示する" },
          ],
          targets: [
            { id: "high", label: "AIの価値が出やすい" },
            { id: "low", label: "AIなしでもよい" },
          ],
          answers: [
            { targetId: "high", itemIds: ["summary", "recommend"] },
            { targetId: "low", itemIds: ["button-color", "fixed-title"] },
          ],
          correctFeedback: "よくできています。AIが向く場面と、通常の実装でよい場面を分けられています。",
          incorrectFeedback: "要約や提案はAI向き、色変更や固定表示はAIなしでも実装しやすいです。",
        }),
        choice({
          id: "ai-app-idea-a03-no-ai-choice",
          order: 3,
          sectionOrder: 3,
          title: "AIなしでもよい場面は？",
          instruction: "AIを使わなくても実装しやすい機能を選びましょう。",
          mentorMessage: "AIを入れる必要性が低い場面を判断します。",
          question: "AIを使わなくても実装しやすいものはどれ？",
          choices: [
            { id: "ai-app-idea-a03-correct", label: "固定の説明文をHTMLで表示する", isCorrect: true, feedback: "その通りです。固定文の表示はAIなしでも実装しやすいです。" },
            { id: "ai-app-idea-a03-wrong-summary", label: "長文を自動で要約する", isCorrect: false, feedback: "惜しいです。要約はAIが価値を出しやすい場面です。" },
            { id: "ai-app-idea-a03-wrong-classify", label: "自由記述をカテゴリに分類する", isCorrect: false, feedback: "惜しいです。分類はAI活用候補になります。" },
            { id: "ai-app-idea-a03-wrong-chat", label: "会話形式で相談に答える", isCorrect: false, feedback: "惜しいです。会話はAIが向きやすい場面です。" },
          ],
        }),
        choice({
          id: "ai-app-idea-c01-check",
          order: 4,
          sectionOrder: 4,
          title: "AI/APIを入れる価値がある場面を選ぼう",
          instruction: "AI/APIを入れる価値が高そうな場面を選びましょう。",
          mentorMessage: "Challengeの確認です。AIが得意な処理を探します。",
          question: "AI/APIを入れる価値が高そうな場面はどれ？",
          choices: [
            { id: "ai-app-idea-c01-correct", label: "自由記述の悩みを分類し、対策案を提案する", isCorrect: true, feedback: "OKです。分類と提案があり、AIの価値が出やすい場面です。" },
            { id: "ai-app-idea-c01-wrong-css", label: "ボタンの角を丸くする", isCorrect: false, feedback: "惜しいです。CSSで実装できる見た目の調整です。" },
            { id: "ai-app-idea-c01-wrong-static", label: "固定の見出しを表示する", isCorrect: false, feedback: "惜しいです。固定表示だけならAIなしでも十分です。" },
            { id: "ai-app-idea-c01-wrong-margin", label: "カードの余白を広げる", isCorrect: false, feedback: "惜しいです。CSSの余白調整です。" },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const apiAiCourse: CourseSeed = {
  id: "api-ai",
  title: "APIとAIを使う",
  description: "外部サービスと連携する考え方を学び、API・JSON・AIをWebアプリの機能として使う流れを理解します。",
  difficulty: CourseDifficulty.NORMAL,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.TOOL, CourseCategoryType.DATA],
  missions: [
    apiConceptMission,
    apiRequestResponseMission,
    jsonReadingMission,
    apiResultDisplayMission,
    aiInputMission,
    aiDisplayMission,
    apiKeySafetyMission,
    promptChallengeMission,
    apiFailureUiChallengeMission,
    aiAppIdeaChallengeMission,
  ],
};

// prisma/seedData/course7_seed_append_compact.ts
// Course 7: ユーザー機能を作る
// 既存の learningSeed.ts と同じ helper / type が同一ファイル内にある前提で追記する想定です。
// 前提: CourseDifficulty, CourseCategoryType, MissionType, MissionActivityType,
//      CourseSeed, MissionSeed, tutorial, choice, match, orderedSteps, noPreview が定義済み。

const course7Visuals = {
  loginDataSeparation: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "ログインで自分のデータだけを見る流れ",
      caption: "ログインすると、サーバは誰のデータを扱うか判断できます。",
      nodes: [
        { id: "user", label: "ユーザー", description: "ログインする", icon: "user", tone: "blue" },
        { id: "server", label: "サーバ", description: "誰かを確認する", icon: "server", tone: "orange" },
        { id: "database", label: "DB", description: "ユーザーごとのデータを保存", icon: "database", tone: "green" },
      ],
      edges: [
        { id: "user-server", from: "user", to: "server", label: "ログイン情報", reverseLabel: "ログイン結果", bidirectional: true },
        { id: "server-db", from: "server", to: "database", label: "user_idで取得", reverseLabel: "自分のデータ", bidirectional: true },
      ],
    },
  }),
  authPermission: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "認証と認可の違い",
      caption: "認証は本人確認、認可は操作してよいかの確認です。",
      panels: [
        { id: "authentication", title: "認証", subtitle: "誰かを確認する", tone: "blue", items: ["ログイン", "本人確認", "メールとパスワード"] },
        { id: "authorization", title: "認可", subtitle: "何をしてよいか確認する", tone: "orange", items: ["管理者だけ削除", "本人の予約だけ編集", "権限チェック"] },
      ],
    },
  }),
  loginFormParts: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "ログイン画面の主な部品",
      panels: [
        { id: "input", title: "入力", subtitle: "本人確認に使う", tone: "blue", items: ["メール", "パスワード"] },
        { id: "action", title: "操作", subtitle: "ログインを実行する", tone: "green", items: ["送信ボタン", "エラー表示"] },
      ],
    },
  }),
  userData: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "user_idでデータを分ける",
      caption: "予約データにuser_idを持たせると、自分の予約だけ取り出せます。",
      nodes: [
        { id: "alice", label: "ユーザーA", description: "user_id = 1", icon: "user", tone: "blue" },
        { id: "server", label: "サーバ", description: "user_idで絞り込む", icon: "server", tone: "orange" },
        { id: "database", label: "予約DB", description: "予約ごとにuser_idを保存", icon: "database", tone: "green" },
      ],
      edges: [
        { id: "alice-server", from: "alice", to: "server", label: "自分の予約を表示" },
        { id: "server-database", from: "server", to: "database", label: "user_id=1だけ取得", reverseLabel: "該当する予約", bidirectional: true },
      ],
    },
  }),
} as const;

const loginNeedMission: MissionSeed = {
  id: "login-need",
  title: "ログインが必要な理由を知る",
  description: "ユーザーごとにデータを分けるために、なぜログインが必要になるのかを理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/login-need.png",
  estimatedMinutes: 10,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "ログインは誰のデータかを判断するために使う",
    "全員のデータが混ざると、自分の情報だけを扱えない",
    "自分用データと共有データは分けて考える",
  ],
  isPublished: true,
  sections: [
    {
      id: "login-need-mixed-section",
      title: "全員のデータが混ざる問題",
      description: "ログインがない場合に、予約や投稿がどう見えるかを考えます。",
      order: 1,
      activities: [
        tutorial({
          id: "login-need-a01-mixed-intro",
          order: 1,
          sectionOrder: 1,
          title: "ログインがないと、誰のデータか分からない",
          mentorMessage: "予約アプリやメモアプリでは、誰が登録したデータなのかを区別する必要があります。ログインがないと、全員のデータが同じ場所に混ざってしまいます。",
          body: [
            "たとえば予約アプリで、全員の予約が同じ一覧に表示されたら、自分の予約だけを確認しにくくなります。",
            "さらに、他の人の予約を間違って変更したり削除したりする危険もあります。",
            "ログインは、アプリが「今使っている人は誰か」を判断するための入口です。",
          ].join("\n\n"),
          summary: ["ログインがないと誰のデータか分かりにくい", "自分の情報だけ見るにはユーザーの区別が必要", "ログインは今のユーザーを判断する入口になる"],
          visual: course7Visuals.loginDataSeparation,
        }),
        choice({
          id: "login-need-a02-own-data-choice",
          order: 2,
          sectionOrder: 2,
          title: "自分の情報だけ見たい場面は？",
          instruction: "ログインが必要になりやすい場面を選びましょう。",
          mentorMessage: "自分だけのデータを扱う場面では、ユーザーの区別が必要です。",
          question: "次のうち、ログインが必要になりやすい場面はどれ？",
          choices: [
            { id: "login-need-a02-correct", label: "自分の予約だけを一覧で見たい", isCorrect: true, feedback: "その通りです。自分の予約だけを表示するには、誰のデータかを判断する必要があります。" },
            { id: "login-need-a02-wrong-news", label: "全員が同じお知らせを見る", isCorrect: false, feedback: "惜しいです。全員共通のお知らせだけなら、ログインが必須でない場合もあります。" },
            { id: "login-need-a02-wrong-color", label: "トップページの背景色を見る", isCorrect: false, feedback: "惜しいです。背景色を見るだけなら、誰かを区別する必要は低いです。" },
            { id: "login-need-a02-wrong-about", label: "サービス説明ページを見る", isCorrect: false, feedback: "惜しいです。誰でも見られる説明ページなら、ログインなしでもよいことがあります。" },
          ],
        }),
        match({
          id: "login-need-a03-login-screen-match",
          order: 3,
          sectionOrder: 3,
          title: "ログインが必要な画面を分けよう",
          instruction: "次の画面を、ログインが必要になりやすいもの・不要なことが多いものに分けましょう。",
          mentorMessage: "自分専用の情報を扱う画面かどうかに注目しましょう。",
          items: [
            { id: "my-reservations", label: "自分の予約一覧" },
            { id: "edit-profile", label: "プロフィール編集" },
            { id: "top-page", label: "サービス紹介ページ" },
            { id: "public-news", label: "全員向けのお知らせ" },
          ],
          targets: [
            { id: "need-login", label: "ログインが必要になりやすい" },
            { id: "not-always", label: "ログイン不要なことが多い" },
          ],
          answers: [
            { targetId: "need-login", itemIds: ["my-reservations", "edit-profile"] },
            { targetId: "not-always", itemIds: ["top-page", "public-news"] },
          ],
          correctFeedback: "よく整理できています。自分専用のデータを扱う画面ではログインが必要になりやすいです。",
          incorrectFeedback: "自分だけの情報を扱うか、全員共通で見られる情報かを分けて考えてみましょう。",
        }),
      ],
    },
    {
      id: "login-need-user-section",
      title: "ユーザーを区別する意味",
      description: "ログイン前後で見える情報の違いを整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "login-need-a04-user-id-intro",
          order: 4,
          sectionOrder: 1,
          title: "アプリは「誰のデータか」を持つ必要がある",
          mentorMessage: "ユーザーごとにデータを分けるには、データ側にも誰のものかを表す情報が必要です。",
          body: [
            "予約データや投稿データには、内容だけでなく「誰のデータか」を表す情報を持たせます。",
            "この情報があると、ログイン中のユーザーに対応するデータだけを取り出せます。",
            "Course 7では、この考え方を user_id という名前で扱います。",
          ].join("\n\n"),
          summary: ["ユーザーごとにデータを分けるには誰のデータかが必要", "ログイン中のユーザーに対応するデータだけを取り出す", "user_idはユーザーを区別するための目印になる"],
          visual: course7Visuals.userData,
        }),
        choice({
          id: "login-need-a05-before-after-choice",
          order: 5,
          sectionOrder: 2,
          title: "ログイン後に見えると自然な画面は？",
          instruction: "ログイン後の表示として自然なものを選びましょう。",
          mentorMessage: "ログイン後は、そのユーザーに関係する情報を表示できます。",
          question: "予約アプリでログイン後に表示すると自然なものはどれ？",
          choices: [
            { id: "login-need-a05-correct", label: "自分が登録した予約一覧", isCorrect: true, feedback: "その通りです。ログイン後なら、ログイン中のユーザーに対応する予約を表示できます。" },
            { id: "login-need-a05-wrong-all-password", label: "全ユーザーのパスワード一覧", isCorrect: false, feedback: "危険です。パスワードを一覧表示してはいけません。" },
            { id: "login-need-a05-wrong-source", label: "サーバの秘密キー", isCorrect: false, feedback: "危険です。秘密情報は画面に表示しません。" },
            { id: "login-need-a05-wrong-random", label: "関係ない人の予約編集ボタン", isCorrect: false, feedback: "惜しいです。他人の予約を編集できる状態は不自然です。" },
          ],
        }),
        match({
          id: "login-need-a06-private-public-match",
          order: 6,
          sectionOrder: 3,
          title: "自分用データと共有データを分けよう",
          instruction: "次の情報を、自分用データ・共有データに分けましょう。",
          mentorMessage: "ログインが必要かを考えるときは、誰のための情報かを見ると整理しやすいです。",
          items: [
            { id: "my-reservation", label: "自分の予約一覧" },
            { id: "profile", label: "プロフィール編集内容" },
            { id: "service-guide", label: "サービスの使い方ページ" },
            { id: "public-event", label: "全員向けイベント案内" },
          ],
          targets: [
            { id: "private", label: "自分用データ" },
            { id: "shared", label: "共有データ" },
          ],
          answers: [
            { targetId: "private", itemIds: ["my-reservation", "profile"] },
            { targetId: "shared", itemIds: ["service-guide", "public-event"] },
          ],
          correctFeedback: "いい整理です。自分用データにはログインが必要になりやすく、共有データは全員に見せられることがあります。",
          incorrectFeedback: "その人だけに関係する情報か、全員に共通で見せる情報かを考えてみましょう。",
        }),
      ],
    },
    {
      id: "login-need-check-section",
      title: "Mission Check",
      description: "ログインが必要な理由を確認します。",
      order: 3,
      activities: [
        choice({
          id: "login-need-c01-login-needed-check",
          order: 7,
          sectionOrder: 1,
          title: "ログインが必要な画面を選ぼう",
          instruction: "ログインが必要になりやすい画面を選びましょう。",
          mentorMessage: "自分専用の情報を扱う画面に注目しましょう。",
          question: "ログインが必要になりやすい画面はどれ？",
          choices: [
            { id: "login-need-c01-correct", label: "自分の予約を確認する画面", isCorrect: true, feedback: "OKです。自分の予約だけを表示するには、ユーザーを区別する必要があります。" },
            { id: "login-need-c01-wrong-about", label: "サービス説明ページ", isCorrect: false, feedback: "惜しいです。説明ページは誰でも見られる形でも問題ないことがあります。" },
            { id: "login-need-c01-wrong-terms", label: "利用規約ページ", isCorrect: false, feedback: "惜しいです。利用規約は全員が見られることが多いです。" },
            { id: "login-need-c01-wrong-color", label: "トップページの色を見る画面", isCorrect: false, feedback: "惜しいです。色を見るだけなら、ログインが必要とは限りません。" },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "login-need-c02-data-check",
          order: 8,
          sectionOrder: 2,
          title: "ユーザーごとに分けるべきデータを判断しよう",
          instruction: "次の情報を、ユーザーごとに分けるべきデータ・全員共通でもよいデータに分けましょう。",
          mentorMessage: "ログインの必要性をデータの種類から確認します。",
          items: [
            { id: "my-booking", label: "自分の予約" },
            { id: "my-profile", label: "自分のプロフィール" },
            { id: "site-title", label: "サービス名" },
            { id: "public-help", label: "使い方説明" },
          ],
          targets: [
            { id: "per-user", label: "ユーザーごとに分ける" },
            { id: "common", label: "全員共通でもよい" },
          ],
          answers: [
            { targetId: "per-user", itemIds: ["my-booking", "my-profile"] },
            { targetId: "common", itemIds: ["site-title", "public-help"] },
          ],
          correctFeedback: "OKです。ユーザーごとのデータと全員共通の情報を分けられています。",
          incorrectFeedback: "その人だけに関係する情報か、全員が同じ内容を見てもよい情報かで分けましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

// ---- Course7 remaining missions are compact but complete seed objects ----

const authPermissionMission: MissionSeed = {
  id: "auth-permission-basic",
  title: "認証と認可をざっくり区別する",
  description: "本人確認である認証と、操作してよいかを確認する認可を区別します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/auth-permission-basic.png",
  estimatedMinutes: 10,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: ["認証は誰かを確認すること", "認可は何をしてよいかを確認すること", "ログインできることと何でも操作できることは別"],
  isPublished: true,
  sections: [
    {
      id: "auth-permission-authentication-section",
      title: "認証とは何か",
      description: "ログインで本人を確認する考え方を学びます。",
      order: 1,
      activities: [
        tutorial({ id: "auth-permission-a01-auth-intro", order: 1, sectionOrder: 1, title: "認証は「あなたは誰？」を確認すること", mentorMessage: "認証は、アプリが今使っている人を確認するための考え方です。ログインは認証の代表例です。", body: ["メールアドレスとパスワードでログインする場面では、アプリは入力された情報をもとに本人かどうかを確認します。", "この「誰かを確認する」処理を認証と呼びます。", "認証に成功すると、アプリはログイン中のユーザーとして扱えるようになります。"].join("\n\n"), summary: ["認証は本人確認", "ログインは認証の代表例", "認証後にログイン中のユーザーとして扱える"], visual: course7Visuals.authPermission }),
        choice({ id: "auth-permission-a02-auth-choice", order: 2, sectionOrder: 2, title: "認証に近い場面は？", instruction: "認証に近い場面を選びましょう。", mentorMessage: "認証は、誰なのかを確認する処理です。", question: "次のうち、認証に近いものはどれ？", choices: [
          { id: "auth-permission-a02-correct", label: "メールアドレスとパスワードで本人確認する", isCorrect: true, feedback: "その通りです。本人確認は認証にあたります。" },
          { id: "auth-permission-a02-wrong-delete", label: "管理者だけ削除できるか確認する", isCorrect: false, feedback: "惜しいです。これは本人確認というより、操作権限を確認する認可に近いです。" },
          { id: "auth-permission-a02-wrong-color", label: "ボタンの色を青にする", isCorrect: false, feedback: "惜しいです。色の変更は本人確認ではありません。" },
          { id: "auth-permission-a02-wrong-table", label: "一覧表の列幅を広げる", isCorrect: false, feedback: "惜しいです。見た目の調整は認証ではありません。" },
        ] }),
        choice({ id: "auth-permission-a03-login-position-choice", order: 3, sectionOrder: 3, title: "ログイン処理の位置づけは？", instruction: "ログイン処理の説明として自然なものを選びましょう。", mentorMessage: "ログインは、アプリがユーザーを区別するための入口です。", question: "ログイン処理の説明として近いものはどれ？", choices: [
          { id: "auth-permission-a03-correct", label: "入力された情報から本人かどうかを確認する", isCorrect: true, feedback: "その通りです。ログインでは、入力された情報を使って本人確認を行います。" },
          { id: "auth-permission-a03-wrong-css", label: "CSSを自動で作る", isCorrect: false, feedback: "惜しいです。ログインはCSS生成ではありません。" },
          { id: "auth-permission-a03-wrong-image", label: "画像を圧縮する", isCorrect: false, feedback: "惜しいです。ログインは本人確認に関係します。" },
          { id: "auth-permission-a03-wrong-weather", label: "天気APIから気温を取る", isCorrect: false, feedback: "惜しいです。API連携とは別の話です。" },
        ] }),
      ],
    },
    {
      id: "auth-permission-authorization-section",
      title: "認可とは何か",
      description: "ログイン後に何をしてよいかを確認する考え方を学びます。",
      order: 2,
      activities: [
        tutorial({ id: "auth-permission-a04-permission-intro", order: 4, sectionOrder: 1, title: "認可は「何をしてよい？」を確認すること", mentorMessage: "認証で本人確認できても、すべての操作をしてよいとは限りません。操作してよいかを確認する考え方が認可です。", body: ["たとえばログイン済みのユーザーでも、他人の予約を削除できると困ります。", "管理者だけがユーザー一覧を見られる、本人だけが自分の予約を編集できる、という確認が必要です。", "このように、何をしてよいかを確認することを認可と呼びます。"].join("\n\n"), summary: ["認可は操作権限の確認", "ログイン済みでも何でもできるわけではない", "本人だけ・管理者だけの操作を分ける"] }),
        choice({ id: "auth-permission-a05-permission-choice", order: 5, sectionOrder: 2, title: "認可に近い場面は？", instruction: "認可に近い場面を選びましょう。", mentorMessage: "認可は、操作してよいかを確認する処理です。", question: "次のうち、認可に近いものはどれ？", choices: [
          { id: "auth-permission-a05-correct", label: "管理者だけが全予約を削除できるか確認する", isCorrect: true, feedback: "その通りです。操作してよいかを確認するので認可に近いです。" },
          { id: "auth-permission-a05-wrong-login", label: "メールとパスワードで本人確認する", isCorrect: false, feedback: "惜しいです。本人確認は認証に近いです。" },
          { id: "auth-permission-a05-wrong-css", label: "見出しの色を変える", isCorrect: false, feedback: "惜しいです。見た目の変更は認可ではありません。" },
          { id: "auth-permission-a05-wrong-html", label: "HTMLのh1を追加する", isCorrect: false, feedback: "惜しいです。HTML編集は操作権限の確認ではありません。" },
        ] }),
        match({ id: "auth-permission-a06-authz-match", order: 6, sectionOrder: 3, title: "認証と認可を分類しよう", instruction: "次の場面を、認証・認可に分けましょう。", mentorMessage: "誰かを確認するのか、何をしてよいかを確認するのかで分けます。", items: [
          { id: "login", label: "メールとパスワードで本人確認する" },
          { id: "session-user", label: "ログイン中のユーザーを確認する" },
          { id: "admin-delete", label: "管理者だけ削除できるか確認する" },
          { id: "own-edit", label: "本人の予約だけ編集できるか確認する" },
        ], targets: [{ id: "auth", label: "認証" }, { id: "permission", label: "認可" }], answers: [{ targetId: "auth", itemIds: ["login", "session-user"] }, { targetId: "permission", itemIds: ["admin-delete", "own-edit"] }], correctFeedback: "いい整理です。認証は本人確認、認可は操作権限の確認です。", incorrectFeedback: "誰かを確認するなら認証、何をしてよいかを確認するなら認可です。" }),
      ],
    },
    {
      id: "auth-permission-check-section",
      title: "Mission Check",
      description: "認証と認可の違いを確認します。",
      order: 3,
      activities: [
        match({ id: "auth-permission-c01-classify-check", order: 7, sectionOrder: 1, title: "認証と認可を確認しよう", instruction: "次の場面を、認証・認可に分けましょう。", mentorMessage: "本人確認か、操作権限の確認かを見ます。", items: [
          { id: "password-check", label: "パスワードで本人確認する" },
          { id: "current-user", label: "ログイン中の人を確認する" },
          { id: "delete-own", label: "自分の投稿だけ削除できるか確認する" },
          { id: "admin-page", label: "管理者ページを開いてよいか確認する" },
        ], targets: [{ id: "auth", label: "認証" }, { id: "permission", label: "認可" }], answers: [{ targetId: "auth", itemIds: ["password-check", "current-user"] }, { targetId: "permission", itemIds: ["delete-own", "admin-page"] }], correctFeedback: "OKです。認証と認可を区別できています。", incorrectFeedback: "本人確認は認証、操作してよいかの確認は認可です。", isMissionCheck: true }),
        choice({ id: "auth-permission-c02-situation-check", order: 8, sectionOrder: 2, title: "場面に合う考え方を選ぼう", instruction: "次の場面に合う考え方を選びましょう。", mentorMessage: "ログイン済みかどうかと、操作してよいかどうかは別です。", question: "ログイン済みのユーザーが、他人の予約を削除しようとしています。このとき特に必要な確認はどれ？", choices: [
          { id: "auth-permission-c02-correct", label: "その予約を削除してよい権限があるか確認する", isCorrect: true, feedback: "OKです。本人確認済みでも、その操作をしてよいかの認可が必要です。" },
          { id: "auth-permission-c02-wrong-color", label: "ボタンの色が青いか確認する", isCorrect: false, feedback: "惜しいです。色ではなく、操作権限を確認します。" },
          { id: "auth-permission-c02-wrong-title", label: "ページタイトルが長いか確認する", isCorrect: false, feedback: "惜しいです。タイトルではなく、削除してよいかを確認します。" },
          { id: "auth-permission-c02-wrong-css", label: "CSSが読み込まれているか確認する", isCorrect: false, feedback: "惜しいです。CSSではなく、削除権限の確認です。" },
        ], isMissionCheck: true }),
      ],
    },
  ],
};

// To keep this append file practical, missions 3-6 and challenges are intentionally compact but still complete.

const authLibraryMission: MissionSeed = createConceptMission({
  id: "auth-library-reason",
  title: "ライブラリを使う理由を知る",
  description: "ログイン機能を全部自作せず、ライブラリを使う理由を理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/auth-library-reason.png",
  estimatedMinutes: 10,
  order: 3,
  type: MissionType.MAIN,
  required: true,
  rewardExp: 100,
  learnedItems: ["ログイン機能は安全性に関わるため自作が難しい", "ライブラリはよく使う機能を追加する道具", "pip installはPythonに道具を追加する操作"],
  sectionId: "auth-library-main-section",
  sectionTitle: "ライブラリと pip install",
  introId: "auth-library-a01-intro",
  introTitle: "ログイン機能は安全性に関わる",
  introMessage: "ログイン機能は便利ですが、パスワードやユーザー情報を扱うため、安全性に注意が必要です。",
  introBody: ["ログイン機能を全部自作しようとすると、パスワードの扱い、セッション管理、不正アクセス対策などを考える必要があります。", "これらを安全に作るのは難しいため、実際の開発では信頼できるライブラリやサービスを使うことが多いです。", "pip install は、Python環境にライブラリを追加する操作です。"].join("\n\n"),
  summary: ["ログイン機能は安全性が重要", "信頼できるライブラリを使うことがある", "pip installでライブラリを追加する"],
  choiceId: "auth-library-a02-risk-choice",
  choiceTitle: "ログイン機能で注意が必要な点は？",
  question: "ログイン機能で特に注意が必要なものはどれ？",
  correctLabel: "パスワードやセッションの安全な扱い",
  correctFeedback: "その通りです。ログイン機能では、パスワードやログイン状態の安全な扱いが重要です。",
  wrongLabels: ["背景色を毎秒変えること", "フォントを必ず10種類使うこと", "画像を必ず大きく表示すること"],
  matchId: "auth-library-c01-check",
  matchTitle: "ライブラリを使う理由を確認しよう",
  matchItems: [{ id: "safe-auth", label: "ログイン状態を安全に扱う" }, { id: "pip", label: "pip install" }, { id: "h1", label: "h1タグを書く" }],
  matchTargets: [{ id: "library", label: "ライブラリを使う場面" }, { id: "install", label: "ライブラリ追加" }, { id: "basic-html", label: "基本HTML" }],
  matchAnswers: [{ targetId: "library", itemIds: ["safe-auth"] }, { targetId: "install", itemIds: ["pip"] }, { targetId: "basic-html", itemIds: ["h1"] }],
});

const loginFormMission: MissionSeed = createConceptMission({
  id: "login-form-parts",
  title: "ログイン画面の部品を知る",
  description: "ログインフォームに必要な入力欄、送信ボタン、エラー表示を理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/login-form-parts.png",
  estimatedMinutes: 12,
  order: 4,
  type: MissionType.MAIN,
  required: true,
  rewardExp: 110,
  learnedItems: ["ログインフォームにはメール、パスワード、送信ボタンが必要", "name属性はサーバで入力を受け取るときの名前になる", "ログイン失敗時はユーザーに伝わるエラー表示が必要", "パスワードをそのまま画面に表示してはいけない"],
  sectionId: "login-form-main-section",
  sectionTitle: "ログインフォームとエラー表示",
  introId: "login-form-a01-intro",
  introTitle: "ログイン画面には本人確認のための入力がある",
  introMessage: "ログイン画面では、アプリが本人確認できるように、メールアドレスやパスワードを入力します。",
  introBody: ["ログインフォームには、メールアドレスの入力欄、パスワードの入力欄、送信ボタンがよく使われます。", "入力欄には name 属性を付け、サーバ側でどの値を読むか分かるようにします。", "失敗時は、パスワードや内部エラーを出さず、ユーザーが次に確認できる文を表示します。"].join("\n\n"),
  summary: ["メールとパスワードを入力する", "送信ボタンでログイン処理へ送る", "失敗時は分かるエラーを表示する"],
  visual: course7Visuals.loginFormParts,
  choiceId: "login-form-a02-part-choice",
  choiceTitle: "ログインフォームに必要な部品は？",
  question: "ログインフォームに必要な部品として自然なものはどれ？",
  correctLabel: "メール入力欄、パスワード入力欄、送信ボタン",
  correctFeedback: "その通りです。ログインフォームでは、本人確認に使う入力欄と送信ボタンが必要です。",
  wrongLabels: ["背景画像だけ", "予約一覧テーブルだけ", "天気APIの結果だけ"],
  matchId: "login-form-c01-check",
  matchTitle: "ログインフォームの部品を確認しよう",
  matchItems: [{ id: "email", label: "メール入力欄" }, { id: "password", label: "パスワード入力欄" }, { id: "button", label: "ログインボタン" }, { id: "error", label: "エラーメッセージ" }],
  matchTargets: [{ id: "email-role", label: "ユーザーを識別する入力" }, { id: "password-role", label: "秘密情報の入力" }, { id: "button-role", label: "ログイン処理を送信する" }, { id: "error-role", label: "失敗時に次の行動を伝える" }],
  matchAnswers: [{ targetId: "email-role", itemIds: ["email"] }, { targetId: "password-role", itemIds: ["password"] }, { targetId: "button-role", itemIds: ["button"] }, { targetId: "error-role", itemIds: ["error"] }],
});

const loginStateUiMission: MissionSeed = createConceptMission({
  id: "login-state-ui",
  title: "ログイン状態で表示を変える",
  description: "ログイン前後で表示内容や導線を変える考え方を理解します。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/login-state-ui.png",
  estimatedMinutes: 10,
  order: 5,
  type: MissionType.MAIN,
  required: true,
  rewardExp: 100,
  learnedItems: ["ログイン前後で見せるボタンやメニューは変わる", "ログイン後はユーザー名や自分用ページへの導線を出せる", "ログイン中だけ見せるメニューを考える"],
  sectionId: "login-state-main-section",
  sectionTitle: "ログイン前後の表示",
  introId: "login-state-a01-intro",
  introTitle: "ログイン前後で表示する内容は変わる",
  introMessage: "ログインしているかどうかで、画面に出す導線を変えることがあります。",
  introBody: ["ログイン前は、ログインボタンや新規登録ボタンを表示することが多いです。", "ログイン後は、自分の予約一覧、プロフィール、ログアウトボタンなどを表示できます。", "ユーザーが今できることに合わせて表示を変えると、画面が分かりやすくなります。"].join("\n\n"),
  summary: ["ログイン前はログイン導線", "ログイン後は自分用機能への導線", "状態に合わせて表示を変える"],
  choiceId: "login-state-a02-condition-choice",
  choiceTitle: "表示を変える条件は？",
  question: "ログイン前後で表示を変えるとき、条件として近いものはどれ？",
  correctLabel: "ログイン中のユーザーがいるかどうか",
  correctFeedback: "その通りです。ログイン状態に応じて表示を切り替えます。",
  wrongLabels: ["背景色が青いかどうかだけ", "画面の横幅が1pxかどうかだけ", "ページタイトルが長いかどうか"],
  matchId: "login-state-c01-check",
  matchTitle: "ログイン前後で変える表示を確認しよう",
  matchItems: [{ id: "login", label: "ログインボタン" }, { id: "signup", label: "新規登録ボタン" }, { id: "mypage", label: "マイページリンク" }, { id: "logout", label: "ログアウトボタン" }],
  matchTargets: [{ id: "before", label: "ログイン前" }, { id: "after", label: "ログイン後" }],
  matchAnswers: [{ targetId: "before", itemIds: ["login", "signup"] }, { targetId: "after", itemIds: ["mypage", "logout"] }],
});

const userDataSeparationMission: MissionSeed = createConceptMission({
  id: "user-data-separation",
  title: "ユーザーごとにデータを分ける",
  description: "データに user_id を持たせ、自分のデータだけ取得する考え方を理解します。",
  difficulty: CourseDifficulty.NORMAL,
  goalImg: "/images/missions/user-data-separation.png",
  estimatedMinutes: 12,
  order: 6,
  type: MissionType.MAIN,
  required: true,
  rewardExp: 120,
  learnedItems: ["データにuser_idを持たせると誰のデータか分かる", "ログイン中のuser_idで絞り込むと自分のデータだけ表示できる", "全件表示と自分だけ表示の違いを理解する"],
  sectionId: "user-data-main-section",
  sectionTitle: "user_idでデータを分ける",
  introId: "user-data-a01-intro",
  introTitle: "user_id は誰のデータかを表す目印",
  introMessage: "予約データに user_id を持たせると、その予約が誰のものか判断できます。",
  introBody: ["予約データには、名前や日付だけでなく、誰が登録した予約なのかを表す user_id を持たせることがあります。", "これにより、ログイン中のユーザーに対応する予約だけを取り出せます。", "user_id は、データとユーザーを結びつけるための目印として考えると分かりやすいです。"].join("\n\n"),
  summary: ["user_idは誰のデータかを表す", "予約データとユーザーを結びつける", "自分のデータだけ取得するために使える"],
  visual: course7Visuals.userData,
  choiceId: "user-data-a02-owner-choice",
  choiceTitle: "誰のデータかを判断しよう",
  question: "ログイン中のユーザーが user_id = 3 です。表示すべき予約として自然なのはどれ？",
  correctLabel: "user_id が 3 の予約",
  correctFeedback: "その通りです。ログイン中のユーザーIDと一致する予約を表示します。",
  wrongLabels: ["user_id が 1 の予約だけ", "全員の予約を必ず全部表示する", "user_idを見ずにランダムに表示する"],
  matchId: "user-data-c01-check",
  matchTitle: "ユーザー別データ表示を確認しよう",
  matchItems: [{ id: "login", label: "ログインする" }, { id: "user-id", label: "ログイン中のuser_idを確認する" }, { id: "db", label: "DBから同じuser_idの予約を取得する" }, { id: "html", label: "予約一覧を画面に表示する" }],
  matchTargets: [{ id: "step1", label: "1. 本人確認" }, { id: "step2", label: "2. ユーザー確認" }, { id: "step3", label: "3. DB取得" }, { id: "step4", label: "4. 表示" }],
  matchAnswers: [{ targetId: "step1", itemIds: ["login"] }, { targetId: "step2", itemIds: ["user-id"] }, { targetId: "step3", itemIds: ["db"] }, { targetId: "step4", itemIds: ["html"] }],
});

const logoutChallengeMission: MissionSeed = createChallengeMission({ id: "challenge-logout-flow", title: "ログアウト導線を作る", parentMissionId: "login-state-ui", order: 7, branchOrder: 1, goalImg: "/images/missions/challenge-logout-flow.png", description: "ログイン中だけ表示するログアウト導線と、ログアウト後に戻る画面を考えます。", introTitle: "ログアウトはログイン状態を終了する操作", introBody: "ログアウトボタンは、ログイン中だけ表示するのが自然です。ログアウト後は、ログイン前のトップページやログイン画面に戻すことが多いです。", question: "ログアウトボタンの配置として自然なのはどれ？", correctLabel: "ログイン中のナビゲーションやマイページ内" });
const ownReservationChallengeMission: MissionSeed = createChallengeMission({ id: "challenge-own-reservations", title: "自分の予約だけ表示する", parentMissionId: "user-data-separation", order: 8, branchOrder: 2, goalImg: "/images/missions/challenge-own-reservations.png", description: "user_idで予約データを絞り込み、自分の予約だけ表示する考え方を深めます。", introTitle: "自分の予約一覧ではuser_idが一致する予約だけ出す", introBody: "ログイン中のユーザーが user_id = 2 の場合、自分の予約一覧には user_id が 2 の予約だけを表示します。他のuser_idの予約は自分用画面には表示しません。", question: "ログイン中のユーザーが user_id = 5 のとき、自分の予約一覧で使う条件として自然なのはどれ？", correctLabel: "予約データの user_id が 5 のものだけ取得する" });
const errorMessageChallengeMission: MissionSeed = createChallengeMission({ id: "challenge-auth-error-message", title: "エラーメッセージを改善する", parentMissionId: "login-form-parts", order: 9, branchOrder: 3, goalImg: "/images/missions/challenge-auth-error-message.png", description: "技術者向けのエラーとユーザー向けのエラーを比べ、伝わる表現を選びます。", introTitle: "エラー文は、次の行動が分かる表現にする", introBody: "内部エラーの詳細やスタックトレースをそのまま出すと、ユーザーには分かりにくく、情報を出しすぎる危険もあります。ログイン失敗時は、次に確認できる内容を伝えます。", question: "ログイン失敗時にユーザーへ表示する文として自然なのはどれ？", correctLabel: "メールアドレスまたはパスワードを確認してください。" });

const userFeatureCourse: CourseSeed = {
  id: "user-feature",
  title: "ユーザー機能を作る",
  description: "ログインが必要な理由、ライブラリを使う理由、ユーザーごとにデータを分ける考え方を理解します。",
  difficulty: CourseDifficulty.NORMAL,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.TOOL, CourseCategoryType.DATA],
  missions: [
    loginNeedMission,
    authPermissionMission,
    authLibraryMission,
    loginFormMission,
    loginStateUiMission,
    userDataSeparationMission,
    logoutChallengeMission,
    ownReservationChallengeMission,
    errorMessageChallengeMission,
  ],
};

// Helper for compact missions. Paste above compact mission definitions if not already available.
type ConceptMissionParams = {
  id: string; title: string; description: string; difficulty: CourseDifficulty; goalImg: string; estimatedMinutes: number; order: number; type: MissionType; required: boolean; rewardExp: number; learnedItems: string[];
  sectionId: string; sectionTitle: string; introId: string; introTitle: string; introMessage: string; introBody: string; summary: string[]; visual?: MissionVisualContent;
  choiceId: string; choiceTitle: string; question: string; correctLabel: string; correctFeedback: string; wrongLabels: string[];
  matchId: string; matchTitle: string; matchItems: { id: string; label: string }[]; matchTargets: { id: string; label: string }[]; matchAnswers: MatchAnswer[];
};

function createConceptMission(params: ConceptMissionParams): MissionSeed {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    difficulty: params.difficulty,
    goalImg: params.goalImg,
    estimatedMinutes: params.estimatedMinutes,
    order: params.order,
    type: params.type,
    isRequiredForCourseCompletion: params.required,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: params.rewardExp,
    learnedItems: params.learnedItems,
    isPublished: true,
    sections: [
      {
        id: params.sectionId,
        title: params.sectionTitle,
        description: params.description,
        order: 1,
        activities: [
          tutorial({ id: params.introId, order: 1, sectionOrder: 1, title: params.introTitle, mentorMessage: params.introMessage, body: params.introBody, summary: params.summary, visual: params.visual }),
          choice({
            id: params.choiceId,
            order: 2,
            sectionOrder: 2,
            title: params.choiceTitle,
            instruction: "正しいものを選びましょう。",
            mentorMessage: "ここまでの説明をもとに判断しましょう。",
            question: params.question,
            choices: [
              { id: `${params.choiceId}-correct`, label: params.correctLabel, isCorrect: true, feedback: params.correctFeedback },
              ...params.wrongLabels.map((label, index) => ({ id: `${params.choiceId}-wrong-${index + 1}`, label, isCorrect: false, feedback: "惜しいです。今回の内容に合うものをもう一度考えてみましょう。" })),
            ],
          }),
        ],
      },
      {
        id: `${params.id}-check-section`,
        title: "Mission Check",
        description: "このMissionで学んだことを確認します。",
        order: 2,
        activities: [
          match({ id: params.matchId, order: 3, sectionOrder: 1, title: params.matchTitle, instruction: "対応するものを選びましょう。", mentorMessage: "Missionの確認です。", items: params.matchItems, targets: params.matchTargets, answers: params.matchAnswers, correctFeedback: "OKです。内容を整理できています。", incorrectFeedback: "もう一度、役割や意味を確認してみましょう。", isMissionCheck: true }),
        ],
      },
    ],
  };
}

function createChallengeMission(params: { id: string; title: string; parentMissionId: string; order: number; branchOrder: number; goalImg: string; description: string; introTitle: string; introBody: string; question: string; correctLabel: string }): MissionSeed {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    difficulty: CourseDifficulty.NORMAL,
    goalImg: params.goalImg,
    estimatedMinutes: 8,
    order: params.order,
    type: MissionType.CHALLENGE,
    isRequiredForCourseCompletion: false,
    parentMissionId: params.parentMissionId,
    roadmapLane: 1,
    branchOrder: params.branchOrder,
    rewardExp: 80,
    learnedItems: [params.description],
    isPublished: true,
    sections: [
      {
        id: `${params.id}-section`,
        title: params.title,
        description: params.description,
        order: 1,
        activities: [
          tutorial({ id: `${params.id}-a01-intro`, order: 1, sectionOrder: 1, title: params.introTitle, mentorMessage: "Challengeでは、少し発展した場面で考えてみましょう。", body: params.introBody, summary: ["状況に合わせて判断する", "ユーザーに分かる形で設計する"] }),
          choice({ id: `${params.id}-c01-check`, order: 2, sectionOrder: 2, title: `${params.title}を確認しよう`, instruction: "自然なものを選びましょう。", mentorMessage: "Challengeの確認です。", question: params.question, choices: [
            { id: `${params.id}-correct`, label: params.correctLabel, isCorrect: true, feedback: "OKです。今回の場面に合う判断です。" },
            { id: `${params.id}-wrong-1`, label: "内部情報や秘密情報をそのまま表示する", isCorrect: false, feedback: "危険です。内部情報や秘密情報はそのまま見せません。" },
            { id: `${params.id}-wrong-2`, label: "ユーザーが見つけられない場所に置く", isCorrect: false, feedback: "惜しいです。ユーザーが使える場所に置く必要があります。" },
            { id: `${params.id}-wrong-3`, label: "関係ないデータをランダムに表示する", isCorrect: false, feedback: "惜しいです。ユーザーや場面に合うデータを扱います。" },
          ], isMissionCheck: true }),
        ],
      },
    ],
  };
}

// prisma/seedData/course8_seed_append_compact.ts
// Course 8: 自分のアプリを企画する
// 既存の learningSeed.ts と同じ helper / type が同一ファイル内にある前提で追記する想定です。
// 前提: CourseDifficulty, CourseCategoryType, MissionType, MissionActivityType,
//      CourseSeed, MissionSeed, tutorial, choice, match, orderedSteps が定義済み。

const course8Visuals = {
  ideaToTasks: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "困りごとから制作タスクへ分解する流れ",
      caption: "アプリ案は、いきなり実装せず、小さな要素へ分けて考えます。",
      nodes: [
        {
          id: "problem",
          label: "困りごと",
          description: "誰が何に困るか",
          icon: "user",
          tone: "blue",
        },
        {
          id: "feature",
          label: "最小機能",
          description: "最初に作る1機能",
          icon: "code",
          tone: "orange",
        },
        {
          id: "tasks",
          label: "制作タスク",
          description: "画面・入力・保存へ分ける",
          icon: "file",
          tone: "green",
        },
      ],
      edges: [
        {
          id: "problem-feature",
          from: "problem",
          to: "feature",
          label: "小さくする",
        },
        {
          id: "feature-tasks",
          from: "feature",
          to: "tasks",
          label: "作業に分解",
        },
      ],
    },
  }),
  appParts: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "COMPARE_PANEL",
      title: "アプリ案を分ける観点",
      caption:
        "最終制作では、画面・入力・処理・保存・外部連携に分けると考えやすくなります。",
      panels: [
        {
          id: "screen",
          title: "画面",
          subtitle: "ユーザーが見る場所",
          tone: "blue",
          items: ["トップ", "入力画面", "一覧画面"],
        },
        {
          id: "process",
          title: "処理",
          subtitle: "裏側で行うこと",
          tone: "orange",
          items: ["判定", "検索", "並び替え"],
        },
        {
          id: "data",
          title: "保存・連携",
          subtitle: "残す・外部へ依頼",
          tone: "green",
          items: ["DB保存", "API", "AI"],
        },
      ],
    },
  }),
  minimumFeature: defineMissionVisual({
    version: 1,
    placement: "aside",
    data: {
      type: "COMPARE_PANEL",
      title: "最小機能と発展機能",
      caption: "最初はアプリの価値を小さく試せる機能から作ります。",
      panels: [
        {
          id: "minimum",
          title: "最小機能",
          subtitle: "最初に作る",
          tone: "blue",
          items: ["登録する", "一覧で見る", "保存する"],
        },
        {
          id: "advanced",
          title: "発展機能",
          subtitle: "後から追加",
          tone: "purple",
          items: ["AI提案", "通知", "共有"],
        },
      ],
    },
  }),
  implementationOrder: defineMissionVisual({
    version: 1,
    placement: "full",
    data: {
      type: "FLOW_DIAGRAM",
      title: "実装順の例",
      caption: "最初は画面だけ、次に入力、保存、一覧へ進めると作りやすいです。",
      nodes: [
        {
          id: "screen",
          label: "画面",
          description: "HTML/CSS",
          icon: "browser",
          tone: "blue",
        },
        {
          id: "input",
          label: "入力処理",
          description: "form/request",
          icon: "code",
          tone: "orange",
        },
        {
          id: "database",
          label: "保存",
          description: "DB",
          icon: "database",
          tone: "green",
        },
        {
          id: "list",
          label: "一覧表示",
          description: "template",
          icon: "file",
          tone: "purple",
        },
      ],
      edges: [
        {
          id: "screen-input",
          from: "screen",
          to: "input",
          label: "送信できるようにする",
        },
        { id: "input-db", from: "input", to: "database", label: "保存する" },
        {
          id: "db-list",
          from: "database",
          to: "list",
          label: "取り出して表示",
        },
      ],
    },
  }),
} as const;

const collectProblemsMission: MissionSeed = {
  id: "app-idea-problems",
  title: "身近な困りごとを集める",
  description: "学生生活や日常から、アプリ化しやすい困りごとを見つけます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/app-idea-problems.png",
  estimatedMinutes: 10,
  order: 1,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "身近な場面から困りごとを探す",
    "誰がいつ困るかを具体化する",
    "アプリ化しやすい困りごとを判断する",
  ],
  isPublished: true,
  sections: [
    {
      id: "app-idea-problems-scenes-section",
      title: "場面から考える",
      description:
        "学生生活、授業、部活、アルバイトの場面から困りごとを探します。",
      order: 1,
      activities: [
        tutorial({
          id: "app-idea-problems-a01-scene-intro",
          order: 1,
          sectionOrder: 1,
          title: "アプリ案は身近な場面から考えられる",
          mentorMessage:
            "まだアプリ案がない場合は、いきなり機能から考えるより、日常の困りごとから考えると出しやすくなります。",
          body: [
            "学生生活、授業、部活、アルバイト、趣味の中には、小さな不便や面倒があります。",
            "たとえば、課題の締切を忘れやすい、予定を共有しにくい、予約状況を管理しにくい、といった困りごとです。",
            "まずは完璧なアイデアを出すのではなく、身近な場面で困っていることを集めます。",
          ].join("\n\n"),
          summary: [
            "身近な場面から困りごとを探す",
            "最初から完璧な案にしなくてよい",
            "小さな不便をアプリ案の入口にする",
          ],
          visual: course8Visuals.ideaToTasks,
        }),
        choice({
          id: "app-idea-problems-a02-problem-choice",
          order: 2,
          sectionOrder: 2,
          title: "困りごととして考えやすいものは？",
          instruction: "アプリ案のもとになりやすい困りごとを選びましょう。",
          mentorMessage:
            "誰かが面倒に感じていて、アプリで少し楽にできそうなものに注目します。",
          question: "アプリ案のもとになる困りごととして考えやすいものはどれ？",
          choices: [
            {
              id: "app-idea-problems-a02-correct",
              label: "課題の締切を忘れやすい",
              isCorrect: true,
              feedback:
                "その通りです。締切管理は、登録・一覧表示・通知などの機能に分けて考えやすい困りごとです。",
            },
            {
              id: "app-idea-problems-a02-wrong-color",
              label: "青色が存在する",
              isCorrect: false,
              feedback:
                "惜しいです。色そのものは困りごととしては具体性が弱いです。",
            },
            {
              id: "app-idea-problems-a02-wrong-air",
              label: "空気が見えない",
              isCorrect: false,
              feedback: "惜しいです。アプリで解決する対象としては広すぎます。",
            },
            {
              id: "app-idea-problems-a02-wrong-random",
              label: "なんとなく全部便利にしたい",
              isCorrect: false,
              feedback:
                "惜しいです。誰が何に困るのかをもう少し具体化するとよいです。",
            },
          ],
        }),
        choice({
          id: "app-idea-problems-a03-app-fit-choice",
          order: 3,
          sectionOrder: 3,
          title: "アプリ化しやすい困りごとは？",
          instruction: "アプリ化しやすい困りごとの特徴を選びましょう。",
          mentorMessage:
            "入力・記録・一覧・検索などに落とし込めるかを見ると判断しやすいです。",
          question: "アプリ化しやすい困りごとの特徴として近いものはどれ？",
          choices: [
            {
              id: "app-idea-problems-a03-correct",
              label: "情報を登録したり一覧で見たりすると楽になる",
              isCorrect: true,
              feedback:
                "その通りです。入力・保存・一覧表示に分けられる困りごとはWebアプリにしやすいです。",
            },
            {
              id: "app-idea-problems-a03-wrong-huge",
              label: "世界のすべての問題を一度に解決する",
              isCorrect: false,
              feedback:
                "惜しいです。最初は小さく具体的な困りごとに絞る方が作りやすいです。",
            },
            {
              id: "app-idea-problems-a03-wrong-no-user",
              label: "誰が使うか全く分からない",
              isCorrect: false,
              feedback:
                "惜しいです。誰が使うかを考えると、必要な機能が見えやすくなります。",
            },
            {
              id: "app-idea-problems-a03-wrong-only-design",
              label: "見た目だけを何となく変えたい",
              isCorrect: false,
              feedback:
                "惜しいです。アプリ案としては、困りごとや目的も考える必要があります。",
            },
          ],
        }),
      ],
    },
    {
      id: "app-idea-problems-detail-section",
      title: "困りごとを具体化する",
      description: "誰が、いつ、何に困るのかを分けて考えます。",
      order: 2,
      activities: [
        tutorial({
          id: "app-idea-problems-a04-detail-intro",
          order: 4,
          sectionOrder: 1,
          title: "誰がいつ困るかまで考える",
          mentorMessage:
            "困りごとは、ユーザーと場面を入れるとアプリ案に近づきます。",
          body: [
            "「予定管理が大変」だけでは、まだ少し広いです。",
            "たとえば「部活の代表が、練習日程を共有するときに、出欠確認が大変」のように、誰がいつ困るかを入れると具体的になります。",
            "具体化すると、必要な入力項目や画面も考えやすくなります。",
          ].join("\n\n"),
          summary: [
            "誰が困るかを決める",
            "いつ困るかを決める",
            "何が面倒なのかを具体化する",
          ],
        }),
        match({
          id: "app-idea-problems-a05-user-scene-match",
          order: 5,
          sectionOrder: 2,
          title: "困りごとをユーザーと場面に分けよう",
          instruction: "次の内容を、ユーザー・場面・困りごとに分けましょう。",
          mentorMessage: "困りごとを小さな要素に分ける練習です。",
          items: [
            { id: "student", label: "授業を受けている学生" },
            { id: "before-deadline", label: "課題提出前" },
            { id: "forget", label: "締切を忘れやすい" },
          ],
          targets: [
            { id: "user", label: "ユーザー" },
            { id: "scene", label: "場面" },
            { id: "problem", label: "困りごと" },
          ],
          answers: [
            { targetId: "user", itemIds: ["student"] },
            { targetId: "scene", itemIds: ["before-deadline"] },
            { targetId: "problem", itemIds: ["forget"] },
          ],
          correctFeedback:
            "よく整理できています。ユーザー、場面、困りごとに分けるとアプリ案へつなげやすくなります。",
          incorrectFeedback:
            "誰が使うか、いつ使うか、何に困るかを分けてみましょう。",
        }),
      ],
    },
    {
      id: "app-idea-problems-check-section",
      title: "Mission Check",
      description: "困りごとの見つけ方を確認します。",
      order: 3,
      activities: [
        match({
          id: "app-idea-problems-c01-check",
          order: 6,
          sectionOrder: 1,
          title: "困りごとをユーザーと場面に分けよう",
          instruction:
            "次のアプリ案のもとを、ユーザー・場面・困りごとに分けましょう。",
          mentorMessage: "Missionの確認です。誰が、いつ、何に困るかを見ます。",
          items: [
            { id: "part-time-worker", label: "アルバイトのシフト担当者" },
            { id: "monthly-schedule", label: "月末に来月の予定を集めるとき" },
            { id: "hard-collect", label: "希望シフトを集めるのが大変" },
          ],
          targets: [
            { id: "user", label: "ユーザー" },
            { id: "scene", label: "場面" },
            { id: "problem", label: "困りごと" },
          ],
          answers: [
            { targetId: "user", itemIds: ["part-time-worker"] },
            { targetId: "scene", itemIds: ["monthly-schedule"] },
            { targetId: "problem", itemIds: ["hard-collect"] },
          ],
          correctFeedback: "OKです。困りごとを具体化できています。",
          incorrectFeedback: "誰が、いつ、何に困るかに分けて考えましょう。",
          isMissionCheck: true,
        }),
        choice({
          id: "app-idea-problems-c02-app-fit-check",
          order: 7,
          sectionOrder: 2,
          title: "アプリ化しやすい困りごとを選ぼう",
          instruction: "アプリ化しやすい困りごとを選びましょう。",
          mentorMessage:
            "入力・保存・一覧表示に分けられるかを見ると判断しやすいです。",
          question: "アプリ化しやすい困りごととして自然なのはどれ？",
          choices: [
            {
              id: "app-idea-problems-c02-correct",
              label: "持ち物リストを作って、忘れ物を減らしたい",
              isCorrect: true,
              feedback: "OKです。入力、保存、一覧表示に落とし込みやすいです。",
            },
            {
              id: "app-idea-problems-c02-wrong-all",
              label: "世界中の全問題を一瞬で解決したい",
              isCorrect: false,
              feedback:
                "惜しいです。最初は小さく具体的な困りごとに絞りましょう。",
            },
            {
              id: "app-idea-problems-c02-wrong-vague",
              label: "なんとなく便利にしたい",
              isCorrect: false,
              feedback: "惜しいです。誰が何に困るかを具体化しましょう。",
            },
            {
              id: "app-idea-problems-c02-wrong-no-user",
              label: "誰も使わないが作りたい",
              isCorrect: false,
              feedback:
                "惜しいです。使う人を想定できる方がアプリ案にしやすいです。",
            },
          ],
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const targetUserMission: MissionSeed = {
  id: "app-target-user",
  title: "誰のためのアプリか考える",
  description: "ユーザー、場面、目的を分け、アプリの対象を明確にします。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/app-target-user.png",
  estimatedMinutes: 10,
  order: 2,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "誰のためかを決める",
    "ユーザー、場面、目的を整理する",
    "ユーザー像に合う機能を考える",
  ],
  isPublished: true,
  sections: [
    {
      id: "app-target-user-section",
      title: "ユーザーを決める",
      description: "自分用と他人用の違いを見ながら、使う人を具体化します。",
      order: 1,
      activities: [
        tutorial({
          id: "app-target-a01-user-intro",
          order: 1,
          sectionOrder: 1,
          title: "使う人を決めると、必要な機能が見えやすい",
          mentorMessage:
            "同じアプリでも、誰が使うかによって必要な機能や画面は変わります。",
          body: [
            "自分だけが使うメモアプリなら、簡単に登録できることが大事かもしれません。",
            "クラス全員が使う出欠アプリなら、誰が登録したか、管理者が確認できるかも重要になります。",
            "まずは、誰のためのアプリなのかを決めましょう。",
          ].join("\n\n"),
          summary: [
            "誰が使うかを決める",
            "使う人によって必要な機能が変わる",
            "自分用と他人用を分けて考える",
          ],
        }),
        choice({
          id: "app-target-a02-user-choice",
          order: 2,
          sectionOrder: 2,
          title: "ユーザー像に合う機能は？",
          instruction: "ユーザー像に合う機能を選びましょう。",
          mentorMessage: "使う人が何をしたいかに注目します。",
          question: "課題の締切を忘れやすい学生向けアプリに合う機能はどれ？",
          choices: [
            {
              id: "app-target-a02-correct",
              label: "課題名と締切を登録して一覧で確認できる",
              isCorrect: true,
              feedback: "その通りです。ユーザーの困りごとに合った機能です。",
            },
            {
              id: "app-target-a02-wrong-admin",
              label: "工場の在庫を大規模管理する",
              isCorrect: false,
              feedback: "惜しいです。今回のユーザー像とは離れています。",
            },
            {
              id: "app-target-a02-wrong-weather",
              label: "世界中の天気をすべて予測する",
              isCorrect: false,
              feedback:
                "惜しいです。課題締切の困りごととは直接つながりにくいです。",
            },
            {
              id: "app-target-a02-wrong-random",
              label: "何の目的もなくボタンだけ置く",
              isCorrect: false,
              feedback: "惜しいです。ユーザーの目的に合う機能を考えましょう。",
            },
          ],
        }),
      ],
    },
    {
      id: "app-target-purpose-section",
      title: "場面と目的を整理する",
      description: "誰がいつ使い、何を解決したいかを整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "app-target-a03-purpose-intro",
          order: 3,
          sectionOrder: 1,
          title: "ユーザー・場面・目的をセットで考える",
          mentorMessage:
            "アプリ案は、誰が、いつ、何のために使うのかを整理すると説明しやすくなります。",
          body: [
            "たとえば「学生が、課題提出前に、締切を確認するために使う」のように整理できます。",
            "この形にすると、画面や入力項目、保存するデータを考えやすくなります。",
            "目的がはっきりすると、最初に作るべき機能も選びやすくなります。",
          ].join("\n\n"),
          summary: ["誰が使うか", "いつ使うか", "何を解決したいか"],
        }),
        match({
          id: "app-target-a04-purpose-match",
          order: 4,
          sectionOrder: 2,
          title: "ユーザー・場面・目的を対応づけよう",
          instruction: "次の項目を、ユーザー・場面・目的に分けましょう。",
          mentorMessage: "アプリの対象を明確にする練習です。",
          items: [
            { id: "user", label: "授業課題を管理したい学生" },
            { id: "scene", label: "課題が複数出ているとき" },
            { id: "purpose", label: "締切を忘れないようにする" },
          ],
          targets: [
            { id: "target-user", label: "ユーザー" },
            { id: "use-scene", label: "場面" },
            { id: "goal", label: "目的" },
          ],
          answers: [
            { targetId: "target-user", itemIds: ["user"] },
            { targetId: "use-scene", itemIds: ["scene"] },
            { targetId: "goal", itemIds: ["purpose"] },
          ],
          correctFeedback:
            "よく整理できています。誰が、いつ、何のために使うかが見えています。",
          incorrectFeedback:
            "使う人、使うタイミング、解決したいことに分けて考えてみましょう。",
        }),
      ],
    },
    {
      id: "app-target-check-section",
      title: "Mission Check",
      description: "アプリの対象を確認します。",
      order: 3,
      activities: [
        orderedSteps({
          id: "app-target-c01-scene-check",
          order: 5,
          sectionOrder: 1,
          title: "誰がいつ使うかを整理しよう",
          instruction: "アプリ案の説明として自然な順番に並べましょう。",
          mentorMessage: "誰が、いつ、何のために使うかの順で確認します。",
          steps: [
            { id: "who", label: "授業課題を管理したい学生が" },
            { id: "when", label: "課題が複数出ているときに" },
            { id: "why", label: "締切を忘れないために使う" },
          ],
          answerOrder: ["who", "when", "why"],
          correctFeedback:
            "OKです。ユーザー、場面、目的を自然な順番で説明できています。",
          incorrectFeedback: "誰が、いつ、何のために使うかの順で考えましょう。",
          isMissionCheck: true,
        }),
        match({
          id: "app-target-c02-purpose-check",
          order: 6,
          sectionOrder: 2,
          title: "ユーザー、場面、目的を対応づけよう",
          instruction: "次の項目を、ユーザー・場面・目的に分けましょう。",
          mentorMessage: "アプリ対象の整理を確認します。",
          items: [
            { id: "user", label: "部活の代表者" },
            { id: "scene", label: "練習参加者を集めるとき" },
            { id: "purpose", label: "出欠を簡単に集計したい" },
          ],
          targets: [
            { id: "target-user", label: "ユーザー" },
            { id: "use-scene", label: "場面" },
            { id: "goal", label: "目的" },
          ],
          answers: [
            { targetId: "target-user", itemIds: ["user"] },
            { targetId: "use-scene", itemIds: ["scene"] },
            { targetId: "goal", itemIds: ["purpose"] },
          ],
          correctFeedback: "OKです。アプリの対象を整理できています。",
          incorrectFeedback:
            "誰が使うか、いつ使うか、何を解決したいかに分けましょう。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const minimumFeatureMission: MissionSeed = {
  id: "app-minimum-feature",
  title: "最小機能を決める",
  description: "最初から全部作らず、最初に作るべき1機能を選べるようにします。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/app-minimum-feature.png",
  estimatedMinutes: 10,
  order: 3,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 110,
  learnedItems: [
    "最初から全部作ろうとしない",
    "最小機能は中心価値を小さく試す機能",
    "発展機能は後回しにする",
  ],
  isPublished: true,
  sections: [
    {
      id: "app-minimum-too-big-section",
      title: "大きすぎる案を小さくする",
      description: "最初に作る機能と後回しにする機能を分けます。",
      order: 1,
      activities: [
        tutorial({
          id: "app-minimum-a01-intro",
          order: 1,
          sectionOrder: 1,
          title: "最初から全部作らなくてよい",
          mentorMessage:
            "最終制作では、最初から大きなアプリを完成させようとすると大変です。まずは最小機能を決めます。",
          body: [
            "課題管理アプリに、AI提案、通知、共有、ランキング、カレンダー連携を全部入れようとすると、作る量が一気に増えます。",
            "まずは、課題名と締切を登録して一覧で見られる、という中心機能から作る方が現実的です。",
            "後から追加できる機能は、発展機能として分けておきます。",
          ].join("\n\n"),
          summary: [
            "大きすぎる案は小さくする",
            "最初は中心機能から作る",
            "発展機能は後回しにする",
          ],
          visual: course8Visuals.minimumFeature,
        }),
        choice({
          id: "app-minimum-a02-first-feature-choice",
          order: 2,
          sectionOrder: 2,
          title: "最初に作るべき1機能は？",
          instruction:
            "課題管理アプリの最小機能として自然なものを選びましょう。",
          mentorMessage: "中心価値を小さく試せる機能を選びます。",
          question:
            "課題管理アプリを最初に作るとき、最小機能として自然なのはどれ？",
          choices: [
            {
              id: "app-minimum-a02-correct",
              label: "課題名と締切を登録して一覧で見られる",
              isCorrect: true,
              feedback:
                "その通りです。課題管理アプリの中心価値を小さく試せる機能です。",
            },
            {
              id: "app-minimum-a02-wrong-all",
              label: "AI、通知、決済、SNS連携を全部最初に作る",
              isCorrect: false,
              feedback: "惜しいです。最初から全部作ると大きすぎます。",
            },
            {
              id: "app-minimum-a02-wrong-logo",
              label: "ロゴだけを作って終わる",
              isCorrect: false,
              feedback:
                "惜しいです。ロゴだけでは課題管理の中心機能を試せません。",
            },
            {
              id: "app-minimum-a02-wrong-color",
              label: "背景色だけ決める",
              isCorrect: false,
              feedback: "惜しいです。見た目も大切ですが、中心機能が必要です。",
            },
          ],
        }),
        match({
          id: "app-minimum-a03-later-match",
          order: 3,
          sectionOrder: 3,
          title: "最初に作る機能と後回しにする機能を分けよう",
          instruction:
            "課題管理アプリの機能を、最小機能・発展機能に分けましょう。",
          mentorMessage: "まず中心機能を作り、後から追加できるものは分けます。",
          items: [
            { id: "register-task", label: "課題名と締切を登録する" },
            { id: "show-list", label: "登録した課題を一覧表示する" },
            { id: "ai-priority", label: "AIが優先順位を提案する" },
            { id: "share-friends", label: "友達と共有する" },
          ],
          targets: [
            { id: "minimum", label: "最小機能" },
            { id: "advanced", label: "発展機能" },
          ],
          answers: [
            { targetId: "minimum", itemIds: ["register-task", "show-list"] },
            { targetId: "advanced", itemIds: ["ai-priority", "share-friends"] },
          ],
          correctFeedback:
            "よく整理できています。中心機能と発展機能を分けられています。",
          incorrectFeedback:
            "アプリの中心価値を試す機能と、後から足せる機能に分けましょう。",
        }),
      ],
    },
    {
      id: "app-minimum-sentence-section",
      title: "最小機能を文章にする",
      description: "誰が何をできる形で、最小機能を説明します。",
      order: 2,
      activities: [
        tutorial({
          id: "app-minimum-a04-sentence-intro",
          order: 4,
          sectionOrder: 1,
          title: "最小機能は「誰が何をできる」で書く",
          mentorMessage: "最小機能を文章にすると、作るものがはっきりします。",
          body: [
            "たとえば課題管理アプリなら「学生が、課題名と締切を登録し、一覧で確認できる」と書けます。",
            "この形にすると、入力項目、保存データ、一覧画面が必要だと分かります。",
            "曖昧なアプリ案は、まずこの形に直してみましょう。",
          ].join("\n\n"),
          summary: [
            "誰が何をできる形で書く",
            "必要な画面やデータが見える",
            "曖昧な案を小さく具体化する",
          ],
        }),
        choice({
          id: "app-minimum-a05-sentence-choice",
          order: 5,
          sectionOrder: 2,
          title: "最小機能の説明文を選ぼう",
          instruction: "最小機能の説明として自然なものを選びましょう。",
          mentorMessage: "誰が、何をできるのかが分かる文を選びます。",
          question: "課題管理アプリの最小機能の説明として自然なのはどれ？",
          choices: [
            {
              id: "app-minimum-a05-correct",
              label: "学生が課題名と締切を登録し、一覧で確認できる",
              isCorrect: true,
              feedback: "その通りです。誰が何をできるかが分かる説明です。",
            },
            {
              id: "app-minimum-a05-wrong-vague",
              label: "なんか便利な感じにする",
              isCorrect: false,
              feedback: "惜しいです。何ができるのかを具体化しましょう。",
            },
            {
              id: "app-minimum-a05-wrong-all",
              label: "世界中の全アプリを超える",
              isCorrect: false,
              feedback: "惜しいです。最小機能としては大きすぎます。",
            },
            {
              id: "app-minimum-a05-wrong-design",
              label: "色を良い感じにするだけ",
              isCorrect: false,
              feedback:
                "惜しいです。見た目だけでなく、中心機能を説明しましょう。",
            },
          ],
        }),
      ],
    },
    {
      id: "app-minimum-check-section",
      title: "Mission Check",
      description: "最小機能の考え方を確認します。",
      order: 3,
      activities: [
        choice({
          id: "app-minimum-c01-check",
          order: 6,
          sectionOrder: 1,
          title: "大きすぎる案を小さくしよう",
          instruction: "最初に作る機能として自然なものを選びましょう。",
          mentorMessage: "最小機能は、アプリの価値を小さく試すものです。",
          question: "出欠管理アプリの最小機能として自然なのはどれ？",
          choices: [
            {
              id: "app-minimum-c01-correct",
              label: "参加者が出欠を登録し、代表者が一覧で確認できる",
              isCorrect: true,
              feedback: "OKです。出欠管理の中心価値を小さく試せます。",
            },
            {
              id: "app-minimum-c01-wrong-all",
              label: "AI、決済、3Dゲーム、SNSを全部最初に入れる",
              isCorrect: false,
              feedback: "惜しいです。最初から全部入れると大きすぎます。",
            },
            {
              id: "app-minimum-c01-wrong-logo",
              label: "ロゴだけ作る",
              isCorrect: false,
              feedback: "惜しいです。出欠管理の中心機能がありません。",
            },
            {
              id: "app-minimum-c01-wrong-color",
              label: "背景色だけ決める",
              isCorrect: false,
              feedback: "惜しいです。見た目だけでは中心機能を試せません。",
            },
          ],
          isMissionCheck: true,
        }),
        match({
          id: "app-minimum-c02-feature-check",
          order: 7,
          sectionOrder: 2,
          title: "最初に作る機能と後回しにする機能を選ぼう",
          instruction: "次の機能を、最小機能・発展機能に分けましょう。",
          mentorMessage: "中心機能か、後から追加できる機能かを見ます。",
          items: [
            { id: "register", label: "課題を登録する" },
            { id: "list", label: "課題一覧を見る" },
            { id: "ai", label: "AIが学習計画を提案する" },
            { id: "share", label: "友達と共有する" },
          ],
          targets: [
            { id: "minimum", label: "最小機能" },
            { id: "advanced", label: "発展機能" },
          ],
          answers: [
            { targetId: "minimum", itemIds: ["register", "list"] },
            { targetId: "advanced", itemIds: ["ai", "share"] },
          ],
          correctFeedback: "OKです。最小機能と発展機能を分けられています。",
          incorrectFeedback:
            "まず中心機能を作り、AIや共有のような発展機能は後回しにできます。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

const screenPlanningMission: MissionSeed = {
  id: "app-screen-planning",
  title: "画面を洗い出す",
  description:
    "アプリに必要な画面を、トップ・入力・一覧・詳細などに分けて考えます。",
  difficulty: CourseDifficulty.EASY,
  goalImg: "/images/missions/app-screen-planning.png",
  estimatedMinutes: 10,
  order: 4,
  type: MissionType.MAIN,
  isRequiredForCourseCompletion: true,
  parentMissionId: null,
  roadmapLane: 0,
  branchOrder: 0,
  rewardExp: 100,
  learnedItems: [
    "必要な画面を洗い出す",
    "画面同士のつながりを考える",
    "入力後にどの画面へ戻るかを決める",
  ],
  isPublished: true,
  sections: [
    {
      id: "app-screen-types-section",
      title: "画面の種類を知る",
      description: "トップ、入力、一覧、詳細の役割を確認します。",
      order: 1,
      activities: [
        tutorial({
          id: "app-screen-a01-types-intro",
          order: 1,
          sectionOrder: 1,
          title: "アプリは複数の画面でできている",
          mentorMessage:
            "アプリを作る前に、どんな画面が必要かを洗い出すと作業が分かりやすくなります。",
          body: [
            "たとえば予約アプリなら、トップ画面、予約入力画面、予約一覧画面、予約詳細画面などが考えられます。",
            "全部の画面を最初から作る必要はありませんが、必要な画面を先に考えると全体像が見えます。",
            "最小機能では、入力画面と一覧画面だけから始めることもできます。",
          ].join("\n\n"),
          summary: ["トップ画面", "入力画面", "一覧画面", "詳細画面"],
          visual: course8Visuals.appParts,
        }),
        match({
          id: "app-screen-a02-reservation-screen-match",
          order: 2,
          sectionOrder: 2,
          title: "予約アプリの画面を分けよう",
          instruction: "次の画面を役割に対応づけましょう。",
          mentorMessage: "画面ごとに役割を分けて考えます。",
          items: [
            { id: "top", label: "予約サービスの紹介ページ" },
            { id: "form", label: "名前と日付を入力する画面" },
            { id: "list", label: "予約一覧を見る画面" },
            { id: "detail", label: "予約1件の詳しい内容を見る画面" },
          ],
          targets: [
            { id: "top-role", label: "トップ" },
            { id: "input-role", label: "入力" },
            { id: "list-role", label: "一覧" },
            { id: "detail-role", label: "詳細" },
          ],
          answers: [
            { targetId: "top-role", itemIds: ["top"] },
            { targetId: "input-role", itemIds: ["form"] },
            { targetId: "list-role", itemIds: ["list"] },
            { targetId: "detail-role", itemIds: ["detail"] },
          ],
          correctFeedback:
            "よく整理できています。画面の種類ごとに役割を分けられています。",
          incorrectFeedback:
            "紹介する画面、入力する画面、一覧を見る画面、詳しく見る画面に分けましょう。",
        }),
        choice({
          id: "app-screen-a03-needed-screen-choice",
          order: 3,
          sectionOrder: 3,
          title: "最小機能に必要な画面は？",
          instruction: "課題管理アプリの最小機能に必要な画面を選びましょう。",
          mentorMessage:
            "登録して一覧で見るなら、入力と一覧の画面が必要になりやすいです。",
          question:
            "課題名と締切を登録して一覧で見るアプリに、最初に必要になりやすい画面はどれ？",
          choices: [
            {
              id: "app-screen-a03-correct",
              label: "課題入力画面と課題一覧画面",
              isCorrect: true,
              feedback:
                "その通りです。登録する画面と、登録した内容を見る画面が必要です。",
            },
            {
              id: "app-screen-a03-wrong-payment",
              label: "決済画面だけ",
              isCorrect: false,
              feedback:
                "惜しいです。課題管理の最小機能には直接必要ではありません。",
            },
            {
              id: "app-screen-a03-wrong-game",
              label: "3Dバトル画面だけ",
              isCorrect: false,
              feedback: "惜しいです。課題の登録と一覧にはつながりにくいです。",
            },
            {
              id: "app-screen-a03-wrong-none",
              label: "画面は一切いらない",
              isCorrect: false,
              feedback:
                "惜しいです。Webアプリでは、入力や一覧の画面が必要です。",
            },
          ],
        }),
      ],
    },
    {
      id: "app-screen-flow-section",
      title: "画面同士のつながり",
      description: "トップから入力、入力後に一覧へ戻る流れを整理します。",
      order: 2,
      activities: [
        tutorial({
          id: "app-screen-a04-flow-intro",
          order: 4,
          sectionOrder: 1,
          title: "画面は順番につながる",
          mentorMessage:
            "必要な画面を出したら、次に画面同士のつながりを考えます。",
          body: [
            "たとえばトップ画面から入力画面へ移動し、入力を送信した後に一覧画面へ戻る流れがあります。",
            "画面遷移を考えると、どのボタンやリンクが必要かも見えます。",
            "ユーザーが迷わないように、次の行動が分かる流れにします。",
          ].join("\n\n"),
          summary: [
            "トップから入力へ移動",
            "入力後に一覧へ戻る",
            "画面遷移で必要なリンクやボタンが見える",
          ],
        }),
        orderedSteps({
          id: "app-screen-a05-flow-order",
          order: 5,
          sectionOrder: 2,
          title: "画面遷移の順番を並べよう",
          instruction:
            "課題を登録して一覧で確認する流れを、正しい順番に並べましょう。",
          mentorMessage: "ユーザーがどの画面からどの画面へ進むかを考えます。",
          steps: [
            { id: "top", label: "トップ画面を開く" },
            { id: "form", label: "課題入力画面へ移動する" },
            { id: "submit", label: "課題名と締切を入力して送信する" },
            { id: "list", label: "課題一覧画面で確認する" },
          ],
          answerOrder: ["top", "form", "submit", "list"],
          correctFeedback:
            "いい流れです。入力後に一覧で確認できる導線になっています。",
          incorrectFeedback:
            "まずトップから入力へ進み、送信後に一覧で確認する流れです。",
        }),
      ],
    },
    {
      id: "app-screen-check-section",
      title: "Mission Check",
      description: "画面の洗い出しを確認します。",
      order: 3,
      activities: [
        match({
          id: "app-screen-c01-needed-check",
          order: 6,
          sectionOrder: 1,
          title: "アプリ案に必要な画面を選ぼう",
          instruction: "課題管理アプリに必要な画面を役割に分けましょう。",
          mentorMessage: "登録と一覧確認に必要な画面を考えます。",
          items: [
            { id: "form", label: "課題入力画面" },
            { id: "list", label: "課題一覧画面" },
            { id: "top", label: "トップ画面" },
          ],
          targets: [
            { id: "input", label: "入力" },
            { id: "list-target", label: "一覧" },
            { id: "top-target", label: "入口" },
          ],
          answers: [
            { targetId: "input", itemIds: ["form"] },
            { targetId: "list-target", itemIds: ["list"] },
            { targetId: "top-target", itemIds: ["top"] },
          ],
          correctFeedback: "OKです。アプリに必要な画面を整理できています。",
          incorrectFeedback: "入口、入力、一覧という役割で分けてみましょう。",
          isMissionCheck: true,
        }),
        orderedSteps({
          id: "app-screen-c02-flow-check",
          order: 7,
          sectionOrder: 2,
          title: "画面同士のつながりを並べよう",
          instruction: "入力から一覧確認までの流れを並べましょう。",
          mentorMessage: "登録後にどの画面を見るかを確認します。",
          steps: [
            { id: "input", label: "入力画面で情報を入れる" },
            { id: "submit", label: "送信する" },
            { id: "save", label: "保存する" },
            { id: "list", label: "一覧画面で見る" },
          ],
          answerOrder: ["input", "submit", "save", "list"],
          correctFeedback: "OKです。画面と処理の流れを整理できています。",
          incorrectFeedback: "入力して送信し、保存したあと一覧で確認します。",
          isMissionCheck: true,
        }),
      ],
    },
  ],
};

// Course8後半は、同じseed構造に合わせたコンパクト生成ヘルパーで定義します。
// 各MissionはドラフトのSection/Activity構成に沿って、概念説明・分類問題・順序問題・Mission Checkを含みます。
const inputDataPlanningMission = createCourse8InputDataMission();
const processIntegrationMission = createCourse8ProcessIntegrationMission();
const taskBreakdownMission = createCourse8TaskBreakdownMission();
const observeSimilarAppsChallengeMission =
  createCourse8ObserveSimilarAppsChallenge();
const teamRoleChallengeMission = createCourse8TeamRoleChallenge();
const advancedAiApiChallengeMission = createCourse8AdvancedAiApiChallenge();

function createCourse8InputDataMission(): MissionSeed {
  return {
    id: "app-input-data-planning",
    title: "入力と保存データを決める",
    description: "フォーム項目とDB項目を対応づけ、保存すべき情報を判断します。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/app-input-data-planning.png",
    estimatedMinutes: 12,
    order: 5,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 120,
    learnedItems: [
      "入力項目を決める",
      "保存すべき情報を判断する",
      "フォーム項目とDB項目を対応づける",
    ],
    isPublished: true,
    sections: [
      {
        id: "app-input-items-section",
        title: "入力項目を決める",
        description: "ユーザーが入力する情報を選びます。",
        order: 1,
        activities: [
          tutorial({
            id: "app-input-a01-intro",
            order: 1,
            sectionOrder: 1,
            title: "入力項目は、ユーザーに入れてもらう情報",
            mentorMessage:
              "アプリで保存したいデータがある場合、まずフォームで何を入力してもらうかを決めます。",
            body: "課題管理アプリなら、課題名、締切日、メモなどが入力項目になります。予約アプリなら、名前、日付、人数などが入力項目になります。入力項目を決めると、DBに保存する項目も考えやすくなります。",
            summary: [
              "入力項目はユーザーが入力する情報",
              "保存したい情報から逆算する",
              "入力項目とDB項目は対応することが多い",
            ],
          }),
          choice({
            id: "app-input-a02-input-choice",
            order: 2,
            sectionOrder: 2,
            title: "ユーザーが入力する情報は？",
            instruction:
              "課題管理アプリで入力してもらう情報として自然なものを選びましょう。",
            mentorMessage: "アプリの中心機能に必要な情報を選びます。",
            question:
              "課題管理アプリで、ユーザーが入力する情報として自然なのはどれ？",
            choices: [
              {
                id: "app-input-a02-correct",
                label: "課題名と締切日",
                isCorrect: true,
                feedback:
                  "その通りです。課題を管理するために必要な入力項目です。",
              },
              {
                id: "app-input-a02-wrong-secret",
                label: "他人のパスワード",
                isCorrect: false,
                feedback: "危険です。不要な秘密情報を入力させてはいけません。",
              },
              {
                id: "app-input-a02-wrong-random",
                label: "意味のない乱数だけ",
                isCorrect: false,
                feedback: "惜しいです。課題管理に必要な情報を選びましょう。",
              },
              {
                id: "app-input-a02-wrong-hardware",
                label: "PCの製造番号だけ",
                isCorrect: false,
                feedback: "惜しいです。課題管理の中心機能とは関係が薄いです。",
              },
            ],
          }),
          choice({
            id: "app-input-a03-not-needed-choice",
            order: 3,
            sectionOrder: 3,
            title: "入力しなくてもよい情報は？",
            instruction:
              "課題管理アプリで入力させる必要が低いものを選びましょう。",
            mentorMessage: "必要以上の情報を入力させないことも大切です。",
            question:
              "課題管理アプリの最小機能で、入力させる必要が低いものはどれ？",
            choices: [
              {
                id: "app-input-a03-correct",
                label: "銀行口座の暗証番号",
                isCorrect: true,
                feedback:
                  "その通りです。課題管理には不要で、入力させるべきではない情報です。",
              },
              {
                id: "app-input-a03-wrong-title",
                label: "課題名",
                isCorrect: false,
                feedback: "惜しいです。課題名は課題管理に必要な情報です。",
              },
              {
                id: "app-input-a03-wrong-date",
                label: "締切日",
                isCorrect: false,
                feedback: "惜しいです。締切日は課題管理に必要な情報です。",
              },
              {
                id: "app-input-a03-wrong-note",
                label: "課題メモ",
                isCorrect: false,
                feedback: "惜しいです。メモは必要に応じて入力項目にできます。",
              },
            ],
          }),
        ],
      },
      {
        id: "app-save-data-section",
        title: "保存データを決める",
        description: "入力項目とDB項目を対応づけます。",
        order: 2,
        activities: [
          tutorial({
            id: "app-input-a04-save-intro",
            order: 4,
            sectionOrder: 1,
            title: "保存データは、後から使いたい情報",
            mentorMessage:
              "DBには、あとから一覧表示や検索で使いたい情報を保存します。",
            body: "フォームで入力した課題名や締切日は、後から一覧表示で使うためDBに保存します。一方で、一時的な表示だけに使う情報や不要な秘密情報は、保存しない判断も必要です。",
            summary: [
              "後から使う情報を保存する",
              "不要な情報は保存しない",
              "入力項目とDB項目を対応づける",
            ],
          }),
          match({
            id: "app-input-a05-input-db-match",
            order: 5,
            sectionOrder: 2,
            title: "入力項目とDB項目を対応づけよう",
            instruction: "課題管理アプリの入力項目とDB項目を対応づけましょう。",
            mentorMessage: "フォームの入力がDBのどの列に入るかを考えます。",
            items: [
              { id: "task-title-input", label: "課題名の入力欄" },
              { id: "deadline-input", label: "締切日の入力欄" },
              { id: "memo-input", label: "メモの入力欄" },
            ],
            targets: [
              { id: "title-column", label: "title列" },
              { id: "deadline-column", label: "deadline列" },
              { id: "memo-column", label: "memo列" },
            ],
            answers: [
              { targetId: "title-column", itemIds: ["task-title-input"] },
              { targetId: "deadline-column", itemIds: ["deadline-input"] },
              { targetId: "memo-column", itemIds: ["memo-input"] },
            ],
            correctFeedback:
              "よくできています。入力項目とDB項目を対応づけられています。",
            incorrectFeedback:
              "課題名はtitle、締切日はdeadline、メモはmemoのように対応づけて考えます。",
          }),
          match({
            id: "app-input-a06-save-or-not-match",
            order: 6,
            sectionOrder: 3,
            title: "保存する情報と保存しない情報を分けよう",
            instruction:
              "次の情報を、保存する候補・保存しない候補に分けましょう。",
            mentorMessage: "後から使う情報か、不要・危険な情報かを判断します。",
            items: [
              { id: "task-title", label: "課題名" },
              { id: "deadline", label: "締切日" },
              { id: "secret-pin", label: "銀行口座の暗証番号" },
              { id: "random-noise", label: "意味のない一時的な乱数" },
            ],
            targets: [
              { id: "save", label: "保存する候補" },
              { id: "not-save", label: "保存しない候補" },
            ],
            answers: [
              { targetId: "save", itemIds: ["task-title", "deadline"] },
              { targetId: "not-save", itemIds: ["secret-pin", "random-noise"] },
            ],
            correctFeedback:
              "いい整理です。必要な情報だけを保存する判断ができています。",
            incorrectFeedback:
              "後から一覧表示に使う情報か、不要・危険な情報かを分けましょう。",
          }),
        ],
      },
      {
        id: "app-input-check-section",
        title: "Mission Check",
        description: "入力項目と保存データを確認します。",
        order: 3,
        activities: [
          match({
            id: "app-input-c01-input-save-check",
            order: 7,
            sectionOrder: 1,
            title: "入力項目と保存項目を整理しよう",
            instruction: "入力項目をDB項目に対応づけましょう。",
            mentorMessage: "フォームからDBまでの対応を確認します。",
            items: [
              { id: "name", label: "予約者名の入力欄" },
              { id: "date", label: "予約日の入力欄" },
              { id: "people", label: "人数の入力欄" },
            ],
            targets: [
              { id: "name-column", label: "name列" },
              { id: "date-column", label: "date列" },
              { id: "people-column", label: "people列" },
            ],
            answers: [
              { targetId: "name-column", itemIds: ["name"] },
              { targetId: "date-column", itemIds: ["date"] },
              { targetId: "people-column", itemIds: ["people"] },
            ],
            correctFeedback:
              "OKです。入力項目と保存項目を対応づけられています。",
            incorrectFeedback:
              "入力欄の内容がDBのどの列に入るかを考えましょう。",
            isMissionCheck: true,
          }),
          choice({
            id: "app-input-c02-not-save-check",
            order: 8,
            sectionOrder: 2,
            title: "保存しなくてよい情報を選ぼう",
            instruction: "課題管理アプリで保存しなくてよい情報を選びましょう。",
            mentorMessage: "必要な情報だけを保存します。",
            question:
              "課題管理アプリで、保存しなくてよい情報として自然なのはどれ？",
            choices: [
              {
                id: "app-input-c02-correct",
                label: "銀行口座の暗証番号",
                isCorrect: true,
                feedback:
                  "OKです。課題管理に不要で、保存すべきではありません。",
              },
              {
                id: "app-input-c02-wrong-title",
                label: "課題名",
                isCorrect: false,
                feedback: "惜しいです。課題名は保存する候補です。",
              },
              {
                id: "app-input-c02-wrong-deadline",
                label: "締切日",
                isCorrect: false,
                feedback: "惜しいです。締切日は保存する候補です。",
              },
              {
                id: "app-input-c02-wrong-status",
                label: "完了状態",
                isCorrect: false,
                feedback: "惜しいです。完了状態も保存する候補になります。",
              },
            ],
            isMissionCheck: true,
          }),
        ],
      },
    ],
  };
}

function createCourse8ProcessIntegrationMission(): MissionSeed {
  return {
    id: "app-process-integration",
    title: "処理と外部連携を考える",
    description: "条件分岐、検索、通知、AI/APIを必須機能と発展機能に分けます。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/app-process-integration.png",
    estimatedMinutes: 12,
    order: 6,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 120,
    learnedItems: [
      "アプリ内処理を整理する",
      "AI/APIの価値が出る場面を判断する",
      "必須機能と発展機能を分ける",
    ],
    isPublished: true,
    sections: [
      {
        id: "app-process-inside-section",
        title: "アプリ内の処理を考える",
        description: "条件分岐、検索、並び替えなどの処理を整理します。",
        order: 1,
        activities: [
          tutorial({
            id: "app-process-a01-intro",
            order: 1,
            sectionOrder: 1,
            title: "アプリには画面の裏で動く処理がある",
            mentorMessage:
              "アプリは画面だけでなく、入力を判定したり、検索したり、並び替えたりする処理を持ちます。",
            body: "課題管理アプリなら、締切が近い課題を上に出す、完了済みを非表示にする、空欄をチェックするなどの処理があります。最初に必要な処理と、後から追加できる処理を分けて考えましょう。",
            summary: ["条件分岐", "検索", "並び替え", "入力チェック"],
            visual: course8Visuals.appParts,
          }),
          choice({
            id: "app-process-a02-needed-choice",
            order: 2,
            sectionOrder: 2,
            title: "最初の制作に必要な処理は？",
            instruction: "課題管理アプリの最小機能に必要な処理を選びましょう。",
            mentorMessage: "最初は中心機能に必要な処理を優先します。",
            question: "課題管理アプリの最小機能で必要になりやすい処理はどれ？",
            choices: [
              {
                id: "app-process-a02-correct",
                label: "課題名と締切を受け取って保存する処理",
                isCorrect: true,
                feedback:
                  "その通りです。登録して一覧表示する中心機能に必要な処理です。",
              },
              {
                id: "app-process-a02-wrong-ai",
                label: "AIが毎日長い小説を書く処理",
                isCorrect: false,
                feedback: "惜しいです。課題管理の最小機能からは離れています。",
              },
              {
                id: "app-process-a02-wrong-game",
                label: "3Dゲームエンジンを作る処理",
                isCorrect: false,
                feedback: "惜しいです。課題管理の中心機能とは違います。",
              },
              {
                id: "app-process-a02-wrong-pay",
                label: "決済処理だけを最初に作る",
                isCorrect: false,
                feedback:
                  "惜しいです。課題管理の最小機能には必須ではありません。",
              },
            ],
          }),
          match({
            id: "app-process-a03-later-match",
            order: 3,
            sectionOrder: 3,
            title: "必要な処理と後回しにできる処理を分けよう",
            instruction:
              "次の処理を、最初の制作に必要・後回しにできるに分けましょう。",
            mentorMessage: "中心機能に必要かどうかで判断します。",
            items: [
              { id: "save-task", label: "課題を保存する" },
              { id: "show-list", label: "課題一覧を表示する" },
              { id: "ai-plan", label: "AIが学習計画を提案する" },
              { id: "notification", label: "締切前に通知する" },
            ],
            targets: [
              { id: "required", label: "最初の制作に必要" },
              { id: "later", label: "後回しにできる" },
            ],
            answers: [
              { targetId: "required", itemIds: ["save-task", "show-list"] },
              { targetId: "later", itemIds: ["ai-plan", "notification"] },
            ],
            correctFeedback:
              "よく整理できています。最初に作る処理と発展処理を分けられています。",
            incorrectFeedback:
              "登録・保存・一覧は中心機能、AI提案や通知は後から追加できることがあります。",
          }),
        ],
      },
      {
        id: "app-external-integration-section",
        title: "外部連携を考える",
        description: "APIやAIを最初に入れるか、後回しにするかを判断します。",
        order: 2,
        activities: [
          tutorial({
            id: "app-process-a04-external-intro",
            order: 4,
            sectionOrder: 1,
            title: "AI/APIは価値が出る場面で使う",
            mentorMessage:
              "AIやAPIは便利ですが、入れれば必ず良いわけではありません。アプリの目的に合うかを考えます。",
            body: "天気アプリなら天気API、文章要約アプリならAIは価値が出やすいです。一方で、単純な課題登録アプリの最小機能なら、AIやAPIは後回しでも成立します。",
            summary: [
              "AI/APIは目的に合うと価値が出る",
              "最小機能では後回しでもよい場合がある",
              "必須機能と発展機能を分ける",
            ],
          }),
          choice({
            id: "app-process-a05-ai-api-choice",
            order: 5,
            sectionOrder: 2,
            title: "AI/APIを入れる価値がある場面は？",
            instruction: "AI/APIを入れる価値が出やすい場面を選びましょう。",
            mentorMessage:
              "自分のアプリだけでは難しい処理や、外部データが必要な場面に注目します。",
            question: "AI/APIを入れる価値が出やすい場面はどれ？",
            choices: [
              {
                id: "app-process-a05-correct",
                label: "天気情報を外部サービスから取得して表示する",
                isCorrect: true,
                feedback:
                  "その通りです。外部データが必要なのでAPIを使う価値があります。",
              },
              {
                id: "app-process-a05-wrong-h1",
                label: "h1タグを1つ表示するだけ",
                isCorrect: false,
                feedback:
                  "惜しいです。単純な表示だけならAI/APIは不要なことが多いです。",
              },
              {
                id: "app-process-a05-wrong-color",
                label: "文字色を青にするだけ",
                isCorrect: false,
                feedback:
                  "惜しいです。CSSでできる見た目変更にAI/APIは基本不要です。",
              },
              {
                id: "app-process-a05-wrong-title",
                label: "ページタイトルを固定で表示するだけ",
                isCorrect: false,
                feedback: "惜しいです。固定表示だけなら外部連携は不要です。",
              },
            ],
          }),
          match({
            id: "app-process-a06-required-advanced-match",
            order: 6,
            sectionOrder: 3,
            title: "必須機能と発展機能を分けよう",
            instruction:
              "課題管理アプリの機能を、必須機能・発展機能に分けましょう。",
            mentorMessage: "最小機能に必要か、後から入れる発展かを判断します。",
            items: [
              { id: "task-register", label: "課題を登録する" },
              { id: "task-list", label: "課題一覧を見る" },
              { id: "ai-suggest", label: "AIが優先順位を提案する" },
              { id: "calendar-api", label: "外部カレンダーAPIと連携する" },
            ],
            targets: [
              { id: "required", label: "必須機能" },
              { id: "advanced", label: "発展機能" },
            ],
            answers: [
              { targetId: "required", itemIds: ["task-register", "task-list"] },
              { targetId: "advanced", itemIds: ["ai-suggest", "calendar-api"] },
            ],
            correctFeedback:
              "いい整理です。中心機能とAI/APIを使う発展機能を分けられています。",
            incorrectFeedback:
              "課題管理の最小機能に必要なものと、後から入れると便利なものに分けましょう。",
          }),
        ],
      },
      {
        id: "app-process-check-section",
        title: "Mission Check",
        description: "処理と外部連携の分け方を確認します。",
        order: 3,
        activities: [
          match({
            id: "app-process-c01-required-check",
            order: 7,
            sectionOrder: 1,
            title: "必須機能と発展機能を分けよう",
            instruction: "次の機能を、必須機能・発展機能に分けましょう。",
            mentorMessage: "最小機能に必要か、後から追加できるかで分けます。",
            items: [
              { id: "save", label: "入力内容を保存する" },
              { id: "list", label: "保存した内容を一覧表示する" },
              { id: "ai", label: "AIがアドバイスする" },
              { id: "notification", label: "通知を送る" },
            ],
            targets: [
              { id: "required", label: "必須機能" },
              { id: "advanced", label: "発展機能" },
            ],
            answers: [
              { targetId: "required", itemIds: ["save", "list"] },
              { targetId: "advanced", itemIds: ["ai", "notification"] },
            ],
            correctFeedback: "OKです。必須機能と発展機能を分けられています。",
            incorrectFeedback:
              "保存と一覧は中心機能、AIや通知は発展機能として考えられます。",
            isMissionCheck: true,
          }),
          choice({
            id: "app-process-c02-ai-api-check",
            order: 8,
            sectionOrder: 2,
            title: "AI/APIを入れる価値がある場面を選ぼう",
            instruction: "AI/APIを入れる価値が出やすい場面を選びましょう。",
            mentorMessage: "外部データやAIの判断が必要な場面を見ます。",
            question: "AI/APIを入れる価値が出やすい場面はどれ？",
            choices: [
              {
                id: "app-process-c02-correct",
                label: "入力した文章をAIが要約する",
                isCorrect: true,
                feedback: "OKです。AIが得意な処理を使う価値があります。",
              },
              {
                id: "app-process-c02-wrong-h1",
                label: "h1タグを固定で表示するだけ",
                isCorrect: false,
                feedback: "惜しいです。固定表示だけならAI/APIは不要です。",
              },
              {
                id: "app-process-c02-wrong-color",
                label: "背景色を青にするだけ",
                isCorrect: false,
                feedback: "惜しいです。CSSでできます。",
              },
              {
                id: "app-process-c02-wrong-p",
                label: "pタグで固定文を表示するだけ",
                isCorrect: false,
                feedback: "惜しいです。外部連携やAIは必要ありません。",
              },
            ],
            isMissionCheck: true,
          }),
        ],
      },
    ],
  };
}

function createCourse8TaskBreakdownMission(): MissionSeed {
  return {
    id: "app-task-breakdown",
    title: "制作タスクへ分解する",
    description:
      "アプリ案をフロント、バック、DB、AI/APIの作業に分解できるようにします。",
    difficulty: CourseDifficulty.NORMAL,
    goalImg: "/images/missions/app-task-breakdown.png",
    estimatedMinutes: 12,
    order: 7,
    type: MissionType.MAIN,
    isRequiredForCourseCompletion: true,
    parentMissionId: null,
    roadmapLane: 0,
    branchOrder: 0,
    rewardExp: 130,
    learnedItems: [
      "作業領域に分ける",
      "画面、入力処理、保存処理を分類する",
      "実装順を考える",
    ],
    isPublished: true,
    sections: [
      {
        id: "app-task-area-section",
        title: "作業領域に分ける",
        description: "画面作成、入力処理、保存処理などに分けます。",
        order: 1,
        activities: [
          tutorial({
            id: "app-task-a01-area-intro",
            order: 1,
            sectionOrder: 1,
            title: "アプリ案は作業領域に分けられる",
            mentorMessage:
              "最終制作では、アプリ案をそのまま作ろうとせず、作業に分けると進めやすくなります。",
            body: "画面を作る作業はフロント寄り、入力を受け取る処理はバックエンド寄り、保存はDBに関係します。AIや外部APIを使う場合は、外部連携の作業として分けておきます。",
            summary: [
              "画面作成はフロント寄り",
              "入力処理はバックエンド寄り",
              "保存はDB、AI/APIは外部連携",
            ],
            visual: course8Visuals.implementationOrder,
          }),
          match({
            id: "app-task-a02-area-match",
            order: 2,
            sectionOrder: 2,
            title: "作業を領域に分けよう",
            instruction:
              "次の作業を、フロント・バック・DB・AI/APIに分けましょう。",
            mentorMessage: "作業がどの技術領域に近いかを考えます。",
            items: [
              { id: "html-form", label: "入力フォーム画面を作る" },
              { id: "receive-form", label: "フォーム送信を受け取る" },
              { id: "save-db", label: "DBに保存する" },
              { id: "ai-api", label: "AIに文章を送る" },
            ],
            targets: [
              { id: "front", label: "フロント" },
              { id: "back", label: "バック" },
              { id: "db", label: "DB" },
              { id: "api", label: "AI/API" },
            ],
            answers: [
              { targetId: "front", itemIds: ["html-form"] },
              { targetId: "back", itemIds: ["receive-form"] },
              { targetId: "db", itemIds: ["save-db"] },
              { targetId: "api", itemIds: ["ai-api"] },
            ],
            correctFeedback:
              "よく整理できています。制作タスクを技術領域に分けられています。",
            incorrectFeedback:
              "画面はフロント、受け取りはバック、保存はDB、AI連携はAI/APIとして考えましょう。",
          }),
          match({
            id: "app-task-a03-work-match",
            order: 3,
            sectionOrder: 3,
            title: "画面作成、入力処理、保存処理を分類しよう",
            instruction: "課題管理アプリの作業を種類ごとに分けましょう。",
            mentorMessage: "実装タスクとして何をするかを見ます。",
            items: [
              { id: "make-form", label: "課題入力フォームを作る" },
              { id: "request-form", label: "課題名と締切を受け取る" },
              { id: "save-task", label: "課題をDBに保存する" },
              { id: "show-list", label: "課題一覧を表示する" },
            ],
            targets: [
              { id: "screen", label: "画面作成" },
              { id: "input", label: "入力処理" },
              { id: "save", label: "保存処理" },
              { id: "display", label: "表示処理" },
            ],
            answers: [
              { targetId: "screen", itemIds: ["make-form"] },
              { targetId: "input", itemIds: ["request-form"] },
              { targetId: "save", itemIds: ["save-task"] },
              { targetId: "display", itemIds: ["show-list"] },
            ],
            correctFeedback:
              "いい整理です。作業内容を具体的なタスクに分けられています。",
            incorrectFeedback:
              "画面を作る、入力を受け取る、保存する、表示するに分けて考えましょう。",
          }),
        ],
      },
      {
        id: "app-task-order-section",
        title: "実装順を考える",
        description: "画面から入力、保存、一覧へ進める流れを確認します。",
        order: 2,
        activities: [
          tutorial({
            id: "app-task-a04-order-intro",
            order: 4,
            sectionOrder: 1,
            title: "実装順を考えると進めやすい",
            mentorMessage:
              "制作タスクを分けたら、次はどの順番で作るかを考えます。",
            body: "最初に画面だけ作ると、完成形のイメージを確認しやすいです。次にフォーム入力を送れるようにし、サーバ側で受け取り、DBに保存し、一覧に表示する流れへ進めます。",
            summary: [
              "まず画面を作る",
              "次に入力を受け取る",
              "保存して一覧表示する",
            ],
          }),
          orderedSteps({
            id: "app-task-a05-order",
            order: 5,
            sectionOrder: 2,
            title: "実装順を並べよう",
            instruction: "課題管理アプリを作る自然な順番に並べましょう。",
            mentorMessage:
              "画面だけ先に作り、その後で入力、保存、一覧へ進めます。",
            steps: [
              { id: "screen", label: "課題入力画面を作る" },
              { id: "receive", label: "フォーム送信を受け取る" },
              { id: "save", label: "DBに保存する" },
              { id: "list", label: "保存した課題を一覧表示する" },
            ],
            answerOrder: ["screen", "receive", "save", "list"],
            correctFeedback:
              "いい順番です。小さく動きを確認しながら進められます。",
            incorrectFeedback:
              "まず画面を作り、入力を受け取り、保存し、一覧で表示する順番が自然です。",
          }),
          match({
            id: "app-task-a06-final-breakdown-match",
            order: 6,
            sectionOrder: 3,
            title: "アプリ案を制作タスクに分解しよう",
            instruction: "課題管理アプリの作業を、担当領域に分けましょう。",
            mentorMessage: "Course8の最後に、制作タスクへ分解する練習です。",
            items: [
              { id: "html-css", label: "課題入力画面と一覧画面を作る" },
              { id: "flask", label: "フォーム送信を受け取る処理を書く" },
              { id: "db", label: "課題を保存するテーブルを作る" },
              { id: "api", label: "AIで優先順位を提案する" },
            ],
            targets: [
              { id: "front", label: "フロント" },
              { id: "back", label: "バック" },
              { id: "database", label: "DB" },
              { id: "ai-api", label: "AI/API" },
            ],
            answers: [
              { targetId: "front", itemIds: ["html-css"] },
              { targetId: "back", itemIds: ["flask"] },
              { targetId: "database", itemIds: ["db"] },
              { targetId: "ai-api", itemIds: ["api"] },
            ],
            correctFeedback:
              "よくできています。アプリ案を制作タスクへ分解できています。",
            incorrectFeedback:
              "画面はフロント、フォーム受け取りはバック、保存はDB、AI提案はAI/APIです。",
          }),
        ],
      },
      {
        id: "app-task-check-section",
        title: "Mission Check",
        description: "制作タスクへの分解を確認します。",
        order: 3,
        activities: [
          match({
            id: "app-task-c01-breakdown-check",
            order: 7,
            sectionOrder: 1,
            title: "アプリ案を制作タスクに分解しよう",
            instruction: "作業内容を担当領域に分けましょう。",
            mentorMessage: "最終制作の準備として重要な整理です。",
            items: [
              { id: "ui", label: "画面をHTML/CSSで作る" },
              { id: "server", label: "入力を受け取る処理を書く" },
              { id: "save", label: "DBに保存する" },
              { id: "ai", label: "AI/APIと連携する" },
            ],
            targets: [
              { id: "front", label: "フロント" },
              { id: "back", label: "バック" },
              { id: "db", label: "DB" },
              { id: "api", label: "AI/API" },
            ],
            answers: [
              { targetId: "front", itemIds: ["ui"] },
              { targetId: "back", itemIds: ["server"] },
              { targetId: "db", itemIds: ["save"] },
              { targetId: "api", itemIds: ["ai"] },
            ],
            correctFeedback: "OKです。制作タスクを領域に分けられています。",
            incorrectFeedback: "画面、処理、保存、外部連携で分けましょう。",
            isMissionCheck: true,
          }),
          orderedSteps({
            id: "app-task-c02-order-check",
            order: 8,
            sectionOrder: 2,
            title: "実装順として自然な並びを選ぼう",
            instruction: "課題管理アプリの実装順を並べましょう。",
            mentorMessage: "小さく動きを確認しながら作る順番です。",
            steps: [
              { id: "screen", label: "画面を作る" },
              { id: "input", label: "入力を受け取る" },
              { id: "save", label: "保存する" },
              { id: "list", label: "一覧表示する" },
            ],
            answerOrder: ["screen", "input", "save", "list"],
            correctFeedback: "OKです。自然な実装順を整理できています。",
            incorrectFeedback:
              "画面、入力、保存、一覧の順に考えると進めやすいです。",
            isMissionCheck: true,
          }),
        ],
      },
    ],
  };
}

function createCourse8ObserveSimilarAppsChallenge(): MissionSeed {
  return createCourse8SimpleChallenge({
    id: "challenge-observe-similar-apps",
    title: "似たアプリを観察する",
    description:
      "既存アプリから参考になる画面や機能を見つけ、自分の案へ活かす考え方を学びます。",
    parentMissionId: "app-target-user",
    order: 8,
    branchOrder: 1,
    sectionId: "observe-similar-apps-section",
    sectionTitle: "既存アプリから学ぶ",
    tutorialId: "observe-apps-a01-intro",
    tutorialTitle: "似たアプリを見ると、必要な機能を考えやすい",
    tutorialBody:
      "課題管理アプリを作りたいなら、TODOアプリやカレンダーアプリを観察すると、入力項目や一覧表示のヒントになります。ただし、見た目や内容をそのまま真似するのではなく、自分のユーザーや目的に合わせて参考にします。",
    summary: [
      "似たアプリから機能を学ぶ",
      "そのまま真似しない",
      "自分の目的に合わせる",
    ],
    matchId: "observe-apps-a02-reference-match",
    matchTitle: "参考になる機能を選ぼう",
    matchInstruction:
      "課題管理アプリを作るとき、参考になるもの・そのまま真似しないものに分けましょう。",
    matchItems: [
      { id: "task-list", label: "TODOアプリの一覧表示" },
      { id: "deadline", label: "締切日を表示する機能" },
      { id: "brand-copy", label: "他サービスのロゴをそのまま使う" },
      { id: "unrelated-game", label: "関係ないゲーム機能を全部入れる" },
    ],
    matchTargets: [
      { id: "reference", label: "参考になる" },
      { id: "avoid", label: "そのまま真似しない" },
    ],
    matchAnswers: [
      { targetId: "reference", itemIds: ["task-list", "deadline"] },
      { targetId: "avoid", itemIds: ["brand-copy", "unrelated-game"] },
    ],
    checkId: "observe-apps-c01-check",
    checkQuestion: "課題管理アプリの参考にしやすい機能はどれ？",
    correctLabel: "TODOアプリの登録フォームと一覧表示",
    correctFeedback: "OKです。課題管理にも応用しやすい機能です。",
    wrongLabels: [
      "他サービスのロゴをそのまま使う",
      "関係ない機能を全部入れる",
      "画面を丸ごとコピーする",
    ],
  });
}

function createCourse8TeamRoleChallenge(): MissionSeed {
  return createCourse8SimpleChallenge({
    id: "challenge-team-role",
    title: "チーム制作の役割分担を考える",
    description:
      "UI担当、サーバ担当、DB担当の作業を分類し、進捗共有に必要な情報を考えます。",
    parentMissionId: "app-task-breakdown",
    order: 9,
    branchOrder: 2,
    sectionId: "team-role-section",
    sectionTitle: "担当を分ける",
    tutorialId: "team-role-a01-intro",
    tutorialTitle: "チーム制作では作業を分けて進める",
    tutorialBody:
      "チーム制作では、すべてを1人で抱えず、作業領域ごとに分担すると進めやすくなります。UI担当は画面、サーバ担当は処理、DB担当は保存項目や取得処理を考えます。",
    summary: ["UI担当", "サーバ担当", "DB担当", "進捗共有"],
    matchId: "team-role-a02-role-match",
    matchTitle: "役割ごとの作業を分類しよう",
    matchInstruction: "次の作業を、UI担当・サーバ担当・DB担当に分けましょう。",
    matchItems: [
      { id: "ui", label: "入力フォームの見た目を整える" },
      { id: "server", label: "フォーム送信を受け取る" },
      { id: "db", label: "保存する列を決める" },
    ],
    matchTargets: [
      { id: "ui-role", label: "UI担当" },
      { id: "server-role", label: "サーバ担当" },
      { id: "db-role", label: "DB担当" },
    ],
    matchAnswers: [
      { targetId: "ui-role", itemIds: ["ui"] },
      { targetId: "server-role", itemIds: ["server"] },
      { targetId: "db-role", itemIds: ["db"] },
    ],
    checkId: "team-role-c01-check",
    checkQuestion: "チーム制作の進捗共有として自然なのはどれ？",
    correctLabel: "できたこと、詰まっていること、次にやることを伝える",
    correctFeedback: "OKです。チームで状況を共有しやすくなります。",
    wrongLabels: [
      "何も共有しない",
      "関係ない秘密情報だけを伝える",
      "作業内容と関係ない話だけをする",
    ],
  });
}

function createCourse8AdvancedAiApiChallenge(): MissionSeed {
  return createCourse8SimpleChallenge({
    id: "challenge-ai-api-advanced-idea",
    title: "AI/APIを使う発展案を考える",
    description: "AI/APIを発展機能として入れる価値がある場面を判断します。",
    parentMissionId: "app-process-integration",
    order: 10,
    branchOrder: 3,
    sectionId: "ai-api-advanced-section",
    sectionTitle: "発展機能として考える",
    tutorialId: "ai-api-advanced-a01-intro",
    tutorialTitle: "AI/APIは目的に合うときに発展機能として入れる",
    tutorialBody:
      "AI/APIは便利ですが、最初から必ず入れる必要はありません。課題管理アプリなら、最初は課題登録と一覧表示だけでも成立します。発展として、AIが優先順位を提案したり、外部カレンダーAPIと連携したりできます。",
    summary: [
      "AI/APIは発展機能として考える",
      "目的に合う場面で価値が出る",
      "最初から必須とは限らない",
    ],
    matchId: "ai-api-advanced-a02-value-match",
    matchTitle: "価値が出る場面を分けよう",
    matchInstruction:
      "次の機能を、AI/APIの価値が出やすい場面・不要なことが多い場面に分けましょう。",
    matchItems: [
      { id: "ai-summary", label: "長いメモをAIが要約する" },
      { id: "weather-api", label: "天気APIから天気を取得する" },
      { id: "fixed-h1", label: "固定のh1を表示する" },
      { id: "button-color", label: "ボタンの色を変える" },
    ],
    matchTargets: [
      { id: "valuable", label: "価値が出やすい" },
      { id: "not-needed", label: "不要なことが多い" },
    ],
    matchAnswers: [
      { targetId: "valuable", itemIds: ["ai-summary", "weather-api"] },
      { targetId: "not-needed", itemIds: ["fixed-h1", "button-color"] },
    ],
    checkId: "ai-api-advanced-c01-check",
    checkQuestion: "AI/APIを入れる価値が出やすい発展機能はどれ？",
    correctLabel: "課題メモをAIが要約し、重要な点を表示する",
    correctFeedback: "OKです。AIを使う価値が出やすい発展機能です。",
    wrongLabels: [
      "固定のh1を1つ表示するだけ",
      "背景色を青にするだけ",
      "ページタイトルを固定で表示するだけ",
    ],
  });
}

type Course8SimpleChallengeParams = {
  id: string;
  title: string;
  description: string;
  parentMissionId: string;
  order: number;
  branchOrder: number;
  sectionId: string;
  sectionTitle: string;
  tutorialId: string;
  tutorialTitle: string;
  tutorialBody: string;
  summary: string[];
  matchId: string;
  matchTitle: string;
  matchInstruction: string;
  matchItems: { id: string; label: string }[];
  matchTargets: { id: string; label: string }[];
  matchAnswers: MatchAnswer[];
  checkId: string;
  checkQuestion: string;
  correctLabel: string;
  correctFeedback: string;
  wrongLabels: string[];
};

function createCourse8SimpleChallenge(
  params: Course8SimpleChallengeParams,
): MissionSeed {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    difficulty: CourseDifficulty.NORMAL,
    goalImg: `/images/missions/${params.id}.png`,
    estimatedMinutes: 8,
    order: params.order,
    type: MissionType.CHALLENGE,
    isRequiredForCourseCompletion: false,
    parentMissionId: params.parentMissionId,
    roadmapLane: 1,
    branchOrder: params.branchOrder,
    rewardExp: 80,
    learnedItems: [params.title, params.description],
    isPublished: true,
    sections: [
      {
        id: params.sectionId,
        title: params.sectionTitle,
        description: params.description,
        order: 1,
        activities: [
          tutorial({
            id: params.tutorialId,
            order: 1,
            sectionOrder: 1,
            title: params.tutorialTitle,
            mentorMessage: params.description,
            body: params.tutorialBody,
            summary: params.summary,
          }),
          match({
            id: params.matchId,
            order: 2,
            sectionOrder: 2,
            title: params.matchTitle,
            instruction: params.matchInstruction,
            mentorMessage: "自分のアプリ案の目的に合うかを考えます。",
            items: params.matchItems,
            targets: params.matchTargets,
            answers: params.matchAnswers,
            correctFeedback:
              "よくできています。目的に合うものと避けるものを分けられています。",
            incorrectFeedback:
              "自分のアプリの目的に合うか、最初から入れるべきかを考えましょう。",
          }),
          choice({
            id: params.checkId,
            order: 3,
            sectionOrder: 3,
            title: params.matchTitle,
            instruction:
              "Challengeの確認問題です。最も自然なものを選びましょう。",
            mentorMessage: "最後に、考え方を確認します。",
            question: params.checkQuestion,
            choices: [
              {
                id: `${params.checkId}-correct`,
                label: params.correctLabel,
                isCorrect: true,
                feedback: params.correctFeedback,
              },
              ...params.wrongLabels.map((label, index) => ({
                id: `${params.checkId}-wrong-${index + 1}`,
                label,
                isCorrect: false,
                feedback:
                  "惜しいです。今回の目的に合うか、最初から入れる必要があるかをもう一度考えましょう。",
              })),
            ],
            isMissionCheck: true,
          }),
        ],
      },
    ],
  };
}

const appPlanningCourse: CourseSeed = {
  id: "app-planning",
  title: "自分のアプリを企画する",
  description:
    "まだアプリ案がない学生でも、身近な困りごとや興味からアプリ案を出し、画面・入力・処理・保存・外部連携のタスクへ分解できるようにします。",
  difficulty: CourseDifficulty.NORMAL,
  isInitiallyUnlocked: false,
  isPublished: true,
  version: 1,
  categories: [CourseCategoryType.TOOL, CourseCategoryType.UI],
  missions: [
    collectProblemsMission,
    targetUserMission,
    minimumFeatureMission,
    screenPlanningMission,
    inputDataPlanningMission,
    processIntegrationMission,
    taskBreakdownMission,
    observeSimilarAppsChallengeMission,
    teamRoleChallengeMission,
    advancedAiApiChallengeMission,
  ],
};

export const learningSeed: { courses: CourseSeed[] } = {
  courses: [
    {
      id: "course-web-overview",
      title: "Webアプリの全体像を知る",
      description:
        "ブラウザ、サーバ、HTML/CSS、Python/Flask、DB、APIがどのようにつながってWebアプリになるかを学ぶコースです。",
      difficulty: CourseDifficulty.EASY,
      isInitiallyUnlocked: true,
      isPublished: true,
      version: 1,
      categories: [CourseCategoryType.TOOL, CourseCategoryType.UI],
      missions: [
        webFlowMission,
        frontendBackendMission,
        requestResponseMission,
        localhostMission,
        techMapMission,
        troubleShootingMission,
        appThinkingMission,
        communicationDiagramChallenge,
        troubleOrderChallenge,
        appStructureChallenge,
      ],
    },
    course2FlaskPageCourse,
    course3HtmlCss,
    pythonWebInputCourse,
    dataStorageCourse,
    apiAiCourse,
    appPlanningCourse,
  ],
};
