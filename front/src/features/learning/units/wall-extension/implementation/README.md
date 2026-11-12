# 棒倒し法「自分で実装」

- 目的・適用範囲: Issue #212の自由記述課題 `generate_maze(size, choices)`（表示用2件＋判定用3件、全通過が完了条件のハードゲート）と段階式ヒント4段、D1専用の試しに実行を単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [棒倒し法基準データ§2・§3](../../../../../../../docs/concept/wall-extension-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/wall-extension-phase7-212.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/wall-extension-implementation を開く。認証・DBは不要。

| 内部ID（画面には出さない） | 表示 | 入力・期待値 |
| --- | --- | --- |
| D1 | 入力・期待する迷路・実際の迷路 | 9×9、choices [3,1,2,0,2,0,2,2,0]（主教材）。期待する迷路はフェーズ2の完成盤面と同じ |
| D2 | 入力・期待する迷路・実際の迷路 | 7×7、choices [1,2,2,0]（応用問題の迷路） |
| J1 | 種別・合否のみ | 9×9、choices [0,3,1,2,0,1,1,0,2] の完全一致 |
| J2 | 種別・合否のみ | 7×7、choices [0,1,1,2] の完全一致 |
| J3 | 種別・合否のみ | 11×11、choices 16件の完全一致（期待グリッドが完全迷路の性質を満たすことは検証で示す） |

- 期待グリッドは盤面データの正本 `wallExtensionMaze` の組み立て（外周＋柱＋伸長）から導き、フェーズ1〜6の盤面とずらさない。判定は既存の教材テスト基盤（Worker 内の完全一致）で行い、カスタム検証の差し込み口は無いため、J3 も固定 choices の完全一致とした（基準データの性質検証との関係は実施記録の留保に明記）。
- テスト結果は表示用だけ入力・期待する迷路・実際の迷路を示す。実際の迷路は期待と違うマスをフォーカス青の枠で示し、件数を併記する。判定用の値・標準出力・生の例外は画面状態へ渡さない。
- 試しに実行は D1 だけを Worker を作り直して実行し、戻り値の迷路を盤面で示す。通過数・実行回数・完了判定は変えない。
- ヒントは1→2→3→4の順に解放する。レベル3の骨格は参照コード（契約 wall-extension-v1）の意味ID `for-pillar-row`／`for-pillar-column`／`if-first-row` の3行を原文のまま示し、レベル4はフェーズ6の Parsons 盤面を同じ `ParsonsBoard` で練習モード表示する（採点しない）。
- 視覚デバッグ（学習者の生成過程のステップ表示）は Issue #213 で `../trace/` に実装し、この画面の「盤面で動きを見る」から接続した（詳細は `../trace/README.md`）。

ファイル:

- `implementation.content.ts`: 課題文・テンプレート・5テスト・ヒント・表示文言と、フェーズ6 Parsons 設問／参照コード骨格行への参照。
- `implementation.ts`: テスト実行（1件ずつ、例外後も続行、判定用の秘匿）、エラー種別の分類、ヒント利用回数の記録、盤面の値判定・描画用 Canvas 変換・期待との差分列挙、単元接続用の要約型。
- `WallExtensionImplementationPreview.tsx`: エディタ（ライトテーマ＋フォーカス色2px枠＋「Pythonコード」見出し）、テスト／コンソールのタブ、ヒント導線、全通過時の完了表示（紙吹雪と大きな描画チェック）。
- `ImplementationResults.tsx` / `MazeGridOutput.tsx` / `FreeExecutionConsole.tsx` / `ImplementationHints.tsx` / `freeExecution.ts` / `editor.content.ts` / `editor.tokens.ts`: 結果表示、戻り値の盤面表示、試しに実行のコンソール、ヒントダイアログ、D1専用フリー実行、画面文言、エディタ専用トークン。

検証: `npm run verify:wall-extension-implementation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
