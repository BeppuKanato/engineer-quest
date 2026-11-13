# Engineer Quest 開発ガイド

この文書は、Engineer Quest を変更する人間と AI が最初に読む入口である。個別文書の探し方、文書同士が競合したときの優先順位、実装と運用の最低限の約束をここに集約する。

## 1. プロジェクトの目的

Engineer Quest は、プログラミングとアルゴリズムの学習を支援するゲーミフィケーション型 Web アプリケーションであり、HEXAD の動機づけ特性を用いたパーソナライズド・フィードバックを検証する研究基盤でもある。

現在は移行期にある。

- 現行の本番・開発環境では、Course / Mission / Activity を中心とする従来フローが動作している。
- 新しい学習体験として、1つのアルゴリズム単元を7フェーズで学ぶ新フローを設計済みであり、今後、既存アプリ内へ段階的に実装する。
- ゲーミフィケーション要素、実験条件の割り当て、学習ログ、フィードバックは新フローでも対象であり、削除対象ではない。

## 2. リポジトリ構成

| 場所 | 役割 |
| --- | --- |
| `front/` | Next.js フロントエンド |
| `back/` | Express + TypeScript バックエンド |
| `back/prisma/` | Prisma schema、migration、seed |
| `docs/` | 設計、実装ルール、運用手順、図、実装報告 |
| `.github/workflows/` | CI と Cloud Run デプロイ |

## 3. 最初に読む文書

作業内容に応じて、次を順に確認する。

1. この `AGENTS.md`
2. `docs/README.md`（全ドキュメントの索引と状態）
3. `docs/development-rules.md`（実装の型と検証ルール）
4. 作業領域に応じて、次の正本または要約を読む。
   - 新フロー教材: `docs/concept/learning-materials-guideline.md`（教材指針全文）と `docs/concept/learning-materials-v2.md`（要約）。プレイヤー UI の実装は `docs/concept/learning-player-ui.md`（UI 定義）も併せて読む
   - フィードバック v1: Google Drive の「フィードバック要件_v1」、`docs/feedback-v1-implementation.md`
   - フロントエンド構成: `docs/frontend-architecture.md`（Bulletproof Reactの採用範囲・依存方向・既存例外）。公式原文は `docs/references/bulletproof-react/` の固定版を参照し、外部文書だけで既存仕様を上書きしない
   - デプロイと開発環境: `docs/development-cloud-run.md`
   - 従来フローの教材・画面: 設計文書は残していない。`back/prisma/seedData/` の seed、`back/src/learning/activity-content/` の schema と registry、`front/src/app/mission/[missionId]/README.md` のコード案内を実行仕様として確認する
   - ゲーミフィケーション: 設計文書は残していない。実装済みかどうかはコードと Prisma schema で確認する

## 4. 文書と実装の優先順位

競合した場合は、次の原則で判断する。

1. ユーザーの現在の指示と、対象 PR / Issue に書かれた決定が最優先である。
2. 学習設計と研究設計は、承認日が最も新しい正本に従う。新フローについては旧来の Mission / Activity 前提の文書より、新しい教材指針を優先する。
3. 現在の実装事実は、願望や計画ではなく `back/prisma/schema.prisma` と実行コードを正とする。
4. 旧文書は、冒頭または `docs/README.md` に書かれた適用範囲内でのみ使う。
5. 正本同士が矛盾し、実装結果が変わる場合は、勝手に片方を選ばず、PR で矛盾点を明示する。

特に次を混同しない。

- コードがマージ・デプロイされたことと、DB migration / seed が適用されたことは別である。
- 実験条件 A / B の意味は、表示名や推測ではなく `ExperimentAssignment` と正本の条件定義で確認する。
- 設計文書の「実装方針」「未実装」は、現在の実装済み状態を保証しない。

## 5. 作業の進め方

- 作業は原則として `develop` から切った専用ブランチで行う。
- ブランチ名は既存の慣例に合わせ、`feat/<topic>`、`fix/<topic>`、`docs/<topic>` など、目的が分かる名前を使う。
- コミットは目的単位で小さく分け、メッセージに変更意図を書く。
- PR の宛先は原則 `develop` とする。PR には目的、変更範囲、実行した検証、未実施の検証、DB 適用の要否を書く。
- レビューとマージはユーザーの判断に従う。明示依頼がない限り、自分の PR を自分でマージしない。
- `main` への直接 push、履歴の書き換え、本番環境への操作は、明示的な依頼がある場合だけ行う。
- 既存の未コミット変更や別ブランチの作業を上書きしない。作業ツリーが汚れている場合は、その変更を保持したまま進める方法を選ぶ。

## 6. 実装の原則

詳細は `docs/development-rules.md` に従う。要点だけ再掲する。

- 新しい画面や API は、既存の近い実装を探し、その責務分割と命名をまず踏襲する。
- バックエンドの新規コードは `router -> controller -> service` を基本とし、永続化は service から `back/src/lib/prisma.ts` の `prisma` を使う。
- フロントエンドの API 呼び出しは `front/src/api/` のクライアントと `front/src/lib/fetcher.ts` を経由し、画面コンポーネントへ HTTP の詳細を持ち込まない。
- 学習機能の画面とロジックは `front/src/features/learning/` を優先し、ルート配下には画面の入口と薄い構成だけを置く。
- 新規コードでは `olds/` 配下を雛形にしない。`olds/` は履歴参照専用である。
- 既存コードの広範囲な整形や無関係なリファクタリングを同じ PR に混ぜない。
- 秘密情報、接続文字列、API キーをコード、ドキュメント、PR、チャットへ書かない。

## 7. DB、seed、デプロイに関する注意

- Cloud Run の CD はコードをデプロイする。DB migration と seed は自動実行されない。
- seed だけを変更した PR は、マージやデプロイだけでは画面に反映されない。対象 DB への適用が別途必要である。
- DB を変更する前に、対象が local / dev / production のどれかを必ず明示する。
- 学習進捗を保持すべき環境では、通常 seed の破壊的同期を前提にせず、`seed:preserve` と保持ポリシーを確認する。
- Prisma schema を変えたら migration を同じ変更に含め、生成物や既存データへの影響を PR に書く。

## 8. 検証の原則

- 変更範囲に応じ、front / back の lint、型チェック、build を実行する。
- 教材 seed を変えたら `back` の seed validation と対象コースの verify を実行する。
- フィードバック、実績、コレクションなど、対応する `verify:*` / `test:e2e:*` がある領域では、変更前に既存スクリプトを確認する。
- DB や外部サービスが必要で実行できない検証は、失敗として隠さず、未実施として PR に書く。
- CI の結果だけで DB 適用や実画面の反映を主張しない。

## 9. ドキュメント保守

- 設計や運用ルールを変えたら、同じ PR で関連ドキュメントと `docs/README.md` の状態を更新する。
- 新しいドキュメントには、目的、適用範囲、最終確認日、正本へのリンクを冒頭に置く。
- 大きな実装では、対象コミット、参照した正本、実装内容、未実装範囲を記した実装報告を `docs/` に残す。
- 古くなった文書は、無言で残さず、旧版であることと現在の正本を明示する。完全に不要になった文書だけを削除し、判断理由を PR に書く。
