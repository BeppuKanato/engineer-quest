# 二分探索 アプリ統合（カード・実績・サムネイル）（Issue #295）

目的: 二分探索単元（フェーズ1〜7は #286〜#292、視覚デバッグは #293、単元接続は #294）をアプリ全体へ統合し、コース一覧・ホーム・コレクション・実績で既存単元と同等に扱えるようにする。マスタデータの正本は基準データ（`docs/concept/binary-search-unit-baseline.md`）§5。最終確認日: 2026-11-07。

## 実装内容

- コースシード: **変更なし**。`course-algorithm-binary-search-v1`「二分探索」は既存のため、基準 §5 のとおり追加しない（コース総数は 9 のまま）。
- 知識カード（`back/prisma/seedData/knowledgeCardSeed.ts`）: 基準 §5 の3枚を追加。sortOrder は既存12枚に続く 13〜15、catalogNumber は単元内で 1〜3。
  - 探索範囲を半分にする（RARE、フェーズ2 `binary-search-execution` で配布）
  - 中央の値と比べる（COMMON、フェーズ5 `binary-search-code-check` で配布）
  - 対数時間（EPIC、フェーズ7 `binary-search-implementation` で配布）
  - 配布スケジュールは既存の `buildCardPhaseSchedule`（単元別15テーブル方式）へ二分探索分を追加しただけであり、既存4単元分の内容は変更していない（後述のダンプ比較で確認）。
- 実績（`back/prisma/seedData/achievementSeed.ts`）: 他単元と同じ6件構成を追加。単元クリア（`ach-unit-binary-search-complete`、sortOrder 114）、フェーズ7クリア（324）、確認問題の初回全問正解（334）、応用問題の初回満点（344）、ノーヒントクリア（354）、カードコンプリート（`ach-binary-search-card-complete`、414）。各帯の sortOrder は既存単元の続き（BFS 基準で +4）。
- 検証（`back/src/scripts/verifyCollectionMasterData.ts`）: `CARD_COURSES` に二分探索（スロットとフェーズキー7件）を追加。期待件数は構造から導出されるため、結果としてコース 9・実績 48→54・カード 12→15・スケジュール 108→135 になる（スケジュール件数については「判断と留保」参照）。
- サムネイル（`front/src/app/courses/component/courseThumbnail.tsx`）: 二分探索コースには既に `BinarySearchFigure` が紐づいていたが、教材とは別の汎用データ（9要素 `[3, 7, 12, 18, 24, 31, 38, 45, 52]`）だったため、基準 §5 の指示（汎用図がある場合は単元図へ差し替え）に従い、教材と同じ主教材 `[3, 7, 12, 19, 25, 31, 42]` の図へ差し替えた。構図（範囲全体の括弧＋中央の強調＋「中央」ラベル）は元の図を踏襲し、中央はフェーズ2の最初の探査位置であるインデックス3の 19。FIGURES への登録自体は既存のため変更なし。
- 学習画面側の登録（unitRegistry）は #294 で完了済みであり、本 PR での追加作業はない。

## 判断と留保

- **スケジュール件数について（要確認）**: Issue #295 の指示では「108→123」とあったが、既存の単元別15テーブル方式（`TABLE_SUBSETS` の配布パターン）では1単元あたり27行が生成されるため、4単元108行に二分探索を同方式で加えると **135行** がパターン整合な結果である（123 はどの既存パターンからも導出できない）。本 PR は既存4単元と同一方式を厳密に踏襲して 135 とした。もし 123 を意図するなら、二分探索だけ配布パターンを変える必要があるため、レビューで確認をお願いしたい。
- ダンプ比較: 変更前後の seed を JSON ダンプして比較した。既存4単元分のカード12枚・スケジュール108行・実績はすべて無変更で、新規分（カード3枚・スケジュール27行・実績6件）だけが追加されている。唯一の例外は `ach-knowledge-lv2` で、カード総数から自動導出される条件値・説明文が 12→15 に追随する（従来の単元統合でも起きた設計どおりの変化）。
- 全体カウント系の実績（`ach-unit-count` の [1, 3, 7] 等）は既存実績の条件であり、本 PR では変更していない。
- カードの label・本文（description / connection / useCase）と実績の説明文は、基準 §5 のカード名を正本とし、既存カードの文体に合わせて書き起こした。文言の最終確認はレビューに委ねる。
- サムネイルの差し替えはこの環境でブラウザ実機の目視確認をしていない（図のデータは基準データの検証済み主教材そのもの）。デプロイ後の実機確認をお願いしたい。

## DB 適用の要否

- **マージ後に開発 DB へのシード再実行（`seed:preserve`）が必要**。CD はコードのみをデプロイし、シードは自動適用されない。本 PR のコードだけでは、二分探索のカード・実績は付与されない（コース自体は既存のため一覧には出るが、サムネイル差し替えはコード反映のみで即時有効）。シードは既存マスタの upsert と新規分の追加であり、既存4単元分のデータは変更しない（`verify:seed-preservation` の保持ポリシーの対象範囲内）。

## 検証

- `verify:collections`（コレクションマスタ検証）: 本 VM では Prisma Client が生成できない（エンジン取得不可）ため、schema.prisma から列挙値を読み込むスタブ＋ transpile-only で同じ検証スクリプトを実行し、PASS を確認した（9コース、54実績、15カード、スケジュール135行）。正式な実行は CI（`verify:static`）が正本。あわせて変更前後のダンプ比較で既存分の無変更を確認した（上記）。
- `verify:seed-preservation`: PASS（スタブ併用）。
- front: 二分探索系 verify 9件（motivation / execution / check / code-mapping / code-check / consolidation / implementation / trace / unit）、`verify:learning-player`、`verify:home-layout`（サムネイル契約を含む）の全通過、`tsc --noEmit` 通過、変更ファイルの eslint 通過、`npm run build` 通過。
