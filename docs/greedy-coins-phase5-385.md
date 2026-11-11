# 貪欲法（硬貨問題）フェーズ5（コードの確認問題）（Issue #385）

目的: 貪欲法（硬貨問題）単元のフェーズ5（コードの確認問題）を、基準データ §3 フェーズ5の共有コード穴埋め形式（独立2問、1問1穴）に沿って実装する。対象コードはフェーズ4と全く同じ参照コード（契約 greedy-coins-v1、8行）。最終確認日: 2026-11-11。前提: フェーズ4は #384（本 PR の base ブランチ）。

## 実装

- `front/src/features/learning/greedy-coins/code-check/codeCheck.content.ts`: 独立2問。
  - Q1 `while-condition`: `while □ >= coin:`（5行目）の穴は `remaining`（残額と今の額面を比べる、が要点）。
  - Q2 `remaining-update`: `remaining -= □`（7行目）の穴は `coin`（使った硬貨の分だけ残額を減らす）。
  - 選択肢はどちらもコードに現れる変数名（amount / remaining / coin）。正解で埋めた行が参照コードの原文とバイト単位で一致することを、モジュール読み込み時に検証する（`validateGreedyCoinsCodeCheck`）。
  - 正誤の解説は、どちらの設問でも「なぜその変数か」が一文で分かる文にした。
  - 復習はフェーズ4の該当行のフレーム（Q1: `for-coin-500` → `while-remaining-1`、Q2: `execution-select-1` → `subtract-coin-1`）で、最後のフレームが対象行をハイライトすることを検証する。
- `codeCheck.types.ts`: 共通エンジンの code-blank 形式に正誤の解説文を足した設問型・コンテンツ型と、単元接続用の要約型。対象行はフェーズ4契約の意味IDで型に縛る。
- `GreedyCoinsCodeCheckPreview.tsx`: アセスメント画面。二分探索フェーズ5と同型の3段組（#298、コード窓は固定高320px）。embedded / onComplete（要約通知）を持ち、未指定なら単品ページとして動く。
- ゲートモデルは共通基盤どおり: 回答では進まず「次の問題へ／結果を見る」で進む（ソフトゲート）、結果は初回回答で判定、正解した問題は入力をロックする。2問は独立で、前問の回答を条件にしない。
- 単品プレビュー: 共有の `front/src/app/learning-preview/[contentId]/page.tsx` に `greedy-coins-code-check` として登録した。コンテンツ ID は `greedy-coins-code-check`。

## 検証

- `npm run verify:greedy-coins-code-check`（新規）: 対象行と正解が基準データ §3 フェーズ5どおりであること、正解で埋めた全文が参照コード原文（基準データ §2 の8行）とバイト単位で一致すること、全6候補が Python 構文として成立すること、正解プログラムが基準データのケース（主教材786・転移342・別額面41・反例 [4, 3, 1] で6→貪欲の [4, 1, 1]）を満たすこと、復習先が対象行をハイライトすること、共通エンジンの進行（回答で進まない／ソフトゲート／初回回答の記録／独立性）、不正データの拒否を確認する。
- 既存の `npm run verify:greedy-coins-motivation` / `verify:greedy-coins-execution` / `verify:greedy-coins-check` / `verify:greedy-coins-code-mapping`（回帰）、front の `lint`、`typecheck`、`build` も通過（lint は既存の警告のみ。詳細は PR 本文）。
- DB・シードの変更はない。

## 留保（判断した点）

- **選択肢は2問とも変数名3択（amount / remaining / coin）とした**: 基準データは穴と正解だけを定める。どちらの穴も変数名が入るため、コードに現れる変数名で統一し、役割の取り違え（残額・額面・元の金額）を問う形にした。
- 完了文はフェーズ6の内容（別の金額や、貪欲では最適にならない場合を含む4問）に言及する。二分探索フェーズ5の完了文の型に倣ったもので、基準データ §3 フェーズ6の構成（転移・反例・Parsons の4問）と一致する。
