# 実装ルール

- 目的: Engineer Quest のフロントエンド、バックエンド、DB、教材データ、検証方法について、既存実装から読み取れる「型」を明文化し、担当者や AI が変わっても同じ構造で実装できるようにする。
- 適用範囲: このリポジトリへのすべての新規実装と変更。
- 最終確認日: 2026-11-12
- 前提: 製品や学習設計の判断は `AGENTS.md` にある正本を優先する。本書は設計判断の代わりではなく、実装方法のルールである。

## 1. 全体原則

- TypeScript の `strict` を前提とし、`any` で契約を曖昧にしない。外部入力や JSON は、境界で型と形を確認する。
- 既存の近い実装を最初に読み、責務分割、命名、エラー形式、検証方法を踏襲する。より良い構造を思い付いても、無関係な全面改修を同じ変更へ混ぜない。
- 新規ファイルの命名は、現在の主流である次の形式を使う。
  - バックエンド: `<domain>.router.ts`、`<domain>.controller.ts`、`<domain>.service.ts`
  - フロントエンド API: `<domain>.api.ts`
  - 画面ルート: Next.js App Router の `page.tsx`、必要に応じて `type.ts` や `component/` を近くに置く
- 旧式の命名が残るファイルは、担当変更のついでに一括改名しない。改名は影響範囲を確認した独立した変更で行う。
- `back/prisma/olds/`、`back/src/controller/olds/`、`back/src/service/olds/` は履歴であり、新規実装の雛形や import 先にしない。
- `back/src/generated/` は生成物であり、手で編集しない。
- 依存関係を変えたら `package.json` と lockfile を同じ変更に含める。lockfile を手作業で部分編集しない。

## 2. フロントエンド

フロントエンド構成は [frontend-architecture.md](frontend-architecture.md) を補足正本とする。Bulletproof Reactの公式文書を固定版で参照し、採用範囲・依存方向・既存例外・移行順は同文書で管理する。以下の配置表は現状を含む。移行先の配置は採用方針に従い、文書追加だけでコード移行済みと扱わない。

### 2.1 置き場所

| 場所 | 置くもの |
| --- | --- |
| `front/src/app/` | ルート、画面の入口、画面固有のレイアウトと小さな部品 |
| `front/src/features/` | 学習プレイヤーなど、複数画面で使う機能単位の UI とロジック |
| `front/src/api/` | バックエンド API クライアントと API 境界の型 |
| `front/src/lib/` | fetcher、API base URL、キャッシュなどアプリ共通の基盤 |
| `front/src/hooks/` | 複数画面で再利用する React hooks |
| `front/src/app/component/` | 未移行の共通UI・機能が残る既存例外。新規の共有部品は採用方針の配置を使い、既存部品の移動は利用先と一緒に計画する |

学習機能は `front/src/features/learning/` を優先する。ルートの `page.tsx` に、認証確認、データ取得の開始、画面構成を持たせ、教材の描画や判定などの本質的ロジックを直接書き込まない。

### 2.2 API 呼び出し

- HTTP 通信は `front/src/lib/fetcher.ts` の `fetcher` を使い、各画面で `fetch` を直接組み立てない。
- API ごとに関数を `front/src/api/<domain>.api.ts` に置き、画面はその関数を呼ぶ。
- 認証が必要な API では、既存画面と同じ方法で Firebase ID token を取得して渡す。
- エラーは `ApiError` の `status`、`code`、`message` を使って画面状態へ変換する。HTTP ステータスだけを見て独自のエラー文を乱立させない。
- 一覧やロードマップなど既存で `fetchClientQuery` を使っている領域では、キャッシュキーと query tag の付け方を周囲に合わせる。
- URL パラメータは `encodeURIComponent` でエスケープする。

### 2.3 型と契約

- バックエンドのレスポンス形が契約の起点である。フロント側の型だけを変えて完了としない。
- レスポンス型は、利用する route の `type.ts`、`front/src/api/types/`、または機能フォルダ内の既存配置に合わせる。同じ形を複数箇所で定義し始めたら、共通配置へ寄せる。
- API の必須フィールド、nullable、列挙値を変えたら、バックエンド、フロント型、利用画面、検証を同じ変更でそろえる。

