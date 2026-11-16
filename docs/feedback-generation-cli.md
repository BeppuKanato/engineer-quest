# HEXAD生成文章テストCLI｜実行手順

> **対象**：Engineer Questの現行Stage1/Stage2を使った**オフライン文章生成実験**（STANDARD／TOP-1／MULTIの3条件）。2026-11-16確認。被験者実験の4条件とは区別する。
>
> **重要**：このCLIは**実LLM APIを呼ぶ**モードを持つ。標準は費用のかからないプレビュー。DB、ユーザーの実験割付、Cloud Tasks、Web画面は更新しない。
>
> 設計正本：[HEXAD適応フィードバック仕様](hexad-feedback-implementation-spec-2026-11-16.md)。アプリ本体の導入：[4条件フィードバック検証手順](feedback-v2-rollout.md)。

## 1. 何を生成するか

一つの「ケース」は、ある単元の特定タイミング（P3 / P5 / P6 / P7）で取得した**固定の学習履歴スナップショット**。最初にHEXADを渡さずStage1で支援方針と推薦候補集合を確定する。同じケースの**全条件・全プロフィール・反復生成で、この同じStage1出力を再利用**する。

| 条件 | 1ケースあたりのプロフィール | 反復2回での文章数 | Stage2に渡すHEXAD |
| --- | --- | ---: | --- |
| STANDARD | 指定なし1組 | 2 | なし |
| TOP-1（コード値は`TOP_1`） | 6タイプを1種類ずつ指定 | 12 | タイプ名・定義のみ |
| MULTI | 人工HEXADプロフィール10組（例：単独高得点6、2タイプ高得点3、全16点1） | 20 | 6タイプ全得点・定義 |
| **合計** | **17組** | **34** | ROULETTEは含めない |

計画した**3単元×4タイミング＝12ケース**なら、STANDARD **24**、TOP-1 **144**、MULTI **240**、**合計408文章**、LLM呼び出しはStage1 **12**＋Stage2 **408**＝**計420回**（すべて初回成功の場合）。実際の件数は入力したケース数・プロフィール数・反復回数によって決まる。

- ここでのTOP-1は「指定タイプごとの**文章の表現能力**」を確認するため、各タイプが唯一の最高得点（24点、他12点）の人工スコアを内部生成する。Stage2には最高タイプの名称と定義だけを渡す。
- MULTIでは「2タイプ以上を自主的に選ぶか」「自主的に選んだ複数タイプが検出されるか」を後段で分析するため、複数採用を強制しない。生成器が申告した`appliedTypes`を記録する。
- ROULETTEは単一生成で渡す情報がTOP-1と同じ「選択済み1タイプ」なので**生成文章の分類実験から除外**。被験者実験の条件から除く意味ではない。
- このCLIは**生成器のみ**実行する。Qwen3/Mistral/Phi-4による0/1分類、Fleiss' κなどの集計は、**同じリポジトリの別CLI**で実行する：[HEXAD分類・集計CLI手順](hexad-classification-cli.md)。

## 2. 準備

```bash
cd back
npm ci
npx prisma generate
npm run feedback:generate -- --help
```

入力ファイルは次の2つ。

| 引数 | 形式・内容 | サンプル |
| --- | --- | --- |
| `--cases` | `[{ "caseId": "識別子", "input": { ... } }]` | `src/scripts/fixtures/feedback-generation-cases.example.json` |
| `--profiles` | `{ "multi": [{ "id": "...", "scores": { "Achiever": 24, ... } }] }` | `src/scripts/fixtures/feedback-generation-profiles.example.json` |

`input`は、実際の`FeedbackV1.input`と同じ構造：`learning`、`state`、`actions`、`targets`、`bigGoal`（必要に応じて`stageGoals`）。**12件を揃えるときはそれぞれ別の学習ケースを用意する**。現行DBにある`FeedbackV1.input`をエクスポートした場合は、ユーザー・イベント・進捗が正しく対応した同じ時点のスナップショットを利用する。欠損した回答を補完して事実として扱わない。

CLIは入力に含まれる**旧実験の`hexad`・`experimentV2`を除去して置換**し、証拠registryを再構築する。ただし、`learning`などに混入した個人情報やHEXAD情報までは自動匿名化できないため、**入力ファイルの匿名化・共有可否は実行者が確認する**。

> ⚠️ サンプルは**架空の学習者・架空の回答履歴**であり、研究用の妥当な学習ケースが揃ったことを意味しない。プロフィール例の「2タイプ高得点3組」の組み合わせも**仮例**。本実験前にプロフィールを確定する。

実データは`back/.feedback-generation-input/`に保存することを推奨（`.gitignore`の対象）。入力内容や生成結果をGitHub、Issue、公開ログ、外部のチャットに添付しないこと。

## 3. 実行（プレビュー → 少数生成 → 本実験）

### 3.1 プレビュー：API呼び出しなし・ファイル作成なし

```bash
cd back
npm run feedback:generate -- \
  --cases=src/scripts/fixtures/feedback-generation-cases.example.json \
  --profiles=src/scripts/fixtures/feedback-generation-profiles.example.json
```

件数・条件・予定の呼び出し回数を表示するだけ。`--execute`を**明示しない限り実モデルは呼ばれない**。

### 3.2 実際に生成する（課金あり）

`OPENAI_API_KEY`と`OPENAI_MODEL`を実行環境に設定する（`back/.env`、シェル環境変数など）。APIキーの値はリポジトリに追加しない。`OPENAI_MODEL`は実験使用モデルを**明示的に固定**するため必須。

