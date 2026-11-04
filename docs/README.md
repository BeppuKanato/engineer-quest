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
| [concept/learning-player-ui.md](concept/learning-player-ui.md) | 正本 | 学習プレイヤー UI の実装定義（画面構成と占有率、色とテキストの規則、操作系の配置、アニメーション） |
| [学習プレイヤーの土台](../front/src/features/learning/player/README.md) | 現行 | Issue #68 の再生契約、局所トークン、仮教材と単品プレビューの確認方法 |
| [BFS フェーズ1](../front/src/features/learning/bfs/motivation/README.md) | 現行 | Issue #69 の場面列、用語表、単品確認方法、サンプル・指針との判断点 |

従来フロー（Course / Mission / Activity）の学習設計文書、概念・設計検討文書、コース設計記録は、2026-11-04 の判断で削除した。従来フローの現在の挙動と教材内容は、実行コード、Prisma schema、seed を正とする。

## 実装報告

| 文書 | 状態 | 用途 |
| --- | --- | --- |
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
