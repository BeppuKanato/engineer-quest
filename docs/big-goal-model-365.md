# 大目標のデータモデルと達成判定基盤

- 目的: 大目標インスタンスの永続化と、達成条件の評価基盤を実装する（Issue #365、親 #364）。
- 最終確認日: 2026-11-10
- 正本: 実装仕様「2026-11-10_大目標モデル実装仕様」4章・5章、方針資料「2026-11-10_フィードバック方針整理・実装に不足している要件」§5

## 実装内容

### Prisma モデルと migration

- `BigGoal`：大目標インスタンス。型（`BigGoalType`：UNIT_COMPLETION／ACHIEVEMENT／CREATE_QUEST／INTEGRATION／SHARING／RETENTION）、パラメータ（構造化 JSON）、表示文、状態（`BigGoalStatus`：PROPOSED／ACTIVE／ACHIEVED／CLOSED_UNMET／REVISED）、提案への参照、確定日時、達成判定の結果（`evaluation` JSON）と判定日時、終了日時、見直し元の参照を持つ。終了したインスタンスも削除しない（履歴）。
- `BigGoalProposal`：提案ログ。タイミング（UNIT_START／ON_ACHIEVEMENT）、冪等キー（eventKey）、条件、入力一式、採点結果、学習者が選んだ候補キーを持つ。生成と採点は G2（#366）が使う。
- `BigGoalProposalCall`：提案に伴う LLM 呼び出しログ（FeedbackV1Call と同じ粒度）。
- migration `20261110210000_big_goal_model` を追加した。**マージ・デプロイだけでは DB に反映されない。対象 DB への migration 適用（`npx prisma migrate deploy`）が別途必要**で、適用後に G2 以降の API が動作する。

### 達成判定基盤（`back/src/service/`）

- `bigGoal.types.ts`：型カタログ（定義・有効化フラグ）、パラメータ型、表示文テンプレート。初回に有効化する型は到達型・実績型・応用型。統合型・共有型・定着型は枠のみで候補に出ない。表示・提案に時間指定（所要日数・期限）は付けない。
- `bigGoal.evaluate.ts`：達成判定と進捗計算の純粋関数。判定は条件とデータからコード側で行い、LLM は行わない。
  - 到達型：対象単元の完了で達成。挑戦条件（フェーズ7の入力レベル指定／ヒントなし／初回正答率の下限）がある場合は一体で判定し、単元完了時点で挑戦条件が未充足なら未達成で終了（CLOSED_UNMET）として閉じる。単元が未完了の間は、挑戦条件の中間状態が悪化しても終了しない。
  - 実績型：対象実績の獲得記録の有無。応用型：対象アルゴリズムの作る課題の完了件数。
  - 統合型・共有型・定着型：NOT_INSTRUMENTED として達成も未達成も判定しない。
  - 進捗は達成条件の部分充足として計算する。到達型の割合の分母は、教材指針で全単元共通の7フェーズ（`UNIT_PHASE_COUNT`）。
  - フェーズ7の識別はサマリの `inputLevel`／`hintUsage` の有無で行い、ヒントなしの解釈（hintUsage がない場合は使用なし）は実績評価（PHASE_NO_HINT_COMPLETE）の既存解釈に揃えた。
- `bigGoal.service.ts`：実態データの読み込みと再評価の永続化。`evaluateBigGoalsForUser` が確定中の目標を再評価し、結果と評価時点を記録する。
- フック：`learning.service.ts` のフェーズ完了保存・単元完了保存で、実績評価の直後に大目標の再評価を呼ぶ。作る課題の完了や掲示板投稿の保存地点には今回フックしていない（評価関数自体は応用型をカバーし、次の学習保存時に評価される）。

## 仕様との対応で判断した点

- 状態 `PROPOSED`（提案中）について：仕様4.2の「別候補が選ばれた場合、このインスタンスは提案ログにのみ残る」に従い、インスタンスは学習者の合意時に ACTIVE として作る運用とし、PROPOSED はライフサイクルの値として保持するに留める（生成は G2）。
- 応用型の対応づけ：作る課題にアルゴリズムのタグは存在しないため、課題と単元の関連（`CreateQuestCourse`）で対象アルゴリズムに対応づけた（候補生成ルール仕様 §8 の前提への回答）。
- カード獲得日時：`UserKnowledgeCard.collectedAt` に記録が存在することを確認した。定着型は確認問題の仕組みが前提のため、引き続き未有効化とする。

## 検証

- `verify:big-goal`（新規、`src/scripts/verifyBigGoal.ts`）：到達型の標準形・挑戦条件の閉じ方、実績型・応用型の判定、枠のみの型の NOT_INSTRUMENTED、進捗の割合、表示文テンプレートを検証する。VM では Prisma エンジンを取得できないため、ローカルは `ts-node --transpile-only` で PASS を確認し、型検査付きの実行は CI に委ねる（verify:feedback-v1-storage と同じ制約）。
- back typecheck：変更前後のエラー集合の差分を確認。新規エラーは Prisma クライアント未生成に伴う TS2305／TS7006 のみ（生成済みクライアントがある CI では解消する）。
- back lint（変更ファイル）：PASS。`verify:feedback-v1`：PASS（既存への影響なし）。

## 未実施の検証

- migration の実 DB 適用と、DB を使う検証（verify:feedback-v1-storage 等）は VM で実行できないため未実施。CI と対象 DB への適用時に確認する。
- 実画面での確認は G3 以降（UI 実装時）。
