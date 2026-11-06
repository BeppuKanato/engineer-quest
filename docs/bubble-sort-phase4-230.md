# バブルソート フェーズ4（動きとコードの対応）（Issue #230）

目的: バブルソート単元のフェーズ4を、フェーズ2の16ステップをチェックポイントとして参照コード `bubble_sort` の実行と同期させる39フレームとして実装する。設計は基準データ（docs/concept/bubble-sort-unit-baseline.md §2・§3、正本の取り込みは Issue #226 のため、本実装は承認済み原本に従う）に従う。最終確認日: 2026-11-06。本 PR は feat/bubble-sort-phase3-229（PR #240）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/bubble-sort/code-mapping/` に コード契約モジュール / content / types / Canvas / Preview / README.md を新設（構成は棒倒し法フェーズ4に合わせた）。
  - `bubbleSortCode.ts`: 参照コードの契約 `bubble-sort-v1`。基準データ §2 の `bubble_sort` 8行を、意味ID・本文・インデントそのままで固定する（行の追加・変更・言い換えなし）。フェーズ5・7も同じ契約を使う前提。
  - `codeMapping.types.ts`: Canvas 型と検証。盤面はフェーズ2のスナップショットへの参照同一、ハイライトは正本のコード行1行のみ、変数は主教材の長さと一致する n、範囲内の i・j、参照コードが到達可能な配列である result を検証する。定義関数ではチェックポイントがフェーズ2の全16ステップを順番どおり含むことと、全コード行が少なくとも1フレームで示されることを強制する。
  - `codeMapping.content.ts`: フレーム列の構成。盤面は複製せずフェーズ2の完全状態を直接参照する。フレームの並びと変数は参照コードの実際の行実行どおり（内側・外側ループの脱出を含む）で、チェックポイントでは盤面が対応するフェーズ2ステップに切り替わり、キャプションもフェーズ2のものをそのまま使う。フレーム列は `../bubbleSort.ts` の実行記録（参照コードと同じ手順の比較列）から組み立てる。
  - `codeMapping.presentation.ts`: 変数行の整形（未代入は「—」）と、直前フレームとの変更判定。表示は基準データ §3 の指定どおり i / j / n と現在のペアで、ペアは result と j からの射影。
  - `BubbleSortCodeMappingCanvas.tsx`: 棒倒し法フェーズ4と同割り付け。左に盤面（共通配列描画へ委譲）、右に共通 `CodeDisplay`（実行行は濃く・非実行行は薄く、行ハイライトはフォーカス青）と、コードエリア下部の変数表（変化した値を反転表示）。
  - `BubbleSortCodeMappingPreview.tsx`: 単品プレビュー（`/learning-preview/bubble-sort-code-mapping`）。保存や計装ポートは持たない。
- 対応づけの要点（基準データ §3 フェーズ4）:
  - 外側ループ（for-pass 行）は周回ごとに実行され、範囲の縮小は内側ループの実行回数の減少としてフレーム列に現れる。完成ステップは外側ループの脱出に対応する。
  - 内側ループ（for-compare 行）は比べる位置 j の代入ごとに実行され、各周の確定ステップは内側ループの脱出（同じ行の最後の実行）に対応する。
  - 交換条件 `result[j] > result[j + 1]` の評価フレームではペアと result（交換前）を表示し、交換が起きる比較のチェックポイントは交換行 `result[j], result[j + 1] = result[j + 1], result[j]` に置く。交換が起きない比較のチェックポイントは条件行に置く。

## 検証

- `npm run verify:bubble-sort-code-mapping`（新規）: コード契約が基準データ §2 の原文と意味ID・バイト単位で一致すること、参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/bubbleSortCodeMappingTrace.py`）と定義フレームを除く全38フレームの実行行・ローカル変数が一致すること、フェーズ2の16チェックポイントの順序・盤面参照同一・対応行（交換ありは交換行、交換なしは条件行、各周の終わりは for-compare 行、完成は for-pass 行）、交換直前の条件フレームで result が交換前の配列であること、実行結果 [1, 2, 3, 4, 5] がフェーズ2最終盤面と一致すること、変数の変更ハイライト判定、実描画（コード原文・アクティブ行・変数行・盤面の棒の本数）、検証の負系（参照でない盤面コピー、未知の行、到達不可能な result、範囲外の i、不正な n、チェックポイント欠落）を確認。
- 回帰: `verify:bubble-sort-execution` / `verify:bubble-sort-check` / `verify:bubble-sort-motivation` / `verify:wall-extension-code-mapping` / `verify:bfs-code-mapping` 通過。front の `lint`（警告1件は既存 BfsUnitPreview の無関係なもの）/ `typecheck` / `build` 通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- 変数表示の「現在のペア」は、Python のローカル変数そのものではなく result と j からの射影である。基準データ §3 フェーズ4が変数表示として i / j / n と現在のペアを指定しているため、presentation で導出して表示した。ループ脱出直後のフレームでは、最後に比べたペアがそのまま表示される（j が最後の値を保持する実セマンティクスどおり）。
- 基準データ正本（docs/concept/bubble-sort-unit-baseline.md）は Issue #226 で取り込み予定のため本スタックに無い。本実装は承認済み原本 §2・§3 に従い、検証スクリプトは §2 のコード原文を埋め込んで照合した（フェーズ1〜3と同じ留保）。正本マージ後は正本ファイルからの照合へ寄せられる。
