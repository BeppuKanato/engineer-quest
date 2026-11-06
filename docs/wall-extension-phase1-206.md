# 棒倒し法 グリッド描画基盤とフェーズ1（導入）（Issue #206）

目的: 穴掘り法・Q学習と共用できる迷路グリッドの描画基盤を新設し、棒倒し法単元のフェーズ1（導入）を実装する。設計は基準データ（docs/concept/wall-extension-unit-baseline.md §3・§4、正本は未マージのため承認済み原本に従う）に従う。最終確認日: 2026-11-06。

## グリッド描画基盤（player 配下、GraphDrawing の隣）

- `player/mazeGrid.types.ts`: CanvasSnapshot の具体型 `MazeGridCanvasState`。`data = { kind: "maze-grid", size }`、`state = { walls（"x,y" キーの配列）, processing（柱のキー or null）, target（壁になる予定マスのキー or null）, path（経路セルのキー配列）, start, goal }`、`highlights` はセル指定（空配列で「なし」を表現できる）。
- `validateMazeGridCanvas`: 盤面サイズ（奇数・3以上）、壁の範囲外・重複、processing は壁であること、target がまだ壁でないこと、path が壁を通らず1マスずつつながること、start/goal が通路であること、path の端点が start/goal と一致すること、を検証する。不正な盤面はロード時に例外になる。
- `player/mazeGridGeometry.ts`: viewBox 600×450 の中央に一辺 432 の正方形グリッドを置く（9×9 で1マス 48px、基準データ §4）。
- `player/MazeGridDrawing.tsx`: SVG 描画。壁は playerTokens の最濃ニュートラル色、通路は地色、processing はフォーカス青、target は待機ベージュ、path はフォーカス青の線（セル中心を結ぶ）、start/goal は小さな旗。色はすべて playerTokens から取り、緑は使わない。

## フェーズ1（導入）

- `front/src/features/learning/wall-extension/wallExtensionMaze.ts`: 迷路データの組み立て。壁リストは「外周＋柱＋伸長」から choices（方向番号列）で決定的に作り、手書きのベタ書きはしない。柱は処理順（左上→右下）に並び、一番上の段だけ4方向、それ以外は上を除く3方向から選ぶ（基準データ §1・契約 wall-extension-v1）。
- 7場面（すべて完全スナップショット、キャプションは1文）:
  1. 完成した 9×9 迷路＋start (1,7)・goal (7,7) の旗＋検証済み経路（18手）。「ゲームの迷路は、どうすればコンピュータに作らせることができるでしょう？」
  2. 別の完成迷路（7×7、choices [1,2,2,0]）。「同じ作り方でも、遊ぶたびに違う迷路が出来上がります。」
  3. 空の 7×7 盤面。「迷路の作り方は、3つの手順だけです。」
  4. 外周を壁にした 7×7。「まず、外側を壁で囲みます。」
  5. 柱（(2,2),(4,2),(2,4),(4,4)）を立てた 7×7。「次に、2マスおきに柱を立てます。」
  6. 最初の柱 (2,2) から下への伸長（processing="2,2"、target="2,3"）。「柱から1方向へ、隣のマスまで壁を伸ばします。」
  7. 7×7 の完成形＋ exit（`{ label: "動きの説明へ進む", nextPhase: 2 }`、BFS フェーズ1と同じ仕組み）。「3つの手順をくり返すだけで、毎回違う迷路が出来上がります。」
- 用語「棒倒し法」はフェーズ1では出さない（基準データ §3 の用語計画。名称付けは後続フェーズ）。
- 単品プレビュー: `/learning-preview/wall-extension-motivation`（DFS フェーズ1と同じ登録方法）。出口ボタンは単品では未接続（無効表示）。

## 検証

- `npm run verify:wall-extension-motivation`: 契約 wall-extension-v1 を検証スクリプト内で独立に再実装し、9×9（壁50・通路31）と 7×7（壁32・通路17）の完成形、途中状態の積み上がり、経路の連結（スタートからゴールへ到達可能で全通路がつながる＝完全迷路）が教材と一致することを確認。基盤検証の負系、実描画の壁数・旗・出口ボタンも確認する。
- 既存の `verify:bfs-motivation` / `verify:dfs-motivation`、front の `lint` / `typecheck` / `build` も通過（lint の警告1件は既存の BfsUnitPreview のもので本変更と無関係）。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- 壁の色: 基準データ §4 は「レイヤー系の濃いグレー」を指定するが、playerTokens のレイヤー色（layer0〜2）はすべて淡色で、壁として読める濃さの専用トークンは無い。本実装では playerTokens 内で最も濃いニュートラル色である `text`（#111827）を壁に使った。専用トークン（例: 壁色）を playerTokens に追加すべきかは UI 定義側の判断として残す。
- フェーズ1の出口は BFS の仕組み（`state.exit = { label, nextPhase }`）に合わせた。DFS フェーズ1は exit を真偽値で持つため、モジュール間で形が異なる。単元接続（#130 相当）の際にどちらへ寄せるか決める必要がある。
