# 貪欲法（硬貨問題） 単元コンテナと学習フロー接続（Issue #389）

目的: 単品ページで確認済みの貪欲法（硬貨問題）フェーズ1〜7を1つの単元として通して学べるよう接続し、アプリ（unitRegistry / LearningScreen）へ登録する。あわせて結果図 `GreedyCoinsResultFigure`（トレイに主教材の9枚が並び「786円・9枚」を示す図、基準データ §4）を用意し、フィードバック（#202）が共有 props 経由で届くことを確認する。構成は二分探索単元（#294）の型に従う。最終確認日: 2026-11-11。

## 実装

- `front/src/features/learning/greedy-coins/unit/`（モジュール README に詳細）:
  - `unit.content.ts`: フェーズ1〜7の並び（ID は `greedy-coins-motivation` … `greedy-coins-implementation`）と遷移類型（bridge / result / result-in-phase / final）、ブリッジ文、リザルト画面の文言、カードのレアリティ（基準データ §5：フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）。
  - `unit.types.ts`: 各フェーズから受け取る到達状況の型（BFS の BfsUnitPhaseSummary と同一の契約）。
  - `GreedyCoinsUnitPreview.tsx`: 単元の状態機械と単元ナビゲーション。仕組みは BFS 単元と同一で、フェーズの実体と単元定義だけが異なる。確認フェーズ（3・5・6）の完了保存後に `onCheckPhaseCompleted` で先行生成を依頼し、フェーズ3・5のリザルトと最終結果にフィードバックの差し込み口を持つ。
  - `UnitResultScreens.tsx`: フェーズ3・5の後のリザルト画面と単元完了時の最終リザルト。
  - `GreedyCoinsResultFigure.tsx`: 主教材の実行記録（`runGreedyCoins`）から導出した完了盤面。トレイに [500, 100, 100, 50, 10, 10, 10, 5, 1] の9枚が並び、残額0・全額面 passed でフェーズ2のまとめの盤面と同一の状態を示す。単元側の盤面検証（`validateGreedyCoinsExecutionCanvas`）を通す。
- アプリ登録:
  - `front/src/features/learning/app/unitRegistry.ts`: kind `greedy-coins`（コース `course-algorithm-greedy-coins-v1`、シード追加は #390）を追加。
  - `front/src/features/learning/app/LearningScreen.tsx`: `unit.kind === "greedy-coins"` の振り分けを追加。進捗保存・下書き・学習ログ・フィードバックは共通の `unitPreviewProps` のまま届く。
- プレビュー登録:
  - `front/src/app/learning-preview/[contentId]/page.tsx` に `greedy-coins-unit` を登録した。フェーズ1〜7の単品登録は先行 Issue で登録済み。

## 検証

- `npm run verify:greedy-coins-unit`（新規）: 単元定義（フェーズ順・ID・遷移類型・共通名セット・カードレアリティ・遷移ラベル）、レジストリ登録（既存6単元の登録維持、貪欲法のコースID・kind・再開位置）、[contentId] 登録、LearningScreen の kind 振り分けと共通 props・フィードバック配線、コンテナの7フェーズ埋め込みとフィードバック受け口、各フェーズプレビューの接続ポート、結果図の導出（786円・9枚）と実描画（額面チップ6個・トレイ9枚・残額0・「786円・9枚」のキャプション）、フェーズリザルトの実描画（見出し・スコアドット・到達図）、ブリッジ画面の描画を確認した。
- 回帰: 貪欲法の既存 verify 全部（motivation / execution / check / code-mapping / code-check / consolidation / implementation / trace）、他単元の unit verify 全部（binary-search / bubble-sort / maze-digging / wall-extension / dfs / bfs）、`verify:learning-screens`、`verify:learning-player`、`verify:unit-overview`、front の型チェック（`tsc --noEmit`）、新規・変更ファイルの lint（警告1件は二分探索コンテナと同一コード由来の既存パターン）、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **ブリッジ文とリザルト見出しは他単元の文面を単元に合わせて流用した**: フェーズ3・5のリザルト見出しと各ブリッジ文は、二分探索単元の文面を貪欲法向けに言い換えたもの（例：フェーズ6のブリッジ「別の金額や別の額面でも、同じ考え方が使えるか確かめましょう。」）。基準データに文面の指定はなく、単元固有の文面が要る場合は別途差し替える。
- **結果図のキャプションは「この段階で払った金額（786円・9枚）」とした**: 基準データ §4 の「786円・9枚」をそのまま含む形で、フェーズ3以降のリザルトに出る事実文として置いた。
- **コースシードは本 PR の対象外**: コース `course-algorithm-greedy-coins-v1` は新規追加が必要なため、本 PR の登録だけでは単元一覧に現れない。シード追加は Issue #390 で扱い、開発 DB への `seed:preserve` 再実行が別途必要。
- **#388 の検証修正の取り込み**: 本ブランチ作成後に #388 側で `verifyGreedyCoinsTrace.cjs` の描画状態の確認（`data-coin-status` の語彙）を修正したため、本ブランチは修正後の #388 ブランチへ rebase して取り込んだ（force-push 済み）。
