# 二分探索 単元フロー（Issue #294）

- 目的: 単品ページで確認済みの二分探索フェーズ1〜7を、1つの単元として通して学習できるよう接続する。
- 適用範囲: 単元内のフェーズ遷移、リザルト画面、単元内ナビゲーション、アプリへの登録（unitRegistry / LearningScreen）とフィードバック接続（#202）。状態: 現行。最終確認日: 2026-11-07。
- 正本: [Issue #294](https://github.com/BeppuKanato/engineer-quest/issues/294)、[二分探索単元 基準データ](../../../../../../../docs/concept/binary-search-unit-baseline.md)、[教材指針の遷移モデル](../../../../../../../docs/concept/learning-materials-guideline.md)、[フィードバックの学習フロー接続](../../../../../../../docs/feedback-learning-flow-202.md)

## 操作

`front/` で `npm ci` → `npm run dev`。起動したマシンで `http://localhost:3000/learning-preview/binary-search-unit` を開く。ログイン・バックエンド・DB は不要。各フェーズの単品ページ（`binary-search-motivation` など）も従来どおり開ける。アプリ内ではコース `course-algorithm-binary-search-v1`（既存シード）の学習画面から開く。

## 構成

- `BinarySearchUnitPreview.tsx`: 単元の状態機械（現在の画面、到達した最先フェーズ、フェーズ別の到達状況）と単元ナビゲーション。状態機械と遷移の仕組みは BFS の `BfsUnitPreview` と同一で、フェーズの実体と単元定義だけが異なる。
- `unit.content.ts`: フェーズの並びと遷移類型（bridge / result / result-in-phase / final）、ブリッジ文、リザルト画面の文言、カードのレアリティ（基準データ §5）。
- `UnitResultScreens.tsx`: フェーズ3・5の後のリザルト画面と、単元完了時の最終リザルト。BFS 版が BFS の到達図とフェーズ7文言に結び付いているため、二分探索側に同形のものを置く。
- `BinarySearchResultFigure.tsx`: リザルト画面の到達図。主教材（[3, 7, 12, 19, 25, 31, 42] から 25 を探す）の実行記録から導出した、発見セル（インデックス4）を確定表示した盤面を描く。
- `unit.types.ts`: 各フェーズから受け取る到達状況の型（型だけの共有。形は BFS の BfsUnitPhaseSummary と同一の契約）。

ブリッジ画面（`PhaseBridgeScreen`）と結果画面のお祝い（`UnitResultCelebration`）は、単元固有の内容を持たないため BFS 側の部品をそのまま使う（ブリッジ画面が参照する総フェーズ数は両単元とも7で一致する）。

## 接続の仕組み

- 各フェーズの単品プレビューは、任意 props（`embedded`、`onComplete`、必要に応じて `onNext` / `nextLabel`）で単元に埋め込める。未指定なら単品ページとして従来どおり動く。
- プレビュー登録は他単元と同じ `[contentId]` 方式に統一した。フェーズ1（#286）で作った専用ページ `learning-preview/binary-search-unit/page.tsx` は本 Issue で削除し、`binary-search-unit` と `binary-search-motivation` を `[contentId]` へ登録した（二重管理の解消）。
- 遷移は BFS 単元と同じ統一モデル：前進はすべてブリッジを挟み、フェーズ3・5の後は単元リザルト（事実のみ）を経てブリッジ、フェーズ6は内の結果からブリッジ、フェーズ7の後は最終リザルト。
- アプリは `unitRegistry` に登録された単元を `LearningScreen` が `kind` で出し分け、初期フェーズ・到達範囲・完了一覧・summary・下書き・完了保存・学習ログを BFS と同じ経路で接続する。
- フィードバック（#202）は BFS と同じ配線：確認フェーズ（3・5・6）の完了保存後に先行生成を依頼し、フェーズ3・5のリザルト画面と単元最終結果に差し込み口を持つ。実験割当のない利用者には何も表示されない（部品側の 404 / 409 契約）。
- 一度開いたフェーズはマウントしたまま隠すため、戻っても再生位置・回答・書いたコードが残る。単元ナビゲーションでは到達済みのフェーズまで自由に戻れる。

## 対象外

知識カード・実績のシード追加は Issue #295 で扱う。コースシード（`course-algorithm-binary-search-v1`）は既存のため、本モジュールの登録で単元一覧・学習画面に現れる。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
