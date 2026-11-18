# 穴掘り法「応用問題」

- 目的・適用範囲: Issue #262の設問（転移タップ・選択・Parsons）を、初回結果の診断と任意復習まで単品で操作する。状態: 現行。最終確認日: 2026-11-18。
- 正本: [穴掘り法基準データ§3](../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/maze-digging-phase6-262.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/maze-digging-consolidation を開く。認証・DBは不要。

課題強化（全単元のフェーズ3・5・6課題強化）で4問から7問へ拡充した。フェーズ7が前提とする「自力で流れからコードを組み立てる力」を判断するため、転移盤面を最後まで追う問題、未見の番号列を開始から追う問題、大きな盤面への一般化の問題を足した。Parsons は拡充しない（22行全行が既に組み立ての対象）。

| 設問 | 形式 | 場面・正解 | 論点タグ | 復習フレーム（フェーズ4） |
| --- | --- | --- | --- | --- |
| `transfer-dig-target` | グリッドタップ | 7×7の途中状態（掘削5回目まで）、現在マス (5, 3) から左、正解 (5, 1) | 掘り進める先の追跡 | `choose-candidate-6` → `dig-between-6` → `dig-room-6` → `execution-dig-6` |
| `transfer-final-dig` | 選択 | 7×7の戻り終えた時点（現在マス (5, 3)）から右、正解 (5, 5)。誤答は直前に掘った部屋 (3, 1)・(5, 1) と再開マス (5, 3) | 戻った後の掘り直し | `choose-candidate-8` → `dig-between-8` → `dig-room-8` → `execution-dig-8` |
| `completed-maze-properties` | 選択 | 完成した9×9、正解「すべての部屋が通路でつながっていて、輪がない」 | 完成した迷路の性質 | `execution-complete` → `return-grid` |
| `backtrack-reason` | 選択 | 行き止まり (1, 5) を掘った直後の9×9、正解「掘れる部屋がもうなく、戻らなければ残りの部屋にたどり着けないため」 | バックトラックが必要な理由 | `if-candidates-7` → `else-branch-7` → `pop-stack-7` → `execution-backtrack-1` |
| `unseen-choices-last-room` | 選択 | フェーズ7の J2 と同じ番号列 [1, 1, 0, 1, 0, 0, 0, 0] で作った完成した7×7、正解 (3, 3)。誤答は同じトレースの7・5・4回目の掘削先 | 別の番号列での追跡 | `if-candidates-1` → `choose-candidate-1` → `execution-dig-1` |
| `large-board-dig-count` | 選択 | フェーズ7の J3 と同じ完成した11×11、正解「24回」（部屋25個 − 1） | 大きな盤面への一般化 | `execution-complete` → `return-grid` |
| `whole-code-order` | Parsons | 参照コード22行すべて、正解は元の行順（順序自由な行なし） | コード全体の流れ | フェーズ4の全フレーム |

- Q1の場面・正解は検証済みトレースの6回目の掘削から導き、回答対象はフェーズ3と同じく、アルゴリズムが実際に集める候補（2マス先が盤内でまだ壁のままの部屋）に限る。方向はフェーズ3と同じく問題文の中で提示する（基準データ §6-6）。性質・理由の場面はフェーズ2の盤面を参照のまま使い、壁を複製しない。
- `transfer-final-dig` は選択形式である。再開マス (3, 5) から掘れる候補は (5, 5) の1つだけで、タップ形式ではタップできるマスがそのまま答えになってしまうため、座標の選択肢で問う形にした。
- 未見の番号列と大きな盤面の盤面データは `mazeDiggingMaze.ts` の正本（フェーズ7の判定用テスト J2・J3 と同じ定数）から組み立てる。フェーズ7側も同じ定数を参照する。
- 復習先はすべてフェーズ4の基本例で、新しい盤面の答え合わせアニメーションは作らない（教材指針フェーズ6の割り切り仕様）。理由問題の復習は、候補が空と判定して `stack.pop()` で戻る一連のフレームで、戻り切った時点のチェックポイントが `pop-stack` 行に対応する。
- Parsons盤面はBFSと共通の `ParsonsBoard` を流用する。対象コードはフェーズ4の `mazeDiggingCode`（契約 maze-digging-v1）への参照で、本文・インデント・意味IDを変更しない。基準データ §3 のとおり行の順序はすべて意味を持つため、棒倒し法のような順序自由な行は設けない。
- 進行・診断は共通エンジン（`../../assessment/assessment.ts`）の diagnostic-check: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても完了できる（ソフトゲート）。診断は初回回答だけから導き、正解した設問は入力を固定する。
- 結果画面は初回正解スコアと論点ごとの結果（`ResultTagRow`）を示し、届かなかった論点からは該当設問の復習を開ける。結果全体への過度な到達感表現は使わない。

ファイル:

- `consolidation.content.ts`: 設問・場面・選択肢・正解・タグ・操作指示・正誤文・復習先・完了文と、読み込み時の検証（`validateMazeDiggingConsolidation`）。
- `consolidation.types.ts`: 共通 diagnostic-check 形式へ場面の盤面と解説文を足した設問型・コンテンツ型と、単元接続用の要約型。
- `MazeDiggingConsolidationPreview.tsx`: 診断型のアセスメント画面。embedded / onComplete（要約通知）/ onNext（診断画面から次へ進む導線）を持つ。盤面の表示とタップ回答はフェーズ3の `MazeDiggingCheckCanvas` を流用する。

検証: `npm run verify:maze-digging-consolidation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
