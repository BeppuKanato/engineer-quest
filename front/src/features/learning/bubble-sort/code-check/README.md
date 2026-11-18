# バブルソート「コードの確認問題」

- 目的・適用範囲: フェーズ6が前提とする「流れとコードの対応づけ」を判断するための独立8問（コード空欄補充）を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-18。
- 正本: [バブルソート基準データ§2・§3](../../../../../../docs/concept/bubble-sort-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/bubble-sort-phase5-231.md)（当初2問の実装記録。8問への拡充は本READMEと基準データ§3が現行仕様）。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/bubble-sort-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と同じ参照コード（契約 bubble-sort-v1、8行）への直接参照で、本文・インデント・意味IDを変更しない。設問文中の行番号は `bubbleSortCodeLineNumber` で意味IDから導出する。

設問数と内訳は固定数ではなく、フェーズ6が前提とする対応づけを一通り判断できるかで決める（2026-11-17 の基準。当初の独立2問は Issue #231）。参照コード8行すべてを対象にし、`if-larger` 行だけ「相手の位置」と「比較の向き」で2問にする（`define-function` 行はフェーズ6 Parsons の固定行のため対象外）。

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `copy-input` | `copy-values`（2行目） | コピーを作る式 | list(values) / values / len(values) | list(values) | `define-function` → `execution-initial` |
| `count-values-blank` | `count-values`（3行目） | 個数を入れる変数 | n / i / j | n | `execution-initial` → `count-values` |
| `outer-loop-range` | `for-pass`（4行目） | 周の回数 | n - 1 / n / n + 1 | n - 1 | `count-values` → `for-pass-0` |
| `inner-loop-range` | `for-compare`（5行目） | 内側ループの範囲の末尾 | 1 / i / n | i | `for-pass-0` → `for-compare-1-0` |
| `swap-condition` | `if-larger`（6行目） | 交換条件の右辺の位置 | j + 1 / j / j - 1 | j + 1 | `for-compare-1-0` → `if-larger-1-0` |
| `compare-operator` | `if-larger`（6行目） | 比較の記号 | > / < / == | > | `for-compare-1-2` → `if-larger-1-2` |
| `swap-assignment` | `swap-values`（7行目） | 入れ替え代入の右辺 | result[j + 1], result[j] / result[j], result[j + 1] / result[j], result[j] | result[j + 1], result[j] | `if-larger-1-0` → `execution-compare-1-0` |
| `return-result-blank` | `return-result`（8行目） | 返すもの | result / values / n | result | `execution-complete` → `return-result` |

- 全問とも `requires: null` の独立設問。順に解くが、他問の正解や表示内容を回答値から導かない。
- 空欄位置の求め方は設問で異なる。対象トークンが行内の他の場所にも現れる設問（`inner-loop-range` の「i」、`count-values-blank` の「n」）は文脈で一意化して求め（`blankWithin`）、それ以外はBFS方式の「行内で一意なトークン」で求める（`blankAt`）。どの空欄も対象の式だけになり、正解を入れた行は元の行とバイト単位で一致する。全選択肢を入れた全文が Python として構文的に成立することも検証する。
- 正誤フィードバックは設問固有の解説文を持ち、「なぜその式か」が一文で分かる形にする。共通基盤の `newAnswerFeedback` が設問の文を優先して使う。
- 進行・採点は共通エンジン（`../../assessment/assessment.ts`）の現行統一仕様: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても進める（ソフトゲート）。完了は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した設問は選択肢を無効化してロックする。
- 誤答後は「💡 この処理の動きをもう一度見る」で復習モーダルを開ける。復習はフェーズ4の元フレームを参照のまま再生し、回答記録は変えない。
- コード表示は共通 `CodeDisplay`（対象行だけを破線枠の空欄にし、他行は完成済みの通常色）。狭い画面ではコード領域だけを横スクロールし、空欄を見える範囲へ寄せる。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateBubbleSortCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式へ解説文と行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BubbleSortCodeCheckPreview.tsx`: アセスメント画面。embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:bubble-sort-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
