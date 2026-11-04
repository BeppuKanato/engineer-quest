# 学習プレイヤーの土台（Issue #68）

- 目的: 新フロー教材の単品確認と、後続 #69〜#76 が使う再生契約の定義。
- 適用範囲: ステップ表示・再生と教材 Canvas。状態: 現行。最終確認日: 2026-11-04。
- 正本: [教材指針全文](../../../../../docs/concept/learning-materials-guideline.md) §1 およびフェーズ1・2。
- 起点: develop `ab0d04a`。Mission / Activity への依存、DB、API、保存、ログ、入口導線は含まない。

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
図の座標系は 600×300。状態は `idle / processing / queued / completed`、色は意味名から描画側で引く。
データ構造の項目から `nodeId` で図の要素に対応でき、`highlights` は node / edge / item を同じ tone で同期強調できる。
初出用語のラベルや層の可視性もステップで切り替えられる。
`defineLearningContent` と `validateGraphCanvas` で空ステップ、ID重複、空キャプション、不正間隔、参照切れをロード時に拒否する。
現在の入力境界は TypeScript の import のみ。外部 JSON / API を追加する場合は `unknown` からの schema 検証を追加し、型アサーションだけで読み込まない。

フェーズ1は同じ型のまま `structures: []`、`variables: []` として場面列を持てる（`scene-demo`）。
地図・配列・コード付きなど別の描画が必要なら `CanvasSnapshot` を満たす具体型と検証関数・rendererを追加し、再生本体は共用する。
フェーズ3以降の問い・論点タグ・コード・テストの schema と操作は各 Issue で定義する。
既存のステップ状態は確認問題の図や復習再生にも利用できるが、全フェーズを自動再生する形式にはしない。

## 局所トークンと判断点

`player.tokens.ts` に閉じ、状態をアプリ全体の primary / success と共有しない。
処理中=琥珀、キュー待ち=青、完了=緑、未処理=白と灰の輪郭。
層は別の淡い背景色と「0歩 / 1歩」等のラベルで表す。状態ラベル・記号、強調の破線を併用し、色だけに依存させない。
キャプションは指針指定の `#111827` 太字。

正本には状態色の具体的な色名・HEX の指定がないため、上記はこの PR の提案であり確定済みの配色とは扱わない。
また、全文1-4はフェーズ1→2をシームレス接続とし、要約のフェーズ構成・遷移は意思確認ボタンを要求している。
この Issue ではフェーズ遷移を実装せず、この矛盾を PR に記録し、後続の接続 Issue で判断する。

## 検証

`npm run lint` / `npm run typecheck` / `npm run build` / `npm run verify:learning-player`。
最後の検証は再生境界、停止、シーク、末尾再生、1ステップ、両形式のデータ、参照不整合の拒否を確認する。
実ブラウザでは上記操作と、図・内部状態・キャプションの同期、狭い画面、404を確認する。
DB適用は不要。バックエンド・保存・フェーズ別教材・フェーズ遷移の検証は対象外。

2026-11-04 の実施結果: 上記4コマンドは成功。Chrome の production build で前後移動、矢印キー / Home / End によるシーク、再生・一時停止、末尾の自動停止・再再生、両仮教材、404を確認した。
390×844 でも横スクロールがないことを確認した。build は既存 `next/font` による Google Fonts 取得のためネットワークアクセスを必要とした。
既存の複数 lockfile による workspace root 警告と ESLint 設定の module type 警告は残るが、検証は exit 0。
