# フロント共通化の基準と作業記録

- 目的: 移行前の依存・寸法・検証結果と、段階ごとの変更を追跡する。
- 適用範囲: フロントエンド移行M00以降。
- 最終確認日: 2026-11-12
- 基準コミット: `07bf7ed`（移行前）。作業ブランチ: `refactor/frontend-migration`。
- 正本: [採用方針](frontend-architecture.md)、[移行計画](frontend-migration-plan.md)、[プレイヤーUI](concept/learning-player-ui.md)。

## M00: 移行前の基準

### 検証

`build`・`lint`・`typecheck`と既存verifyを計80件実行。Python実行環境を補正した結果は成功80件、失敗0件。

初回は31件が失敗。`python3`がWindowsのストア用エイリアス（終了9009）だったため、`PYTHON=D:\Python310\python.exe`、`PYTHONUTF8=1`を指定して再実行した。教材・テストのコードは変更していない。

| 検証 | 結果 |
| --- | --- |
| `build` | 成功 |
| `lint` | 成功 |
| `typecheck` | 成功 |
| `verify:learning-player` | 成功 |
| `verify:bfs-motivation` | 成功 |
| `verify:dfs-motivation` | 成功 |
| `verify:wall-extension-motivation` | 成功 |
| `verify:wall-extension-execution` | 成功 |
| `verify:wall-extension-check` | 成功 |
| `verify:wall-extension-code-mapping` | 成功 |
| `verify:wall-extension-code-check` | 成功 |
| `verify:wall-extension-consolidation` | 成功 |
| `verify:wall-extension-implementation` | 成功 |
| `verify:wall-extension-trace` | 成功 |
| `verify:wall-extension-unit` | 成功 |
| `verify:bubble-sort-motivation` | 成功 |
| `verify:bubble-sort-execution` | 成功 |
| `verify:bubble-sort-check` | 成功 |
| `verify:bubble-sort-code-mapping` | 成功 |
| `verify:bubble-sort-code-check` | 成功 |
| `verify:bubble-sort-consolidation` | 成功 |
| `verify:bubble-sort-implementation` | 成功 |
| `verify:bubble-sort-trace` | 成功 |
| `verify:bubble-sort-unit` | 成功 |
| `verify:maze-digging-motivation` | 成功 |
| `verify:maze-digging-execution` | 成功 |
| `verify:maze-digging-check` | 成功 |
| `verify:maze-digging-code-mapping` | 成功 |
| `verify:maze-digging-code-check` | 成功 |
| `verify:maze-digging-consolidation` | 成功 |
| `verify:maze-digging-implementation` | 成功 |
| `verify:maze-digging-trace` | 成功 |
| `verify:maze-digging-unit` | 成功 |
| `verify:binary-search-motivation` | 成功 |
| `verify:binary-search-execution` | 成功 |
| `verify:binary-search-check` | 成功 |
| `verify:binary-search-code-mapping` | 成功 |
| `verify:binary-search-code-check` | 成功 |
| `verify:binary-search-consolidation` | 成功 |
| `verify:binary-search-implementation` | 成功 |
| `verify:binary-search-trace` | 成功 |
| `verify:binary-search-unit` | 成功 |
| `verify:greedy-coins-motivation` | 成功 |
| `verify:greedy-coins-execution` | 成功 |
| `verify:greedy-coins-check` | 成功 |
| `verify:greedy-coins-code-mapping` | 成功 |
| `verify:greedy-coins-code-check` | 成功 |
| `verify:greedy-coins-consolidation` | 成功 |
| `verify:greedy-coins-implementation` | 成功 |
| `verify:greedy-coins-trace` | 成功 |
| `verify:greedy-coins-unit` | 成功 |
| `verify:dfs-execution` | 成功 |
| `verify:dfs-check` | 成功 |
| `verify:dfs-code-mapping` | 成功 |
| `verify:dfs-code-check` | 成功 |
| `verify:dfs-consolidation` | 成功 |
| `verify:dfs-implementation` | 成功 |
| `verify:dfs-trace` | 成功 |
| `verify:dfs-unit` | 成功 |
| `verify:bfs-execution` | 成功 |
| `verify:bfs-check` | 成功 |
| `verify:bfs-code-mapping` | 成功 |
| `verify:bfs-code-check` | 成功 |
| `verify:bfs-consolidation` | 成功 |
| `verify:bfs-implementation` | 成功 |
| `verify:bfs-trace` | 成功 |
| `verify:bfs-unit` | 成功 |
| `verify:bfs-free-execution` | 成功 |
| `verify:learning-screens` | 成功 |
| `verify:learning-rewards` | 成功 |
| `verify:mascot-presentation` | 成功 |
| `verify:response-feedback` | 成功 |
| `verify:answer-feedback` | 成功 |
| `verify:parsons-order-feedback` | 成功 |
| `verify:home-layout` | 成功 |
| `verify:unit-overview` | 成功 |
| `verify:app-breadcrumbs` | 成功 |
| `verify:feedback-concepts` | 成功 |
| `verify:feedback-map` | 成功 |
| `verify:feedback-candidates` | 成功 |

