# 穴掘り法「動きとコードの対応」

- 目的・適用範囲: Issue #260のフレーム列を単品で操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [穴掘り法基準データ§2・§3](../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/maze-digging-phase4-260.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/maze-digging-code-mapping を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。フェーズ2の21ステップをチェックポイントとして、参照コード `dig_maze`（契約 maze-digging-v1、22行）の実行行ハイライトと変数の変化を同期して再生する。実行していない行は薄く、実行中の行と対応する盤面は同じフォーカス青で示す。コードエリアの下部には、その時点で意味のあるローカル変数（size / step / x / y / dx / dy / nx / ny / candidates / stack）を表示し、直前フレームから変わった値を青く反転させる。段階名は「動きとコードの対応」。

- `mazeDiggingCode.ts`: 参照コードの契約。意味ID・本文・インデントを基準データ§2の原文どおり固定する（フェーズ5・7も同じ契約を使う）。
- `codeMapping.content.ts`: フレーム列。参照コードの制御フローをシミュレーションし、実行行1つにフレーム1つを対応させる。候補の収集は4方向の反復と終了確認まで、戻りは `stack.pop()` の1マスずつまで実際の行順どおりにたどり、フェーズ2の盤面へはチェックポイント（掘削は `stack.append(...)` 行、バックトラックは戻り切った `stack.pop()` 行、完成は `while` の終了判定）で対応づける。`else:` は CPython が行イベントを発しないため、候補が空と判定した直後に説明フレームを1つ挟む。
- `codeMapping.types.ts`: Canvas 型と検証。盤面とコードは正本への参照同一を要求し、変数は stack が掘削経路（2マス間隔の部屋列）をなすこと等を検証する。
- `codeMapping.presentation.ts`: 変数行の整形と変更判定。
- `MazeDiggingCodeMappingCanvas.tsx`: 盤面（共通グリッド描画への委譲）＋コード表示（共通 `CodeDisplay`）＋変数表。
- `MazeDiggingCodeMappingPreview.tsx`: 共通LearningPlayerへの入口。単元フロー向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。onComplete 指定時は共通プレイヤーの endAction で次へ進む。

検証: `npm run verify:maze-digging-code-mapping`。参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/mazeDiggingCodeMappingTrace.py`）と、全フレームの行・ローカル変数を突き合わせる。
