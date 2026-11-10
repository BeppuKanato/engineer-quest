# 二分探索 フェーズ7（自分で実装）（Issue #292）

目的: 二分探索単元のフェーズ7（自分で実装）を、基準データ §2 の契約 `binary-search-v1` と §3 フェーズ7の設計（テンプレート、表示用 D1＋判定用 J1〜J3、ヒント4段階ラダー）として実装する。構成は他単元フェーズ7（バブルソート #233、穴掘り法）の型に従う。最終確認日: 2026-11-07。

## 実装

- `front/src/features/learning/binary-search/implementation/implementation.content.ts`: 課題文、テンプレート（関数定義＋契約 docstring＋`pass`）、4テスト、ヒント、表示文言。
  - テストは基準データ §3 フェーズ7どおり。期待する位置は実行記録の正本（`runBinarySearch`）から導く。
    - D1（表示用）: 主教材 [3, 7, 12, 19, 25, 31, 42] で 25 → 4
    - J1（判定用）: 主教材（25 → 4）
    - J2（判定用）: 転移 [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] で 23 → 5
    - J3（判定用）: 不在（主教材で 20 → -1）
  - ヒント: L1 使う部品（lo / hi / mid の説明＋挿入トークン）、L2 処理の流れ（番号付きフロー＋ループ枠）、L3 条件とループの骨格（参照コードの `while-range`／`if-hit`／`elif-smaller`／`else-larger` の4行を原文表示）、L4 Parsons 練習盤（フェーズ6の設問を `ParsonsBoard` で採点なし表示）。
- `implementation.ts`: テスト実行（1件ずつ、例外後も続行、判定用の値・例外は画面状態へ渡さない）、エラー種別（syntax / runtime / timeout / mismatch）の分類、ヒント利用回数の記録（順序解放の契約は先行フェーズ7と同じ）、位置の値判定と描画用 Canvas 変換、単元接続用の要約型 `BinarySearchImplementationSummary`。
- `BinarySearchImplementationPreview.tsx`: エディタ（ライトテーマ、フォーカス色2px枠、「Pythonコード」見出し）、テスト／コンソールのタブ切替、ヒント導線、全テスト通過時の完了表示（紙吹雪＋大きな描画チェック）。完了条件は全テスト合格のハードゲートで、通過した瞬間だけ単元フローへ要約を通知する。試しに実行（自由実行コンソール）も他単元と同じく付けた。
- `ImplementationResults.tsx` / `IndexOutput.tsx`: 表示用テストだけ入力・期待する位置・実際の位置を示す。戻り値が位置（数値）のため、リスト同士の差分を示すバブルソートの `ArrayOutput` は使わず、リストの図（該当セルを処理中の青＋強調リング、盤面型の found の写像と同じ）と言葉の数値を併記する `IndexOutput` を新設した。-1 は図でどのセルも指さず「見つかりませんでした」と示し、範囲外の数値はその旨を示す。数値でない戻り値は生の値を描画しない。
- `FreeExecutionConsole.tsx` / `freeExecution.ts`: 試しに実行は D1 だけを Worker を作り直して実行し、戻り値の位置を図で示す。通過数・実行回数・完了判定は変えない。
- 単品プレビューとして `front/src/app/learning-preview/[contentId]/page.tsx` に `binary-search-implementation` を登録した。
- モジュール README（`front/src/features/learning/binary-search/implementation/README.md`）を新設した。

## 検証

- `npm run verify:binary-search-implementation`（新規）: テストの入力・期待値を独立に確認（`indexOf` の意味論と実行記録の二重照合）、CPython で参照コードが全4テストを通ること、典型的な誤答が落ちること（`lo = mid` は転移・不在で真ん中が進まず無限ループ→ステップ上限で不合格、`hi = mid` は不在ケースで同様、`return None` は J3 のみ不合格、値を返すと D1 が不合格）、テンプレートが契約の関数定義＋docstring で構文的に正しいこと、骨格行・Parsons の正本参照、ヒントの順序解放、位置表示の描画契約（図＋数値の併記、-1 の扱い、範囲外・非数値の秘匿）、試しに実行の描画、判定用の秘匿、完了ゲート、ランナーの進捗・エラー分類・中断を確認する。
- 既存の `verify:binary-search-motivation`、`verify:binary-search-execution`、`verify:binary-search-check`、`verify:binary-search-code-mapping`、`verify:binary-search-code-check`、`verify:binary-search-consolidation`、`verify:learning-player`、front の `typecheck`（tsc --noEmit）、新規ファイルの `lint`、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **視覚デバッグは未接続**: 基準データ §3 フェーズ7・§4 には視覚デバッグ（ボタン文言「範囲が狭まる様子を見る」）があるが、Issue 分割（基準データ §7）では視覚デバッグは子 Issue 9（本 PR の次の #293、ハーネス拡張＋トレース変換）の担当のため、本 PR には含めていない。バブルソートでも視覚デバッグは別 Issue（#234）でフェーズ7の画面へ後から接続された前例どおりの分担である。
- **J1 が D1 と同じ入力であること**: 基準データ §3 フェーズ7の指定どおり、判定用 J1 は表示用 D1 と同じ主教材ケースにした。学習者は表示用で見たケースが判定にも含まれる形になる（バブルソートでは判定用は表示用と別ケースだった）。基準データの指定を優先したため、変更する場合は基準データ側の判断が要る。
- **ヒント L2 の流れの再構成**: 基準データの L2 は6項目（①両端を決める ②範囲が残っている間くり返す ③真ん中を計算して比べる ④一致したらその位置を返す ⑤小さい側か大きい側かを捨てる ⑥範囲が空になったら -1 を返す）。他単元の L2 表現（番号付きフロー＋ループ枠）に合わせ、②をループ枠のラベル「範囲が残っている間くり返し」に充て、表示ステップは5つ（①→1、③→2、④→3、⑤→4、⑥→5）とした。内容の欠落はない。
- **ヒント L4 の Parsons 行数**: L4 はフェーズ6の Parsons 設問（主要8行）をそのまま再利用する。フェーズ6の実施記録にあるとおり、基準データ §3 フェーズ6の「主要 6〜7 行」とは行数が異なる（8行）が、フェーズ7で別の行集合を作ると教材間で正解順序がずれるため、フェーズ6と同一の盤面を練習用に使うことを優先した。
