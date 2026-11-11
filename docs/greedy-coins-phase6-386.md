# 貪欲法（硬貨問題）フェーズ6（応用問題）（Issue #386）

目的: 貪欲法（硬貨問題）単元のフェーズ6（応用問題）を、基準データ §3 フェーズ6の4問構成（転移トレース・反例トレース・反例の理解・フェード型 Parsons）に沿って実装する。最終確認日: 2026-11-11。前提: フェーズ5は #385（本 PR の base ブランチ）。

## 実装

- `front/src/features/learning/greedy-coins/consolidation/consolidation.content.ts`: 4問。
  - Q1 `next-coin-transfer`（転移トレース）: 342円で100を3枚使ったところ（トレイ [100, 100, 100]、残額42）。次に選ぶ硬貨のタップ、正解は10。場面・正解は転移用の実行記録（`greedyCoinsSelections`）から導く。回答対象はフェーズ3と同じく全6額面。
  - Q2 `counterexample-greedy-result`（反例トレース）: 額面 [4, 3, 1]・6円を同じ方法で払うとどうなるか（4択）。正解は「[4, 1, 1] の3枚になる」。場面は反例の開始盤面。
  - Q3 `counterexample-why-greedy-loses`（反例の理解）: 正解は「一番少ないのは [3, 3] の2枚。最初に一番大きい4を選ぶと、残り2を1の硬貨で埋めるしかなくなるから」。場面は反例を貪欲で払い終えた盤面（トレイ [4, 1, 1]、残額0）。
  - Q4 `whole-code-order`（フェード型 Parsons）: 参照コード8行、固定2行（`define-function` / `return-result`）・可動6行・1セグメント。
- 場面は単元盤面型（`GreedyCoinsExecutionCanvasState`）で組み立て、盤面検証（`validateGreedyCoinsExecutionCanvas`）を通す。表示とタップ回答はフェーズ3の `GreedyCoinsCheckCanvas` を再利用し、描画はフェーズ2と同じ硬貨図。
- `consolidation.types.ts`: 共通エンジンの diagnostic-check 形式に場面の盤面と正誤の解説文を足した設問型・コンテンツ型と、単元接続用の要約型。コンテンツ ID は `greedy-coins-consolidation`。
- `GreedyCoinsConsolidationPreview.tsx`: 診断型のアセスメント画面。二分探索フェーズ6と同型の3段組（#298）。embedded / onComplete / onNext を持ち、未指定なら単品ページとして動く。
- ゲートモデルは共通基盤どおり: 回答では進まず「次の問題へ／結果を見る」で進む（ソフトゲート）、診断は初回回答のみ、正解した問題は入力をロックする。復習先はすべてフェーズ4のフレームで、新しい金額や別額面の答え合わせは作らない（教材指針フェーズ6の割り切り仕様）。
- 単品プレビュー: 共有の `front/src/app/learning-preview/[contentId]/page.tsx` に `greedy-coins-consolidation` として登録した。

## 検証

- `npm run verify:greedy-coins-consolidation`（新規）: 4問の構成と正解が基準データ §3 フェーズ6どおりであること、独立に再実装した貪欲トレース（342→[100, 100, 100, 10, 10, 10, 10, 1, 1]、反例6→[4, 1, 1]）と全探索による最適（[3, 3] の2枚、1〜5円では貪欲と最適の枚数が一致）で裏づけること、参照コード原文（Python）の実行結果、場面の盤面検証、Parsons の固定行が正解位置に固定表示されること・1セグメントで正解に到達できること・互換グループの入れ替えだけが正解になること（離れた位置では互換扱いしない）、共通エンジンの進行（ソフトゲート／初回回答の診断）、実描画の回答ボタンと入力ロック、不正データの拒否を確認する。
- 先行する貪欲法の verify（motivation / execution / check / code-mapping / code-check）の回帰、front の `lint`（既存の警告4件のみ）・`typecheck`・`build` も通過。
- DB・シードの変更はない。

## 留保（判断した点）

- **Parsons の互換グループ: 採用した。** 6行目 `result.append(coin)` と7行目 `remaining -= coin` は入れ替えても動作が変わらない（記録は `coin` のみ、更新は `remaining` のみに依存する）。基準データは「互換グループとして扱う余地がある（実装時に判断）」としていた。共通基盤（`assessment.ts` の `interchangeableLineGroups`）は、正解順で隣接する行のグループを正規化して判定する仕組みを持ち、この2行（正解順で隣接し、固定行でもない）をそのまま扱えるため、互換グループとして実装した。verify では、2行の入れ替えが正解になること、それ以外の隣接入れ替えが不正解になること、グループの行が離れた並びは互換として扱わないことを確認している。
- Q2・Q3の誤答選択肢は基準データが定めていないため、正解の文（基準データどおり）に対して、最適解を貪欲の結果と取り違えるもの・小さい硬貨から使うもの・理由を取り違えるものを置いた。Q3の誤答には、敗因と解釈しうる曖昧な言い換え（例: 「4を選ぶと3が使えなくなる」）は置かず、正解だけが敗因を述べる形にした。
- Q1の復習フレームは、主教材で50が使えなくなり10へ進むフレーム列（`while-remaining-7` → `for-coin-10` → `while-remaining-8` → `execution-select-5`）とした。転移先の答え合わせアニメーションは作らない割り切り仕様に従う。
