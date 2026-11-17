# HEXAD適応フィードバック 再設計・実装仕様（2026-11-16）

> 状態：**実装予定の正本（合意事項＋未決事項を明示）**。本書を追加しただけではコード・DB・実験条件は変更されない。
> 対象：Engineer Quest のフェーズ3・5・6終了後、フェーズ7完了後のフィードバック。
> 基準：2026-11-16までの設計合意。既存の旧2条件仕様・推薦着手率を主要研究指標にする記述より、本書の確定部分を優先する。
> 作業ルール：`AGENTS.md` / `docs/development-rules.md` に従い、専用実装ブランチからPRを分割する。

## 0. 目的・非目的

**目的**
- 学習者の回答と教材・目標を根拠に、教育上適切な学習支援を2回のLLM呼び出しで生成する。
- HEXADなしの `STANDARD` と、HEXADを用いる `TOP-1` / `ROULETTE` / `MULTI` を比較可能にする。
- 第1段階の教育的判断・許可済み推薦候補はHEXADから独立させ、第2段階のみで推薦候補内の選択と文章表現を調整する。
- フィードバックの失敗を画面から手動で再生成できるようにする。実験の条件・根拠の再現性を維持する。

**非目的**
- 学習者実験で推薦への「着手率／遷移先到達率／学習完了率」を主指標・必須実装にしない。今回の小規模被験者実験は**主観評価の変化**を中心に扱う。既存の推薦操作ログを無理に撤去する必要はないが、詳細な追跡基盤の追加を実装条件にしない。
- 誤答や正答から能力・概念習得を確定判定すること、HEXADタイプから人格を決めつけること、LLMの文章を教育的に正しいと自己申告だけで保証すること。
- オフラインHEXAD適応度分類器をEngineer Quest本体のランタイムAPIへ組み込むこと。分類実験は別システムで実施する。
- 被験者の割付・標本数・主観尺度・統計解析を、本書によって勝手に確定すること。

## 1. 確定済みの研究条件

| 条件 | 第2段階LLMに渡すHEXAD情報 | タイプ選択 | 保持する情報 |
| --- | --- | --- | --- |
| `STANDARD` | なし | なし | 条件ID |
| `TOP-1` | 選択済み1タイプの名称・定義だけ | 最上位得点。同点なら最上位同点タイプ間で**初回に等確率抽選して固定** | 選択タイプ、同点候補、選択時の得点、版 |
| `ROULETTE` | 抽選済み1タイプの名称・定義だけ | **新たなフィードバック単位ごと**に得点重みで抽選 | 6得点、候補、重み、確率、抽選タイプ、版 |
| `MULTI` | 6タイプすべての得点・定義 | LLMがタイプ数・組合せを選ぶ。1タイプのみも可。複数を強制しない | 6得点、生成器が申告した適用タイプ集合・理由、版 |

- タイプは `Achiever`、`Philanthropist`、`Socialiser`、`FreeSpirit`、`Player`、`Disruptor` の6種類。
- HEXAD得点はタイプごとに4〜28点（4項目×1〜7点）。ROULETTEは `w_i = max(0, s_i - 16)`、`P(i)=w_i/sum(w)`。16は質問項目の中立点の合計であり、確立済みの心理測定上の臨界値ではない。
- **未決：全6タイプで `w_i=0` の場合のフォールバック**。被験者実験の参加条件・割付・分析を検討する時点で、実験前に決定すること。黙って対象者を除外しない。
- `MULTI`には現時点で得点閾値を設けない。16点以下のタイプを選びやすいかは生成実験で補助的に確認し、問題があれば事前に改修・再検証する。
- HEXADは**教育的に妥当と判定された候補集合の内側での推薦選択と文章表現**だけに影響する。学習判断、教材・正誤、支援目的、許可候補集合、行動実行可否には影響させない。
- 学習者実験の条件は**4条件すべて**。オフライン文章生成・HEXAD適応度確認実験は **`STANDARD / TOP-1 / MULTI` の3条件**。ROULETTEは1文生成に限れば選んだ1タイプを与える点がTOP-1と同じなので、独立した生成条件にしない。
- 新しいフィードバックのROULETTE抽選と、**失敗した同一フィードバックの再試行**は区別する。後者では既に選んだタイプを維持する。

