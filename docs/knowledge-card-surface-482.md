# 知識カードの参照表示と再訪導線（Issue #482）

- 目的: カードと作る課題の対応を、作業中の参考表示と再訪導線へ接続する。
- 適用範囲: 作る作業画面、知識カード詳細、全7単元の最終結果画面と参照API。
- 最終確認日: 2026-11-19
- 正本: [Issue #482](https://github.com/BeppuKanato/engineer-quest/issues/482)、[Issue #480のデータ契約](knowledge-card-use-context-480.md)、[開発ガイド](../AGENTS.md)
- 対象実装コミット: `3a431b57`、前提の検証修正 `a21fc0ef`（本報告の追加前）
- 状態: 実装・自動検証・2サイズでの表示検証済み。実DB・Firebaseを通す結合検証は未実施。

## 表示と導線

作る作業画面の脇に、初期状態では閉じた「関連する知識カード（参考）」を置いた。所持カードはタイトルから、その場で説明と使える場面を開ける。未所持カードは既存のUnknownKnowledgeCardを利用し、影・疑問符・日本語のレアリティだけを表示する。未所持カードのタイトル・説明・使える場面はAPIでも返さない。

カード取得は既存の作業データ取得から独立している。未所持・対応なし・参照APIの失敗でも、保存・テスト・提出を制限しない。失敗時は参考欄だけに再読み込みを表示する。クエストの要件・採点・提出・AIレビューや、カード出現・実績解除の演出は変更しない。

知識カード詳細には、所持カードに対応する公開中の作る課題がある場合だけ「使える場所」を追加した。クエスト名はDBから取得し、リンクは既存の課題詳細画面へ向ける。対応なし・削除済み・非公開の課題には導線を出さない。キーワードは従来の非リンクのチップを維持した。

外部検索のチップは、LearningScreenの最終結果用renderRewardsだけに追加した。共通単元コンテナのBFS・DFSと個別コンテナの5単元すべてに接続する。その単元の所持済みカードをDBから取得するため、報酬演出を閉じた後や最終結果への再訪でも参照できる。未所持・別単元のカードは対象にせず、検索語がなければ表示しない。検索URLはエンコードし、新しいタブをnoopener/noreferrerで開く。

## API契約

いずれも既存のcollectionルーターにFirebase認証を適用し、本人は認証済みユーザーから取得する。

| API | 返す情報 |
| --- | --- |
| GET `/api/collection/knowledge-cards/for-quest/:questId` | 公開中クエストにrelatedCreateQuestIdsで対応する公開カード。未所持はid・rarity・isCollectedだけ。所持はtitle・description・useCaseを追加 |
| GET `/api/collection/knowledge-cards/for-unit/:courseId` | 公開単元の所持済み公開カードのid・title・searchKeywords |
| GET `/api/collection`（既存） | 所持カードに公開中のrelatedQuests（id・title）を追加。未所持は空配列 |

対応表は#480のデータを参照し、フロントへクエストIDや対応表を決め打ちしていない。新規参照APIに書き込みはない。既存collectionの未配布カード救済と実績評価は従来どおりであり、その動作は変更していない。

## 検証

- front: typecheck、lint、build、verify:static、verify:learning-rewardsと7単元のverify:*unitが成功。
- frontの独立したlintはローカル生成物 `.next-migration/**` のみ除外して実行。エラー0件、未変更の個別単元コンテナの既存Hook警告5件。
- back: typecheck、lint、build、verify:staticが成功。verify:collections、verify:create-quests、verify:seed-preservation、フィードバック検証等を含む。
- 新設verify:card-referencesはメモリ上のDBアダプターで実サービスを通し、対応データ参照、本人の所持条件、未所持のレスポンス非開示、最新の公開課題名、空・削除・非公開対応、単元内の所持カード、401/400/404と参照操作のみを確認した。
- 新設verify:card-surfaceは描画結果で所持内容・未所持の非表示、対応なしの非表示、リンクのエンコード、検索の別タブ属性を検証。全7単元の最終結果への接続と、カード詳細の非リンクチップも確認した。両検証を各verify:staticへ追加した。
- #480でDFSのカードを「枝刈り」へ差し替えた後、既存DFS統合検証が旧タイトルを期待していたため、その1行を更新し、backのverify:static全体を再実行して成功を確認した。

## ブラウザー検証と証跡

実際の作業ページ・カードページ・最終結果コンポーネントを、ローカルのAPI固定データで起動した。参照レスポンスはメモリ上のアダプターを通して実際のバックエンドserviceから生成した。所持と未所持の表示、内容の展開、使える場所と検索URL、横はみ出しなしを確認した。全未所持・対応なし・参照APIの503でも、既存の提出操作と提出後表示へ進めることを確認した。

作業画面のエディタとPythonランタイムは検証用の代替を使用し、提出・レビューのAPIも固定応答である。実際のPython実行・実DB保存・AIレビューの結合検証ではない。最終結果は実コンポーネントへLearningScreenと同じ報酬用構成を渡して表示しており、学習開始から完了まで通すE2Eではない。

ビューポート1093×614／2560×1440、倍率100%、デバイス倍率1、開閉アニメーション完了後に撮影した。カード詳細は「使える場所」までダイアログ内をスクロールして撮影し、他画面はページ全体を撮影した。小さい画面では参考欄は作業領域の下に並び、大きい画面では右側に置かれる。

| 状態 | 1093×614 | 2560×1440 |
| --- | --- | --- |
| 作業画面・所持内容を展開 | [画像](evidence/issue482/work-mixed-1093x614.png) | [画像](evidence/issue482/work-mixed-2560x1440.png) |
| 作業画面・全未所持 | [画像](evidence/issue482/work-hidden-1093x614.png) | [画像](evidence/issue482/work-hidden-2560x1440.png) |
| カード詳細・使える場所 | [画像](evidence/issue482/card-detail-1093x614.png) | [画像](evidence/issue482/card-detail-2560x1440.png) |
| 最終結果・検索キーワード | [画像](evidence/issue482/final-result-1093x614.png) | [画像](evidence/issue482/final-result-2560x1440.png) |

## DB適用と未実施

今回のschema・migration・seedの変更はなく、新たなDB適用は不要。前提として#480のmigrationとseed:preserveが対象環境へ適用されている必要がある。コードのマージだけでは対応データの適用は保証されない。今回dev・本番を含むDBへの操作は行っていない。

Firebase認証・実DB・Cloud Runを通す結合検証、実際のPython実行から提出・AIレビューまでのE2E、外部検索結果の内容確認は未実施。
