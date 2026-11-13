# フィードバック生成入力への大目標統合

> 現行仕様追記（2026-11-13）: 目標のsourceIdとevidenceSourcesの共通契約、同時完了した終了目標、選択段への大目標入力は [learning-feedback-402.md](learning-feedback-402.md) を参照。以下は#368実装当時の記録。

- 目的: フィードバック生成（2段構成）の分析段の入力に、アクティブな大目標を加える（Issue #368、親 #364、基盤 #365／提案 #366）。
- 最終確認日: 2026-11-10
- 正本: 実装仕様「2026-11-10_大目標モデル実装仕様」6章（フィードバック生成への大目標の渡し方）、7章（小目標と大目標の関係）

## 実装内容

### 分析段への大目標ブロック（`feedbackV1.context.ts`、`feedbackV1.engine.ts`）

- `buildFeedbackV1Context` が、アクティブな大目標（`getActiveBigGoal`）を1件だけ読み、生成時点の実態データから達成評価をコード側で計算し直して（`loadBigGoalFacts`＋`evaluateBigGoal`）、`Input.bigGoal` として渡す。終了した目標の履歴は渡さない。
- ブロックの内容（仕様6.1）: 表示文（displayText）、型（type）、達成条件そのもの（condition＝型のパラメータを含む構造化した条件）、現在の進捗（progress＝部分充足の割合 fraction と内訳 detail、判定 outcome）、状態（status）と確定日時・確定からの経過日数（daysSinceConfirmed）。
- 分析プロンプトは、大目標がある場合だけ学習記録と一緒に大目標ブロックを JSON で渡し、「currentState はこの大目標に対する現在の位置として書き、進捗は渡された内訳と数値を使い、新たに見積もらない」という指示を足す。これにより PR #357 で入れた「学習目標に対する現在の位置」という文言が、実在の大目標データを指すようになった。大目標が無い学習者では従来どおり（ブロックなし、プロンプトも従来形のまま）。
- 選択段へは大目標を直接渡さない（仕様6章の「分析段の入力に加える」に従う）。選択段の小目標は、分析段の currentState が大目標に対する位置として書かれることを通じて大目標と関係づく。選択段のロジック変更は Issue の範囲外として行っていない。
- ブロックは両条件で共通に入力する。分析段に HEXAD を入れない不変条件（分析段の入力が両条件で同一）は維持し、`verify:feedback-v1` で大目標ありの場合も分析プロンプトが両条件で一致することを検証する。

### PROMPT_VERSION

- `feedback-v1-2026-11-10` → `feedback-v1-2026-11-10-goal` に更新した（#357 と同日の変更のため、日付に `-goal` を付けて区別する）。生成ログにはこの版が記録される。

## 検証

- `verify:feedback-v1`（追随・拡張）: `Input` に `bigGoal` を追加し、検証側の入力リテラルへ `bigGoal: null` を反映。大目標ブロックがある場合の分析プロンプト両条件一致、HEXAD が分析段に漏れないこと、目標なしではブロック自体が現れないこと、選択段へ大目標の表示文が渡らないことを追加で検証し PASS。
- `verify:feedback-v1-storage`: 入力リテラルへ `bigGoal: null` を追随。VM では Prisma クライアントが未生成のため実行できない（develop でも同一の `Cannot find module '.prisma/client/default'` で失敗する既存制約）。CI の生成済みクライアントで確認する。
- back typecheck: develop とのエラー集合のベースライン差分で、新規エラーなし（既存の Prisma 未生成起因のノイズのみ）。
- back lint（変更ファイル）: PASS。`verify:big-goal`／`verify:big-goal-proposal`（transpile-only）: PASS（回帰なし）。

## 未実施の検証

- 実生成での確認（生成ログで currentState が大目標に言及しているか）は、実 LLM 呼び出しと DB が必要なため VM では未実施。migration 適用済みの環境で、大目標を確定した学習者のフィードバック生成ログを確認する。
- DB 変更・migration はなし（読み取りのみ）。
