# 棒倒し法「応用問題」

- 目的・適用範囲: Issue #211の4問（転移タップ・選択2問・Parsons）を、初回結果の診断と任意復習まで単品で操作する。状態: 現行。最終確認日: 2026-11-06。
- 正本: [棒倒し法基準データ§3](../../../../../../docs/concept/wall-extension-unit-baseline.md)、[教材指針](../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../docs/wall-extension-phase6-211.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/wall-extension-consolidation を開く。認証・DBは不要。

| 設問 | 形式 | 場面・正解 | 論点タグ | 復習フレーム（フェーズ4） |
| --- | --- | --- | --- | --- |
| `transfer-wall-target` | グリッドタップ | 7×7の途中状態（2本目まで伸長）、柱 (2,4) から右、正解 (3,4) | 壁が伸びる先の追跡 | `for-extension-4-4` → `lookup-delta-4-4` → `execution-extend-4-4` |
| `completed-maze-properties` | 選択 | 完成した9×9、正解「すべての通路がつながっていて、輪がない」 | 完成した迷路の性質 | `execution-complete` → `return-grid` |
| `no-upward-extension` | 選択 | 柱 (2,4) を処理した9×9、正解「上に伸ばすと輪ができることがあるため」 | 上に伸ばせない理由 | `if-first-row-2-4` → `else-branch-2-4` → `allowed-three-2-4` |
| `whole-code-order` | Parsons | 参照コード21行すべて、正解は元の行順（外周の書き込み4行は順序自由） | コード全体の流れ | フェーズ4の全137フレーム |

- Q1の場面・正解は検証済みトレースの3本目から導き、回答対象はフェーズ3の問2と同じく、処理する柱に隣接する未壁マスに限る。Q2・Q3の場面はフェーズ2の盤面を参照のまま使い、壁を複製しない。
- 復習先はすべてフェーズ4の基本例で、新しい盤面の答え合わせアニメーションは作らない（教材指針フェーズ6の割り切り仕様）。Q3の復習は `y == 2` の条件分岐のフレーム列で、else のフレームが「上に伸ばすと輪ができることがある」理由をそのまま説明する。
- Parsons盤面はBFSと共通の `ParsonsBoard`（行の意味IDと本文だけを使う構造型へ汎用化して流用）。対象コードはフェーズ4の `wallExtensionCode`（契約 wall-extension-v1）への参照で、本文・インデント・意味IDを変更しない。外周の4つの書き込みは互いに独立なため、ブロック内の並べ替えだけを正解として許す。
- 進行・診断は共通エンジン（`../../assessment/assessment.ts`）の diagnostic-check: 回答では進まず、「次の問題へ／結果を見る」で進む。正解していなくても完了できる（ソフトゲート）。診断は初回回答だけから導き、正解した設問は入力を固定する。
- 結果画面は初回正解スコアと論点ごとの結果（`ResultTagRow`）を示し、届かなかった論点からは該当設問の復習を開ける。結果全体への過度な到達感表現は使わない。

ファイル:

- `consolidation.content.ts`: 設問・場面・選択肢・正解・タグ・操作指示・正誤文・復習先・完了文と、読み込み時の検証（`validateWallExtensionConsolidation`）。
- `consolidation.types.ts`: 共通 diagnostic-check 形式へ場面の盤面と解説文を足した設問型・コンテンツ型と、単元接続用の要約型。
- `WallExtensionConsolidationPreview.tsx`: 診断型のアセスメント画面。embedded / onComplete（要約通知）/ onNext（診断画面から次へ進む導線）を持つ。盤面の表示とタップ回答はフェーズ3の `WallExtensionCheckCanvas` を流用する。

検証: `npm run verify:wall-extension-consolidation`。単元フローへの接続・進捗保存は後続Issueの対象で、このモジュールは保存処理を持たない。
