# BFS フェーズ7エディタ改善（Issue #110）

- 目的: 自力実装の編集面積と読みやすさを確保し、表示用データでprintと戻り値を確認できるようにする。
- 適用範囲・状態: フェーズ7単品プレビューと既存の単元フロー内表示の実装記録。学習画面への組み込み・保存・ログ計装は含めない。
- 最終確認日: 2026-11-05。
- 起点: 最新の`develop` `416b244`（PR #112マージ済み）から`feat/bfs-editor-110`。
- 正本: [Issue #110](https://github.com/BeppuKanato/engineer-quest/issues/110)、[Issue #78 設計決定10](https://github.com/BeppuKanato/engineer-quest/issues/78)、[教材指針フェーズ7](concept/learning-materials-guideline.md)、[UI定義](concept/learning-player-ui.md)、[開発ルール](development-rules.md)。現在の機能案内は[implementation README](../front/src/features/learning/bfs/implementation/README.md)。

## 変更範囲

Monacoを組み込みテーマ`vs-dark`へ変更し、フォント16px／行高29pxを維持した。エディタ画面は教材プレイヤーの占有率の対象外とし、単品では全画面、単元内ではナビゲーション下を使う。900px以上では編集側2.4：サイド側1（最小300px）に配分し、サイドをテスト／コンソールのタブと4段階ヒントに分けた。狭い画面は縦に積み、編集エリアとサイドをスクロールで行き来する。

暗色は`implementation/editor.tokens.ts`に閉じ、テスト結果・ヒント・完了表示の文字と枠を合わせた。小さい入力グラフとヒント4のParsons盤面、トレースプレイヤーは元の白背景と`playerTokens`を維持する。`BfsUnitPreview`はフェーズ7表示時の外枠幅だけを変更した。教材データ・骨組み・コード契約・採点・ヒント内容・トレース変換には変更を加えていない。

## フリー実行とデータの分離

新しい「フリー実行（print）」は現在のコードをD1（基本グラフ、出発点A）に対して実行する。既存の「実行する」はトレース、「テストを実行する」は5件の採点のまま。フリー実行は採点結果・テスト実行回数・ヒント回数・完了通知に影響しない。実行中は各ボタンと編集をロックして競合を防ぐ。

既存Workerの`kind: run`にstdoutと戻り値があるため、WorkerやPythonハーネスは変更しなかった。runnerへ任意のstdoutコールバックと出力バッファ上限を加え、例外でrejectされた場合にもその直前のprintを取得する。既存の呼び出し引数・15秒タイムアウトは維持し、空文字のstdout／stderrメッセージを実行完了として扱わないよう修正した。

Pythonの実行環境には直前の採点変数が残り得るため、`freeExecution.ts`は毎回Workerを破棄・再準備してからD1を1件だけ送る。D2・判定用J1〜J3をフリー実行へ渡さず、以前のPythonグローバルも再利用しない。表示はD1のstdoutと戻り値だけとし、生の例外本文・トレースバック・stderrは表示しない。

stdoutは先頭16,000文字までに制限して省略を明記する。戻り値は既存の距離整形を`DistanceOutput`として共用し、値違い・不足・余分を示す。エラーは既存の分類を使い、文法／実行時／結果不一致／タイムアウトの文言を表示する。Pyodideの準備失敗は再実行を促す文言に分ける。

Issue本文には表示用D1・D2の例があるが、今回の明示依頼に従いフリー実行はD1に限定した。#109とは並行ブランチであり、学習画面・API接続・下書き保存・計装は追加していない。#109と統合する際は同じコンポーネントに加わる任意コールバックと下書き用プロパティを保持する必要がある。

## 検証結果

`front/`で`lint`、`typecheck`、`build`、既存の`verify:learning-player`とBFS系9本（motivation / execution / check / code-mapping / code-check / consolidation / implementation / trace / unit）、追加の`verify:bfs-free-execution`がすべて成功した。DB適用なし。依存パッケージの追加なし。

追加verifyは実runnerのメッセージ処理をFake Workerで検証し、空stdout、リクエストIDの分離、既存出力の互換性、出力上限、エラー直前のprint、15秒タイムアウトを確認する。機能境界では新しいWorkerとD1限定、準備失敗・キャンセル・エラーの秘匿、距離の差分表示、教材データの不変を確認する。

Chromiumの実画面では実際のMonacoとPyodide 0.27.7を使い、1366×768と390×844で以下を確認した。Monacoの実測は単品1366pxで928×559px、390pxで372×476px、単元内1366pxで928×498pxだった。

- ダークテーマ、16pxの文字、編集面積、ページ全体の横はみ出しがないこと。
- 正解コードのprint（空行を含む）と距離一覧、実行しても0/5・未実行のままであること。
- 文法／実行時／結果不一致／15秒タイムアウトの各表示、例外・タイムアウト前のprint、16,000文字での省略（エラー全種と上限は1366pxで確認）。
- 全4段階ヒント、トークン挿入とUndo、採点なしの既存Parsons盤面。
- 採点で4/5になった後のフリー実行でも、新しいWorkerにD1だけが渡り、以前の採点グローバルが空であること。
- 既存の19状態トレース、テスト2回で5/5完了、ヒント各1回の記録。フリー実行はテスト回数に含まれないこと。
- 単元フローをフェーズ1から進め、フェーズ7が拡大表示されること。フリー実行では単元完了せず、採点全通過で最終リザルトへ進み「テスト実行1回」となること。

この環境のブラウザは外部CDNへ直接到達できないため、ブラウザ検証時だけ、取得済みの同じMonaco／Pyodide配布資産をローカル配信先へ向けた。Python実行や判定のモックは使っていない。アプリにローカル配信先の設定変更は含めず、公開・デプロイもしていない。

## 確認方法

`front/`で`npm run dev`後、起動したマシンのブラウザで次を開く。認証・バックエンド・DBは不要。クラウド環境のlocalhostは手元PCから直接開ける共有URLではない。

- 単品: `http://localhost:3000/learning-preview/bfs-implementation`
- 単元: `http://localhost:3000/learning-preview/bfs-unit`（フェーズ1〜6を進め、フェーズ7を開く）

1. 1366×768で、暗色のエディタが左の広い領域に表示され、テスト／コンソールとヒントが右に収まることを確認する。390px幅では縦スクロールで操作できることを確認する。
2. ヒントを順に開き、フェーズ4と同じ正解コードを入力する。任意の`print(start)`等を加え「フリー実行（print）」を押す。printとA：0歩〜F：3歩が表示され、通過数とテスト結果が変わらないことを確認する。
3. 関数内を`print("確認")`と`raise ValueError()`にすると、printが残り、実行途中のエラーという文言だけが出る。`return {"A": 9, "Z": 0}`は距離の不一致、`while True: pass`は15秒後にタイムアウトの文言になる。修正後に再実行できる。
4. 「実行する」で既存トレースが開き、閉じると編集に戻る。「テストを実行する」で従来の5件採点が行われ、全通過時に完了する。フリー実行とトレースを何度使ってもテスト実行回数に含まれないことを確認する。

## 確認画像

| 場面 | 1366×768 | 390×844 |
| --- | --- | --- |
| 初期エディタ | [初期表示](figures/bfs-editor-110/1366-initial.png) | [初期表示](figures/bfs-editor-110/390-initial.png) |
| print・戻り値 | [コンソール](figures/bfs-editor-110/1366-console-success.png) | [コンソール](figures/bfs-editor-110/390-console-success.png) |
| ヒント | [ヒント1](figures/bfs-editor-110/1366-hint.png) | [ヒント1](figures/bfs-editor-110/390-hint.png) |
| 既存の採点・トレース | [採点](figures/bfs-editor-110/1366-grading.png)・[トレース](figures/bfs-editor-110/1366-trace.png) | [採点](figures/bfs-editor-110/390-grading.png)・[トレース](figures/bfs-editor-110/390-trace.png) |
| 完了 | [完了](figures/bfs-editor-110/1366-complete.png) | [完了](figures/bfs-editor-110/390-complete.png) |

[文法エラー](figures/bfs-editor-110/1366-syntax.png)・[実行時エラー](figures/bfs-editor-110/1366-runtime.png)・[結果不一致](figures/bfs-editor-110/1366-mismatch.png)・[タイムアウト](figures/bfs-editor-110/1366-timeout.png)・[単元内のフェーズ7](figures/bfs-editor-110/1366-unit-editor.png)。
