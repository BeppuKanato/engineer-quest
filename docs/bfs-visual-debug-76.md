# Issue #76 BFS視覚的デバッグの実装・検証記録

- 目的: 学習者の現在のコードをD1でトレースし、再生・停止・打ち切り・最終状態表示を確認する。
- 適用範囲: フェーズ7の単品ページ、再利用可能な取得・変換モジュール、共通Workerのtrace経路。状態: 記録。最終確認日: 2026-11-05。
- 起点: `develop` `6d013f4`（PR #99マージ済み）。
- 正本: [Issue #76](https://github.com/BeppuKanato/engineer-quest/issues/76)、[教材指針 §1・7-3](concept/learning-materials-guideline.md)、[UI定義](concept/learning-player-ui.md)。詳細は[trace README](../front/src/features/learning/bfs/trace/README.md)。

## 実装

フェーズ7の編集画面と完了後の画面へ「自分のコードの動きを見る」を追加した。取得中はコード編集・採点・ヒント・重複実行を無効にし、状態を表示する。トレースの利用で採点実行回数・ヒント回数を変更しない。

既存pyodideRunner／Workerにkind=traceを追加した。Pythonのsys.settraceで対象関数の行・return・exceptionイベントを記録し、queue・distances・node・neighborだけをコピーする。停止行と例外種別、既定500イベントの上限、打ち切りを返す。stdout・stderr・例外本文・トレースバックは渡さない。
取得は毎回新しいWorkerで行い、表示用D1の関数名と引数だけを送る。前の判定用ケースを含むWorkerや、tests・期待値・他ケースの入力を持ち込まない。

変換は別モジュールとし、正しいBFSを再実行して置き換えず、実際のキュー・距離・現在の場所からフェーズ2と同じ状態形式を生成する。既存BfsExecutionCanvasとLearningPlayerで再生し、下部に観測行・queue・distances・nodeを表示する。キャプションは状態の差分から機械生成する。

## 対応付け・判断点

- **ユーザー確認済み**: 行トレースの距離代入直後とキュー追加後を1コマへまとめ、queueを条件に含むwhileの境界に「調べ終えた」状態を補う。生の変数値は保持するため、図で完了した場所のnode変数がPythonには残っている場合がある。
- 正解コードの状態列は、フェーズ2の正準19コマから同一状態のskip-eを間引いた18状態と一致する。最終の同一状態は終了・停止・打ち切りのキャプションへ更新する。
- 誤った数値やLIFOの順序も描くため、正しいBFS専用のvalidateBfsExecutionCanvasは適用せず、同じ型と描画可能性を検証する。誤距離と正準の距離帯が矛盾するときだけ帯を外し、ノード・辺・座標・表示値は変えない。
- D1の既知6点、重複のない最大6件のキュー、数値の距離辞書が描画範囲。型の違う値・未知ノード・重複キューなどが最後まで残る場合は最終状態モードへ落とす。返り値の数値辞書からD1上の距離を描くが、存在しないdistances変数を返り値から作って表示しない。
- エラー時はそこまでの状態を保ち、最後を停止行・種別のフレームにする。変換不能でも停止行と種別は表示する。最終状態モードは1フレームで再生操作を無効にする。
- 1イベントのコピーはコレクション64件・文字列100文字まで、記録は既定500件（APIの上限2000件）。上限を捕捉して処理が戻った場合も、打ち切りを成功扱いにしない。
- 時間上限は既存の15秒。ネイティブ処理などで時間切れになるとWorkerが破棄され、そこまでの記録は取り出せない。その場合は再生せずタイムアウトと記録を取得できなかったことを表示し、新しいWorkerで再試行できる。

bfsCodeの本文・意味ID・version、フェーズ7のテスト・4段階ヒント、フェーズ2のステップデータ、キャンバスとプレイヤー本体は変更していない。DB適用なし。エディタ改善・printコンソール・保存・他フェーズへの組み込み・接続は対象外。

## 確認方法

`front/`で`npm ci` → `npm run dev`。起動したマシンのブラウザで http://localhost:3000/learning-preview/bfs-implementation を開く。ログイン・バックエンド・DB不要。クラウドのlocalhostは共有URLではない。

1. MonacoとPyodideの読込完了を待つ。正解に沿ったbfs_distancesを書き、「自分のコードの動きを見る」を押す。
2. モーダルで再生・一時停止・前後・シーク、矢印／Home／Endを操作する。Bを追加した状態ではqueue=[B]、distances={A:0,B:1}、node=Aと図が一致する。最後は6点の距離と空のキューになる。
3. 10行目相当の追加行を`raise ZeroDivisionError("任意の本文")`へ置き換えて確認する。そこまでの状態と停止行・ZeroDivisionErrorを表示し、本文・トレースバックは出ない。
4. 下の再帰例を貼り付けて確認する。再生を行わない1フレームになり、返された距離だけを描き、「結果だけを表示します」を明示する。
5. queueを減らさないループを実行し、途中までの表示と打ち切りを確認する。`time.sleep(20)`等のネイティブ処理では15秒後に記録なしのタイムアウトとなる。
6. 閉じてもコード・採点・ヒント利用状態は変わらない。再試行や通常の5テスト実行が可能で、全通過後のリザルトからも同じコードを確認できる。

再帰での最終状態表示を確認する例:

```python
def bfs_distances(graph, start):
    result = {start: 0}
    def visit(node):
        for neighbor in graph.get(node, []):
            if neighbor not in result or result[neighbor] > result[node] + 1:
                result[neighbor] = result[node] + 1
                visit(neighbor)
    visit(start)
    return result
```

打ち切りを確認する例:

```python
from collections import deque
def bfs_distances(graph, start):
    distances = {start: 0}
    queue = deque([start])
    while queue:
        node = queue[0]
```

## 検証結果

Node.js 20.20.2、Python 3、production buildのChromium。以下12コマンドすべてexit 0。

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
npm run verify:bfs-consolidation
npm run verify:bfs-implementation
npm run verify:bfs-trace
```

新verifyではWorkerと同じハーネスをCPythonで実行し、正解・listキュー・初期化順交換と正準の18状態一致、LIFOの実際の順序、誤距離、スナップショットのコピー、途中・末尾のエラー停止行、再帰の最終状態、構文エラー、上限・トップレベルループ・捕捉された上限、D1だけの送信とWorker分離・キャンセルを確認する。

実ブラウザの1366×768・390×844では、通常18状態、変数・シーク・再生、途中エラーの10行目と種別、再帰の最終状態、変換不能エラー、上限超過、閉じても状態を保持することを確認した。判定用テストで失敗した後も、新規WorkerへD1だけを送ることを送信メッセージで確認。トレースは採点・ヒント回数を増やさず、通常採点は4/5→5/5へ進める。
1366px幅でネイティブ処理の15秒タイムアウトとその後の再試行も確認した。実Workerで既存ping・run・runCreateQuestと通常runのstdoutが維持されることも確認した。

### 環境上の制約

PR #99と同じCDN証明書の制約があるため、ブラウザ検証ではHTTPS検証して取得済みの実Pyodide 0.27.7と、同じバージョンMonaco 0.54.0を一時ローカル配信している。検証用プロキシは資産の取得先だけを置き換え、Python実行や判定結果はスタブ化していない。リポジトリのCDN設定は変更せず、標準CDNからの直接読込は本環境では未確認として区別する。

## 確認画像

| 内容 | 1366×768 | 390×844 |
| --- | --- | --- |
| ボタンと通常画面 | ![入口](figures/bfs-visual-debug-76/1366-initial.png) | ![入口](figures/bfs-visual-debug-76/390-initial.png) |
| 再生の初期状態 | ![初期](figures/bfs-visual-debug-76/1366-replay-start.png) | ![初期](figures/bfs-visual-debug-76/390-replay-start.png) |
| 図と変数の同期 | ![再生](figures/bfs-visual-debug-76/1366-replay.png) | ![再生](figures/bfs-visual-debug-76/390-replay.png) |
| 最後の距離と空のキュー | ![終了](figures/bfs-visual-debug-76/1366-replay-end.png) | ![終了](figures/bfs-visual-debug-76/390-replay-end.png) |
| 停止行・種別 | ![エラー](figures/bfs-visual-debug-76/1366-error.png) | ![エラー](figures/bfs-visual-debug-76/390-error.png) |
| 再帰の最終状態のみ | ![最終状態](figures/bfs-visual-debug-76/1366-fallback.png) | ![最終状態](figures/bfs-visual-debug-76/390-fallback.png) |
| 変換不能時のエラー | ![最終エラー](figures/bfs-visual-debug-76/1366-fallback-error.png) | ![最終エラー](figures/bfs-visual-debug-76/390-fallback-error.png) |
| 上限での打ち切り | ![打ち切り](figures/bfs-visual-debug-76/1366-truncated.png) | ![打ち切り](figures/bfs-visual-debug-76/390-truncated.png) |

![記録を返せない時間切れ](figures/bfs-visual-debug-76/1366-timeout.png)
