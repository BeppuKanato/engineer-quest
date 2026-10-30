# develop 用 Cloud Run 環境

既存の GCP プロジェクト内に次のサービスを追加する。

| 用途 | 名前 |
| --- | --- |
| 開発フロント | `engineer-quest-front-dev` |
| 開発バック | `engineer-quest-back-dev` |
| DB | 既存 Neon プロジェクト `engineer-quest-dev` |
| Firebase Auth | 既存の `enginner-quest`（現時点では本番と共用） |
| リージョン | `asia-northeast1` |

本番の `cd.yml` と `front/cloudbuild.yaml` は変更しない。開発用イメージは
`engineer-quest-repo/dev/front` / `dev/back` に、コミット SHA・実行 ID・試行番号を
含むタグで保存する。サービスは最小 0、最大 2 インスタンス。Cloud Run で動かす
Next.js は開発環境でも本番ビルドを使用するので `NODE_ENV=production` にする。

## デプロイの流れ

`develop` への push → `CI` 成功 → `CD Dev (Deploy to Cloud Run)`。

- `DEV_DEPLOY_ENABLED` が文字列 `true` のときだけ実行する。未設定では実行しない。
- PR の CI 成功ではデプロイしない。自分のリポジトリの `develop` への push のみ。
- CI に通ったコミットをチェックアウトし、実行開始時に `develop` の最新コミットか確認する。
- 同時デプロイを直列化する。進行中のデプロイを途中でキャンセルしない。
- 手動実行も `develop` のみ。対象コミットの push CI 成功が必要。
- バックを作成して URL を取得し、フロントのビルドに `/api` 付き URL を渡す。
- フロント作成後、その URL をバックの CORS 許可元に自動設定する。
- `/health` と `/auth/login` の HTTP 応答を確認し、Actions の Summary に URL を表示する。
- DB マイグレーション・seed・リセットは実行しない。

## 初回の作業順

### 1. Neon の dev 接続文字列を確認する

Neon で `engineer-quest-dev` を開き、Connect から既存の開発用ブランチ・DB を選ぶ。
Cloud Run 用には Connection pooling を ON にした接続文字列を使い、SSL の指定を残す。
同じ DB なので、ローカルと Cloud Run の学習進捗・投稿・テストデータは共有される。
ローカルから行う schema 変更やデータリセットも Cloud Run に即座に影響する。

接続文字列は GCP の Secret Manager に直接貼り付ける。リポジトリやチャットに貼らない。
現在の DB が既に develop の schema とデータを持っていれば初期化しない。
schema の適用が必要なら、接続先を確認して既存データを保持する手順を別途検討する。

### 2. GCP のプロジェクトを選ぶ

Cloud Console 上部で本番サービスが存在する既存プロジェクトを選択する。
GitHub の既存 Secret `GCP_PROJECT_ID` と同じプロジェクトであることを確認する。
Firebase の設定は現在 `enginner-quest` 固定なので、別プロジェクトへ配置する場合は
この手順をそのまま使わず、Firebase の接続設定も変更する。

Cloud Run / Cloud Build / Artifact Registry / Secret Manager の各 API を有効にする。
Artifact Registry の東京リージョンに既存の Docker リポジトリ
`engineer-quest-repo` があることを確認する。既存のビルド用権限・保管バケットは流用する。

### 3. 開発用 Secret を作る

Secret Manager → シークレットを作成。自動レプリケーションで、次の 2 つを作成する。

| Secret 名 | 値 |
| --- | --- |
| `DATABASE_URL_DEV` | 手順 1 の Neon dev の接続文字列 |
| `OPENAI_API_KEY_DEV` | 開発用 OpenAI API キー |

既存の本番用 `DATABASE_URL` / `OPENAI_API_KEY` は上書きしない。
開発でも同じ OpenAI キーを使う場合は、その値を `OPENAI_API_KEY_DEV` に登録できる。
その場合、API 利用量・上限は共有となる。

### 4. Cloud Run の実行用サービスアカウントを作る

IAM と管理 → サービスアカウント → サービスアカウントを作成。
以下の **ID** を使う。メール末尾は現在のプロジェクト ID になる。

