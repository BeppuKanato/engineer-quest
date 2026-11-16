# HEXAD分類器・集計CLIの実行方法

生成CLIの出力を、**3種類の独立したLLM分類器**でHEXADの6タイプについて0/1判定し、検出率と分類器間一致度を計算するための実験用ツール。

- 入力：生成CLIの`classifier-input.jsonl`（`sampleId`＋表示文章`text`だけ）
- 分類器：Qwen3:30B / Mistral-Small-3.2 / Phi-4（接続先とモデル名は設定ファイルで変更可能）
- 出力：各文章×分類器の6タイプ判定と各根拠、型別検出率、TOP-1指定タイプ検出率、MULTIの3指標、分類器間一致
- **生成器のHEXADスコア・指定タイプ・自己申告は分類器への入力に含めない。** 集計時だけ別ファイルの監査情報と突き合わせる。
- DB、実験割付、Cloud Tasksは変更しない。

[生成CLIの実行手順](feedback-generation-cli.md)を先に参照。

## 1. モデルの準備

初期設定は、ローカルのOllamaのOpenAI互換API `http://127.0.0.1:11434/v1` を利用する（インターネット経由の有料LLMサービスを自動選択しない）。

Ollamaをインストールしてローカルサーバーを起動し、別のターミナルで以下を実行する：

```bash
ollama pull qwen3:30b
ollama pull mistral-small3.2
ollama pull phi4
ollama list
```

大型モデルを3つ用いるため、必要なメモリ・ストレージや処理時間が大きくなる可能性がある。CLIは**並列実行せず1呼び出しずつ**処理する。実行前に利用する計算環境でモデルをロードできるか確認する。

モデル設定は`back/src/scripts/fixtures/hexad-classifiers.example.json`。構造の例：

```json
{
  "models": [
    { "id": "qwen3-30b", "model": "qwen3:30b", "baseURL": "http://127.0.0.1:11434/v1", "timeoutMs": 600000 },
    { "id": "mistral-small-3.2", "model": "mistral-small3.2", "baseURL": "http://127.0.0.1:11434/v1", "timeoutMs": 600000 },
    { "id": "phi-4", "model": "phi4", "baseURL": "http://127.0.0.1:11434/v1", "timeoutMs": 600000 }
  ]
}
```

**別PC・クラウドにモデルをホストする場合**は、各モデルの`baseURL`をOpenAI互換の`/v1`エンドポイントへ変更する。`model`は**実際にサーバーに登録された名前**を指定する。リモートHTTPは拒否され、HTTPSを使用する。APIキーが必要な場合は設定に`"apiKeyEnv":"MY_CLASSIFIER_API_KEY"`を追加し、実行環境で当該環境変数を設定する。**キーそのものをJSONへ書かない**。

