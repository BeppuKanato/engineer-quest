# 二分探索「コードの確認問題」

- 目的・適用範囲: Issue #290の独立2問（コード空欄補充）を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [二分探索基準データ§2・§3](../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/binary-search-phase5-290.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と同じ参照コード（契約 binary-search-v1、12行）への直接参照で、本文・インデント・意味IDを変更しない。設問文中の行番号は `binarySearchCodeLineNumber` で意味IDから導出する。

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `mid-formula` | `compute-mid`（5行目） | 真ん中を求める式の右端 | lo / hi / mid | hi | `execution-range-full` → `execution-probe-1-mid` |
| `skip-mid` | `drop-left`（9行目） | 左端を真ん中の次へ移す増分 | 0 / 1 / 2 | 1 | `elif-smaller-1` → `execution-probe-1-drop-left` |

- 両問とも `requires: null` の独立設問。順に解くが、問2の正解や表示内容を問1の回答値から導かない。
- 空欄はどちらの設問も「行内で一度だけ現れるトークン」で求める（`blankAt`、BFS方式）。Q1の `hi` は対象行の中で一度だけ、Q2の `1` も対象行の中で一度だけ現れるため、文脈による一意化は要らない。どちらの空欄も対象の式だけになり、正解を入れた行は元の行とバイト単位で一致する。
- 正誤フィードバックは設問固有の解説文を持ち、「なぜその式か」が一文で分かる形にする（Q1: 真ん中は範囲の両端 lo と hi の中間のため／Q2: 真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外す）。共通基盤の `newAnswerFeedback` が設問の文を優先して使う。
- 進行・採点は共通エンジン（`../../assessment/assessment.ts`）の現行統一仕様: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても進める（ソフトゲート）。完了は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した設問は選択肢を無効化してロックする。
- 誤答後は「💡 この処理の動きをもう一度見る」で復習モーダルを開ける。復習はフェーズ4の元フレームを参照のまま再生し、回答記録は変えない。
- コード表示は共通 `CodeDisplay`（対象行だけを破線枠の空欄にし、他行は完成済みの通常色）。狭い画面ではコード領域だけを横スクロールし、空欄を見える範囲へ寄せる。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateBinarySearchCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式へ解説文と行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BinarySearchCodeCheckPreview.tsx`: アセスメント画面。embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:binary-search-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
