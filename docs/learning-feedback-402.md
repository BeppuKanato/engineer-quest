# 学習フィードバック再設計（#402、#403〜#407）

- 目的・範囲: 7単元の回答証拠、概念マップ、二段階LLM分析、任意の1〜3学習候補を既存フィードバック専用画面へ統合する。
- 状態: 実装・自動検証。dev実機検証 #408 は未実施・対象外。
- 最終確認日: 2026-11-12。
- 2026-11-12修正: 候補の `targetId` / `capabilityId` とHEXAD適応記録の `targetId` は、空文字だけを検証前に `null` へ正規化する。保存結果も正規化し、元のLLM出力ログは変更しない。非空の不正ID、許可されない行動・対象、HEXAD不一致は引き続き拒否する。
- 2026-11-12生成スキーマ修正: APIへ渡す候補を移動あり／なしの入れ子のunionに分割する。移動ありは `capabilityId: null`、移動なしは `actionId/targetId: null` と許可された2種類のcapability IDを要求する。PERSONALIZEDの適応記録も候補種別ごとにIDの型を制約する。候補は従来どおり1〜3件。保存済み出力の互換性、空文字正規化、許可対象・HEXAD一致の後段検証は維持する。
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
- 完了APIは登録済みのP3/P5/P6について、証拠があれば全設問・連番attemptを検証し、不正な証拠は400で拒否する。証拠自体が欠落している場合は完了を受け付け、assessment_evidence_missingイベントとサマリのassessmentEvidenceStatus=missingを保存する。過去の有効回答は保持し、過去にも証拠がなければ概念状態は未確認となる。完了証拠は `LearningEvent` の `assessment_snapshot` として、進捗と同じトランザクションでappendする。非同期キューの到着を待つ必要はない。旧画面の証拠なし完了も受け付けるが、詳細な回答証拠を保存するには新しい画面が必要。
- 原本ログは削除・更新しない。重複は設問複合キー＋セッション＋attemptで同定し、確定証拠を優先。同じ確定attemptに矛盾がある場合は誤答を保守的に採用する。同一結果ならsource IDで決定的に選ぶ。
- 最新の回答はサーバーの確定受信順で決め、クライアントのstartedAtを順序に使わない。完了セッションは最初の確定スナップショットのserverTimestampを使い、未完了セッションは設問の最新attemptの最初の受信時刻を使う。同点はセッションID、同一セッション内はattempt番号で決定的に比較する。完了後の遅延回答・スナップショット再送や低いattemptの遅延配信で、そのセッションを最新に戻さない。配列の投入順には依存しない。初回回答の同定には最初に観測されたセッションのattempt 1を使う。未回答の設問は過去の直近回答を保持する。再学習回数・再挑戦・初回と直近の正誤を区別し、初回が欠けていれば不明にする。
- 状態は回答証拠なし＝未確認、回答済み設問の最新回答がすべて正答＝確認できた、最新誤答あり＝追加確認が必要。部分回答は必ず `attemptedQuestions/totalQuestions` を添える。
- **旧データの限界:** セッション識別情報のない旧回答ログは解き直しを確実に復元できないため、概念の正誤判定へ推測で流用しない。旧集計値・原本・進捗は保持する。新しい詳細証拠がない内容は未確認となる。履歴を書き換えるバックフィルは行わない。
- P7は完了状態、テスト結果、実行回数、ヒント、入力量とsource IDを別型で保持。記録なしはunknown。部分的な成功結果を全テスト通過とせず、不合格から通常概念の状態を変更しない。
- 本人限定の保存済みイベントから生成時に集約し、`FeedbackV1.input.learning.conceptSnapshot` に固定する。APIは生成中・失敗時・再表示でもこの保存済みスナップショットを返す。画面は独自判定しない。生成中にアクセス条件を再確認しても、回答スナップショットは差し替えない。

### レビュー修正10: 同一完了要求の再送（2026-11-11）