Ollamaの互換エンドポイント：[公式ドキュメント](https://docs.ollama.com/api/openai-compatibility)。各モデルの有効なタグは接続先環境によって異なるため、実際の`ollama list`で確認する。

## 2. 分類CLIの起動

作業ディレクトリは`back/`。

```bash
cd back
npm ci
npm run feedback:classify -- --help
```

### プレビュー（デフォルト：LLM APIを呼ばず、ファイルも書かない）

```bash
npm run feedback:classify -- \
  --input=.feedback-generation-results/study-01/classifier-input.jsonl
```

前段の生成CLIを未実行の場合は、このファイルはまだ存在しない。先に生成CLIの少数件テストを行うか、機密情報を含まない**架空の文章**だけからなるJSONLを作成する。

```json
{"sampleId":"demo-1","text":"次の目標を一つ決めて練習しましょう。"}
```

### 3モデル×少数の判定を実行

```bash
npm run feedback:classify -- \
  --input=.feedback-generation-results/study-01/classifier-input.jsonl \
  --out=.feedback-classification-results/study-01 \
  --execute --limit=3
```

`--limit=3`は**分類呼び出し3回分**（文章3件ではない）。408文章を3モデルで分類すると、すべて初回成功した場合で**1224回のモデル呼び出し**となる。

- `--execute`がない場合、実モデルへのAPI呼び出しは発生しない。
- `--limit=N`で件数を制限。全未処理呼び出しは`--full`を明示。
- `--models=qwen3-30b`で1モデルのみテストできる。3モデル全体で再検証したい場合は、3モデルを指定した**新しい出力先**を使う（再開ハッシュが変わるため）。
- `--config=...json`でモデル接続設定を変更できる。プレビュー時も設定ファイルを読み込む。
- モデルを途中で差し替えた場合、同一実験の比較が崩れるため、**出力先を新しくする**。

### 中断後の再開

```bash
npm run feedback:classify -- \
  --input=.feedback-generation-results/study-01/classifier-input.jsonl \
  --out=.feedback-classification-results/study-01 \
  --execute --resume --limit=3
```

成功済みの`(sampleId, classifierId)`は再分類しない。途中の失敗は出力に記録して**その時点で停止**する。問題を修正後に`--resume`で同じサンプルから再試行できる。

`--resume`では入力文章のハッシュ、6タイプの定義・判定プロンプトの版、モデル名・URL・タイムアウト、3モデルの構成が同一であることを検証する。異なる場合は、新しい`--out`へ出力する。

```bash
# 残りをすべて実行する場合だけ
npm run feedback:classify -- \
  --input=.feedback-generation-results/study-01/classifier-input.jsonl \
  --out=.feedback-classification-results/study-01 \
  --execute --resume --full
```

## 3. 分類仕様

分類器に送る入力は **(1) HEXAD6タイプの特徴定義、(2) 学習者向けの文章本文**だけである。`results.jsonl`の条件・スコア・生成器自己申告`appliedTypes`は読み込まない。

**各モデルが各文章について、6タイプをそれぞれ独立に0/1判定**する。一回のモデル呼び出しで以下の形式を返す：

```json
{
  "labels": {
    "Achiever": 1,
    "Philanthropist": 0,
    "Socialiser": 1,
    "FreeSpirit": 0,
    "Player": 0,
    "Disruptor": 0
  },
  "reasons": {
    "Achiever": "達成や目標に関する表現がある",
    "Philanthropist": "他者支援に関する表現は確認できない",
    "Socialiser": "交流や協働に関する表現がある",
    "FreeSpirit": "自律性・発見の表現は確認できない",
    "Player": "外的報酬の表現は確認できない",
    "Disruptor": "既存の仕組みを変える表現は確認できない"
  }
}
```

これは**形式例**であり、実在の文章の分類結果ではない。

- 0/1以外の値、6タイプの不足、根拠欠落、JSON以外の回答は**失敗**として記録し、0や1に勝手に補完しない。
- 文章に複数タイプが現れる場合、複数個の1を認める（6タイプのうちすべて0でもよい）。
- `temperature=0`を要求するが、モデルやサーバー実装により判定の完全な再現性を保証するものではない。
- 全モデルに同じタイプ定義・分類プロンプトを与える。定義は生成器と同じ`feedbackHexadConditions.ts`から参照。
- 根拠は分類器の説明であり、独立した**正解ラベル**ではない。
- 一度に1モデルずつ、同一会話履歴を持たずに判定する。

## 4. 出力

`--out`に以下を作成する。

| ファイル | 内容 |
| --- | --- |
| `manifest.json` | モデル構成・分類プロンプト版・入力文章ハッシュ・判定数など |
| `classification-output.jsonl` | 文章ID・分類器ID・6ラベル・各根拠・使用トークン等・エラーの履歴 |

生成条件・HEXADスコアは**分類器の入出力には含まれない**。ただし文章そのものが必要に応じて外部APIへ送信される。実データの送信許可・匿名化に注意する。

分類結果には`sourceHash`を保存する。分類がどの文章に対応しているかを検証するためのハッシュで、文章を逆算して確認するための手段ではない。

## 5. 検出率・一致度の集計

**すべてローカルで計算し、追加のLLM呼び出しは行わない**。

```bash
npm run feedback:classify:analyze -- \
  --generated=.feedback-generation-results/study-01 \
  --classified=.feedback-classification-results/study-01
```

既定の出力先：`.feedback-classification-results/study-01/analysis/`。

| 出力 | 内容 |
| --- | --- |
| `analysis-summary.json` | 全集計結果・サンプル数・欠損数 |
| `type-detection.csv` | STANDARD/TOP-1/MULTIの、タイプ別×分類器別の検出率 |
| `top1-target-detection.csv` | TOP-1で指定したタイプが検出された割合 |
| `multi-metrics.csv` | MULTIのプロフィール別×分類器別の3指標と分類器のカバレッジ |
| `classifier-agreement.csv` | 6タイプ別Fleiss' κ・3者一致率、および6ラベル完全一致率 |

MULTIの3指標は、以下のように集計する。

| 指標 | 分子／分母 | データ源 |
| --- | --- | --- |
| 複数タイプ採用率（A） | `appliedTypes`が2種類以上の件数／MULTI生成成功件数 | **生成器の自己申告** |
| 採用タイプ全検出率（B） | 自己申告した全タイプを分類器が1と判定した件数／複数採用かつ当該分類器の判定済み件数 | 各分類器の判定 |
| 16点以下のタイプの採用率（C） | 得点16以下のタイプを1つ以上申告した件数／MULTI生成成功件数 | 生成器の自己申告＋入力得点 |

- AとCは生成器の記録から計算するため、分類器ごとに同じ値を出力する。Bだけが分類器ごとに変わる。
- Bの分母が0件なら**N/A（JSONでは`null`）**。判定0%とは扱わない。
- **各値は分子・分母を併記**。分類器が未完了の場合は、欠損件数とカバレッジを確認してから解釈する。
- Fleiss' κと6ラベル完全一致率は、**3モデル全部が成功した同一文章のみ**で計算する。タイプの判定が全0・全1などでκが未定義なら`null`にする。
- 分類器間の一致は分類の正確性・HEXADに対する心理測定的な妥当性を保証しない。
- 408文章の3分類器判定は**408の文章を3者が評価**したものであり、1224の独立した被験者サンプルとして扱わない。
- 「適切な動機づけタイプを選択したか」「教育的な正しさ」を示す研究指標として、勝手に置き換えない。

集計時に、生成CLIの`results.jsonl`とブラインド入力`classifier-input.jsonl`を検証し、**元の文章と分類された文章が違えば集計を拒否する**。分類器が使用したモデル構成・入力の指紋も照合する。

## 6. テスト・プライバシー・注意

```bash
cd back
npm run verify:hexad-classification
npm run verify:static
npm run typecheck
npm run build
```

静的テストは**モック分類器**を用いて、6ラベルの形式検証、偽の付加情報拒否、モデル別再開、Fleiss' κ、集計の欠損・ハッシュ検証を行う。

- 実モデルへの分類API呼び出し、実機GPU/CPUでの応答時間・メモリ・量子化影響はCIで検証しない。
- `back/.feedback-classification-results/`は`.gitignore`対象。実在の学習者の文章・分類理由・監査情報をGitHubに公開しない。
- モデル名・定義・プロンプトの変更を行う場合、前後の出力を**別の版**として扱う。
