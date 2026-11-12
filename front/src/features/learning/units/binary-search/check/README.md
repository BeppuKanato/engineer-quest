# 二分探索「動きの確認問題」

- 目的・適用範囲: Issue #288の連結2問を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [二分探索基準データ§3フェーズ3](../../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/binary-search-phase3-288.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-check を開く。認証・DBは不要。

場面はフェーズ2のステップをIDで参照し、盤面を複製しない。Q1 は `range-after-drop-left`（主教材 [3, 7, 12, 19, 25, 31, 42] で 25 を探し、1回目の比較で左側を捨てた直後。lo=4 / hi=6、インデックス3の 19 は確認済みで範囲外）、Q2 は `probe-2-mid`（新しい真ん中 31 を見たところ）。

| 設問 | 内容 | 回答形式・対象 | 正解 |
| --- | --- | --- | --- |
| next-center | 次に調べる真ん中のマスはどれか | 配列セルのタップ（残った範囲の位置4〜6） | 位置5（値31） |
| range-after-compare | 31 と 25 を比べた後、次に残る範囲はどうなるか | 文章の4択ボタン | 右側を捨てて、範囲は 4 だけになる |

- Q1の回答対象を残った範囲に限るのは、捨てた部分はもう調べないため（19 を含む位置0〜3はタップできない）。正解は `../binarySearch.ts` の実行記録の2回目の比較（lo=4 / hi=6 / mid=5、値31）から導き、基準データ§3の確定事項と一致することをモジュール読み込み時に検証する。
- Q2は「どちら側を捨てるか」という範囲の変化そのものを問うため、基準データ§3の定めどおりセルのタップではなく文章の4択にした。選択肢の数値（4 / 6）も実行記録から導く。Q2 の場面は真ん中 31 を見たステップ（`probe-2-mid`）で、選択肢は盤面の下にボタンとして並べる（フェーズ6の選択肢ボタンと同じ見た目）。
- 出題形式は共通エンジン（`../../assessment/assessment.ts`）の `concept-check` を使う。タップ設問と選択肢設問を1つの連結セッションに混在させるための種別で、本 Issue で追加した（choice 設問をフェーズ6の diagnostic-check へ寄せると、完了時に診断閲覧イベントが誤発火するため）。新規の判定・進行は作らない。
- 進行は全形式統一の現行仕様（PR #170）: 回答では進まず、「次の問題へ／結果を見る」を押して進む。正解していなくても進める（ソフトゲート）。完了条件は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。
- 正解した設問は入力をロックする（ボタン無効化＋送信側でも正解済み設問への追加試行を弾く）。
- 正誤の文は設問ごとの解説（`correctFeedback` / `incorrectFeedback`）で出す。誤答時は、Q1 では真ん中の決め方（残った範囲の両端から真ん中を求める）、Q2 ではどちら側を捨てるか（比べた値より大きい側を捨て、小さい側だけが残る）に言及する。
- 誤答後は「該当ステップの動きを確認する」で復習モーダルを任意に開ける。復習はフェーズ2の元ステップ（Q1: `range-after-drop-left` → `probe-2-mid`、Q2: `probe-2-mid` → `probe-2-drop-right` → `range-single`）を参照のまま再生し、回答記録は変えない。
- Q1の回答ボタンは棒の列に重ねる HTML ボタン（`BinarySearchCheckCanvas`）。描画はフェーズ2と同じ変換（`../execution/BinarySearchExecutionCanvas` の `toArrayBars`）＋共通の `answerCueSx`（破線リング＋タップアイコン）で回答可能だと示し、`aria-label` は「左から○番目のマス（値 ○）を選ぶ」。画面上で44px未満になる場合は中心から広げて最低限の幅を保つ。

ファイル:

- `check.content.ts`: 設問・正解・表示ステップID・復習ID・論点タグ・正誤の解説文・完了文と、場面の解決（`getBinarySearchCheckScene`）。
- `check.types.ts`: 共通 concept-check 形式の設問型・コンテンツ型と、単元接続用の要約型。
- `BinarySearchCheckCanvas.tsx`: フェーズ2と同じ盤面変換＋共通配列描画と、マス（棒の列）単位の回答ボタン。
- `BinarySearchCheckPreview.tsx`: アセスメント画面。他単元のフェーズ3と同じく embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:binary-search-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
