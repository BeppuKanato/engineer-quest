# 二分探索 フェーズ4（動きとコードの対応）（Issue #289）

目的: 二分探索単元のフェーズ4（動きとコードの対応）を、基準データ §2 の参照コード（契約 binary-search-v1）を主教材トレースで再生し、行ハイライトと変数（lo / hi / mid / values[mid]）の表示をフェーズ2と同じ図に重ねる形で実装する。設計は基準データ（docs/concept/binary-search-unit-baseline.md §2・§3、正本）と教材指針、他単元フェーズ4（バブルソート #230、穴掘り法）の構成に従う。最終確認日: 2026-11-07。

## 実装

- `front/src/features/learning/binary-search/code-mapping/binarySearchCode.ts`: 参照コードの契約。意味ID・本文・インデントを基準データ §2 の原文どおり固定する（フェーズ5・7も同じ契約を使う）。
- `codeMapping.content.ts`: 全18フレーム。盤面はフェーズ2のスナップショットへの参照で複製せず、比較列は `../binarySearch.ts` の実行記録（probes）からイテレーションごとに機械的に組み立てる。
  - チェックポイント（9つ）: フェーズ2のステップのうち導入（introduce）とまとめ（summary）を除く9つを順番どおり担う。置き場所は、範囲の提示は `hi` の初期化行、真ん中の決定は各イテレーションの `mid = (lo + hi) // 2` 行、範囲を捨てる確定は `lo = mid + 1` / `hi = mid - 1` 行、捨てた直後の確定した範囲は次のイテレーションの `while` 行の再評価、発見は `return mid` 行。
  - `else:` は CPython が行イベントを発しないため、変数を変えない説明フレームとして elif の直後に分けて置く（穴掘り法フェーズ4の先例）。実行フレームは定義フレーム1＋CPython の実行行16＋else 説明1で18フレーム。
  - 変数は Python の実セマンティクスどおり、mid は次の代入まで最後の値を保持する（例: 左を捨てて範囲が確定した盤面でも mid は 3 のまま）。
  - 自動再生は 18フレーム × 3.5秒 ≒ 63秒。
- `codeMapping.types.ts`: Canvas 型と検証。盤面とコードは正本への参照同一を要求し、チェックポイントの順序・網羅と、`return -1` 以外の全行が現れることを検証する。
- `codeMapping.presentation.ts`: 変数行の整形と変更判定。values[mid] は盤面の values と mid の射影。
- `BinarySearchCodeMappingCanvas.tsx`: 盤面（フェーズ2と同じ `BinarySearchExecutionCanvas`）＋コード表示（共通 `CodeDisplay`）＋変数表（lo / hi / mid / values[mid]、直前フレームから変わった値を反転）。
- `BinarySearchCodeMappingPreview.tsx`: 他単元フェーズ4と同じ接続ポート（embedded / onComplete 等）を持ち、単体プレビューとして `front/src/app/learning-preview/[contentId]/page.tsx` に `binary-search-code-mapping` として登録した。

## 検証

- `npm run verify:binary-search-code-mapping`（新規）: コード契約のバイト一致（12行・意味ID・インデント）、参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/binarySearchCodeMappingTrace.py`）との全フレームの行番号・ローカル変数（lo / hi / mid、および values[mid] の射影）の突き合わせ、チェックポイント9つの順序・盤面参照一致・フェーズ2キャプション一致・対応行、else 説明フレームの位置と変数不変、実描画（CodeDisplay のバイト一致、変数行、棒7本）、プレビュー登録を確認する。
- 既存の `verify:binary-search-motivation`、`verify:binary-search-execution`、`verify:binary-search-check`、`verify:learning-player`、front の `typecheck`（tsc --noEmit）、新規ファイルの `lint`、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **基準データ §2 の行数表記との矛盾（要確認）**: 基準データ §2・§3 と Issue は参照コードを「11行」と記すが、§2 のコードブロック自体は12行ある（数え直し済み）。契約の正はコードブロックの本文と判断し、12行のまま実装した。基準データ側の「11行」表記を直すかどうかは判断をお願いしたい。
- **基準データのフレーム数見積もりとの差**: 基準データ §3 は「フレーム数は30前後の見込み」とするが、CPython の実行行に1フレームずつ対応させる他単元の方式では18フレームになった。不足ではなく見積もりとの差であり、自動再生は約63秒で穴掘り法のような長時間再生にはならない。
- **フェーズ2の導入・まとめはチェックポイントに含めない**: 導入は範囲も変数も無い開始盤面としてコード側フレーム（定義・lo 初期化）がそのまま示し、まとめは return 後の振り返りで対応するコード状態が存在しないため、チェックポイントは9ステップとした。バブルソートでは全16ステップがチェックポイントだった点とは異なる。
- **`return -1` 行はハイライトされない**: 主教材は発見ケースのため到達しない。不在ケースはフェーズ6で扱う前提（基準データ §1・§3）に従った。
- **確定した範囲の盤面と変数 mid のずれ**: 捨てた直後の確定範囲の盤面（フェーズ2）では mid が無いが、コード変数の mid は Python の実セマンティクスどおり最後の値を保持する。盤面はフェーズ2の参照を優先し、変数は実行の事実を優先した結果のずれであり、検証で両方を固定している。
