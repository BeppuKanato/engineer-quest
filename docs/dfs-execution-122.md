# Issue #122 DFS「動きの説明」実装記録

- 目的: DFSの動きとスタック操作を、17場面の単品プレビューとして確認できるようにする。
- 適用範囲: DFSの第2段階、BFS/DFS共有グラフの配置と参照経路、関連verify。
- 最終確認日: 2026-11-06
- 起点: PR #173マージ後のdevelop `9245a03925bfb2004d9241ebf3ea59893b745990`。
- 正本: [DFS基準データ](concept/dfs-unit-baseline.md) §§0.1/2/7.1、[教材指針](concept/learning-materials-guideline.md)、[プレイヤーUI](concept/learning-player-ui.md)、[Issue #122](https://github.com/BeppuKanato/engineer-quest/issues/122)。

## 実装

`front/src/features/learning/dfs/execution/`にcontent/types/Canvas/Previewを配置し、DFS導入と同じ命名と構造にした。基準書の17個のIDとキャプションをそのまま使用する。各スナップショットはoperation、処理中ノード、スタック、訪問順、完了集合、ノード状態、強調を持ち、直前のコマへ依存しない。

共有LearningPlayerが前後送り・位置指定・キー操作・自動再生を担当する。教材は84vw×84dvh、図は共通GraphDrawing/graphGeometryの等倍比拡縮を使う。色は既存playerTokensを参照し、距離層は出さない。下部に「スタック」「訪問順」を初めから表示し、スタック右端の末尾と次の取り出し対象を示す。入れる操作は図→スタック、取り出す操作はスタック→図へ600msで動く。reduced-motionでは0msにする。

13ではFが処理中、Dが完了、Eがスタック内で、新しい追加はない。辺を破線で強調し、残るEもスタック上で強調する。14ではEがスタックから図へ移って処理中になり、Fは完了へ変わる。存在しない「戻る」操作や新しい辺は追加していない。

## 共有グラフの選択

正本を`learning/bfs/bfsGraph.ts`から`learning/graphs/searchGraph.ts`へ移し、名前を`searchGraph`/`searchGraphNodes`/`searchGraphEdges`/`searchMaze`へ揃えた。中立な教材データの領域に置くことで、DFSがBFSへ依存せず、両者が同じ正本を使える。既存のノード・座標・辺の順番・格子配置は変更していない。隣接順は同じ辺列から導出する。BFS固有の距離計算のみ`bfs/bfsDistances.ts`に残す。古い正本や互換コピーは残さず、BFS全段階、DFS導入、verifyの参照経路を移行した。

Windowsで参照同一性を正しく検証するため、既存BFS verifyのVMキャッシュキーを絶対パスへ正規化した。Pythonを呼ぶ4本は`PYTHON`環境変数を許容し、未指定時の`python3`は維持する。既存の検証内容やアサーションは緩めていない。

## 検証

- `npm run lint`: 成功。既存の警告2件（BfsCodeCheckPreviewの未使用retry、BfsUnitPreviewのuseCallback依存）のみ。
- `npm run typecheck` / `npm run build`: 成功。
- package.jsonの`verify:*`全21本: 成功（BFS全10本、DFS導入・動きの説明、プレイヤー・学習画面等）。Windowsでは`PYTHON=D:/Python310/python.exe`、`PYTHONUTF8=1`を指定。
- `verify:dfs-execution`: 基準書§7.1の12行を実CPythonで実行し、観測した17状態を教材および基準書§2.2と照合。processing/stack/order/completed/operation全件、最終訪問順、逆順復元、不正データ拒否、共有グラフの参照同一性、表示・reduced-motionの契約を固定。
- 実画面: Chromeの本番ビルドで1366×768と390×844を確認。13→14、前送り・逆送り、位置指定、Home/End、自動送り・停止、17の完了状態を確認。390px幅で横あふれ・縦あふれなし。ブラウザコンソールの警告・エラーなし。
- 未実施: OSのreduced-motion設定を実際に切り替えた目視確認、他ブラウザ・タッチ実機。reduced-motionの0ms分岐は静的verifyで確認済み。

## 確認方法

単品URL: `/learning-preview/dfs-execution`。この作業環境の起動済みURLは`http://localhost:3122/learning-preview/dfs-execution`。通常の`front`開発サーバーなら`http://localhost:3000/learning-preview/dfs-execution`。

1. 「再生」で17場面を通す。初期スタック`A`から、訪問順`A→B→D→F→E→C`に到達する。
2. スライダーまたは次/前ボタンで13/17へ移動する。スタック`C,E`、Fが青、Eがベージュ、Dがグレーであることを確認する。
3. 14/17へ進める。Eが図へ取り出され、Fがグレーへ変わり、スタック`C`・訪問順末尾`E`になる。13へ戻して再確認する。
4. Endで17/17に移動し、全ノードがグレー、スタックが空であることを確認する。Homeや左右キー、最初から再生も使える。
5. 同じサーバーの`/learning-preview/bfs-execution`と`/learning-preview/dfs-motivation`で共有グラフの配置が同じであることを確認できる。

## 基準の読み替え・残る留保

- 依頼の「§1のdfs_order」は、現行基準書では§7.1にある。§1の隣接順と§7.1のスタック形コードを組み合わせて検証した。コード表は字下げを1空白で表しているため、本文を変えずPythonのブロック構造だけ復元する。
- Issue本文の旧名「アルゴリズム説明」より、今回の指示および§0.1の共通名「動きの説明」を表示名に採用。
- 基本グラフにはEから新しい未発見の枝へ潜り直す場面がない（基準書§1.4）。この制約は維持し、別のグラフや場面を追加していない。
- 以上は参照位置・表記の補足であり、教材状態や判定が変わる正本同士の矛盾は見つからなかった。

アプリ組み込み・進捗・学習ログ・他段階への接続は対象外。DB・seed変更および適用は不要。
