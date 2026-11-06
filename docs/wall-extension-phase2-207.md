# 棒倒し法 フェーズ2（動きの説明）（Issue #207）

目的: 棒倒し法単元のフェーズ2を、#206 のグリッド描画基盤の上に13ステップの完全スナップショットとして実装する。設計は基準データ（docs/concept/wall-extension-unit-baseline.md §1・§3、正本は未マージのため承認済み原本に従う）に従う。最終確認日: 2026-11-06。本 PR は feat/wall-extension-phase1-206（PR #217）の上に積むスタック PR である。

## 実装内容

- `front/src/features/learning/wall-extension/execution/` に content / types / Canvas / Preview / README.md を新設（構成は BFS フェーズ2と #206 フェーズ1に合わせた）。
  - `execution.types.ts`: Canvas 型は共通グリッド基盤の `MazeGridCanvasState` をそのまま使う。検証は基盤の `validateMazeGridCanvas` に「highlight は壁マスであること」「target は使わないこと」を足す（既存の検証は弱めていない）。
  - `execution.content.ts`: 盤面はすべて `wallExtensionMaze.ts` の組み立て（外周＋柱＋伸長）から作り、手書きの壁リストはない。
  - `WallExtensionExecutionCanvas.tsx`: 描画は共通グリッド基盤へ委譲する。
  - `WallExtensionExecutionPreview.tsx`: 単品入口。接続・保存・学習ログのポートは持たない。
- ステップ列（13ステップ、全スナップショット、キャプションは各1文）:
  - ステップ1 `empty-board` 空の 9×9 盤面。
  - ステップ2 `border-walls` 外周を壁で囲む（壁32）。
  - ステップ3 `pillars` 2マスおきに柱9本（壁41）。
  - ステップ4〜12 伸長9件。ステップIDは `extend-<柱のx>-<柱のy>`（例: `extend-2-4`）。各ステップは伸ばした後の状態で、processing に処理した柱、highlights に今回壁になったマスを置き、壁は前ステップからちょうど1マスだけ増える。キャプションは基準データの位置＋方向の一文で、4件目（(2,4)、真ん中の段の最初の柱）で「上には伸ばさず」の規則に触れる。
  - ステップ13 `complete` 完成（壁50）。「迷路が完成し、すべてのマスがつながりました。」
- 基盤への追加（最小限）: `player/MazeGridDrawing.tsx` の highlight 描画で、壁マスはフォーカス青の実線の枠にする（今回壁になったマスの表現）。通路マスの破線リングは変えていない。検証用に `data-maze-highlight` 属性を付けた。フェーズ1のスナップショットは highlights を使っていないため、フェーズ1の描画は変わらない。
- 単品プレビュー: `/learning-preview/wall-extension-execution`（フェーズ1と同じ登録方法）。

## 検証

- `npm run verify:wall-extension-execution`（新規）: 契約 wall-extension-v1 を検証スクリプト内で独立に再実装し、基準データ §1 のトレース表（柱・方向・壁になるマス）と教材の伸長が一致すること、伸長ごとに壁がちょうど1マス増えること、processing と highlight がトレース表と一致すること、最終ステップが検証済みの完成迷路（壁50）と一致し完全迷路であること、実描画の壁数と highlight 枠（実線）を確認。フェーズ2検証の負系（壁でないマスの highlight、target の使用）も確認する。
- 回帰: `verify:wall-extension-motivation` / `verify:bfs-execution` 通過。front の `lint`（警告1件は既存 BfsUnitPreview の無関係なもの）/ `typecheck` / `build` 通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- highlight 描画の前提: MazeGridDrawing には #206 の時点で汎用の highlight 描画（破線リング）が既にあった。本 PR の作業範囲は「壁マスの highlight はフォーカス青の枠で描く」だったため、壁マスについてのみ実線の枠へ差別化した。壁マス以外を実線へ寄せるかどうかは、通路マスに highlight を使うフェーズ（フェーズ3以降）で判断する。
- キャプションの句点: 作業指示のキャプション文は句点なしで示されていたが、既存教材（BFS / DFS / 本単元フェーズ1）の全キャプションが文末に「。」を持つ体裁に合わせ、各キャプションに「。」を付けた。文意の変更はない。
- 最終キャプション: 基準データ §3 は最終ステップで「どのマスからどのマスへも必ずたどり着ける」ことを示すとしているが、作業指示で指定されたキャプション「迷路が完成し、すべてのマスがつながりました」を採用した（AGENTS.md §4 の優先順位で、現在の指示が正本より優先）。
