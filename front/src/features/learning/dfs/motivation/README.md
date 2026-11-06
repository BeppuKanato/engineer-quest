# 深さ優先探索「導入」

- 目的・適用範囲: Issue #121の18場面を単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [DFS基準データ§3](../../../../../../docs/concept/dfs-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/dfs-motivation-121.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/dfs-motivation を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。迷路の歩行とグラフの再演はA→B→D→F→E→C。宝はCで初めて表示する。段階名は「導入」。最後の「動きの説明へ進む」は未接続で、再生し直して単品内で完結する。

- `motivation.content.ts`: キャプション・完全スナップショット・用語表。
- `motivation.types.ts`: 型と正本共有・道筋・参照の検証。
- `DfsMotivationCanvas.tsx`: 共通の格子／グラフ描画へ重ねる宝・軌跡とフォルダの実用例。
- `DfsMotivationPreview.tsx`: 共通LearningPlayerへの単品入口。保存や計装ポートは持たない。

検証: `npm run verify:dfs-motivation`。BFSと共有する格子・道筋・現在地の描画は`player/MotivationDrawing.tsx`、グラフは`bfs/bfsGraph.ts`と`player/GraphDrawing.tsx`を参照する。
