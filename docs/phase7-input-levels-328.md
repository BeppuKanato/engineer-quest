# フェーズ7 入力量レベル（書き方の選択）の導入（PR 1：仕組み＋穴掘り法）

目的: Issue #328（2026-11-09 ユーザー決定）に基づき、フェーズ7で書き始める前に「入力量レベル」を3段階から選べる仕組みを導入し、モデル単元として穴掘り法に適用した経緯と検証を記録する。残り単元（BFS・バブルソート・棒倒し法・二分探索）への展開は後続 PR（PR 2）で行う。
最終確認日: 2026-11-09

## 決定と設計

- レベルは3段階。変わるのは初期テンプレートだけで、テストと完了条件はレベルによらず同一。デフォルトは「全部書く」。
  - `full`（全部書く）: 従来の最小テンプレート。
  - `skeleton`（骨格から書く）: 制御構造と初期化の骨格を残し、本体の行をプレースホルダにする。
  - `fill-in`（穴埋めで書く）: 正解コードのほとんどの行を残し、要点の行だけをプレースホルダにする。
- プレースホルダは、その行のインデントを保った `raise NotImplementedError  # ここを書く：<書くべき内容>` の行とする。残したままでは必ずテストに失敗する。
- テンプレートは正解コード（契約コード）の行から組み立てる。残す行は正解コードの行そのものを使い、検証で「プレースホルダを正解行に戻すと正解コードと完全一致する」ことを機械確認する。
- 下書きはレベル別に保存する（`full` は従来の下書きキーをそのまま使い、既存の下書きを引き継ぐ）。レベルを切り替えても別レベルの下書きは壊れない。
- ガイドライン（`docs/concept/learning-materials-guideline.md`）に 7-4「入力量レベル」を repo 先行で記録した。Drive 側への反映は別途行う。

## 実装（共通の仕組み）

- `front/src/features/learning/implementation/inputLevel.ts`: レベル型・文言・プレースホルダ規約・レベル別下書きキーの共通定義。
- `front/src/features/learning/implementation/useImplementationInputLevel.ts`: レベル状態・レベル別下書きの読み書き・切り替え時の読み込みを行うフック。
- `front/src/features/learning/implementation/ImplementationLevelSelector.tsx`: 全単元共通のセレクタ（トグルボタン＋説明文）。
- `LearningScreen` は単元プレビューへ下書き基底キー（`codeDraftBaseKey`）と下書きエラー通知を渡す。レベル未対応の単元は従来どおり `initialCode` / `onCodeChange` で動き、影響を受けない。
- 穴掘り法: `implementation.content.ts` にレベル別テンプレート（`templates`）を追加し、`MazeDiggingImplementationPreview` がフックとセレクタを使う形に変更。全通過後はセレクタを隠す。

## ログの形

学習ログ（LearningEvent、既存の payload 規約の範囲内。DB スキーマ変更なし）:

- レベル切り替え: `implementation_level_select`（payload: `level`, `previousLevel`）
- 実行系イベント（`implementation_run` / `implementation_test_result`）: payload に `level` を追加
- 完了: `implementation_complete` の payload に `level` を追加。あわせてフェーズ7の完了サマリ（`MazeDiggingImplementationSummary.inputLevel` / 単元サマリの `inputLevel`）にも完了時点のレベルを残す。

## プレースホルダ数（穴掘り法）

- 骨格から書く: 13行（開始マスを掘る／スタック初期化／step 初期化／現在の部屋／候補リスト初期化／2マス先の計算／候補追加／候補の選択／step を進める／間の壁を掘る／部屋を掘る／スタックに積む／スタックから戻る）
- 穴埋めで書く: 4行（2マス先の計算／掘れる条件と候補追加／候補の選択／間の壁を掘る）

## 検証

- `verify:maze-digging-implementation` を拡張: レベル別テンプレートの構成、プレースホルダ数、未記入テンプレート（骨格・穴埋め）が全テストに失敗すること、正解行を入れたテンプレートが全テストに通過すること、レベル別下書きキー、セレクタの描画、プレビュー／単元／アプリ側の接続を検証。
- 他単元の implementation / unit 検証を含む関連 verify はすべて通過。front の型チェック・build も通過。
- 実機での目視確認（セレクタの見え方、切り替え時の体感）は未実施。
