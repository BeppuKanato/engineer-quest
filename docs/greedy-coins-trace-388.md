# 貪欲法（硬貨問題） 視覚デバッグ（トレース）（Issue #388）

目的: 貪欲法（硬貨問題）単元の視覚デバッグを、基準データ §3 フェーズ7（ボタン文言「硬貨が選ばれる様子を見る」、D1 の実行を硬貨の図で再生し、額面の切り替わりと残額の減り方、トレイに硬貨がたまる様子を見せる）と §4（共有ハーネスへの remaining / coin / amount の int パススルー加算、単元側で array のスナップショットと remaining / coin から盤面スナップショットを作る変換、イベント上限は既定500）として実装する。構成は二分探索の視覚デバッグ（#293）の型に従う。最終確認日: 2026-11-11。

## 実装

- 共有基盤（加算のみ）:
  - `front/public/python-trace-harness.mjs`: `_eq_locals` のスカラーパススルーに `remaining` / `coin` / `amount`（int）を追加した。対象名の変数が無い単元では何も記録されず、既存単元のトレース結果は変わらない。
  - `front/src/lib/pythonTrace.types.ts`: `PythonTraceLocals` に同3キーを追加した。
- `front/src/features/learning/greedy-coins/trace/`（モジュール README に詳細）:
  - `acquireTrace.ts`: 表示用 D1（主教材 786円を [500, 100, 50, 10, 5, 1] で払う）だけを、Worker を作り直して送る。判定用 J1〜J4 の引数・期待値は送らない。イベント上限は既定 500。
  - `convertTrace.ts`: ハーネスのイベント列（array と remaining / coin / amount）から、フェーズ2と同じ盤面型 `GreedyCoinsExecutionCanvasState` のスナップショット列を組み立てる。硬貨1枚の選択は `result.append(coin)` と `remaining -= coin` の2行に分かれるため、記録だけが増えたイベント（トレイ合計と残額が一致しない）は盤面にせず、両方がそろったイベントで「トレイの最後の硬貨＝今見ている額面」になったときに選択を確定する。正しい貪欲法を再実行して差し替える処理はない。
  - `GreedyCoinsTraceDialog.tsx`: 既存 LearningPlayer とフェーズ2の `GreedyCoinsExecutionCanvas` を組み合わせるモーダル。下に観測行と result・remaining・coin・amount を表示する。
  - `trace.content.ts` / `trace.types.ts`: 文言と型。
- `GreedyCoinsImplementationPreview.tsx`（フェーズ7画面）へ接続した: 編集画面と全テスト通過後の完了表示の両方で使える「硬貨が選ばれる様子を見る」ボタンを置き、取得中は編集・採点実行・試し実行・ヒント・重複実行を無効にする。学習イベント（implementation_run kind=trace / trace_result）は二分探索と同じ契約で送る。あわせて #387 の `verify:greedy-coins-implementation` が固定していた「トレース未接続」の画面契約を、接続済みの確認へ追随させた。

## 検証

- `npm run verify:greedy-coins-trace`（新規）: CPython で同じハーネスを実行し、次を確認した。
  - ハーネス加算が貪欲法の変数（remaining・coin・amount と result のリスト）を記録すること、二分探索の参照コードのトレースに新キーが一切混入せず既存キー（lo・hi・mid・array）が変わらないこと。
  - 正解コードの再生が、フェーズ2の正準11コマと盤面・キャプションまで完全一致すること。スナップショットがコピーであること（過去イベントの書き換えが後続へ波及しない）。
  - 500円を飛ばす誤った選択が、そのまま再生されること。途中でエラーを起こすコードが、確定済みの選択（[500, 100]）を残して停止行・種別だけを示すこと（例外本文は出ない）。
  - トレイとして描けない並び（額面に無い 999）が現れた場合の途中表示、打ち切り、構文エラーの最終状態表示、候補が曖昧な場合の最終状態表示、remaining・coin を使わない実装（別名）の最終状態表示。
  - 描画（額面チップ6個・残額・トレイの硬貨、処理中額面の状態）、取得が D1 だけを新しい Worker へ送ることとキャンセル。
- 回帰: 全単元のトレース verify（`verify:bfs-trace`、`verify:dfs-trace`、`verify:wall-extension-trace`、`verify:bubble-sort-trace`、`verify:maze-digging-trace`、`verify:binary-search-trace`）、貪欲法の先行 verify 全本（motivation / execution / check / code-mapping / code-check / consolidation / implementation）、`verify:learning-player`、front の型チェック（`tsc --noEmit`）、新規・変更ファイルの lint、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **選択の確定は while の再チェック相当のイベントで行う**: 記録（append）と残額の更新（subtract）が別行である以上、盤面として整合する瞬間は両方がそろったイベントだけである。そのため、選択直後の盤面は「次の行イベント」で確定する（フェーズ4のチェックポイントで既に記録された留保と同じ性質）。再生される盤面列・キャプションはフェーズ2と完全一致する。
- **最終状態表示へ落ちる実装の範囲**: remaining / coin という変数名を使わない実装（別名、 helper 関数への分離など）は、二分探索の規約どおり推測せず最終状態表示へ落とす。最終状態は実際に返されたリスト（トレイ）を正とする。フェーズ7のヒントとテンプレートは remaining / coin へ強く誘導しているため、通常の学習経路では再生できる想定。
- **残額が0にならない実行の扱い**: 正常に返っても残額が残る実装（例: 大きい硬貨を飛ばして払い切れない額面構成）は、まとめの盤面を出さず、最後の選択盤面に「残額が0にはなりませんでした」のキャプションを付けて示す近似にした。
