# DFS「動きの確認問題」単品プレビュー

- 目的・適用範囲: Issue #123。DFSの動きを図の1タップ選択・連動サイクルで確認する単品教材。2026-11-17 の基準改訂（問題数は固定せず、前提カバーと「流れを理解できていると判断するに足るか」で決める）で4サイクル8問に拡充した。
- 最終確認日: 2026-11-18。状態: 現行。
- 正本: [DFS基準データ §4](../../../../../../docs/concept/dfs-unit-baseline.md)、[教材指針 §1・フェーズ3](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI](../../../../../../docs/concept/learning-player-ui.md)。
- 実施記録・基準書との差: [dfs-check-123.md](../../../../../../docs/dfs-check-123.md)。

URL: `/learning-preview/dfs-check`。通常のfront開発サーバーなら`http://localhost:3000/learning-preview/dfs-check`。ログイン・バックエンド不要。

| 問 | 表示ステップ | 正解 | 復習ステップ |
| --- | --- | --- | --- |
| take-next | skip-b-from-d（11、スタックC,E,F） | F | skip-b-from-d → pop-f |
| after-f | dead-end-f（13、スタックC,E） | E | dead-end-f → pop-e |
| push-next-from-a | push-c-from-a（3、スタックC） | B | push-c-from-a → push-b-from-a |
| take-after-push | push-b-from-a（4、スタックC,B） | B | push-b-from-a → pop-b |
| visit-order-f | pop-d（9、訪問順A,B,D） | 4（数値の選択肢） | pop-d → pop-f |
| add-after-f | pop-f（12、スタックC,E） | どれも入らない | pop-f → dead-end-f |
| add-after-e | pop-e（14、スタックC） | どれも入らない | pop-e → no-add-from-e |
| stack-empty | no-add-from-e（15、スタックC） | C | no-add-from-e → pop-c → finish-all |

`check.content.ts`は設問・正解・論点タグ・復習ID・肯定文だけを定義する。図はDFSの動きの説明の元ステップを参照し、座標・辺・状態を再定義しない。拡充の狙いは、前提カバー表で未確認だった「何が積まれるか（問3・問4の積む順序、問6・問7の追加しない判断）」「訪問順（問5）」「終了（問8）」を覆うこと。問5だけ数値の選択肢（concept-check）で、他は図のノードタップ。問6・問7は文面を揃え、追加されない理由の内訳の違いを際立たせる。次に取り出すものが必ずある場面では「どれも入らない」は出さない。

`DfsCheckCanvas`は`DfsExecutionCanvas`を再利用し、BFSと共通の`assessment/NodeAnswerOverlay`を重ねる。すべての丸へ同じ破線リングとタップアイコンを付け、回答中は教材側のノード・スタックの強調枠だけを抑える。処理中=青、待ち=ベージュ、完了=グレーと辺・スタック・訪問順は維持する。透明な操作面は44px以上、図は同じ座標と縦横比で拡縮する。700msの操作案内は2回のみ、reduced-motionでは止める。「どれも入らない」のボタンは図の下の操作域に置き、図の拡縮率は操作域を除いた高さで決める。

`DfsCheckPreview`は共通assessmentで回答・再試行・進行を管理する。回答だけでは次問へ進まない。正解後は入力を固定し、「次の問題へ」「結果を見る」で進む。不正解後は再回答または任意復習ができ、不正解のまま進んでもよい。初回の正誤は再挑戦で上書きしない。全問に1回以上回答して進むと完了し、初回正解数を1文で表示する。「もう一度解く」はメモリ内のセッションを作り直す。

正誤提示は既存`useAssessmentFeedback`/`AnswerFeedbackNotice`を使う。○/×だけの短い演出と既存効果音、演出後も残る太字の補足を共通基盤に任せる。任意復習は`LearningReviewDialog`内で元の図と文章を共通LearningPlayerに渡し、閉じても試行数・結果は変わらない。

確認手順:

1. 問1でA等を選ぶ。復習ボタンでDのチェック→Fの取り出しを見て閉じ、Fを選び直す。正解後は丸が無効になり、「次の問題へ」で問2へ進む。
2. 問2でF等を選ぶ。任意復習で行き止まりのF→残っていたEの取り出しを確認する。Eを選び直して次へ進む。
3. 問3・問4で積む順序（CのあとBが入り、Bが先に取り出される）を確認する。問5は数値ボタンで「4」を選ぶ。
4. 問6・問7は「どれも入らない」が正解。ノードを選ぶと不正解になり、再回答できる。
5. 問8でCを選ぶと完了し、初回正解数が8問中で表示される。全問誤答で進んでも0/8のまま完了する（ソフトゲート）。
6. Tab/Enter/Spaceで回答できる。復習はEscで閉じられ、開き直すと先頭から表示する。

検証: `npm run verify:dfs-check`。設問とDFSスタックの対応、元ステップの参照同一性、全候補の誤答と再試行、初回結果の保持、ソフトゲート、実際のPreviewコールバックの入力固定・復習・完了・やり直し、SSRのボタン・色・二重リングの抑制を確認する。実行トレースの回帰は`verify:dfs-execution`、BFS側は`verify:bfs-check`、共通の正誤提示は`verify:answer-feedback`で確認する。

アプリ組み込み、進捗・学習ログ保存、他段階との接続、専用リザルト演出は対象外。DB・seed適用不要。
