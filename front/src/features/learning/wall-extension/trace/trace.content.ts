export const wallExtensionTraceText = {
  button: "盤面で動きを見る", resultButton: "盤面で動きを見る",
  loading: "基本の盤面で自分のコードを実行しています。",
  close: "動きの表示を閉じる", dialog: "自分のコードの動き（基本の盤面）",
  variables: "実行中の変数", line: "観測行", size: "size", choices: "choices", walls: "壁の数", unset: "—",
  unsupported: "このコードの動きは再生できませんでした。結果だけを表示します",
  timeout: "実行がタイムアウトしました。取得できた状態はありません。",
  unavailable: "実行環境を読み込めませんでした。もう一度試してください。",
  truncated: "ステップが多すぎるため、途中まで表示します。",
  partial: "変換できない状態があるため、途中まで表示します。",
  ended: "実行が終わりました。",
  final: "実行の最終状態を表示しています。",
  setup: "盤面を用意しました。",
  border: "外側を壁で囲んでいます。",
  pillars: "2マスおきに柱を立てています。",
  extend: "柱から{direction}へ壁を伸ばしました。",
  changed: "盤面が変わりました。",
  stopped: "{line}行目で{kind}が起き、実行が止まりました。",
  stoppedUnknown: "{kind}が起き、実行が止まりました。",
} as const;

export const wallExtensionTraceDirectionNames = {
  up: "上", down: "下", left: "左", right: "右",
} as const;
