# Engineer Quest ドキュメント索引

この索引は、`docs/` 配下の全ドキュメントの状態と使い分けを示す。作業前にリポジトリルートの `AGENTS.md` を読み、ここで対象文書の状態を確認すること。

- 分類確認日: 2026-11-04
- 分類の基準コミット: `develop` `b37a67e27aa4eec5511c636fa1b363b92cc1afa0`
- 状態の意味:
  - **正本**: その領域の判断に使う現行の基準。
  - **現行**: 現在も使う手順・仕様。
  - **記録**: 特定時点の設計・実装の経緯。現在の仕様判断には直接使わない。

## 実装ルール・運用

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [development-rules.md](development-rules.md) | 正本 | フロント、バック、API、Prisma、seed、検証の実装ルール |
| [development-cloud-run.md](development-cloud-run.md) | 現行 | develop 用 Cloud Run の構成、デプロイ、確認手順 |

## 学習設計

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [concept/learning-materials-guideline.md](concept/learning-materials-guideline.md) | 正本（全文） | アルゴリズム学習教材・汎用設計ガイドラインの全文。編集の原典は Google Drive の文書で、確定した内容を取り込んだもの |
| [concept/learning-materials-v2.md](concept/learning-materials-v2.md) | 要約 | 7フェーズ新フローの確定事項と実装上の含意。全文は `learning-materials-guideline.md` |
| [concept/learning-player-ui.md](concept/learning-player-ui.md) | 正本 | 学習プレイヤー UI の実装定義（画面構成と占有率、色とテキストの規則、操作系の配置、アニメーション、共通グラフの描画数値と等倍比の拡縮） |
| [学習プレイヤーの土台](../front/src/features/learning/player/README.md) | 現行 | Issue #68 の再生契約、局所トークン、仮教材と単品プレビューの確認方法 |
| [BFS フェーズ1](../front/src/features/learning/bfs/motivation/README.md) | 現行 | Issue #69 の場面列、用語表、単品確認方法、サンプル・指針との判断点 |
| [BFS フェーズ2](../front/src/features/learning/bfs/execution/README.md) | 現行 | Issue #70 の19ステップ、フェーズ3・4で使う実行状態契約、単品確認・機械検証と共有グラフの判断点 |
| [BFS フェーズ3](../front/src/features/learning/bfs/check/README.md) | 現行 | Issue #71 の連動2問、共通の進行・回答記録、任意復習、単品確認と検証方法 |
| [BFS フェーズ4](../front/src/features/learning/bfs/code-mapping/README.md) | 現行 | Issue #72 のコード本文・意味ID契約、62フレーム、フェーズ2参照、単品確認とPythonトレース検証 |
| [BFS フェーズ5](../front/src/features/learning/bfs/code-check/README.md) | 現行 | Issue #73 の独立した穴埋め2問、共有コード表示・設問セッション・任意復習、結果と確認手順 |
| [BFS フェーズ6](../front/src/features/learning/bfs/consolidation/README.md) | 現行 | Issue #74 の転移・境界ケース・Parsonsの5問、初回結果のタグ別診断、任意復習とソフトゲート |
| [BFS 視覚的デバッグ](../front/src/features/learning/bfs/trace/README.md) | 現行 | Issue #76 のD1限定トレース・共通キャンバス再生・停止／上限／最終状態と対応範囲 |
| [BFS フェーズ7](../front/src/features/learning/bfs/implementation/README.md) | 現行 | Issue #75／PR #99 の図と距離による5テスト結果・試行版4段階ヒント・全通過リザルトと確認手順 |

従来フロー（Course / Mission / Activity）の学習設計文書、概念・設計検討文書、コース設計記録は、2026-11-04 の判断で削除した。従来フローの現在の挙動と教材内容は、実行コード、Prisma schema、seed を正とする。

## 実装報告

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [bfs-visual-debug-76.md](bfs-visual-debug-76.md) | 記録 | Issue #76 の正準状態比較・D1限定のWorker分離・再生／エラー／最終状態の確認画像 |
| [bfs-implementation-75.md](bfs-implementation-75.md) | 記録 | Issue #75／PR #99 の結果図示・4段階ヒント・タイムアウト分類、実Pyodideの確認画像と環境制約 |
| [bfs-code-check-73.md](bfs-code-check-73.md) | 記録 | Issue #73 の穴埋め2問、共通基盤の再利用、構文・再挑戦・復習の検証と確認画像 |
| [bfs-consolidation-74.md](bfs-consolidation-74.md) | 記録 | Issue #74 の5問と初回診断、PR #96 の図サイズ・Parsonsドラッグ／初期化行交換の修正、独立BFS検証と確認画像 |
| [bfs-parsons-single-list-97.md](bfs-parsons-single-list-97.md) | 記録 | Issue #97 の Parsons 盤面の1リスト直接並び替え化（2リスト方式からの再設計、実行確認は #76 と合わせて判断） |
| [bfs-code-mapping-72.md](bfs-code-mapping-72.md) | 記録 | Issue #72 のコード契約・62フレーム、Pythonトレース検証、PR #93 の可読性・変数差分表示と確認画像 |
| [graph-unify-91.md](graph-unify-91.md) | 記録 | Issue #91 の共通描画・迷路配置、検証結果と同じ画面幅でのフェーズ1・2・3比較 |
| [feedback-v1-implementation.md](feedback-v1-implementation.md) | 記録（現行実装の説明を含む） | フィードバック v1 の基準コミット、参照正本、生成・検証・表示の実装内容。仕様の正本は Google Drive のフィードバック要件 v1 |

## 図

`figures/` の PlantUML は、現行実装を理解するための参考図である。DB 構造は `back/prisma/schema.prisma`、API は実行コードを正とし、図と食い違う場合は図を更新する。

| ファイル | 内容 |
| --- | --- |
| `figures/er-learning-domain.puml` | Prisma schema をもとにした学習ドメインの ER 図 |
| `figures/sequence-auth-and-user-sync.puml` | Firebase 認証とアプリユーザー同期のシーケンス図 |
| `figures/sequence-course-mission-activity-flow.puml` | コース一覧から Mission・Activity 完了までのシーケンス図 |
| `figures/sequence-exam-submit-result.puml` | 確認テストの開始、提出、結果取得のシーケンス図 |
| `figures/component-architecture.puml` | フロントエンド、バックエンド、Firebase、DB のコンポーネント構成図 |
| `figures/state-progress.puml` | ミッション、レッスン、確認テスト難易度ごとの進捗状態図 |
| `figures/activity-learner-journey.puml` | 学習者がアプリを使う一連の流れを示すアクティビティ図 |
| `figures/api-route-map.puml` | バックエンド API ルート一覧 |
| `figures/deployment-local-dev.puml` | ローカル開発環境の配置図 |

### レンダリング

VS Code の PlantUML 拡張など、PlantUML に対応したツールで `.puml` ファイルを開くとプレビューや画像出力ができる。

## ドキュメント保守ルール

- 新しいドキュメントには、目的、適用範囲、状態、最終確認日を冒頭に書く。
- 設計や運用が変わったら、関連ドキュメントとこの索引を同じ変更で更新する。
- 古くなった文書は、旧版であることと現在の正本を冒頭に明示する。完全に不要になった場合だけ削除し、理由を PR に書く。