同じ利用者・単元・段階・設問セッションの同じ完了証拠は、原本を追加せず保存済みの進捗を返す。完了日時も維持するので、通信再試行で別のフィードバックイベントを作らない。新しい解き直しセッションは別完了として扱い、完了日時が同じミリ秒に衝突しないようにする。古い要求を再送しても新しい進捗へ巻き戻さない。同じセッションIDに異なる証拠を送った場合は409で拒否し、原本を変更しない。設問の並び順だけの違いは同じ証拠とみなす。

新規原本のIDを利用者・単元・段階・assessment・sessionから決定的に作り、既存の主キー制約を使う。旧版のランダムIDの原本も照合する。保存はSerializableトランザクションとし、同時要求の競合（P2034/P2002）は最大3回までトランザクション全体を再試行する。schema/migration変更は不要。実績・大目標の評価は、先行要求が評価前に失敗した場合にも回復できるよう再実行を維持する。通常のLLM生成そのものの速度改善は対象にしていない。

`verify:feedback-evidence-storage` に、全7単元での再送、同時要求、新規セッション、古い再送、別利用者、同一セッションの証拠衝突、トランザクション競合の再試行と上限を追加した。メモリアダプタによる契約検証であり、実DBの分離レベル・競合試験は#408に残す。

## 分析と候補 (#405/#406)

- 二段階生成、既定モデル、reasoning effort、実験割当を維持。プロンプト版は `feedback-v2-2026-11-13-assessment-claims`。
- Feed Upには既存のアクティブ大目標・型・達成条件・コード計算の進捗を使い、未設定なら段階目標を使う。既存の大目標達成判定を変更していない。#368との差分として、選択段にも大目標と現在・次段階を明示的に渡す。
- Feed Backには共通スナップショットと回答source IDを渡す。構造化conceptClaimsの概念ID・状態・根拠IDを検証する。過剰な習得断定、理解度%、入力にない数値を拒否する。自然言語の意味の完全な検証はできないため、実モデルの文章品質は#408に残る。
- Feed Forwardは可用なURL付き行動と、移動不要の行動能力を提示し、モデルが短い方法・理由を生成する。固定文章テンプレートの選択には限定しない。候補数は1〜3。2026-11-11のユーザー指示により、生成する文章の文字数上限とプロンプトの字数指定を撤廃した。簡潔さは指示するが200〜300字を機械的な条件にはしない。候補の重複判定も行わず、同じ文章・同じ遷移先を許可する。候補ごとのIDで観測を区別し、IDのない共有URLへの移動では候補を推定しない。不正対象・使用不能機能は引き続き拒否する。0件・不正出力・外部API障害はFAILEDとして保存し、自動で架空候補や再生成を作らない。URLが使えなくても移動不要の提案は可能。
- URLはactionId/targetIdからコードで解決し、生成後にも可用性を再検証。次段階は申告文字列をそのまま許可せず単元定義から決定し、フェーズ内カードは当該単元の獲得カードに限定する。
- STANDARD/PERSONALIZEDの分析入力・判定・可用機能は共通。HEXADは選択段だけで動機づけの選択・順序・表現へ使い、全候補の6得点・対象・調整理由を検証・保存する。研究の比較条件を変更していない。
- 全候補を順序と安定candidate ID付きで返す。旧1件結果は再生成せず互換表示する。APIの従来の先頭候補フィールドも維持。履歴入力は全候補を含み、過去のHEXAD調整記録は共通入力へ混入させない。

## 画面・観測 (#407)

既存 `FeedbackScreen` を拡張し、MUIと既存トークンを再利用した。既存の現在位置図とユーザー別大目標を残し、概念マップを別の情報として表示。構成要素を所属のまとまりとして並べ、前提依存・習得順は示さない。状態はラベル・記号・色で識別できる。各ノードはnative details/summaryでタップ・キーボード・読み上げに対応し、日本語の段階名・設問説明と、初回/直近、再挑戦・再学習を確認できる。ID・タグは内部照合用に保持するが学習者へ表示しない。旧保存済みスナップショットの表示も内部IDを出さない。

