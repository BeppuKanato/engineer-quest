# カード獲得・実績提示・コレクション（Issue #111）

- 目的: 学習の区切りにカード獲得と小実績を提示し、単元最後に獲得実績を集約する。未所持カードは存在と残り枚数を示す。
- 適用範囲・状態: 新フローの学習画面、最終リザルト、既存コレクション／知識カード画面の実装記録。
- 最終確認日: 2026-11-05。
- 起点: 最新`develop` `bb6c3b5`（#108／PR #112、#109／PR #113、#110／PR #115マージ済み）から`feat/learning-rewards-111`。
- 正本: [Issue #111](https://github.com/BeppuKanato/engineer-quest/issues/111)、[Issue #78](https://github.com/BeppuKanato/engineer-quest/issues/78)、[#109のPR本文](https://github.com/BeppuKanato/engineer-quest/pull/113)、[UI/UX方針 §3〜6](concept/app-ui-ux-guideline.md)、[開発ルール](development-rules.md)。

## 受け渡し口と表示タイミング

#109の`LearningRewards`、`LearningRewardsContext`／`useLearningRewards()`、`dismissAwardedCard(cardId)`、最終リザルトの`renderRewards(rewards)`は変更していない。

`LearningRun.completePhase`は既存のフェーズ完了APIが成功してから報酬をマージする。カードまたは途中実績があれば、同じ`onPhaseComplete`のPromise内で短い提示の完了を待ち、その後、既存の単元フローへ制御を戻す。次フェーズの再生・回答・編集を始める前に提示するため、新しい報酬専用画面や遷移は設けない。API失敗は従来の保存エラーへ戻し、演出は起動しない。

`LearningRewardBoundary`はContextのカードキューの先頭を表示し、終了／スキップ時だけdismissする。複数件あれば取得順に消費する。離脱時は待機を解放し、タブ非表示中は演出の残り時間を止める。Esc・背景クリック・常設のスキップボタンでも終了できる。モーション軽減設定では回転・拡縮・光・粒子を出さず、段階と情報は保持する。

最終フェーズで返る実績は途中提示せず、元の実績配列に保持する。`FinalLearningRewards`を既存`renderRewards`へ渡し、途中の実績・最終フェーズの実績・単元完了APIから後着する実績をID重複なしで一覧にする。途中提示は小さい見出しとアイコン、最終リザルトは大きい見出しとアイコンを使い、賞賛の勾配を保つ。

教材content、プレイヤーの見た目、テスト・ヒント・トレース、フィードバック層は変更しない。単品プレビューは報酬接続を持たないため従来どおり動く。

## カードの3段階

数値はUI/UX方針の許容範囲内の実装値として`rewards/presentation.ts`に分離した。レア度はAPIから受け取り、確率・テーブル・付与条件はフロントで再定義しない。

| レア度 | 前振り | 出現 | 賞賛 | 合計 | 強さ |
| --- | --- | --- | --- | --- | --- |
| COMMON | 350ms | 450ms | 800ms | 1.6秒 | 小さい拡縮、粒子・光なし |
| RARE | 450ms | 600ms | 950ms | 2.0秒 | 拡縮・小回転、4つの光、控えめな発光 |
| EPIC | 550ms | 750ms | 1,100ms | 2.4秒 | 拡縮・回転を強め、8つの光と発光 |

前振りではカード名を出さず「？？？」を示す。出現時に名前・番号・レア度・関連概念のラベル、賞賛時に具体的な一文とコレクションで読み返せる旨を示す。途中実績が同時にあれば賞賛の部分へ並べる。実績だけの場合は1.8秒の小さな提示とし、同じスキップ操作を使う。本文の説明は既存コレクションで読めるため、演出のために長時間拘束しない。

色は知識カード画面に既存のCOMMON／RARE／EPICの配色を共有モジュールへ移した。背景・文字・枠はアプリ学習用トークンを使い、教材のアルゴリズム状態色と混同しない。

## コレクション

既存`GET /api/collection`は公開済みカード全件と所持状態を返し、未所持の本文はすでにマスクしている。API拡張・DB変更は不要だった。

`/knowledge-cards`では未所持分を共通の灰色シルエット＋「？？？」にし、名前・説明・番号・レア度・レア度由来の色・詳細への操作を出さない。レア度順を選んでも未所持分の順序にレア度を使わず、内容を推測できないようにする。URLの`cardId`を未所持IDにしても詳細を開かない。所持済みの詳細と検索キーワード等は維持する。

全体と単元別に「あとn枚」を表示し、`/collection`の入口にも残り枚数を表示する。所持済みレア度別枚数は従来どおり。既存の実績一覧・プロフィール設定・目標選択の仕様は変更しない。

表示済みキューは学習画面の滞在中だけ保持する。再読込で獲得演出を再提示しない。過去の獲得履歴は既存のコレクション／実績一覧へ進んで確認する。完了済み単元の再訪で新しい実績応答がない場合は、その一覧への案内を表示し、「実績がない」とは断定しない。

## 確認方法

#112のmigration・seedが適用済みの**開発環境**を使い、ログイン・HEXAD回答済みのテストアカウントで確認する。本変更によるDB適用は行っていない。`front/`で`NEXT_PUBLIC_API_BASE_URL=<バックエンドURL>`を設定し、`npm run dev`。

- BFS学習: `http://localhost:3000/courses/roadmap/course-algorithm-breadth-first-search-v1/learn`
- 単元画面: `http://localhost:3000/courses/roadmap/course-algorithm-breadth-first-search-v1`
- コレクション: `http://localhost:3000/collection`
- 知識カード: `http://localhost:3000/knowledge-cards`
- 実績: `http://localhost:3000/achievements`

localhostは起動したマシンのURLであり、クラウドから手元PCへ公開した共有URLではない。

テーブル番号は既存`/api/auth/me`の`user.knowledgeCardTableNumber`で確認できる。新規アカウントには1〜15が割り当たる。未所持カードがあるテストアカウントを使うこと。既に所持するカードは同じフェーズを復習しても再付与・再演出されない。

| テーブル番号 | フェーズ2：重みなし最短経路（RARE） | フェーズ5：collections.deque（COMMON） | フェーズ7：双方向探索（EPIC） |
| --- | --- | --- | --- |
| 1・8・14 | ○ | ○ | ○ |
| 2・9 | ○ | ○ | — |
| 3・11 | ○ | — | ○ |
| 4・10 | — | ○ | ○ |
| 5・13 | ○ | — | — |
| 6・12 | — | ○ | — |
| 7・15 | — | — | ○ |

この表は`back/prisma/seedData/knowledgeCardSeed.ts`の現行スケジュールから記録した確認用の表で、アプリの付与判定には使わない。

1. テーブル1・8・14の未所持アカウントでフェーズ2を終える。前振り→出現→賞賛を確認し、次フェーズの開始が提示後であることを確認する。別のカードではスキップ・Escも試す。
2. フェーズ3と5を初回全問正解すると「確認フェーズ初回全問正解」、フェーズ6で初回満点なら「応用・総括 初回満点」が区切りで提示される。途中の誤答・再生・実装中には演出が出ない。
3. フェーズ7で全テストを通す。出現対象ならEPICカードを確認し、最終リザルトで自力実装クリア・条件に応じたノーヒント等・単元完了の実績が一覧になることを確認する。一般の枚数／単元数の実績もAPIが返せば同じ一覧に加わる。
4. フェーズ完了APIを失敗させた場合は演出が出ず、既存の保存エラーから再試行できることを確認する。
5. コレクションへ進み、未所持の影と残り枚数、所持済みの詳細を確認する。未所持IDの`?cardId=`では詳細が開かないことも確認する。
6. 390px幅とモーション軽減設定でもスキップ・閉じる・スクロールで操作できることを確認する。

## 検証と制限

- フロントのlint／typecheck／build、既存verify全12本と追加`verify:learning-rewards`が成功。追加verifyは段階・時間上限・レア度差、最終実績の振り分け、待機と離脱の解放、既存キュー契約、未所持の非操作表示・情報に依存しない整列を確認する。
- バックエンドの`verify:collections`成功（7コース、30実績、3カード、15テーブル・27スロット）。ローカルPrisma Clientを生成して実行した。DB migration／seed適用・DB書込は行っていない。
- Chromiumのproduction buildで1366×768と390×844を確認。実際の7フェーズ操作、実Pyodideによるフェーズ7の採点、カード全3段階、スキップ、保存失敗と再試行、途中・最終実績、未所持表示・URLの詳細ガードを確認した。APIと認証はseedの文面・既存レスポンス契約を使ったモック応答で、実DB・実アカウントとの結合確認は未実施。
- 検証時だけMonaco／Pyodideの同じ配布版を一時ローカル配信した。アプリのCDN設定やPython実行・採点は変更／モックしていない。
- **既存の制限**: 知識カード画面の再読込を繰り返すと、production buildでReact #418（初期描画の不一致）が断続的に出る。同じ検証条件の変更前`develop bb6c3b5`を別ディレクトリでbuildしても再現した。最終確認では学習画面への再訪時にも同型の警告を1件検出した。画面は復旧し上記操作は通るが、共通のSSR／初期描画の原因特定・解消は本変更に含めていない。この警告以外のブラウザ例外は検出していない。

追加した提示イベントは既存の学習ログキューへ非同期で流す。`card_presentation_view`／`card_presentation_dwell`はカードID・フェーズ・レア度・可視時間、`card_presentation_end`は終了時の段階とスキップ有無、`achievement_present_view`／`achievement_present_dwell`は実績IDとphase-boundary／unit-resultの表示場所、`achievement_presentation_end`は実績だけの提示の終了を記録する。既存の受け渡し口にテーブルIDはないため、推測して追加していない。

## 確認画像

| 場面 | 1366×768 | 390×844 |
| --- | --- | --- |
| RAREの前振り | [前振り](figures/learning-rewards-111/1366-rare-anticipation.png) | [スキップ前](figures/learning-rewards-111/390-rare-anticipation.png) |
| RAREの出現・賞賛 | [出現](figures/learning-rewards-111/1366-rare-appearance.png)・[賞賛](figures/learning-rewards-111/1366-rare-praise.png) | — |
| COMMONと小実績 | [賞賛](figures/learning-rewards-111/1366-common-praise.png) | [賞賛](figures/learning-rewards-111/390-common-praise.png) |
| EPIC | [出現](figures/learning-rewards-111/1366-epic-appearance.png)・[賞賛](figures/learning-rewards-111/1366-epic-praise.png) | [出現](figures/learning-rewards-111/390-epic-appearance.png)・[賞賛](figures/learning-rewards-111/390-epic-praise.png) |
| 実績だけの区切り | [小実績](figures/learning-rewards-111/1366-phase-achievement.png) | [小実績](figures/learning-rewards-111/390-phase-achievement.png) |
| 最終リザルト | [実績一覧](figures/learning-rewards-111/1366-final-achievements.png) | [実績一覧](figures/learning-rewards-111/390-final-achievements.png) |
| 未所持の影と残り枚数 | [コレクション](figures/learning-rewards-111/1366-collection.png) | [コレクション](figures/learning-rewards-111/390-collection.png) |
| エラーに演出なし | [保存失敗](figures/learning-rewards-111/1366-save-error-no-reward.png) | — |
