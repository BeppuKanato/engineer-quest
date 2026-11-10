# 二分探索 単元コンテナと学習フロー接続（Issue #294）

目的: 単品ページで確認済みの二分探索フェーズ1〜7を1つの単元として通して学べるよう接続し、アプリ（unitRegistry / LearningScreen）へ登録する。あわせて結果図 `BinarySearchResultFigure`（発見セルを確定表示した主教材の配列、基準データ §4・§5）を用意し、フィードバック（#202）が共有 props 経由で届くことを確認する。構成はバブルソート単元（#235）・穴掘り法単元（#265）の型に従う。最終確認日: 2026-11-07。

## 実装

- `front/src/features/learning/binary-search/unit/`（モジュール README に詳細）:
  - `unit.content.ts`: フェーズ1〜7の並びと遷移類型（bridge / result / result-in-phase / final）、ブリッジ文、リザルト画面の文言、カードのレアリティ（基準データ §5：フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）。
  - `unit.types.ts`: 各フェーズから受け取る到達状況の型（BFS の BfsUnitPhaseSummary と同一の契約）。
  - `BinarySearchUnitPreview.tsx`: 単元の状態機械と単元ナビゲーション。仕組みは BFS 単元と同一で、フェーズの実体と単元定義だけが異なる。確認フェーズ（3・5・6）の完了保存後に `onCheckPhaseCompleted` で先行生成を依頼し、フェーズ3・5のリザルトと最終結果にフィードバックの差し込み口を持つ。
  - `UnitResultScreens.tsx`: フェーズ3・5の後のリザルト画面と単元完了時の最終リザルト。
  - `BinarySearchResultFigure.tsx`: 主教材の実行記録（`binarySearchProbes` / `runBinarySearch`）から導出した発見盤面。最後の比較で残った範囲の中に発見セル（インデックス4の 25）を確定表示し、捨てた部分は範囲外として残す。単元側の盤面検証（`validateBinarySearchExecutionCanvas`）を通す。
- アプリ登録:
  - `front/src/features/learning/app/unitRegistry.ts`: kind `binary-search`（コース `course-algorithm-binary-search-v1`、既存シード）を追加。
  - `front/src/features/learning/app/LearningScreen.tsx`: `unit.kind === "binary-search"` の振り分けを追加。進捗保存・下書き・学習ログ・フィードバックは共通の `unitPreviewProps` のまま届く。
- プレビュー登録の統一:
  - `front/src/app/learning-preview/[contentId]/page.tsx` に `binary-search-unit` と `binary-search-motivation` を登録した。フェーズ2以降は元々この方式で登録されていた。
  - フェーズ1（#286）で作った専用ページ `front/src/app/learning-preview/binary-search-unit/page.tsx` を削除し、二重管理を解消した。URL `http://localhost:3000/learning-preview/binary-search-unit` は [contentId] 側で引き続き開ける。
  - 追随修正: `front/scripts/verifyBinarySearchMotivation.cjs` のプレビュー登録チェックを [contentId] 方式へ向け直し、専用ページが存在しないことも確認するよう変更した。フェーズ1の README の参照先も更新した。

## 検証

- `npm run verify:binary-search-unit`（新規）: 単元定義（フェーズ順・遷移類型・共通名セット・カードレアリティ・遷移ラベル）、レジストリ登録（既存4単元の登録維持、二分探索のコースID・kind・再開位置）、[contentId] 登録と専用ページの不在、LearningScreen の kind 振り分けと共通 props・フィードバック配線、コンテナの7フェーズ埋め込みとフィードバック受け口、各フェーズプレビューの接続ポート、結果図の導出（25 はインデックス4、3回の比較）と実描画（7本のバー、範囲外6セル、発見セルの確定表示と強調リング）、フェーズリザルトの実描画（見出し・スコアドット・到達図）、ブリッジ画面の描画を確認した。
- 回帰: 二分探索の既存 verify 全部（motivation / execution / check / code-mapping / code-check / consolidation / implementation / trace）、`verify:learning-player`、front の型チェック（`tsc --noEmit`）、新規・変更ファイルの lint、`build` も通過。
- DB・シードの変更はない。コースシード（`course-algorithm-binary-search-v1`）は既存のため、本 PR の登録だけで単元一覧・学習画面に現れる。

## 留保（判断が必要な点）

- **ブリッジ文とリザルト見出しは他単元の文面を単元に合わせて流用した**: フェーズ3・5のリザルト見出しと各ブリッジ文は、バブルソート単元の文面を二分探索向けに言い換えたもの（例：フェーズ6のブリッジ「別の数字の並びでも、同じ考え方が使えるか確かめましょう。」）。基準データに文面の指定はなく、単元固有の文面が要る場合は別途差し替える。
- **結果図のキャプションに「インデックス」の語を使った**: フェーズ2の発見キャプション（「左から 5 番目（インデックス 4）に見つかりました」）に合わせ、「この段階で見つけた数字（25 はインデックス 4 にありました）」とした。フェーズ1では同語を出さない方針だが、結果図が出るのはフェーズ3以降のため矛盾しないと判断した。
- **カード・実績のシードは本 PR の対象外**: カードのレアリティは単元画面のノードバッジ表示のために `unit.content.ts` へ持ったが、付与の正本である seed のカードスケジュール・実績の追加は Issue #295 で扱う。本 PR のマージだけではカード付与・実績は発生しない。
