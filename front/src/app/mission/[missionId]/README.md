# Mission・Activityコード案内

この文書は、フォルダ名だけでは判別しにくかったMission画面、Activity renderer、回答UI、API、seedの所在を示す案内です。

## ルート対応表

Next.jsでは、ディレクトリ内に`page.tsx`がある場合だけ画面ルートになります。

| URL | 役割 | routeファイル | 実装本体 |
| --- | --- | --- | --- |
| `/mission/[missionId]/overview` | Mission概要と開始導線 | `front/src/app/mission/[missionId]/overview/page.tsx` | 同左（今後featureへ分離する候補） |
| `/mission/[missionId]/play` | Mission内のActivity学習とCourse Mission | `front/src/app/mission/[missionId]/play/page.tsx` | `front/src/features/learning/mission-activity-play/MissionActivityPlayPage.tsx` |
| `/mission/[missionId]/result` | Mission完了結果 | `front/src/app/mission/[missionId]/result/page.tsx` | 同左（今後featureへ分離する候補） |

Course Missionは別の`/exam`画面ではありません。Missionの`type`とActivityの`rendererKey: CODE_EDITOR`により、通常と同じ`/mission/[missionId]/play`で`courseMissionPythonEditor.tsx`を表示します。

次のディレクトリには`page.tsx`がないため、現在のNext.js画面ルートではありません。

- `app/mission/[missionId]/lesson/[lessonId]/play`: 旧Lesson UI。未参照コンポーネントは削除済み。
- `app/mission/[missionId]/lesson/[lessonId]/complete`: 旧Lesson完了UI。未参照コンポーネントは削除済み。
- `app/mission/[missionId]/exam`: 画面入口も外部参照もなかった旧Mission Exam UIは削除済み。

旧Lesson APIクライアントと旧Mission Exam APIクライアントは、リポジトリ外の利用を否定できないため`front/src/api/mission.api.ts`に`@deprecated`として残しています。互換型は`front/src/api/types/legacy*.types.ts`です。

## 変更したいことから探す

| 変更したいこと | 最初に見るファイル |
| --- | --- |
| Activity画面全体 | `front/src/features/learning/mission-activity-play/MissionActivityPlayPage.tsx` |
| Next.jsのActivityルート入口 | `front/src/app/mission/[missionId]/play/page.tsx` |
| 左側のActivity一覧 | `front/src/features/learning/mission-activity-play/components/learningSidebar.tsx` |
| Activityの共通レイアウト | `front/src/features/learning/mission-activity-play/components/activityShell.tsx` |
| Activityのタイトル・instruction・mentorMessage | Course seed内の各Activity定義 |
| rendererの登録 | `front/src/features/learning/activity-content/activityRendererRegistry.ts` と `back/src/learning/activity-content/activityRendererRegistry.ts` |
| ActivityContentの型と検証 | `front/src/features/learning/activity-content/activityRendererRegistry.ts` と `back/src/learning/activity-content/activityContentSchema.ts` |
| 単一選択問題 | `front/src/features/learning/components/selectableCardList.tsx` |
| 配列の位置選択 | `front/src/features/learning/components/arrayIndexSelect.tsx` |
| 配列の範囲選択 | `front/src/features/learning/components/arrayRegionSelect.tsx` |
| STEP TRACE | `front/src/features/learning/components/arrayTrace.tsx` と `stepTraceControls.tsx` |
| 配列カードの見た目 | `front/src/features/learning/components/algorithmArray.tsx` |
| コードブロック配置 | `front/src/features/learning/components/codeBlockWorkspace.tsx` |
| コードブロックの共通外観 | `front/src/features/learning/components/blockCardStyles.ts` |
| MATCH分類問題 | `front/src/features/learning/activity-renderers/inputs/matchClassificationInput.tsx` |
| 並べ替え問題 | `front/src/features/learning/activity-renderers/inputs/orderedStepsInput.tsx` |
| 比較・穴埋め・コード配置問題 | `front/src/features/learning/activity-renderers/inputs/algorithmPracticeInputs.tsx` |
| 回答送信・誤答・再回答・進捗復元 | `front/src/features/learning/mission-activity-play/MissionActivityPlayPage.tsx` |
| 正解・誤答フィードバック | `front/src/features/learning/components/activityFeedbackCard.tsx` |
| 二分探索の可視化 | `front/src/features/learning/activity-renderers/visualizations/binarySearchVisualizations.tsx` |
| バブルソートの比較と交換 | `front/src/features/learning/activity-renderers/visualizations/bubbleSortComparisonVisualizations.tsx` |
| バブルソート一周分 | `front/src/features/learning/activity-renderers/visualizations/bubbleSortOnePassVisualizations.tsx` |
| バブルソート複数周 | `front/src/features/learning/activity-renderers/visualizations/bubbleSortMultiPassVisualizations.tsx` |
| バブルソート比較範囲 | `front/src/features/learning/activity-renderers/visualizations/bubbleSortRangeOptimizationVisualizations.tsx` |
| バブルソート完成段階 | `front/src/features/learning/activity-renderers/visualizations/bubbleSortCompletionVisualizations.tsx` |
| アルゴリズム可視化の共通部品 | `front/src/features/learning/activity-renderers/visualizations/sharedAlgorithmVisuals.tsx` |
| Course MissionのPythonエディター | `front/src/features/learning/course-exam/courseMissionPythonEditor.tsx` |
| コード転記Activity | `front/src/features/learning/course-exam/codeTranscriptionEditor.tsx` |
| バブルソート教材データ | `back/prisma/seedData/bubbleSortCourseSeed.ts` |
| 二分探索教材データ | `back/prisma/seedData/binarySearchCourseSeed.ts` |
| seedの集約入口 | `back/prisma/seedData/learningSeed.ts` |
| seed実行入口 | `back/prisma/seed.ts` |
| seed静的検証 | `back/src/scripts/validateLearningSeed.ts` |
| ExpressのCourse API | `back/src/router/course.router.ts` → `controller/course.controller.ts` → `service/course.service.ts` |
| ExpressのMission取得・回答・完了 | `back/src/router/mission.router.ts` → `controller/mission.controller.ts` → `service/mission.service.ts` |

## renderer追加時の接続順

1. backend registryへ`rendererKey`、許可Activityタイプ、data schema、回答方式を登録する。
2. frontend registryへ同じ`rendererKey`と表示・回答方式を登録する。
3. 既存の問題型で表現できなければ、`activity-renderers/inputs`または`visualizations`へ役割名で実装する。
4. `MissionActivityPlayPage.tsx`のrenderer選択へ接続する。
5. Course固有の値・文章・正解はコンポーネントへ埋め込まずseedの`content.data`から渡す。
6. `validate:learning-seed`と学習フローE2Eで登録漏れと回答動作を確認する。

採点、再回答回数、Activity完了、Mission完了をCourse固有rendererへ持たせてはいけません。これらはMission APIとMission Activity画面の共通処理です。
