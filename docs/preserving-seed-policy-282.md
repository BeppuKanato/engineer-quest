# preserve seed のモデル名誤りの修正（Issue #282）

目的: `npm run seed:preserve` が知識カードのスケジュール登録でブロックされ完走しない問題を直す。
最終確認日: 2026-11-07

## 症状と原因

- 症状：開発 DB への `seed:preserve` が `Preserving seed blocked KnowledgeCardPhaseScheduleEntry.upsert` で失敗した（2026-11-07 実機）。
- 原因：`back/prisma/preservingSeedPolicy.ts` のマスターモデル許可リストに `KnowledgeCardScheduleEntry` とあったが、実際の Prisma モデル名は `KnowledgeCardPhaseScheduleEntry`（schema.prisma）。存在しない名前が許可されていたため、実モデルへの upsert がマスター外への書き込みとして弾かれた。
- CI で検出できなかった理由：`verifyPreservingSeed.ts` も同じ誤名で許可を確認しており、ポリシーと検証が同じ誤りを共有していた。
- 影響範囲：preserve seed は単一トランザクションで実行されるため、失敗時は全体がロールバックされ、DB は変更されていない。再実行は安全。

## 修正

- `preservingSeedPolicy.ts` と `verifyPreservingSeed.ts` のモデル名を `KnowledgeCardPhaseScheduleEntry` に修正した（各1か所）。
- 許可リストには現行スキーマに存在しない `Mission` / `MissionActivity` も残っているが、無害な残存エントリのため本 PR の範囲外とした。

## 検証

- ローカル：`verify:seed-preservation` PASS（実モデル名での upsert 許可と、削除・学習者系書き込みのブロックを確認）。
- CI（verify:static ほか）の結果を参照。
- 実 DB での完走確認は、開発 DB への接続を持つユーザー側で行う。