## 2. 学習支援と入力情報の契約

### 2.1 教育的責務
- Hattie & Timperleyに基づく `Feed Up / Feed Back / Feed Forward` を意識する。学習内容に応じて長さや強調点は変わってよい。
- フィードバックのレベル `FT`（課題）、`FP`（プロセス）、`FR`（自己調整）はLLMが選択・併用する。機械的なルールで1つに固定しない。人物全体を評価する`FS`中心の文面は避ける。
- コード＝観測できる学習事実、教材の意味づけ、実行可能な候補、計算済み大目標進捗。LLM＝不確実性を明示した解釈、支援方針、妥当な候補の承認、具体的な文章化。
- 単一の正誤で「理解済み／未習得」を断定しない。未観測・欠損・不明を誤答と混同しない。

### 2.2 フェーズ別の入力・推薦範囲
| 生成時点 | 診断へ渡す情報 | 推薦可能範囲 | 掲示板 |
| --- | --- | --- | --- |
| P3・P5・P6終了 | 当該フェーズの全回答試行、同単元の関連履歴、同一概念の他単元履歴、現在の教材・目標 | **同一単元内**の復習・次フェーズ・獲得済み知識カード・遷移不要の学習方法 | 渡さない |
| P7単元完了 | 単元の全フェーズの実績・回答、関連履歴、大目標・進捗 | 利用可能な復習、新単元、関連学習方法等 | 現在の単元に紐づく**公開投稿**を参考情報として利用可能 |

- 他単元の概念一致履歴は診断の参考情報であり、P3/5/6中に他単元へ移動を薦める根拠にしない。
- `localConceptId`と、意味の等価性を人手で確認した`globalConceptId`を区別する。同じ表記・接尾辞という理由だけで同一概念として結合しない。
- 問題・選択肢・正解・解説・問題場面（図／コード／Parsonsの状態）を**版付きの教材正本**から引けるようにする。
- 回答証拠の最低要件：学習者／単元／フェーズ／設問／回答セッション／試行番号／実回答（node/choice/order/none）／正誤／教材版／観測時刻。順序・重複・欠損を検証。
- 現行の完了時 `assessment_snapshot` は試行の正誤中心で、実回答を確定保存していない。非同期`answer_attempt`に存在しても到着保証がない。**確定証拠に回答内容を加える改修が必須**（旧データは欠損を明示）。
- `BigGoal` の達成条件と進捗はコードが確定した値を利用する。学習者の感情・理解度・目標達成をLLMが捏造しない。
- 推薦候補には、行動種類だけでなく対象の名称、何を学習できるか、関連概念、実行可能なURL又は具体的な非遷移手順を含める。URL自体をLLMに生成させない。
- **過去の推薦に対する反応履歴（クリック・閲覧・着手など）は、Stage1・Stage2の生成プロンプトに渡さない。** 学習状態に基づく教育的支援とHEXADによる動機づけ適応を区別するためである。推薦反応の記録自体を削除するわけではない。

## 3. 2段階LLMと権限の境界

```text
[認証済み利用者・同一イベントの観測スナップショット固定]
  ├─ 学習回答・教材・同概念過去回答・目標・利用可能な行動
  └─ evidence registry / candidate registry（コード生成）
        ↓
[LLM第1段階：HEXADなし／診断・教育的支援方針]
  ├─ 観測根拠・不確実性・FT/FP/FR・Feed Up/Back/Forward
  └─ 学習目的に合致する承認済み候補IDの集合
        ↓  コードが根拠・候補を検証し、必要事実を再解決
[LLM第2段階：条件別HEXAD]
  ├─ 同じ支援方針と承認候補・必要観測事実
  ├─ STANDARD: HEXADなし
  ├─ TOP-1/ROULETTE: 選択1タイプの名称と定義
  └─ MULTI: 6タイプの得点と定義
        ↓
  候補集合から選択 + 文章を生成 + 適用タイプ自己申告
        ↓
[コード検証・安全な遷移先解決・結果保存・画面表示]
```

