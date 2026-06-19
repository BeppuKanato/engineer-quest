// prisma/seedData/learningSeed.ts

import {
  CourseCategoryType,
  CourseDifficulty,
  ExamDifficulty,
  LessonStepType,
  MissionType,
} from "@prisma/client";

type MissionSeedSpec = {
  id: string;
  title: string;
  description: string;
  type?: MissionType;
  parentMissionId?: string | null;
  roadmapLane?: number;
  branchOrder?: number;
  difficulty?: CourseDifficulty;
};

type CourseSeedSpec = {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  categories: CourseCategoryType[];
  missions: MissionSeedSpec[];
};

const goalImages = [
  "/images/missions/self-introduction-card.png",
  "/images/missions/profile-layout.png",
  "/images/missions/news-card.png",
];

const previewCss = [
  "body { font-family: system-ui, sans-serif; color: #0f172a; }",
  ".card { max-width: 440px; padding: 18px; border: 1px solid #d1d5db; border-radius: 12px; background: #f8fafc; }",
  ".card h2 { margin-top: 0; color: #2563eb; }",
  ".card p { line-height: 1.8; }",
].join("\n");

const cardCode = (title: string, body: string) => `<section class="card">
  <h2>${title}</h2>
  <p>${body}</p>
</section>`;

const fullCardCode = (title: string, body: string) => `<main>
  <section class="card">
    <h2>${title}</h2>
    <p>${body}</p>
    <button type="button">確認する</button>
  </section>
</main>`;

const noPreview = {
  type: "NO_PREVIEW",
  title: "プレビューなし",
};

const buildActivities = (missionId: string, lessonOrder: number, title: string) => [
  {
    id: `${missionId}-lesson-${lessonOrder}-activity-1`,
    type: LessonStepType.TUTORIAL,
    title: `${title}を知る`,
    instruction: `${title}について、講義で使う最小限の考え方を確認します。`,
    mentorMessage:
      "最初は全部を暗記しなくて大丈夫です。どの場面で使う知識かを意識しましょう。",
    content: {
      summary: [
        `${title}の役割を知る`,
        "画面、サーバ、データのどこに関係するか考える",
        "確認テストで再現するコードの意味を先に見る",
      ],
    },
    preview: noPreview,
    actionLabel: "理解した",
    order: 1,
  },
  {
    id: `${missionId}-lesson-${lessonOrder}-activity-2`,
    type: LessonStepType.VIEW,
    title: "小さな例を見る",
    instruction: `${title}がWebアプリの中でどう見えるかを、短い画面例で確認します。`,
    mentorMessage:
      "完成形を先に見ると、あとでコードを書くときに何を作っているか迷いにくくなります。",
    content: {
      summary: [`${title}の画面例を確認する`],
    },
    preview: {
      type: "STATIC_HTML",
      title,
      html: cardCode(title, `${title}を使うと、Webアプリの部品を少しずつ作れるようになります。`),
      caption: "この画面例を、確認テストではお手本として再現します。",
      minHeight: 180,
    },
    actionLabel: "次へ",
    order: 2,
  },
  {
    id: `${missionId}-lesson-${lessonOrder}-activity-3`,
    type: LessonStepType.CHOICE,
    title: "役割を選ぶ",
    instruction: `${title}で一番近い説明を選びましょう。`,
    mentorMessage:
      "迷ったら、ユーザーが見る画面の話か、サーバ側の処理の話かに分けて考えましょう。",
    content: {
      choices: [
        {
          id: `${missionId}-lesson-${lessonOrder}-choice-correct`,
          label: `${title}の役割を理解して、次の制作に使えるようにする`,
          isCorrect: true,
          feedback: "正解です。この観点で次のコード再現に進みましょう。",
        },
        {
          id: `${missionId}-lesson-${lessonOrder}-choice-wrong-1`,
          label: "細かい書き方を全部暗記する",
          isCorrect: false,
          feedback: "暗記より、まず役割と使う場面を押さえる方が大事です。",
        },
        {
          id: `${missionId}-lesson-${lessonOrder}-choice-wrong-2`,
          label: "見た目だけを先に作り込む",
          isCorrect: false,
          feedback: "見た目も大事ですが、今回は仕組みの理解もセットで扱います。",
        },
      ],
    },
    preview: noPreview,
    actionLabel: "答えを確認",
    order: 3,
  },
];

