# 穴掘り法「コードの確認問題」

- 目的・適用範囲: Issue #261の独立設問（コード空欄補充）を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-18。
- 正本: [穴掘り法基準データ§2・§3](../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/maze-digging-phase5-261.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/maze-digging-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と同じ参照コード（契約 maze-digging-v1、22行）への直接参照で、本文・インデント・意味IDを変更しない。設問文中の行番号は `mazeDiggingCodeLineNumber` で意味IDから導出する。

課題強化（全単元のフェーズ3・5・6課題強化）で2問から10問へ拡充した。フェーズ6が前提とする「流れとコードを適切に対応づける能力」を判断するため、コードの流れ順に、初期化・現在マスの取得・候補の収集と選択・掘削・バックトラックの各行を対象にする。

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `grid-size` | `initialize-grid`（2行目） | グリッドの1辺の長さ | size / size - 1 / size + 1 | size | `define-function` → `execution-all-walls` |
| `dig-start-cell` | `dig-start`（4行目） | スタートの部屋の位置（2つ目の添字） | 1 / 0 / 2 | 1 | `define-directions` → `execution-dig-start` |
| `initial-stack` | `initialize-stack`（5行目） | stackの初期要素 | (1, 1) / (0, 0) / (1, 0) | (1, 1) | `execution-dig-start` → `initialize-stack` |
| `current-room-top` | `current-room`（8行目） | stackの一番上の添字 | -1 / 0 / 1 | -1 | `while-stack-1` → `current-room-1` |
| `next-room-distance` | `compute-next`（11行目） | 2マス先の座標計算の倍率（dx 側） | 1 / 2 / 3 | 2 | `for-direction-1-2` → `compute-next-1-2` |
| `undug-room-condition` | `if-diggable`（12行目） | 未掘削（壁のまま）の条件値 | 0 / 1 / 2 | 1 | `compute-next-1-2` → `if-diggable-1-2` |
| `append-candidate-order` | `append-candidate`（13行目） | 候補へ追加する座標の組 | (nx, ny) / (ny, nx) / (x, y) | (nx, ny) | `compute-next-1-2` → `append-candidate-1-2` |
| `choose-by-step` | `choose-candidate`（15行目） | 番号列の添字 | step / step + 1 / 0 | step | `if-candidates-1` → `choose-candidate-1` |
| `between-midpoint` | `dig-between`（17行目） | 間の壁の座標の平均の割り方（y 側） | // 2 / / 2 / // 3 | // 2 | `advance-step-1` → `dig-between-1` |
| `backtrack-pop` | `pop-stack`（21行目） | stackから取り除く操作 | pop / append / clear | pop | `if-candidates-7` → `else-branch-7` → `pop-stack-7` → `execution-backtrack-1` |

- 全問 `requires: null` の独立設問。順に解くが、正解や表示内容を他の設問の回答値から導かない。
- 空欄位置は、対象のトークンが行内の他の場所にも現れる（倍率の「2」は dy 側にも、条件の「1」は範囲条件にも、間の壁の「// 2」は x 側にも現れる）ため、BFSの「行内で一意なトークン」方式ではなく、文脈（前後の文字列）で一意化して求める（`blankWithin`）。空欄そのものはトークン部分だけになる。正解を入れた行は元の行とバイト単位で一致する。
- 両側に同じトークンがある行（`compute-next` の倍率、`dig-between` の中点計算）は、共通の code-blank 形式が1問1空欄のため、読み順で先の側だけを空欄にする。もう一方も同じ値・同じ演算で決まることはフィードバック文で補う（`compute-next` についての暫定判断の詳細は実施記録の留保を参照）。
- 対象外とした行: 骨格行（`define-function`・`define-directions`・`while-stack`・`return-grid`）はフェーズ6の Parsons で固定行として確認する。`initialize-step`・`advance-step` は step の役割を `choose-by-step` の添字で確認する。`initialize-candidates`・`for-direction` はループ構造そのもの、`if-candidates`・`else-branch` は分岐構造そのもので、振る舞いは `backtrack-pop` とフェーズ6の理由問題で確認する。`dig-room` は `dig-between` と対の処理で同形のため対象外。`push-stack` の追加の形は `append-candidate-order` で確認する。
- 正誤フィードバックは設問固有の解説文を持ち、「なぜその値か」が一文で分かる形にする。共通基盤の `newAnswerFeedback` が設問の文を優先して使う。
- 進行・採点は共通エンジン（`../../assessment/assessment.ts`）の現行統一仕様: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても進める（ソフトゲート）。完了は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した設問は選択肢を無効化してロックする。
- 誤答後は「💡 この処理の動きをもう一度見る」で復習モーダルを開ける。復習はフェーズ4の元フレームを参照のまま再生し、回答記録は変えない。
- コード表示は共通 `CodeDisplay`（対象行だけを破線枠の空欄にし、他行は完成済みの通常色）。狭い画面ではコード領域だけを横スクロールし、空欄を見える範囲へ寄せる。
- 完了文の「7問」はフェーズ6の強化後の問題数に合わせたもの。このPRより先にフェーズ6のPRがマージされた場合は一時的に実数と一致するが、単独で先にマージされた場合はフェーズ6が4問の間だけ文面が先行する。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateMazeDiggingCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式へ解説文と行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `MazeDiggingCodeCheckPreview.tsx`: アセスメント画面。embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:maze-digging-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
