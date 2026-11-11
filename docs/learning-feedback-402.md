# 学習フィードバック再設計（#402、#403〜#407）

- 目的・範囲: 7単元の回答証拠、概念マップ、二段階LLM分析、任意の1〜3学習候補を既存フィードバック専用画面へ統合する。
- 状態: 実装・自動検証。dev実機検証 #408 は未実施・対象外。
- 最終確認日: 2026-11-11。
- 基準: 貪欲法統合済みdevelop `a7945f2`。ブランチ `feat/learning-feedback-402`。
- 正本: [#402](https://github.com/BeppuKanato/engineer-quest/issues/402)、[#403](https://github.com/BeppuKanato/engineer-quest/issues/403)〜[#407](https://github.com/BeppuKanato/engineer-quest/issues/407)、今回のユーザー指示、`AGENTS.md`、`development-rules.md`、教材指針、現行コード。

## 概念定義 (#403)

正本データは `back/src/learning/feedback/concepts.json`。既存6単元の対応案を現行設問・タグと照合し、貪欲法を追加した。P7は通常の回答概念とは別種の根拠を持つ。

| 単元 | P3/P5/P6設問 | 概念（P7を含む） |
| --- | ---: | ---: |
| BFS | 9 | 6 |
| DFS | 9 | 7 |
| 二分探索 | 8 | 6 |
| バブルソート | 8 | 6 |
| 穴掘り法 | 8 | 7 |
| 棒倒し法 | 8 | 6 |
| 貪欲法（硬貨問題） | 8 | 6 |
| 合計 | 58 | 44 |

貪欲法は「残額以下で最大の硬貨を選ぶ」（`next-coin`、`why-not-100`、`next-coin-transfer`）、「同じ硬貨を使う条件」（`while-condition`）、「残額の更新」（`remaining-update`）、「貪欲法と最少枚数の違い」（`counterexample-greedy-result`、`counterexample-why-greedy-loses`）、「コード全体の流れ」（`whole-code-order`）、実装確認を定義した。

`verify:feedback-concepts` (front) がレジストリ・全教材を直接ロードし、全設問の複合キー（phase/assessment/question）、タグ、概念の一意性を検証する。欠落・重複・架空ID・タグ変更を注入して検出できることもテストする。新単元や設問変更にはこの定義の更新が必要。

## 保存と集約 (#404)

- 全21確認画面の完了通知に、同じ回答状態から作った `assessmentEvidence` を追加した。設問セッションID、開始順、設問ID、全attempt番号・正誤を含む。再挑戦は同セッション、解き直し・ページ再訪は新セッション。観測イベントにも同じ識別情報を付ける。
- 完了APIは登録済みのP3/P5/P6について全設問・連番attemptを検証する。不足・不一致は400として再試行可能にする。完了証拠は `LearningEvent` の `assessment_snapshot` として、進捗と同じトランザクションでappendする。非同期キューの到着を待つ必要はない。APIの新契約が必要なので、更新前から開いている古い画面では再読込が必要になる。
- 原本ログは削除・更新しない。重複は設問複合キー＋セッション＋attemptで同定し、確定証拠を優先。同じ確定attemptに矛盾がある場合は誤答を保守的に採用する。同一結果ならsource IDで決定的に選ぶ。
- セッション開始順・セッションID・attempt番号で順序を決める。配信の到着順やtimestamp単独でattemptを推定しない。未回答の設問は過去の直近回答を保持する。再学習回数・再挑戦・初回と直近の正誤を区別し、初回が欠けていれば不明にする。
- 状態は回答証拠なし＝未確認、回答済み設問の最新回答がすべて正答＝確認できた、最新誤答あり＝追加確認が必要。部分回答は必ず `attemptedQuestions/totalQuestions` を添える。
- **旧データの限界:** セッション識別情報のない旧回答ログは解き直しを確実に復元できないため、概念の正誤判定へ推測で流用しない。旧集計値・原本・進捗は保持する。新しい詳細証拠がない内容は未確認となる。履歴を書き換えるバックフィルは行わない。
- P7は完了状態、テスト結果、実行回数、ヒント、入力量とsource IDを別型で保持。記録なしはunknown。部分的な成功結果を全テスト通過とせず、不合格から通常概念の状態を変更しない。
- 本人限定の保存済みイベントから生成時に集約し、`FeedbackV1.input.learning.conceptSnapshot` に固定する。APIは生成中・失敗時・再表示でもこの保存済みスナップショットを返す。画面は独自判定しない。生成中にアクセス条件を再確認しても、回答スナップショットは差し替えない。

## 分析と候補 (#405/#406)

- 二段階生成、既定モデル、reasoning effort、実験割当を維持。プロンプト版は `feedback-v2-2026-11-11-concepts`。
- Feed Upには既存のアクティブ大目標・型・達成条件・コード計算の進捗を使い、未設定なら段階目標を使う。既存の大目標達成判定を変更していない。#368との差分として、選択段にも大目標と現在・次段階を明示的に渡す。
- Feed Backには共通スナップショットと回答source IDを渡す。構造化conceptClaimsの概念ID・状態・根拠IDを検証する。過剰な習得断定、理解度%、入力にない数値を拒否する。自然言語の意味の完全な検証はできないため、実モデルの文章品質は#408に残る。
- Feed Forwardは可用なURL付き行動と、移動不要の行動能力を提示し、モデルが短い方法・理由を生成する。固定文章テンプレートの選択には限定しない。候補数1〜3、nextStep/reason各100字、actionLabel32字、purpose60字、nextGoal100字が上限。重複・不正対象・使用不能機能を拒否する。0件・不正出力・外部API障害はFAILEDとして保存し、自動で架空候補や再生成を作らない。URLが使えなくても移動不要の提案は可能。
- URLはactionId/targetIdからコードで解決し、生成後にも可用性を再検証。次段階は申告文字列をそのまま許可せず単元定義から決定し、フェーズ内カードは当該単元の獲得カードに限定する。
- STANDARD/PERSONALIZEDの分析入力・判定・可用機能は共通。HEXADは選択段だけで動機づけの選択・順序・表現へ使い、全候補の6得点・対象・調整理由を検証・保存する。研究の比較条件を変更していない。
- 全候補を順序と安定candidate ID付きで返す。旧1件結果は再生成せず互換表示する。APIの従来の先頭候補フィールドも維持。履歴入力は全候補を含み、過去のHEXAD調整記録は共通入力へ混入させない。

## 画面・観測 (#407)

既存 `FeedbackScreen` を拡張し、MUIと既存トークンを再利用した。既存の現在位置図とユーザー別大目標を残し、概念マップを別の情報として表示。構成要素を単元からの所属線で示し、前提依存・習得順は示さない。状態はラベル・記号・色で識別できる。各ノードはnative details/summaryでタップ・キーボード・読み上げに対応し、設問タグ、ID、初回/直近、再挑戦・再学習を確認できる。

本文はスクロール可能、継続ボタンは別領域。小画面1列・中画面2列・大画面3列で折り返す。候補は方法と短い理由を並べ、URL付きだけボタンにする。URL不要の方法は文章として成立させる。割当なし・生成待ち・失敗を含め、推薦に従わず先へ進める。

提示・viewport出現・選択・非選択・到達にcandidate IDを保持する。見えていない候補をVIEWEDにしない。phaseクエリをcanonical routeへ含め、内部フェーズ遷移は対象ビューのphase_start後に到達を記録する。同じ段階への再訪でもvisitを区別する。旧first-selection-v1の判定を保持しつつ、候補ごとの観測内訳を追加した。表示やクリックは学習実行・理解の証明ではない。

## 自動検証と未検証

DB・LLMを使うサービス検証はメモリアダプタ/fixtureで行う。画面検証はサーバーレンダーとイベントリスナーのモックであり、ブラウザの実機確認ではない。

- front/back: typecheck、lint、build。
- back: 拡張した `verify:static`（概念判定、完了保存とキュー遅延、複数候補、生成context、保存・再利用を含む）、`verify:big-goal`、`verify:big-goal-proposal`。
- front: `verify:feedback-concepts`、`verify:feedback-map`、`verify:feedback-candidates`。7単元それぞれのcheck/code-check/consolidation/unit（28検証）、learning-screens、learning-player、response-feedback、answer-feedback。
- CIへ新しいfrontの3検証を追加。backの新検証はverify:staticに含める。
- WindowsではPythonを呼ぶ既存verifyに `PYTHON=D:\Python310\python.exe` を設定。front buildの既存Google Fonts取得にはネットワークを使用する。
- 既存のfront Hook警告5件、ESLintのmodule形式警告、Nextの複数lockfile警告は対象外のため残す。

未実施: ブラウザ/Cloud Browser、スマホ・ノートPC実機の表示、dev/prodデプロイ、実DB検証・migration・seed適用、実LLM API呼び出し。自己評価機能は実装していない。#408を完了扱いにしない。

## マージ後

Prisma schema・seedの変更はなく、migration/seed適用・バックフィルは不要。ユーザーによるdevelopへのマージ後、通常のdev反映を待ち、#408で実DB・実画面・実モデルによる整合性と品質を確認する。更新前から開いた学習画面は再読み込みする。研究で使用する前に、候補単位の計測、通信中断、複数タブ、文章品質・待ち時間も実環境で確認する。prodへの移行判断は別途行う。
