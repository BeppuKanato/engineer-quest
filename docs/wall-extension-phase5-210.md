# 棒倒し法 フェーズ5（コードの確認問題）（Issue #210）

目的: 棒倒し法単元のフェーズ5を、参照コード `generate_maze`（契約 wall-extension-v1）への独立した空欄補充2問として実装する。設計は基準データ（docs/concept/wall-extension-unit-baseline.md §3、正本は未マージのため承認済み原本に従う）に従う。最終確認日: 2026-11-06。本 PR は feat/wall-extension-phase4-209（PR #220）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/wall-extension/code-check/` に content / types / Preview / README.md を新設（構成は BFS フェーズ5に合わせた）。
  - `codeCheck.content.ts`: 設問定義と読み込み時の検証。対象コードはフェーズ4の `wallExtensionCode` への参照同一で、複製しない。
    - Q1 `pillar-column-step`: 柱を立てる内側ループ `for x in range(2, size - 1, □):`（10行目）の進み幅。選択肢 1 / 2 / 3、正解 2。
    - Q2 `up-delta`: 方向の対応表 `"up": (0, □)`（13行目）の移動量。選択肢 -1 / 0 / 1、正解 -1。
  - 空欄位置は文脈で一意化する `blankWithin` で求める（詳細は留保）。
  - 正誤フィードバックは設問固有の解説文（Q1: 柱は2マスおきに立つため／Q2: 上は行が1つ減る方向のため）を一文で持ち、共通基盤 `newAnswerFeedback` が優先して表示する。
  - 復習導線はフェーズ4の該当フレームへ（Q1: 柱の二重ループ `for-pillar-row-2` → `for-pillar-column-2-2`、Q2: `for-pillar-row-exit` → `define-directions`）。復習の終端フレームと設問の `stepId` フレームが、どちらも対象行をハイライトすることを検証で固定する。
  - `WallExtensionCodeCheckPreview.tsx`: BFSフェーズ5と同じ画面構成。共通 `CodeDisplay` で空欄つきコードを表示し、選択・再挑戦・ボタンによる進行・正解後ロック・誤答時の復習モーダル・完了時の要約通知（embedded時）を持つ。単品プレビュー `/learning-preview/wall-extension-code-check` に登録。

## 検証

- `npm run verify:wall-extension-code-check`（新規）: 空欄が数値部分だけを覆い、正解で埋めた行が参照コードとバイト単位で一致すること、正解で埋めた全文が契約原文と一致すること、全6候補が Python の `ast.parse` を通ること、選択肢と正解の妥当性、設問固有の正誤フィードバック文（理由の一文・誇張表現なし）、共通エンジン経由の進行と完了条件（誤答→再挑戦→正解、ソフトゲートによる全問未正解での完了、初回回答のみの集計、問2の独立性、異なる回答種別の拒否）、実描画（21行・空欄は対象行の1か所だけ・他行は原文のまま・正解が画面に漏れない）、検証の負系（重複する選択肢、誤った正解、ずれた空欄、未知の行・復習先）を確認。
- 回帰: `verify:wall-extension-code-mapping` / `verify:bfs-code-check` 通過。front の `lint`（警告1件は既存 BfsUnitPreview の無関係なもの）/ `typecheck` / `build` 通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- 空欄位置の求め方が BFS と異なる。BFS は「対象トークンが行内で一度だけ現れる」前提で位置を決めたが、本単元では Q1 の「2」が `range(2, ...)` の開始値と、Q2 の「-1」が `"left": (-1, 0)` と重複するため、その前提が成り立たない。文脈（直前・直後の文字列）で一意化する方式に変え、空欄の範囲は数値部分だけに保った。検証では空欄が正解トークンと正確に一致することを固定している。
- Q1 の設問文は、正解の数値を直接書かず「柱を立てる位置の間隔を決めるために」とした（BFS フェーズ5が目的を述べつつ答えの語を書かない書き方に合わせた）。理由は正誤フィードバックで一文で説明する。
- 基準データの正本（docs/concept/wall-extension-unit-baseline.md）は PR #216 が未マージで本スタックに無いため、承認済み原本の §3 フェーズ5に従った（フェーズ3・4の実施記録と同じ留保）。
