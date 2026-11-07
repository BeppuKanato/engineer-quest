# 穴掘り法 フェーズ5（コードの確認問題）（Issue #261）

目的: 穴掘り法単元のフェーズ5を、基準データ §3 の独立2問（コード空欄補充）として実装する。設計は基準データ（docs/concept/maze-digging-unit-baseline.md §2・§3、正本は基準データ取り込み PR #267 で別途進行中のため、本実装はその承認済み原本に従う）に従う。最終確認日: 2026-11-07。本 PR は feat/maze-digging-phase4-260（PR #271）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/maze-digging/code-check/` に types / content / Preview / README.md を新設（構成は棒倒し法フェーズ5と同型）。
  - 対象コードはフェーズ4と同じ参照コード（契約 maze-digging-v1、22行）への直接参照で、複製しない。
  - Q1 `next-room-distance`: 11行目 `compute-next`（`nx, ny = x + 2 * dx, y + 2 * dy`）の倍率。選択肢 1 / 2 / 3、正解 2。復習は `for-direction-1-2` → `compute-next-1-2`（最初の掘削で右方向を計算するフレーム）。
  - Q2 `undug-room-condition`: 12行目 `if-diggable` の `grid[ny][nx] == 1` の条件値。選択肢 0 / 1 / 2、正解 1。復習は `compute-next-1-2` → `if-diggable-1-2`。
  - 両問とも `requires: null` の独立設問。状態変化の行（座標計算）と条件の行（未掘削判定）の組み合わせで、教材指針フェーズ5節の型どおり。選択肢はいずれも文法的に正しい数値のみで、文法細部は空欄にしていない。
  - 空欄位置は文脈で一意化する `blankWithin` で求める（対象数値が行内の他所にも現れるため）。正解を入れた行は元の行とバイト単位で一致することを読み込み時検証と verify の両方で固定する。
  - 進行・採点は共通エンジンの現行統一仕様（回答では進まない／正解でロック／ソフトゲート／結果は初回回答のみ）。誤答時はフェーズ4フレームの復習モーダルを開ける。Preview は単元フロー向けに embedded / onComplete の接続ポートを持ち、未指定なら単品ページとして動く。
- 単品プレビュー: `/learning-preview/maze-digging-code-check`。

## 検証

- `npm run verify:maze-digging-code-check`（新規）: 基準 §3 の確定事項（対象行・選択肢・正解・復習フレーム）、正解でのバイト一致、全6候補を埋めたコードの Python 構文確認、共通エンジン上の進行（誤答→再回答→正解・ソフトゲート・初回のみ集計・問同士の独立性）、CodeDisplay の実描画（空欄は対象行だけ・正解の漏れなし）、検証器の負系を確認する。
- 回帰: front の verify 全45件（新規1件を含む）が通過。`lint`（警告2件は既存の BfsUnitPreview / WallExtensionUnitPreview のもので本変更と無関係）/ `typecheck` / `build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- Q1の空欄は dx 側の「2」だけにした。基準データ §3 は `nx, ny = x + □ * dx, y + □ * dy` と両方の倍率を空欄として示すが、共通の code-blank 形式（BFS・棒倒し法・バブルソートと共有）は1問1空欄しか表現できない。読み順で先の dx 側を空欄とし、dy 側の「2」は表示したままにした。両方とも同じ値で決まることはフィードバック文（「進む量は方向の2倍」）で補っている。両空欄を同時に問う形が要る場合は、共通形式側に複数空欄の拡張が別途必要になる。
- 基準データ正本（docs/concept/maze-digging-unit-baseline.md）は PR #267 のブランチにあり、本 PR のツリーにはまだ無い。マージ順によっては README からのリンクが一時的に解決しない（フェーズ1〜4と同じ留保）。
