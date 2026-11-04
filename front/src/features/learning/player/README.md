# 学習プレイヤーの土台（Issue #68）

- 目的: 新フロー教材の単品確認と、後続 #69〜#76 が使う再生契約の定義。
- 適用範囲: ステップ表示・再生と教材 Canvas。状態: 現行。最終確認日: 2026-11-04。
- 正本: [教材指針全文](../../../../../docs/concept/learning-materials-guideline.md) §1 およびフェーズ1・2。
- UI の正本: [学習プレイヤーUI定義](../../../../../docs/concept/learning-player-ui.md)。develop `5151f2e` を取り込んで適用した。
- 初期実装の起点: develop `ab0d04a`。Mission / Activity への依存、DB、API、保存、ログ、入口導線は含まない。

## ローカル確認

```sh
cd front
npm ci
npm run dev
```

- `http://localhost:3000/learning-preview/step-demo`: 9ステップの小さなグラフ例。
- `http://localhost:3000/learning-preview/scene-demo`: 内部データ構造を出さない2場面（フェーズ1形式の確認）。
- どちらも仮コンテンツであり、BFS 教材の完成版ではない。既存画面からのリンクはない。
- ログイン不要。共通 `HexadRouteGuard` にプレビュー名前空間の除外を1行追加している。
- 不明な contentId は404、検索用 metadata は noindex / nofollow。

「次のステップ」で1→2→3へ進み、キャプション、ノード、キュー、現在値、強調が同時に変わることを確認する。
「前のステップ」で戻し、スライダーを直接クリックまたは矢印キー / Home / End で移動する。
「再生」で自動送り、「一時停止」で停止し、手動移動でも停止することを確認する。
末尾では自動停止し、次へは無効。「最初から再生」で先頭から再生する。先頭の前へも無効。
狭い画面でもプレイヤーバーが収まり、キャプションと図の上下関係が保たれることを確認する。
操作バーは左から「再生/一時停止、前へ、次へ、スライダー、n/N」。プレイヤーまたはボタンにフォーカスがある場合も矢印キー / Home / End を使える。
1→2で A がキューから図へ移動し、2→3で B が図からキューへ出現することを確認する。3→4では B が左へ詰まり C が追加される。
300msの遷移後に不要な要素が残らないこと、素早い逆送り・シークでも目的の状態に落ち着くことを確認する。

## 後続教材を載せる契約

`content.types.ts` の `LearningContent<TCanvas>` を、型付き TypeScript モジュールから渡す。
`version: 1` は形式のバージョン、`kind: "step-sequence"` は再生形式の判別子。
`id`、`phase`、`intervalMs` と、空ではない `steps` を持つ。
ステップの安定した `id` は将来の復習先参照にも使える。

1ステップは `id` + `caption`（1文）+ `canvas`。
Canvas は必ず `data`（対象データ）、`state`（内部状態）、`highlights`（強調対象）を含む完全なスナップショットである。
差分イベントや前ステップへの暗黙の依存を禁止し、シーク・逆送りでも同じ状態を再現する。
指針2-1〜2-3に従い、キャプションと描画は同じステップから取り出す。
ステップ間は最小の1事実だけを変える。文意としての1文・最小変化量は教材レビューでも確認する。

```tsx
const content = defineLearningContent<GraphCanvasState>({
  version: 1,
  kind: "step-sequence",
  id: "algorithm-phase-2",
  phase: 2,
  intervalMs: 1600,
  steps: [
    { id: "initial", caption: "A を待ち行列に追加します。", canvas: initialCanvas },
    { id: "take-a", caption: "キューから A を取り出します。", canvas: nextCanvas },
  ],
}, validateGraphCanvas);

<LearningPlayer content={content} renderCanvas={(canvas) => <GraphCanvas canvas={canvas} />} />
```

`GraphCanvasState` はノード・辺・層、ノードごとの状態、queue / stack / array の項目列、変数、強調参照を持つ具体型。
対象データの座標系は 600×300。`graphLayout.ts` が表示枠の幅・高さへ投影し、内部状態の領域を確保する。
状態は `idle / processing / queued / completed`、色は意味名から描画側で引く。
データ構造の項目から `nodeId` で図の要素に対応でき、`highlights` は node / edge / item を同期強調できる。
強調枠は UI 定義に従って常に青とし、既存の `tone` によって状態の塗りを上書きしない。
初出用語のラベルや層の可視性もステップで切り替えられる。
`defineLearningContent` と `validateGraphCanvas` で空ステップ、ID重複、空キャプション、不正間隔、参照切れをロード時に拒否する。
現在の入力境界は TypeScript の import のみ。外部 JSON / API を追加する場合は `unknown` からの schema 検証を追加し、型アサーションだけで読み込まない。

