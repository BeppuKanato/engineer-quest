# 二分探索「動きとコードの対応」

- 目的・適用範囲: Issue #289の18フレームを単品で操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [二分探索基準データ§2・§3](../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/binary-search-phase4-289.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-code-mapping を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。フェーズ2の11ステップのうち、導入とまとめを除く9ステップをチェックポイントとして、参照コード `binary_search`（契約 binary-search-v1、12行）の実行行ハイライトと変数の変化を同期して再生する。実行していない行は薄く、実行中の行はフォーカス青で示す。コードエリアの下部には、その時点のローカル変数（lo / hi / mid）と、盤面と mid から求まる真ん中の値（values[mid]）を表示し、直前フレームから変わった値を青く反転させる。段階名は「動きとコードの対応」。

- `binarySearchCode.ts`: 参照コードの契約。意味ID・本文・インデントを基準データ§2の原文どおり固定する（フェーズ5・7も同じ契約を使う）。基準データは「11行」と記すがコードブロック自体は12行であり、本文を正として12行で固定した（実施記録の留保を参照）。
- `codeMapping.content.ts`: フレーム列。盤面はフェーズ2のスナップショットを参照し、比較列は `binarySearch.ts` の実行記録（probes）からイテレーションごとに構成する。チェックポイントは mid 決定行を中心に、範囲を捨てる行と、確定した範囲が対応する while 行の再評価、発見時の return 行に置く。`else:` は CPython が行イベントを発しないため、変数を変えない説明フレームとして分けて置く（穴掘り法フェーズ4の先例）。mid は次の代入まで最後の値を保持する。
- `codeMapping.types.ts`: Canvas 型と検証。盤面とコードは正本への参照同一を要求し、チェックポイントがフェーズ2の9ステップ（導入・まとめを除く）を順番どおり担うことと、発見ケースでは到達しない `return -1` 以外の全行が現れることを検証する。
- `codeMapping.presentation.ts`: 変数行の整形と変更判定。values[mid] は盤面の values と mid の射影。
- `BinarySearchCodeMappingCanvas.tsx`: 盤面（フェーズ2と同じ BinarySearchExecutionCanvas）＋コード表示（共通 `CodeDisplay`）＋変数表。
- `BinarySearchCodeMappingPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。共通プレイヤーの endAction が onComplete につながる。

検証: `npm run verify:binary-search-code-mapping`。参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/binarySearchCodeMappingTrace.py`）と、全フレームの行・ローカル変数を突き合わせる。
