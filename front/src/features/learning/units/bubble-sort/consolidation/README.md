# バブルソート「応用問題」

- 目的・適用範囲: Issue #232の4問（転移タップ・選択2問・Parsons）を、初回結果の診断と任意復習まで単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [バブルソート基準データ§3](../../../../../../docs/concept/bubble-sort-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/bubble-sort-phase6-232.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/bubble-sort-consolidation を開く。認証・DBは不要。

| 設問 | 形式 | 場面・正解 | 論点タグ | 復習フレーム（フェーズ4） |
| --- | --- | --- | --- | --- |
| `next-swap-pair` | 配列タップ | 転移用 [3, 1, 4, 2] の1周目を終えた状態 [1, 3, 2, 4]（右端の4は確定）、正解は位置1（ペア (3, 2)） | 交換が起きるペアの追跡 | `for-compare-2-0` → `execution-compare-2-0` → `for-compare-2-1` → `execution-compare-2-1` |
| `sorted-array-behavior` | 選択 | 並び済み [1, 2, 3, 4] の開始状態、正解「交換は一度も起きないが、比べることは範囲が尽きるまで行われる」 | 並び済みの配列の扱い | `execution-compare-4-0` → `execution-pass-end-4` → `execution-complete` |
| `why-right-end-fixed` | 選択 | フェーズ2の `pass-end-1`（5が右端に確定）、正解「比べるたびに大きい方が右へ移るので、1周すると一番大きい値が右端に届くため」 | 右端が決まる理由 | `execution-compare-1-2` → `execution-compare-1-3` → `execution-pass-end-1` |
| `whole-code-order` | Parsons | 参照コード8行すべて、正解は元の行順（順序自由な行なし） | コード全体の流れ | フェーズ4の全39フレーム |

- Q1の場面・正解は転移用の実行記録（`bubbleSortComparisons`）から導き、回答対象はフェーズ3の問1と同じく、場面の未確定範囲のマスに限る。Q3の場面はフェーズ2の盤面を参照のまま使い、配列を複製しない。Q2の場面は対象配列の開始状態を組み立てる。
- 復習先はすべてフェーズ4の基本例で、新しい配列の答え合わせアニメーションは作らない（教材指針フェーズ6の割り切り仕様）。
- Parsons盤面はBFSと共通の `ParsonsBoard`。対象コードはフェーズ4の `bubbleSortCode`（契約 bubble-sort-v1）への参照で、本文・インデント・意味IDを変更しない。バブルソートの8行はすべて順序が意味を持つため、棒倒し法フェーズ6のような順序自由な行は設けない。
- 進行・診断は共通エンジン（`../../assessment/assessment.ts`）の diagnostic-check: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても完了できる（ソフトゲート）。診断は初回回答だけから導き、正解した設問は入力を固定する。
- 結果画面は初回正解スコアと論点ごとの結果（`ResultTagRow`）を示し、届かなかった論点からは該当設問の復習を開ける。結果全体への過度な到達感表現は使わない。

ファイル:

- `consolidation.content.ts`: 設問・場面・選択肢・正解・タグ・操作指示・正誤文・復習先・完了文と、読み込み時の検証（`validateBubbleSortConsolidation`）。
- `consolidation.types.ts`: 共通 diagnostic-check 形式へ場面の配列と解説文を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BubbleSortConsolidationPreview.tsx`: 診断型のアセスメント画面。embedded / onComplete（要約通知）/ onNext（診断画面から次へ進む導線）を持つ。盤面の表示とタップ回答はフェーズ3の `BubbleSortCheckCanvas` を流用する。

検証: `npm run verify:bubble-sort-consolidation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
