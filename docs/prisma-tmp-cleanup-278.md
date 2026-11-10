# Prisma生成の一時ファイル削除（Issue #278）

目的: `back/src/generated/prisma/` に Git 追跡されている Prisma クエリエンジンの一時ファイル（.tmp 9件・約173MB）を削除し、Cloud Build のソースアーカイブ肥大を解消する。最終確認日: 2026-11-07。

## 調査結果

- 2026-11-07 の GCP 請求内訳確認で、Cloud Build バケット `enginner-quest_cloudbuild` のソースアーカイブが back 側で約78.5MB（圧縮時）に膨らんでいることが分かった。
- 現行 develop を実測（`git ls-tree -r -l`）した内訳:
  - back 全体 約196MB のうち、`back/src/generated/` が約195MB
  - その中に `query_engine-windows.dll.node.tmp*` が 9 件、各 19,261,952 バイト、合計 173,357,568 バイト（約173MB）。Windows での `prisma generate` の残り物がコミットされた形
  - front は約33MB（うち `public/images` 約29MB）で特段の異常なし
- `back/Dockerfile` には `RUN npx prisma generate` があり、生成物はビルド時に再生成される。追跡中の一時ファイルはビルド入力として不要。
- ルート `.gitignore` には、この一時ファイルを除外するルールがなかった。

## 判断と実装

- 削除対象は .tmp 9件のみとした。`back/src/generated/` 全体の追跡停止は、ユーザーの選択により本 PR では行わない（別途判断）。
- 再発防止として、ルート `.gitignore` に `back/src/generated/prisma/*.tmp*` を追加した。
- 本来のエンジン本体 `query_engine-windows.dll.node` は一時ファイルではないため、今回の削除対象に含めていない。

## 検証

- 削除後に `git ls-files back/src/generated` で .tmp が 0 件であることを確認する。
- `.gitignore` の新ルールが同パターンのファイルを無視することを `git check-ignore` で確認する。
- コード・seed・スキーマには一切触れていないため、front / back の lint・型チェック・build への影響はない（CI で確認する）。

## DB 適用の要否

- なし（マイグレーション・seed の変更なし）。マージ後のデプロイで、次回以降の Cloud Build ソースアーカイブが小さくなる。
