# 単元の最終結果から作るへ（Issue #490）

- 目的: 学んだ単元に関連する作るクエストを、最終結果から試せるようにする。
- 適用範囲: 関連コースの逆引きAPIと、全7単元の最終結果への表示。
- 状態: 実装・自動検証・固定データでのブラウザー2サイズ確認済み。DB適用不要。
- 最終確認日: 2026-11-20。
- 対象コミット: `79ccb3d8`。起点: develop `23263219`。
- 正本: [Issue #490](https://github.com/BeppuKanato/engineer-quest/issues/490)、[開発ガイド](../AGENTS.md)、[実装ルール](development-rules.md)。検索キーワードの配置は[カード参照の実装](knowledge-card-surface-482.md)に対応する（#482）。

## APIと表示

認証付きの`GET /api/courses/:courseId/create-quests`を追加した。course router → controller → service → 共有Prismaの順に接続し、`CreateQuestCourse`の`courseId`を逆引きする。公開クエストかつ公開コースに限定し、`sortOrder`・ID順で`{ items: [{ id, title }] }`だけを返す。対応なし・削除済み・非公開コースは空配列になる。未認証は401、空のcourseIdは400。読み取り専用で、提出コードや利用者の挑戦履歴は取得しない。

フロントは`create.api.ts`と既存fetcherを経由する。`UnitCreateQuests`は最終結果の`renderRewards`だけに置き、実績・カードの報酬まとめ → **作るで試す** → **もっと調べるキーワード**の順で別の節に表示する。関連クエストが空なら見出し・説明を含めて何も出さない。リンクはクエスト名と`/create/quests/:questId`で、IDをURLエスケープする。

取得失敗時は再読み込みだけを案内し、他の操作を止めない。画面離脱・コース切替時は古い応答を使わず、表示も現在の認証トークンとコースに一致する応答に限る。所持カードや報酬の遅延には依存せず、再訪でも関連コースの現在の定義とクエスト名を読む。

全7単元が使う既存の最終結果の差し込み口を使用する。フィードバック画面には配置しない。完了保存・報酬付与・フィードバック生成・実験条件・問題・採点・教材版・Prisma schema・seedは変更していない。

## 検証

- back: typecheck、lint、build、verify:static成功。新設`verify:unit-create-quests`を静的検証へ追加。
- 新検証は既存seedの全関連コースを用い、逆引き・公開条件・返却項目・順序・最新タイトル・関連なし・非公開／削除済みの除外、controllerの認証と入力エラーを確認する。インメモリアダプターは`findMany`以外のDB操作を拒否する。
- front: typecheck、build、verify:static、verify:learning-player、verify:learning-rewards、verify:bfs-unit、verify:dfs-unit成功。
- `verify:card-surface`を拡張し、空の非表示、日本語の見出し・取得したクエスト名・エスケープ済み詳細リンク、最終結果だけの配置、キーワード欄との順序、全7単元の差し込み口を確認。
- lintはローカルの未追跡生成物`.next-migration`を除外して成功（`node node_modules/eslint/bin/eslint.js . --ignore-pattern=.next-migration/**`）。build内のソースlintも成功。既存のHook警告5件のみ。
- ブラウザーでは実際の`LearningUnitPreview`・`UnitFinalResult`・報酬・キーワード・新しいクエスト導線を固定の完了状態で接続した。認証は検証用に置換し、新APIは実controller/serviceとseedの関連コースを使うインメモリアダプターへ接続した。
- 関連あり（BFS）と関連なし（穴掘り法）を両サイズで確認。名前・リンク先の一致、クリック後の詳細URL、検索欄との並び、フィードバック画面への遷移で両導線が外れること、結果へ戻れること、取得失敗からの再読み込み、GETのみの通信、横はみ出し・ブラウザー例外なしを確認した。詳細画面の遷移先は検証用の受け口で、実際のクエスト操作は行っていない。

## 画面証跡

CSS表示領域1093×614／2560×1440、倍率100%、デバイス倍率1、動きを減らす設定。小さい画面では既存の本文スクロールで下部へ移動して導線を確認する。

| 状態 | 1093×614 | 2560×1440 |
| --- | --- | --- |
| 関連あり・導線とキーワード | [画像](evidence/issue490/create-links-1093x614.png) | [画像](evidence/issue490/create-links-2560x1440.png) |
| 関連なし・キーワードのみ | [画像](evidence/issue490/no-create-links-1093x614.png) | [画像](evidence/issue490/no-create-links-2560x1440.png) |
| 関連あり・最終結果の上部 | [画像](evidence/issue490/final-related-1093x614.png) | [画像](evidence/issue490/final-related-2560x1440.png) |
| 関連なし・最終結果の上部 | [画像](evidence/issue490/final-none-1093x614.png) | [画像](evidence/issue490/final-none-2560x1440.png) |

## 未実施・運用

Firebase認証・実DB・Cloud Runを通す完了保存、クエスト詳細の読み込みと提出、実フィードバック生成を一連で通すE2Eは未実施。ブラウザーのフィードバック遷移先は接続確認用の固定パネルである。既存の保存・フィードバック契約は静的検証で確認した。DB migration・seed適用は不要で、このIssueで実DB操作は行っていない。frontとbackのコードのデプロイで反映される。
