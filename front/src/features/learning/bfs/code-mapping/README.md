# BFS フェーズ4「コードとの対応付け」

- 目的: Issue #72 のコード接続を、共通プレイヤー上の単品プレビューで最初から最後まで確認する。
- 適用範囲: フェーズ4のコード契約・対応フレーム・描画・検証。状態: 現行。最終確認日: 2026-11-05。
- 起点: `develop` `402db26`（PR #92 マージ済み）。
- 正本: [教材指針 §1・フェーズ4](../../../../../../docs/concept/learning-materials-guideline.md)、[UI定義](../../../../../../docs/concept/learning-player-ui.md)、[要約](../../../../../../docs/concept/learning-materials-v2.md)、[Issue #72](https://github.com/BeppuKanato/engineer-quest/issues/72)。

## 確認方法

`front/` で `npm ci` → `npm run dev` を実行し、同じマシンのブラウザで `http://localhost:3000/learning-preview/bfs-code-mapping` を開く。
ログイン・DB・バックエンドは不要。クラウドマシンで起動したlocalhostは、そのマシン外から直接開ける共有URLではない。
production buildでは `npm run build` 後に `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000` を実行する。

再生・一時停止・前後・シーク、またはプレイヤーをフォーカスして ← / → / Home / End で全62フレームを確認する。
自動再生は3500ms間隔。19個の図のチェックポイントに、宣言・while判定・全隣接点のfor/if・距離代入・returnのフレームを加えている。
末尾はキューが空のwhile判定→距離辞書のreturnで終了する。リザルトや次フェーズへのリンクは付けない。

1366×768では図＋コードを横スクロールなしに表示する。コードと変数は最小16px（最大18px）、コード行間は1.8、非実行行のopacityは0.55とし、実行行の青背景＋白文字を維持する。
コード側の幅を優先し、図は #91 の共通SVGを比率どおりに縮小する。フェーズ2との実寸一致は要求しない。
390px級の狭い画面では、図＋コード領域だけを横スクロールする。操作バーは外側に残る。
9コマ目では `distances[neighbor]` と `distances` の値だけが青・太字になり、10コマ目では `queue` が強調されることを確認する。

## コード契約 v1（フェーズ5向け）

`bfsCode.ts` の `bfsCode` は `id=bfs-distances-deque`、`version=1`、`language=python`。
元は `back/prisma/seedData/breadthFirstSearchCourseSeed.ts` の `breadthFirstSearchAnswerCode`（deque版 `bfs_distances`）。
11行の本文・インデント・変数名は一切変更していない。教材用のPythonコード改変はない。
バックエンドseedをブラウザへimportせず、フロントにコード契約を置き、verifyで元の本文との完全一致を検証する。

| 意味ID | 表示行 | Python本文 |
| --- | --- | --- |
| `import-deque` | 1 | `from collections import deque` |
| `define-function` | 2 | `def bfs_distances(graph, start):` |
| `initialize-distances` | 3 | `distances = {start: 0}` |
| `initialize-queue` | 4 | `queue = deque([start])` |
| `while-queue` | 5 | `while queue:` |
| `dequeue-node` | 6 | `node = queue.popleft()` |
| `for-neighbor` | 7 | `for neighbor in graph.get(node, []):` |
| `if-undiscovered` | 8 | `if neighbor not in distances:` |
| `assign-distance` | 9 | `distances[neighbor] = distances[node] + 1` |
| `enqueue-neighbor` | 10 | `queue.append(neighbor)` |
| `return-distances` | 11 | `return distances` |

行番号はコード欄の補助表示であり、キャプションには付けない。`bfsCodeLineNumber` は検証等で行番号を導出するために維持する。フェーズ5は数値の行番号や画面上のインデックスではなく、コードID・version・意味IDを参照すること。
このIssueでは穴埋めの候補・設問・正解データは追加していない。

## コード表示の共用（#73）

`BfsCodeDisplay.tsx` が11行のコード描画を担当し、フェーズ4の実行行・Dimと、フェーズ5の対象箇所だけの空欄表示を同じ部品で描く。フェーズ4のコード契約・62フレーム・変数表示は変更しない。

## 対応データと図の再利用

- `codeMapping.content.ts`: 共通の `LearningContent<CodeMappingCanvasState>` に載せる62フレーム。コンポーネントへコードや場面列を埋め込まない。
- `state.executionStepId` / `state.execution`: フェーズ2のステップIDと実際のcanvasへの参照。図の状態・強調・グラフ・キューをコピー／再定義せず、`BfsExecutionCanvas` へそのまま渡す。
- `frameKind=execution`: フェーズ2の19ステップが元の順で1回ずつ現れる。キャプションはフェーズ2の原文をそのまま維持し、行番号の接頭辞は付けない。
- `frameKind=code`: 直前の図を保持したコード側のフレーム。フェーズ2で省略されている逆向きの辺・既発見点のifもすべて通る。for終了では対応する完了スナップショットへ進む。
- `highlights`: 実行中のコード行の意味IDを1つ保持。図は参照スナップショット自身のハイライトを使い、両者とも既存トークンの青で同期する。
- `captionKind`: データ構造操作 `structure`、比較・評価 `evaluation`、状態更新・代入 `assignment`。ループ文は現在のキュー・node・neighbor・距離を埋め込む。
- `locals` / `variables`: `node` / `neighbor` の束縛状態、距離代入の一時状態、および参照図から導出したコード下部の値。Pythonで値を代入する前は `—`、初期化済みの空キューは `[]` と区別する。ループ終了後もPythonと同じくnode/neighborの最後の値を保持する。

コードの行移動や逆送りは前フレームを実行する処理ではない。各フレームに対応ID・変数の完全状態を持つので、先頭から順に見なくても図とコード・変数が復元される。
変数の強調は `codeMapping.presentation.ts` の表示差分で導出する。現在のcanvasを場面列から特定し、その直前フレームの変数と比較するため、任意シーク・逆送り・再描画でも強調対象が変わらない。未代入 `—` から値が入る場合も変化として扱う。
変わった値だけを既存の `playerTokens.focus` と太字で示し、変わらない値は黒・通常の太さで表示する。コンテンツの変数データは変更しない。
図・プレイヤー・トークンの実装は変更していない。

## 判断点・指針との境界

1. フェーズ2は距離の代入とキュー追加を1つの `discover-*` スナップショットにまとめている。一方、元のPythonは別々の2行である。Python本文も図のデータも変えないため、9行目の代入では直前の図を保持し、代入結果をコード下部の `distances[neighbor]` と `distances` に表示する。10行目のappendで対応するdiscoverスナップショットへ進む。代入値は参照図の `distances[node] + 1` から導出する。図がコードより1行分粗いチェックポイントであることをPRにも明記する。
2. フェーズ2には初期化前の空の図がない。冒頭のimport・def・distances宣言では、対応する最初の `enqueue-start` の図を先に示す。コード側のqueue/distancesは実行行に従って `—` から初期化する。初期化前の図を新設しない。
3. PR #93 のレビュー指示に従い、図との実寸一致よりコード・変数の読みやすさを優先する配分に変更した。1366×768では横スクロールなし、390px級では局所的な横スクロールで対応する。既存フェーズ2と同じプレビュー外枠・プレイヤーを使うため、UI定義の70〜85%占有率・操作バー等と既存土台の差分（#83）はそのまま残る。
4. UI定義の「本文は黒」とフェーズ4の「非実行コードはDim」は、コードの非実行行のみopacityを下げることで役割を分ける。キャプションと変化していない変数は黒、変化した変数値は既存の青と太字、青の実行行上は白とする。
5. 指針全文はフェーズ4末尾のリザルト、要約は4→5のシームレス接続を示しており、遷移の記述が一致していない。現在のユーザー指示ではリザルト・接続は #77 の対象外なので、今回はreturnで停止する。元文書の遷移定義は変更しない。

## 検証

`front/` で以下を実行する。新しいverifyは `python3` を使う。

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:learning-player
npm run verify:bfs-motivation
npm run verify:bfs-execution
npm run verify:bfs-check
npm run verify:bfs-code-mapping
```

新verifyは、62フレームの図の参照同一性・19チェックポイントの順序・全11行の通過・本文と意味IDの契約を確認する。
さらに元のPythonを実行して全行をトレースし、ifのfalse、forの各反復・終了、whileの終了を含む全行と、node/neighbor・距離辞書・キューの値を各フレームと照合する。
誤った変数値、図のコピー、未知の行ID、誤った距離代入、19チェックポイントの欠落も拒否する。PR #93 の修正では行番号プレフィックスがないこと、実行フレームが原文と一致すること、全フレームの変数の変化判定がPythonの変数差分と一致することも検証する。

DB適用なし。依存関係・ロックファイル・既存の図や19ステップは変更なし。

## PR #93 レビュー修正の確認

[検証記録と更新済みの1366×768の画像](../../../../../../docs/bfs-code-mapping-72.md#pr-93-レビュー修正)を参照。
1. 9/62へシークし、コード・変数が16px以上で読め、図＋コード領域に横スクロールがないことを確認する。
2. 距離代入で変わった `distances[neighbor]` と `distances` の値だけが青・太字であることを確認する。
3. 10/62で `queue` だけが変化表示になり、距離表示は通常色へ戻ることを確認する。
4. 9/62へ逆送り・直接シークし、同じ強調が復元されることを確認する。
