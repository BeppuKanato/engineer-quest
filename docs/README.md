# Engineer Quest ドキュメント索引

この索引は、`docs/` 配下の全ドキュメントの状態と使い分けを示す。作業前にリポジトリルートの `AGENTS.md` を読み、ここで対象文書の状態を確認すること。

- 分類確認日: 2026-11-04
- 分類の基準コミット: `develop` `b37a67e27aa4eec5511c636fa1b363b92cc1afa0`
- 状態の意味:
  - **正本**: その領域の判断に使う現行の基準。
  - **現行**: 現在も使う手順・仕様。
  - **従来フロー専用**: Course / Mission / Activity で構成する現行アプリの保守・作成にだけ使う。新フローへ流用しない。
  - **検討資料**: 設計判断の材料。実装済み状態はコードと schema で確認する。
  - **記録**: 特定時点の設計・実装の経緯。現在の仕様判断には直接使わない。
  - **旧版**: 現在の目的や設計を表さない履歴資料。

## 実装ルール・運用

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [development-rules.md](development-rules.md) | 正本 | フロント、バック、API、Prisma、seed、検証の実装ルール |
| [development-cloud-run.md](development-cloud-run.md) | 現行 | develop 用 Cloud Run の構成、デプロイ、確認手順 |

## 学習設計

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [concept/learning-materials-v2.md](concept/learning-materials-v2.md) | 正本（要約） | 7フェーズ新フローの確定事項と実装上の含意。全文の正本は Google Drive の教材指針 |
| [concept/course-creation-guidelines.md](concept/course-creation-guidelines.md) | 従来フロー専用 | 従来の Course / Mission / Activity 教材の作成・保守基準 |
| [concept/visual-data-format.md](concept/visual-data-format.md) | 従来フロー専用 | 従来 Activity の `MissionActivity.content` に格納する Visual JSON 形式 |

## 概念・設計検討

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [concept/game-elements-design.md](concept/game-elements-design.md) | 検討資料 | ゲーミフィケーション要素の候補、過去の実装状況、方針の対応表。実装済み確認はコードで行う |
| [concept/learning-experience-concept.md](concept/learning-experience-concept.md) | 旧版 | Web アプリ開発の授業補助として構想した初期コンセプトの記録 |

## コース設計記録

次は、従来フローで実装された現行コースの設計判断とレビュー記録である。新フローの単元設計には直接使わない。

| 文書 | 状態 |
| --- | --- |
| [course-designs/course-algorithm-breadth-first-search-v1.md](course-designs/course-algorithm-breadth-first-search-v1.md) | 記録 |
| [course-designs/course-algorithm-breadth-first-search-v1-review.md](course-designs/course-algorithm-breadth-first-search-v1-review.md) | 記録 |
| [course-designs/course-algorithm-depth-first-search-v1.md](course-designs/course-algorithm-depth-first-search-v1.md) | 記録 |
| [course-designs/course-algorithm-depth-first-search-v1-review.md](course-designs/course-algorithm-depth-first-search-v1-review.md) | 記録 |
| [course-designs/course-algorithm-kmp-v1.md](course-designs/course-algorithm-kmp-v1.md) | 記録 |
| [course-designs/course-algorithm-merge-sort-v1.md](course-designs/course-algorithm-merge-sort-v1.md) | 記録 |
| [course-designs/course-algorithm-merge-sort-v1-review.md](course-designs/course-algorithm-merge-sort-v1-review.md) | 記録 |
| [course-designs/course-algorithm-selection-sort-v1.md](course-designs/course-algorithm-selection-sort-v1.md) | 記録 |
| [course-designs/course-algorithm-selection-sort-v1-review.md](course-designs/course-algorithm-selection-sort-v1-review.md) | 記録 |

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
