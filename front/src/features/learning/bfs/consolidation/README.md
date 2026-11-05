# BFS フェーズ6「応用・総括」

- 目的: Issue #74 の転移2問・境界ケース2問・Parsons 1問を、初回結果の診断と任意復習まで単品で操作する。
- 適用範囲: フェーズ6のコンテンツ、共通assessmentの診断・選択・並び替え、単品プレビューと検証。状態: 現行。最終確認日: 2026-11-05。
- 起点: `develop` `bb64e28`（PR #95 マージ済み）。
- 正本: [教材指針 §1・フェーズ6](../../../../../../docs/concept/learning-materials-guideline.md)、[UI定義 §2.3](../../../../../../docs/concept/learning-player-ui.md)、[要約](../../../../../../docs/concept/learning-materials-v2.md)、[Issue #74](https://github.com/BeppuKanato/engineer-quest/issues/74)。
- 確認画像・検証記録: [実装報告](../../../../../../docs/bfs-consolidation-74.md)。

## 確認方法

`front/` で `npm ci` → `npm run dev` を実行し、起動したマシンのブラウザで `http://localhost:3000/learning-preview/bfs-consolidation` を開く。ログイン・DB・バックエンドは不要。
production buildでは `npm run build` 後に `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000`。
クラウドマシンのlocalhostは、手元のPCから直接開ける共有URLではない。

1. 問1は出発点Fの基準グラフ。Bなどで誤答にすると、任意復習・その場の再回答・「次の問題へ」を選べる。Aが正解。
2. 問2はG〜Lの新しいグラフ。「Jの隣を調べ終えた直後」を問い、K → Lが正解。
3. 問3は孤立したZを追加した図。「距離は決まらず、結果にも入らない」が正解。
4. 問4は出発点Aの基準グラフ。「0のまま。すでに決まっているので、追加も更新もされない」が正解。
5. 問5は固定順に提示された11行が1つのリストに並んでいる。↕ハンドルのドラッグ、または↑↓ボタンでその場で並び替え、リセットで提示順に戻せる。いつでも回答でき、元の`bfsCode`の行順（初期化2行は入れ替え可）が正解。
6. 問5の回答後に「診断結果を見る」を押す。初回正解数と5タグの初回正誤、不正解タグの復習ボタン、自力実装への予告を確認する。
7. 全問誤答のままでも結果へ進める。誤答後に正解へ修正しても、その問の初回不正解は診断に残る。再読込で全状態を初期化する。

ノードは常時破線枠、選択肢とParsonsの行は常時青い枠で選択可能と示す。操作指示は各問で常時表示する。Tab＋Enter／Spaceでも回答できる。
図の設問はフェーズ3と同じ84vw × 84dvh（最小高さ500px）の枠で、キャプション・選択肢等を除く残りの高さを図へ割り当てる。共通SVGの等倍比は維持する。
Parsonsは全行を1つのリストで提示し、その場で並び替える（Issue #97で2リスト方式から再設計）。コードはフェーズ4と同じ左揃え・等幅・`clamp(16px, 1vw, 18px)`・行高1.8と元のインデント。1366px幅では最長行を含めて横スクロール不要、390px級ではコード列内だけ横スクロールできる。
並び替えは既存framer-motionのReorderで600msのレイアウトアニメーションを付ける。ドラッグ操作はハンドルだけで開始する。ハンドルはタッチ対応、↑↓ボタンはキーボードでも操作でき、動きを減らす設定ではアニメーションを省略する。並び替えたコードを実行して結果を確認する機能は、フェーズ7の視覚的デバッグ（#76）の設計と合わせて判断するため、ここでは入れていない。

## データと共通基盤

`consolidation.content.ts` に設問・選択肢・正解・タグ・操作指示・正誤文・復習先を、`consolidation.graphs.ts` に追加グラフを分離する。

| 設問ID | 論点タグ | 図・正解 | フェーズ4の復習フレーム |
| --- | --- | --- | --- |
| `last-from-f` | 処理順序の追跡 | 基準グラフ・出発点F、最後はA | `while-c` → `execution-dequeue-c` |
| `queue-after-j` | キューの状態の追跡 | G〜L、K → L | `assign-d-f` → `execution-discover-f` |
| `unreachable-z` | たどり着けない場所の扱い | 基準グラフ＋Z(530,330)、結果に入らない | `while-empty` → `return-distances` |
| `start-already-discovered` | 距離が決まった場所の扱い | 基準グラフ、Aは0のまま | `for-b-a` → `if-b-a` |
| `whole-code-order` | コード全体の流れ | bfsCode全11行の順序一致（初期化2行は交換可） | フェーズ4の全62フレーム |

問1・4は`bfsGraph`そのものを参照し、問3は基準ノードにZだけを追加し辺は同じ参照。問2は基準と同じ座標にG〜Lを割り当て、指定順の辺 G-H / G-I / H-J / I-J / I-K / J-L / K-L を使う。
描画は既存の`GraphEdges`・`GraphNodes`・`GraphViewport`と`graphGeometry`を使い、出発点の注記とノードのタップ領域だけを重ねる。共通描画・基準グラフは変更しない。色は既存`playerTokens`のみ。

Parsonsの行本文・インデントは`bfsCode`（id `bfs-distances-deque`、version 1）を直接参照する。本文・意味ID・versionは変更しない。提示順はIssue指定の意味ID列、正解は元の行順であり、表示行番号で照合しない。
PR #96のレビューにより、問5の`interchangeableLineGroups`に`initialize-distances`／`initialize-queue`を指定した。共通assessmentはParsons回答だけを対象に、隣接するグループ内の順序を正解順へ正規化して比較する。グループ外の順序は厳密に見て、`assign-distance`→`enqueue-neighbor`は固定する。グループ未指定時は完全一致。試行記録には正規化前の実際の回答順を保存し、診断の初回結果の扱いは変えない。

共通`assessment.ts`に`ChoiceQuestion`・`ParsonsQuestion`・順序回答と`diagnostic-check`を追加した。進行、回答検証、全試行と初回正誤の記録を共通基盤で扱う。
診断型だけは回答後に明示的な次へ操作を許可し、正解を進行条件にしない。再挑戦を選べるよう、回答直後に自動で次問へ進めない。最後の回答後も任意で再挑戦してから結果を表示できる。フェーズ3・5は従来の全問正解条件を保つ。
`ParsonsBoard`のローカル状態は未送信の並び（初期値は提示順）だけで、採点・試行記録・完了状態は持たない。

復習は共通`LearningReviewDialog`にフェーズ4の元フレームを渡し、`BfsCodeMappingCanvas`で図＋コードを表示する。出題条件を使った解答アニメーションは作らず、基本例の規則を確認する。開くのは誤答後または診断の不正解タグのボタンを押した場合だけ。閉じても回答状態と初回結果は残る。

## 問2の基準データの修正

指定の辺順で実行すると、Jを取り出した瞬間のキューはKのみ。Jの隣を調べてLを末尾へ追加した後がK → Lになる。
ユーザー確認により、設問を「Jの隣を調べ終えた直後」に修正し、正解K → Lとグラフ・選択肢を維持した。検証は両時点を区別する。

## 検証

`front/`で以下を実行する。

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
```

新verifyは独立したBFSで全4問の距離・取り出し順・キューを再計算し、未到達Zの不在・Aの距離不変と再追加なしを確認する。
Parsonsの固定提示順・全11行の順列・正解順との相違・本文とインデント、共通グラフの描画数値と比率、元の復習フレームへの参照も確認する。
共通セッションでは全問誤答で完了、再挑戦後も初回結果を保持、全問正解・混在結果、未回答での次へや古い回答・不完全／重複した並びの拒否を検証する。
PR #96の追加検証では、初期化2行の交換のみ正解であること、他の隣接行の交換はすべて不正解であること、グループ未指定時の完全一致、存在しない行・重複・非隣接・重なるグループの拒否も確認する。

DB適用なし。アプリ組み込み、Mission/Activity、進捗・ログ保存、他フェーズの実装・フェーズ間接続は対象外。
