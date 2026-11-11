# Engineer Quest ドキュメント索引

この索引は、`docs/` 配下の全ドキュメントの状態と使い分けを示す。作業前にリポジトリルートの `AGENTS.md` を読み、ここで対象文書の状態を確認すること。

- 分類確認日: 2026-11-04
- 分類の基準コミット: `develop` `b37a67e27aa4eec5511c636fa1b363b92cc1afa0`
- 状態の意味:
  - **正本**: その領域の判断に使う現行の基準。
  - **現行**: 現在も使う手順・仕様。
  - **記録**: 特定時点の設計・実装の経緯。現在の仕様判断には直接使わない。

## 実装ルール・運用

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [development-rules.md](development-rules.md) | 正本 | フロント、バック、API、Prisma、seed、検証の実装ルール |
| [development-cloud-run.md](development-cloud-run.md) | 現行 | develop 用 Cloud Run の構成、デプロイ、確認手順 |

## 学習設計

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [concept/learning-materials-guideline.md](concept/learning-materials-guideline.md) | 正本（全文） | アルゴリズム学習教材・汎用設計ガイドラインの全文。編集の原典は Google Drive の文書で、確定した内容を取り込んだもの |
| [concept/learning-materials-v2.md](concept/learning-materials-v2.md) | 要約 | 7フェーズ新フローの確定事項と実装上の含意。全文は `learning-materials-guideline.md` |
| [concept/learning-player-ui.md](concept/learning-player-ui.md) | 正本 | 学習プレイヤー UI の実装定義（画面構成と占有率、色とテキストの規則、操作系の配置、アニメーション、共通グラフの描画数値と等倍比の拡縮） |
| [concept/dfs-unit-baseline.md](concept/dfs-unit-baseline.md) | 正本 | DFS 単元の基準データ設計書（グラフ、実行トレース、各フェーズの問題、正解コード契約 dfs-order-stack、テスト、知識カード案）。実装（#121 以降）は本書を正本として参照する |
| [concept/wall-extension-unit-baseline.md](concept/wall-extension-unit-baseline.md) | 正本 | 棒倒し法単元の基準データ設計書（9×9主教材の検証済みトレース、参照コード契約 wall-extension-v1、各フェーズの問題、グリッド描画基盤、知識カード案）。実装（#206 以降）は本書を正本として参照する |
| [concept/bubble-sort-unit-baseline.md](concept/bubble-sort-unit-baseline.md) | 正本 | バブルソート単元の基準データ設計書（主教材 [4, 2, 5, 1, 3] の検証済みトレース、参照コード契約 bubble-sort-v1、各フェーズの問題、配列描画基盤、知識カード案）。実装（#227 以降）は本書を正本として参照する |
| [concept/maze-digging-unit-baseline.md](concept/maze-digging-unit-baseline.md) | 正本 | 穴掘り法単元の基準データ設計書（9×9主教材の検証済みトレース、参照コード契約 maze-digging-v1、各フェーズの問題、グリッド描画基盤の再利用、知識カード案）。実装（#257 以降）は本書を正本として参照する |
| [concept/binary-search-unit-baseline.md](concept/binary-search-unit-baseline.md) | 正本 | 二分探索単元の基準データ設計書（主教材 [3,7,12,19,25,31,42] で 25 を探す検証済みトレース、参照コード契約 binary-search-v1、各フェーズの問題、配列描画基盤の再利用、知識カード案）。実装（#286 以降）は本書を正本として参照する |
| [concept/greedy-coins-unit-baseline.md](concept/greedy-coins-unit-baseline.md) | 正本 | 貪欲法（硬貨問題）単元の基準データ設計書（主教材 786円の検証済みトレース、参照コード契約 greedy-coins-v1、各フェーズの問題、硬貨描画基盤、知識カード）。実装（#380 以降）は本書を正本として参照する |
| [concept/app-ui-ux-guideline.md](concept/app-ui-ux-guideline.md) | 正本 |
| [concept/mascot-presentation-guideline.md](concept/mascot-presentation-guideline.md) | 正本 | 相棒マスコットの提示指標（サイズ4段階、切り抜き、接地処理、配置場面、表情の使い分け、動き）。絵柄は現行を前提とし、学習導線には置かない | アプリ全体の UI/UX 方針（情報設計と入口導線、進捗表示、知識カード、演出とゲーム的な UI の定義、実績・報酬、色・トークン、骨格、フィードバック提示の境界）。#78 と旧フロー削除の設計前提 |
| [学習プレイヤーの土台](../front/src/features/learning/player/README.md) | 現行 | Issue #68 の再生契約、局所トークン、仮教材と単品プレビューの確認方法 |
| [BFS フェーズ1](../front/src/features/learning/bfs/motivation/README.md) | 現行 | Issue #69 の場面列、用語表、単品確認方法、サンプル・指針との判断点 |
| [DFS 導入](../front/src/features/learning/dfs/motivation/README.md) | 現行 | Issue #121の宝探し18場面、BFSと共有する迷路・グラフ、A→B→D→F→E→Cの歩行と確認手順 |
| [DFS 動きの説明](../front/src/features/learning/dfs/execution/README.md) | 現行 | Issue #122の17ステップ、共有グラフ、スタックと訪問順、Python実行トレース検証と確認手順 |
| [DFS 動きの確認問題](../front/src/features/learning/dfs/check/README.md) | 現行 | Issue #123の連動2問（F/E）、共通assessmentと回答操作面、任意復習・初回結果・確認手順 |
| [DFS 動きとコードの対応](../front/src/features/learning/dfs/code-mapping/README.md) | 現行 | Issue #124の68フレーム、コード契約、17場面への参照、実Pythonとの全行照合・確認手順 |
| [BFS フェーズ2](../front/src/features/learning/bfs/execution/README.md) | 現行 | Issue #70 の19ステップ、フェーズ3・4で使う実行状態契約、単品確認・機械検証と共有グラフの判断点 |
| [BFS フェーズ3](../front/src/features/learning/bfs/check/README.md) | 現行 | Issue #71 の連動2問、共通の進行・回答記録、任意復習、単品確認と検証方法 |
| [BFS フェーズ4](../front/src/features/learning/bfs/code-mapping/README.md) | 現行 | Issue #72 のコード本文・意味ID契約、62フレーム、フェーズ2参照、単品確認とPythonトレース検証 |
| [BFS フェーズ5](../front/src/features/learning/bfs/code-check/README.md) | 現行 | Issue #73 の独立した穴埋め2問、共有コード表示・設問セッション・任意復習、結果と確認手順 |
| [BFS フェーズ6](../front/src/features/learning/bfs/consolidation/README.md) | 現行 | Issue #74 の転移・境界ケース・Parsonsの5問、初回結果のタグ別診断、任意復習とソフトゲート。全単元のParsons誤答時の表示は [UI定義 §5.2](concept/learning-player-ui.md#52-質問画面の3段組)（#352） |
| [BFS 視覚的デバッグ](../front/src/features/learning/bfs/trace/README.md) | 現行 | Issue #76 のD1限定トレース・共通キャンバス再生・停止／上限／最終状態と対応範囲 |
| [BFS フェーズ7](../front/src/features/learning/bfs/implementation/README.md) | 現行 | Issue #75／PR #99 の5テスト・4段階ヒントと、Issue #110 のダークエディタ・D1フリー実行・確認手順 |
| [BFS 単元フロー](../front/src/features/learning/bfs/unit/README.md) | 現行 | Issue #77 のフェーズ1〜7の接続、遷移3類型、リザルト画面、単元内ナビゲーションと確認手順 |

