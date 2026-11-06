# 棒倒し法「動きとコードの対応」

- 目的・適用範囲: Issue #209の137フレームを単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [棒倒し法基準データ§2・§3](../../../../../../docs/concept/wall-extension-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/wall-extension-phase4-209.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/wall-extension-code-mapping を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。フェーズ2の13ステップをチェックポイントとして、参照コード `generate_maze`（契約 wall-extension-v1、21行）の実行行ハイライトと変数の変化を同期して再生する。実行していない行は薄く、実行中の行と対応する盤面は同じフォーカス青で示す。コードエリアの下部には、その時点で意味のあるローカル変数（size / i / y / x / pillars / choice / allowed / dx / dy）を表示し、直前フレームから変わった値を青く反転させる。段階名は「動きとコードの対応」。

- `wallExtensionCode.ts`: 参照コードの契約。意味ID・本文・インデントを基準データ§2の原文どおり固定する（フェーズ5・7も同じ契約を使う）。
- `codeMapping.content.ts`: フレーム列。外周ループの反復やループ脱出、条件が成り立たなかった場合も含め、実際の行実行どおりに構成する。チェックポイントでは盤面がフェーズ2のスナップショットそのものに切り替わり、伸長ステップでは書き込み行 `grid[y + dy][x + dx] = 1` が対応する。`else:` は CPython が行イベントを発しないため、if が成り立たなかった直後に説明フレームを1つ挟む。
- `codeMapping.types.ts`: Canvas 型と検証。盤面とコードは正本への参照同一を要求し、変数は pillars が柱の正規順の接頭辞であること等を検証する。
- `codeMapping.presentation.ts`: 変数行の整形と変更判定。
- `WallExtensionCodeMappingCanvas.tsx`: 盤面（共通グリッド描画への委譲）＋コード表示（共通 `CodeDisplay`）＋変数表。
- `WallExtensionCodeMappingPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（#214）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。onComplete 指定時は共通プレイヤーの endAction で次へ進む。

検証: `npm run verify:wall-extension-code-mapping`。参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/wallExtensionCodeMappingTrace.py`）と、全フレームの行・ローカル変数を突き合わせる。
