# 貪欲法（硬貨問題）「応用問題」

- 目的・適用範囲: Issue #386の4問（転移タップ・反例トレース・反例の理解・フェード型 Parsons）を、初回結果の診断と任意復習まで単品で操作する。状態: 現行。最終確認日: 2026-11-11。
- 正本: [貪欲法（硬貨問題）基準データ§3](../../../../../../docs/concept/greedy-coins-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/greedy-coins-phase6-386.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/greedy-coins-consolidation を開く。認証・DBは不要。

| 設問 | 形式 | 場面・正解 | 論点タグ | 復習フレーム（フェーズ4） |
| --- | --- | --- | --- | --- |
| `next-coin-transfer` | 額面タップ | 転移342円で100を3枚使ったところ（トレイ [100, 100, 100]、残額42）、正解は10 | 新しい金額での次に選ぶ硬貨 | `while-remaining-7` → `for-coin-10` → `while-remaining-8` → `execution-select-5` |
| `counterexample-greedy-result` | 選択 | 反例 [4, 3, 1]・6円の開始場面、正解「[4, 1, 1] の3枚になる」 | 別の額面での貪欲な払い方 | `for-coin-500` → `while-remaining-1` → `execution-select-1` |
| `counterexample-why-greedy-loses` | 選択 | 反例を貪欲で払い終えた場面（トレイ [4, 1, 1]、残額0）、正解「一番少ないのは [3, 3] の2枚。最初に一番大きい4を選ぶと、残り2を1の硬貨で埋めるしかなくなるから」 | 貪欲が最適にならない理由 | `while-remaining-1` → `execution-select-1` → `subtract-coin-1` |
| `whole-code-order` | Parsons | 参照コード8行、固定2行（def / return）・可動6行・1セグメント、互換グループあり（下記） | コード全体の流れ | フェーズ4の全44フレーム |

- Q1の場面・正解は転移用の実行記録（`greedyCoinsSelections`）から導く（100×3の次の選択＝10、選ぶ直前の残額42）。回答対象はフェーズ3と同じく全額面。
- 場面は単元盤面型（`GreedyCoinsExecutionCanvasState`）で組み立て、盤面検証を通す。表示とタップ回答はフェーズ3の `GreedyCoinsCheckCanvas` を再利用する（描画はフェーズ2と同じ硬貨図）。
- Parsons は参照コード（契約 greedy-coins-v1、8行）への参照で、本文・インデント・意味IDを変更しない。固定行は `define-function` と `return-result` の2行で、可動6行は固定行に挟まれた1セグメント。
- **互換グループの判断**: 6行目 `result.append(coin)` と7行目 `remaining -= coin` は入れ替えても動作が変わらない（記録は `coin` のみ、更新は `remaining` のみに依存する）。共通基盤の `interchangeableLineGroups` は、正解順で隣接する行のグループを正規化して判定する仕組みでこの2行をそのまま扱えるため、互換グループとして実装した。固定行には含めない（検証でも禁止されている）。
- 復習先はすべてフェーズ4の基本例で、新しい金額や別額面の答え合わせアニメーションは作らない（教材指針フェーズ6の割り切り仕様）。
- 進行・診断は共通エンジン（`../../assessment/assessment.ts`）の diagnostic-check: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても完了できる（ソフトゲート）。診断は初回回答だけから導き、正解した設問は入力を固定する。
- 結果画面は初回正解スコアと論点ごとの結果（`ResultTagRow`）を示し、届かなかった論点からは該当設問の復習を開ける。結果全体への過度な到達感表現は使わない。

ファイル:

- `consolidation.content.ts`: 設問・場面・選択肢・正解・タグ・操作指示・正誤文・復習先・完了文と、読み込み時の検証（`validateGreedyCoinsConsolidation`）。
- `consolidation.types.ts`: 共通 diagnostic-check 形式へ場面の盤面と解説文を足した設問型・コンテンツ型と、単元接続用の要約型。
- `GreedyCoinsConsolidationPreview.tsx`: 診断型のアセスメント画面。embedded / onComplete（要約通知）/ onNext（診断画面から次へ進む導線）を持つ。盤面の表示とタップ回答はフェーズ3の `GreedyCoinsCheckCanvas` を再利用する。

検証: `npm run verify:greedy-coins-consolidation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