| ID | 用途 | 権限 |
| --- | --- | --- |
| `engineer-quest-dev-back` | 開発バック | 手順 3 の 2 Secret に限り「Secret Manager のシークレット アクセサー」 |
| `engineer-quest-dev-front` | 開発フロント | 追加ロールなし |

Secret ごとの権限は、Secret Manager → 対象 Secret → 権限 → アクセスを許可から、
`engineer-quest-dev-back@PROJECT_ID.iam.gserviceaccount.com` に付与する。
実行用アカウントの JSON キーの作成は不要。
Firebase ID トークン検証には、Cloud Run に付けた実行用アカウントの ADC を使う。
`GOOGLE_APPLICATION_CREDENTIALS` やローカルの鍵ファイルのパスは設定しない。

### 5. 既存の GitHub デプロイ用アカウントに利用権限を付ける

本番デプロイに利用している `GCP_SA_KEY` のサービスアカウントを使う。
画像の構成では `github-actions-deployer@enginner-quest.iam.gserviceaccount.com` だが、
IAM の実際のアカウント名と照合する。

手順 4 の **各**サービスアカウントを開く → アクセス権を持つプリンシパル →
アクセスを許可 → デプロイ用アカウントを指定 →「サービス アカウント ユーザー」を付与する。

既存デプロイ用アカウントが次の権限を持つことも確認する。

- Cloud Run 管理者：開発サービスの作成・更新、公開アクセス設定。
- Cloud Build 編集者：ビルドの投入・状態確認。
- 既存 Artifact Registry と Cloud Build のソース保管領域へのアクセス：本番と同じ。

Cloud Build が使用する既存のビルド用サービスアカウントは変更しない。
既存ビルド用アカウントのイメージ書き込み権限もそのまま利用する。
GitHub デプロイ用アカウントに Neon のパスワードを渡す必要はない。

### 6. GitHub の開発デプロイを有効にする

既存 Repository Secrets の `GCP_PROJECT_ID` / `GCP_SA_KEY` を流用する。
新しい DB 接続文字列や API キーを GitHub に登録する必要はない。

GCP の準備が済んだら、GitHub → Settings → Secrets and variables → Actions →
Variables → New repository variable で次を登録する。

| 名前 | 値 |
| --- | --- |
| `DEV_DEPLOY_ENABLED` | `true` |

GitHub Actions → `CD Dev (Deploy to Cloud Run)` → Run workflow → `develop` を選択して実行する。
そのコミットの push CI がまだ実行中なら、成功後に実行する。
以後は develop の push CI 成功後に自動更新される。
自動更新を止めるには `DEV_DEPLOY_ENABLED` を `false` にする。

Cloud Run で手作業のサービス作成や「リポジトリに接続」の設定は不要。
この workflow が初回に 2 サービスを作成する。
フロント・バックは HTTP で公開し、アプリのユーザー認証は既存 Firebase Auth で行う。
Cloud Run IAM による限定公開は、この初期構成には含めない。

### 7. Firebase の承認済みドメインを追加する

初回デプロイの Actions Summary に表示されたフロント URL を確認する。
Firebase Console → 既存プロジェクト → Authentication → Settings → Authorized domains
に、フロント URL の **ホスト名だけ**を追加する。`https://` とパスは付けない。
既存の本番ドメイン・localhost は残す。

今回は Firebase ユーザーを既存環境と共用し、学習データの保存先を Neon dev に分ける。
本番と同じログイン情報を使えるが、認証ユーザーの作成・削除などの変更は共有される。
Firebase Auth 自体を分離したい場合は、別 Firebase プロジェクトとビルド時設定を追加する。

### 8. 動作確認する

- フロント URL でログインできる。
- コースや学習進捗が Neon dev の内容で表示される。
- 学習操作・保存・AI フィードバックが動く。
- Cloud Run に `*-dev` の 2 サービスが追加されている。

HTTP の自動チェックは起動確認のみ。認証・DB・AI の接続確認は上記の実操作で行う。

## 参考

- [GitHub workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run)
- [Cloud Run の Secret](https://docs.cloud.google.com/run/docs/configuring/services/secrets)
- [Cloud Run の実行用サービスアカウント](https://docs.cloud.google.com/run/docs/configuring/services/service-identity)
- [Neon の接続プーリング](https://neon.com/docs/connect/connection-pooling)
