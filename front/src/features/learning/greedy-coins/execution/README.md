# 貪欲法（硬貨問題）「動きの説明」

- 目的・適用範囲: Issue #382の11ステップを単品で操作する。状態: 現行。最終確認日: 2026-11-11。
- 正本: [貪欲法（硬貨問題）基準データ§3フェーズ2](../../../../../../docs/concept/greedy-coins-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/greedy-coins-phase2-382.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/greedy-coins-execution を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。主教材786円を硬貨1枚ずつ選んで払う全過程（導入→500・100・100・50・10・10・10・5・1の9回の選択→まとめ）を、検証済みトレースで再生する。段階名は「動きの説明」。選んでいる額面は処理中の青、通過した額面はグレー、まだ先の額面はベージュで示し、最後のステップで方法の名称（貪欲法）を付ける。

- `execution.content.ts`: キャプション・完全スナップショット。盤面は `../greedyCoins.ts` の実行記録（選択列）から組み立て、手書きしない。ステップIDは `introduce` / `select-<何枚目か>` / `summary`。
- `execution.types.ts`: 硬貨の盤面（`../figure/greedyCoins.types.ts`）に、このステップで選んだ硬貨（`selectedCoin`）を足した Canvas 型と検証。選んだ硬貨はトレイの最後の1枚と、その額面の current 状態と一致しなければならない。
- `GreedyCoinsExecutionCanvas.tsx`: 盤面を figure の Canvas 形へ戻し、`../figure/GreedyCoinsDrawing.tsx` へ描画を委譲する。
- `GreedyCoinsExecutionPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。共通プレイヤーの endAction が onComplete につながる。

検証: `npm run verify:greedy-coins-execution`。硬貨の実行記録は`../greedyCoins.ts`、盤面の型・検証・寸法・描画は`../figure/`を参照する。フェーズ3はステップIDと canvas をそのまま問いの図に参照できる（例: `select-3` は500・100・100を使い終わり残額86になったところで、フェーズ3の場面になる）。フェーズ4は同じスナップショットへコード対応を付加する。
