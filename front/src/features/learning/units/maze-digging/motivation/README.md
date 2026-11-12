# 穴掘り法「導入」

- 目的・適用範囲: Issue #257の7場面を単品で操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [穴掘り法基準データ§3](../../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/maze-digging-motivation を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。完成迷路は9×9（主教材の検証済みトレース）と7×7（同じ作り方の別例）。段階名は「導入」。用語「穴掘り法」はフェーズ1では出さない。最後の「動きの説明へ進む」は単品では未接続で、単品内で完結する。

- `motivation.content.ts`: キャプション・完全スナップショット・用語表。
- `motivation.types.ts`: 共通グリッド型への出口の追加と検証（検証器は単元側の `../mazeDiggingCanvas.ts`）。
- `MazeDiggingMotivationCanvas.tsx`: 共通グリッド描画への出口ボタンの重ね方。
- `MazeDiggingMotivationPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete）を持ち、未指定なら単品ページとして動く。最終場面の出口ボタンが onComplete につながる。

検証: `npm run verify:maze-digging-motivation`。迷路データの生成（参照コードの手続きの実行）は`../mazeDiggingMaze.ts`、グリッドの型・描画・幾何は`player/mazeGrid.types.ts`・`player/MazeGridDrawing.tsx`・`player/mazeGridGeometry.ts`を共有する。状態の意味（processing = 現在の部屋、target = まだ壁の部屋）は棒倒し法と逆のため、検証は共有の `validateMazeGridCanvas` ではなく単元側の `validateMazeDiggingCanvas` で行う。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
