# DFS「動きとコードの対応」

- 目的・適用範囲: Issue #124。DFSの同じ実行過程をコードと重ねて再生する単品教材。
- 最終確認日: 2026-11-06。状態: 現行。
- 正本: [DFS基準データ §§2.4/7.1/9-12](../../../../../../../docs/concept/dfs-unit-baseline.md)、[教材指針・フェーズ4](../../../../../../../docs/concept/learning-materials-guideline.md)、[プレイヤーUI](../../../../../../../docs/concept/learning-player-ui.md)。
- 実装判断と検証記録: [dfs-code-mapping-124.md](../../../../../../../docs/dfs-code-mapping-124.md)。

URL: `/learning-preview/dfs-code-mapping`。通常のfront開発サーバーなら`http://localhost:3000/learning-preview/dfs-code-mapping`。認証・DB不要。

`dfsCode.ts`は`dfs-order-stack` v1、12行の意味IDと本文を定義する。改行はLF、末尾改行なし。基準書§7.1と空白を含めて照合する。BFSと共通の`code/CodeDisplay.tsx`へ本文をそのまま渡し、コード全体と実行行の強調を表示する。

`codeMapping.content.ts`は宣言の1フレーム＋実際に実行される67行の計68フレーム。while/forの反復・終了判定、ifの不成立も飛ばさない。17個のチェックポイントは元のDFS実行教材を参照し、グラフ・座標・辺・既存スナップショットを変更しない。

変数はstart/node/neighbor/stack/visited/order。未代入は「—」、リストは`[]`、visitedは集合の`{}`で区別する。集合に順序を持たせないため、visitedの表示だけ基準ノード順に正規化する。変化した値は、その直前フレームとの差から背景ハイライトを決め、逆送りや任意シークでも同じ表示になる。

`codeMapping.presentation.ts`の投影は、popとorder.appendの間、visited.addとstack.appendの間も実変数を表示する。pop直後は処理中のノードとスタックが変わり、orderには次の行まで追加しない。visited.add直後は集合だけ更新し、次の行までスタックへ入れない。17個のチェックポイントでは元の図の状態と完全一致する。`DfsExecutionCanvas`の任意view以外は、通常再生・設問の呼び出しを変えていない。

表示は左に共通の図、右にコードと変数、下に共通LearningPlayerの操作系を置く。教材枠84vw×84dvh、コード16px以上、図は縦横比を維持する。小画面では図＋コード領域の内部だけを横スクロールする。図・コード・値の遷移は600ms、reduced-motionでは停止。自動送りは3500ms。

確認箇所:

| 位置 | 確認する動作 |
| --- | --- |
| 8/68 | Aの隣を逆順にCから取り出し、Bを先に取り出せる理由を伝える |
| 10→11/68 | Cをvisitedへ先に記録してからstackへ入れる |
| 42→43/68 | Fを取り出したあとにorderへ記録する |
| 45/68 | Eはスタック内でも発見済みなので、重ねて追加しない |
| 48→50→51/68 | Fの追加なし→残っていたEの取り出し→Eをorderへ記録 |
| 68/68 | A,B,D,F,E,Cを返し、スタックが空で全ノードが完了する |

再生・一時停止・前後ボタン・スライダー・左右キー・Home/Endで操作できる。専用リザルトや次段階への接続は出さない。

`npm run verify:dfs-code-mapping`は実CPythonで、表示と同じコードを改変せず実行する。全67実行行と変数、12行のバイト一致、17参照とその図、行の間の中間状態、変更変数、SSRの表示本文・ハイライト、不正状態の拒否を検証する。Python 3が必要（既定python3、別名は環境変数PYTHON）。関連するDFS全verify・BFS全verifyも回帰確認する。

§9-12の教え方は、別の反例グラフを足さず、同じ実行に同期したキャプションで説明する案を採った。採用案・字下げの補足は実施記録とPRに明示する。アプリ組み込み・進捗・学習ログ保存は対象外。DB・seed適用不要。


> 2026-11-12: 単元固有ファイルは `learning/units` へ移動。共通部品・画面・フックの現行配置と検証範囲は[移行作業記録](../../../../../../../docs/frontend-migration-progress.md)を参照。
