# 回答直後の正誤レスポンス（Issue #146）

- 目的: 概念確認・コード確認・応用と総括で、回答の正誤がすぐ分かる共通の表示と音を付ける。
- 適用範囲: assessmentを使うフェーズ3・5・6の回答直後。状態: 実装記録。最終確認日: 2026-11-06。
- 起点: PR #153マージ後のdevelop `73001d7546ed751972264fbe48e53c7c7a6078ed`。
- 正本: [教材指針](concept/learning-materials-guideline.md)、[プレイヤーUI定義](concept/learning-player-ui.md)、[アプリUI/UX方針](concept/app-ui-ux-guideline.md)、Issue #146と2026-11-06のユーザー実装指示。

## 実装

- `assessment/answerFeedbackState.ts` は、既に判定されたQuestionRecordの試行数の増加だけを読み、正誤と文言を取り出す。正解を再判定せず、assessment.ts・記録・完了条件を変更しない。
- `assessment/AnswerFeedback.tsx` の `useAssessmentFeedback` をフェーズ3・5・6が共通で使う。再描画、StrictModeのeffect再実行、復習、非表示からの復帰、音設定の変更によって同じ回答を再提示しない。
- ルートのSoundProvider内にAnswerFeedbackProviderを置く。回答画面が次問やリザルトに切り替わっても、最後の正誤を600ms提示できる。タイマーは表示を閉じるためだけに使い、進行や完了通知を待たせない。新しい回答が来たら古い表示を置き換える。
- 正解は大きな○と一度きりのズーム、不正解は黒の×とフェードのみ。画面の揺れ、赤い点滅、ループは使わない。prefers-reduced-motionでは初期ズームもフェードも止める。
- 表示はpointer-events:noneで、回答・次へ・復習をブロックしない。フォーカスを奪うダイアログは作らず、statusとして正誤を通知する。
- 音は既存useSoundEffectのanswerCorrect / answerIncorrectだけを呼ぶ。新規音源・音量指定・設定UIの変更はなく、SoundProviderの有効設定・マスター音量・音別音量・クールダウンに従う。
- フェーズ5・6の具体的な文言は既存のcorrectFeedback / incorrectFeedback / retryFeedbackを使う。短い表示の後も共通のAnswerFeedbackMessageで回答欄に残す。フェーズ3では一般的な判定表示「正解！」と、責めない再試行文だけを使い、未検証の学習内容への称賛は追加しない。
- #153の回答候補の描画、設問文、正解データ、学習ログ、サマリ、ハードゲート／ソフトゲートの契約は維持する。#144・#147・#149・#150の画面や演出は変更しない。DB・seed適用不要。

## 既存方針との境界

アプリUI/UX方針§5は学習の最中の賞賛演出を対象外としている。一方、今回のユーザー指示は回答直後の大きな○・ズーム・効果音をフェーズ3・5・6に求めている。AGENTS.mdの優先順位に従い今回の明示指示を優先し、回答が確定したときの600msの正誤レスポンスに限定した。リザルトやカード獲得向けの祝福演出を学習中へ広げる変更は含めない。

## 確認方法

`front` で `npm run dev`（通常のポートは3000）。単品ページと単元プレビューは認証・バックエンド不要。

| 画面 | URL | 正解／不正解を出す手順 |
| --- | --- | --- |
| 概念確認 | `http://localhost:3000/learning-preview/bfs-check` | 問1はD等で不正解、Cで正解。問2はノード選択で不正解、「どれも入らない」で正解。誤答後に任意復習を開閉しても音・正誤表示が再生されないことを確認する。 |
| コード確認 | `http://localhost:3000/learning-preview/bfs-code-check` | 問1はpopleftで不正解、appendで正解。問2はinで不正解、not inで正解。最後の正解でも○が出ることを確認する。 |
| 応用・総括 | `http://localhost:3000/learning-preview/bfs-consolidation` | 問1はBで不正解、Aで正解。問2は「L → K」で不正解、「K → L」で正解。次へは正誤にかかわらず使える。Parsonsは初期の並びのまま回答すると不正解。 |
| 単元内 | `http://localhost:3000/learning-preview/bfs-unit` | フェーズ1はシークのEnd→「フェーズ2へ進む」、フェーズ2もEnd→「理解度を確認する」。概念確認を解き、リザルト→フェーズ4でEnd→「コードの確認問題へ進む」。フェーズ5完了直後も、リザルトへの進行を止めず最後の○が残ることを確認する。 |
| アプリ組み込み | `http://localhost:3000/courses/roadmap/course-algorithm-breadth-first-search-v1/learn` | 通常のログイン・学習進捗が必要。同じ各フェーズで確認する。 |

Parsonsを正解させる場合は、import → def → distancesの初期化 → queueの初期化 → while → popleft → for → if → 距離代入 → append → returnの順に並べる（初期化2行は既存仕様どおり相互交換可）。

## 検証と限界

- frontのlint / typecheck / build、`verify:answer-feedback`、指定の `verify:bfs-check` / `verify:bfs-unit` / `verify:learning-player` / `verify:learning-screens` は通過。`verify:bfs-code-check` / `verify:bfs-consolidation` は下記Windows実行差だけを補正して通過。
- `verify:answer-feedback` は全回答形式の記録差分、既存文言、最終回答の提示、初回正誤、ソフトゲート、StrictModeでの重複防止、非表示・復習・設定変更時の再生抑制、音の配線、タイマー置換と破棄、非ブロッキング表示、reduced-motion、3フェーズとルートへの接続を検証する。
- Chromeで単品3画面の正誤・再試行・任意復習・Enter / Space、応用と総括のノード／選択式／Parsons回答、不正解のまま進むこと、初回2/5の診断保持を確認した。単元内でフェーズ3・5のリザルトに最後の正解表示が残ることも確認した。
- 実機での音の聞こえ方、音量バランス、演出の強さと読みやすさ、OS側のreduced-motion設定を有効にした実表示はユーザー確認事項。reduced-motionの分岐と音設定の配線は自動検証しているが、聴感や主観的な見た目の評価を済んだとは扱わない。
- 認証付きアプリでの保存・ログ送信・DB・実験条件との通し確認は未実施。これらの契約に変更はない。
- 既存 `verify:bfs-code-check` / `verify:bfs-consolidation` はWindowsのパス区切り混在による参照同一性チェックで失敗し、前者のpython3はWindowsエイリアスを参照する。リポジトリ外の実行アダプターでパスキーの正規化とインストール済みPythonの指定だけを補正すると通過した。既存verifierのassertionや教材ロジックは変更していない。
