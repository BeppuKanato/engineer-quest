export const mazeDiggingTraceText = {
  button: "盤面で掘る様子を見る", resultButton: "盤面で掘る様子を見る",
  loading: "基本の盤面で自分のコードを実行しています。",
  close: "掘る様子の表示を閉じる", dialog: "自分のコードの掘る様子（基本の盤面）",
  variables: "実行中の変数", line: "観測行", size: "size", choices: "choices", walls: "壁の数", unset: "—",
  unsupported: "このコードの掘る様子は再生できませんでした。結果だけを表示します",
  timeout: "実行がタイムアウトしました。取得できた状態はありません。",
  unavailable: "実行環境を読み込めませんでした。もう一度試してください。",
  truncated: "ステップが多すぎるため、途中まで表示します。",
  partial: "変換できない状態があるため、途中まで表示します。",
  ended: "実行が終わりました。",
  final: "実行の最終状態を表示しています。",
  setup: "全部が壁の盤面を用意しました。",
  dig: "{from} から{direction}へ掘りました。",
  firstRoom: "{room} の部屋を掘りました。",
  backtrack: "行き止まりになったので、掘れる部屋がある {room} まで戻りました。",
  changed: "盤面が変わりました。",
  stopped: "{line}行目で{kind}が起き、実行が止まりました。",
  stoppedUnknown: "{kind}が起き、実行が止まりました。",
} as const;

export const mazeDiggingTraceDirectionNames = {
  up: "上", down: "下", left: "左", right: "右",
} as const;