フェーズ1は同じ型のまま `structures: []`、`variables: []` として場面列を持てる（`scene-demo`）。
地図・配列・コード付きなど別の描画が必要なら `CanvasSnapshot` を満たす具体型と検証関数・rendererを追加し、再生本体は共用する。
フェーズ3以降の問い・論点タグ・コード・テストの schema と操作は各 Issue で定義する。
既存のステップ状態は確認問題の図や復習再生にも利用できるが、全フェーズを自動再生する形式にはしない。

## UI 定義の適用

`player.tokens.ts` に閉じ、状態をアプリ全体の primary / success と共有しない。
処理中=青 `#2563eb` / 枠 `#1d4ed8`、キュー待ち=ベージュ `#f5e7c1` / 枠 `#c9a227`、完了=グレー `#e5e7eb` / 枠 `#9ca3af`、未処理=白 / 枠 `#9ca3af`。
層は `#f3f4f6` / `#e5e7eb` の交互。強調は青の太枠・破線枠に統一する。
文字はキャプション、ノード名、層、キュー、変数、操作系とも `#111827`。青い処理中要素上だけ白を使う。
全ノードに状態文を常時表示せず、状態は塗り、キュー内の位置、強調枠、同期キャプションで伝える。読み上げ用ラベルと SVG title には状態名を残す。

小さい最大幅、カードの背景・角丸、外側の余白を廃止した。単品ページは画面全体、組み込みでは親の残り領域を使い、内側余白は8〜16pxとする。
ResizeObserver でキャンバスの実寸を読み、SVG の座標・文字・要素サイズを調整する。図形を引き伸ばさず、狭い画面ではキューも折り返す。

既存依存の Framer Motion を使い、同じ座標系上で `nodeId` の図→キューの出現・キュー→図の退出・残る要素の移動を300msで繋ぐ。
`nodeId` のない項目も移動とフェードで出入りする。強調枠の出現・縮小とノードの拡縮も同期する。
キャプションと読み上げ用の状態は移動先のスナップショットに即座に揃え、退出中の要素は読み上げから除外する。
シークで途中の処理を累積実行せず、現在の表示から選択した状態へ遷移する。自動送り間隔は最低350msとして遷移時間を確保する。
OS の「動きを減らす」設定ではアニメーションを省略する。

[PR コメント](https://github.com/BeppuKanato/engineer-quest/pull/80#issuecomment-6624147174) のアニメーション・画面占有率と、[配色・操作配置の指摘](https://github.com/BeppuKanato/engineer-quest/pull/80#issuecomment-6624357848) を UI 定義に沿って反映している。

## 残る判断点

教材指針全文1-4はフェーズ1→2をシームレス接続とし、要約のフェーズ構成・遷移は意思確認ボタンを要求している。
この Issue ではフェーズ遷移を実装せず、この矛盾を PR に記録し、後続の接続 Issue で判断する。

## 検証

`npm run lint` / `npm run typecheck` / `npm run build` / `npm run verify:learning-player`。
最後の検証は再生境界、停止、シーク、末尾再生、1ステップ、両形式のデータ、参照不整合の拒否、表示枠への配置と長いキューの折り返しを確認する。
実ブラウザでは上記操作と、図・内部状態・キャプションの同期、300msの移動、画面占有率、狭い画面、404を確認する。
DB適用は不要。バックエンド・保存・フェーズ別教材・フェーズ遷移の検証は対象外。

2026-11-04 の UI 定義適用後の実施結果: 上記4コマンドは成功。Chrome で前後移動、ボタン・スライダー上の矢印キー / Home / End、再生・一時停止、末尾停止・再再生、両仮教材、404、退出要素の除去を確認した。
1366×768 と390×844で教材領域は画面全体を使用し、キャンバス単体でも約79%・82%の面積を占め、横スクロールがないことを確認した。
production build でも同じ操作と配色・操作順を確認した。build は既存 `next/font` による Google Fonts 取得のためネットワークアクセスを必要とした。
既存の複数 lockfile による workspace root 警告と ESLint 設定の module type 警告は残るが、検証は exit 0。