本文はスクロール可能、継続ボタンは別領域。小画面1列・中画面2列・大画面3列で折り返す。候補は方法と短い理由を並べ、URL付きだけボタンにする。URL不要の方法は文章として成立させる。割当なし・生成待ち・失敗を含め、推薦に従わず先へ進める。

提示・viewport出現・選択・非選択・到達にcandidate IDを保持する。見えていない候補をVIEWEDにしない。phaseクエリをcanonical routeへ含め、内部フェーズ遷移は対象ビューのphase_start後に到達を記録する。同じ段階への再訪でもvisitを区別する。旧first-selection-v1の判定を保持しつつ、候補ごとの観測内訳を追加した。表示やクリックは学習実行・理解の証明ではない。

## レビュー修正1〜9・11〜12（2026-11-11）

- 1/11: 日本語の段階名・設問説明、任意の候補であることの可視注記、部分回答件数、末尾注意文、旧表示互換をSSRで検証。
- 2/3: 証拠欠落時の完了・欠落記録・過去証拠の保持、不正証拠の部分書込防止、複数タブ、端末時計逆転、遅延・重複配信、同点と逆順投入をfixtureで検証。
- 4/6: ユーザー指定を優先し、文字数制限・重複拒否を削除。長文、同文・同遷移先の受入と候補ID単位の反応記録を検証。候補数1〜3とURL・機能の妥当性検証は維持。
- 5/12: BFS発見済みノードの具体例（P3初回正答、P5誤答→再挑戦正答、P6未回答＝confirmed・2/3）と再学習誤答を固定。通常概念とP7の集約を全7単元で検証。backの定義バリデータで空設問・kind取り違え・架空P7・設問重複を検出。
- 7: 選択段にstageGoals.current/nextを構造化して渡す。分析段入力は変更せず、両条件の共通性を検証。
- 8: conceptSnapshotのないcreate等ではconceptClaimsを空に正規化し、余分な欄だけで全生成を失敗させない。元のAI出力は監査ログに残し、本文・source IDの検証を維持。snapshotのある場合の厳密な概念検証は維持。
- 9: 分析文と候補文の習得・マスター・身についた等の断定を検出し、否定・判断保留・目標表現は許可する。語句パターンの検証であり、自然言語の妥当性を完全に保証するものではない。

### 指摘別の変更ファイルと検証結果

| 指摘 | 主な変更ファイル | 自動検証結果 |
| --- | --- | --- |
| 1 | `back/src/learning/feedback/concepts.json`、`front/src/api/feedbackV1.api.ts`、`front/src/features/learning/app/feedback/ConceptMap.tsx` | front `verify:feedback-concepts` / `verify:feedback-map`: PASS。全設問の日本語説明を現行教材と照合し、内部ID・ASCIIタグの非表示を検証 |
| 2 | `back/src/service/learning.service.ts`、`feedbackConcepts.ts`、`feedbackV1.context.ts`、frontのConceptMap/API型 | back `verify:feedback-evidence-storage`: PASS。欠落受付・欠落イベント・過去証拠保持・不正証拠の書込防止 |
| 3 | `back/src/service/feedbackConcepts.ts`、`back/src/scripts/verifyFeedbackConcepts.ts` | back `verify:feedback-concepts`: PASS。A→B→Aの回答、時計逆転、遅延・重複・低attempt配信、同点・逆順、P7受信順 |
| 4/6 | `back/src/service/feedbackV1.engine.ts`、`back/src/scripts/verifyFeedbackCandidates.ts`、frontのfeedbackV1表示・観測 | back/front `verify:feedback-candidates`: PASS。長文・重複受入、共通URLでの候補ID識別と候補不明時の非推定 |
| 5 | `back/src/scripts/verifyFeedbackConcepts.ts` | back `verify:feedback-concepts`: PASS。BFS発見済み概念2/3の具体例と直近誤答への変形 |
| 7 | `back/src/service/feedbackV1.context.ts`、`feedbackV1.engine.ts`、`back/src/scripts/verifyFeedbackV1Context.ts` | back `verify:feedback-v1-context`: PASS。選択段のcurrent/next目標、分析段への非混入、条件間の共通性 |
| 8 | `back/src/service/feedbackV1.engine.ts`、`back/src/scripts/verifyFeedbackCandidates.ts` | back `verify:feedback-candidates`: PASS。snapshotなし＋余分なclaimsでも成功し、claimsを空として引き継ぐ。原出力ログ・本文と根拠検証は維持 |
| 9 | 同上 | back `verify:feedback-candidates`: PASS。習得断定の拒否、否定・判断保留・目標の受入、候補文の検証 |
| 10（前回対応・回帰確認） | `back/src/service/learning.service.ts`、`back/src/scripts/verifyFeedbackEvidenceStorage.ts`、`verifyDfsLearningIntegration.ts` | back `verify:feedback-evidence-storage` / `verify:dfs-learning`: PASS。冪等化・別セッション・利用者分離・競合再試行 |
| 11 | `front/src/app/component/feedbackV1.tsx`、`ConceptMap.tsx`、`FeedbackScreen.tsx`、`front/scripts/verifyFeedbackMap.cjs` / `verifyFeedbackCandidates.cjs` | front `verify:feedback-map` / `verify:feedback-candidates`: PASS。任意性の可視注記、件数・注意文・旧スナップショット互換・長文の折り返し |
| 12 | `back/src/service/feedbackConcepts.ts`、`back/src/scripts/verifyFeedbackConcepts.ts`、本書・README | back `verify:feedback-concepts`: PASS。全7単元/P7の集約と不正定義の検出。申告ベース・受信順の限界を文書化 |

