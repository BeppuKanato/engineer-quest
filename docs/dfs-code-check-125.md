# Issue #125 DFS「コードの確認問題」実装記録

- 目的は、スタックへの追加と、隣の場所が未発見かどうかの判定をコードで確かめること。
- 対象は DFS の単品プレビュー、穴埋め2問と復習、初回回答の結果表示。
- 最終確認日 2026-11-10
- 正本は [Issue #125](https://github.com/BeppuKanato/engineer-quest/issues/125)、[DFS 基準データ §5・§7.1](concept/dfs-unit-baseline.md)、[教材指針](concept/learning-materials-guideline.md)、[プレイヤー UI](concept/learning-player-ui.md)。

## 実装

問題と空欄は正本の `dfs-order-stack` を参照する。行番号は意味 ID から求める。問1は `append-stack` の `append / pop / remove`、問2は `if-unvisited` の `not in / in / ==` から選ぶ。各問は独立している。表示と判定には共通の `CodeDisplay`、`assessment`、正誤フィードバックを使う。

不正解時の復習には「動きとコードの対応」の2コマを再利用する。問1では C を記録してスタックに積む動き、問2では A の隣の C が未発見か確かめる条件を表示する。

基準データの完了例には次の段階の予告がある。単品の終了時は現行教材指針に合わせ、初回の正解数と「もう一度解く」を表示する。誤答した問題はその場で再回答でき、次へ進むこともできる。正解後は選択肢を固定し、再回答による正解は初回スコアへ加算しない。

## 確認方法

front の開発サーバーを起動し、[単品プレビュー](http://localhost:3000/learning-preview/dfs-code-check) を開く。

1. 問1で `pop` を選び、「この処理の動きをもう一度見る」でスタックに C が入るコマまで進む。閉じた後で `append` を選ぶと、正解表示が出て回答が固定される。
2. 「次の問題へ」から問2へ進み、`in` を選ぶ。同じ復習ボタンから `if neighbor not in visited` に対応するコマを確認する。閉じて「結果を見る」を押すと、初回正解が2問中0問と表示される。
3. 「もう一度解く」でやり直し、問1で `append`、問2で `not in` を初回に選ぶ。結果が2問中2問になる。

`npm run verify:dfs-code-check` は、選択肢と意味 ID、Python による選択肢の構文確認、正答時の元コード復元、復習コマ、空欄の初期表示、再回答・進行・初回スコアを検証する。DB の適用は不要。
