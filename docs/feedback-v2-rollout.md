# 4条件フィードバックの導入・テスト手順（2026-11-16）

対象の設計正本: [HEXAD適応フィードバック実装仕様](hexad-feedback-implementation-spec-2026-11-16.md)。

> 重要：GitHub CIの成功は「実モデル・Cloud Tasks・実DBで生成できた」ことを意味しない。既存の2条件自動割付や過去データを黙って4条件へ変更しない。

## 実装の構成

- V2で生成される4条件：`STANDARD`、`TOP_1`、`ROULETTE`、`MULTI`（DB enum名とTypeScript実装名は`TOP_1`）。
- `PERSONALIZED`：従来の2条件実験のレガシー値。保存済み結果・旧実験ユーザー互換のため残す。
- Stage1で根拠つきの支援計画と承認済み行動集合を確定し、Stage2で条件別に文章を生成・候補内から選択する。
- Stage2に渡す観測事実は保存済みスナップショットから解決する。解決できない/欠落した教材情報を補完した事実として扱わない。
- P3/P5/P6の完了時には、`assessmentEvidence.version=2`で**全回答試行の回答そのもの**を確定保存する。従来v1のデータは読み取れるが、存在しない実回答は復元しない。
- 失敗時の手動「再生成」は保存済み入力・条件・抽選結果を維持。フロントの固定回数上限はなく、内部Cloud Tasksの再配送上限とは別。

## 現行割付との関係と安全な運用

現在の`ensureHexadFeedbackExperimentAssignment`は**旧2条件（STANDARD / PERSONALIZED）**を作成する。4条件研究のランダム化・グループ配分は、参加者数と分析計画が確定するまで変更していない。

条件を試すときは、生成履歴のないテストユーザーに限り、次の管理者用CLIで明示的に設定する。**CLIの標準動作はdry-run**。`--user-id`にはDBの`User.id`を指定し、Firebase UIDを渡さない。

```bash
cd back
npx prisma migrate deploy
npx prisma generate

# 設定内容を表示するのみ
npx ts-node src/scripts/setFeedbackExperimentCondition.ts --user-id=<user-db-id> --condition=TOP_1

# 手動で決定した条件を適用する
npx ts-node src/scripts/setFeedbackExperimentCondition.ts --user-id=<user-db-id> --condition=TOP_1 --apply
```

設定可能な`--condition`：`STANDARD`、`TOP_1`、`ROULETTE`、`MULTI`。
手動変更は、対象ユーザーに過去の`FeedbackV1`記録がある場合は拒否する。非STANDARDではHEXAD回答済みである必要がある。割付を確定していない参加者へ、CLIで恣意的に条件を選ばない。

### ROULETTE全重み0について

6タイプすべて16点以下の場合は、`ROULETTE_NO_ELIGIBLE_TYPE`でエラーとする**暫定の未対応状態**。
「全タイプ中立だから均等抽選」や「該当者は除外」といった研究仕様を勝手に導入しない。被験者実験の参加条件・割付・解析方針と合わせて**実験開始前に定義する**。

## 最低限のdev実機確認

1. 旧データの保全：`PERSONALIZED`の既存結果をそのまま表示できるか、全migration後も保存済み`STANDARD`結果が再生成されないかを確認。
2. 4条件の独立テストアカウントで、P3 → P5 → P6 → 単元完了の生成経路と画面を確認。各条件のStage1入力にはHEXADが存在しないことを監査ログで確認。
3. TOP-1の最高得点同点時、テストユーザー単位で選択タイプが固定されること。ROULETTEは**別フィードバック**では抽選し直し、**失敗再試行**では変わらないこと。
4. LLM生成成功時、候補が同じ単元で実行可能であることを確認。不正なcandidateId/対象IDは拒否される。Stage1で承認していない候補はStage2で採用できない。
5. 強制タイムアウト・不正スキーマで生成失敗させ、再生成ボタンで同じ入力を使って再試行できること。ボタン連打・別タブ・旧Cloud Tasks配送で多重生成されないこと。
6. P3/P5/P6の実際に選んだ回答が`assessment_snapshot`の版2に保存され、次回のStage1/Stage2へ事実として渡されること。旧版の版1には回答値を捏造しないこと。
7. エラー件数・失敗理由・トークン・所要時間・API利用料を確認。IDの一致条件が厳しすぎて生成失敗を増やしていないかを固定ケースで確認。
8. Cloud Run・Cloud Tasks・PostgreSQL・実LLMの各環境で通し確認。ログに学習者の入力全文やHEXAD得点が不要に平文出力されないかも確認。

**未検証のまま学習者実験・prodへ展開しない。**

## CI・補助確認

```bash
cd back
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run verify:static
npm run build

cd ../front
npm ci
npm run lint
npm run typecheck
npm run verify:feedback-concepts
npm run verify:feedback-candidates
npm run build
```

現在のCIはネットワーク・実DB・LLMを使わないfixture中心。必要な本番相当検証は人手で別途行う。

## 実装上の保留事項

- 参加者割付、主観評価尺度、標本数、ROULETTE全重み0の対応。
- HEXAD定義文・生成モデル・プロンプト版の実験時固定。現在のタイプ定義文は運用向け**暫定版**。
- Stage2へ渡す具体的教材内容・実回答の情報量。代表ケースで不足がないか評価し、生成器が参照可能な教材正本を強化する。
- 失敗したStage2だけを再実行してStage1の結果を共有する方式は未実装。現状の手動再生成は保存済み入力から**2段階とも再生成**するため、前後で診断が変わる可能性がある。
- 新4条件の自動割付は未実装。従来の2条件自動割付は互換のため残す。
