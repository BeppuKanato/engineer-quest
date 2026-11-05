# BFS フェーズ7「自力実装」

- 目的: Issue #75 の自由記述・5テスト・段階式ヒント・全通過リザルトを単品で操作する。
- 適用範囲: フェーズ7のフロントエンド・教材データ・検証。状態: 現行（PR #99レビューに基づく4段階ヒントの試行版）。最終確認日: 2026-11-05。
- 起点: `develop` `262cc2b`、レビュー修正の起点: `feat/bfs-implementation-75` `cc93757`。
- 正本: [Issue #75](https://github.com/BeppuKanato/engineer-quest/issues/75)、[PR #99](https://github.com/BeppuKanato/engineer-quest/pull/99)、[教材指針 §1・フェーズ7](../../../../../../docs/concept/learning-materials-guideline.md)、[UI定義](../../../../../../docs/concept/learning-player-ui.md)。今回の明示的な修正依頼を指針の3段階ヒント・常時チップ・差分表示に優先する。
- 確認画像・検証結果: [実装報告](../../../../../../docs/bfs-implementation-75.md)。

## 起動・操作

`front/`で`npm ci` → `npm run dev`。起動したマシンで`http://localhost:3000/learning-preview/bfs-implementation`を開く。ログイン・バックエンド・DB不要。
production buildは`npm run build`後に`node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000`。
クラウドのlocalhostは手元PCから直接開ける共有URLではない。

1. MonacoとPyodideの読込を待つ。dequeのimport・関数定義・コメント・passの骨組みからコードを書く。
2. 「実行する」で全5ケースを順に実行する。通過数を常時表示し、実行中は現在のn/5件目と「各テストは最大15秒、タイムアウト後も続行」を表示する。
3. 結果一覧はラベルとアイコン＋通過／未通過／未実行を表示する。表示用は入力の小さいグラフ・出発点、期待と実際の距離の並びを表示し、値違い・不足・余分な項目を文言と下線で示す。
4. エラー種別は結果欄へ常時併記する。文法エラー・実行時エラー・タイムアウト・結果不一致を区別し、未実行時は出さない。判定用は種別・合否だけを表示する。
5. ヒントは1→2→3→4の順に解放し、開くたびにそのレベルの利用回数を増やす。エディタ下の常時チップは置かない。
6. 全5ケース通過で称号・通過数・実行回数・4レベル別ヒント回数・単元完了文を表示する。実行回数の上限はなく、次フェーズへ接続するボタンはない。
7. 再読込で初期化する。保存・ログ送信はない。

エディタのテーマ・文字サイズ・枠と配置は今回変更しない。84vw × 84dvh、Monacoのlightテーマ、16px。狭い画面は枠内を縦スクロールし、操作は下部に残す。

## データと結果表示

`implementation.content.ts`に骨組み・テスト・表示用のグラフ参照・各ヒント・ラベル・文言を分離する。テストのグラフ・期待値・骨組みは初回実装から変更していない。

| 内部ID（画面には出さない） | 表示 | 条件・期待値 |
| --- | --- | --- |
| D1 | 図・出発点・期待と実際の距離 | 基準グラフ、A開始。A=0、B/C=1、D/E=2、F=3 |
| D2 | 図・出発点・期待と実際の距離 | G〜L、G開始。G=0、H/I=1、J/K=2、L=3 |
| J1 | 種別・合否のみ | D1＋孤立Z。期待値にZなし |
| J2 | 種別・合否のみ | Aだけ。A=0 |
| J3 | 種別・合否のみ | A→B、Bの隣接情報未登録。A=0、B=1 |

D1の図は`bfsGraph`、D2はフェーズ6の`transferGraph`そのものを参照する。既存`ConsolidationGraph`を小さい枠で使い、共通描画・色・座標・比率は変えない。既存部品へ任意の`minHeight`を加え、フェーズ6の既定値320は維持する。
距離は「A：0歩」の形で並べる。実際の項目を期待値とキー単位で照合し、値違いには期待値、不足には「項目なし」、余分なキーには「余分な項目」を示す。辞書以外の戻り値や数値以外の距離も区別する。

`preparePyodide`／`runCourseMissionTests`を使い、1件ずつ実行して例外後も後続ケースを試す。15秒タイムアウトとWorker再生成は既存基盤に委ねる。専用のタイムアウト例外文と完全一致する場合だけ、新設のtimeout種別にする。
画面へ渡す状態はID・合否・エラー種別と、表示用だけの実際の出力。判定用の値・stdout／stderr・生の例外文は表示しない。編集で表示中の結果をクリアしても、結果欄のエラー種別は直近の実行結果を参照する。

## 試行版の4段階ヒント

| レベル | 内容 |
| --- | --- |
| 1「使う部品を見る」 | distancesとqueueの説明、指定14トークン。選ぶと閉じて現在のカーソル／選択範囲へ挿入し、エディタへフォーカスを戻す。Undo可能 |
| 2「処理の流れを見る」 | 初期化、先頭取り出し、隣の未発見判定と距離記録・追加、反復と返却の番号付き4項目 |
| 3「条件とループの骨格を見る」 | `bfsCode`の意味ID`while-queue`／`for-neighbor`／`if-undiscovered`から元の3行を取得。本文・インデントを書き直さず、取り出し・代入・追加・returnは見せない |
| 4「並び替えで確認する」 | フェーズ6の設問と既存ParsonsBoardを`onAnswer`なしで表示。ドラッグ・上下移動・提示順リセットのみ、採点しない |

差分ヒントとその実装は削除した。ただし`diff`パッケージは既存の`course-exam/codeTranscriptionEditor.tsx`で利用中のため、package.json・lockfileから削除しない。今回の教材はこの依存を使わない。
正本`bfsCode`の本文・意味ID・version、フェーズ6の設問・採点は変更しない。

## 検証

`front/`で以下を実行する。Python構文と正解確認に`python3`を使う。

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:learning-player
npm run verify:bfs-motivation
npm run verify:bfs-execution
npm run verify:bfs-check
npm run verify:bfs-code-mapping
npm run verify:bfs-code-check
npm run verify:bfs-consolidation
npm run verify:bfs-implementation
```

新verifyは全5ケースの独立BFSと指定入力、テンプレート、ヒント1の14トークン、骨格3行のIDと参照同一性、4段階の解放・回数、差分実装の不在、既存diff利用の保持、図とテストの一致、距離の値違い・不足・余分、タイムアウト分類・進捗文言、判定用非表示、全通過条件、例外後続・キャンセルを確認する。
実ブラウザのPython実行と画像・環境制約は実装報告に記載する。

視覚的デバッグはIssue #76で追加した「自分のコードの動きを見る」から利用できる。D1限定のトレース・対応範囲・操作は[trace README](../trace/README.md)を参照する。採点回数・ヒント回数はトレースで変更しない。

DB適用なし。アプリ組み込み・Mission/Activity・進捗／ログ保存・フェーズ接続・printコンソール・エディタ改善は対象外。
