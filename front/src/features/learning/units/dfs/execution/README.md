# DFS「動きの説明」単品プレビュー

- 目的・適用範囲: Issue #122。DFSの17ステップを共有プレイヤーで再生する単品教材。
- 最終確認日: 2026-11-06
- 正本: [DFS基準データ §2](../../../../../../../docs/concept/dfs-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI](../../../../../../../docs/concept/learning-player-ui.md)

URL: `/learning-preview/dfs-execution`（ローカル確認: `http://localhost:3122/learning-preview/dfs-execution`）。

`execution.content.ts`は基準書と同じID・1文・17個の完全スナップショットを持つ。`execution.types.ts`はoperation・処理中・スタック・訪問順・完了集合と描画状態の整合性を検証する。`DfsExecutionCanvas`が図、スタック、訪問順を同期表示し、`DfsExecutionPreview`は接続・保存ポートなしで`LearningPlayer`へ渡す。

グラフ・座標・辺・隣接順・導入の格子は`../../graphs/searchGraph.ts`がBFS/DFS共通の正本。距離層は表示しない。スタックは左が底、右が末尾で、右端に「次に取り出す」を常時示す。処理中=青、スタック内=ベージュ、完了=グレー。出し入れと状態変化は600ms、reduced-motionでは0ms。自動送りは3500ms。

確認手順:

1. 再生で17場面を通す。前後ボタン、位置スライダー、Home/End、左右キーでも図と文章が同期する。
2. 13/17でFが青、Dがグレー、Eがスタック内のベージュ、スタックが`C,E`であることを確認する。
3. 次へ進み14/17にすると、Eが末尾から図へ移り青になる。Fはグレー、スタックは`C`、訪問順は`A→B→D→F→E`になる。前へ戻して同じ状態を復元できる。
4. 17/17では全ノードがグレー、スタックは空、訪問順は`A→B→D→F→E→C`になる。

検証: `npm run verify:dfs-execution`。Python 3が必要（既定`python3`、別名の場合は環境変数`PYTHON`を指定）。基準書§7.1のコード本文を読み、表で省略されたインデントのみ復元して実CPythonで実行する。トレーサーは関数を変更せず行イベントを観測し、基準書§2.3と同じ粒度で17場面を採取する。全状態をトレース・基準書§2.2の双方と照合し、逆順復元、不正状態の拒否、共有参照、色、モーション、単品の責務も検証する。

アプリ組み込み、進捗・学習ログ保存、他段階への接続は対象外。基本グラフではEから新しい枝へ潜り直す場面がないという基準書§1.4の留保は維持する。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
