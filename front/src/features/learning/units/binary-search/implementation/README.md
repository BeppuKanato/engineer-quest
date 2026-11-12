# 二分探索「自分で実装」

- 目的・適用範囲: Issue #292の自由記述課題 `binary_search(values, target)`（表示用1件＋判定用3件、全通過が完了条件のハードゲート）と段階式ヒント4段、D1専用の試しに実行を単品で操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [二分探索基準データ§2・§3](../../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/binary-search-phase7-292.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-implementation を開く。認証・DBは不要。

| 内部ID（画面には出さない） | 表示 | 入力・期待値 |
| --- | --- | --- |
| D1 | 入力・期待する位置・実際の位置 | [3, 7, 12, 19, 25, 31, 42] から 25 → 位置 4（主教材） |
| J1 | 種別・合否のみ | 主教材と同じ入力 → 位置 4 の完全一致 |
| J2 | 種別・合否のみ | 転移リスト [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] から 23 → 位置 5 の完全一致 |
| J3 | 種別・合否のみ | 主教材のリストで 20 → -1（不在）の完全一致 |

- 期待する位置は教材データの正本 `binarySearch` の実行記録（参照コードと同じ手順）から導き、フェーズ1〜6の教材とずらさない。判定は既存の教材テスト基盤（Worker 内の完全一致）で行う。契約どおり関数は入力を変更しない（読み取りのみ）ため、入力不変の検出は不要（基準データ §2）。
- テスト結果は表示用だけ入力・期待する位置・実際の位置を示す。実際の位置はリストの図（該当セルを処理中の青＋強調リング）と言葉の数値を併記し、-1 は「見つかりませんでした」と示す。判定用の値・標準出力・生の例外は画面状態へ渡さない。
- 試しに実行は D1 だけを Worker を作り直して実行し、戻り値の位置を図で示す。通過数・実行回数・完了判定は変えない。
- ヒントは1→2→3→4の順に解放する。レベル3の骨格は参照コード（契約 binary-search-v1）の意味ID `while-range`／`if-hit`／`elif-smaller`／`else-larger` の4行（while の条件と比較の3分岐）を原文のまま示し、レベル4はフェーズ6の Parsons 盤面を同じ `ParsonsBoard` で練習モード表示する（採点しない）。
- 視覚デバッグ（「範囲が狭まる様子を見る」）は Issue #293 の対象で、このモジュールにはまだ接続していない。

ファイル:

- `implementation.content.ts`: 課題文・テンプレート・4テスト・ヒント・表示文言と、フェーズ6 Parsons 設問／参照コード骨格行への参照。
- `implementation.ts`: テスト実行（1件ずつ、例外後も続行、判定用の秘匿）、エラー種別の分類、ヒント利用回数の記録、位置の値判定・描画用 Canvas 変換、単元接続用の要約型。
- `BinarySearchImplementationPreview.tsx`: エディタ（ライトテーマ＋フォーカス色2px枠＋「Pythonコード」見出し）、テスト／コンソールのタブ、ヒント導線、全通過時の完了表示（紙吹雪と大きな描画チェック）。
- `ImplementationResults.tsx` / `IndexOutput.tsx` / `FreeExecutionConsole.tsx` / `ImplementationHints.tsx` / `freeExecution.ts` / `editor.content.ts` / `editor.tokens.ts`: 結果表示、戻り値の位置表示、試しに実行のコンソール、ヒントダイアログ、D1専用フリー実行、画面文言、エディタ専用トークン。

検証: `npm run verify:binary-search-implementation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
