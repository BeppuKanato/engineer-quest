# DFS「動きの確認問題」単品プレビュー

- 目的・適用範囲: Issue #123。DFSの動きを図の1タップ選択・連動2問で確認する単品教材。
- 最終確認日: 2026-11-06。状態: 現行。
- 正本: [DFS基準データ §4](../../../../../../../docs/concept/dfs-unit-baseline.md)、[教材指針 §1・フェーズ3](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI](../../../../../../../docs/concept/learning-player-ui.md)。
- 実施記録・基準書との差: [dfs-check-123.md](../../../../../../../docs/dfs-check-123.md)。

URL: `/learning-preview/dfs-check`。通常のfront開発サーバーなら`http://localhost:3000/learning-preview/dfs-check`。ログイン・バックエンド不要。

| 問 | 表示ステップ | 正解 | 復習ステップ |
| --- | --- | --- | --- |
| take-next | skip-b-from-d（11、スタックC,E,F） | F | skip-b-from-d → pop-f |
| after-f | dead-end-f（13、スタックC,E） | E | dead-end-f → pop-e |

`check.content.ts`は設問・正解・論点タグ・復習ID・肯定文だけを定義する。図はDFSの動きの説明の元ステップを参照し、座標・辺・状態を再定義しない。どちらも次に取り出す場所があるため、「どれも入らない」は出さない。

`DfsCheckCanvas`は`DfsExecutionCanvas`を再利用し、BFSと共通の`assessment/NodeAnswerOverlay`を重ねる。すべての丸へ同じ破線リングとタップアイコンを付け、回答中は教材側のノード・スタックの強調枠だけを抑える。処理中=青、待ち=ベージュ、完了=グレーと辺・スタック・訪問順は維持する。透明な操作面は44px以上、図は同じ座標と縦横比で拡縮する。700msの操作案内は2回のみ、reduced-motionでは止める。

`DfsCheckPreview`は共通assessmentで回答・再試行・進行を管理する。回答だけでは次問へ進まない。正解後は入力を固定し、「次の問題へ」「結果を見る」で進む。不正解後は再回答または任意復習ができ、不正解のまま進んでもよい。初回の正誤は再挑戦で上書きしない。全問に1回以上回答して進むと完了し、初回正解数を1文で表示する。「もう一度解く」はメモリ内のセッションを作り直す。

正誤提示は既存`useAssessmentFeedback`/`AnswerFeedbackNotice`を使う。○/×だけの短い演出と既存効果音、演出後も残る太字の補足を共通基盤に任せる。任意復習は`LearningReviewDialog`内で元の図と文章を共通LearningPlayerに渡し、閉じても試行数・結果は変わらない。

確認手順:

1. 問1でA等を選ぶ。復習ボタンでDのチェック→Fの取り出しを見て閉じ、Fを選び直す。正解後は丸が無効になり、「次の問題へ」で問2へ進む。
2. 問2でF等を選ぶ。任意復習で行き止まりのF→残っていたEの取り出しを確認する。Eを選び直して「結果を見る」へ進む。初回を両方間違えていれば0/2のまま。
3. もう一度解いてF→次の問題へ→E→結果を見ると、初回2/2になる。両問ともA→次へと進んでも0/2で完了する。
4. Tab/Enter/Spaceで回答できる。復習はEscで閉じられ、開き直すと先頭から表示する。

検証: `npm run verify:dfs-check`。設問とDFSスタックの対応、元ステップの参照同一性、全候補の誤答と再試行、初回結果の保持、ソフトゲート、実際のPreviewコールバックの入力固定・復習・完了・やり直し、SSRのボタン・色・二重リングの抑制を確認する。実行トレースの回帰は`verify:dfs-execution`、BFS側は`verify:bfs-check`、共通の正誤提示は`verify:answer-feedback`で確認する。

アプリ組み込み、進捗・学習ログ保存、他段階との接続、専用リザルト演出は対象外。DB・seed適用不要。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
