# 二分探索「応用問題」

- 目的・適用範囲: Issue #291の応用問題を、フェーズ7が前提とする「流れからコードを組み立てる力」を一通り判断できる6問に拡充したもの（2026-11-17 の基準）を、初回結果の診断と任意復習まで単品で操作する。状態: 現行。最終確認日: 2026-11-18。
- 正本: [二分探索基準データ§3](../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/binary-search-phase6-291.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-consolidation を開く。認証・DBは不要。

| 設問 | 形式 | 場面・正解 | 論点タグ | 復習フレーム（フェーズ4） |
| --- | --- | --- | --- | --- |
| `first-center-transfer` | 配列タップ | 転移用 [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] の開始状態（範囲は全体）、正解は位置4（値 16） | 新しいリストでの真ん中の位置 | `execution-range-full` → `execution-probe-1-mid` → `execution-range-after-drop-left` → `execution-probe-2-mid` |
| `transfer-trace` | 選択 | 同じ転移リストの開始状態、調べる値の順番はどれか、正解「16 → 56 → 23」 | 新しいリストでの探索のたどり方 | `execution-range-full` → `execution-probe-1-mid` → `execution-range-after-drop-left` → `execution-probe-2-mid` → `execution-probe-2-drop-right` → `execution-range-single` |
| `absent-target` | 選択 | 主教材で 20 を探した最後の比較の状態（範囲は位置4の 25 だけ）、正解「最後の1個まで絞っても 20 はなく、範囲が空になって探索が終わる」 | 探す値が無いときの終わり方 | `execution-probe-2-drop-right` → `execution-range-single` → `execution-probe-3-mid` → `if-hit-3` |
| `absent-return` | 選択（数値） | 同じ不在ケースの最後の比較の状態、範囲が空になったとき `binary_search` が返す値、正解は -1 | 無いときに返す値 | `execution-probe-2-drop-right` → `execution-range-single` → `execution-probe-3-mid` → `if-hit-3` |
| `whole-code-order` | Parsons | 参照コード12行のうち主要8行、正解は元の行順（順序自由な行なし） | コード全体の流れ | フェーズ4の全18フレーム |
| `why-sorted-matters` | 選択 | 並んでいない [25, 3, 42, 7, 19] の開始状態、正解「どちら側を捨てるかの判断が、数字が小さい順に並んでいることを前提にしているから」 | 並んでいることが前提の理由 | `execution-probe-1-mid` → `elif-smaller-1` → `execution-probe-1-drop-left` |

- 設問数と内訳は固定数ではなく、フェーズ7（自分で実装）が前提とする「自力で流れからコードを組み立てる力」を一通り判断できるかで決める（2026-11-17 の基準）。フェーズ7のテストは D1・J1（主教材）、J2（転移リストで 23 → 位置5）、J3（不在で -1）で、当初の4問では転移は最初の真ん中しか聞いておらず全体の追跡が未確認、不在も振る舞いの選択だけでコードが返す -1 に触れていなかった。J2・J3 がそのまま要求する2点（転移の全追跡、不在の戻り値）を足した。
- Q1・Q2の場面・正解は転移用の実行記録（`binarySearchProbes`）から導く。Q1の場面は単元盤面型の開始スナップショット（範囲全体・真ん中未決定）を検証し、フェーズ2・3と同じ写像で共通配列基盤の形へ変換したもの。回答対象は全マス（範囲全体が未確定）。Q2は同じ開始場面を再利用し、正解の選択肢の文は実行記録の比較列から組み立てる。
- 場面は共通配列基盤（`ArrayBarsCanvasState`）の形で持つ。不在ケース（探す値が盤面に無い）と未整列リストは単元盤面型の検証（対象が値に含まれ・小さい順であること）を満たさず、単元盤面型では場面を表せないためである。不在の2問の場面状態は不在ケースの実行記録（最後の比較 lo=4 / hi=4 / mid=4）から組み立てる。
- Parsons は基準データの「主要 6〜7 行に絞る」に対し、初期化の2行と elif と対称な else 側の2行を外した主要8行とした（理由と差分は実施記録の留保に明記）。対象外行の組み立ては、フェーズ5の空欄（`hi = len(values) - 1` / `hi = mid - 1`）と Q2 の追跡で代替確認し、Parsons 自体は対称な側を代表させる設計を維持する。行の内容を書く力（いわゆるタイピングの段差）は教材側の判断事項として残す。対象コードはフェーズ4の `binarySearchCode`（契約 binary-search-v1）への参照で、本文・インデント・意味IDを変更しない。残した8行はすべて順序が意味を持つため、順序自由な行は設けない。
- 復習先はすべてフェーズ4の基本例で、新しいリストの答え合わせアニメーションは作らない（教材指針フェーズ6の割り切り仕様）。
- 進行・診断は共通エンジン（`../../assessment/assessment.ts`）の diagnostic-check: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても完了できる（ソフトゲート）。診断は初回回答だけから導き、正解した設問は入力を固定する。
- 結果画面は初回正解スコアと論点ごとの結果（`ResultTagRow`）を示し、届かなかった論点からは該当設問の復習を開ける。結果全体への過度な到達感表現は使わない。

ファイル:

- `consolidation.content.ts`: 設問・場面・選択肢・正解・タグ・操作指示・正誤文・復習先・完了文と、読み込み時の検証（`validateBinarySearchConsolidation`）。
- `consolidation.types.ts`: 共通 diagnostic-check 形式へ場面の配列と解説文を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BinarySearchConsolidationCanvas.tsx`: 場面（共通配列基盤の形）の表示とタップ回答。描画は共通 `ArrayDrawing` へ委譲し、回答ボタンはフェーズ3のキャンバスと同じ考え方でマスへ重ねる。フェーズ3の `BinarySearchCheckCanvas` は単元盤面型専用のため流用せず、本フェーズの場面の形に合わせて新設した。
- `BinarySearchConsolidationPreview.tsx`: 診断型のアセスメント画面。embedded / onComplete（要約通知）/ onNext（診断画面から次へ進む導線）を持つ。

検証: `npm run verify:binary-search-consolidation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
