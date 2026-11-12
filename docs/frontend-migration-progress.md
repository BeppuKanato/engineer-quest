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

普段のlocalhost:3000とは別のポート3100・`.next-migration`出力を使う一時サーバーで、認証不要の教材プレビューを検証。比較値はCSSピクセル。実機ディスプレイのOS倍率から推測した値ではない。実機のviewport・アプリ内の認証後フローは未計測。

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
