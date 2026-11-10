# 棒倒し法 フェーズ4（動きとコードの対応）（Issue #209）

目的: 棒倒し法単元のフェーズ4を、フェーズ2の13ステップをチェックポイントとして参照コード `generate_maze` の実行と同期させる137フレームとして実装する。設計は基準データ（docs/concept/wall-extension-unit-baseline.md §2・§3、正本は未マージのため承認済み原本に従う）に従う。最終確認日: 2026-11-06。本 PR は feat/wall-extension-phase3-208（PR #219）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/wall-extension/code-mapping/` に content / types / Canvas / Preview / README.md を新設（構成は BFS / DFS フェーズ4に合わせた）。
  - `wallExtensionCode.ts`: 参照コードの契約 `wall-extension-v1`。基準データ §2 の `generate_maze` 21行を、意味ID・本文・インデントそのままで固定する（行の追加・変更・言い換えなし）。フェーズ5・7も同じ契約を使う前提。
  - `codeMapping.types.ts`: Canvas 型と検証。盤面はフェーズ2のスナップショットへの参照同一、ハイライトは正本のコード行1行のみ、変数は主教材サイズ・柱の正規順の接頭辞である pillars・正規の方向リストである allowed・方向の移動量である (dx, dy) を検証する。定義関数ではチェックポイントがフェーズ2の全13ステップを順番どおり含むことと、全コード行が少なくとも1フレームで示されることを強制する。
  - `codeMapping.content.ts`: フレーム列の構成。盤面は複製せずフェーズ2の完全状態を直接参照する。フレームの並びと変数は参照コードの実際の行実行どおり（外周ループの反復、ループ脱出、条件が成り立たなかった場合を含む）で、チェックポイントでは盤面が対応するフェーズ2ステップに切り替わり、キャプションもフェーズ2のものをそのまま使う。
  - `codeMapping.presentation.ts`: 変数行の整形（未代入は「—」、pillars は座標の組、allowed は Python 表記）と、直前フレームとの変更判定。
  - `WallExtensionCodeMappingCanvas.tsx`: BFS フェーズ4と同割り付け。左に盤面（共通グリッド描画へ委譲）、右に共通 `CodeDisplay`（実行行は濃く・非実行行は薄く、行ハイライトは盤面と同じフォーカス青）と、コードエリア下部の変数表（変化した値を反転表示）。
  - `WallExtensionCodeMappingPreview.tsx`: 単品プレビュー（`/learning-preview/wall-extension-code-mapping`）。保存や計装ポートは持たない。
- 対応づけの要点（基準データ §3 フェーズ4）:
  - 柱の二重ループは `range(2, size - 1, 2)` の行実行どおりに示し、行・列の候補を終えた脱出もフレームにする。
  - `if y == 2:` の評価フレームで一番上の段かどうかを示し、成り立つ場合は4方向の `allowed`、成り立たない場合は `else:` の説明フレームを挟んで3方向の `allowed` へ進む。
  - 方向から移動量を引く行では、番号・方向名・(dx, dy) を変数とキャプションの両方で示す。
  - 各伸長ステップのチェックポイントは書き込み行 `grid[y + dy][x + dx] = 1` に対応し、盤面はフェーズ2の伸長直後スナップショットそのものになる。
- 変数表示は generate_maze の実際のローカル変数の射影（size / i / y / x / pillars / choice / allowed / dx / dy）。grid は盤面が表示を担うため含めない。i・choice・allowed・dx・dy は Python の実セマンティクスどおり、ループを抜けた後も最後の値を保持する。

## 検証

- `npm run verify:wall-extension-code-mapping`（新規）: コード契約が基準データ §2 の原文と意味ID・バイト単位で一致すること、参照コードを CPython で実際に実行したトレース（`front/scripts/fixtures/wallExtensionCodeMappingTrace.py`）と全フレームの実行行・ローカル変数が一致すること（定義フレームと else 説明フレームを除く130フレーム）、フェーズ2の13チェックポイントの順序・盤面参照同一・対応行（伸長は書き込み行）、else フレームの位置と変数不変、実行結果の壁50マスがフェーズ2最終盤面と一致すること、変数の変更ハイライト判定、実描画（コード原文・アクティブ行・変数行・盤面の壁数）、検証の負系（参照でない盤面コピー、未知の行、接頭辞でない pillars、不正な allowed / 移動量、チェックポイント欠落）を確認。
- 回帰: `verify:wall-extension-execution` / `verify:wall-extension-check` / `verify:wall-extension-motivation` / `verify:bfs-code-mapping` / `verify:dfs-code-mapping` 通過。front の `lint`（警告1件は既存 BfsUnitPreview の無関係なもの）/ `typecheck` / `build` 通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- フレーム数は137と BFS（62）・DFS（68）より多い。DFS フェーズ4の「実行された全行に1フレーム（ループ脱出・不成立の条件を含む）」の型を踏襲した結果で、うち46フレームは外周ループ（i = 0..8 × 5行＋脱出）が占める。外周の反復を間引く案もあり得るが、実際の行実行と変数を CPython トレースで保証する性質を優先した。再生はシークとステップ移動でたどれる。
- `else:` 行は CPython が行イベントを発しない（実測）。そのため if が成り立たなかった直後に、変数を変えない説明フレームを6つ（下段の柱の数だけ）挿入した。トレース照合ではこのフレームを分離して数え、位置と変数不変を別途検証している。
- Python 3.12 以降はリスト内包表記が呼び出し側フレームへインライン化され、`initialize-grid` 行のイベントが内包の反復回数だけ連続する。フィクスチャでは「行とローカル変数が同一の連続エントリ」を畳んでバージョン間でトレースを安定させている。
- 基準データの正本（docs/concept/wall-extension-unit-baseline.md）は PR #216 が未マージで本スタックに無いため、検証スクリプトは §2 のコード原文を埋め込んで照合した（フェーズ3の実施記録と同じ留保）。正本マージ後は DFS 検証と同様に正本ファイルからの照合へ寄せられる。
