# 二分探索 フェーズ6（応用問題）（Issue #291）

目的: 二分探索単元のフェーズ6（応用問題）を、基準データ §3 フェーズ6の4問（転移タップ・不在の選択・Parsons・前提の選択）として実装する。設計は基準データ（docs/concept/binary-search-unit-baseline.md §1・§3、正本）と教材指針フェーズ6（ソフトゲート、復習先はフェーズ4のみ）、他単元フェーズ6（バブルソート #232）の構成に従う。最終確認日: 2026-11-07。

## 実装

- `front/src/features/learning/binary-search/consolidation/consolidation.content.ts`: 4問と読み込み時の検証（`validateBinarySearchConsolidation`）。正解はすべて実行記録（`binarySearchProbes` / `runBinarySearch`）から導く。
  - Q1 `first-center-transfer`: 転移リスト [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] で 23 を探すとき、最初に調べる真ん中のタップ。正解は位置4（値 16）。偶数長では真ん中が左寄りになる（切り捨て）が要点。
  - Q2 `absent-target`: 主教材リストで 20 を探すとどうなるかの文章4択（フェーズ3で導入した ChoiceQuestion の形）。正解は「最後の1個まで絞っても 20 はなく、範囲が空になって探索が終わる」。解説では比較列（19 → 31 → 25）が 25 のときと同じ道になることを示す。
  - Q3 `whole-code-order`: 参照コード（契約 binary-search-v1、12行）の主要8行の Parsons（詳細は留保）。
  - Q4 `why-sorted-matters`: 並んでいないリスト [25, 3, 42, 7, 19] で同じやり方をすると壊れる理由の文章4択。正解は「どちら側を捨てるかの判断が、数字が小さい順に並んでいることを前提にしているから」。
  - 復習先は全問フェーズ4のフレーム（新しいリストの答え合わせは作らない）。Parsons の復習はフェーズ4の全18フレーム。
- `consolidation.types.ts`: 共通 diagnostic-check 形式に、場面（共通配列基盤の形）と正誤の解説文を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BinarySearchConsolidationCanvas.tsx`: 場面の表示とタップ回答（理由は留保）。描画は共通 `ArrayDrawing` へ委譲し、回答ボタンはフェーズ3と同方式でマスへ重ねる。
- `BinarySearchConsolidationPreview.tsx`: バブルソートフェーズ6と同じ画面構成（診断スコア、論点ごとの結果、任意復習、embedded / onComplete / onNext 接続ポート）。進行・採点は共通エンジンの現行統一仕様（回答では進まない／初回回答で結果確定／正解後は入力ロック／ソフトゲート）。
- 単品プレビューとして `front/src/app/learning-preview/[contentId]/page.tsx` に `binary-search-consolidation` を登録した。
- モジュール README（`front/src/features/learning/binary-search/consolidation/README.md`）を新設した。

## 検証

- `npm run verify:binary-search-consolidation`（新規）: 基準データ §2 の参照コード手順を独立に再実装したトレースと共有の組み立て（`binarySearchProbes`）の一致、Q1 の場面・候補・正解と転移トレースの照合（場面が単元盤面型スナップショットの正規写像 `toArrayBars` と一致することも固定）、Q2 の正解の裏づけと誤答3件の反証（比較列 19 → 31 → 25、結果 -1、最後の候補は 25）、Q4 の反証（未整列では真ん中 42 と比べて右側を捨て、位置3の 7 が二度と調べられないこと）、Parsons の行集合・正解順序・実描画（インデント保持）、実描画の回答ボタンと入力ロック、共通エンジンの進行・ソフトゲート・初回診断、Parsons 回答の検証（不完全・重複の拒否、隣接入れ替えはすべて不正解）、壊れたコンテンツの拒否、プレビュー登録を確認する。
- 既存の `verify:binary-search-motivation`、`verify:binary-search-execution`、`verify:binary-search-check`、`verify:binary-search-code-mapping`、`verify:binary-search-code-check`、`verify:learning-player`、front の `typecheck`（tsc --noEmit）、新規ファイルの `lint`、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **Parsons の行数（8行）**: 基準データ §3 フェーズ6は「主要 6〜7 行に絞る」とするが、6〜7行にすると初期化（lo / hi の出所）と片側の分岐のどちらかを欠き、並べ替えの対象として流れが切れるため、繰り返しの中の流れを担う主要8行（関数定義・while・mid 計算・一致判定・return mid・elif・lo の更新・return -1）にした。外したのは初期化の2行（範囲の両端はフェーズ4・5で確認済み）と、elif 側と対称な else 側の2行（捨てる判断は左側で代表）。残した8行はすべて順序が意味を持ち、初期化を外したため順序自由な行（初期化2行の入れ替え可否）も生じない。基準データの行数指定との差分として明示する。
- **場面を共通配列基盤の形で持つこと**: バブルソートフェーズ6に倣い場面は `ArrayBarsCanvasState` とした。不在ケース（探す値が盤面に無い）と未整列リストは単元盤面型の検証（対象が値に含まれ・小さい順であること）を満たさず、単元盤面型では場面を表せないためである。あわせて、フェーズ3の `BinarySearchCheckCanvas` は単元盤面型専用なので流用せず、同じ描画・タップ方式で `BinarySearchConsolidationCanvas` を新設した。Q1 の場面だけは単元盤面型の開始スナップショットを検証し、正規写像と一致することを検証スクリプトで固定して、意味のずれを防いでいる。
- **Q2 の場面の時点**: 不在ケースの場面は「最後の比較」（範囲が位置4の 1 個に絞られ、25 を見ている）状態にした。範囲が空になった後の盤面は過程が見えず、正解文（最後の1個まで絞っても無い）とも対応しないため、空になった結果は選択肢と解説文で示す。
- **Q4 のフィードバックの具体例**: 基準データは Q4 の対象値を定めていないため、正解時の解説に「7 を探すと、真ん中の 42 と比べて右側を捨て、位置3の 7 が二度と調べられない」という具体例を補った。この挙動は実行記録（未整列リストで 7 を探すと -1）で検証済みである。
