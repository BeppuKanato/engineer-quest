# バブルソート「動きの説明」

- 目的・適用範囲: Issue #228の16ステップを単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [バブルソート基準データ§3](../../../../../../docs/concept/bubble-sort-unit-baseline.md)（取り込みは Issue #226。未取り込みの間は承認済み原本に従う）、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/bubble-sort-phase2-228.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/bubble-sort-execution を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。主教材 [4, 2, 5, 1, 3] の全過程（初期状態→比較10回→各周の終わりの確定4回→完成）を、検証済みトレースで再生する。段階名は「動きの説明」。比較ステップでは比べたペアを青く塗り、入れ替わった2マスをフォーカス青の内側の枠で示す。各周の終わりで右端の1マスが完了グレーに確定する。

- `execution.content.ts`: キャプション・完全スナップショット。配列は `../bubbleSort.ts` の実行記録から組み立て、手書きしない。ステップIDは `compare-<何周目>-<比べる位置 j>` / `pass-end-<何周目>`。
- `execution.types.ts`: 共通配列型をそのまま使い、highlight が比べたペアと一致することと比較外では highlight を使わないことを追加検証する。
- `BubbleSortExecutionCanvas.tsx`: 共通配列描画への委譲。
- `BubbleSortExecutionPreview.tsx`: 共通LearningPlayerへの単品入口。保存や計装ポートは持たない。

検証: `npm run verify:bubble-sort-execution`。配列データの組み立ては`../bubbleSort.ts`、配列の型・検証・描画は`player/arrayBars.types.ts`・`player/arrayBarsGeometry.ts`・`player/ArrayDrawing.tsx`を参照する。フェーズ3はステップIDと canvas をそのまま問いの図に参照できる（例: `compare-1-1` は1周目の2回目の比較まで終えた状態で、フェーズ3の場面になる）。フェーズ4は同じスナップショットへコード対応を付加する。
