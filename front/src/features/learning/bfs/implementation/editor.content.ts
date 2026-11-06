export const bfsEditorText = {
  code: "Pythonコード", panel: "実行とテスト", testsTab: "テスト", consoleTab: "コンソール", hints: "ヒント",
  hintNames: ["使う部品", "処理の流れ", "条件とループ", "並び替え"],
  freeRun: "試しに実行", freeTitle: "基本グラフで試しに実行",
  input: "基本グラフ（出発点A）で実行します。", stdout: "printの出力", returned: "戻り値（距離）",
  empty: "試しに実行でprintの出力と戻り値を確認できます。", noOutput: "出力はありません。",
  preparing: "試し実行の準備をしています。", running: "基本グラフで試し実行中です。",
  success: "基本グラフの結果が期待値と一致しました。", nonGrading: "試し実行はテストの通過数・実行回数には含みません。",
  truncated: "出力が長いため、先頭{limit}文字まで表示しています。",
  errors: {
    syntax: "文法エラーのため実行できませんでした。",
    runtime: "実行の途中でエラーが起きました。",
    mismatch: "実行はできていますが、結果が期待と違います。",
    timeout: "実行が終わりませんでした（無限ループの可能性があります）。",
    unavailable: "Python実行環境を読み込めませんでした。再読込して試してください。",
  },
} as const;