**第1段階の責務**：学習課題と根拠を解釈し、支援目的を定め、**コードが渡した利用可能候補から教育的に妥当な候補集合を承認**する。HEXAD情報を含めない。

**第2段階の責務**：第1段階で固定した教育的判断・許可候補の範囲で推薦を選び、学習者向けに次の目標・フィードバック・具体的な方法と理由を生成する。新しい教育的目標・未承認行動・観測事実を作らない。

**第2段階への入力**：第1段階の要約だけで回答内容が失われないよう、選択理由に必要な「実回答と正誤」「その設問・教材の意味」「目標進捗」「許可候補の教材説明」などを、同じ保存済みスナップショットからコードで解決して渡す。必要最小限で足りない場合は追加してよい。すべてを再送しないこと自体を目的化しない。A案（必要な具体的事実だけ）とB案（関連する原入力も再送）を固定ケースで比較し、品質とトークン・遅延で採用を決める。**第1段階の結果と共通事実は生成実験の3条件で固定して再利用**する。

## 4. データ契約案 v0.1（TypeScript例・最終実装前にZod化）

> この節は設計上の入出力例であり、**現行コードの実装済み型ではない**。最終的な必須/nullable・古いJSON互換は実装時に確定する。特に`bigGoalProgress`の構造は実DB・既存型と照合して定義する。

```typescript
type HexadType =
  | "Achiever" | "Philanthropist" | "Socialiser"
  | "FreeSpirit" | "Player" | "Disruptor";
type FeedbackLevel = "FT" | "FP" | "FR";
type ExperimentCondition = "STANDARD" | "TOP-1" | "ROULETTE" | "MULTI";

type Stage1Output = {
  schemaVersion: "support-plan-v1";
  supportPlan: {
    educationalGoal: string;
    currentStateSummary: string;
    feedbackLevels: FeedbackLevel[];
    feedUp: string | null;
    feedBack: string | null;
    feedForward: string | null;
    uncertainty: string[];
    evidenceIds: string[];
  };
  approvedCandidates: Array<{
    candidateId: string;
    educationalReason: string;
    evidenceIds: string[];
    expectedPractice: string;
  }>;
};

type ResolvedCandidate = {
  candidateId: string; // コード付与の候補識別子
  action:
    | { kind: "navigation"; actionId: number; targetId: string }
    | { kind: "self_action"; capabilityId: string };
  targetName: string;
  learningContent: string;
  executionDescription: string;
  educationalReason: string;
};

type HexadContext = null
  | { kind: "single"; type: HexadType; definition: string }
  | {
      kind: "multi";
      scores: Record<HexadType, number>;
      definitions: Record<HexadType, string>;
    };

type Stage2Input = {
  schemaVersion: "feedback-compose-v1";
  snapshotId: string;
  condition: ExperimentCondition;
  lockedSupportPlan: Stage1Output["supportPlan"];
  approvedCandidates: ResolvedCandidate[];
  contextFacts: Array<{ sourceId: string; statement: string }>;
  appContext: {
    courseId: string;
    courseTitle: string;
    phaseKey: string | null;
    stageGoal: string | null;
    bigGoalProgress: unknown | null; // 既存 BigGoalInput 等から厳密化する
  };
  hexadContext: HexadContext;
};

type Stage2Output = {
  schemaVersion: "feedback-result-v1";
  nextGoalText: string;
  feedbackText: string;
  recommendations: Array<{
    candidateId: string;
    nextStepText: string;
    reasonText: string;
  }>;
  hexadAudit: {
    appliedTypes: HexadType[];
    rationale: string;
  } | null;
};
```

