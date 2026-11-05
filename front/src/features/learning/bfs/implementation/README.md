# BFS フェーズ7「自力実装」

- 目的: Issue #75 の骨組み付き自由記述、Pyodideによる5ケースの判定、3段階ヒント、全通過リザルトを単品で操作する。
- 適用範囲: フェーズ7のフロントエンド・教材データ・検証。状態: 現行。最終確認日: 2026-11-05。
- 起点: `develop` `262cc2b`（PR #98 マージ済み）。
- 正本: [Issue #75](https://github.com/BeppuKanato/engineer-quest/issues/75)、[教材指針 §1・フェーズ7](../../../../../../docs/concept/learning-materials-guideline.md)、[UI定義](../../../../../../docs/concept/learning-player-ui.md)、[要約](../../../../../../docs/concept/learning-materials-v2.md)。
- 確認画像・検証結果: [実装報告](../../../../../../docs/bfs-implementation-75.md)。

## 起動・操作

`front/`で`npm ci` → `npm run dev`。起動したマシンのブラウザで`http://localhost:3000/learning-preview/bfs-implementation`を開く。ログイン・バックエンド・DBは不要。
production buildは`npm run build`後に`node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000`。
クラウド上のlocalhostは、手元のPCから直接開ける共有URLではない。

1. MonacoとPython実行環境の読込を待つ。関数定義・dequeのimport・コメント・passの骨組みを表示する。
2. エディタで処理を記述する。14個のトークンチップは全員に提供し、カーソル／選択範囲へそのトークンだけを挿入する。Undoで1回の挿入を戻せる。
3. 「実行する」で全5ケースを順に実行し、常時表示の通過数・プログレスと各ケースの結果を確認する。途中のエラーでも後続ケースを試す。実行回数に上限はない。
4. ヒント1を開くとヒント2、ヒント2を開くとヒント3が解放される。未実行でも利用できる。同じレベルを再度開くたびに利用回数を増やす。
5. 5/5件を通過すると自動で完了リザルトへ切り替わり、称号・通過数・実行回数・レベル別ヒント利用回数・単元完了文を表示する。接続ボタンは置かない。
6. 再読込ですべて初期化する。保存・ログ送信はない。

枠は84vw × 84dvh。コードは16px、Monacoの既存組み込みと同じlightテーマ。広い画面は左にエディタとチップ、右に結果一覧。狭い画面は枠内で縦スクロールし、実行とヒントは下部に残す。狭い画面のヒントボタンはレベル名を短く表示し、エディタの高さを確保する。

## データと判定

`implementation.content.ts`にテンプレート・テスト・チップ・ヒント文・称号と締めの文を分離する。

| ID | 表示 | 種別・条件 | 期待される距離 |
| --- | --- | --- | --- |
| D1 | 入力・期待値・実際の出力 | フェーズ2のグラフ、A開始 | A=0、B/C=1、D/E=2、F=3 |
| D2 | 入力・期待値・実際の出力 | フェーズ6のグラフ、G開始 | G=0、H/I=1、J/K=2、L=3 |
| J1 | 種別・合否だけ | D1に孤立Zを追加 | D1と同じ、Zを含まない |
| J2 | 種別・合否だけ | Aだけ、辺なし | A=0 |
| J3 | 種別・合否だけ | A→B、Bの隣接情報なし | A=0、B=1 |

すべて`functionName: bfs_distances`、`args: [graph, start]`。
`preparePyodide`／`runCourseMissionTests`と既存`PythonTestCase`・`PythonTestResult`を使う。新しいPython実行器やWorkerは作らない。
既存Workerは複数ケースをまとめて渡すと途中の例外で止まるため、各ケースを1件ずつ渡す。これによりエラー後も後続を試し、ケースごとにプログレスを更新できる。
実行タイムアウトは既存基盤の15秒に委ねる。タイムアウト後も次の実行で既存基盤がWorkerを再生成する。アンマウント時は実行器を破棄し、後続ケースの要求を止める。

画面へ渡す実行状態はID・合否・エラー種別と、表示用だけの実際の出力に限定する。判定用の値、標準出力・標準エラー、生の例外文は表示しない。
クライアント内で実行するため、判定用データを開発者ツールから秘匿する仕組みではない。画面上で入出力を描画しないという契約を満たす。
編集すると表示中のテスト結果をクリアするが、ヒント1には直近の実行結果を使う。実行中は編集・チップ・ヒント・重複実行を無効にし、実行開始時のコードで評価する。

## 段階式ヒント

- レベル1: 未実行／文法エラー／途中のエラー／結果不一致だけを言語化する。修正案は出さない。既存基盤が例外を文字列で返すため、`SyntaxError`・`IndentationError`・`TabError`を文法エラーとして分類し、それ以外を途中のエラーとする。
- レベル2: フェーズ6コンテンツのParsons設問そのものと既存`ParsonsBoard`をモーダルで使う。`onAnswer`省略時だけ採点ボタンを隠す最小変更を共用部品に加えた。ドラッグ・上下ボタン・提示順へのリセットは従来どおり。フェーズ6の採点は変更しない。
- レベル3: `bfsCode.lines.map(line => line.text).join("\n")`で得た正解本文と現在のコードを、既存`diff`依存の`diffLines`で行単位に対応させる。閲覧専用の表として表示し、選択・コピー・切り取り・ドラッグ持ち出し・コンテキストメニューを抑止する。エディタへの適用・コピーのボタンや正解用編集モデルは作らない。

レベル3の制限は通常の画面操作を対象とし、スクリーンショットや開発者ツールによる取得を防ぐものではない。コード契約の本文・意味ID・versionは変更しない。

## 検証

`front/`で以下を実行する。既存のPython構文検証に`python3`を使う。

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

新verifyは、全ケースの独立BFS、テンプレートのimport・関数定義・構文、トークンの許可リスト、正解コードの契約とCPythonでの全ケース通過、ヒントの段階・回数、差分の行対応、判定用結果の非描画、全通過条件、実行アダプタの進捗・例外後続・キャンセルを確認する。
実際のMonaco・Pyodideを使うブラウザ検証の手順と環境上の制約は実装報告に記載する。

DB適用なし。Mission/Activity・アプリ組み込み・進捗／ログ保存・他フェーズの実装・フェーズ間接続（#77）・視覚的デバッグ（#76）は対象外。
