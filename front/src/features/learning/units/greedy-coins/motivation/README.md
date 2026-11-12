# 貪欲法（硬貨問題）「導入」

- 目的・適用範囲: Issue #381の7場面を単品で操作する。状態: 現行。最終確認日: 2026-11-11。
- 正本: [貪欲法（硬貨問題）基準データ§3フェーズ1・§4](../../../../../../../docs/concept/greedy-coins-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/greedy-coins-figure-381.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/greedy-coins-motivation を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。場面は786円を小さい硬貨だけで払う負担の提示に始まり、6種類の硬貨、大きい硬貨から使う発想（500円は1枚で済む）、9枚で払える圧縮版の実演、残りに合わせて次に使える一番大きい硬貨を選び直す感覚、単元の見通し、主教材の予告と出口を置く。段階名は「導入」。用語「貪欲法」はフェーズ1では出さない。最後の「動きの説明へ進む」は未接続で、単品内で完結する。

- `motivation.content.ts`: キャプション・完全スナップショット・用語表。トレイは `../greedyCoins.ts` の実行記録から組み立てる。
- `motivation.types.ts`: 硬貨の盤面（`../figure/greedyCoins.types.ts`）に出口を足した Canvas 型と検証。
- `GreedyCoinsMotivationCanvas.tsx`: 描画は `../figure/GreedyCoinsDrawing.tsx` へ委譲し、出口ボタンの重ね方だけを持つ。
- `GreedyCoinsMotivationPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete）を持ち、未指定なら単品ページとして動く。最終場面の出口ボタンが onComplete につながる。

検証: `npm run verify:greedy-coins-motivation`。硬貨の実行記録は`../greedyCoins.ts`、盤面の型・検証・寸法・描画は`../figure/greedyCoins.types.ts`・`../figure/greedyCoinsGeometry.ts`・`../figure/GreedyCoinsDrawing.tsx`を参照する。プレビューの入口は他単元と同じ`[contentId]`方式（`greedy-coins-motivation`）で登録する。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
