# バブルソート「動きとコードの対応」

- 目的・適用範囲: Issue #230の39フレームを単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [バブルソート基準データ§2・§3](../../../../../../docs/concept/bubble-sort-unit-baseline.md)（取り込みは Issue #226。未取り込みの間は承認済み原本に従う）、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/bubble-sort-phase4-230.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/bubble-sort-code-mapping を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。フェーズ2の16ステップをチェックポイントとして、参照コード `bubble_sort`（契約 bubble-sort-v1、8行）の実行行ハイライトと変数の変化を同期して再生する。実行していない行は薄く、実行中の行はフォーカス青で示す。コードエリアの下部には、その時点で意味のあるローカル変数（n / i / j）と、result と j から求まる現在のペアを表示し、直前フレームから変わった値を青く反転させる。段階名は「動きとコードの対応」。

- `bubbleSortCode.ts`: 参照コードの契約。意味ID・本文・インデントを基準データ§2の原文どおり固定する（フェーズ5・7も同じ契約を使う）。
- `codeMapping.content.ts`: フレーム列。内側・外側ループの脱出も含め、実際の行実行どおりに構成する。チェックポイントでは盤面がフェーズ2のスナップショットそのものに切り替わり、交換が起きる比較では交換行、起きない比較では条件行が対応する。各周の終わりは内側ループの脱出（for-compare 行）、完成は外側ループの脱出（for-pass 行）に対応する。
- `codeMapping.types.ts`: Canvas 型と検証。盤面とコードは正本への参照同一を要求し、変数は result が参照コードの到達可能な配列であること等を検証する。
- `codeMapping.presentation.ts`: 変数行の整形と変更判定。現在のペアは result と j の射影。
- `BubbleSortCodeMappingCanvas.tsx`: 盤面（共通配列描画への委譲）＋コード表示（共通 `CodeDisplay`）＋変数表。
- `BubbleSortCodeMappingPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（#235）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。共通プレイヤーの endAction が onComplete につながる。

検証: `npm run verify:bubble-sort-code-mapping`。参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/bubbleSortCodeMappingTrace.py`）と、全フレームの行・ローカル変数を突き合わせる。
