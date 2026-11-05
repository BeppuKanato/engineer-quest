# BFS Parsons 盤面の1リスト直接並び替え化（Issue #97）

- 目的: フェーズ6の Parsons 問題の盤面を、2リスト方式（選べるコード行／並べたコード行）から、全行が最初から並んだ1つのリストを直接並び替える方式に再設計する。
- 適用範囲: `front/src/features/learning/bfs/consolidation/ParsonsBoard.tsx` と、操作に追随する操作指示文・README・検証。状態: 現行。最終確認日: 2026-11-05。
- 起点: `develop` `f627a0d`（PR #96 マージ済み）。
- 正本: [教材指針 §1・フェーズ6](concept/learning-materials-guideline.md)、[UI定義 §2.3](concept/learning-player-ui.md)、[Issue #97](https://github.com/BeppuKanato/engineer-quest/issues/97)、前任の実装報告 [bfs-consolidation-74.md](bfs-consolidation-74.md)。

## 背景と判断

PR #96 のレビューで、2リスト方式は「選ぶ／並べる」の状態が分かれるため分かりにくく、途中の行の直しも大変だという指摘があった。タイミングはユーザーと協議し、「PR #96 は当時の修正で閉じ、1リスト化は別 Issue で今すぐ行う」と決めた。アプリ統合（#77・#78）は接続と組み込みが本題で、設問盤面の再設計はそちらのスコープに入らないこと、Parsons が共通設問種別として全アルゴリズムの雛形になることが理由である。

並び替えたコードを実行して結果を図で確認する案もあったが、フェーズ7の視覚的デバッグ（#76）と基盤を共有するため、そちらの設計と合わせて判断する。今回の範囲には含めない。

## 実装内容

- `ParsonsBoard` を1リスト方式に書き換えた。全11行がコンテンツの提示順（`lineIds`）のまま縦リストに並び、初期状態から全行がそろっている。
- 並び替えは framer-motion の `Reorder` で行う。↕ハンドルのドラッグで移動し、他行は 600ms のレイアウトアニメーションで入れ替わる。各行の↑↓ボタンでも移動でき、キーボードとタッチでも詰まらない。動きを減らす設定ではアニメーションを省略する。
- 提出は「この順序で回答する」で現在のリスト順を従来どおり `order` 回答として渡す。「提示順に戻す」で初期順に復帰する（初期順のときは無効）。
- 行の見た目は維持した。左揃え、元のインデント保持、等幅、`clamp(16px, 1vw, 18px)`、行高 1.8、`playerTokens` の枠色。1366px 幅では最長行を含め横スクロール不要、390px 級ではコード列内だけ横スクロールできる。
- 設問の操作指示文を実態に合わせて「行をドラッグ、または↑↓ボタンで並び替える」に変更した（`consolidation.content.ts` の Parsons 設問のみ）。盤面側に重複していた操作ヒント行は削除した。
- 判定仕様、設問データ（提示順・タグ・フィードバック文・復習先）、assessment 共通基盤は変更していない。初期化2行の入れ替え許容（`interchangeableLineGroups`）もそのまま効く。

## 検証

- `front/` で lint / typecheck / build が通る。
- 既存 verify 一式（`verify:learning-player`、`verify:bfs-motivation`、`verify:bfs-execution`、`verify:bfs-check`、`verify:bfs-code-mapping`、`verify:bfs-code-check`、`verify:bfs-consolidation`）がすべて通る。`verify:bfs-consolidation` は盤面の初期描画が提示順どおりであること（`data-parsons-line-id` の並び）も引き続き確認している。
- 確認方法: `front/` で `npm run dev` を実行し、`http://localhost:3000/learning-preview/bfs-consolidation` の問5で、ドラッグと↑↓ボタンによる並び替え、提示順へのリセット、回答と診断への反映を確認する。
- 実画面のスクリーンショットは未実施（この環境から開発サーバーの画面を撮影できないため）。レビュー時に手元環境での確認をお願いする。

DB 適用なし。アプリ組み込み、進捗・ログ保存、フェーズ間接続は対象外。