```bash
cd back
# 1ケースのサンプルで最大2文章を試す
npm run feedback:generate -- \
  --cases=src/scripts/fixtures/feedback-generation-cases.example.json \
  --profiles=src/scripts/fixtures/feedback-generation-profiles.example.json \
  --out=.feedback-generation-results/smoke-01 \
  --execute --limit=2
```

同じディレクトリで続きから実行：

```bash
npm run feedback:generate -- \
  --cases=src/scripts/fixtures/feedback-generation-cases.example.json \
  --profiles=src/scripts/fixtures/feedback-generation-profiles.example.json \
  --out=.feedback-generation-results/smoke-01 \
  --execute --resume --limit=3
```

**全予定件数を処理する**場合、ケース・プロフィールを確定させたうえで`--execute --full`を使う。これにはAPI利用料金が発生し得る。大規模生成を無意識に開始しないよう、実行時には`--limit=N`または`--full`のどちらかが必須。

```bash
npm run feedback:generate -- \
  --cases=.feedback-generation-input/cases-final.json \
  --profiles=.feedback-generation-input/profiles-final.json \
  --out=.feedback-generation-results/study-01 \
  --execute --full
```

`--conditions=STANDARD,TOP_1,MULTI`で生成条件の部分集合を指定できる（例：`--conditions=MULTI`）。`--repeat=2`が標準、`--limit=N`は**今回の実行で新しく試みる件数**、`--resume`は既存成功分を飛ばして再開する。

**再開時は入力ケース・プロフィール・モデル・条件・反復回数・プロンプト版が一致する必要がある。** 違う場合は新しい`--out`を指定する。初回実行で出力先が空でない場合、意図しない上書きを防ぐため拒否する。

## 4. 出力ファイル

`--out`ディレクトリには次の4つを生成する（ファイル権限は原則実行者だけに限定）。

| ファイル | 内容 | 利用先 |
| --- | --- | --- |
| `manifest.json` | 入力と設定のハッシュ、モデル、プロンプト・定義のバージョン、予定件数 | 実験再現性の確認 |
| `stage1.jsonl` | **ケースごとに1件**の検証済み支援方針・承認候補 | 再開時のStage1再利用 |
| `results.jsonl` | 各文章の条件、人工プロフィール、選択タイプ、生成文章、`appliedTypes`、推薦、使用量、成功／失敗 | 評価・監査・集計 |
| `classifier-input.jsonl` | **`sampleId`と表示文章`text`のみ** | 別分類器へ渡す入力 |

`classifier-input.jsonl`では、`condition`、HEXAD得点、`appliedTypes`、生成器が申告した理由を**意図的に除外**する。分類器にHEXAD6タイプの**特徴・定義**を別途与え、`text`を6タイプそれぞれ独立に0/1判定させる。`sampleId`は条件名を含まないハッシュ識別子。あとで`results.jsonl`と突き合わせる。

分類対象`text`は「次の目標」「フィードバック本文」「推薦内容と理由」を改行結合した、**利用者に見える文章**。分析に使う文章範囲は条件間で統一する。テキスト内に偶然HEXADの語が出た場合は、その文章自体の内容なので自動削除しない。

**注意：分類器の0/1判定は生成器の自己申告の正解判定ではない。** 独立の人手正解ラベルを持たないため、「分類器が検出した割合」を「分類精度」と呼ばない。

## 5. エラー・中断・再開

- 各文章生成が成功するたびに`results.jsonl`へ追記する。Stage1が検証済みになった時点で`stage1.jsonl`へ先に追記する。
- Stage2に失敗してもStage1の検証済み結果は残し、`--resume`ではStage2だけを再試行できる。
- **エラーが発生した場合はその試行を記録して停止**する（失敗後に多量のAPI呼び出しを続けない）。実行終了コードは非ゼロ。
- 再開では、成功済みサンプルをスキップし、失敗したサンプルから試みる。出力ファイルにエラー行が残り、結果と失敗頻度を後から確認できる。
- `classifier-input.jsonl`は、成功済みの生成文章だけで再構築する。途中までの出力を誤って全件達成と解釈しない。
- 生成モデルの一時障害、スキーマ違反、候補ID不一致が発生した場合、原因を調査した後に再開する。研究条件を変更する必要があるときは**新しい出力先・設定版**で比較する。

## 6. 研究実施前に確認すること

1. 3単元×P3/P5/P6/P7の**12入力ケース**が妥当か、問題文と回答履歴が正本に対応しているか。
2. MULTIの10プロフィール（特に**2タイプ高得点3組**）の組み合わせが、実験計画に沿っているか。
3. HEXADタイプ定義・生成モデル・プロンプトバージョンを固定したか。現行の定義は運用表現の暫定版。
4. 少数件の実LLM生成で、Stage1の根拠・候補ID、Stage2の文章品質、タイムアウト、使用料金を確認したか。
5. 生成文章の全件が出揃うまで学習者実験の方式選択を確定したことにしない。変更した方式の生成結果は旧版と混ぜない。

### 実行するテスト（API料金・DB操作なし）

```bash
cd back
npm run verify:feedback-generation-batch
npm run verify:static
npm run typecheck
npm run build
```

実LLM API接続やDBを用いたスナップショット抽出は、これらのCIテストでは検証しない。機密データを用いる場合はローカル環境で実施する。