**必須バリデーション**：
1. `STANDARD` ↔ `hexadContext=null`・`hexadAudit=null`。`TOP-1/ROULETTE` ↔ コード選択の単一タイプのみ。`MULTI` ↔ 6得点・6定義。実験条件と入力形の不正な組合せを拒否する（可能なら判別Union＋Zod）。
2. `Stage1Output.approvedCandidates[*].candidateId` はコードが発行した候補集合に存在する。第2段階の選択もその承認集合に所属する。画面に表示する候補数と順序は実際のUI契約に合わせる。
3. ID転記ミスによる生成失敗を抑えるため、LLMには例えば`C1`/`C2`の**短い一時ID**のみを渡し、バックエンドで実際の`actionId/targetId/capabilityId`へ解決する。技術IDやURLの複写を要求しない。存在しない候補を許容するような曖昧一致はしない。
4. `evidenceIds/sourceId` は同一スナップショットの証拠registryを参照。LLMが転記・整形を誤っても大量失敗を生まないよう、必要に応じてコード側で確定事実を再解決する。**厳密性と生成成功率のトレードオフは生成テストで評価**し、過剰な検証は調整する。存在しない学習事実を通す意味ではない。
5. 候補の実行権限・遷移先は**表示時にも再検証**し、無効なURLや他人の教材を開かない。文章の教育的自然さや妥当性は機械判定のみで証明できない。
6. `MULTI.hexadAudit.appliedTypes` は生成器の**自己申告**。文章中で特性が実際に検出されたかは別システムの分類器で判定する。
7. 既存の保存済み結果・先頭候補互換表示については後方互換を保つ。旧データを再生成した結果として書き換えない。

## 5. 生成失敗・再生成のUX（論点7：決定）

- 失敗時には理由を利用者向けに簡潔に示し、**「再生成」ボタンを表示**する。詳細な内部エラー・プロンプト・個人情報を露出しない。待機中は通常のローディング表示。
- 再試行は**学習者のボタン操作を契機**とする。**ユーザー向けの固定再試行回数上限は設けない**。裏で無限ループの自動再試行はしない。
- ボタン押下中は非活性化し、二重クリックや複数タブからの同時生成が重複実行されないように、既存の`runToken`/期限・状態管理等を確認する。
- 同じフィードバックの失敗に対する再試行では**同一イベント・保存済み学習証拠・実験条件**を保ち、TOP-1の固定タイプ／ROULETTEの**既抽選タイプ**を変えない。MULTIは同条件・同6得点・同プロンプト版を用いる。
- 成功済みのフィードバックを好みが出るまで引き直すボタンは提供しない。成功結果は保存して再表示する。
- 失敗段階（stage1/stage2、構造検証、timeout等）、失敗コード、各試行の入力版・モデル・使用量・期間・再実行回数、最終状態を保存する。外部公開ログには個人情報・回答生データや全文プロンプトを無差別出力しない。
- 同一ステージの内部SDK再試行上限やレート制御・同時実行数・サーバー負荷ガードは、**UIの再生成回数を制限しない**という方針と別物。既存Cloud Tasks/Cloud Runの再配送・重複配信と競合しない実装にする。
- 失敗後にStage1を再実行するか保存済みの成功Stage1を再利用するかは実装時に明示する。**同じ教育的判断を保持する方が条件統制上望ましい**ため、成功済み段階を再利用する案を優先検討。途中成功・失敗の保存／再開可否の既存DB契約を先に確認。
- 教材の利用権限を再確認し、既存画面の「先へ進む／結果に戻る」導線は生成失敗でも妨げない。割当不足など**再試行しても解消しないエラー**は、闇雲なループを誘導しない表示にする。
- 生成成功率（初回、手動再試行後）、失敗原因内訳、遅延・コストは生成テストで確認する。ID不一致だけを原因に応答できない頻度が高い場合はID提示方式を再検討する。

## 6. 研究目的に対応するオフライン生成実験（アプリ本体に分類器を追加しない）