const buildLessons = (mission: MissionSeedSpec) => [
  {
    id: `${mission.id}-lesson-1`,
    title: `${mission.title}の全体像`,
    description: mission.description,
    order: 1,
    rewardExp: 35,
    learnedItems: [
      `${mission.title}の役割`,
      "Webアプリ内での位置づけ",
      "確認テストで再現する内容",
    ],
    activities: buildActivities(mission.id, 1, mission.title),
  },
  {
    id: `${mission.id}-lesson-2`,
    title: `${mission.title}を小さく使ってみる`,
    description: `${mission.title}を短いコードや画面部品として確認します。`,
    order: 2,
    rewardExp: 40,
    learnedItems: [
      "小さなコード例",
      "画面への反映",
      "次のMissionとのつながり",
    ],
    activities: buildActivities(mission.id, 2, `${mission.title}の使い方`),
  },
];

const buildMission = (
  courseIndex: number,
  mission: MissionSeedSpec,
  order: number
) => {
  const type = mission.type ?? MissionType.MAIN;
  const isChallenge = type === MissionType.CHALLENGE;
  const goalImg = goalImages[(courseIndex + order) % goalImages.length];

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    difficulty:
      mission.difficulty ?? (isChallenge ? CourseDifficulty.HARD : CourseDifficulty.EASY),
    goalImg,
    estimatedMinutes: isChallenge ? 18 : 12,
    order,
    type,
    isRequiredForCourseCompletion: !isChallenge,
    parentMissionId: mission.parentMissionId ?? null,
    roadmapLane: mission.roadmapLane ?? (isChallenge ? 1 : 0),
    branchOrder: mission.branchOrder ?? 0,
    isPublished: true,
    lessons: buildLessons(mission),
    exam: {
      id: `${mission.id}-exam`,
      title: `${mission.title}の確認テスト`,
      description:
        "レッスンで見た内容をもとに、お手本と同じコードを再現して完了します。",
      thumbnailUrl: goalImg,
      previewCss,
      estimatedTime: isChallenge ? "8分" : "5分",
      rewardExp: isChallenge ? 120 : 80,
      variants: [
        {
          difficulty: ExamDifficulty.EASY,
          initialCode: `<section class="card">
  <h2></h2>
  <p></p>
</section>`,
          answerCode: cardCode(
            mission.title,
            `${mission.title}の基本を確認しました。`
          ),
        },
        {
          difficulty: ExamDifficulty.NORMAL,
          initialCode: `<section class="card">
  <h2>${mission.title}</h2>
  <p></p>
</section>`,
          answerCode: cardCode(
            mission.title,
            `${mission.description}`
          ),
        },
        {
          difficulty: ExamDifficulty.HARD,
          initialCode: "",
          answerCode: fullCardCode(
            mission.title,
            `${mission.description}`
          ),
        },
      ],
    },
  };
};

const buildCourse = (course: CourseSeedSpec, courseIndex: number) => ({
  id: course.id,
  title: course.title,
  description: course.description,
  difficulty: course.difficulty,
  isInitiallyUnlocked: courseIndex === 0,
  isPublished: true,
  version: 1,
  categories: course.categories,
  missions: course.missions.map((mission, index) =>
    buildMission(courseIndex, mission, index + 1)
  ),
});

const main = (
  id: string,
  title: string,
  description: string,
  difficulty: CourseDifficulty = CourseDifficulty.EASY
): MissionSeedSpec => ({
  id,
  title,
  description,
  difficulty,
});

