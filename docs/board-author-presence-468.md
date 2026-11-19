# 掲示板の投稿者表示（E1）

- 目的: 投稿・コメントの著者に、選択中マスコットとプロフィール実績を表示する。
- 適用範囲: 掲示板APIの著者情報の読み取りと一覧・詳細・コメントの表示。
- 状態: 実装・自動検証・2画面2サイズのテストデータ表示確認済み。実DB・認証を含むE2Eは未実施。
- 最終確認日: 2026-11-19。
- 正本: [Issue #468](https://github.com/BeppuKanato/engineer-quest/issues/468)、[開発ガイド第10節](../AGENTS.md#10-ゲーミフィケーション強化プログラムの実施基準)、[マスコット提示指針](concept/mascot-presentation-guideline.md)。
- 対象実装コミット: `33671dd6`。

## 実装

- 投稿サマリ・詳細・既存コメント・新規コメントの返却に `authorMascotId` と `authorAchievement` を追加。既存の `selectedMascotId` と `selectedProfileAchievement` relation から取得し、実績はタイトル・レアリティ・アイコンキーだけを返す。未設定なら null。
- 削除済み投稿の著者名は従来どおり「削除済み投稿」とし、追加2項目も null にする。ユーザーの生データや選択実績の不要な属性をレスポンスへ展開しない。
- 掲示板内共通の `QuestBoardAuthor` を一覧・詳細・コメントに配置。既存 `MascotFigure` のSサイズ・円形の顔用画像を使い、実績はアイコンとタイトルを表示する。実績未設定では枠を作らず、レアリティの文字表示は追加しない。
- マスコットIDが不明なら既存のレッサーパンダへ、実績アイコンキーが不明ならトロフィーへフォールバック。削除済み投稿ではキャッシュに著者情報が残っていてもコンポーネント側で非表示にする。
- 氏名・実績タイトルは折り返せるようにし、他人のプロフィールへのリンクは追加しない。触った一覧画面の既存 `Course` 表記と匿名時の `Learner` は日本語表記へ合わせた。
- 投稿・コメント・リアクションの保存内容や選択の仕組みは変更しない。DB schema / migration / seed の変更・適用は不要。

## 検証

- back / front の `npm run typecheck`: 成功。
- back `npx ts-node src/scripts/verifyQuestBoardAuthors.ts`: 成功。実サービスとメモリのPrismaアダプターで一覧・詳細・既存／新規コメント、実績未設定、必要属性だけのselect、削除情報の非表示、既存コメント保存内容を確認。
- front `node scripts/verifyQuestBoardAuthors.cjs`: 成功。実ページの静的描画でマスコット・実績・未設定時の枠なし・アイコンキー・フォールバックと、削除済み投稿の古い情報が表示されないことを確認。
- back `npm run verify:static`（`verify:collections`を含む）、`npm run lint`、`npm run build`: 成功。
- front `npm run verify:mascot-presentation`、変更したTS/TSXの個別lint、`npm run build`: 成功。buildは `.next` 作成権限エラー後に制限外で再実行した。既存の単元プレビュー5件の hooks 警告あり。
- `git diff --check`: 成功。

## 表示証跡と限界

front検証スクリプトの `renderBoardFixture` を使い、実際の一覧・詳細ページを人工データで静的描画し、Chromiumで撮影。deviceScaleFactor=1、ブラウザ倍率100%相当、時刻表示はAsia/Tokyo。すべてのサイズで著者の画像読み込み、実績枠の有無、削除済み情報の非表示とページ幅のはみ出しなしを確認した。

- [一覧1093×614](evidence/issue468/board-list-1093x614.png) / [一覧2560×1440](evidence/issue468/board-list-2560x1440.png): 実績設定あり・なし・削除済みの3投稿を並べた。小さいサイズは著者行を含めてスクロール下部を全体撮影。
- [詳細1093×614](evidence/issue468/board-detail-1093x614.png) / [詳細2560×1440](evidence/issue468/board-detail-2560x1440.png): 投稿者とコメントの実績設定あり・なしを確認。小さいサイズではコメント枠がスクロール下部になる。

実DB・Firebase認証での取得、投稿・コメント・リアクションの実操作、プロフィール選択変更後の再取得を含むE2Eは未実施。静的描画とメモリのサービス検証は、これらの確認完了を意味しない。
