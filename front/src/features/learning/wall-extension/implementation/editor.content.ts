export const wallExtensionEditorText = {
  code: "Pythonコード", panel: "実行とテスト", testsTab: "テスト", consoleTab: "コンソール", hints: "ヒント",
  hintNames: ["使う部品", "処理の流れ", "条件とループ", "並び替え"],
  freeRun: "試しに実行", freeTitle: "主教材で試しに実行",
  input: "主教材の9×9（方向の番号は動きの説明と同じ）で実行します。", stdout: "printの出力", returned: "戻り値（迷路）",
  empty: "試しに実行でprintの出力と作られた迷路を確認できます。", noOutput: "出力はありません。",
  preparing: "試し実行の準備をしています。", running: "主教材で試し実行中です。",
  success: "主教材の結果が期待する迷路と一致しました。", nonGrading: "試し実行はテストの通過数・実行回数には含みません。",
  truncated: "出力が長いため、先頭{limit}文字まで表示しています。",
  errors: {
    syntax: "文法エラーのため実行できませんでした。",
    runtime: "実行の途中でエラーが起きました。",
    mismatch: "実行はできていますが、結果が期待と違います。",
    timeout: "実行が終わりませんでした（無限ループの可能性があります）。",
    unavailable: "Python実行環境を読み込めませんでした。再読込して試してください。",
  },
  errorLineSuffix: "（{line}行目付近）",
  syntaxNote: "プログラム全体に文法エラーがあると、print を含め1行も実行されません。",
} as const;