最終ローカル検証: front/backのlint・typecheck・build、backの`verify:static`・`verify:big-goal`・`verify:big-goal-proposal`、frontの新3検証・learning-screens・learning-player・response-feedback・answer-feedback、7単元のcheck/code-check/consolidation/unit（28検証）はすべてPASS。実DB・実LLM・ブラウザを使う検証、デプロイ、マージは未実施。既存警告5件とmodule/lockfile警告のみ残る。

### 残るデータの限界

回答証拠の正誤はクライアント申告であり、サーバー側で教材を再採点していない。スナップショットと到着済みの実回答イベントの正誤突合もしていない。形式・ID・attempt・根拠の整合性を検証し、矛盾した同一attemptは確定スナップショットを優先する。serverTimestampによる「最新」はサーバーが受信・確定した順序であり、通信中断中の実際の回答時刻を復元するものではない。P7の観測結果もサーバー受信時刻で比較する。証拠なし旧要求にはセッションIDがないため、再送を解き直しと確実に区別できず、修正10の同一セッションの冪等化の対象にはできない。

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

Prisma schema・seedの変更はなく、migration/seed適用・バックフィルは不要。ユーザーによるdevelopへのマージ後、通常のdev反映を待ち、#408で実DB・実画面・実モデルによる整合性と品質を確認する。証拠の詳細を記録するため、更新前から開いた学習画面は再読み込みする。研究で使用する前に、候補単位の計測、通信中断、複数タブ、文章品質・待ち時間も実環境で確認する。prodへの移行判断は別途行う。

## 根拠IDの共通契約（2026-11-13）

`feedbackV1.evidence.ts` が本人限定で取得した learning / bigGoal の既知の構造から `evidenceSources: { sourceId, kind, path }[]` を組み立て、コンテキスト保存前に確定する。新規の大目標は `goal:<BigGoal.id>` で条件・コード計算の進捗・状態を参照する。回答は概念スナップショットの first/latest.sourceId、実装は既存 implementation.sourceIds（lastTest / observedHints も含む）を改変せず登録する。学習イベント・単元・段階・作る課題とそのテスト／ヒント／提出は明示したパスだけを登録する。任意の再帰ID収集は廃止し、summary、payload、コード、選択段のstate、設問／概念／セッション等の識別子から参照権限を作らない。

