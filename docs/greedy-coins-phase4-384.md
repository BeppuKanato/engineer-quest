# 貪欲法（硬貨問題）フェーズ4（動きとコードの対応）（Issue #384）

目的: 貪欲法（硬貨問題）単元のフェーズ4（動きとコードの対応）を、基準データ §2・§3 フェーズ4に沿って実装する。参照コード8行（契約 greedy-coins-v1）を主教材トレースで再生し、フェーズ2の選択ステップ9回をチェックポイントとする。最終確認日: 2026-11-11。前提: フェーズ3は #383（本 PR の base ブランチ）。

## 実装

- `front/src/features/learning/greedy-coins/code-mapping/greedyCoinsCode.ts`: 参照コードの契約。意味ID（define-function / init-result / init-remaining / for-coin / while-remaining / append-coin / subtract-coin / return-result）・本文・インデントを基準データ §2 の原文どおり8行で固定する。フェーズ5・7も同じ契約を使う。
- `codeMapping.content.ts`: 44フレーム。盤面はフェーズ2のスナップショットを参照し、再実装しない。フレームの並びと変数は参照コードの実行どおり（定義フレーム1＋CPython の実行行43）。
  - チェックポイントは `result.append(coin)` の実行9回（`execution-select-1`〜`execution-select-9`）で、フェーズ2の選択ステップと順序どおり対応し、キャプションはフェーズ2のものをそのまま使う。
  - while の評価は15回（硬貨1枚ごとの成立9回＋額面ごとの不成立6回）、for の評価は7回（額面6つ＋脱出1回）。
  - 最後の return フレームの盤面はフェーズ2のまとめ（summary）を参照する（チェックポイントには含めない）。
- `codeMapping.types.ts`: Canvas 型と検証。盤面・コードの参照同一、チェックポイントが選択ステップ9つを順番どおり全て append 行で担うこと、全8行が現れること、変数（remaining は0〜786、coin は額面のいずれか、result は検証済み選択列の部分列）を検証する。
- `codeMapping.presentation.ts`: 変数行（remaining / coin / result）の整形と、直前フレームとの変更判定。
- `GreedyCoinsCodeMappingCanvas.tsx`: 盤面＋コード表示（共通 `CodeDisplay`、現在行ハイライト）＋変数表。二分探索フェーズ4と同じ割り付け（コード幅を優先、コードだけ横スクロール）。
- `GreedyCoinsCodeMappingPreview.tsx`: 共通 LearningPlayer への入口。単品プレビューに `greedy-coins-code-mapping` として登録した。

## 検証

- `npm run verify:greedy-coins-code-mapping`（新規）: コード文字列が契約（基準データ §2 の8行）とバイト単位で一致すること、参照コードを CPython で実行したトレース（新規フィクスチャ `front/scripts/fixtures/greedyCoinsCodeMappingTrace.py`、実行行43件）と全フレームの行・ローカル変数が一致すること、チェックポイント9回が append 行でフェーズ2の選択ステップと対応すること（盤面の参照一致・キャプション一致・result とトレイの一致を含む）、実描画（コードのバイト一致、変数行、盤面）、単品プレビューの登録を確認する。
- 既存の `npm run verify:greedy-coins-motivation` / `verify:greedy-coins-execution` / `verify:greedy-coins-check`（回帰）、front の `lint`、`typecheck`、`build` も通過（lint は既存の警告のみ。詳細は PR 本文）。
- DB・シードの変更はない。

## 留保（判断した点）

- **チェックポイントフレームの remaining のずれ（要確認）**: チェックポイントは基準データの定めどおり `result.append(coin)` の実行に置いた。このフレームの盤面はフェーズ2の選択ステップ（選択完了後、残額は引かれた後）だが、コード変数 remaining はその時点ではまだ引かれておらず、次の `remaining -= coin` のフレームで盤面と一致する。変数は CPython の実行どおり（トレース照合可能）を優先した。盤面の残額表示と変数表が1フレームだけ食い違うため、実機で違和感があれば、チェックポイントの盤面参照時点の扱いを見直す余地がある。
- **フレーム総数44**: 基準データ §3 は「フレーム数は行イベント実測で43」とする。他単元（二分探索フェーズ4）の方式に倣い、実行行43件に定義フレーム1件を足した44フレームとした。行イベント43件そのものは検証で CPython と照合している。
- **for 脱出フレーム**: ループを抜ける for 行の実行（CPython の行イベントに実在する）も1フレームとして残した。変数は変わらないが、行ハイライトが for に戻ることで「全額面を見終わった」ことがコード側でも追える。