従来フロー（Course / Mission / Activity）の学習設計文書、概念・設計検討文書、コース設計記録は、2026-11-04 の判断で削除した。従来フローの現在の挙動と教材内容は、実行コード、Prisma schema、seed を正とする。

## 実装報告

| 文書 | 状態 | 用途 |
| --- | --- | --- |
| [dfs-motivation-121.md](dfs-motivation-121.md) | 記録 | Issue #121のDFS導入、共通描画の抽出、18場面と訪問順の検証、基準案の留保 |
| [dfs-execution-122.md](dfs-execution-122.md) | 記録 | Issue #122のDFS動きの説明、BFS/DFS共有グラフの切り出し、17状態のPython実行照合と確認手順 |
| [dfs-check-123.md](dfs-check-123.md) | 記録 | Issue #123のDFS理解度確認、回答操作のBFS/DFS共通化、現行ソフトゲートと旧基準書の差・検証・確認手順 |
| [dfs-code-mapping-124.md](dfs-code-mapping-124.md) | 記録 | Issue #124の全行と図の同期、字下げの明確化、逆順投入・mark-at-pushの説明案、検証と確認手順 |
| [dfs-code-check-125.md](dfs-code-check-125.md) | 記録 | Issue #125のDFSコード穴埋め2問、既存フレームでの復習、初回スコアと確認手順 |
| [dfs-consolidation-126.md](dfs-consolidation-126.md) | 記録 | Issue #126のDFS応用5問、固定行つき並び替え、論点別診断と確認手順 |
| [dfs-implementation-127.md](dfs-implementation-127.md) | 記録 | Issue #127のDFS実装課題、共通エディタ、5ケースと段階式ヒント、確認手順 |
| [dfs-trace-128.md](dfs-trace-128.md) | 記録 | Issue #128のDFSコード再生、17場面との実行照合、途中停止と最終結果 |
| [dfs-unit-129.md](dfs-unit-129.md) | 記録 | Issue #129のDFS単元プレビュー、7段階の接続、BFSとの単元コンテナ共通化 |
| [dfs-app-130.md](dfs-app-130.md) | 記録 | Issue #130のDFSコース入口、進捗と再開、カード3枚・実績、DB適用手順 |
| [answer-feedback-146.md](answer-feedback-146.md) | 記録 | Issue #146の共通正誤表示・既存効果音・一度きりのモーション、進行との分離、検証と各画面の確認手順 |
| [phase-result-praise-144.md](phase-result-praise-144.md) | 記録 | Issue #144のフェーズ3・5共有リザルトの短い紙吹雪・到達モーション・初回成績別の称賛と検証・確認手順 |
| [phase-result-visuals-165.md](phase-result-visuals-165.md) | 記録 | Issue #165のフェーズ系リザルト視覚強化（称賛文の削除、到達図とスコアドット、フェーズ6結果画面の行カード化と「診断」から「結果」への文言統一） |
| [unit-final-result-150.md](unit-final-result-150.md) | 記録 | Issue #150の単元最終リザルト視覚強化（一段強い紙吹雪、全灯ミニマップ、要約タイル、実績のコンパクト要約、獲得カードのタイル表示） |
| [achievement-presentation-333.md](achievement-presentation-333.md) | 記録 | Issue #333の実績提示の再設計（解除されたフェーズの結果画面に実績バンド、最終リザルトに「新しい実績」ゾーン、切れ目ダイアログはカード専用化） |
| [mainstream-layout-results-298.md](mainstream-layout-results-298.md) | 記録 | Issue #298の主流レイアウト移行 第1弾（結果・ブリッジ・最終結果のスクロールを単元コンテナのラッパーに一元化） |
| [mainstream-layout-phase6-298.md](mainstream-layout-phase6-298.md) | 記録 | Issue #298の主流レイアウト移行 第2弾（フェーズ6の3段組化、図の固定高、Parsons窓の固定高368px、通知の固定ゾーン化） |
| [mainstream-layout-phase3-298.md](mainstream-layout-phase3-298.md) | 記録 | Issue #298の主流レイアウト移行 第3弾（フェーズ3の3段組化、キャンバスの固定高枠、下部固定ゾーン） |
| [mainstream-layout-phase5-298.md](mainstream-layout-phase5-298.md) | 記録 | Issue #298の主流レイアウト移行 第4弾（フェーズ5の3段組化、コード窓の固定高320px、下部固定ゾーン） |
| [mainstream-layout-migration-298.md](mainstream-layout-migration-298.md) | 記録 | Issue #298の主流レイアウト移行の総括（全5弾の内訳、置き換えた旧契約、単品プレビューの同型性） |
| [phase-bridge-141.md](phase-bridge-141.md) | 記録 | Issue #141のフェーズ間ブリッジ追加（全遷移に目標提示のステップを統一、リザルト予告の廃止、教材指針の遷移モデル改訂） |
| [question-flow-softgate.md](question-flow-softgate.md) | 記録 | 確認問題のソフトゲート統一（フェーズ3・5でも「次の問題へ」で進行可能に）とフェーズ6の正解後固定、教材指針の完了定義改訂 |
| [player-transport-140.md](player-transport-140.md) | 記録 | Issue #140のプレイヤー操作系の中央寄せ・拡大（UI定義§3の改訂）と出現ボタンのフェードイン |
| [unreachable-review-182.md](unreachable-review-182.md) | 記録 | Issue #182のフェーズ6「たどり着けない場所」の復習先の修正（発見の関門ステップへの差し替え） |
| [create-work-align-184.md](create-work-align-184.md) | 記録 | Issue #184の作る画面3カラムのカード上端揃え（要件カラムの外付け見出しを撤去） |
| [home-target-achievement-183.md](home-target-achievement-183.md) | 記録 | Issue #183の目標実績のホーム表示（API既存の targetAchievement を左カラムに描画） |
| [phase5-preview-unify-181.md](phase5-preview-unify-181.md) | 記録 | Issue #181のフェーズ5単品画面のフェーズ3単品への統一（再回答の合図とボタンの出方） |
| [phase7-result-presentation-180.md](phase7-result-presentation-180.md) | 記録 | Issue #180のフェーズ7テスト結果の作り直し（通過ごとの描き込みチェックと全通過時の祝福） |
| [phase5-layout-completion-317.md](phase5-layout-completion-317.md) | 記録 | Issue #317/#315のフェーズ5レイアウト組み替え（コードのみスクロール・選択肢とボタンの下部固定）とフェーズ3・5完了ビューのバイパス（保存を待たず結果画面へ即時遷移） |
| [unit-overview-card-badge-178.md](unit-overview-card-badge-178.md) | 記録 | Issue #178の単元画面ステージからの知識カード予告バッジ撤去 |
| [feedback-learning-flow-202.md](feedback-learning-flow-202.md) | 記録 | Issue #202のフィードバックの学習フロー接続（トリガー・カタログ単元対応・先行生成） |
| [feedback-model-terra-280.md](feedback-model-terra-280.md) | 記録 | Issue #280のフィードバック生成モデルの既定値変更（gpt-5.4-mini → gpt-6.1-terra、料金試算と判断根拠） |
| [feedback-composition-332.md](feedback-composition-332.md) | 記録 | Issue #332のフィードバック構成の見直し（Sadler／Hattie & Timperley に照らした表示文章の要件・合計200〜300字の目安・reason の表示、purpose は内部用） |
| [big-goal-model-365.md](big-goal-model-365.md) | 記録 | Issue #365の大目標データモデルと達成判定基盤（Prismaモデルとmigration、到達型・実績型・応用型の条件評価、進捗の部分充足計算、学習保存時へのフック） |
| [big-goal-proposal-366.md](big-goal-proposal-366.md) | 記録 | Issue #366の大目標の候補生成・適合度採点・提案API（タイミングA/Bのルール、gpt-6.1-terra固定の採点とコードブック、検証ログ、合意による確定と再検証） |
| [big-goal-ui-367.md](big-goal-ui-367.md) | 記録 | Issue #367の大目標の設定UIとホーム表示（単元開始時の目標設定ゲート、本命＋2件の候補表示と合意操作、ホームのバナーと履歴表示、進捗はAPIの計算結果をそのまま表示） |
| [feedback-big-goal-input-368.md](feedback-big-goal-input-368.md) | 記録 | Issue #368のフィードバック生成入力への大目標統合（分析段へ表示文・達成条件・進捗の内訳を渡し、currentStateを大目標に対する位置として書かせる。PROMPT_VERSION更新とverify追随） |
| [feedback-dedicated-screen-369.md](feedback-dedicated-screen-369.md) | 記録 | Issue #369のフィードバック専用画面（結果画面の付属ボックスから独立した画面への移行、現在位置の図と大目標の進捗表示、保存レスポンスへの達成した大目標の追加と達成時の次の目標の提案（タイミングB）、#299の切り分け） |
| [big-goal-celebration-370.md](big-goal-celebration-370.md) | 記録 | Issue #370の大目標の称賛演出の統合（結果画面の紙吹雪・歓声を最大級へ引き上げる一元化、単元完了と重なる達成は最終リザルトへ統合、結果画面の無いフェーズからの持ち越し、達成バンド／ゾーンの提示） |
| [binary-search-baseline-import-285.md](binary-search-baseline-import-285.md) | 記録 | Issue #285の二分探索単元の基準データ取り込み |
| [greedy-coins-baseline-import-380.md](greedy-coins-baseline-import-380.md) | 記録 | Issue #380の貪欲法（硬貨問題）単元の基準データ取り込み |
| [greedy-coins-figure-381.md](greedy-coins-figure-381.md) | 記録 | Issue #381の貪欲法（硬貨問題）硬貨図基盤（額面列・残額・トレイの盤面型と描画）とフェーズ1（導入）7場面、配置を基準設計 §4 に従い単元側に置いた判断などの留保 |
| [greedy-coins-phase2-382.md](greedy-coins-phase2-382.md) | 記録 | Issue #382の貪欲法（硬貨問題）フェーズ2（動きの説明）11ステップ（主教材786円、1ステップ＝硬貨1枚）、基準データのキャプション2文表記を1文へ圧縮した留保 |
| [greedy-coins-phase3-383.md](greedy-coins-phase3-383.md) | 記録 | Issue #383の貪欲法（硬貨問題）フェーズ3（動きの確認問題）連結2問（残額86の場面で次に選ぶ硬貨のタップと、なぜ100でなく50かの4択）、Q1の回答対象を全額面とした判断 |
| [greedy-coins-phase4-384.md](greedy-coins-phase4-384.md) | 記録 | Issue #384の貪欲法（硬貨問題）フェーズ4（動きとコードの対応）44フレーム（実行行43＋定義1、チェックポイントは append 行9回）、チェックポイントフレームの remaining が次の行で盤面と一致する留保 |
| [greedy-coins-phase5-385.md](greedy-coins-phase5-385.md) | 記録 | Issue #385の貪欲法（硬貨問題）フェーズ5（コードの確認問題）独立2問（while の条件＝ remaining、残額の更新＝ coin）、選択肢を変数名3択で統一した判断 |
| [greedy-coins-phase6-386.md](greedy-coins-phase6-386.md) | 記録 | Issue #386の貪欲法（硬貨問題）フェーズ6（応用問題）4問（転移タップ・反例トレース・反例の理解・フェード型 Parsons）、Parsons の append／subtract 行を互換グループとして実装した判断 |
| [greedy-coins-phase7-387.md](greedy-coins-phase7-387.md) | 記録 | Issue #387の貪欲法（硬貨問題）フェーズ7（自分で実装）テスト5件（判定用に反例 J4 を含む）、入力レベル3段階のテンプレートを基準設計のコードブロックどおりとした判断、視覚デバッグ未接続（#388）の留保 |
| [greedy-coins-trace-388.md](greedy-coins-trace-388.md) | 記録 | Issue #388の貪欲法（硬貨問題）の視覚デバッグ、共有ハーネスへの remaining・coin・amount 記録の加算、フェーズ2正準11コマとの完全一致、選択の確定は記録と残額更新がそろったイベントで行う留保 |
| [greedy-coins-unit-389.md](greedy-coins-unit-389.md) | 記録 | Issue #389の貪欲法（硬貨問題）単元コンテナと学習フロー接続、アプリ登録（unitRegistry / LearningScreen）、結果図（786円・9枚）、コースシードは #390 で追加する留保 |
| [greedy-coins-integration-390.md](greedy-coins-integration-390.md) | 記録 | Issue #390の貪欲法（硬貨問題）統合、コース10件・カード21枚・スケジュール189行・実績66件への加算内訳、サムネイル（硬貨の図）、seed:preserve 再実行が必要な留保 |
| [binary-search-phase1-286.md](binary-search-phase1-286.md) | 記録 | Issue #286の二分探索フェーズ1（導入）、数当てゲームと半分に絞る発想の6場面、検証済みトレースとの照合とプレビュー登録方法などの留保 |
| [binary-search-phase1-reply-329.md](binary-search-phase1-reply-329.md) | 記録 | Issue #329の二分探索フェーズ1の数当てゲーム、真ん中を聞く場面を「聞く」「答え」の2場面に分け、答え（50より大きい）を吹き出しとキャプションで明示（全7場面化、消えた側の色はグレー据え置き） |
| [binary-search-phase2-287.md](binary-search-phase2-287.md) | 記録 | Issue #287の二分探索フェーズ2（動きの説明）、盤面型（セル状態・lo/hi/mid）の定義、共通配列基盤の cellStatuses 拡張、キャプション圧縮などの留保 |
| [binary-search-phase3-288.md](binary-search-phase3-288.md) | 記録 | Issue #288の二分探索フェーズ3（動きの確認問題）、連結2問（セルタップ＋文章4択）、出題エンジンへの concept-check 形式追加などの留保 |
| [binary-search-phase4-289.md](binary-search-phase4-289.md) | 記録 | Issue #289の二分探索フェーズ4（動きとコードの対応）、18フレームとCPythonトレース照合、基準データの行数表記（11行/12行）などの留保 |
| [binary-search-phase5-290.md](binary-search-phase5-290.md) | 記録 | Issue #290の二分探索フェーズ5（コードの確認問題）、独立2問（mid の式・mid 自身を外す増分）、基準データの行数表記修正などの留保 |
| [binary-search-phase6-291.md](binary-search-phase6-291.md) | 記録 | Issue #291の二分探索フェーズ6（応用問題）、転移タップ・不在ケース・Parsons主要8行・前提の選択の4問、場面を共通配列基盤で持つ判断などの留保 |
| [binary-search-phase7-292.md](binary-search-phase7-292.md) | 記録 | Issue #292の二分探索フェーズ7（自分で実装）、表示用D1＋判定用J1〜J3、ヒント4段階ラダー、位置表示の新設、視覚デバッグ未接続などの留保 |
| [binary-search-trace-293.md](binary-search-trace-293.md) | 記録 | Issue #293の二分探索の視覚デバッグ、共有ハーネスへの lo・hi・mid・target 記録の加算、フェーズ2正準11コマとの完全一致、発見判定は戻り値ではなく最後の比較から行う留保 |
| [binary-search-unit-294.md](binary-search-unit-294.md) | 記録 | Issue #294の二分探索単元コンテナと学習フロー接続、アプリ登録（unitRegistry / LearningScreen）、結果図、プレビュー登録の [contentId] 方式への統一などの留保 |
| [preserving-seed-policy-282.md](preserving-seed-policy-282.md) | 記録 | Issue #282の preserve seed のモデル名誤り修正（KnowledgeCardPhaseScheduleEntry、検証とポリシーが同じ誤名を共有していた件） |
| [phase7-grading-sequence-305.md](phase7-grading-sequence-305.md) | 記録 | Issue #305のフェーズ7採点シーケンス表示（案A'、全5単元）、自動遷移の廃止と達成バナーのオーバーレイ化、Pyodide読み込みリトライ、図の高さ210/260配分を規約として留保した判断 |
| [phase7-test-list-325.md](phase7-test-list-325.md) | 記録 | Issue #325のフェーズ7テストタブ一覧主構造化（全5単元）、表示テストの図の一覧下への分離と通過時の既定閉じ、行の印のテキスト一本化、結果表示の共通コンポーネント化 |
| [phase7-input-levels-328.md](phase7-input-levels-328.md) | 記録 | Issue #328のフェーズ7入力量レベル（全部書く／骨格から書く／穴埋めで書く）の仕組みと穴掘り法への適用（PR 1）、レベル別下書き・学習ログへのレベル記録・ガイドライン7-4の追加。残り単元への展開は後続PR |
| [phase7-error-line-325.md](phase7-error-line-325.md) | 記録 | Issue #325のフェーズ7エラー行サポート（Pyodideエラーからの行番号抽出を共通化、表示文言への行番号付加、Monaco行ハイライト、文法エラー時に「printを含め1行も実行されない」旨の説明、全5単元） |
| [wall-extension-phase1-206.md](wall-extension-phase1-206.md) | 記録 | Issue #206のグリッド描画基盤と棒倒し法フェーズ1（導入）、検証済み迷路トレースとの照合と壁色の留保 |
| [wall-extension-phase2-207.md](wall-extension-phase2-207.md) | 記録 | Issue #207の棒倒し法フェーズ2（動きの説明）13ステップ、壁マスhighlightの実線枠と検証済みトレースとの照合 |
| [wall-extension-phase3-208.md](wall-extension-phase3-208.md) | 記録 | Issue #208の棒倒し法フェーズ3（動きの確認問題）連結2問、フェーズ2盤面の参照と検証済みトレースとの正解照合 |
| [wall-extension-phase4-209.md](wall-extension-phase4-209.md) | 記録 | Issue #209の棒倒し法フェーズ4（動きとコードの対応）137フレーム、CPythonトレースとの全行・全変数照合とelse行の説明フレーム |
| [wall-extension-phase5-210.md](wall-extension-phase5-210.md) | 記録 | Issue #210の棒倒し法フェーズ5（コードの確認問題）独立2問、文脈で一意化する空欄位置と設問固有の解説フィードバック、フェーズ4参照コードとの照合 |
| [wall-extension-phase6-211.md](wall-extension-phase6-211.md) | 記録 | Issue #211の棒倒し法フェーズ6（応用問題）転移タップ・性質と理由の選択・21行Parsons、完全迷路の独立検証と初回診断、ParsonsBoardの汎用化 |
| [wall-extension-phase7-212.md](wall-extension-phase7-212.md) | 記録 | Issue #212の棒倒し法フェーズ7（自分で実装）5テストと4段ヒント、試し実行の盤面表示、完全迷路の性質検証とJ3完全一致の留保 |
| [wall-extension-trace-213.md](wall-extension-trace-213.md) | 記録 | Issue #213の棒倒し法フェーズ7視覚デバッグ、フェーズ2盤面での生成過程再生と段階適用、トレース基盤へのgrid検出の最小拡張 |
| [wall-extension-unit-214.md](wall-extension-unit-214.md) | 記録 | Issue #214の棒倒し法フェーズ接続・単元コンテナ接続、フェーズ1・2・4への接続ポート追加、unitRegistry登録とLearningScreenのkind出し分け、フィードバック接続（#202） |
| [wall-extension-integration-215.md](wall-extension-integration-215.md) | 記録 | Issue #215の棒倒し法アプリ統合、コース・知識カード3枚・実績6件のシード追加、コレクション検証の単元汎用化、サムネイルの迷路図、シード再実行の要否 |
| [bubble-sort-phase1-227.md](bubble-sort-phase1-227.md) | 記録 | Issue #227の配列描画基盤とバブルソートフェーズ1（導入）、検証済みトレースとの照合と場面圧縮・基準データ未取り込みの留保 |
| [bubble-sort-phase2-228.md](bubble-sort-phase2-228.md) | 記録 | Issue #228のバブルソートフェーズ2（動きの説明）16ステップ、検証済みトレースとの照合と比較・交換・確定の表現、確定キャプションと基準データ未取り込みの留保 |
| [bubble-sort-phase3-229.md](bubble-sort-phase3-229.md) | 記録 | Issue #229のバブルソートフェーズ3（動きの確認問題）連結2問、フェーズ2場面の参照と検証済みトレースとの正解照合 |
| [bubble-sort-phase4-230.md](bubble-sort-phase4-230.md) | 記録 | Issue #230のバブルソートフェーズ4（動きとコードの対応）39フレーム、CPythonトレースとの全行・変数照合と交換行チェックポイント、基準データ未取り込みの留保 |
| [bubble-sort-phase5-231.md](bubble-sort-phase5-231.md) | 記録 | Issue #231のバブルソートフェーズ5（コードの確認問題）独立2問、空欄の式だけを覆う位置決めとバイト単位の原文復元、全候補のPython構文確認、基準データ未取り込みの留保 |
| [bubble-sort-phase6-232.md](bubble-sort-phase6-232.md) | 記録 | Issue #232のバブルソートフェーズ6（応用問題）転移タップ・並び済み配列と右端の理由の選択・8行Parsons、独立トレースとの正解照合と誤答の反証、初回診断、基準データ未取り込みの留保 |
| [bubble-sort-phase7-233.md](bubble-sort-phase7-233.md) | 記録 | Issue #233のバブルソートフェーズ7（自分で実装）5テストと4段ヒント、試し実行の配列表示、入力不変と範囲の縮小が結果ベース判定で検出できない留保 |
| [bubble-sort-trace-234.md](bubble-sort-trace-234.md) | 記録 | Issue #234のバブルソートフェーズ7視覚デバッグ（共通トレース基盤への数値リスト記録の追加、フェーズ2正準16コマと一致する遡及変換、候補が曖昧な場合の最終状態表示） |
| [bubble-sort-unit-235.md](bubble-sort-unit-235.md) | 記録 | Issue #235のバブルソートフェーズ接続・単元コンテナ接続、フェーズ1・2・4への接続ポート追加、unitRegistry登録（既存コース course-algorithm-bubble-sort-v2）とLearningScreenのkind出し分け、フィードバック接続（#202） |
| [bubble-sort-integration-236.md](bubble-sort-integration-236.md) | 記録 | Issue #236のバブルソートアプリ統合、知識カード3枚（安定なソート／値の交換／計算量）と実績6件のシード追加、配布スケジュールとコレクション検証の単元ごと汎用化（シード再実行が必要） |
| [maze-digging-phase1-257.md](maze-digging-phase1-257.md) | 記録 | Issue #257の穴掘り法フェーズ1（導入）、グリッド基盤の状態意味の反転（検証は単元側）と参照手続きからの盤面導出、最初のバックトラックの圧縮表示 |
| [maze-digging-phase2-258.md](maze-digging-phase2-258.md) | 記録 | Issue #258の穴掘り法フェーズ2（動きの説明）21ステップ、掘削列からのバックトラック導出（戻る部屋数2・1・4）とスタック経路の常時表示、検証済みトレースとの照合 |
| [maze-digging-phase3-259.md](maze-digging-phase3-259.md) | 記録 | Issue #259の穴掘り法フェーズ3（動きの確認問題）連結2問、場面 dig-3 の候補集合そのものを回答対象にし、方向は問題文で提示（基準 §6-6） |
| [maze-digging-phase4-260.md](maze-digging-phase4-260.md) | 記録 | Issue #260の穴掘り法フェーズ4（動きとコードの対応）669フレーム、参照コード契約 maze-digging-v1（22行）と CPython トレース照合、チェックポイントは掘削=push行・バックトラック=戻り切ったpop行・完成=while終了判定 |
| [maze-digging-phase5-261.md](maze-digging-phase5-261.md) | 記録 | Issue #261の穴掘り法フェーズ5（コードの確認問題）独立2問、2マス先の座標計算（11行目）と未掘削の条件（12行目）の空欄補充、Q1は形式の制約で dx 側の「2」のみ空欄（留保あり） |
| [maze-digging-phase6-262.md](maze-digging-phase6-262.md) | 記録 | Issue #262の穴掘り法フェーズ6（応用問題）4問、転移7×7のタップ（掘削5回目まで・左へ掘る部屋）・完成迷路の性質・バックトラックの理由（復習はフェーズ4の pop 行）・参照コード22行の Parsons（順序自由な行なし） |
| [maze-digging-phase7-263.md](maze-digging-phase7-263.md) | 記録 | Issue #263の穴掘り法フェーズ7（自分で実装）5テストと4段ヒント、試し実行の盤面表示、完全迷路の性質検証とJ3完全一致の留保（視覚デバッグは #264） |
| [maze-digging-trace-264.md](maze-digging-trace-264.md) | 記録 | Issue #264の穴掘り法フェーズ7視覚デバッグ、フェーズ2正準21コマと一致する掘削・バックトラック再生（スタック経路は通路の木構造から導出）、イベント上限1000の実測根拠 |
| [maze-digging-unit-265.md](maze-digging-unit-265.md) | 記録 | Issue #265の穴掘り法フェーズ接続・単元コンテナ接続、unitRegistry登録とLearningScreenのkind出し分け、フィードバック接続（#202） |
| [maze-digging-integration-266.md](maze-digging-integration-266.md) | 記録 | Issue #266の穴掘り法アプリ統合、コース・知識カード3枚（バックトラッキング／スタック／全域木）・実績6件のシード追加、配布スケジュールの単元ごと生成への汎用化とコレクション検証の汎用化、単元サムネイル（完成迷路＋フェーズ1経路） |
| [binary-search-integration-295.md](binary-search-integration-295.md) | 記録 | Issue #295の二分探索アプリ統合、知識カード3枚（探索範囲を半分にする／中央の値と比べる／対数時間）・実績6件のシード追加、コレクション検証への単元登録、単元サムネイルを主教材の図へ差し替え、シード再実行の要否 |
| [parsons-overflow-feedback-318.md](parsons-overflow-feedback-318.md) | 記録 | Issue #318の Parsons 盤面はみ出し修正（盤面のみ内部スクロール・行ピッチ52→46px・全5単元）と、Issue #302/#303/#318共通の「直前の回答」表示ポリシー（対象の問題を開いている間だけ表示） |
| [parsons-order-feedback-327.md](parsons-order-feedback-327.md) | 記録 | Issue #327の Parsons 相対順序フィードバック（最長部分列で「動かさなくてよい行」に✓、全5単元の応用問題へ接続、フェーズ7ヒントL4は対象外） |
| [parsons-marks-answer-time-354.md](parsons-marks-answer-time-354.md) | 記録 | Issue #354の Parsons キープ印の判定固定（印は提出した並びへの判定として固定し、ドラッグ中は更新しない） |
| [faded-parsons-phase6.md](faded-parsons-phase6.md) | 記録 | フェーズ6の Parsons 問題のフェード型化（固定行の仕組み、セグメント内だけの並び替え、印は可動行のみ判定、5単元の固定／可動の切り分け） |
| [result-cheer-179.md](result-cheer-179.md) | 記録 | Issue #179の紙吹雪への歓声の追加（効果音ラボ「歓声と拍手」、フェーズ結果=中／単元最終=大） |
| [prisma-tmp-cleanup-278.md](prisma-tmp-cleanup-278.md) | 記録 | Issue #278のPrisma生成一時ファイル（.tmp 9件・約173MB）の追跡削除と.gitignore追加（Cloud Buildソースアーカイブ肥大の主因対策） |
| [home-terminology-177.md](home-terminology-177.md) | 記録 | Issue #177のホーム画面の用語統一（一覧への案内を「単元一覧へ」に置き換え） |
| [course-card-badge-176.md](course-card-badge-176.md) | 記録 | Issue #176のコースカードの二重バッジ解消（完了表示を StatusChip の「クリア済み」に一本化） |
| [progress-loading-175.md](progress-loading-175.md) | 記録 | Issue #175の読み込み中表示の改善（進捗読み込みを素のテキストからスケルトンへ） |
| [response-rollout-174.md](response-rollout-174.md) | 記録 | Issue #174のレスポンス改善の横展開（全画面のセッション＋キャッシュ統一、掲示板の新規投稿の即時表示） |
| [phase7-editor-hints-149.md](phase7-editor-hints-149.md) | 記録 | Issue #149のフェーズ7見直し（エディタのライトテーマ化と枠による分離、実行ボタンの文言、ヒント2のフロー表示、テスト結果のアニメーション） |
| [breadcrumb-unify-161.md](breadcrumb-unify-161.md) | 記録 | Issue #161のパンくず配置のアプリ全体統一（ヘッダー直下の独立行・1440px基準、内容幅は不変） |
| [learning-rewards-111.md](learning-rewards-111.md) | 記録 | Issue #111 のカード3段階演出・区切りと最終リザルトの実績・未所持カードの影、テーブル別再現手順と確認画像 |
| [unit-overview-layout-114.md](unit-overview-layout-114.md) | 記録 | Issue #114 の単元画面フェーズ配置の蛇行化と接続線（マスコットは保留） |
| [mascot-presentation-apply-135.md](mascot-presentation-apply-135.md) | 記録 | Issue #135 のマスコット提示ガイドライン適用（共通表示部品と各画面への段階・接地・表情の適用） |
| [player-ui-conformance-83.md](player-ui-conformance-83.md) | 記録 | Issue #83 のプレイヤー UI 定義適合（遷移600ms、自動再生下限2.5秒、セグメントシーク、再生ボタンの強調） |
| [response-feedback-151.md](response-feedback-151.md) | 記録 | Issue #151 のテーマ4対応（画面遷移の保持表示・キャッシュ・オーバーレイ廃止、フェーズ保存の非凍結化、学習画面入り口の非ゲート化） |
| [card-presentation-147.md](card-presentation-147.md) | 記録 | Issue #147 の知識カード提示の作り直し（クリック開示型の段階演出、発見への称賛、保存と演出の分離） |
| [seek-and-variable-highlight-145.md](seek-and-variable-highlight-145.md) | 記録 | Issue #145 のシーク表示のスライダー統一と変化変数の背景ハイライト統一 |
| [transition-buttons-142.md](transition-buttons-142.md) | 記録 | Issue #142 のフェーズ間遷移ボタンの共通化（共通部品と「次の段階の名称＋へ進む」の文言導出） |
| [consolidation-buttons-148.md](consolidation-buttons-148.md) | 記録 | Issue #148 のフェーズ6のボタンの近さ（図の高さ上限）と主な操作の主ボタン化 |
| [leftover-fixes-139-140-150.md](leftover-fixes-139-140-150.md) | 記録 | Issues #139・#140・#150 の残り個別修正（共通パンくず適用、フロー表示の矢印、単元リザルトのスクロール外側化とコース一覧導線） |
| [user-terminology-rename.md](user-terminology-rename.md) | 記録 | テーマ2のユーザ向け用語付け替え（段階の共通名、「フェーズ」を画面に出さない、実装画面の用語、実績シードの文言） |
| [home-layout-137.md](home-layout-137.md) | 記録 | Issue #137 のホーム画面レイアウト変更（続きから始めるの主役化と非表示条件、単元グリッド上限6件、進捗オーバーレイ共通化、単元サムネイル） |
| [unit-overview-139.md](unit-overview-139.md) | 記録 | Issue #139 の単元画面レイアウト変更（Sin カーブのマップ、開始ボタン廃止とノードの入口化、旗・カードバッジ・実績プレビュー、実績 API への courseId 追加） |
| [bfs-editor-110.md](bfs-editor-110.md) | 記録 | Issue #110 のエディタ拡大・ダーク化、D1限定フリー実行とstdout、採点・トレースとの分離、実Pyodide確認画像 |
| [learning-screens-109.md](learning-screens-109.md) | 記録 | Issue #109の単元・学習・ホーム接続、認証進捗API、下書き、報酬の受け口と計装イベント一覧 |
| [bfs-unit-flow-77.md](bfs-unit-flow-77.md) | 記録 | Issue #77 の単元フロー接続（遷移3類型、リザルト画面、自由な戻り）と、各単品プレビューへの埋め込み受け口の追加 |
| [bfs-visual-debug-76.md](bfs-visual-debug-76.md) | 記録 | Issue #76／PR #100 の型・内容による検出、D1呼び出し分離、部分再生、実行／テスト導線と確認画像 |
| [bfs-implementation-75.md](bfs-implementation-75.md) | 記録 | Issue #75／PR #99 の結果図示・4段階ヒント・タイムアウト分類、PR #100のボタン構成に追随した実Pyodide確認画像 |
| [bfs-code-check-73.md](bfs-code-check-73.md) | 記録 | Issue #73 の穴埋め2問、共通基盤の再利用、構文・再挑戦・復習の検証と確認画像 |
| [bfs-consolidation-74.md](bfs-consolidation-74.md) | 記録 | Issue #74 の5問と初回診断、PR #96 の図サイズ・Parsonsドラッグ／初期化行交換の修正、独立BFS検証と確認画像 |
| [bfs-parsons-single-list-97.md](bfs-parsons-single-list-97.md) | 記録 | Issue #97 の Parsons 盤面の1リスト直接並び替え化（2リスト方式からの再設計、実行確認は #76 と合わせて判断） |
| [bfs-code-mapping-72.md](bfs-code-mapping-72.md) | 記録 | Issue #72 のコード契約・62フレーム、Pythonトレース検証、PR #93 の可読性・変数差分表示と確認画像 |
| [graph-unify-91.md](graph-unify-91.md) | 記録 | Issue #91 の共通描画・迷路配置、検証結果と同じ画面幅でのフェーズ1・2・3比較 |
| [learning-feedback-402.md](learning-feedback-402.md) | 実装・自動検証（dev実機未検証） | #403〜#407の7単元58設問・44概念、回答証拠保存、共通スナップショット、1〜3候補、専用画面統合。レビュー修正1〜12に対応（文字数上限・候補重複判定はユーザー指示で撤廃）、完了再送の二重保存・二重生成を防止。#408は対象外 |
| [feedback-v1-implementation.md](feedback-v1-implementation.md) | 記録（現行実装の説明を含む） | フィードバック v1 の基準コミット、参照正本、生成・検証・表示の実装内容。仕様の正本は Google Drive のフィードバック要件 v1 |
| [phase3-situation-captions-297.md](phase3-situation-captions-297.md) | 記録 | Issue #297のフェーズ3状況キャプション追加（バブルソート・棒倒し法）、青い処理中色の時制をトレース由来の文言で固定、他単元への適用判定 |
| [code-mapping-scroll-grey-band-301-303.md](code-mapping-scroll-grey-band-301-303.md) | 記録 | Issue #301のフェーズ4コード見切れ修正（コード専用の横スクロールを全6単元へ）と、Issue #303の画面下グレー帯の特定（body背景のはみ出し）と単元プレビューの内側スクロール化（全5単元） |
| [parsons-editor-usability-327-325.md](parsons-editor-usability-327-325.md) | 記録 | Issue #327の応用問題レイアウト修正（安全な中央寄せで問題文と通知の重なりを解消、全5単元）とParsons盤面の高さ下限・濃色ドラッグカーソル、Issue #325のフェーズ7エディタ共有テーマ（キャレット色明示）と濃色Iビームカーソル |
| [wall-extension-phase2-314-316.md](wall-extension-phase2-314-316.md) | 記録 | Issue #314/#316の「図の変化とコード実行単位の対応」原則と説明専用ステップの導入、棒倒し法フェーズ2の32ステップ再構成とフェーズ4チェックポイント契約の改訂、フェーズ7トレース再生への波及 |
| [maze-digging-loop-explanation-334.md](maze-digging-loop-explanation-334.md) | 記録 | Issue #334の穴掘り法フェーズ2への輪の説明ステップ追加（説明専用2ステップ: 理由＋仮定盤面の実演）とフェーズ4チェックポイント契約のコード対応ステップへの改訂 |
| [binary-search-phase1-unsorted-329.md](binary-search-phase1-unsorted-329.md) | 記録 | Issue #329の二分探索フェーズ1場面1の未ソート化（主教材の並び替え [19,3,31,7,42,12,25]、25を最後尾に置き最悪のケースを場面内で起こす）、配列場面への並び方（sorted/unsorted）の導入 |
| [binary-search-review-fixes-330-331.md](binary-search-review-fixes-330-331.md) | 記録 | Issue #331の応用問題の表示被り修正（図領域のフレックス化、全5単元）と lo/hi 定義行の追加、Issue #330のフェーズ2「残った範囲」の強調（remaining 状態）とソート前提のキャプション追加 |
| [maze-digging-coordinate-order-326.md](maze-digging-coordinate-order-326.md) | 記録 | Issue #326の穴掘り法の座標表示 (y, x) 統一（フェーズ2・3・4・6とトレース再生の表示反転、参照コードとセルキーは不変） |