分析段には一覧と参照先を渡し、一覧内のIDだけを引用するよう指示する。検証も同じ一覧を使い、未知のevidence.sourceIdはUNKNOWN_EVIDENCE_SOURCEで失敗する。conceptClaims.sourceIdsは一覧への所属に加え、従来の概念ごとの回答証拠照合も行う。保存済み一覧に追加・欠落・変更がある場合はINVALID_EVIDENCE_SOURCESで拒否する。二段生成、STANDARD/PERSONALIZEDの共通分析、HEXADの選択段限定、行動検証は維持する。

一覧のない旧保存入力は実行時にその保存済みスナップショットだけから一覧を作る。旧bigGoalにはDBの目標IDが残っていないため、入力内に存在する場合だけローカル参照 `feedback:big-goal` を付ける。新しいDB状態で過去の事実を置換しない。bare `bigGoal` は引き続き拒否する。保存済みの入力・結果・監査ログは更新せず、COMPLETEDの再利用とFAILEDの扱いも維持する。既存失敗の自動再生成・バックフィルは行わない。DB migrationは不要。

`verify:feedback-evidence-sources` は提供された保存済み二分探索のP3・単元完了の失敗入出力から、選択状態・利用者情報を除き、セッション等を匿名化したfixtureで再現する（観測イベントIDは照合のため維持）。P3の旧引用拒否と正式な目標参照での成功、単元完了の実装IDと既存回答ID、未知／他学習者／メタデータIDの拒否、一覧偽造拒否、概念ごとの照合、二段生成と監査ログ、旧入力の非破壊な互換処理を検証する。コンテキスト検証は本人限定クエリと同時完了したACHIEVED目標のIDも確認する。CIのverify:staticに追加した。保存テストの待機は、非同期ファイルI/Oを待てるようイベントループ20回から最大5秒の状態待ちに変更した。

実DB・実LLMでの生成品質・運用上の再実行は別途確認が必要であり、この回帰テストでは外部APIを呼び出さない。

## 回答概念と実装観測の生成契約（2026-11-13）

二分探索の単元完了ログで、根拠ID検証は通る一方、LLMがkind=implementationの「実装と動作確認」をconceptClaimsに含め、INVALID_CONCEPT_CLAIMで停止するケースを確認した。入力は実装のstate=unobservedとテスト・完了の観測を持つが、概念状態の判定は回答問題（assessment）だけを対象とする。従来のプロンプトの「観測のある概念」という指示と自由なconceptId文字列の生成スキーマでは、この境界を保証できなかった。

`claimableConcepts` を回答観測済み（kind=assessment、attemptedQuestions>0）の概念だけから構築し、分析入力にconceptId・state・許可されたfirst/latest.sourceId一覧を明示する。実装はconceptClaimsへ含めず、従来のimplementation内の観測を本文とevidenceで参照する。conceptSnapshot・実装完了・テスト結果・sourceIds・元の記録は変更しない。

`analysisGenerationSchema(input)` は各回答概念のID・状態をリテラル、回答根拠IDを列挙値で制約したunionを使う。対象が無ければconceptClaimsは空配列のみ許可する。実際のOpenAI呼出しと手動検証スクリプトの双方にこの生成用スキーマを渡す。保存結果を読むanalysisSchemaは従来どおりで、過去の監査出力を破壊しない。validateAnalysisの概念種別・状態・根拠の照合は緩めず、モデル出力の実装claimを黙って削除する処理も追加しない。二段生成とHEXADの選択段限定は維持し、分析プロンプトと生成スキーマは両条件で共通とする。

`verify:feedback-analysis-contract`（verify:static/CIに追加）では、提供された単元完了の失敗入力・分析を個人情報・セッション・日時・選択データを除いたfixtureで再現する。旧出力の拒否、実装のclaimを生成させないJSONスキーマ、正しい回答claimでの二段生成成功、実装根拠の保持、不正な概念状態・根拠・未知IDの拒否、全7単元の対象なし／1概念／複数概念、SDKへのスキーマ変換、STANDARD/PERSONALIZED共通性を確認する。実DB・実LLMの再生成は自動テストでは行わない。DB変更・既存FAILEDの再生成・デプロイは行わない。