- 生成実験の条件：`STANDARD`（24件）、`TOP-1`（6タイプ×24=144件）、`MULTI`（10人工プロフィール×24=240件）。元計画：3単元×4生成時点×各2回。入力を固定し、第1段階の支援結果と第2段階の共通事実を同条件間で共有する。
- `ROULETTE`を生成実験に含めない。学習者実験から削除するという意味ではない。
- 分類器：`Qwen3:30B`、`Mistral-Small-3.2`、`Phi-4`。各分類器には**HEXAD6タイプの特徴・定義＋学習者向けフィードバック文章**を渡し、6タイプそれぞれを独立に`0/1`判定させる。生成器の適用タイプ申告や得点を分類器に見せない。
- `TOP-1`：指定1タイプの検出率。`STANDARD`：HEXAD指定なしの各タイプ検出傾向。
- `MULTI`主指標A：**複数タイプ採用率**＝生成器が`appliedTypes`に2タイプ以上を申告した文章数／全MULTI文章数（生成器の自己申告）。
- `MULTI`主指標B：**複数採用時の採用タイプ全検出率**＝Aに該当する文章のうち、申告した全タイプを分類器が検出した文章数／Aに該当する文章数（分類器別）。分母が0なら`N/A`、0%としない。
- `MULTI`補助指標C：**16点以下のタイプの採用率**＝16点以下のタイプを1つ以上申告した文章数／全MULTI文章数。制限追加の判断材料であって、現行方式の違反判定とはしない。
- 判定原本は「文章ID×分類器ID×タイプID」の0/1。プロフィール別（単独高得点6、2タイプ高得点3、全タイプ同程度1）、必要な場合のみ分類器別、タイプ別に集計。分類器間は完全一致率・タイプ別Fleiss' κを報告する。
- 記述統計を中心とする。独立した学習場面の少なさ・繰返し生成・同一文章への3分類器の評価を、独立した多数の被験者に見立てて有意差検定しない。95%信頼区間・検定は必須要件としない。
- 実験は生成方式の**動作特性の確認**であり、「MULTIは必ず2タイプ以上を採用すべき」「合格閾値は70%」等の根拠のない規則は設けない。低得点タイプが頻繁に採用される場合は、16点以下を候補から外す修正を検討する。変更前後のプロンプト・結果は混ぜない。
- 分類器同士の一致は正解ラベルの証明ではない。生成器の自己申告も独立した正解ラベルではない。独立の教育的妥当性評価実験は追加せず、代表ケースで最低限の不整合・実行不能推薦を確認する。
- **被験者実験は別計画**。小規模の主観評価の変化を中心に評価する。参加条件、尺度、割付、統計解析、ROULETTE候補ゼロの処理はその実験計画で決める。

## 7. develop実装との差分（2026-11-16時点のコード照合）

| 現行ファイル・機構 | 確認した現状 | 必要な作業 |
| --- | --- | --- |
| `back/prisma/schema.prisma` | `FeedbackCondition` は `STANDARD/PERSONALIZED` の2値。`ExperimentAssignment`と`FeedbackV1`が参照 | 新4条件に移行。既存割当・保存結果の互換・データ移行方針を明示し、旧`PERSONALIZED`を根拠なく新条件へ読み替えない。Migration要 |
| `back/src/service/feedbackV1.context.ts` | 条件`PERSONALIZED`時に6得点をHEXAD入力へ入れる。P3/5/6は行動23/4/9に制限 | TOP-1/ROULETTEの単一タイプ選択と固定、MULTIの全得点、同条件スナップショット、候補の教材説明、単元完了時の公開投稿を照合 |
| `back/src/service/feedbackV1.engine.ts` | 既にLLMを`analysis`→`selection`の2回呼ぶ。ただし第1段階は候補承認せず、第2段階が1〜3候補を新規生成。既存の構造化`conceptClaims`・6得点複写・ID検証がある | Stage1が支援計画＋許可候補を確定、Stage2は候補内で選択・文面生成。HEXADはStage2だけ。schema/Prompt/Validation/互換変換を更新 |
| `back/src/service/feedbackV1.evidence.ts` | 既知の保存済みスナップショットから`sourceId/kind/path` registryを構築 | 参考にしてStage1根拠検証・Stage2必要事実の解決。短縮IDなども採用検討 |
| `back/src/service/feedbackConcepts.ts` / `back/src/service/learning.service.ts` | 完了証拠は回答内容を含まず、概念状態`confirmed/needs_check`で集計 | フェーズ完了時の全試行の実回答を確定保存。概念は証拠整理に変更し、習得判定として使わない。旧データ対応 |
| `front/src/features/learning/assessment/assessment.ts` / `front/src/features/learning/instrumentation/useAssessmentObservation.ts` | 試行の回答はフロントにあり、非同期`answer_attempt`に送れるが確定`assessmentEvidence`には含めない | 確定完了証拠・backend検証契約・教材版と合わせて改修 |
| `front/src/features/learning/app/feedback/FeedbackScreen.tsx`、`front/src/api/feedbackV1.api.ts` / 表示hook | 専用画面・生成先読み・ポーリング・既存失敗表示がある | 失敗時の手動「再生成」操作、二重押下防止、実験条件に影響しない再開、取得中/成功/失敗/無効の分岐を実装 |
| `FeedbackV1` / `FeedbackV1Call` | 保存入力・結果・呼び出しログと`runToken`, `runAttempts`等がある | 2段階スナップショット、固定抽選、各ステージ結果・失敗、再生成試行を復元可能にする。専用テーブル新設の必要性は実装側で判断 |
| `feedbackV1.engine.ts` の`generate` | 実入力JSONを実行ディレクトリの`input.json`へ無条件書込 | **不適切な平文ファイル出力を削除**。正規の監査用保存に一本化し、資格・個人情報へのアクセスを制御する |

