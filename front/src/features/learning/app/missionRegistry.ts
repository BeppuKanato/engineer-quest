// 目標ミッションの下書き（2026-11-22 の再設計方針にもとづく）。
// 文言・成功条件はまだ決まっていない。単元画面とミッション提示の下書きで
// Kanato が見て直すための仮の文面で、実装の仕様ではない。
export type UnitMission = {
  courseId: string;
  /** ミッションの題。学習の目的そのもの。 */
  title: string;
  /** どういう課題か。1〜2文。 */
  description: string;
  /** 何をもって達成か。1行。 */
  successCondition: string;
};

export const unitMissions: Record<string, UnitMission> = {
  "course-algorithm-breadth-first-search-v1": {
    courseId: "course-algorithm-breadth-first-search-v1",
    title: "配送ロボットを最短経路で届ける",
    description: "倉庫の中を、荷物を積んだロボットが走る。通る道の本数がいちばん少なくなる行き方で、目的地まで届けよう。",
    successCondition: "通る道の本数が最小のとき達成",
  },
  "course-algorithm-depth-first-search-v1": {
    courseId: "course-algorithm-depth-first-search-v1",
    title: "迷路を抜けて出口にたどり着く",
    description: "分かれ道では、一本の道を奥まで進む。行き止まりなら戻って、別の道を試す。出口までたどり着こう。",
    successCondition: "出口にたどり着いたとき達成",
  },
  "course-algorithm-binary-search-v1": {
    courseId: "course-algorithm-binary-search-v1",
    title: "ほしい商品を少ない回数で見つける",
    description: "商品が何十個も並んでいる。1つずつ確認していたら、目当ての商品にたどり着くまで時間がかかりすぎる。範囲を半分ずつ絞って、少ない回数で見つけよう。",
    successCondition: "範囲を正しく狭めて、目的の商品を見つけたとき達成",
  },
  "course-algorithm-maze-digging-v1": {
    courseId: "course-algorithm-maze-digging-v1",
    title: "壁を掘って、つながる迷路を作る",
    description: "壁の塊から通路を掘り進める。行き止まりになったら戻って、別の場所を掘ろう。",
    successCondition: "全部のマスが通路でつながったとき達成",
  },
  "course-algorithm-wall-extension-v1": {
    courseId: "course-algorithm-wall-extension-v1",
    title: "柱から壁を伸ばして迷路を作る",
    description: "等間隔に立てた柱から、決まった規則で壁を伸ばす。規則どおりに伸ばして、迷路を完成させよう。",
    successCondition: "すべての柱から壁を伸ばし終えたとき達成",
  },
  "course-algorithm-bubble-sort-v2": {
    courseId: "course-algorithm-bubble-sort-v2",
    title: "本を番号順に並べ替える",
    description: "バラバラに並んだ本を番号順に並べ替えて、探したい本がすぐ見つかる棚にしよう。",
    successCondition: "全部の本が番号順に並んだとき達成",
  },
  "course-algorithm-greedy-coins-v1": {
    courseId: "course-algorithm-greedy-coins-v1",
    title: "お釣りを硬貨の枚数最小で払う",
    description: "金額に合わせて、そのつど使える一番大きい硬貨を選ぶ。硬貨の合計枚数をいちばん少なく払おう。",
    successCondition: "硬貨の合計枚数が最小のとき達成",
  },
};

export const findUnitMission = (courseId: string): UnitMission | undefined => unitMissions[courseId];

// 発展ミッションとの接続（2026-11-25決定）：単元画面では波マップの下に、この単元で開く
// 発展ミッションのセクションを出す。対応付けの正本は Issue #507 の導線の節。
// 状態（ready・自己ベスト）は発展ミッション側のデータを正とする（一覧と一致させる）。
export type DevelopmentMissionLink = {
  missionId: string;
  title: string;
  /** ノードの下に出す状態（挑戦できる／この単元を終えると挑戦できる、など）。 */
  status: string;
  ready: boolean;
};

export const developmentLinks: Record<string, DevelopmentMissionLink[]> = {
  "course-algorithm-breadth-first-search-v1": [
    { missionId: "dungeon-escape", title: "ダンジョンの最短脱出", status: "挑戦できる", ready: true },
  ],
  "course-algorithm-depth-first-search-v1": [
    { missionId: "island-count", title: "島の数を数える", status: "挑戦できる", ready: true },
  ],
  "course-algorithm-binary-search-v1": [
    { missionId: "first-broken-version", title: "バグが入った版を特定する", status: "この単元を終えると挑戦できる", ready: false },
  ],
};

export const findDevelopmentLinks = (courseId: string): DevelopmentMissionLink[] => developmentLinks[courseId] ?? [];
