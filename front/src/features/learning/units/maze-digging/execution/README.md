# 穴掘り法「動きの説明」

- 目的・適用範囲: Issue #258の21ステップを単品で操作する。状態: 現行。最終確認日: 2026-11-07。Issue #334で完成の後に説明専用ステップ2つ（輪ができない理由・仮定盤面の実演）を追加し、現在は全23ステップ（うちコード対応21）。
- 正本: [穴掘り法基準データ§3](../../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI定義](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装・検証・指針との留保: [実施記録](../../../../../../../docs/maze-digging-phase2-258.md)。

`front`で`npm run dev`を実行して http://localhost:3000/learning-preview/maze-digging-execution を開く。認証・DBは不要。

再生・一時停止・前後・スライダー・←／→／Home／Endで確認する。9×9主教材の生成過程（全部が壁→スタートの部屋→掘削15回（間にバックトラック3回）→完成）を、検証済みトレース（choices [0,1,0,1,0,0,0,1,0,1,1,0,0,0,0]）で再生する。段階名は「動きの説明」。掘削ステップでは掘った部屋を青く塗り、今回掘れた2マス（間の壁＋部屋）をフォーカス青の破線の枠で示し、スタックの経路を線で重ねる。バックトラックは複数マスの戻りを1ステップに圧縮し、経路が短くなって現在位置が再開マスへ移ることで表す。

- `execution.content.ts`: キャプション・完全スナップショット。盤面は `../mazeDiggingMaze.ts` の組み立て（参照コードの実行と、掘削列からのバックトラック導出）で作り、手書きしない。
- `execution.types.ts`: 共通グリッド型をそのまま使い、検証は単元側の `validateMazeDiggingCanvas` に「highlight は掘ったばかりのマスであること」「target を使わないこと」を足す。
- `MazeDiggingExecutionCanvas.tsx`: 共通グリッド描画への委譲。
- `MazeDiggingExecutionPreview.tsx`: 共通LearningPlayerへの入口。単元フロー（接続 Issue）向けに任意の接続ポート（embedded / onLearningEvent / active / onComplete / nextLabel）を持ち、未指定なら単品ページとして動く。onComplete 指定時は共通プレイヤーの endAction で次へ進む。

検証: `npm run verify:maze-digging-execution`。グリッドの型・描画は`player/mazeGrid.types.ts`・`player/MazeGridDrawing.tsx`を共有し、状態の意味（processing = 現在の部屋、target = まだ壁の部屋）は棒倒し法と逆のため、検証は単元側の `../mazeDiggingCanvas.ts` で行う。フェーズ3はステップIDと canvas をそのまま問いの図に参照できる（例: `dig-3` は掘削3回目まで進んだ状態で、フェーズ3の場面になる）。フェーズ4は同じトレースへコード対応を付加する。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
