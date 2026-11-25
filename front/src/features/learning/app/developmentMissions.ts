// 発展ミッションの教材データ（2026-11-25、Issue #507）。課題・解放条件・スコア基準値・関連カードの正本。
// 解放の判定と自己ベストは実行時に API から決める（ここには持たない）。
// スコア: 答えと一緒に出力する操作回数から、基準値2点（理論最小／単純解法の想定）で
// 1000点満点に換算する。ランク閾値は暫定（実データで調整する）。

export type DevMissionTest = {
  id: string;
  label: string;
  input: string;
  /** 1行目（答え）の期待値。 */
  expectedAnswer: string;
  /** スコア計測ケースか。 */
  scoring?: boolean;
};

export type DevMission = {
  id: string;
  title: string;
  /** 課題（何を解決するか）。解法は指定しない。 */
  problem: string;
  successCondition: string;
  /** 解放条件の表示名（対応する単元）。 */
  unlockUnitName: string;
  /** 解放条件の単元（このコースを完了すると解放）。 */
  unlockCourseId: string;
  statement: {
    inputFormat: string;
    outputFormat: string;
    conditions: string[];
  };
  /** 入力の見方（図解）：文章を読まなくても、記号の意味と入力の形が分かるようにする。 */
  inputVisual:
    | { kind: "grid"; firstLine: string; rows: string[]; legend: { mark: string; label: string; bg: string; fg: string }[] }
    | { kind: "versions"; firstLine: string; states: number[]; legend: { mark: string; label: string; bg: string; fg: string }[] };
  /** 出力の例（行ごとに意味の注記つき）。 */
  outputExample: { value: string; label: string }[];
  /** 例の地図の上で「通る経路」と「調べた範囲」の違いを示す図解（ある場合）。座標は [行, 列]。 */
  exampleTrace?: { pathCells: Array<[number, number]>; examinedCells: Array<[number, number]> };
  /** スコアで数える量の名前（例：調べた部屋数）。 */
  countLabel: string;
  scoring: { best: number; plain: number };
  tests: DevMissionTest[];
  hints: string[];
  /** 関連する知識カードの id（対応データ。旧作るクエスト対応からの付け替え＋新規）。 */
  relatedCardIds: string[];
  starterCode: string;
};

export const rankThresholds = [
  { rank: "S", min: 950 },
  { rank: "A", min: 800 },
  { rank: "B", min: 550 },
  { rank: "C", min: 300 },
] as const;

export const rankForPoints = (points: number): string =>
  rankThresholds.find((t) => points >= t.min)?.rank ?? "C";

export const pointsForCount = (count: number, scoring: { best: number; plain: number }): number => {
  if (count <= scoring.best) return 1000;
  const ratio = (scoring.plain - count) / (scoring.plain - scoring.best);
  return Math.max(300, Math.min(1000, Math.round(300 + 700 * ratio)));
};

/** 次のランクと、そこまでの点数。S なら null。 */
export const nextRank = (points: number): { rank: string; min: number } | null => {
  const sorted = [...rankThresholds].sort((a, b) => a.min - b.min);
  return sorted.find((t) => points < t.min) ?? null;
};


const dungeonScoringInput = ["7 7", "S......", "#......", "#..G...", "#......", "#......", "#......", "#......"].join("\n");
const islandsScoringInput = ["6 6", "##..##", "##....", "..##..", "..##..", "#....#", "##..##"].join("\n");
const brokenScoringInput = ["100", [...Array(36).fill("0"), ...Array(64).fill("1")].join(" ")].join("\n");

