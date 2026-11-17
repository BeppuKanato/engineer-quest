# 二分探索「コードの確認問題」

- 目的・適用範囲: Issue #290のコード空欄補充を、フェーズ6が前提とする対応づけを一通り判断できる独立8問に拡充したもの（2026-11-17 の基準）を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-18。
- 正本: [二分探索基準データ§2・§3](../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/binary-search-phase5-290.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/binary-search-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と同じ参照コード（契約 binary-search-v1、12行）への直接参照で、本文・インデント・意味IDを変更しない。設問文中の行番号は `binarySearchCodeLineNumber` で意味IDから導出する。

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `init-hi` | `init-hi`（3行目） | 右端を最後の位置にする式 | len(values) - 1 / len(values) / 0 | len(values) - 1 | `init-lo` → `execution-range-full` |
| `while-range` | `while-range`（4行目） | くり返しの条件の比較記号 | <= / < / == | <= | `execution-range-full` → `while-range-1` |
| `mid-formula` | `compute-mid`（5行目） | 真ん中を求める式の右端 | lo / hi / mid | hi | `execution-range-full` → `execution-probe-1-mid` |
| `if-hit` | `if-hit`（6行目） | 一致を確かめる比較記号 | == / < / > | == | `execution-probe-1-mid` → `if-hit-1` |
| `return-mid` | `return-mid`（7行目） | 返すもの | mid / values[mid] / -1 | mid | `if-hit-3` → `execution-found` |
| `elif-smaller` | `elif-smaller`（8行目） | 小さい場合の分岐の比較記号 | < / > / == | < | `execution-probe-1-mid` → `elif-smaller-1` |
| `skip-mid` | `drop-left`（9行目） | 左端を真ん中の次へ移す増分 | 0 / 1 / 2 | 1 | `elif-smaller-1` → `execution-probe-1-drop-left` |
| `drop-right` | `drop-right`（11行目） | 右端を真ん中の前へ移す増分 | 0 / 1 / 2 | 1 | `else-larger-2` → `execution-probe-2-drop-right` |

- 設問数と対象行は固定数ではなく、フェーズ6（応用問題）が前提とする対応づけを一通り判断できるかで決める（2026-11-17 の基準）。フェーズ6は、転移リストの追跡（真ん中の計算・両方向の捨て方）、不在ケースの終わり方（範囲が空になるまでのくり返し条件）、Parsons（くり返しの中の各行の意味）、並んでいる前提（比べる記号の意味）を説明なしに使う。当初の2問は12行中2行だけが対象で、右端の初期化・くり返し条件・一致の判定・返す位置・小さい場合の分岐・右側の捨て方が未確認だったため、コードの流れに沿う並びで6問を足した。
- 対象外として残したもの: `else:` 行は空欄にできるトークンを持たないため、その対の意味は `elif-smaller` と `drop-right` の設問で確認する。`lo = 0`（左端の初期化）はフェーズ4のフレームで提示され、フェーズ6は範囲を場面で与えるため、判断事項として追加しない。
- 全問とも `requires: null` の独立設問。順に解くが、ある設問の正解や表示内容を別の設問の回答値から導かない。
- 空欄はどの設問も「行内で一度だけ現れるトークン」で求める（`blankAt`、BFS方式）。どの空欄も対象の式・記号だけになり、正解を入れた行は元の行とバイト単位で一致する。
- 正誤フィードバックは設問固有の解説文を持ち、「なぜその式か」が一文で分かる形にする（例: 真ん中は範囲の両端 lo と hi の中間のため／真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外す）。共通基盤の `newAnswerFeedback` が設問の文を優先して使う。
- 進行・採点は共通エンジン（`../../assessment/assessment.ts`）の現行統一仕様: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても進める（ソフトゲート）。完了は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した設問は選択肢を無効化してロックする。
- 誤答後は「💡 この処理の動きをもう一度見る」で復習モーダルを開ける。復習はフェーズ4の元フレームを参照のまま再生し、回答記録は変えない。
- コード表示は共通 `CodeDisplay`（対象行だけを破線枠の空欄にし、他行は完成済みの通常色）。狭い画面ではコード領域だけを横スクロールし、空欄を見える範囲へ寄せる。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateBinarySearchCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式へ解説文と行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BinarySearchCodeCheckPreview.tsx`: アセスメント画面。embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:binary-search-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