## 図

`figures/` の PlantUML は、現行実装を理解するための参考図である。DB 構造は `back/prisma/schema.prisma`、API は実行コードを正とし、図と食い違う場合は図を更新する。

| ファイル | 内容 |
| --- | --- |
| `figures/er-learning-domain.puml` | Prisma schema をもとにした学習ドメインの ER 図 |
| `figures/sequence-auth-and-user-sync.puml` | Firebase 認証とアプリユーザー同期のシーケンス図 |
| `figures/sequence-course-mission-activity-flow.puml` | コース一覧から Mission・Activity 完了までのシーケンス図 |
| `figures/sequence-exam-submit-result.puml` | 確認テストの開始、提出、結果取得のシーケンス図 |
| `figures/component-architecture.puml` | フロントエンド、バックエンド、Firebase、DB のコンポーネント構成図 |
| `figures/state-progress.puml` | ミッション、レッスン、確認テスト難易度ごとの進捗状態図 |
| `figures/activity-learner-journey.puml` | 学習者がアプリを使う一連の流れを示すアクティビティ図 |
| `figures/api-route-map.puml` | バックエンド API ルート一覧 |
| `figures/deployment-local-dev.puml` | ローカル開発環境の配置図 |

### レンダリング

VS Code の PlantUML 拡張など、PlantUML に対応したツールで `.puml` ファイルを開くとプレビューや画像出力ができる。

## ドキュメント保守ルール

- 新しいドキュメントには、目的、適用範囲、状態、最終確認日を冒頭に書く。
- 設計や運用が変わったら、関連ドキュメントとこの索引を同じ変更で更新する。
- 古くなった文書は、旧版であることと現在の正本を冒頭に明示する。完全に不要になった場合だけ削除し、理由を PR に書く。
