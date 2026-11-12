# 二分探索「動きの説明」

- 目的・適用範囲: Issue #287の11ステップを単品で操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [二分探索基準データ§3フェーズ2](../../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/binary-search-phase2-287.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-execution を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。主教材 [3, 7, 12, 19, 25, 31, 42] から 25 を探す全過程（全体提示→範囲の提示→真ん中 19 を見て左を捨てる→真ん中 31 を見て右を捨てる→残り1個の 25 を見て発見→まとめ）を、検証済みトレースで再生する。段階名は「動きの説明」。範囲外（捨てた部分）は完了グレー、中央は処理中の青、発見セルは処理中の青に強調リングを重ねて示す。

- `execution.content.ts`: キャプション・完全スナップショット。盤面は `../binarySearch.ts` の実行記録（probes）から組み立て、手書きしない。ステップIDは `probe-<何回目の比較か>-mid` / `probe-<何回目>-drop-left|right` / `range-after-drop-left` / `range-single` など。
- `execution.types.ts`: 二分探索の盤面型（セル状態 discarded / in-range / center / found、lo / hi / mid、探す値）と検証。フェーズ3〜7とトレース変換はこの盤面型を再利用する。
- `BinarySearchExecutionCanvas.tsx`: 盤面を共通配列基盤の形（cellStatuses 拡張）へ変換し、`player/ArrayDrawing` へ描画を委譲する。
- `BinarySearchExecutionPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。共通プレイヤーの endAction が onComplete につながる。

検証: `npm run verify:binary-search-execution`。探索の実行記録は`../binarySearch.ts`、配列の型・検証・描画は`player/arrayBars.types.ts`・`player/arrayBarsGeometry.ts`・`player/ArrayDrawing.tsx`を参照する。フェーズ3はステップIDと canvas をそのまま問いの図に参照できる（例: `range-after-drop-left` は1回目の比較で左を捨てた直後の状態で、フェーズ3の場面になる）。フェーズ4は同じスナップショットへコード対応を付加する。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
