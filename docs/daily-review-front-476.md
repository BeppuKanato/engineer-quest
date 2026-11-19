# 今日の復習フロント（B3-b）

- 目的: ホームから学習済みの1問だけを解き、復習専用の記録へ結果を保存する。
- 適用範囲: ホームの入り口、/daily-review、APIクライアント、既存教材・図・入力部品の読み取り再利用、関連検証。B2のホーム構成変更は含めない。
- 最終確認日: 2026-11-19。
- 正本: [Issue #476](https://github.com/BeppuKanato/engineer-quest/issues/476)、[API仕様 #474](daily-review-back-474.md)、[開発ガイド](../AGENTS.md)、[教材指針](concept/learning-materials-guideline.md)、[UI定義](concept/learning-player-ui.md)。
- 対象実装コミット: `0231366d`、小画面の高さ調整 `4ff0a152`。
- 状態: 実装・自動検証・ブラウザー固定APIでの操作／2サイズ撮影済み。DB変更なし。

## 体験

ホームに、今日の問題があり対応可能な場合だけ「今日の復習」を表示する。未回答は単元名と「復習する」、回答済みは完了と正誤を表示し、もう1問のリンクは出さない。取得失敗・候補なし・対応外の問題ではカードを出さない。

/daily-reviewはApp Routerの薄い入口と、features/learning/daily-reviewの専用画面で構成する。APIの4 IDを照合して1問だけ描画する。既存の各単元のcontent、CheckCanvas／ConsolidationGraph等、CodeDisplay、ParsonsBoardを参照し、単元ごとの画面は複製しない。前提付きの問題は元の固定スナップショットを使い、1問用のメモリ上のセッションだけrequiresをnullにする。元の教材オブジェクトは変更しない。

回答は既存answerQuestionで判定し、AnswerFeedbackProvider／useAssessmentFeedbackで正誤表示とanswerCorrect／answerIncorrectの音を使う。初回回答の直後に入力をロックし、不正解でも今日は1問で終了する。保存失敗時は同じ初回の正誤だけを再送でき、別の回答へ変更できない。409／404は当日の状態を取り直す。ページ再読み込みやホーム再訪ではAPIの保存済み状態を使う。

APIの取得状態はキャッシュせず、日本時間の日付変更・ウィンドウ復帰で再取得する。日付の古い応答や認証スコープ変更後の応答を新しい日の状態へ入れない。未知のIDの直リンクも解答入力を出さずホームへ戻せる。

## 評価記録との境界

新設dailyReview.api.tsはGET /daily-review/todayとPOST /daily-review/today/answerだけを呼ぶ。画面は通常のPreview全体、useAssessmentObservation、useAssessmentCompletion、onLearningEvent、評価証拠の出力、フェーズ完了保存を取り込まない。評価状態機械が生成するセッションは画面メモリだけに保持する。

既存教材・図・正解・concepts.json・バックエンド・フィードバック生成・実験条件には差分がない。復習の正誤だけを専用APIへ送るので、学習進捗・評価証拠・フィードバックの材料を増やさない。バックエンドの保存先分離は #474、dev実DBでの確認結果は [PR #484](https://github.com/BeppuKanato/engineer-quest/pull/484) に記録している。

## 対応範囲と除外（Issue仕様3に基づく）

7単元・全150問を照合し、**148問・4形式（タップ／選択／穴埋め／並べ替え）**に対応する。前提付き10問は単独で出題できる。

次の2問だけは、既存ParsonsBoardの固定行制約で初期配置から正解にできないため、ホームカードも出題画面も表示しない。バックエンド側の選出ルールを変えたり、代わりの問題を取り直したり、回答済みにしたりしない。

| 単元 | phaseKey / assessmentId | questionId | 理由 |
| --- | --- | --- | --- |
| 幅優先探索 | bfs-consolidation | whole-code-order | 初期配置のinitialize-queue等が、正解時の固定行で区切った区間と異なる区間にある |
| 棒倒し法 | wall-extension-consolidation | whole-code-order | 初期配置が固定行区間をまたぎ、許可される移動だけでは正解順にできない |

既存部品の↑↓・ドラッグは固定行を越えられない。復習のために教材や正解を変えることを避け、`unsupportedReviewReason` が区間内の行集合を確認して対象外にする。ほかの5単元の並べ替えには対応する。対象外の日は復習行を未回答のまま残し、その日は出題しない。バックエンドが翌日も同じ対象外問題を選ぶ可能性はある。教材側の初期配置の改善は別変更として扱う。

## 検証

- front: typecheck、build、verify:static、verify:home-layout成功。新設verify:staticはverify:daily-reviewと既存home-layoutをまとめ、CIにも追加。
- lint: 変更ファイルはエラー・警告なし。全体も既存.next-migration生成物だけを除外したESLintで成功（既存プレイヤーのHook警告5件）。通常lintはそのローカル生成物を走査する既知の問題があるため、生成物を消したりlint設定を変えたりしていない。
- verify:feedback-materials成功。7単元・21評価セット・150問の教材アーカイブ一致を確認。
- back verify:static全体成功。verify:collections、学習・概念・フィードバック保存の既存検証を含む。
- verify:daily-reviewは全150問との照合、対応148問すべての元の図の描画、既存評価エンジンでの正解判定、前提付き問題の単独化と元オブジェクト不変、対応外2問、完了カードの正誤とリンク非表示、禁止した保存／観測処理への非接続を確認する。
- 実ブラウザーではローカル固定APIと認証コンテキストを使用。全4形式の実入力（並べ替えは↑↓で正解順へ移動して回答）、正解／不正解の音の呼出し、1回答1POST、保存失敗から同一payloadの再送、前提付き問題の単独出題、回答後のホーム、候補なし／対象外のカード非表示を確認した。記録系のPOSTが復習APIだけであることも検証した。
- 未実施: Firebase／Cloud Runと実DBを接続した画面E2E、実スピーカーでの聴取、端末固有のタッチドラッグ。音は既存の音声再生関数へ正しい種類を1回渡したことを検証した。

## 画面証跡

実画面コンポーネントをブラウザーで動かし、固定APIで撮影。CSS表示領域1093×614／2560×1440、倍率100%、deviceScaleFactor=1、Asia/Tokyo。ページ全体を撮影し、ページ横スクロールがないことを確認した。狭い画面ではコード・並べ替えを縦にスクロールして操作でき、既存ヘッダーの一部ナビゲーションの見切れは今回の対象外。

| 状態 | 1093×614 | 2560×1440 |
| --- | --- | --- |
| ホーム・未回答 | [画像](evidence/issue476/home-1093x614.png) | [画像](evidence/issue476/home-2560x1440.png) |
| ホーム・回答済み | [画像](evidence/issue476/home-answered-1093x614.png) | [画像](evidence/issue476/home-answered-2560x1440.png) |
| タップ | [画像](evidence/issue476/node-1093x614.png) | [画像](evidence/issue476/node-2560x1440.png) |
| 選択 | [画像](evidence/issue476/choice-1093x614.png) | [画像](evidence/issue476/choice-2560x1440.png) |
| 穴埋め | [画像](evidence/issue476/code-blank-1093x614.png) | [画像](evidence/issue476/code-blank-2560x1440.png) |
| 並べ替え | [画像](evidence/issue476/parsons-1093x614.png) | [画像](evidence/issue476/parsons-2560x1440.png) |

## 適用

DB適用は不要。#474のバックエンドAPIとmigrationが利用できる環境へ、フロントをデプロイする。今回DB・seed・本番操作は実施していない。マージはユーザーの判断に従う。
