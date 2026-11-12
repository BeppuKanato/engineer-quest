# 穴掘り法「コードの確認問題」

- 目的・適用範囲: Issue #261の独立2問（コード空欄補充）を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-07。
- 正本: [穴掘り法基準データ§2・§3](../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/maze-digging-phase5-261.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/maze-digging-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と同じ参照コード（契約 maze-digging-v1、22行）への直接参照で、本文・インデント・意味IDを変更しない。設問文中の行番号は `mazeDiggingCodeLineNumber` で意味IDから導出する。

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `next-room-distance` | `compute-next`（11行目） | 2マス先の座標計算の倍率（dx 側） | 1 / 2 / 3 | 2 | `for-direction-1-2` → `compute-next-1-2` |
| `undug-room-condition` | `if-diggable`（12行目） | 未掘削（壁のまま）の条件値 | 0 / 1 / 2 | 1 | `compute-next-1-2` → `if-diggable-1-2` |

- 両問とも `requires: null` の独立設問。順に解くが、問2の正解や表示内容を問1の回答値から導かない。
- 空欄位置は、対象の数値が行内の他の場所にも現れる（Q1の「2」は dy 側にも、Q2の「1」は範囲条件にも現れる）ため、BFSの「行内で一意なトークン」方式ではなく、文脈（前後の文字列）で一意化して求める（`blankWithin`）。空欄そのものは数値部分だけになる。正解を入れた行は元の行とバイト単位で一致する。
- Q1の行は `nx, ny = x + 2 * dx, y + 2 * dy` で、基準データ §3 は両方の「2」を空欄として示すが、共通の code-blank 形式は1問1空欄のため、読み順で先の dx 側だけを空欄にする暫定判断を取った。dy 側も同じ値で決まることはフィードバック文（「進む量は方向の2倍」）で補う。詳細は実施記録の留保を参照。
- 正誤フィードバックは設問固有の解説文を持ち、「なぜその値か」が一文で分かる形にする（Q1: 掘るのは2マス先の部屋のため／Q2: グリッドの1は壁のままを表すため）。共通基盤の `newAnswerFeedback` が設問の文を優先して使う。
- 進行・採点は共通エンジン（`../../assessment/assessment.ts`）の現行統一仕様: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても進める（ソフトゲート）。完了は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した設問は選択肢を無効化してロックする。
- 誤答後は「💡 この処理の動きをもう一度見る」で復習モーダルを開ける。復習はフェーズ4の元フレームを参照のまま再生し、回答記録は変えない。
- コード表示は共通 `CodeDisplay`（対象行だけを破線枠の空欄にし、他行は完成済みの通常色）。狭い画面ではコード領域だけを横スクロールし、空欄を見える範囲へ寄せる。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateMazeDiggingCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式へ解説文と行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `MazeDiggingCodeCheckPreview.tsx`: アセスメント画面。embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:maze-digging-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
