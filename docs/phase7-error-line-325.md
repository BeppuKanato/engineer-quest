# フェーズ7のエラー行サポート（Issue #325）

- 目的：フェーズ7（自分で実装）でエラーが起きたとき、学習者が「どの行が悪いのか」を自分で特定できるようにする。あわせて、文法エラーがあると print を含め1行も実行されないことが伝わらず「print が効かない」と誤解される問題を解消する。
- 適用範囲：フェーズ7の自由実行（試しに実行）とテスト判定のエラー表示。対象単元はフェーズ7実装を持つ全5単元（BFS、バブルソート、棒倒し法、穴掘り法、二分探索）。DFS はフェーズ7未実装のため対象外。
- 最終確認日：2026-11-09
- 正本・関連：Issue #325、教材指針 `docs/concept/learning-materials-guideline.md` §7（フェーズ7）。

## 背景（調査で確定した事実）

- エディタ（Monaco）の行番号表示自体は全単元で有効だった。欠けていたのは、エラーメッセージ側が行番号を伝える経路である。
- 実行ワーカー（`front/public/pyodide-course-worker.mjs`）は学習者コードをそのまま exec するため、Pyodide が返す例外トレースバックの `File "<string>", line N` は学習者コードの行番号に対応する。
- しかし各単元の `classifyExecutionError` は生エラーを種別（syntax / runtime / timeout）に潰すだけで行情報を捨てており、結果型（`TestOutcome` / `FreeExecutionResult`）にも行番号の置き場がなかった。
- Python はモジュール全体をコンパイルしてから実行するため、文法エラーが1か所でもあると print を含む全行が実行されない。この仕様を伝える文言が無かった。

## 実装内容

### 1. 共通行番号抽出（`front/src/lib/executionError.ts`、新規）

- `analyzeExecutionError(error)` が種別と行番号（取れる場合）を返す共通解析を新設した。
  - 種別判定は従来どおり：ランナーのタイムアウト文言と完全一致したら `timeout`、メッセージに `SyntaxError|IndentationError|TabError:` があれば `syntax`、それ以外は `runtime`。分類の意味は変えていない。
  - 行番号は `extractExecutionErrorLine` がトレースバック中の `File "<string>", line N` のうち最後のものを取る。文法エラーでは例外に乗る行が、実行時エラーでは最も内側（実際にエラーが起きた）学習者コードの行が該当する。ハーネス側フレーム（`"<exec>"`）は拾わない。タイムアウトは行を持たない。
- 全5単元の `implementation.ts` の個別 `classifyExecutionError` 実装を廃し、共通モジュールへ載せ替えた（互換のため同名 export は共通モジュールからの再 export として残置）。`TestOutcome` に `errorLine?: number` を追加し、テスト実行時に解析結果を持ち回る。自由実行側（`freeExecution.ts`）も同じ解析を使い、結果に `errorLine` を載せる。

### 2. 表示文言（各単元の `editor.content.ts` / `implementation.content.ts`）

- 行番号が取れた場合、自由実行コンソールのエラー文とテスト結果の種別要約に `（{line}行目付近）` を付ける（`errorLineSuffix` / `lineNote`）。
- 自由実行コンソールでは、種別が文法エラーのときに限り説明文を出す：`syntaxNote`「プログラム全体に文法エラーがあると、print を含め1行も実行されません。」

### 3. エディタの行ハイライト（`front/src/hooks/useErrorLineDecoration.ts`、新規・全単元共通）

- `useErrorLineDecoration` が、エラー結果の行番号を受けて Monaco の行デコレーション（全体行ハイライト＋ガターのマーカー）で該当行を示す。見た目は `globals.css` の `.eq-error-line-highlight` / `.eq-error-line-marker`。
- 行番号が無くなる（コード変更・再実行・エラー解消）とデコレーションは消える。各単元の ImplementationPreview が自由実行とテスト判定の両方の最新エラー行を渡す。

## 検証

- 各単元の implementation 検証スクリプトに断言を追加した。
  - Pyodide 形式の代表エラー文字列（文法エラー、実行時トレースバック、ハーネスのみのフレーム、タイムアウト文言）を共通解析へ通し、種別と行番号（文法＝該当行、実行時＝最内フレームの行、ハーネスのみ＝行なし、タイムアウト＝行なし）を確認する。
  - テスト結果・自由実行結果への `errorLine` の持ち回りと、表示文言への行番号付加を確認する。
- front の全 `verify:*`、型チェック、lint（変更ファイル）、`npm run build` をローカルゲートとして実行する（結果は PR に記載）。

## 未実施・申し送り

- 実機での目視確認（ハイライトの見え方、文言の収まり）は未実施。PR の確認方法に従ってユーザーが確認する。
- DB・seed・migration の変更はない。
- LLM ヒントは本 PR の対象外（2026-11-09 の決定どおり保留。Issue #325 のコメント参照）。
