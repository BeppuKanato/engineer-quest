# Issue #124 DFS「動きとコードの対応」実装記録

- 目的: 同じDFS実行の図・コード行・変数を同期させ、スタック形コードの役割を確認できるようにする。
- 適用範囲: DFS第4段階の単品プレビュー、共通コード表示、コード契約の字下げの明確化。状態: 記録。
- 最終確認日: 2026-11-06
- 起点: PR #193マージ後の最新develop `a9c615e669859c77ac651e4ff6fa97382dfe9006`、ブランチ`feat/dfs-code-mapping-124`。
- 対象コミット: コード契約・共通表示 `b6b8b46`、68フレームと検証 `e0a5acd`。
- 正本: [Issue #124](https://github.com/BeppuKanato/engineer-quest/issues/124)、[DFS基準データ §§2.4/7.1/9-12](concept/dfs-unit-baseline.md)、[教材指針](concept/learning-materials-guideline.md)、[プレイヤーUI](concept/learning-player-ui.md)。

## 実装

`front/src/features/learning/dfs/code-mapping/`にBFSと同じcode/content/types/presentation/Canvas/Previewの構成を置き、`/learning-preview/dfs-code-mapping`を追加した。表示名は共通名「動きとコードの対応」。アプリ組み込みや保存ポートは付けず、LearningPlayerだけで単品の再生を完結させる。

コード契約は`dfs-order-stack` v1。基準書の12行・意味IDを`dfsCode.ts`で固定し、表示にはその本文をそのまま渡す。既存BFSの表示を`learning/code/CodeDisplay.tsx`へ切り出し、BFS側は既存の型・表示名・空欄指定のラッパーを維持する。BFS/DFSでコードの強調・減光・文字サイズ下限・reduced-motion対応を共有する。

68フレームは宣言の1コマと、関数呼び出しで実行される67行の完全状態。制御行のwhile/forの反復・終了、ifの不成立も含む。訪問順は元の実行教材のpopを参照し、隣接順は共有グラフから取得する。基準書§2.4の対応に従い、元の17チェックポイントを順に保持する。

各フレームは元の実行ステップへの参照、実行行の意味ID、実変数、動作型、neighborの確認中かどうかを持つ。pop→order.appendの間はstackから取り出してもorderにはまだ記録しない。visited.add→stack.appendの間も発見済み集合だけが先に変わる。こうした中間状態は実変数を共通DFSキャンバスへ投影し、チェックポイントの図を未来の状態として先に見せない。元スナップショットは変更せず、全17チェックポイントで図と実行教材が一致する。

右の変数表示はstart/node/neighbor/stack/visited/orderの6行。未代入は「—」、リストと集合の表示を分ける。visitedは順序を持たないので、表示だけ基準ノード順A〜Fで安定化し、訪問順A,B,D,F,E,Cとは区別する。値の変更はそのフレームの直前との差から導出し、再生経路に依存させない。

教材枠は84vw×84dvh、左の図は共通GraphDrawing/graphGeometryの配置・比率、右はコード16px以上。1366×768ではコードと6変数を同時表示できる。小画面はBFSの先例と同じく、図＋コードの領域内だけで横スクロールし、文字を縮小しない。図・コード・値の変化は600ms、reduced-motionでは0ms/transitionなし。自動再生は3500ms。

## 基準書の補足とレビュー対象の採用案

1. **§7.1の字下げ**: 元の表はすべて1空白に省略されており、そのままでは実行可能なPythonにならない。#122の検証ですでに復元している4空白単位のブロック構造へ、表の字下げも明記した。行本文・意味ID・処理順は変えていない。基準書・表示・実行コードは改行LF/末尾改行なしでバイト単位に照合する。
2. **§9-12の教え方**: 別の説明用グラフ・反例実行は追加せず、同じ実行過程のキャプションで理由を説明する案を採用した。Aの逆順C→B投入で「Bを先に取り出すため」と示し、visited.addでは「重ねて入らないよう先に記録」と伝える。Fがスタック内のEを確認する実際の不成立条件では、Eは入れる前に記録済みだから重ねて追加しないと説明する。別例を追加する設計変更は行っていない。この案で理由が十分伝わるかはPRのレビュー対象とする。
3. **§2.4のpop対応**: phase2の取り出しはorderへの記録までを1コマにまとめている。phase4ではpop行を独立させ、元の完全状態と一致するチェックポイントはappend-orderの直後に置く。図・変数の同期を優先し、当該コマのキャプションも「訪問順へ記録する」という行の役割に合わせる。元の教材のキャプション自体は変更しない。
4. **終了後**: 教材指針#141の現行規定に従い、リザルト・予告・次段階への接続は追加しない。単品はorderの返却で終わる。

## 検証

- `npm run lint` / `npm run typecheck` / `npm run build`: 成功。既存lint警告2件（BfsCodeCheckPreviewのretry、BfsUnitPreviewのuseCallback依存）のみ。
- `verify:*`全23本: 成功。DFS導入・17ステップ・確認問題・今回のコード対応、BFS全10本、共通プレイヤー・正誤提示・学習画面等を含む。WindowsではPYTHONにインストール済みPython、PYTHONUTF8=1を指定。
- 追加`verify:dfs-code-mapping`: 基準書§7.1の12行と意味ID、表示文字列のバイト一致。表示と同じコードを実CPythonで改変せず実行し、sys.settraceの観測から全67行・全6変数を照合。最終order、全68コマ、17チェックポイントの参照同一性と図、制御行の通過、逆順投入・mark-at-pushの説明、値変更、中間状態、逆順復元、不正状態の拒否を確認する。
- React SSRで12行の表示本文・唯一の実行行、図と変数、単品の操作系を確認。BFSの空欄表示・実行トレースも既存verifyで維持を確認。
- Chrome本番ビルドで1366×768と390×844を確認。10→11、42→43、45、最終68の図・コード・変数、前後送り・Home/End・シーク・自動送り後の末尾停止を確認。1366pxではコードと変数パネルの縦スクロール不要（clientHeight/scrollHeightとも484px）。
- 390px幅はページの横/縦あふれなし（390×844）。教材内部だけ横スクロール可能、コード文字16px。共通化後のBFS穴埋めの空欄表示も確認。コンソール警告・エラーなし。
- 未実施: OSのreduced-motion設定切り替えによる目視、タッチ実機・他ブラウザ。停止分岐は静的verifyで確認した。

## 確認方法

起動済みの作業環境: `http://localhost:3124/learning-preview/dfs-code-mapping`。通常のfront開発サーバー: `http://localhost:3000/learning-preview/dfs-code-mapping`。認証・バックエンド不要。

1. 再生・前/次・スライダー・左右キー・Home/Endで68フレームを操作する。左の図・右の実行行・下の変数が同期する。
2. 10/68でvisitedにCが入りstackは空、11/68でstackへCが入ることを見る。8/68〜15/68で逆順C→B投入と、Bが先に取り出される関係を確認する。
3. 42/68でFを取り出してもorderはA,B,Dのまま、43/68でFがorderへ記録されることを見る。
4. 45/68でFの隣Eはスタック内だがvisitedに記録済みで、重ねて追加されないことを見る。48/68の追加なしから50/68のE取り出し、51/68のorderへの記録を確認する。
5. Endで68/68へ移動し、空のstackと返却するA,B,D,F,E,Cを確認する。前へ戻して同じ状態を復元できる。
6. 小画面は教材内の横スクロールでコード側へ移動する。同じサーバーの`/learning-preview/bfs-code-mapping`と`/learning-preview/bfs-code-check`でも共通表示を確認できる。

アプリ組み込み・進捗・学習ログ保存・他段階との接続は対象外。DB・seedの変更および適用は不要。
