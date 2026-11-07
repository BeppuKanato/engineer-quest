# 二分探索 フェーズ3（動きの確認問題）（Issue #288）

目的: 二分探索単元のフェーズ3（動きの確認問題）を、基準データ §3 フェーズ3の連結2問（主教材の1回目の比較で左側を捨てた直後の続きを学習者が決める）に沿って実装する。設計は基準データ（docs/concept/binary-search-unit-baseline.md §3、正本）と教材指針（フェーズ3: 連結2問・ソフトゲート・初回回答で判定・正解した問題は入力ロック）に従う。最終確認日: 2026-11-07。

## 実装

- `front/src/features/learning/binary-search/check/check.content.ts`: 設問データ。場面はフェーズ2のステップをIDで参照し、盤面を複製しない。正解は `../binarySearch.ts` の実行記録（probes）から導き、基準データ §3 の確定事項と一致することをモジュール読み込み時に検証する。
  - Q1 `next-center`（タップ）: 場面は `range-after-drop-left`（lo=4 / hi=6、インデックス3の 19 は確認済みで範囲外）。回答対象は残った範囲の位置4〜6のみで、正解は2回目の比較の真ん中である位置5（値31）。
  - Q2 `range-after-compare`（文章4択）: 場面は `probe-2-mid`（新しい真ん中 31 を見たところ）。選択肢は「右側を捨てて、範囲は 4 だけになる（正解）／左側を捨てて、範囲は 6 だけになる／範囲は変わらない／探索が終わる」で、数値（4 / 6）は実行記録から導く。
  - 完了場面は `range-single`（範囲が位置4だけになった状態）。
  - 正誤の文は設問ごとの解説（`correctFeedback` / `incorrectFeedback`、既存の answerFeedbackState の仕組み）で出す。誤答時は、Q1 では真ん中の決め方（残った範囲の両端から真ん中を求める）、Q2 ではどちら側を捨てるか（比べた値より大きい側＝右側を捨て、小さい側だけが残る）に言及する（基準データ §3 の指定）。
- `front/src/features/learning/assessment/assessment.ts`（加算拡張）: タップ設問と文章選択肢の設問を1つの連結セッションに混在させる新種別 `concept-check` を追加した。進行・完了（全問1回以上回答＋最後まで進む）・初回回答の集計は全形式共通の規則をそのまま使う。既存種別の検証規則は変えず、choice 設問を許可する種別に `concept-check` を足しただけ（詳細は留保）。
- `BinarySearchCheckCanvas.tsx`: フェーズ2と同じ盤面変換（`../execution/BinarySearchExecutionCanvas` の `toArrayBars` を export 化）＋共通配列描画の上に、棒の列へ回答ボタンを重ねる。44px 未満では中心から広げる、破線リング＋タップアイコン（`answerCueSx`）の示し方はバブルソートフェーズ3と同じ。
- `BinarySearchCheckPreview.tsx`: 他単元のフェーズ3と同じ画面構成（キャプション、復習モーダル、embedded / onComplete による要約通知）。Q2 では盤面にタップ対象を置かず、選択肢ボタンを盤面の下に並べる（フェーズ6の選択肢ボタンと同じ見た目・ `data-choice-id` 付き）。
- 単体プレビュー: `front/src/app/learning-preview/[contentId]/page.tsx` に `binary-search-check` として登録した。

## 検証

- `npm run verify:binary-search-check`（新規）: 基準データ §3 の確定事項（場面・連結2問・正解）と教材の一致、実行記録（probes）との独立照合、場面がフェーズ2ステップ canvas と参照一致すること（複製でないこと）、19 のセルが範囲外で回答対象から外れていること、設問ごとの正誤メッセージ（誤答文が真ん中の決め方／捨てる側に言及すること）、共通エンジンの進行（回答では進まない・ソフトゲート・初回回答の記録・古い画面からの回答の遮断）、実描画（候補ごとの回答ボタンと aria-label、正解後のロック、Q2 場面と完了盤面にボタンが無いこと）、プレビューの実コールバック（復習を開いても記録が変わらないこと、選択肢ボタンのロック、完了キャプション）、[contentId] 登録を確認する。
- 既存の `verify:binary-search-motivation`、`verify:binary-search-execution`、`verify:learning-player`、エンジン拡張の回帰確認として `verify:bubble-sort-check`、`verify:answer-feedback`、front の `typecheck`（tsc --noEmit）、新規・変更ファイルの `lint`、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **出題エンジンへの `concept-check` 追加（要確認）**: 基準データ §3 は Q2 を文章4択と定めるが、現行エンジンでは choice 設問はフェーズ6の `diagnostic-check` 専用で、フェーズ3の `node-tap-check` には混在できなかった。`diagnostic-check` をフェーズ3に使う案は、完了時に診断閲覧イベント（diagnosis_view）が発火し、フェーズ6の診断と意味が混ざるため不採用とし、フェーズ3用の新種別を足した。既存単元のコンテンツ・検証への影響はない（回帰確認済み）が、エンジン拡張そのものの妥当性は確認をお願いしたい。
- **Q2 に前提（requires）を付けられない**: ChoiceQuestion の契約では `requires` が null 固定のため、バブルソートフェーズ3の Q2 のような「Q1 の正解を前提とする」機械表現ができない。連動は、問題文で前提を明記し（「31 と 25 を比べた後」）、場面を真ん中 31 のステップに置くことで表した。教材指針の「問2は問1の要素について出題する（問1に正解していなくても出題する）」はこの形で満たす。
- **Q1 の回答対象は残った範囲のみ**: 捨てた部分（19 を含む位置0〜3）はタップできない。バブルソート（未確定範囲のみ）・穴掘り法（候補のみ）の先例に倣った。
- **Q2 の復習ステップは3つ**: `probe-2-mid` → `probe-2-drop-right` → `range-single` と、比べる→捨てる→範囲が確定する因果の連鎖をそのまま見せる。他単元のフェーズ3は2ステップだが、ここでは答えの状態（範囲が1個）まで含めた。
