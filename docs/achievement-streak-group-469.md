# 連続学習と系コンプリートの実績評価（C1-a）

- 目的: 新実績表の前提となる連続学習日数と、指定した単元集合の完了条件を評価できるようにする。
- 適用範囲: バックエンドの評価器・ホーム目標実績・条件ラベル・Prismaの追加migration。seed差し替えと付与タイミング・フロント演出は対象外。
- 状態: 実装・自動検証済み。migrationは未適用、実DB E2Eは未実施。
- 最終確認日: 2026-11-19。
- 正本: [Issue #469](https://github.com/BeppuKanato/engineer-quest/issues/469)、学習日の定義は [Issue #459](https://github.com/BeppuKanato/engineer-quest/issues/459)、[開発ガイド](../AGENTS.md)。
- 対象実装コミット: `ca57b88e`。

## 学習日と連続日数

- A1の本人のフェーズ完了・単元完了 `completedAt` と「作る」提出 `submittedAt` を共通ヘルパーで日付集合にする。nullは除外し、同日重複は1日。クライアントのイベントは使わない。
- 日付はAsia/Tokyo。今日に記録があれば今日から、今日未学習なら昨日から遡る。昨日にも記録がなければ0。途中に1日空けばそこまでを数える。
- `STREAK_DAYS` の評価とホーム目標実績の進捗は同じ計算を使う。解除済み実績は既存の保持処理のままで、連続が途切れても取り消さない。
- A1のホームカレンダーの `continuationDays` は従来どおり「今日から遡る」意味を維持した。学習日の取得と日付キーだけを共通化し、既存カレンダーのレスポンスを変更していない。今日未学習の場合、目標実績の継続進捗とは値が異なり得る。

## 単元集合の条件

Prismaに `UNIT_GROUP_COMPLETE` と `Achievement.conditionUnitIds`（文字列配列、既定値は空）、`conditionGroupName`（任意の系名）を追加した。将来のseedで次の設定を指定すれば、評価器へのハードコードなしで系を追加できる。

```ts
conditionType: AchievementConditionType.UNIT_GROUP_COMPLETE,
conditionGroupName: "探索系",
conditionUnitIds: [
  "course-algorithm-breadth-first-search-v1",
  "course-algorithm-depth-first-search-v1",
  "course-algorithm-binary-search-v1",
  "course-algorithm-maze-digging-v1",
],
```

- 目標は重複を除く対象ID数、進捗はその集合に含まれる完了済み単元数。`conditionValue` には依存しない。対象外・他ユーザー・未完了の単元は数えない。
- 空の集合や空白IDを含む集合では解除しない。未登録の単元IDは完了数に入らない。対象IDは既存の安定したcourse IDを指定する。
- 条件文は例「探索系の4単元をすべて完了」。実績一覧・コレクション・ホーム目標で共通化した。系名未設定時は「指定した4単元をすべて完了」となる。
- 実績seedは今回変更していない。既存18条件の進捗式も変更していない。

## DB適用

**DB適用が必要。実DBには未適用。** `20261119060000_achievement_unit_group` はenum値と2列を加えるだけで、既存実績や解除済み履歴を削除しない。既存行の単元配列は空、系名はnullとなる。

対象を **local または dev** と明示し、利用する接続先を確認してから、`back` で次を実行する。接続文字列や資格情報は出力・共有しない。本番操作はこの作業には含まない。

```sh
npx --no-install prisma migrate status
npx --no-install prisma migrate deploy
npx --no-install prisma generate
```

`migrate deploy` は全未適用migrationを適用するため、事前にstatusと対象DBの未適用一覧を確認する。**新コードの起動・デプロイ前に適用が必要**（既存の実績取得も追加列を参照する）。Cloud Run CDはmigrationを自動実行しない。seed適用は今回は不要。実績データの差し替えは次のカードで、別途保持方針を確認して行う。

## 検証と未実施

- back `npm run typecheck`、`npm run lint`、`npm run build`、`npm run verify:collections`: 成功。
- back `npm run verify:static`: 追加した評価器検証を含め全件成功。
- `npm run verify:achievement-evaluator` を追加し、`verify:static` へ組み込み。3/7/30日、3種類の記録源、午前8時、重複・未完了・所有条件、今日未学習の猶予、空白日、解除保持、年越し・うるう日、単元集合の不足・全件・重複・空、ホーム／コレクションの一致、既存18条件をメモリのPrismaアダプターで検証。
- 追加検証はUTC / America/Los_Angeles / Asia/Tokyoの各実行環境でも成功。
- A1の `npx ts-node src/scripts/verifyLearningDaySource.ts`: 成功。
- `prisma generate`、`prisma validate` とDBを使わない `prisma migrate diff` で追加enum・2列の差分を確認。Prisma Clientはnode_modules内のローカル生成物で、手編集・追跡追加していない。
- `git diff --check`: 成功。

実DBへのmigration適用・適用後の評価／付与／表示を通したE2E、実機の画面確認は未実施。UIの描画・演出とseedを変更していないためスクリーンショットは追加していない。
