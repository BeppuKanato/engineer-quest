# 棒倒し法「導入」

- 目的・適用範囲: Issue #206の7場面を単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [棒倒し法基準データ§3](../../../../../../../docs/concept/wall-extension-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/wall-extension-phase1-206.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/wall-extension-motivation を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。完成迷路は9×9（主教材の検証済みトレース）と7×7（同じ作り方の別例）。段階名は「導入」。用語「棒倒し法」はフェーズ1では出さない。最後の「動きの説明へ進む」は未接続で、単品内で完結する。

- `motivation.content.ts`: キャプション・完全スナップショット・用語表。
- `motivation.types.ts`: 共通グリッド型への出口の追加と検証。
- `WallExtensionMotivationCanvas.tsx`: 共通グリッド描画への出口ボタンの重ね方。
- `WallExtensionMotivationPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（#214）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete）を持ち、未指定なら単品ページとして動く。最終場面の出口ボタンが onComplete につながる。

検証: `npm run verify:wall-extension-motivation`。迷路データの組み立て（外周＋柱＋伸長）は`../wallExtensionMaze.ts`、グリッドの型・検証・描画は`player/mazeGrid.types.ts`・`player/mazeGridGeometry.ts`・`player/MazeGridDrawing.tsx`を参照する。壁の色は playerTokens に専用の濃色が無いため、最濃のニュートラル色である text を使っている（実施記録の留保参照）。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
