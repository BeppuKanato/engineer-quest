# 実績50件への再編（C1-b）

- 目的: 単元ごとの目標を完了・実装・ノーヒントの3件に絞り、横断目標とレアリティ配分を整える。
- 適用範囲: 実績seedと関連検証。評価器・フロント・問題・実験条件は変更しない。
- 最終確認日: 2026-11-19。
- 正本: [Issue #471](https://github.com/BeppuKanato/engineer-quest/issues/471)、前提は [Issue #469](https://github.com/BeppuKanato/engineer-quest/issues/469)、[開発ガイド](../AGENTS.md)。
- 対象実装コミット: `968bc171`。
- 状態: 実装・自動検証済み。ユーザー指定のdevに前提migrationと保持seedを適用済み。廃止分の削除・実画面E2Eは未実施。

## 構成と検証

単元21件・横断10件・作る19件の50件。コモン12／レア18／エピック18／レジェンダリー2。確認問題・応用問題の初回満点14件と単元別カードコンプリート7件をseedから除いた。既存の実装・ノーヒント・単元完了IDを保持し、全単元制覇は `ach-unit-count-lv3` を引き継ぐ。全カード21枚、探索系4単元、学習継続3／7／30日を追加した。既存アイコンのみを使い、シークレットは含めない。

- `back`: `typecheck`、`lint`、`build`、`verify:static` 成功。staticに `verify:collections`、`verify:seed-preservation`、`verify:dfs-learning` を含む。
- コレクション検証に件数・レアリティ・7単元の3条件・新しい横断目標の確認を追加。DFS統合検証を新seedに合わせ、カード配布と実装実績・再実行時の保持を検証。
- 作る系19件は `origin/develop` のseedを読み込み、全項目のdeep equalityを別途確認。定義と生成関数に差分なし。
- フロント変更なし。実ブラウザー・実ユーザー操作による付与E2Eは未実施。

## devへの適用結果

対象はNeonプロジェクト `engineer-quest-dev`。管理APIのdevエンドポイントとローカル接続先の一致を検証した。GCP CLIは認証期限切れだったため、接続先確認にはNeon連携を使った。接続情報は出力していない。

1. `prisma migrate status` で未適用が `20261119060000_achievement_unit_group` の1件のみと確認。
2. `prisma migrate deploy` 成功。条件enumと2列の追加であり、既存データの削除はない。
3. `npm run seed:preserve` 成功。保持ポリシーのガード下で全マスターをupsertし、学習者・進捗・実験割当・ログは書き換えない。
4. DBの対象50件についてseedに指定した全項目が一致することを確認。廃止21件と解除履歴2件は保持。廃止分を目標・プロフィールに選択している件数はいずれも0件。

**現在のdev DBは71件（新表50件＋廃止21件）である。** preserveでは廃止実績が残り、一覧表示・既存評価も続く。50件だけの画面・評価にするには、下記の廃止分整理が別途必要。新規実績の遡及一括付与は実施していない。通常の次回評価タイミングで判定される。

## 廃止21件の削除手順（未実行）

削除すると、対応する `UserAchievement` は外部キーの `Cascade` により消え、選択中の目標・プロフィール実績は `SetNull` により解除される。他の実績の解除履歴は対象外。devの事前確認では解除履歴2件・選択0件だが、実行直前に再確認する。削除は取り消せないため、履歴の消失を了承してから行う。

1. 対象環境を改めて確認し、DB復元ポイントと対象 `Achievement`／`UserAchievement` 行・ユーザーの選択値をアクセス制限された保存先へ退避する。個人情報をPRに添付しない。
2. PRのseedを `seed:preserve` で適用し、新表50件の一致を確認する。今回devはここまで完了済み。
3. 次の明示した21 IDだけを一時表に入れ、件数と影響を確認する。`NOT IN (seed)` による広い削除や通常seedの実行は避ける。

```sql
BEGIN;
CREATE TEMP TABLE retired_achievements (id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO retired_achievements (id) VALUES
  ('ach-phase-bfs-check-perfect'),
  ('ach-phase-bfs-consolidation-perfect'),
  ('ach-bfs-card-complete'),
  ('ach-phase-wall-extension-check-perfect'),
  ('ach-phase-wall-extension-consolidation-perfect'),
  ('ach-wall-extension-card-complete'),
  ('ach-phase-bubble-sort-check-perfect'),
  ('ach-phase-bubble-sort-consolidation-perfect'),
  ('ach-bubble-sort-card-complete'),
  ('ach-phase-maze-digging-check-perfect'),
  ('ach-phase-maze-digging-consolidation-perfect'),
  ('ach-maze-digging-card-complete'),
  ('ach-phase-binary-search-check-perfect'),
  ('ach-phase-binary-search-consolidation-perfect'),
  ('ach-binary-search-card-complete'),
  ('ach-phase-dfs-check-perfect'),
  ('ach-phase-dfs-consolidation-perfect'),
  ('ach-dfs-card-complete'),
  ('ach-phase-greedy-coins-check-perfect'),
  ('ach-phase-greedy-coins-consolidation-perfect'),
  ('ach-greedy-coins-card-complete');
SELECT count(*) AS retired_master_count FROM "Achievement" a
JOIN retired_achievements r ON r.id = a.id;
SELECT count(*) AS unlocks_to_remove FROM "UserAchievement" ua
JOIN retired_achievements r ON r.id = ua."achievementId";
SELECT count(*) FILTER (WHERE u."selectedTargetAchievementId" IN (SELECT id FROM retired_achievements)) AS targets_to_clear,
       count(*) FILTER (WHERE u."selectedProfileAchievementId" IN (SELECT id FROM retired_achievements)) AS profiles_to_clear
FROM "User" u;
-- 確認のみの場合は ROLLBACK。影響了承後の作業時だけ次を実行する。
-- DELETE FROM "Achievement" a USING retired_achievements r WHERE a.id = r.id;
ROLLBACK;
```

4. 実際の削除時はメンテナンス中に同じ対象IDと影響件数を確認し、上記DELETEを有効化して `COMMIT` する。想定外なら `ROLLBACK` する。
5. 実績総数50件・配分12/18/18/2・旧ID21件が0件・`ach-unit-count-lv3` と残す解除履歴の保持を確認する。復元には実績マスターだけでなく、退避した解除履歴と選択値も必要。

本番DB・本番デプロイには操作していない。PRのマージはユーザーが判断する。