### 2.4 スタイリング

- 既存画面は MUI を中心に、一部で Tailwind / shadcn 系の基盤も使う。新規部品は、置く画面で主流の方式に合わせる。
- 既存画面の保守では、周囲の色、余白、タイポグラフィを踏襲する。機能修正のついでに全体テーマを変更しない。
- 新しい学習プレイヤーでは、教材内の色の意味を画面都合で流用しない。プレイヤー固有の色や寸法は、機能フォルダ内の定数やスタイルとして閉じ込め、全体 UI へ無断で広げない。
- 色だけに状態を依存させず、ラベル、アイコン、形などの冗長な手掛かりを併用する。

## 3. バックエンド

### 3.1 層構造

新規 API は原則として次の流れにする。

```text
back/src/app.ts
  -> router/<domain>.router.ts
  -> controller/<domain>.controller.ts
  -> service/<domain>.service.ts
  -> lib/prisma.ts (Prisma)
```

| 層 | 責務 | してはいけないこと |
| --- | --- | --- |
| router | パス、HTTP メソッド、認証 middleware、controller の接続 | DB アクセス、業務判定、レスポンス整形 |
| controller | request の取り出し、認証済みユーザーの取得、service 呼び出し、status code、エラー委譲 | Prisma の直接操作、複雑な業務ルール |
| service | 業務ルール、所有権確認、Prisma、トランザクション、外部サービスの調整 | Express の `Request` / `Response` への依存 |
| domain / learning | 純粋な計算、教材コンテンツの parse / schema、ドメイン固有の変換 | HTTP や画面状態への依存 |

`app.ts` へ新規 router を mount する。既存 router の中には createQuest のように `/api` 直下へ接続するものもあるため、新規では対象 router の既存パターンを確認してから決める。

### 3.2 認証と所有権

- 認証が必要な route には `verifyFirebaseToken` などの既存 middleware を接続する。
- controller では `req.authUser` からアプリ内ユーザー ID または Firebase UID を取得し、未認証なら `AppError(401, "UNAUTHORIZED", ...)` を投げる既存パターンを優先する。
- service では、対象データを `userId` 等の所有条件付きで取得する。ID が存在することと、本人のデータであることを混同しない。
- クライアントから渡された user ID を認証済みユーザーの代わりに使わない。

### 3.3 エラー形式

- API の標準エラーは `{ "message": string, "code": string }` とする。
- controller と service の業務エラーは `AppError(statusCode, code, message)` を使い、最後に `errorHandler` へ委譲する。
- 新規コードで `{ error: ... }` のような独自形式を増やさない。認証 middleware など既存の例外は、担当変更で互換性を確認してから扱う。
- 予期しない例外の内部詳細、接続文字列、token、個人情報をレスポンスやログへ出さない。

### 3.4 外部サービス

- Firebase Admin、OpenAI などの初期化と呼び出しは、専用モジュールまたは service 側へ閉じ込める。controller から直接呼ばない。
- API キーや接続情報は環境変数から読み、コードや seed に埋め込まない。
- LLM の入出力がある機能では、プロンプト、schema、検証を分け、モデル出力をそのまま信用せず、ID や許可範囲を機械検証する。フィードバック v1 の実装方法を参照する。

## 4. Prisma と DB

- 現在の DB 構造は `back/prisma/schema.prisma` を正とする。ER 図や旧 schema と食い違う場合は schema を優先する。
- schema を変更したら、同じ変更で migration を追加する。既存 migration を後から書き換えない。
- Prisma の列挙値や型は `@prisma/client` から import し、同じ文字列を手書きで再定義しない。
- Prisma Client は `back/src/lib/prisma.ts` の共有 `prisma` を使う。service ごとに新しい `PrismaClient` を作らない。
- 複数テーブルを一貫して更新する処理は `$transaction` を使う。
- 取得では必要なフィールドを `select` し、画面や API に不要な個人情報や内部情報を含めない。
- コンテンツ ID は seed とログの参照に使うため安定させる。表示名の変更を理由に ID を変えない。