補足：➍既存の推薦表示・選択・到達のログは削除しなくてよいが、本研究のP0実装対象に**新規の詳細着手計測**を置かない。旧仕様書`docs/learning-feedback-402.md`等は当時の実装記録として残し、本書との差分をPRで明示する。

## 8. 推奨する実装順序・PR分割

| 順序 | 目的 | 主な成果物・確認 |
| --- | --- | --- |
| PR-A | 4条件と固定・抽選規則 | Prisma移行、割当処理、HEXAD入力の差分テスト、旧結果互換、ROULETTE既抽選を再試行で固定 |
| PR-B | 根拠と候補の正本 | 回答の確定保存、教材版、同一概念対応、証拠registry、コードが作る候補と行動先メタデータ |
| PR-C | 2段階LLMの契約変更 | Stage1支援計画＋承認候補、Stage2候補内選択＋文章・監査、Zod、検証・必要事実抽出、旧結果互換 |
| PR-D | 手動再生成とUI | 失敗画面と再生成ボタン、状態遷移・重複防止・固定スナップショットの保存、完了結果の再利用 |
| PR-E | 生成試験・回帰確認 | 固定ケースの実LLM検証、条件間統制、生成成功率・失敗内訳、オフライン適応度実験用の出力データ契約 |

この順序は**推奨実装順**であり、依存関係により細分化可。作業途中で実験条件が不意に変わる状態を避けるため、単一PRで全変更を混ぜない。

## 9. 受入条件（実装担当者用）

### 実験条件・統制
- [ ] STANDARDのStage1/Stage2にHEXAD入力がない。Stage1は4条件とも同じ入力・出力・承認候補を参照できる。
- [ ] TOP-1同点時は学習者/人工プロフィール単位で一度選び、その後固定される。ROULETTEは**新フィードバック**単位で抽選し、失敗再試行では選び直さない。
- [ ] MULTIは6得点・定義を受け取り、1タイプだけを選んでもエラーにならない。反映タイプと理由の自己申告が保存される。
- [ ] ROULETTE全重み0は実験開始前までに仕様確定することが明示され、暫定挙動を研究条件として黙って採用しない。
- [ ] 第2段階は第1段階が承認していない候補・実行不能URLを出せない。学習上の判断は条件差で変更しない。

### 観測と文章
- [ ] P3/5/6の全回答試行を実回答・正誤・連番とセットで確定保存でき、非同期イベント未到着でも欠損しない。
- [ ] 観測していない概念習得・感情を断定しない。P3/5/6は他単元へ誘導せず、単元終了後の公開掲示板のみ参照できる。
- [ ] 学習者向け文章は現在の教材/設問/大目標に沿った具体的内容を含む。候補1件でも無理に条件差を作らない。
- [ ] schema/根拠ID/候補ID検証によって生成成功率が不当に下がっていないことを、固定ケースと失敗内訳で確認する。
- [ ] 旧データの欠損・旧FeedbackCondition・旧保存結果に対応し、古い記録を新しい正解データに見せかけない。

