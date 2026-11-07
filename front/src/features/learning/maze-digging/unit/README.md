# 穴掘り法 単元フロー（Issue #265）

- 目的: 単品ページで確認済みの穴掘り法フェーズ1〜7を、1つの単元として通して学習できるよう接続する。
- 適用範囲: 単元内のフェーズ遷移、リザルト画面、単元内ナビゲーション、アプリへの登録（unitRegistry / LearningScreen）とフィードバック接続（#202）。状態: 現行。最終確認日: 2026-11-07。
- 正本: [Issue #265](https://github.com/BeppuKanato/engineer-quest/issues/265)、[穴掘り法単元 基準データ](../../../../../../docs/concept/maze-digging-unit-baseline.md)、[教材指針の遷移モデル](../../../../../../docs/concept/learning-materials-guideline.md)、[フィードバックの学習フロー接続](../../../../../../docs/feedback-learning-flow-202.md)

## 操作

`front/` で `npm ci` → `npm run dev`。起動したマシンで `http://localhost:3000/learning-preview/maze-digging-unit` を開く。ログイン・バックエンド・DB は不要。各フェーズの単品ページ（`maze-digging-motivation` など）も従来どおり開ける。アプリ内ではコース `course-algorithm-maze-digging-v1` の学習画面から開く（コースシード自体は Issue #266 で追加する）。

## 構成

- `MazeDiggingUnitPreview.tsx`: 単元の状態機械（現在の画面、到達した最先フェーズ、フェーズ別の到達状況）と単元ナビゲーション。状態機械と遷移の仕組みは BFS の `BfsUnitPreview` と同一で、フェーズの実体と単元定義だけが異なる。
- `unit.content.ts`: フェーズの並びと遷移類型（bridge / result / result-in-phase / final）、ブリッジ文、リザルト画面の文言、カードのレアリティ（基準データ §5）。
- `UnitResultScreens.tsx`: フェーズ3・5の後のリザルト画面と、単元完了時の最終リザルト。BFS 版が BFS の到達図とフェーズ7文言に結び付いているため、穴掘り法側に同形のものを置く。
- `MazeDiggingResultFigure.tsx`: リザルト画面の到達図。完成した主教材（9×9）の迷路を、正本の choices から参照手続きで導出した壁とフェーズ1の一本道で描く。盤面の検証は単元側の検証器（`validateMazeDiggingCanvas`）で行う。
- `unit.types.ts`: 各フェーズから受け取る到達状況の型（型だけの共有。形は BFS の BfsUnitPhaseSummary と同一の契約）。

ブリッジ画面（`PhaseBridgeScreen`）と結果画面のお祝い（`UnitResultCelebration`）は、単元固有の内容を持たないため BFS 側の部品をそのまま使う（ブリッジ画面が参照する総フェーズ数は両単元とも7で一致する）。

## 接続の仕組み

- 各フェーズの単品プレビューは、任意 props（`embedded`、`onComplete`、必要に応じて `onNext` / `nextLabel`）で単元に埋め込める。未指定なら単品ページとして従来どおり動く。フェーズ1・2・4のポートは各フェーズの実装時に用意済みだったものをそのまま使う（棒倒し法では接続 Issue で追加した）。
- 遷移は BFS 単元と同じ統一モデル：前進はすべてブリッジを挟み、フェーズ3・5の後は単元リザルト（事実のみ）を経てブリッジ、フェーズ6は内の結果からブリッジ、フェーズ7の後は最終リザルト。
- アプリは `unitRegistry` に登録された単元を `LearningScreen` が `kind` で出し分け、初期フェーズ・到達範囲・完了一覧・summary・下書き・完了保存・学習ログを BFS と同じ経路で接続する。
- フィードバック（#202）は BFS と同じ配線：確認フェーズ（3・5・6）の完了保存後に先行生成を依頼し、フェーズ3・5のリザルト画面と単元最終結果に差し込み口を持つ。実験割当のない利用者には何も表示されない（部品側の 404 / 409 契約）。
- 一度開いたフェーズはマウントしたまま隠すため、戻っても再生位置・回答・書いたコードが残る。単元ナビゲーションでは到達済みのフェーズまで自由に戻れる。

## 対象外

コースシード・知識カード・実績のシード追加と単元一覧への表示は Issue #266 で扱う。本モジュールの登録だけでは、コース一覧に穴掘り法は現れない。