## 5. Seed と教材データ

### 5.1 従来フロー

- 学習コースの正は `back/prisma/seedData/` であり、`learningSeed.ts` が各コース seed を集約する。
- Activity の `content` は `back/src/learning/activity-content/` の schema で検証できる形にする。任意 JSON を検証なしで入れない。
- seed を変えたら、seed validation と対象コース verify を確認する。
- 通常 seed は既存データの同期や削除を伴い得る。学習進捗を保持する環境では `back/prisma/preservingSeedPolicy.ts` と `seed:preserve` を先に確認する。

### 5.2 新フロー

- 7フェーズ単元の教材を、従来の MissionActivity JSON へ無理に変換しない。
- 新しい教材形式を作るときは、バージョン、判別子、ステップ、問い、論点タグ、コード、テストケースを機械検証できる schema を先に定義する。
- 色は教材データへ HEX 値で散らさず、意味を表す tone や状態名で表し、描画側が実際の色へ変換する。

## 6. 検証

### 6.1 基本コマンド

フロントエンド:

```bash
cd front
npm run lint
npm run typecheck
npm run build
```

バックエンド:

```bash
cd back
npm run lint
npm run typecheck
npm run build
npm run validate:learning-seed
npm run verify:static
```

`verify:static` は DB、起動中サーバー、外部 API を必要としない検証をまとめたものである。対象は `back/package.json` を正とする。

既知の例外: `verify:selection-course` は DB 不要だが、現行 develop の教材トレース（1つの Activity 内で複数例を切り替える `selection-boundary-return`）に対して検証前提が合わず失敗するため、`verify:static` には含めていない。検証スクリプト側の前提と教材側の表現のどちらを直すかは、教材修正として別途判断する。

### ローカルでの独立プレビュー

普段の開発サーバーとbuildを同時に動かすと`.next`が競合する。移行の画面検証では、別ポートに加えて生成先も分ける。

```powershell
cd front
$env:ENGINEER_QUEST_NEXT_DIST_DIR = ".next-migration"
npx next dev -p 3100
```

この環境変数を指定しない通常の開発・buildは従来の`.next`を使う。検証後はサーバーを終了し、同じシェルでbuildする場合は環境変数を解除する。Nextが`next-env.d.ts`の生成先参照を変更することがあるため、その自動変更はコミットに含めない。

### 6.2 DB や外部環境が必要な検証

次は CI の基本検証とは分ける。対象 DB と環境を明示し、結果を PR に記録する。

- `verify:learning-db`、`verify:seeded-*`、`verify:*-db` などの DB 検証
- `test:e2e:*` の E2E
- フィードバックの DB / storage / context 検証
- seed の適用、DB リセット、実データ調査

### 6.3 変更領域ごとの追加確認

| 変更領域 | 追加で確認するもの |
| --- | --- |
| 教材 seed | `validate:learning-seed`、対象コースの `verify:<course>-course` |
| 参考解やコード判定 | `verify:course-mission-code`、対象機能の reference solution verify |
| フィードバック | `verify:feedback-v1` と、入力・保存に触れる場合は DB 系 verify |
| 実績・コレクション | master data verify と、DB に触れる場合は DB / E2E verify |
| Prisma schema | migration、seed validation、影響する service の検証 |
| デプロイ設定 | `docs/development-cloud-run.md` の確認手順 |

実行できなかった検証は、理由と代替確認を PR に書く。

## 7. PR チェックリスト

- 目的と対象範囲が説明されている。
- 正本となる設計文書を読み、矛盾がない。
- front / back の契約が両側でそろっている。
- lint、型チェック、build、関連 verify の結果が書かれている。
- schema 変更時は migration が含まれている。
- seed 変更時は、対象 DB への適用が別途必要かどうか書かれている。
- コードがマージされただけでは実画面に反映されない変更があれば、その条件が明記されている。
- ドキュメントと `docs/README.md` の状態が更新されている。