### 表示の基準

普段のlocalhost:3000とは別のポート3100を使う一時サーバー（M01で`.next-migration`出力を確実に分離）で、認証不要の教材プレビューを検証。比較値はCSSピクセル。実機ディスプレイのOS倍率から推測した値ではない。実機のviewport・アプリ内の認証後フローは未計測。

貪欲法の応用問題を画面上で3問回答してParsonsまで進め、各サイズで上下移動と誤答提出を実行。コンソールの未処理エラーなし。変更前の盤面は高さ368px固定（幅800未満／高さ640以下は内容高）で、大画面でも内容394pxに内部スクロールが発生し、下に余白が残る。

| viewport | セクション幅×高 | 盤面幅×高 | 内容高 | ページ横はみ出し |
| --- | --- | --- | --- | --- |
| 1366×768 | 1147×645 | 1131×368 | 394 | なし |
| 1536×864 | 1290×726 | 1274×368 | 421 | なし |
| 2560×1440 | 2150×1210 | 2134×368 | 394 | なし |
| 799×640 | 671×538 | 655×394 | 417 | なし |

[変更前 1366×768](assets/frontend-migration/baseline-1366x768.png) / [変更前 1536×864](assets/frontend-migration/baseline-1536x864.png) / [変更前 2560×1440](assets/frontend-migration/baseline-2560x1440.png) / [変更前 799×640](assets/frontend-migration/baseline-799x640.png)

### 依存の棚卸しと移行先

| 現在 | 参照範囲／差分 | 移行先 |
| --- | --- | --- |
| `bfs/consolidation/ParsonsBoard`・`parsonsOrderFeedback` | 7単元の応用問題、実装ヒント、採点 | learning/components/assessment、learning/assessment |
| `bfs/unit/PhaseBridgeScreen`・`UnitResultScreens`・`UnitResultCelebration` | BFS/DFSの共通制御と他5単元の個別制御。共通結果のBFS図既定値は分離が必要 | learning/components/results |
| `unit/unit.types` | BFS/DFSと画面・保存・報酬境界 | learning/types |
| `unit/LearningUnitPreview` | BFS/DFSは薄いアダプター。BFSは非表示プレイヤー継続、DFSは初回結果表現 | 維持し残り5単元を個別に接続 |
| 他5単元のUnitPreview | 約300行ずつの重複。結果図、文言、完了時成績の表現が固有 | 薄い定義アダプターへ |
| code-check | 6単元は320px窓、DFSは全コード表示 | 差分を保ちM04で枠抽出 |
| code-mapping | 最小コード620px＋図480px。DFS比率52%、他48% | M05で配置抽出、折り返しは独立判断 |
| implementation | BFS内の共通WorkspaceをDFSが利用。他5単元は重複 | M06で共通Workspace、固有実行器は維持 |
| `app/component/appHeader` | mascotとsessionを含むアプリ構成に依存 | 純粋な表示とapp側接続をM07で分離 |

次は共有基盤の参照元一覧（移行前のimportを含むファイル。型参照を含み、実行時依存数とは異なる）。

#### app/component/userSession

