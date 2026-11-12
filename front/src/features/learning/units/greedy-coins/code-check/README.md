# 貪欲法（硬貨問題）「コードの確認問題」

- 目的・適用範囲: Issue #385の独立2問を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-11。
- 正本: [貪欲法（硬貨問題）基準データ§2・§3](../../../../../../../docs/concept/greedy-coins-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/greedy-coins-phase5-385.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/greedy-coins-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と全く同じ参照コード `greedy_coins`（契約 greedy-coins-v1、8行）で、共有のコード穴埋め形式（1問1穴）を使う。

| 設問 | 対象行 | 空欄 | 正解 |
| --- | --- | --- | --- |
| while-condition | `while □ >= coin:`（5行目） | 条件で比べる残額 | remaining |
| remaining-update | `remaining -= □`（7行目） | 残額から引く硬貨 | coin |

- 選択肢はどちらもコードに現れる変数名（amount / remaining / coin）とする。正解で埋めた行が参照コードの原文とバイト単位で一致することを、モジュール読み込み時と検証の両方で確認する。
- Q1の要点は「残額と今の額面を比べる」、Q2の要点は「使った硬貨の分だけ残額を減らす」（基準データ§3）。正誤の解説は、どちらの設問でも理由が一文で分かる文にする。
- 出題形式は共通エンジン（`../../assessment/assessment.ts`）の `code-blank-check` を使う。2問は独立で、前問の回答を条件にしない（requires は null）。
- 進行は全フェーズ共通（PR #170）: 回答では進まず、「次の問題へ／結果を見る」を押して進む。正解していなくても進める（ソフトゲート）。完了条件は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した問題は入力をロックする。
- 誤答時は「💡 この処理の動きをもう一度見る」で、フェーズ4の該当行のフレーム（Q1: `for-coin-500` → `while-remaining-1`、Q2: `execution-select-1` → `subtract-coin-1`）を復習モーダルで任意に確認できる。復習先の最後のフレームは、対象行をハイライトする。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・正解・復習ステップID・正誤の解説文・完了文と、契約との整合検証（`validateGreedyCoinsCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式の設問型・コンテンツ型と、単元接続用の要約型。
- `GreedyCoinsCodeCheckPreview.tsx`: アセスメント画面。他単元のフェーズ5と同じく embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:greedy-coins-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