### 失敗・画面・ログ
- [ ] timeout/validation等の失敗時に学習者が「再生成」を選べ、UI上の固定回数上限はない。成功済み結果は再生成できない。
- [ ] 再生成連打/同時タブ/Cloud Tasks再配送が二重生成を引き起こさず、同一イベント・条件・学習証拠・抽選結果を維持する。
- [ ] 内部失敗理由、トークン、モデル、プロンプト版、実行回数を監査可能。機微情報をAPIエラー・サーバー標準出力・平文`input.json`に漏らさない。
- [ ] 生成失敗でも学習フローを妨げず、推薦未選択を学習失敗と扱わない。
- [ ] リアルユーザーの割当・主観評価・実験運用を含む実機確認は別途必要。コード通過のみで実験開始可能と宣言しない。

### 既存の検証
- バックエンド：`npm run lint`、`npm run typecheck`、`npm run build`、`npm run verify:feedback-v1`、`npm run verify:feedback-v1-context`、`npm run verify:feedback-candidates`、`npm run verify:feedback-evidence-sources`、`npm run verify:feedback-evidence-storage`、`npm run verify:feedback-tasks`、`npm run verify:feedback-v1-storage`、`npm run verify:static`。実DB/LLMが必要な確認は未実施なら明記。
- フロント：`npm run lint`、`npm run typecheck`、`npm run build`、既存のfeedback関連verify、実際の専用画面からの再生成・表示・復帰動作。
- Prisma：schema変更時はmigration・既存行の扱い・dev適用確認をPRに記載。破壊的seed/本番DB変更を独断で実施しない。
- デプロイ：dev Cloud Runの生成フロー、Cloud Tasks、DBの実状態、ポーリング・タイムアウトを必ず実機で確認。生成エラー・成功率を保存済みログで再確認。

## 10. 実装着手時に確認する事項（**研究合意では未決**）

1. 2段階の最終Zod型、承認候補の上限・表示件数、結果APIの後方互換フィールド。現行1〜3候補を維持するか変更するかは画面UXと合わせて判断する。
2. Stage2への回答等の再投入範囲。A案（必要事実のみ）とB案（関連原情報再送）の固定ケース比較。
3. 失敗時に成功済みStage1を保持して再利用する実装とログの粒度、Cloud Tasks/DB状態の厳密な遷移設計。
4. 具体的な心理尺度の版・HEXAD定義文の出典・プロンプト版、生成モデル/温度等を固定する時期。
5. ROULETTEの全得点16以下時の処理、被験者実験の割付・評価尺度・実施手順。
6. MULTIで採用タイプ申告が空となる異常出力の検証方針と、最終的な補助指標の実装。
7. 通常のフィードバック生成と、オフライン文章生成実験でのStage1共通化・条件固定の具体的バッチ手順。

**未決事項を「既に合意済み」として埋めて実装しない。** ただし型の命名、ファイル分割、DB列の追加など実装技術上の判断は、既存規約とテストを満たす範囲で担当者が選んでよい。

## 11. 参照資料

- [Google Drive: Engineer Quest LLMフィードバック設計整理（2026-11-16）](https://docs.google.com/document/d/1nMvW51AOsE5aWeOMAGkV7sxb-3HeEx4_PiNSsedjlDw/edit)
- [Google Drive: 生成文章のHEXAD適応度に関する実験計画](https://docs.google.com/document/d/1qzlE3R5IbX54L4m_xNe76cyv2JOLKLZJpFOvQydiAYA/edit)
- 既存実装記録：`docs/learning-feedback-402.md`、`docs/feedback-dedicated-screen-369.md`、`docs/feedback-v1-implementation.md`。
- 本書は2026-11-16時点の`develop`コードと照合した**実装仕様書**。実装・マイグレーション・実モデル検証済みという主張ではない。
