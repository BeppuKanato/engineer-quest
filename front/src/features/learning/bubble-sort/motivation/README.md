# バブルソート「導入」

- 目的・適用範囲: Issue #227の7場面を単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [バブルソート基準データ§3・§4](../../../../../../docs/concept/bubble-sort-unit-baseline.md)（取り込みは Issue #226。未取り込みの間は承認済み原本に従う）、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/bubble-sort-phase1-227.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/bubble-sort-motivation を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。場面は主教材 [4, 2, 5, 1, 3] の1周目（最初の交換、5 が右へ動く交換、1周の終わり）を使い、最後に完成形を見せる。段階名は「導入」。用語「バブルソート」はフェーズ1では出さない。最後の「動きの説明へ進む」は未接続で、単品内で完結する。

- `motivation.content.ts`: キャプション・完全スナップショット・用語表。
- `motivation.types.ts`: 共通配列型への出口の追加と検証。
- `BubbleSortMotivationCanvas.tsx`: 共通配列描画への出口ボタンの重ね方。
- `BubbleSortMotivationPreview.tsx`: 共通LearningPlayerへの単品入口。保存や計装ポートは持たない。

検証: `npm run verify:bubble-sort-motivation`。配列データの組み立て（参照コードと同じ手順の実行記録）は`../bubbleSort.ts`、配列の型・検証・描画は`player/arrayBars.types.ts`・`player/arrayBarsGeometry.ts`・`player/ArrayDrawing.tsx`を参照する。
