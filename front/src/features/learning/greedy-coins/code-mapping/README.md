# 貪欲法（硬貨問題）「動きとコードの対応」

- 目的・適用範囲: Issue #384の44フレームを単品で操作する。状態: 現行。最終確認日: 2026-11-11。
- 正本: [貪欲法（硬貨問題）基準データ§2・§3](../../../../../../docs/concept/greedy-coins-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/greedy-coins-phase4-384.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/greedy-coins-code-mapping を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。フェーズ2の選択ステップ9つ（select-1〜select-9）をチェックポイントとして、参照コード `greedy_coins`（契約 greedy-coins-v1、8行）の実行行ハイライトと変数の変化を同期して再生する。チェックポイントは「硬貨を記録する行」（`result.append(coin)`）の実行9回。コードエリアの下部には、その時点のローカル変数（remaining / coin / result）を表示し、直前フレームから変わった値を青く反転させる。段階名は「動きとコードの対応」。

- `greedyCoinsCode.ts`: 参照コードの契約。意味ID・本文・インデントを基準データ§2の原文どおり固定する（フェーズ5・7も同じ契約を使う）。
- `codeMapping.content.ts`: フレーム列。盤面はフェーズ2のスナップショットを参照し、フレームの並びと変数は参照コードの実行どおりに構成する（CPython の行イベント43行＋定義フレーム1＝44フレーム）。for が額面を進めるのは while の条件が成り立たなくなったときであり、フェーズ2で選択する硬貨が切り替わる瞬間に対応する。
- `codeMapping.types.ts`: Canvas 型と検証。盤面とコードは正本への参照同一を要求し、チェックポイントがフェーズ2の選択ステップ9つを順番どおり・全て append 行で担うことと、全8行が現れることを検証する。
- `codeMapping.presentation.ts`: 変数行の整形と変更判定。result はリストの文字列表現で比べる。
- `GreedyCoinsCodeMappingCanvas.tsx`: 盤面（フェーズ2と同じ GreedyCoinsExecutionCanvas）＋コード表示（共通 `CodeDisplay`）＋変数表。
- `GreedyCoinsCodeMappingPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。共通プレイヤーの endAction が onComplete につながる。

検証: `npm run verify:greedy-coins-code-mapping`。参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/greedyCoinsCodeMappingTrace.py`）と、全フレームの行・ローカル変数を突き合わせる。

留保: チェックポイント（append 行の実行）のフレームでは、盤面はフェーズ2の選択完了後の状態（残額は引かれた後）を示すが、コード変数 remaining はまだ引かれる前の値である。次の `remaining -= coin` のフレームで両者が一致する。変数は CPython の実行どおりを優先した（実施記録に明示）。
