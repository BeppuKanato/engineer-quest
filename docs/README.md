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
| [BFS フェーズ6](../front/src/features/learning/bfs/consolidation/README.md) | 現行 | Issue #74 の転移・境界ケース・Parsonsの5問、初回結果のタグ別診断、任意復習とソフトゲート |
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
| [answer-feedback-146.md](answer-feedback-146.md) | 記録 | Issue #146の共通正誤表示・既存効果音・一度きりのモーション、進行との分離、検証と各画面の確認手順 |
| [phase-result-praise-144.md](phase-result-praise-144.md) | 記録 | Issue #144のフェーズ3・5共有リザルトの短い紙吹雪・到達モーション・初回成績別の称賛と検証・確認手順 |
| [phase-result-visuals-165.md](phase-result-visuals-165.md) | 記録 | Issue #165のフェーズ系リザルト視覚強化（称賛文の削除、到達図とスコアドット、フェーズ6結果画面の行カード化と「診断」から「結果」への文言統一） |
| [unit-final-result-150.md](unit-final-result-150.md) | 記録 | Issue #150の単元最終リザルト視覚強化（一段強い紙吹雪、全灯ミニマップ、要約タイル、実績のコンパクト要約、獲得カードのタイル表示） |
| [phase-bridge-141.md](phase-bridge-141.md) | 記録 | Issue #141のフェーズ間ブリッジ追加（全遷移に目標提示のステップを統一、リザルト予告の廃止、教材指針の遷移モデル改訂） |
| [question-flow-softgate.md](question-flow-softgate.md) | 記録 | 確認問題のソフトゲート統一（フェーズ3・5でも「次の問題へ」で進行可能に）とフェーズ6の正解後固定、教材指針の完了定義改訂 |
| [player-transport-140.md](player-transport-140.md) | 記録 | Issue #140のプレイヤー操作系の中央寄せ・拡大（UI定義§3の改訂）と出現ボタンのフェードイン |
| [unreachable-review-182.md](unreachable-review-182.md) | 記録 | Issue #182のフェーズ6「たどり着けない場所」の復習先の修正（発見の関門ステップへの差し替え） |
| [create-work-align-184.md](create-work-align-184.md) | 記録 | Issue #184の作る画面3カラムのカード上端揃え（要件カラムの外付け見出しを撤去） |
| [home-target-achievement-183.md](home-target-achievement-183.md) | 記録 | Issue #183の目標実績のホーム表示（API既存の targetAchievement を左カラムに描画） |
| [phase5-preview-unify-181.md](phase5-preview-unify-181.md) | 記録 | Issue #181のフェーズ5単品画面のフェーズ3単品への統一（再回答の合図とボタンの出方） |
| [phase7-result-presentation-180.md](phase7-result-presentation-180.md) | 記録 | Issue #180のフェーズ7テスト結果の作り直し（通過ごとの描き込みチェックと全通過時の祝福） |
| [unit-overview-card-badge-178.md](unit-overview-card-badge-178.md) | 記録 | Issue #178の単元画面ステージからの知識カード予告バッジ撤去 |
| [feedback-learning-flow-202.md](feedback-learning-flow-202.md) | 記録 | Issue #202のフィードバックの学習フロー接続（トリガー・カタログ単元対応・先行生成） |
| [result-cheer-179.md](result-cheer-179.md) | 記録 | Issue #179の紙吹雪への歓声の追加（効果音ラボ「歓声と拍手」、フェーズ結果=中／単元最終=大） |
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
| [feedback-v1-implementation.md](feedback-v1-implementation.md) | 記録（現行実装の説明を含む） | フィードバック v1 の基準コミット、参照正本、生成・検証・表示の実装内容。仕様の正本は Google Drive のフィードバック要件 v1 |

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
