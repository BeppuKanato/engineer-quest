# 棒倒し法「コードの確認問題」

- 目的・適用範囲: Issue #210の独立2問（コード空欄補充）を単品で最後まで操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [棒倒し法基準データ§2・§3](../../../../../../docs/concept/wall-extension-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/wall-extension-phase5-210.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/wall-extension-code-check を開く。認証・DBは不要。

対象コードはフェーズ4と同じ参照コード（契約 wall-extension-v1、21行）への直接参照で、本文・インデント・意味IDを変更しない。設問文中の行番号は `wallExtensionCodeLineNumber` で意味IDから導出する。

| 設問 | 対象行 | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `pillar-column-step` | `for-pillar-column`（10行目） | rangeの進み幅 | 1 / 2 / 3 | 2 | `for-pillar-row-2` → `for-pillar-column-2-2` |
| `up-delta` | `define-directions`（13行目） | 「上」の移動量（dy） | -1 / 0 / 1 | -1 | `for-pillar-row-exit` → `define-directions` |

- 両問とも `requires: null` の独立設問。順に解くが、問2の正解や表示内容を問1の回答値から導かない。
- 空欄位置は、対象の数値が行内の他の場所にも現れる（Q1の「2」は `range(2, ...)` の開始値、Q2の「-1」は「left」の移動量）ため、BFSの「行内で一意なトークン」方式ではなく、文脈（前後の文字列）で一意化して求める（`blankWithin`）。空欄そのものは数値部分だけになる。正解を入れた行は元の行とバイト単位で一致する。
- 正誤フィードバックは設問固有の解説文を持ち、「なぜその値か」が一文で分かる形にする（Q1: 柱は2マスおきに立つため／Q2: 上は行が1つ減る方向のため）。共通基盤の `newAnswerFeedback` が設問の文を優先して使う。
- 進行・採点は共通エンジン（`../../assessment/assessment.ts`）の現行統一仕様: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても進める（ソフトゲート）。完了は「最後まで進み、全問に1回以上回答したこと」で、結果と要約は初回回答のみから導く。正解した設問は選択肢を無効化してロックする。
- 誤答後は「💡 この処理の動きをもう一度見る」で復習モーダルを開ける。復習はフェーズ4の元フレームを参照のまま再生し、回答記録は変えない。
- コード表示は共通 `CodeDisplay`（対象行だけを破線枠の空欄にし、他行は完成済みの通常色）。狭い画面ではコード領域だけを横スクロールし、空欄を見える範囲へ寄せる。

ファイル:

- `codeCheck.content.ts`: 設問・空欄位置・選択肢・正解・正誤文・復習先・完了文と、読み込み時の検証（`validateWallExtensionCodeCheck`）。
- `codeCheck.types.ts`: 共通 code-blank 形式へ解説文と行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `WallExtensionCodeCheckPreview.tsx`: アセスメント画面。embedded / onComplete（要約通知）を持つ。

検証: `npm run verify:wall-extension-code-check`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
