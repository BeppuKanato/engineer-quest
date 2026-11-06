# バブルソート フェーズ5（コードの確認問題）（Issue #231）

目的: バブルソート単元のフェーズ5を、フェーズ4の参照コード `bubble_sort`（契約 bubble-sort-v1）に対する独立2問のコード空欄補充として実装する。設計は基準データ（docs/concept/bubble-sort-unit-baseline.md §3、正本の取り込みは Issue #226 のため、本実装は承認済み原本に従う）に従う。最終確認日: 2026-11-06。本 PR は feat/bubble-sort-phase4-230（PR #241）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/bubble-sort/code-check/` に content / types / Preview / README.md を新設（構成は棒倒し法フェーズ5に合わせた）。
  - `codeCheck.types.ts`: 共通エンジンの code-blank 形式に正誤の解説文を足し、対象行をフェーズ4の契約の意味IDで型に縛る設問型・コンテンツ型と、単元接続用の要約型。
  - `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateBubbleSortCodeCheck`）。対象コードはフェーズ4の `bubbleSortCode` への参照同一で複製しない。設問文中の行番号は意味IDから導出する。
  - `BubbleSortCodeCheckPreview.tsx`: アセスメント画面。棒倒し法フェーズ5と同じ画面構成（コードは共通 `CodeDisplay`、復習はフェーズ4の元フレームをモーダルで参照再生）。embedded / onComplete（要約通知）を持つ。
  - 単品プレビュー `/learning-preview/bubble-sort-code-check` を登録した。
- 設問（基準データ §3 フェーズ5の確定事項）:

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 |
| --- | --- | --- | --- | --- |
| `inner-loop-range` | `for-compare`（5行目） `for j in range(n - 1 - □):` | 範囲の末尾 | 1 / i / n | i |
| `swap-condition` | `if-larger`（6行目） `if result[j] > result[□]:` | 右辺の位置 | j + 1 / j / j - 1 | j + 1 |

- 解説・不正解フィードバックは「なぜその式か」が一文で分かる文にした（Q1: 周が進むごとに右端の確定範囲が広がるため、比べる範囲は i のぶんだけ狭くなる／Q2: 比べるのは右隣の要素のため、相手の位置は j + 1）。復習先はフェーズ4の該当フレーム（Q1: `for-pass-0` → `for-compare-1-0`、Q2: `for-compare-1-0` → `if-larger-1-0`）。
- 進行・採点は共通エンジンの現行統一仕様（回答では進まずボタンで進行／正解後ロック／初回のみ集計／ソフトゲート）に従い、新規の判定は作らない。

## 検証

- `npm run verify:bubble-sort-code-check`（新規）: 対象コードが基準データ §2 原文とバイト単位で一致すること、空欄が対象の式だけを覆い正解補完が行・全文ともバイト単位で原文一致すること、全6候補の Python `ast.parse` が通ること、フィードバック文の生成（誤答→設問固有の解説文／正解→正解文）と一文制約、復習先の参照一致、実描画（8行・空欄1か所・他行は原文のまま・正解の漏れなし）、エンジン経由の完了条件（ソフトゲート・問2の独立性・種別拒否含む）、検証の負系を確認。
- 回帰: `verify:bubble-sort-code-mapping` / `verify:wall-extension-code-check` / `verify:bfs-code-check` 通過。front の `lint`（警告1件は既存 BfsUnitPreview の無関係なもの）/ `typecheck` / `build` 通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- 空欄位置の求め方は設問ごとに異なる。Q1の「i」は行内に複数現れるため文脈（`n - 1 - i`）で一意化し（棒倒し法フェーズ5の方式）、Q2の「j + 1」は行内で一意なためBFS方式のトークン指定で求めた。どちらの空欄も対象の式だけに保ち、空欄＝正解トークンの一致を検証で固定している。
- 基準データ正本（docs/concept/bubble-sort-unit-baseline.md）は Issue #226 で取り込み予定のため本スタックに無い。本実装は承認済み原本 §2・§3 に従い、検証スクリプトは §2 のコード原文を埋め込んで照合した（フェーズ1〜4と同じ留保）。正本マージ後は正本ファイルからの照合へ寄せられる。
