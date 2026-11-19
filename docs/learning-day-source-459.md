# 新フローの学習日・履歴接続（A1）

- 目的: 新フローの確定済み完了記録を、ホームの学習日と履歴の読み取りに接続する。
- 適用範囲: `home.service.ts`、`history.service.ts` と履歴画面の表示。記録側・実験条件・問題・DB schema は変更しない。
- 状態: 実装・サービス回帰検証済み。実DB・認証を含む E2E は未実施。
- 最終確認日: 2026-11-19。
- 正本: [Issue #459](https://github.com/BeppuKanato/engineer-quest/issues/459)、[開発ガイド第10節](../AGENTS.md#10-ゲーミフィケーション強化プログラムの実施基準)。
- 対象実装コミット: `559c5e9f`。

## 実装

- 学習日は、本人の `PhaseLearningProgress.completedAt`、`UnitLearningProgress.completedAt`、`CreateQuestSubmission.submittedAt` の和集合。未完了の null は除外し、同じ日の複数記録は1日にまとめる。
- 月・今日・日付キー・連続日数は Asia/Tokyo で算出する。連続日数は既存どおり、今日から遡る。今日の記録がなければ0日。
- 履歴に `phase_completed` / `unit_completed` を追加。単元名と既存 `concepts.json` の段階名を使い、未知の段階は「（単元名）のフェーズを完了」とする。定義データは読み取りのみ。
- 完了時刻の新しい順に既存履歴と統合し、日付グループは Asia/Tokyo。リンクは `/courses/roadmap/[courseId]`。
- 履歴画面に完了種別のアイコン・ラベルを追加。学習完了数と単元完了数にも反映する。
- 新しい履歴源は既存の履歴源と同じく、それぞれ直近80件。ホームの学習日集計は全期間を参照する。
- migration / seed 適用は不要。

## 検証

- back: `npm run typecheck`、`npm run lint`、`npm run build`、`npm run verify:static`。
- back: `npx ts-node src/scripts/verifyLearningDaySource.ts`。実サービスをメモリの Prisma アダプターで検証し、実DBには接続しない。
- 回帰検証は、空・フェーズのみ・単元のみ・提出のみ・混在、同日重複、今日未学習、所有条件、未完了除外、日本時間の午前8時・午前0時・年またぎ、履歴の表示名・未知段階・降順・日付グループ・単元リンクを確認する。
- UTC / America/Los_Angeles / Asia/Tokyo の実行環境でも日付関連の回帰検証が通過。
- front: `npm run typecheck`、変更した2ファイルへの `npx eslint src/app/history/page.tsx src/api/history.api.ts`、`npm run verify:home-layout`。
- front 全体の `npm run lint` は、既存 `.next-migration` の生成物と対象外スクリプト等により失敗（130 errors / 4402 warnings）。対象外ファイルは修正していない。
- front: `npm run build` 成功（既存の単元プレビュー5件の hooks 警告あり）。最終再実行時の `.next` 作成権限エラーは、制限外での再実行により解消した。

## 表示確認と限界

認証とキャッシュをテストデータへ差し替え、実際の履歴ページ・ヘッダー・パンくずの React コンポーネントを静的描画し、Chromium で撮影した。フェーズ2件、単元1件、提出1件を入力し、完了ラベルと3件の単元リンクを確認。両サイズで文書幅が viewport 幅を超えないことも確認した。端末倍率・ブラウザ倍率は100%相当（deviceScaleFactor=1）、時刻表示は Asia/Tokyo。

- [1093×614](evidence/issue459/history-1093x614.png): 集計は2列、グラフ・カレンダー・履歴は縦積み。履歴はスクロール下部にあるため全体を撮影した。
- [2560×1440](evidence/issue459/history-2560x1440.png): 集計は4列、グラフとカレンダーは横並び、履歴は2列。

実DBでの進捗保存後の取得、Firebase 認証、単元画面への実遷移を含む E2E は未実施。表示証跡はこれらの確認完了を意味しない。ホームの描画コード自体は変更せず、返却データの集計をサービス検証と既存 `verify:home-layout` で確認した。
