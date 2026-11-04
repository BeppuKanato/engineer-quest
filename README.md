# Engineer Quest

プログラミングとアルゴリズムの学習を支援する、ゲーミフィケーション型 Web アプリケーション。HEXAD の動機づけ特性を用いたパーソナライズド・フィードバックの研究基盤でもある。

現在は Course / Mission / Activity で構成する学習フローが動作しており、1単元を7フェーズで学ぶ新しい学習フローを設計・移行中である。新フローの概要は [docs/concept/learning-materials-v2.md](docs/concept/learning-materials-v2.md) を参照。

## 主な機能

- アルゴリズムコース（Course / Mission / Activity、コース末尾演習）
- 自分で課題を作る「作る」クエスト、クエスト掲示板
- 実績、知識カード、コレクション
- HEXAD 質問紙と実験条件の割り当て
- 学習状態に応じたフィードバック生成（フィードバック v1、2段階生成）

## 技術構成

| 層 | 技術 |
| --- | --- |
| フロントエンド | Next.js 15 / React 19 / TypeScript / MUI |
| バックエンド | Express 5 / TypeScript / Prisma |
| DB | PostgreSQL（Neon） |
| 認証 | Firebase Authentication |
| インフラ | Cloud Run / GitHub Actions |
| LLM | OpenAI API（フィードバック生成） |

## リポジトリ構成

| 場所 | 内容 |
| --- | --- |
| `front/` | Next.js フロントエンド |
| `back/` | Express バックエンド、Prisma schema / migration / seed |
| `docs/` | 設計、実装ルール、運用手順、図、実装報告 |
| `.github/workflows/` | CI と Cloud Run デプロイ |

## ローカル開発

前提: Node.js 20（CI と同じメジャーバージョン）、アクセス可能な PostgreSQL、Firebase プロジェクトの認証情報。

依存関係のインストールと Prisma Client の生成:

```bash
cd back
npm ci
npx prisma generate

cd ../front
npm ci
```

開発サーバーの起動:

```bash
# バックエンド（既定ポート 8080）
cd back
npm run dev

# フロントエンド（http://localhost:3000）
cd front
npm run dev
```

主な環境変数（秘密情報はリポジトリに置かず、環境変数や Secret Manager で渡す）:

| 対象 | 変数 | 用途 |
| --- | --- | --- |
| front | `NEXT_PUBLIC_API_BASE_URL` | バックエンド API の URL（必須） |
| front | `INTERNAL_API_BASE_URL` | サーバー側から API を呼ぶ場合の URL（任意） |
| back | `DATABASE_URL` | PostgreSQL 接続文字列 |
| back | `ALLOWED_ORIGINS` | CORS を許可するオリジン（カンマ区切り） |
| back | `PORT` | バックエンドのポート（既定 8080） |
| back | Firebase の Application Default Credentials | Firebase Admin の初期化 |
| back | `OPENAI_API_KEY` / `OPENAI_MODEL` | フィードバック生成（対象機能を使う場合） |

開発環境（Cloud Run / Neon）の構成と確認手順は [docs/development-cloud-run.md](docs/development-cloud-run.md) を参照。

## よく使うコマンド

| コマンド | 場所 | 内容 |
| --- | --- | --- |
| `npm run lint` | front / back | ESLint |
| `npm run typecheck` | front / back | TypeScript 型チェック（`tsc --noEmit`） |
| `npm run build` | front / back | ビルド |
| `npm run validate:learning-seed` | back | 教材 seed の静的検証 |
| `npm run verify:static` | back | DB 不要の検証一式（seed、各コース、フィードバック v1 等） |
| `npm run seed:preserve` | back | 学習進捗を保持する seed 適用 |

注意: seed の適用先 DB は必ず確認すること。デプロイ（CD）は migration と seed を自動実行しないため、seed の変更はマージ・デプロイだけでは画面に反映されない。

## 開発の進め方

- 作業は `develop` から切った専用ブランチで行い、PR の宛先は `develop` とする。
- 実装の型、検証、ドキュメントの優先順位は [AGENTS.md](AGENTS.md) と [docs/development-rules.md](docs/development-rules.md) に従う。

## ドキュメント

- 開発の入口: [AGENTS.md](AGENTS.md)
- ドキュメント索引: [docs/README.md](docs/README.md)
- 実装ルール: [docs/development-rules.md](docs/development-rules.md)
- 新学習フロー: [docs/concept/learning-materials-v2.md](docs/concept/learning-materials-v2.md)
- develop 用デプロイ: [docs/development-cloud-run.md](docs/development-cloud-run.md)
- フィードバック v1 実装報告: [docs/feedback-v1-implementation.md](docs/feedback-v1-implementation.md)
