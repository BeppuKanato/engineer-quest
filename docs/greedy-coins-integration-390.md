# 貪欲法（硬貨問題） 統合：シード・マスタ・サムネイル（Issue #390）

目的: 貪欲法（硬貨問題）の単元をコース一覧に出現させるため、コース／知識カード／実績のシードとマスタ検証の期待値を追加し、コースサムネイルに硬貨の図を登録する。数値と文言は基準データ（`docs/concept/greedy-coins-unit-baseline.md` §5）に従う。最終確認日: 2026-11-11。

**このPRのマージ・デプロイだけでは画面に反映されない。開発 DB へ `seed:preserve` の再実行が必要（ユーザーの手作業）。**

## 追加したシード（加算のみ。既存行は変更していない）

| 対象 | 追加前 | 追加 | 追加後 |
| --- | --- | --- | --- |
| コース（`back/prisma/seedData/courseSeed.ts`） | 9件 | `course-algorithm-greedy-coins-v1`「貪欲法（硬貨問題）」（ALGORITHM、EASY、公開・初期解放、version 1） | 10件 |
| 知識カード（`knowledgeCardSeed.ts`） | 18枚 | 「貪欲な選択」RARE（sortOrder 19）／「残額を減らしていく」COMMON（20）／「最適とは限らない」EPIC（21） | 21枚 |
| カードスケジュール（同上、15テーブル方式） | 162行 | `GREEDY_COINS_CARD_PHASE_SLOTS`（フェーズ2=RARE、フェーズ5=COMMON、フェーズ7=EPIC）から27行 | 189行 |
| 実績（`achievementSeed.ts`） | 60件 | 単元クリア（sortOrder 116）／フェーズ7クリア（326）／確認問題の初回全問正解（336）／応用問題の初回満点（346）／ノーヒントクリア（356）／カードコンプリート（416）の6件 | 66件 |

- カードの説明文（label / description / connection / useCase / searchKeywords）は、基準データ §5 のカード説明（「その時点で使える最良の選択を繰り返す考え方」など）を基に、既存カードと同じ文体で書いた。
- コースの description は既存コースと同じ文体（前提知識を含む）で新規に書いた。基準データに指定はない。
- 実績の sortOrder は既存の区分帯（単元クリア 110番台、フェーズ実績 320〜350番台、カードコンプリート 410番台）の続きに採番し、既存と重ならないことを確認した。

## マスタ検証の更新

- `back/src/scripts/verifyCollectionMasterData.ts`: 期待コース数を 9 → 10 に更新し、`GREEDY_COINS_PHASE_KEYS`（フェーズキー7件）と `CARD_COURSES` への貪欲法エントリを追加した。カード総数・スケジュール・実績のフェーズキー整合性はこのエントリから自動で検証される。
- 総数を固定している他の検証スクリプトは grep で洗い出し済み（該当はこのファイルのみ。`verifyPreservingSeed.ts` は保持ポリシーの検証で総数を持たない）。

## サムネイル

- `front/src/app/courses/component/courseThumbnail.tsx`: `GreedyCoinsFigure` を追加し、`course-algorithm-greedy-coins-v1` に対応づけた。額面列 [500, 100, 50, 10, 5, 1]（最初に選ぶ500を強調）と、786円を9枚で払ったトレイ、「786円・9枚」のキャプションを描く。

## 検証

- シードの実数確認（Prisma の列挙値を schema から読み込むスタブ＋ transpile-only でシードを評価）: コース10件・カード21枚・スケジュール189行・実績66件、カード sortOrder 最大21、実績 sortOrder の重複なし。
- `verifyCollectionMasterData` を同方式で実行し通過（期待値を一時的に壊す負例では異常終了することも確認した）。通常の `npm run verify:collections` は Prisma クライアント生成物に依存し、この作業環境では生成できないため未実施（CI を最終確認とする）。
- back: `npm run lint`（`src` 対象）通過。型チェックは生成済み Prisma クライアントが無いため全体は通らないが、`origin/develop` と同一条件で比べ、対象ファイル群を含むエラー集合が一致すること（195件、同内容）を確認した＝新規エラーなし。なおシードファイル単体の lint では `achievementSeed.ts` の未使用 import（`courseSeed`）が1件出るが、これは develop 側にも同一行がある既存の問題で、本PRの追加によるものではない。
- front: `verify:home-layout`（サムネイル契約を含む）、`verify:greedy-coins-unit`、`verify:greedy-coins-trace`、`verify:unit-overview`、型チェック、サムネイルの lint、`build` が通過。

## 留保

- **シード適用は未実施**: 実 DB への seed 適用は行っていない。マージ後にユーザーが開発 DB へ `seed:preserve` を再実行することで、コース・カード・実績が反映される。
- ブラウザ実機でのコース一覧・サムネイル表示の確認はこの環境では未実施（seed 適用後に実機確認をお願いしたい）。
