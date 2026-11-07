# 二分探索 フェーズ5（コードの確認問題）（Issue #290）

目的: 二分探索単元のフェーズ5（コードの確認問題）を、基準データ §3 フェーズ5の独立2問（1問1穴）として、フェーズ4の参照コード契約（binary-search-v1、12行）への直接参照で実装する。設計は基準データ（docs/concept/binary-search-unit-baseline.md §2・§3、正本）と教材指針、他単元フェーズ5（バブルソート #231）の構成に従う。最終確認日: 2026-11-07。

## 実装

- `front/src/features/learning/binary-search/code-check/codeCheck.content.ts`: 独立2問と読み込み時の検証（`validateBinarySearchCodeCheck`）。
  - Q1 `mid-formula`: 5行目 `compute-mid` の `mid = (lo + hi) // 2` の `hi` を空欄にし、選択肢は lo / hi / mid、正解は hi。真ん中は範囲の両端 lo と hi の中間、が解説の要点。
  - Q2 `skip-mid`: 9行目 `drop-left` の `lo = mid + 1` の `1` を空欄にし、選択肢は 0 / 1 / 2、正解は 1。真ん中の値は確認済みで探す値ではないため、mid 自身も範囲から外す、が解説の要点（基準データ §3 の指定どおり、誤答時のフィードバックにも同じ文を含む）。
  - 空欄位置は両問とも「行内で一度だけ現れるトークン」（`blankAt`、BFS方式）で求める。Q1の `hi`・Q2の `1` は対象行の中で一度だけ現れるため、バブルソート Q1 のような文脈による一意化（`blankWithin`）は要らなかった。正解を入れた行は元の行とバイト単位で一致することを検証で固定する。
  - 復習フレームは Q1 が `execution-range-full` → `execution-probe-1-mid`、Q2 が `elif-smaller-1` → `execution-probe-1-drop-left`（どちらも最後のフレームが対象行をハイライトする）。
- `codeCheck.types.ts`: 共通 code-blank 形式に、正誤の解説文とフェーズ4契約の行IDの型を足した設問型・コンテンツ型と、単元接続用の要約型。
- `BinarySearchCodeCheckPreview.tsx`: バブルソートフェーズ5と同じ画面構成（共通 `CodeDisplay`、選択肢ボタン、復習モーダル、embedded / onComplete 接続ポート）。進行・採点は共通エンジンの現行統一仕様（回答では進まない／初回回答で結果確定／正解後は入力ロック／ソフトゲート）。
- 単品プレビューとして `front/src/app/learning-preview/[contentId]/page.tsx` に `binary-search-code-check` を登録した。
- モジュール README（`front/src/features/learning/binary-search/code-check/README.md`）を新設した。
- ついでに基準データの表記修正を含めた: `docs/concept/binary-search-unit-baseline.md` の参照コード行数「11行」（§2 の箇条書きと §3 フェーズ4 の2か所、grep で全件確認）を「12行」に直した。フェーズ4（PR #307）が検出した誤りで、コードブロック本文（12行）は変更していない。

## 検証

- `npm run verify:binary-search-code-check`（新規）: 契約のバイト一致（12行・意味ID・インデント）、対象行・空欄・選択肢・正解の固定、正解で埋めた行のバイト単位の復元、全6候補の Python 構文解析、正解プログラムの実行（基準データの3ケース: 主教材 25→4、転移 23→5、不在 20→-1)、CodeDisplay の実描画（空欄は対象行だけ、答えの漏れなし）、復習フレームの同一性、設問固有フィードバック、共通エンジンの進行・記録・ソフトゲート・不正データの拒否、プレビュー登録を確認する。
- 既存の `verify:binary-search-motivation`、`verify:binary-search-execution`、`verify:binary-search-check`、`verify:binary-search-code-mapping`、`verify:learning-player`、front の `typecheck`（tsc --noEmit）、新規ファイルの `lint`、`build` も通過。
- DB・シードの変更はない。

## 留保（判断が必要な点）

- **Q2 の復習フレームの組み立て**: バブルソートの型（直前の文脈フレーム＋対象行フレーム）に合わせ、Q2 は「elif の評価フレーム（values[mid] < target の判定）→ drop-left の代入フレーム」の2枚にした。真ん中の決定フレーム（`execution-probe-1-mid`）は含めていない。Q1 は「範囲の確定フレーム → 真ん中の決定フレーム」の2枚である。
- **基準データ §3 フェーズ5 の Q2 表記**: 基準データは Q2 の場面を「`values[mid] < target` のとき」と条件で示すため、設問文は「真ん中の値より大きい側だけを残すために」と目的で書いた。対象行・空欄・正解は基準データどおりである。