const challenge = (
  id: string,
  title: string,
  description: string,
  parentMissionId: string,
  roadmapLane: number,
  branchOrder: number
): MissionSeedSpec => ({
  id,
  title,
  description,
  type: MissionType.CHALLENGE,
  parentMissionId,
  roadmapLane,
  branchOrder,
  difficulty: CourseDifficulty.HARD,
});

const courseSpecs: CourseSeedSpec[] = [
  {
    id: "course-web-overview",
    title: "Webアプリの全体像を知る",
    description:
      "ブラウザ、サーバ、HTML/CSS、Python/Flask、DB、APIがどのようにつながってWebアプリになるかを学ぶコースです。",
    difficulty: CourseDifficulty.EASY,
    categories: [CourseCategoryType.TOOL, CourseCategoryType.UI],
    missions: [
      main("web-flow", "Webページが表示される流れを知る", "URLにアクセスしてから画面が表示されるまでの大きな流れをつかみます。"),
      main("frontend-backend", "フロントエンドとバックエンドを区別する", "HTML/CSSとPython/Flaskの担当範囲を分けて考えます。"),
      main("request-response", "リクエストとレスポンスを知る", "Webアプリの通信をお願いと返事として理解します。"),
      main("localhost-dev", "localhostと開発環境を知る", "自分のPCで動かす開発用サーバの考え方を学びます。"),
      main("tech-map", "HTML/CSS/Python/DB/APIの位置づけを知る", "今後出てくる技術がWebアプリのどこを担当するかを整理します。"),
      main("error-place", "エラーが起きた場所を大まかに考える", "画面が出ない、保存されない、見た目が変わらないときに確認する場所を考えます。"),
      main("app-parts", "最終制作で使う考え方を知る", "Webアプリを画面、入力、処理、保存、外部連携に分けて考える準備をします。"),
      challenge("web-flow-diagram", "通信の流れを図にする", "リクエスト、レスポンス、HTML、DB保存を図として整理するChallengeです。", "request-response", 1, 1),
      challenge("debug-order", "エラー調査の順番を作る", "不具合が起きたときの確認順を自分で組み立てるChallengeです。", "error-place", -1, 1),
      challenge("service-parts-guess", "アプリの構成を推理する", "身近なWebサービスを構成要素に分解するChallengeです。", "app-parts", 1, 2),
    ],
  },
  {
    id: "course-flask-page",
    title: "Flaskでページを表示する",
    description:
      "Flaskプロジェクトの構成を理解し、Python側の処理からHTMLテンプレートを返してブラウザで確認します。",
    difficulty: CourseDifficulty.EASY,
    categories: [CourseCategoryType.TOOL],
    missions: [
      main("flask-open-project", "プロジェクトを開いて構成を見る", "VS Codeでフォルダを開き、主要ファイルの場所を確認します。"),
      main("flask-app-py", "app.pyの役割を知る", "Flaskアプリの入口となるファイルを理解します。"),
      main("flask-views-route", "views.pyでURLと処理をつなぐ", "routeの役割を学び、URLアクセスで関数が呼ばれる流れを理解します。"),
      main("flask-render-template", "render_templateでHTMLを返す", "FlaskからHTMLテンプレートを返す方法を学びます。"),
      main("flask-run-server", "サーバを起動してブラウザで確認する", "Flaskサーバを起動し、localhostでページを確認します。"),
      main("flask-edit-html", "HTMLを編集して表示を変える", "index.htmlを編集し、画面表示が変わる体験をします。"),
      main("flask-template-value", "テンプレートへ値を渡す", "Python側で用意した値をHTML側で表示します。"),
      main("flask-explain-flow", "Flaskの最小ページを説明する", "URL、関数、テンプレート、表示のつながりを復習します。"),
      challenge("flask-two-pages", "2ページ構成にする", "別URLと別テンプレートを追加するChallengeです。", "flask-render-template", 1, 1),
      challenge("flask-mobile-check", "スマホから確認する考え方を知る", "同じネットワークから開発中のページを見る考え方を学ぶChallengeです。", "flask-run-server", -1, 1),
      challenge("flask-shared-layout", "共通レイアウトを考える", "複数ページで同じ部品を使う考え方を学ぶChallengeです。", "flask-explain-flow", 1, 2),
    ],
  },
  {
    id: "course-html-css",
    title: "HTML/CSSで画面を作る",
    description:
      "HTMLで情報の構造を作り、CSSで見た目を整え、簡単なサービス風トップページを作ります。",
    difficulty: CourseDifficulty.EASY,
    categories: [CourseCategoryType.UI],
    missions: [
      main("html-css-structure", "HTMLの骨組みを知る", "HTML文書の基本形とhead/bodyの役割を理解します。"),
      main("html-css-text", "文章を構造化する", "見出しと本文を使ってページの情報を整理します。"),
      main("html-css-link-image", "リンクと画像を使う", "aタグとimgタグで移動や画像表示を扱います。"),
      main("html-css-list-table", "リストと表で情報を整理する", "箇条書きや表を使って情報を読みやすくします。"),
      main("html-css-div-class", "divとclassで部品を作る", "まとまりを作り、CSSで選びやすい名前をつけます。"),
      main("html-css-load-css", "CSSを読み込む", "HTMLにCSSを読み込ませ、見た目を変える準備をします。"),
      main("html-css-spacing-color", "色・文字・余白を変える", "CSSで色、文字サイズ、余白、枠線を調整します。"),
      main("html-css-layout", "レイアウトを整える", "縦並びや横並びを使って画面を整えます。"),
      main("html-css-service-top", "サービス風トップページを組む", "ヘッダー、カード、ボタンを組み合わせてトップページを作ります。"),
      challenge("html-css-nav", "ナビゲーションを追加する", "ページ上部に移動用のリンクを置くChallengeです。", "html-css-link-image", 1, 1),
      challenge("html-css-responsive", "スマホでも見やすい画面を考える", "画面幅が変わったときの見え方を考えるChallengeです。", "html-css-layout", -1, 1),
      challenge("html-css-reservation-top", "予約サイトのトップページを整える", "予約サイトらしい見た目に整えるChallengeです。", "html-css-service-top", 1, 2),
      challenge("html-css-theme", "自分のテーマに置き換える", "文言や色を自分の題材へ置き換えるChallengeです。", "html-css-service-top", -1, 2),
    ],
  },
  {
    id: "course-python-input",
    title: "PythonでWebの入力を扱う",
    description:
      "Webアプリで必要なPythonの最小知識を学び、フォーム入力をサーバ側で受け取って画面に反映します。",
    difficulty: CourseDifficulty.NORMAL,
    categories: [CourseCategoryType.TOOL],
    missions: [
      main("python-web-range", "Webで使うPythonの範囲を知る", "Webアプリで使うPython文法を必要な範囲に絞って確認します。", CourseDifficulty.NORMAL),
      main("python-if", "ifで処理を分ける", "入力内容に応じて表示や処理を変える考え方を学びます。", CourseDifficulty.NORMAL),
      main("python-list-dict", "listとdictでデータを扱う", "複数データや1件のデータを扱う基本を確認します。", CourseDifficulty.NORMAL),
      main("python-form-basic", "formの基本を知る", "form、input、button、name属性の役割を理解します。", CourseDifficulty.NORMAL),
      main("python-post", "POSTで入力を送る", "フォーム入力がサーバへ送られる流れを理解します。", CourseDifficulty.NORMAL),
      main("python-request-form", "Flaskで入力を受け取る", "request.formで入力値を受け取る考え方を学びます。", CourseDifficulty.NORMAL),
      main("python-output-result", "入力結果を画面に返す", "受け取った値をテンプレートへ渡して表示します。", CourseDifficulty.NORMAL),
      main("python-mini-diagnosis", "小さな診断アプリを作る", "入力、条件分岐、結果表示を組み合わせます。", CourseDifficulty.NORMAL),
      challenge("python-validation", "入力チェックを追加する", "空欄などの入力ミスに対応するChallengeです。", "python-request-form", 1, 1),
      challenge("python-multiple-form", "複数項目のフォームを作る", "名前や日付など複数の入力を扱うChallengeです。", "python-output-result", -1, 1),
      challenge("python-result-pattern", "結果メッセージを複数パターンにする", "入力内容に応じて結果を変えるChallengeです。", "python-mini-diagnosis", 1, 2),
    ],
  },
  {
    id: "course-database",
    title: "データを保存して使う",
    description:
      "DBを使ってフォーム入力を保存し、保存したデータを一覧表示するWebアプリの基本を学びます。",
    difficulty: CourseDifficulty.NORMAL,
    categories: [CourseCategoryType.DATA, CourseCategoryType.TOOL],
    missions: [
      main("database-why", "DBが必要な理由を知る", "画面を閉じても残したいデータを保存する必要性を理解します。", CourseDifficulty.NORMAL),
      main("database-table-row-column", "テーブル・行・列を知る", "予約表を例にDBの基本用語を学びます。", CourseDifficulty.NORMAL),
      main("database-fields", "保存する項目を決める", "予約アプリに必要な入力項目と保存項目を整理します。", CourseDifficulty.NORMAL),
      main("database-model", "モデルの考え方を知る", "アプリ内で扱うデータの形を決める考え方を学びます。", CourseDifficulty.NORMAL),
      main("database-create", "入力データを保存する", "フォームから受け取った値をDBへ登録する流れを理解します。", CourseDifficulty.NORMAL),
      main("database-read", "保存したデータを取り出す", "DBから複数データを取得して画面へ渡します。", CourseDifficulty.NORMAL),
      main("database-list-view", "一覧画面を作る", "保存した予約を表やカードで一覧表示します。", CourseDifficulty.NORMAL),
      main("database-reservation-flow", "予約サイトの基本形を説明する", "入力、保存、一覧表示の流れをまとめます。", CourseDifficulty.NORMAL),
      challenge("database-delete", "予約を削除する", "保存済みデータを削除するChallengeです。", "database-list-view", 1, 1),
      challenge("database-update", "予約を更新する", "保存済みデータを編集するChallengeです。", "database-list-view", -1, 1),
      challenge("database-filter", "条件で絞り込む", "日付や名前でデータを絞り込むChallengeです。", "database-read", 1, 2),
      challenge("database-design", "DB設計を少し改善する", "必要な列と不要な列を判断するChallengeです。", "database-reservation-flow", -1, 2),
    ],
  },
  {
    id: "course-api-ai",
    title: "APIとAIを使う",
    description:
      "外部サービスと連携する考え方を学び、API・JSON・AIをWebアプリの機能として使う流れを理解します。",
    difficulty: CourseDifficulty.NORMAL,
    categories: [CourseCategoryType.TOOL, CourseCategoryType.DATA],
    missions: [
      main("api-what", "APIとは何かを知る", "外部サービスに処理を依頼する入口としてAPIを理解します。", CourseDifficulty.NORMAL),
      main("api-request-response", "リクエストとレスポンスを復習する", "API通信でもお願いと返事の流れがあることを確認します。", CourseDifficulty.NORMAL),
      main("api-json", "JSONを読む", "keyとvalueを見て、画面に表示したい値を選びます。", CourseDifficulty.NORMAL),
      main("api-render-result", "APIの結果を画面に表示する", "返ってきた値をHTMLへ表示する流れを学びます。", CourseDifficulty.NORMAL),
      main("ai-input", "AIに送る情報を考える", "ユーザー入力と指示文をAIへ送る考え方を学びます。", CourseDifficulty.NORMAL),
      main("ai-output", "AIの返答を画面に表示する", "AIの返答を見やすく画面に表示します。", CourseDifficulty.NORMAL),
      main("api-key-security", "APIキーと安全性を知る", "APIキーをフロントに置かない理由を理解します。", CourseDifficulty.NORMAL),
      challenge("ai-prompt", "プロンプトで結果を変える", "AIへの指示文で返答が変わることを学ぶChallengeです。", "ai-output", 1, 1),
      challenge("api-error-ui", "API失敗時の表示を考える", "APIが失敗したときにユーザーへ伝えるChallengeです。", "api-render-result", -1, 1),
      challenge("ai-create-idea", "AIを使うアプリ案を考える", "AIが価値を出しやすい場面を考えるChallengeです。", "api-key-security", 1, 2),
    ],
  },
  {
    id: "course-auth-user",
    title: "ユーザー機能を作る",
    description:
      "ログインが必要な理由、ライブラリを使う理由、ユーザーごとにデータを分ける考え方を理解します。",
    difficulty: CourseDifficulty.NORMAL,
    categories: [CourseCategoryType.TOOL, CourseCategoryType.DATA],
    missions: [
      main("auth-why-login", "ログインが必要な理由を知る", "全員のデータが混ざる問題からログインの必要性を理解します。", CourseDifficulty.NORMAL),
      main("auth-authz", "認証と認可をざっくり区別する", "誰かを確認することと、何をしてよいか確認することを分けます。", CourseDifficulty.NORMAL),
      main("auth-library", "ライブラリを使う理由を知る", "ログイン機能を全部自作しない理由を理解します。", CourseDifficulty.NORMAL),
      main("auth-login-form", "ログイン画面の部品を知る", "メール、パスワード、送信ボタン、エラー表示を確認します。", CourseDifficulty.NORMAL),
      main("auth-state-view", "ログイン状態で表示を変える", "ログイン前後で画面に出す内容を変えます。", CourseDifficulty.NORMAL),
      main("auth-user-data", "ユーザーごとにデータを分ける", "user_idを使って自分のデータだけ扱う考え方を学びます。", CourseDifficulty.NORMAL),
      challenge("auth-logout", "ログアウト導線を作る", "ログイン後にログアウトできる導線を考えるChallengeです。", "auth-state-view", 1, 1),
      challenge("auth-own-data", "自分の予約だけ表示する", "user_idでデータを分けるChallengeです。", "auth-user-data", -1, 1),
      challenge("auth-error-message", "エラーメッセージを改善する", "ログイン失敗時の伝え方を考えるChallengeです。", "auth-login-form", 1, 2),
    ],
  },
  {
    id: "course-app-planning",
    title: "自分のアプリを企画する",
    description:
      "まだアプリ案がない状態から、身近な困りごとや興味をもとに企画を出し、制作タスクへ分解します。",
    difficulty: CourseDifficulty.EASY,
    categories: [CourseCategoryType.TOOL],
    missions: [
      main("planning-problems", "身近な困りごとを集める", "学生生活、授業、部活、アルバイトからアプリ化しやすい困りごとを探します。"),
      main("planning-user", "誰のためのアプリか考える", "ユーザー、場面、目的を分けて企画を整理します。"),
      main("planning-minimum-feature", "最小機能を決める", "最初から全部作らず、まず作るべき1機能を選びます。"),
      main("planning-screens", "画面を洗い出す", "トップ、入力、一覧、詳細など必要な画面を考えます。"),
      main("planning-input-data", "入力と保存データを決める", "フォーム項目とDB項目を対応づけます。"),
      main("planning-process-api", "処理と外部連携を考える", "条件分岐、検索、通知、AI/APIを入れるか考えます。"),
      main("planning-tasks", "制作タスクへ分解する", "フロント、バック、DB、AI/APIに作業を分けます。"),
      challenge("planning-observe", "似たアプリを観察する", "既存アプリから参考になる機能を見つけるChallengeです。", "planning-user", 1, 1),
      challenge("planning-team", "チーム制作の役割分担を考える", "UI、サーバ、DBなどの作業を分けるChallengeです。", "planning-tasks", -1, 1),
      challenge("planning-ai-api", "AI/APIを使う発展案を考える", "企画にAI/APIを入れる価値があるか考えるChallengeです。", "planning-process-api", 1, 2),
    ],
  },
];

export const learningSeed = {
  courses: courseSpecs.map(buildCourse),
};
