# Bulletproof React公式ドキュメントの固定版

- 目的: Engineer Questのフロントエンド構成の外部参考資料を、取得元と版を明確にして保持する。
- 適用範囲・状態: 外部参考（固定版）。このフォルダ自体はアプリの実装規約や実装済み状態を定義しない。
- 最終確認・取得日: 2026-11-12。
- 公式リポジトリ: [alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react)。情報源は公式GitHubのみ。
- 固定コミット: [`9506629ed003a561c6627735480cce4994244bb4`](https://github.com/alan2207/bulletproof-react/commit/9506629ed003a561c6627735480cce4994244bb4)。取得時のmaster先頭を固定したもので、以後は自動更新しない。
- このプロジェクトの採用方針・優先順位: [frontend-architecture.md](../../frontend-architecture.md)。公式原文と本プロジェクトの決定を区別する。

## 内容とライセンス

`upstream/` は固定コミットの原文をそのまま保存する。公式のルートREADME、LICENSE、docs配下の全12 Markdown文書と2画像を取り込んだ。公式アプリのコード、依存関係、設定、AGENTS.md、Git履歴は取り込んでいない。

- [公式READMEのコピー](upstream/README.md)
- [原文LICENSE](upstream/LICENSE): MIT License、Copyright (c) 2024 Alan Alickovic。原文・画像とともに保持し、再配布時も著作権・許諾表示を保持する。
- [取得ファイル一覧と検証値](manifest.json): 各ファイルの元パス・固定URL・Git blob SHA-1・SHA-256・バイト数。

公式は、テンプレートやフレームワークではなく原則と実践例を示すガイドであり、採用技術をすべて一致させる必要はないと説明している。

## 文書一覧

| ローカル原文 | GitHub |
| --- | --- |
| [additional-resources.md](upstream/docs/additional-resources.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/additional-resources.md) |
| [api-layer.md](upstream/docs/api-layer.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/api-layer.md) |
| [application-overview.md](upstream/docs/application-overview.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/application-overview.md) |
| [components-and-styling.md](upstream/docs/components-and-styling.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/components-and-styling.md) |
| [deployment.md](upstream/docs/deployment.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/deployment.md) |
| [error-handling.md](upstream/docs/error-handling.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/error-handling.md) |
| [performance.md](upstream/docs/performance.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/performance.md) |
| [project-standards.md](upstream/docs/project-standards.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/project-standards.md) |
| [project-structure.md](upstream/docs/project-structure.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/project-structure.md) |
| [security.md](upstream/docs/security.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/security.md) |
| [state-management.md](upstream/docs/state-management.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/state-management.md) |
| [testing.md](upstream/docs/testing.md) | [固定版の原文](https://github.com/alan2207/bulletproof-react/blob/9506629ed003a561c6627735480cce4994244bb4/docs/testing.md) |

## 読み方・リンクの扱い

まず採用方針を読み、必要な原文を参照する。構成、コンポーネント、API、状態管理、検証が主な参照先になる。セキュリティや性能などの残りの原文も保存しているが、ライブラリや手順を丸ごと採用したことを意味しない。

原文内のdocs・画像リンクは元の階層を保持している。サンプルコードへの `../apps/...`、CONTRIBUTING等の未取り込み先はローカルでは開けないため、上表の固定版GitHub原文から開く。リンクを書き換えるために原文を改変しない。サンプルを調べる場合も同じコミットを用いる（[Next.js App Routerサンプル](https://github.com/alan2207/bulletproof-react/tree/9506629ed003a561c6627735480cce4994244bb4/apps/nextjs-app)）。

## 更新

上流の変更内容と採用方針への影響を確認したうえで、同じコミットの原文・画像・LICENSEを更新する。README・manifest・採用方針の取得情報を揃える。更新だけでアプリコードを移行しない。
