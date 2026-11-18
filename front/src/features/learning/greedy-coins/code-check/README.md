# 貪欲法（硬貨問題）「コードの確認問題」

- 目的・適用範囲: Issue #385の独立2問に、フェーズ6が前提とする対応づけを判断する6問を足した8問を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-18。
- 正本: [貪欲法（硬貨問題）基準データ§2・§3](../../../../../../docs/concept/greedy-coins-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。実施記録: [実施記録](../../../../../../docs/greedy-coins-phase5-385.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/greedy-coins-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と全く同じ参照コード `greedy_coins`（契約 greedy-coins-v1、8行）で、共有のコード穴埋め形式（1問1穴）を使う。

設問数は固定数ではなく、フェーズ6（応用問題）が前提とする対応づけを一通り判断できるかで決める（2026-11-17 の基準）。フェーズ6は、転移トレース（初期化・額面を回す for・残額の条件・記録と更新）、反例トレース（同じ対応づけを別額面で使う）、Parsons（全8行の意味と順序）を説明なしに使う。当初の2問は8行のうち2か所だけが対象で、初期化2行・for の回すもの・条件の右辺・記録する行・返す行が未確認だったため、コードの流れに沿う並びで6問を足し、関数定義を除く全行を対象にした。関数定義行はフェーズ6 Parsons の固定行のため対象外とする（二分探索フェーズ5と同じ判断）。

| 設問 | 対象行 | 空欄 | 正解 |
| --- | --- | --- | --- |
| init-result | `□ = []`（2行目） | 結果のリスト | result |
| init-remaining | `remaining = □`（3行目） | 残額の最初の値 | amount |
| for-coin | `for coin in □:`（4行目） | 回す額面のリスト | coins |
| while-condition | `while □ >= coin:`（5行目） | 条件で比べる残額 | remaining |
| while-coin | `while remaining >= □:`（5行目） | 条件で比べる相手 | coin |
| append-coin | `result.append(□)`（6行目） | 記録する硬貨 | coin |
| remaining-update | `remaining -= □`（7行目） | 残額から引く硬貨 | coin |
| return-result | `return □`（8行目） | 返すもの | result |

- 選択肢はコードに現れる変数名・リスト名とする。正解で埋めた行が参照コードの原文とバイト単位で一致することを、モジュール読み込み時と検証の両方で確認する。
- 正誤の解説は、どの設問でも理由が一文で分かる文にする（基準データ§3）。
- 出題形式は共通エンジン（`../../assessment/assessment.ts`）の `code-blank-check` を使う。全問独立で、前問の回答を条件にしない（requires は null）。
- 進行は全フェーズ共通（PR #170）: 回答では進まず、「次の問題へ／結果を見る」を押して進む。正解していなくても進める（ソフトゲート）。完了条件は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した問題は入力をロックする。
- 誤答時は「💡 この処理の動きをもう一度見る」で、フェーズ4の該当行のフレームを復習モーダルで任意に確認できる。復習先の最後のフレームは、対象行をハイライトする。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・正解・復習ステップID・正誤の解説文・完了文と、契約との整合検証（`validateGreedyCoinsCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式の設問型・コンテンツ型と、単元接続用の要約型。
- `GreedyCoinsCodeCheckPreview.tsx`: アセスメント画面。他単元のフェーズ5と同じく embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:greedy-coins-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