- `app/layout.tsx`
- `app/achievements/page.tsx`
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/collection/page.tsx`
- `app/component/hexadRouteGuard.tsx`
- `app/component/mascot.ts`
- `app/courses/page.tsx`
- `app/create/page.tsx`
- `app/create/quests/[questId]/page.tsx`
- `app/create/quests/[questId]/work/page.tsx`
- `app/hexad/page.tsx`
- `app/history/page.tsx`
- `app/home/page.tsx`
- `app/knowledge-cards/page.tsx`
- `app/my-works/page.tsx`
- `app/profile/page.tsx`
- `app/quest-board/page.tsx`
- `app/quest-board/new/page.tsx`
- `app/quest-board/[postId]/page.tsx`
- `features/learning/app/ContinueLearning.tsx`
- `features/learning/app/HomeUnitGrid.tsx`
- `features/learning/app/LearningScreen.tsx`
- `features/learning/app/UnitOverview.tsx`
- `features/learning/app/useLearningLog.ts`
- `features/learning/app/useLearningProgress.ts`
- `features/learning/app/bigGoal/BigGoalBanner.tsx`

#### app/component/soundFeedback

- `app/layout.tsx`
- `app/achievements/page.tsx`
- `app/profile/page.tsx`
- `app/quest-board/new/page.tsx`
- `app/quest-board/[postId]/page.tsx`
- `features/learning/app/ResultConfetti.tsx`
- `features/learning/assessment/AnswerFeedback.tsx`
- `features/learning/bfs/implementation/BfsImplementationPreview.tsx`
- `features/learning/binary-search/implementation/BinarySearchImplementationPreview.tsx`
- `features/learning/bubble-sort/implementation/BubbleSortImplementationPreview.tsx`
- `features/learning/greedy-coins/implementation/GreedyCoinsImplementationPreview.tsx`
- `features/learning/maze-digging/implementation/MazeDiggingImplementationPreview.tsx`
- `features/learning/rewards/LearningRewardBoundary.tsx`
- `features/learning/wall-extension/implementation/WallExtensionImplementationPreview.tsx`

#### app/component/feedbackV1

- `app/achievements/page.tsx`
- `app/collection/page.tsx`
- `app/courses/page.tsx`
- `app/create/page.tsx`
- `app/create/quests/[questId]/page.tsx`
- `app/create/quests/[questId]/work/page.tsx`
- `app/history/page.tsx`
- `app/home/page.tsx`
- `app/knowledge-cards/page.tsx`
- `app/profile/page.tsx`
- `app/quest-board/page.tsx`
- `app/quest-board/new/page.tsx`
- `app/quest-board/[postId]/page.tsx`
- `features/learning/app/LearningScreen.tsx`
- `features/learning/app/feedback/FeedbackScreen.tsx`

#### app/component/appHeader

- `app/achievements/page.tsx`
- `app/collection/page.tsx`
- `app/courses/page.tsx`
- `app/create/page.tsx`
- `app/create/quests/[questId]/page.tsx`
- `app/create/quests/[questId]/work/page.tsx`
- `app/history/page.tsx`
- `app/home/page.tsx`
- `app/knowledge-cards/page.tsx`
- `app/my-works/page.tsx`
- `app/profile/page.tsx`
- `app/quest-board/page.tsx`
- `app/quest-board/new/page.tsx`
- `app/quest-board/[postId]/page.tsx`
- `features/learning/app/LearningScreen.tsx`
- `features/learning/app/UnitOverview.tsx`

### 確認の限界

M00は既存挙動の基準記録であり、既存画面の見た目を承認したものではない。ノート・デスクトップ実機、ログイン済みAPI保存、実LLM生成、モナコ内のPython実行、ドラッグ操作はこの基準の時点では未確認。外部APIを呼ぶ検証は実行していない。

## M01-A: 表示を保つ枠の抽出

`LearningContentLayout`に単品／組み込みの外枠、`AssessmentLayout`に本文スクロールと下部操作の差し込み口を抽出し、貪欲法の応用問題へ適用。教材・採点・状態は元の画面に残した。4サイズのセクション・盤面・回答ボタン寸法は抽出前と一致。回答演出後に計測した盤面内容高は全サイズ394px（初回の420px前後は移動演出中の値）。型・Lint・build・貪欲法応用verify成功。Lintの既存5警告は変化なし。


## M01-B: 貪欲法の並べ替え表示

- コード並べ替えだけ外枠の最大幅1200pxを設けた。図・アニメーション・実装エディタには適用しない。幅1536/2560ではセクション幅1200px、1366では従来の84vwを維持。
- 固定368px窓を、利用可能な高さを上限とする内容高へ変更。全8行の盤面394pxが通常高さで全行表示され、不必要な内部スクロールを解消。回答ボタンは直後に続き、長いコードでは盤面だけ縮んでスクロールする。
- 幅799×高さ640の既存分岐は本文スクロールを維持。コード末尾を中央へスクロールするとsticky操作行の上に表示されることを実ブラウザーで確認。
- `verify:learning-layout:browser`を追加。別ポートのプレビュー起動後に実行する（Puppeteerは既存back依存を利用）。4サイズで末尾到達・マウスドラッグ・キーボードの上下移動・誤答提出・ページ横はみ出しなしを確認。画面エラーなし。
- 型・Lint・build・貪欲法応用・Parsons採点verify成功。Lintは既存の5警告のみ。単元内の認証後保存、他単元への可変高適用、実機ディスプレイ比較は未実施。

[改善後1366×768](assets/frontend-migration/responsive-1366x768.png) / [1536×864](assets/frontend-migration/responsive-1536x864.png) / [2560×1440](assets/frontend-migration/responsive-2560x1440.png) / [799×640](assets/frontend-migration/responsive-799x640.png)

基準画像は回答の一時演出・行移動が終了した状態の画像へ補正した。M01-Aの寸法一致に基づく差し替えであり、変更後の表示を変更前と扱ったものではない。


## M02: 単元共通部品の配置整理

| 移動元（learning配下） | 移動先 |
| --- | --- |
| bfs/consolidation/ParsonsBoard.tsx | components/assessment/ParsonsBoard.tsx |
| bfs/consolidation/parsonsOrderFeedback.ts | assessment/parsonsOrderFeedback.ts |
| bfs/unit/PhaseBridgeScreen.tsx | components/results/PhaseBridgeScreen.tsx |
| bfs/unit/UnitResultScreens.tsx | components/results/UnitResultScreens.tsx |
| bfs/unit/UnitResultCelebration.tsx | components/results/UnitResultCelebration.tsx |
| unit/unit.types.ts | types/unit.types.ts |
| app/rewards.ts内のLearningRewards型 | types/rewards.ts（報酬マージ処理はapp/rewardsに維持） |

全利用先・パスを直接読むverifyを更新。旧パスの再exportは作らず、旧ファイルを削除した。共有の結果画面にあったBFS図の既定値を削除し、単元定義が図を渡す契約に変更。既存のBFS・DFS定義はすでに固有図を渡していたので、学習画面の結果図は変わらない。新しい共有UIからBFS固有教材へのimportはない。盤面寸法・文言・採点・保存制御は変更していない。

既存80件（build・Lint・型・77のverify）成功。報酬型の追加分離後も型・報酬verify・Lint・buildを再確認。追加のブラウザー検証は4サイズの末尾到達・ドラッグ・キーボード移動・誤答提出が成功。7単元の応用問題・実装ヒント・採点・結果に関する既存検証も成功。実機ディスプレイ、認証後の進捗保存・実LLM生成は未実施。

M02完了時点で残っていた配置（5単元の制御・結果画面・サマリ型は後述のM03で解消）: 5単元の個別UnitPreview・結果画面・型、BFS内のImplementationWorkspace、app/componentからの基盤参照、API型から教材型への既存参照。BFS/DFSのグラフ描画は今回新たな共通部品へ引き上げていない。単元固有図を共通結果UIから切り離すだけで依存を解消できたため、描画仕様の変更はしない。


## M03: 単元制御の統合

5単元の個別約300行の制御を、フェーズ・ビュー・固有結果図・最終文言を渡す約36行のアダプターへ置換する。未使用の単元別結果画面とサマリ型も削除。BFS/DFSの制御を複製せず同じLearningUnitPreviewを使う。

### 差分として明示する挙動

- 旧5単元の単品プレビューは観測なしの場合に非表示プレイヤーもactiveだったため、`keepHiddenPlayersRunning: true`を指定して維持する。学習イベント接続時は表示中だけactiveになる。
- 応用問題の前進と最終結果を開く操作は、共通制御が持つ完了・保存待ちガードに統一する。旧個別制御ではこれらのハンドラに保存待ちガードがなかった。保存途中の前進を防ぐ変更として明示し、遷移と保存失敗／再試行を実行するテストを追加した。
- 固有の結果図・文言・フェーズID・保存キーは維持する。初回と直近の回答の区別、結果→ブリッジ、結果→フィードバック、最終結果からの復習は共通契約で検証する。

### 単元ごとの結果

- バブルソート（`bubble-sort`）: 共通制御への接続、重複結果画面・型の削除、対象unit verify・共有制御の実行テスト・型・Lint・buildが成功。認証済みDB保存と実機表示は未実施。
- 二分探索（`binary-search`）: 共通制御への接続、重複結果画面・型の削除、対象unit verify・共有制御の実行テスト・型・Lint・buildが成功。認証済みDB保存と実機表示は未実施。
- 貪欲法（`greedy-coins`）: 共通制御への接続、重複結果画面・型の削除、対象unit verify・共有制御の実行テスト・型・Lint・buildが成功。認証済みDB保存と実機表示は未実施。
  貪欲法の旧個別制御には大目標達成の描画口がなかった。統合後は他単元と同じ共通の描画口へ接続される（表示差として明示）。
- 棒倒し法（`wall-extension`）: 共通制御への接続、重複結果画面・型の削除、対象unit verify・共有制御の実行テスト・型・Lint・buildが成功。認証済みDB保存と実機表示は未実施。
- 穴掘り法（`maze-digging`）: 共通制御への接続、重複結果画面・型の削除、対象unit verify・共有制御の実行テスト・型・Lint・buildが成功。認証済みDB保存と実機表示は未実施。


### M03完了時の横断確認

全7単元のUnitPreviewから、個別のuseState・Screen定義を除去した。単元の制御はlearning/unit/LearningUnitPreview.tsxだけが持つ。固有のフェーズ定義・教材ビュー・結果図は各単元に残す。

- 最終の全体実行: 78本のverify中74本が成功、4本は移行前のファイル内に下書きキーの受け渡しが書かれることを前提とするソース検査で失敗。4本を新しい所有箇所（共通制御）と薄いアダプターの接続を確認する形へ更新し、対象4本を再実行してすべて成功した。検証項目は削除していない。
- 追加の共有フロー実行テストも再実行成功。全7単元の7段階遷移・固有結果図の受け渡し・最終結果・復習・訪問済みビューのマウント維持・非表示プレイヤー方針・下書きキーとエラー通知の受け渡し・保存失敗／再試行・完了イベント1回・保存後フィードバックを確認する。
- 型チェック・build成功。最終Lintはエラー・警告とも0（Nodeの既存設定形式に関する実行時通知は残る）。貪欲法の単品ブラウザー検証は4サイズで再実行成功。
- 実ブラウザーで確認したのは貪欲法の並べ替え。認証後の7単元通し学習・実機ディスプレイ・モナコ内の下書き復元とPython実行は未実施。既存のPython参照解・採点・下書きキー・保存接続の自動検証とは区別する。

M03完了時点ではM04以降が未着手だった。以降の進捗は下記を参照。アプリ全体の移行完了とは扱わない。


## M04: 確認問題の枠と完了通知

### A: コード確認の外枠と完了通知

バブルソートで先行検証後、全7単元のコード確認へLearningContentLayoutを接続。枠の差は単元名ではなく、固定コード窓／全コード表示／動き確認等の表示契約としてlearningContentFrameに集約した。DFSの全コード表示・横方向の空欄寄せと、他6単元の固定320px窓・縦横の空欄寄せはそのまま残した。設問・コード・選択肢・復習先は各単元の責務に維持する。

完了通知は既存useAssessmentCompletionへ統一。コールバックの型は必ず渡す成績2項目を必須にし、既存の各単元のサマリ型とも適合させた。追加verify:assessment-completionで初回通知1回・根拠の受け渡し・コールバック／根拠の差し替えによる重複なし・解き直し後の再通知を実行検証。

7単元のcode-check verify・型・Lint・build成功。バブルソートとDFSを1366×768／2560×1440／799×640でブラウザー比較し、セクション・空欄・選択肢の位置寸法とページ横はみ出しの有無が変更前と一致した。比較の数値記録: [変更前](assets/frontend-migration/m04-code-check-before.json)、[共通化後](assets/frontend-migration/m04-code-check-after.json)。

### B: 動き確認・応用問題、中央のスクロール領域

7単元の動き確認と応用問題にも外枠・完了通知を適用した。中央スクロール領域はAssessmentLayoutへ集約し、Parsonsのコンパクト画面用上書きを渡す。DFSの動き確認・コード確認は従来の全体を流す配置を保つ。図の固定高、コード窓の320px、選択肢・採点・再回答・復習の内容は変えていない。完了通知用のcompletedRef重複は確認・応用の全21画面から解消した。

既存のcheck・code-check・consolidationの21検証、型・Lint・buildが成功。復習ダイアログを探す実行ハーネスは、新しい共有枠を描画してoverlayスロットも確認する形へ更新し、操作の検証を維持した。追加ブラウザー検証verify:assessment-screens:browserで21画面・計58設問を実際に回答して完了表示へ到達し、画面エラー・ページ全体の横はみ出しがないことを確認した（1366×768）。検証中に選択肢中の「もう一度」を操作ボタンと誤認したため、実際の選択肢グループを優先する検証へ修正し、未完了の6画面を再実行して成功した。

コード確認の6組の位置寸法比較も本文抽出後に再実行して一致。貪欲法Parsonsの4サイズの末尾到達・ドラッグ・キーボード移動・回答も再実行成功。認証後の保存、実機ディスプレイ比較は未実施。


## M05: 図とコード・復習の配置

### A: 図・コード・変数表示の共通化

7単元にCodeMappingLayoutとCodeVariableListを適用。幅の観測、コード最低620px、図の配分、コード内スクロール、変数行の描画を共有し、図・強調行・変数差分の計算は各単元に残した。DFSのコード配分52%・幅だけの観測・minWidth:0、他6単元の48%・幅と高さがあるときの観測を維持。BFSの変数の余白・字体と、他単元のコンパクト表示の差も維持した。

7単元のcode-mapping verify（元のPythonトレース・行・変数・元図との同一性を含む）、型・Lint・buildが成功。下表の21条件で変更前と変更後をブラウザー比較し、最初と次のステップの配置・強調行・変数文字列・差分フラグが全件一致した。狭い画面の教材領域内横スクロールは従来どおりで、新たな折り返し・縮小は入れていない。

| 単元 | viewport | 図の幅 | コードの幅 | 最初→次の強調行 |
| --- | --- | --- | --- | --- |
| bfs | 1366×768 | 693.67 | 640.31 | import-deque → define-function |
| bfs | 2560×1440 | 1314.55 | 1213.44 | import-deque → define-function |
| bfs | 799×640 | 480.00 | 620.00 | import-deque → define-function |
| dfs | 1366×768 | 495.44 | 620.00 | define-function → initialize-visited |
| dfs | 2560×1440 | 1016.81 | 1101.56 | define-function → initialize-visited |
| dfs | 799×640 | 480.00 | 620.00 | define-function → initialize-visited |
| bubble-sort | 1366×768 | 495.44 | 620.00 | define-function → copy-values |
| bubble-sort | 2560×1440 | 1101.56 | 1016.81 | define-function → copy-values |
| bubble-sort | 799×640 | 480.00 | 620.00 | define-function → copy-values |
| binary-search | 1366×768 | 495.44 | 620.00 | define-function → init-lo |
| binary-search | 2560×1440 | 1101.56 | 1016.81 | define-function → init-lo |
| binary-search | 799×640 | 480.00 | 620.00 | define-function → init-lo |
| greedy-coins | 1366×768 | 495.44 | 620.00 | define-function → init-result |
| greedy-coins | 2560×1440 | 1101.56 | 1016.81 | define-function → init-result |
| greedy-coins | 799×640 | 480.00 | 620.00 | define-function → init-result |
| wall-extension | 1366×768 | 495.44 | 620.00 | define-function → initialize-grid |
| wall-extension | 2560×1440 | 1101.56 | 1016.81 | define-function → initialize-grid |
| wall-extension | 799×640 | 480.00 | 620.00 | define-function → initialize-grid |
| maze-digging | 1366×768 | 495.44 | 620.00 | define-function → initialize-grid |
| maze-digging | 2560×1440 | 1101.56 | 1016.81 | define-function → initialize-grid |
| maze-digging | 799×640 | 480.00 | 620.00 | define-function → initialize-grid |

### B: 復習・トレースの外枠

LearningDialogFrameへ幅84vw・高さ84dvh・最大高・閉じる操作を抽出し、共通の復習ダイアログと7単元のトレースへ接続。各トレースの図、変数一覧、最終値、途中停止やfallbackの説明・再生内容は変更していない。7単元のtrace verify、型・Lint・buildが成功。ブラウザーでも1366×768と799×640で復習を開き、84vw/84dvhの寸法、閉じる操作、元の設問への復帰を確認した。Pyodideでの入力コードからトレース取得まではM06の確認対象として残す。

## M06: 実装ワークスペース（進行中）

### A: BFS/DFSの分離とバブルソートの接続

エディタ、実行中の排他制御、テスト進捗、段階的ヒント、完了通知、トレース表示の制御をlearning/implementation/ImplementationWorkspaceへ抽出。教材・採点器・ヒント・結果図・自由実行の戻り値表示は単元から注入する。共通ワークスペースはBFSをimportしない。エディタ配色とD1表示用の自由実行も共有配置へ移した。BFS、DFS、バブルソートを接続済み。他4単元は後続で個別移行する。

verify:implementation-workspaceでは実行器とエディタを置き換え、ヒントの段階制御と挿入、自由実行と採点の分離、進捗、全通過通知1回、完了後のエディタ維持、トレースの開閉、下書き・レベルの接続、アンマウント時の結果破棄を実行検証した。BFS/DFS/バブルソートの既存implementation検証、BFS自由実行検証、型チェックも成功。

ブラウザーの入力→下書き保存の追加検証は未完了。Monacoのモデルは変更できたがReactの変更通知と保存を確認できず、未移行のバブルソートでも再現した。移行による回帰とも既存製品の不具合とも断定していない。診断用スクリプトはDの作業ディレクトリに保存し、正式な検証成功には含めない。実ブラウザーでのMonaco入力・Pyodide全通し確認は残存事項とする。Cの容量不足により、以後の作業ファイル・キャッシュはDへ配置した。
この段階のLint（エラー・警告0）とproduction buildも成功。

### B: 残り4単元の個別接続と確認

二分探索、貪欲法、壁伸ばし法、穴掘り法を順に接続し、各単元のimplementation検証と型チェックを通した。7単元が同じworkspaceを利用し、単元側は教材・実行器・表示部品を渡す薄い構成になった。配置は既存の入力レベル・下書き処理と同じlearning/implementationに統一した（計画のcomponents/implementation案からの具体化）。

まとめの検証は19件すべて成功: 7単元のimplementation、7単元のtrace、BFS自由実行、共有workspace、共有unitフロー、Lint、build。トレース・採点の検証にはCPython参照実行を含む。実ブラウザー入力の未確認事項は上記の通り残す。M06のコード移行と自動検証は完了し、認証後・実機・Monaco/Pyodideの全通し確認は残存確認として管理する。
M06の追補: セッション移行時に7単元のunit検証も実行したところ、BFS等のソース検査に実装Preview内のembedded/onComplete記述を直接求める箇所が残っていた。薄いアダプターによるprops転送と共有workspaceの受け口を両方確認する形へ更新し、7単元のunit検証すべて成功した。

## M07: app配下の共通基盤（進行中）

### A: セッションと音

userSessionをlib/sessionへ、soundFeedbackをlib/audioへ移した。処理本体は変更せず、全参照元と検証の解決先を更新。認証ロード、利用者別クエリキャッシュ、古い非同期結果の破棄、音量・有効設定の保存キー、provider順序を維持する。型、回答演出、7単元unit、共有実装workspace、Lint、buildが成功。実アカウントでのログイン・ログアウト・利用者切り替えは未実施。
### B: 共通UIとヘッダーの構成

ActionButtonとAppBreadcrumbsをcomponentsへ移動。AppHeaderViewはURLとプロフィールの表示要素を受け取り、利用者・マスコットの取得はapp/component/appHeaderに残した。学習画面と単元概要はapp側からheaderを受け取り、app内部のヘッダーをimportしない。ナビゲーション、寸法、待機中表示を維持した。型、マスコット表示、応答表示、パンくず、Lint、buildが成功。