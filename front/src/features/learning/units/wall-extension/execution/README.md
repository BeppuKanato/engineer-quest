# 棒倒し法「動きの説明」

- 目的・適用範囲: Issue #207の13ステップを単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [棒倒し法基準データ§3](../../../../../../docs/concept/wall-extension-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/wall-extension-phase2-207.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/wall-extension-execution を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。9×9主教材の生成過程（空の盤面→外周→柱9本→伸長9件→完成）を、検証済みトレース（choices [3,1,2,0,2,0,2,2,0]）で再生する。段階名は「動きの説明」。伸長ステップでは処理した柱を青く塗り、今回壁になったマスをフォーカス青の実線の枠で示す。4件目（真ん中の段の最初の柱）のキャプションで「上の段以外の柱は上には伸ばさない」規則に触れる。

- `execution.content.ts`: キャプション・完全スナップショット。盤面は `../wallExtensionMaze.ts` の組み立てで作り、手書きしない。
- `execution.types.ts`: 共通グリッド型をそのまま使い、highlight が壁マスであることと target を使わないことを追加検証する。
- `WallExtensionExecutionCanvas.tsx`: 共通グリッド描画への委譲。
- `WallExtensionExecutionPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（#214）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。onComplete 指定時は共通プレイヤーの endAction で次へ進む。

検証: `npm run verify:wall-extension-execution`。グリッドの型・検証・描画は`player/mazeGrid.types.ts`・`player/mazeGridGeometry.ts`・`player/MazeGridDrawing.tsx`を参照する。フェーズ3はステップIDと canvas をそのまま問いの図に参照できる（例: `extend-2-4` は4本目まで伸ばした状態で、フェーズ3の場面になる）。フェーズ4は同じスナップショットへコード対応を付加する。
