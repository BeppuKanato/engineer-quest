# BFS フェーズ5「コード基本確認」

- 目的: Issue #73 の独立した穴埋め2問を、再挑戦・任意復習・タイプCの結果まで単品で操作する。
- 適用範囲: フェーズ5のコンテンツ、共通assessmentのコード穴埋め種別、コード表示の共有、単品プレビューと検証。状態: 現行。最終確認日: 2026-11-05。
- 起点: `develop` `425215c`（PR #93・#94 マージ済み）。
- 正本: [教材指針 §1・フェーズ5](../../../../../../docs/concept/learning-materials-guideline.md)、[UI定義](../../../../../../docs/concept/learning-player-ui.md)、[要約](../../../../../../docs/concept/learning-materials-v2.md)、[Issue #73](https://github.com/BeppuKanato/engineer-quest/issues/73)。

## 確認方法

`front/` で `npm ci` → `npm run dev` を実行し、起動したマシンのブラウザで `http://localhost:3000/learning-preview/bfs-code-check` を開く。ログイン・DB・バックエンドは不要。
production buildでは `npm run build` 後に `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000`。
クラウドマシンのlocalhostは、手元のPCから直接開ける共有URLではない。

1. 問1で `queue.____(neighbor)` と選択肢 append / popleft / remove を確認する。
2. popleftなどの誤答を選び、その場の不正解表示と任意復習ボタンを確認する。
3. 「💡 この処理の動作（フェーズ4）をもう一度見る」を押すとモーダルが開く。次へ／再生で代入→末尾追加の図とコードを確認し、閉じても問1の空欄と試行状態が残る。
4. appendで正解すると、末尾追加を確認できた具体的なフィードバックと問2を表示する。
5. 問2は `if neighbor ____ distances:`。inなどで誤答→任意復習→再挑戦できる。not inで正解する。
6. 2問とも正解すると、結果画面に「応用・総括」の正式名称と、別パターン・例外ケースの3〜5問の予告を表示する。次フェーズへの接続ボタンは作らない。

選択肢は静止状態から青い枠のチップ状ボタンで表示し、「空欄に入るものを選ぶ」を常時示す。キーボードのTabとEnter／Spaceでも回答できる。
コードは16px以上、選択肢は18px・高さ48px以上。狭い画面ではコード領域だけを横スクロールし、出題・サイズ変更時に対象の空欄を見える範囲へ配置する。
ページ再読込で未回答に戻る。保存・ログ送信はない。

## コンテンツとコード契約

`codeCheck.content.ts` が設問文・意味ID・空欄位置・選択肢・正解・正誤文・復習先・完了文を持つ。
対象コードはフェーズ4と同じ `bfsCode`（id `bfs-distances-deque`、version 1）への直接参照で、本文・インデント・意味ID・versionを変更しない。
設問文中の行番号は `bfsCodeLineNumber` で意味IDから導出する。表示行番号を設問データのキーとして保存しない。

| 設問ID | 対象行ID | 空欄 | 選択肢 | 正解 | 復習フレーム |
| --- | --- | --- | --- | --- | --- |
| `enqueue-method` | `enqueue-neighbor` | メソッド名 | append / popleft / remove | append | `assign-a-b` → `execution-discover-b` |
| `undiscovered-condition` | `if-undiscovered` | 演算子 | not in / in / == | not in | `for-a-b` → `if-a-b` |

両問とも `requires: null`。順に解くが、問2の正解や表示内容を問1の回答値から導かない。
空欄位置は元の行から一意な対象トークンの開始位置・長さとして求め、正解を入れた行は元の行とバイト単位で一致する。

## 既存基盤の再利用

- `assessment/assessment.ts` に `CodeBlankQuestion` / `ChoiceAnswer` を追加。既存の設問順序、再挑戦、初回正誤・全試行のメモリ上の記録、古い設問への二重回答防止、全問正解での完了処理を共通で使う。フェーズ5専用のセッション処理は作らない。
- フェーズ4のコード描画を `code-mapping/BfsCodeDisplay.tsx` に取り出し、フェーズ4と5の両方から使う。フェーズ4の実行行・Dimは維持し、フェーズ5では他の行を完成済みの通常色、対象箇所だけを破線枠の空欄として表示する。
- フェーズ3が使う汎用 `LearningReviewDialog` と `selectReviewContent` をそのまま使い、フェーズ4の元フレームを参照して `BfsCodeMappingCanvas` を表示する。復習用の図・コード・変数データを作り直さない。
- 復習は誤答後のボタンからだけ開く。先頭の直前状態から次へ／再生で対象行へ進み、閉じると復習プレイヤーがアンマウントされる。復習中は回答状態を変更しない。

## 判断点・対象外

- 基準選択肢の `queue.popleft(neighbor)` は構文として成立するが、dequeのpopleftは引数を受けないため、そのまま実行すると引数エラーになる。指定選択肢は維持し、構文の成立はPythonの `ast.parse` で確認する。誤答の実行成功は保証しない。
- 完了文は正式名称を明記する要件に合わせ、指針全文の `【応用・総括】` を含む例文を採用した。
- 正解時は確認した役割に即した短い文を表示する。問1の正解文は問2へ進んだ画面にも残し、問2で誤答するとその場の不正解文へ切り替える。
- タイプCの結果画面は今回の対象。アプリ組み込み・DB・進捗保存・ログ送信・フェーズ6の実装・フェーズ接続は対象外。

## 検証

`front/` で以下を実行する。新しいverifyは `python3` を使う。

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:learning-player
npm run verify:bfs-motivation
npm run verify:bfs-execution
npm run verify:bfs-check
npm run verify:bfs-code-mapping
npm run verify:bfs-code-check
```

新verifyは、正解補完のバイト一致、6候補すべてのPython構文、選択肢の一意性、共有コード表示の11行・対象1か所だけの空欄、元の復習フレームの参照同一性を確認する。
共通セッションでは誤答・再挑戦・初回正誤・全試行、独立性、異なる回答種別の拒否、連打・完了後の回答の拒否、不正な空欄・選択肢・行・復習先の拒否を確認する。