export const developmentMissions: DevMission[] = [
  {
    id: "dungeon-escape",
    title: "ダンジョンの最短脱出",
    problem: "部屋と通路でできたダンジョンに閉じ込められた。入口（S）から出口（G）まで、通る部屋数がいちばん少なくなる行き方で脱出したい。",
    successCondition: "最短の経路の部屋数を答え、調べた部屋数を一緒に出力する",
    unlockUnitName: "幅優先探索",
    unlockCourseId: "course-algorithm-breadth-first-search-v1",
    statement: {
      inputFormat: "入力は、1行目に「タテのマス数 ヨコのマス数」、続く行にダンジョンの地図が与えられます。S が入口、G が出口、# が壁、. が通路です。",
      outputFormat: "出力は2行です。1行目に、入口から出口まで最短で進んだときに通る部屋数（入口と出口を含む）を出力してください。出口にたどり着けない場合は -1 を出力してください。2行目に、あなたのプログラムが調べた部屋の数を出力してください。",
      conditions: ["上下左右の4方向にだけ移動できます。壁のマスには入れません。", "調べた部屋数はスコアの計算に使います（答えの正しさとは別に数えます）。"],
    },
    inputVisual: {
      kind: "grid",
      firstLine: "1行目：タテのマス数とヨコのマス数（この例では 5 5）",
      rows: ["S...#", "##.#.", "...#.", ".#...", ".#G.."],
      legend: [
        { mark: "S", label: "入口", bg: "#2563eb", fg: "#ffffff" },
        { mark: "G", label: "出口", bg: "#d97706", fg: "#ffffff" },
        { mark: "#", label: "壁（入れない）", bg: "#5b7186", fg: "#ffffff" },
        { mark: ".", label: "通路", bg: "#e9dcc3", fg: "#111827" },
      ],
    },
    outputExample: [
      { value: "7", label: "最短で通る部屋数（入口と出口を含む）" },
      { value: "10", label: "調べた部屋数（スコアの計算に使う）" },
    ],
    // 実測（キューから取り出した順に数え、出口を取り出した時点で止める）：
    // 経路7マス＋経路の外を調べた3マス＝10マス。
    exampleTrace: {
      pathCells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
      examinedCells: [[0, 3], [2, 1], [3, 3]],
    },
    countLabel: "調べた部屋数",
    // 実測：通常の幅優先探索（出口で打ち切り）=14、双方向探索=8、全探索=43。
    // 学んだ方法そのままだと満点にならないよう、満点側の基準は双方向探索の実測に置く。
    scoring: { best: 8, plain: 26 },
    tests: [
      { id: "d1", label: "基本のダンジョン", input: ["5 5", "S...#", "##.#.", "...#.", ".#...", ".#G.."].join("\n"), expectedAnswer: "7" },
      { id: "d2", label: "出口にたどり着けない", input: ["3 3", "S#.", "##.", "..G"].join("\n"), expectedAnswer: "-1" },
      { id: "d3", label: "広いダンジョン（スコア計測）", input: dungeonScoringInput, expectedAnswer: "6", scoring: true },
    ],
    hints: [
      "出発点から近い部屋の順に調べていくと、最初にゴールへたどり着いた経路が最短になります。",
      "調べた部屋には印を付けて、同じ部屋を二度調べないようにすると、調べる部屋数が減ります。",
      "通る部屋数は、ゴールに着いた時点で「そこまでの移動回数＋1」です。",
    ],
    relatedCardIds: ["knowledge-card-bfs-shortest-path", "knowledge-card-bfs-deque", "knowledge-card-bfs-bidirectional"],
    starterCode: "# ここを書く：地図を受け取り、最短の経路の部屋数と、調べた部屋数を出力するプログラム\n# 入力は複数行で、1行目にタテとヨコのマス数が入っています\n",
  },
  {
    id: "island-count",
    title: "島の数を数える",
    problem: "海に陸地が点々と浮かぶ地図がある。つながっている陸地を1つの島として、島が全部でいくつあるか数えたい。",
    successCondition: "島の数を答え、訪れたマスの数を一緒に出力する",
    unlockUnitName: "深さ優先探索",
    unlockCourseId: "course-algorithm-depth-first-search-v1",
    statement: {
      inputFormat: "入力は、1行目に「タテのマス数 ヨコのマス数」、続く行に地図が与えられます。# が陸地、. が海です。",
      outputFormat: "出力は2行です。1行目に島の数を出力してください。2行目に、あなたのプログラムが訪れたマスの数を出力してください。",
      conditions: ["上下左右でつながっている陸地を1つの島と数えます（斜めはつながりません）。", "訪れたマスの数はスコアの計算に使います（答えの正しさとは別に数えます）。"],
    },
    inputVisual: {
      kind: "grid",
      firstLine: "1行目：タテのマス数とヨコのマス数（この例では 4 5）",
      rows: ["##...", "##.#.", "...#.", ".##.."],
      legend: [
        { mark: "#", label: "陸地", bg: "#7da383", fg: "#ffffff" },
        { mark: ".", label: "海", bg: "#93c5fd", fg: "#111827" },
      ],
    },
    outputExample: [
      { value: "3", label: "島の数" },
      { value: "20", label: "訪れたマスの数（スコアの計算に使う）" },
    ],
    countLabel: "訪れたマス数",
    scoring: { best: 36, plain: 54 },
    tests: [
      { id: "i1", label: "基本の地図", input: ["4 5", "##...", "##.#.", "...#.", ".##.."].join("\n"), expectedAnswer: "3" },
      { id: "i2", label: "陸地がない", input: ["2 3", "...", "..."].join("\n"), expectedAnswer: "0" },
      { id: "i3", label: "広い地図（スコア計測）", input: islandsScoringInput, expectedAnswer: "7", scoring: true },
    ],
    hints: [
      "陸地を見つけたら、つながっている陸地を全部たどって印を付けてから、次の陸地を探すと数え間違いが減ります。",
      "たどるときは、奥まで進んで行き止まったら戻る進み方でも、近い順に広げる進み方でも構いません。",
      "訪れたマス数は、同じマスを何度も数え直すと増えてしまいます。",
    ],
    relatedCardIds: ["knowledge-card-maze-digging-stack", "knowledge-card-maze-digging-backtracking"],
    starterCode: "# ここを書く：地図を受け取り、島の数と、訪れたマスの数を出力するプログラム\n# 入力は複数行で、1行目にタテとヨコのマス数が入っています\n",
  },
  {
    id: "first-broken-version",
    title: "バグが入った版を特定する",
    problem: "ソフトの版（バージョン）が並んでいる。ある版から先は全部バグで壊れている。最初に壊れた版を、できるだけ少ない確認で特定したい。",
    successCondition: "最初に壊れた版の番号を答え、確認した版の数を一緒に出力する",
    unlockUnitName: "二分探索",
    unlockCourseId: "course-algorithm-binary-search-v1",
    statement: {
      inputFormat: "入力は、1行目に版の数 N、2行目に N 個の状態（0 = 正常、1 = 壊れている）が半角スペース区切りで与えられます。壊れた版より後ろは全部壊れています。",
      outputFormat: "出力は2行です。1行目に、最初に壊れた版の番号（1から数える）を出力してください。壊れた版が無い場合は -1 を出力してください。2行目に、あなたのプログラムが確認した版の数を出力してください。",
      conditions: ["確認した版の数はスコアの計算に使います（答えの正しさとは別に数えます）。"],
    },
    inputVisual: {
      kind: "versions",
      firstLine: "1行目：版の数（この例では 8）",
      states: [0, 0, 0, 1, 1, 1, 1, 1],
      legend: [
        { mark: "0", label: "正常", bg: "#ffffff", fg: "#16a34a" },
        { mark: "1", label: "壊れている", bg: "#cbd5e1", fg: "#111827" },
      ],
    },
    outputExample: [
      { value: "4", label: "最初に壊れた版の番号（1から数える）" },
      { value: "3", label: "確認した版の数（スコアの計算に使う）" },
    ],
    countLabel: "確認した版の数",
    scoring: { best: 7, plain: 37 },
    tests: [
      { id: "b1", label: "基本の履歴", input: ["8", "0 0 0 1 1 1 1 1"].join("\n"), expectedAnswer: "4" },
      { id: "b2", label: "壊れた版がない", input: ["5", "0 0 0 0 0"].join("\n"), expectedAnswer: "-1" },
      { id: "b3", label: "版が多い（スコア計測）", input: brokenScoringInput, expectedAnswer: "37", scoring: true },
    ],
    hints: [
      "真ん中の版を1つ確認すると、壊れているかどうかで、探す範囲がどちらか半分になります。",
      "最初に壊れた版は、正常な版の列と壊れた版の列の、ちょうど境目にあります。",
    ],
    relatedCardIds: ["knowledge-card-binary-search-halving-range", "knowledge-card-binary-search-logarithmic-time"],
    starterCode: "# ここを書く：版の状態を受け取り、最初に壊れた版の番号と、確認した版の数を出力するプログラム\n# 入力は2行で、1行目に版の数、2行目に状態が並んでいます\n",
  },
];

export const findDevelopmentMission = (id: string): DevMission | undefined =>
  developmentMissions.find((m) => m.id === id);
