# バブルソート フェーズ2（動きの説明）（Issue #228）

目的: バブルソート単元のフェーズ2を、#227 の配列描画基盤の上に16ステップの完全スナップショットとして実装する。設計は基準データ（docs/concept/bubble-sort-unit-baseline.md §1・§3、正本の取り込みは Issue #226 のため、本実装は承認済み原本に従う）に従う。最終確認日: 2026-11-06。本 PR は feat/bubble-sort-phase1-227（PR #238）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/bubble-sort/execution/` に content / types / Canvas / Preview / README.md を新設（構成は BFS フェーズ2と棒倒し法フェーズ2に合わせた）。
  - `execution.types.ts`: Canvas 型は共通配列基盤の `ArrayBarsCanvasState` をそのまま使う。検証は基盤の `validateArrayBarsCanvas` に「highlight は比べたペアそのものであること」「比べていない場面では highlight を置かないこと」を足す（既存の検証は弱めていない）。
  - `execution.content.ts`: 配列はすべて `../bubbleSort.ts` の実行記録（契約 bubble-sort-v1 と同じ手順の比較列）から組み立て、手書きの遷移はない。
  - `BubbleSortExecutionCanvas.tsx`: 描画は共通配列基盤へ委譲する。
  - `BubbleSortExecutionPreview.tsx`: 単品入口。接続・保存・学習ログのポートは持たない。
- ステップ列（16ステップ、全スナップショット、キャプションは各1文）:
  - ステップ1 `initial` 初期状態 [4, 2, 5, 1, 3]。
  - 比較10ステップ。ステップIDは `compare-<何周目>-<比べる位置 j>`（例: `compare-1-1` は1周目の2回目の比較まで終えた状態で、フェーズ3の場面になる）。各ステップは比べた後の状態で、comparing に比べたペア、入れ替わった場合は highlights にその2マスを置く。確定範囲 fixedFrom はその周の間は変わらない（1周目=5、2周目=4、3周目=3、4周目=2）。キャプションは値と結果の一文（「4 と 2 を比べて、入れ替えます」「4 と 5 を比べて、そのままにします」）。
  - 確定4ステップ `pass-end-<何周目>`。各周の終わりに右端の1マスが確定し、fixedFrom が1つ減る（4→3→2→1）。キャプションは確定する値を指す（「一番大きい 5 が、右端に決まりました」「次に大きい 4 が、5 の左隣に決まりました」など）。
  - ステップ16 `complete` 完成 [1, 2, 3, 4, 5]（fixedFrom=0）。「並び替えが完成しました。」
- 単品プレビュー: `/learning-preview/bubble-sort-execution`（フェーズ1と同じ登録方法）。
- 基盤への追加はない（配列基盤は #227 のものをそのまま使う）。

## 検証

- `npm run verify:bubble-sort-execution`（新規）: 契約 bubble-sort-v1 を検証スクリプト内で独立に再実装し、基準データ §1 のトレース（比較10回・交換6回）と全ステップの配列が一致すること、比較・交換・確定の表現（comparing / highlights / fixedFrom）が各ステップで正しいこと、値の多重集合が全ステップで保存されること、実描画の棒の本数・ペアの色づけ・交換の枠・確定マスを確認。フェーズ2検証の負系（ペアと一致しない highlight、比較外の highlight）も確認する。
- 回帰: `verify:bubble-sort-motivation` / `verify:bfs-execution` 通過。front の `lint`（警告1件は既存の BfsUnitPreview のもので本変更と無関係）/ `typecheck` / `build` 通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- 確定ステップのキャプション: 基準データ §3 は「一番大きい 5 が、右端に決まりました」の形を指定する。2周目以降は確定位置が右端そのものではなくなるため、「次に大きい 4 が、5 の左隣に決まりました」「3 が、4 の左隣に決まりました」「2 が、3 の左隣に決まりました」と、確定した値とその右隣の値で位置を指す形にそろえた（いずれも盤面どおりの位置関係）。
- 最終ステップのキャプション: 作業指示の「並び替えが完成しました」趣旨の一文として、そのまま「並び替えが完成しました。」を採用した。
- 基準データ正本（docs/concept/bubble-sort-unit-baseline.md）は Issue #226 で取り込み予定のため本 PR には含まれない。本実装は承認済み原本 §1・§3 に従った（フェーズ1と同じ留保）。
