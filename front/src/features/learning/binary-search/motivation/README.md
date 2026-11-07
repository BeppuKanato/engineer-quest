# 二分探索「導入」

- 目的・適用範囲: Issue #286の6場面を単品で操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [二分探索基準データ§3フェーズ1](../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/binary-search-phase1-286.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-unit を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。場面は主教材 [3, 7, 12, 19, 25, 31, 42] から 25 を探す問題提示に始まり、1〜100 の数当てゲームで「真ん中を聞くと候補の半分が消える」体験と、100 個でも 7 回で当たる件数列を見せ、最後に主教材の予告と出口を置く。段階名は「導入」。用語「二分探索」「インデックス」はフェーズ1では出さない。最後の「動きの説明へ進む」は未接続で、単品内で完結する。

- `motivation.content.ts`: キャプション・完全スナップショット・用語表。
- `motivation.types.ts`: 場面ごとの図（配列／数当ての帯／半分の件数列）の型と検証、出口の追加。
- `BinarySearchMotivationCanvas.tsx`: 配列の場面は共通配列描画へ委譲し、数当ての帯と件数列は導入専用の図として描く。出口ボタンの重ね方は他単元フェーズ1と同じ。
- `BinarySearchMotivationPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete）を持ち、未指定なら単品ページとして動く。最終場面の出口ボタンが onComplete につながる。

検証: `npm run verify:binary-search-motivation`。配列データと探索の実行記録は`../binarySearch.ts`、配列の型・検証・描画は`player/arrayBars.types.ts`・`player/arrayBarsGeometry.ts`・`player/ArrayDrawing.tsx`を参照する。単体プレビューの入口は`front/src/app/learning-preview/binary-search-unit/page.tsx`で、フェーズ2以降はこのページへ追加していく。
