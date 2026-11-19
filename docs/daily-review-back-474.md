# 今日の復習バックエンド（B3-a）

- 目的: 学習済み内容を翌日以降に1日1問思い出すため、問題の選出と復習専用の回答記録を提供する。
- 適用範囲: バックエンドAPI、DailyReview、追加migration、DB不要の検証。ホーム表示・出題画面は次のカード。
- 最終確認日: 2026-11-19。
- 正本: [Issue #474](https://github.com/BeppuKanato/engineer-quest/issues/474)、[開発ガイド](../AGENTS.md)、[教材指針](concept/learning-materials-guideline.md)。
- 対象実装コミット: `f0cdd5b7`。
- 状態: 実装・静的検証済み。migrationは全環境で未適用、実DBのE2E／競合検証は未実施。

## 記録の分離

新設の `DailyReview` にuserId、reviewDate（PostgreSQL DATE）、courseId／phaseKey／assessmentId／questionId、selectedAt、answeredAt、correctを保存する。userId＋reviewDateのunique制約で日次1行。answeredAtとcorrectは未回答時ともにnullで、SQLのCHECK制約でも整合性を保証する。correct／answeredAtのユーザー別索引を付ける。

学習モデルへの外部キーは持たず、ユーザーだけを参照する。フェーズ削除等と復習履歴の寿命を連動させない。ユーザー削除時は当人の復習行をCascade削除する。

サービスは共有prismaからフェーズ進捗を読み、復習テーブルだけへupsert／updateManyする。learning.service、概念到達判定、フィードバック生成、実績付与は呼ばない。LearningEventにも記録しない。従来の学習日カレンダーの記録源へ復習を追加しない。

## 選出

- 日次キーはAsia/Tokyoで作り、DATE列にはその日のYYYY-MM-DDを保存する。UTCの15時に翌日へ切り替わる。
- 同日の行があれば回答済みでもそのまま返す。進捗の変化や回答結果で問題を差し替えない。
- 対象は本人のCOMPLETEDかつcompletedAtが存在し、日本時間の当日0時より前に完了したフェーズ。翌日以降の復習として、当日完了分はまだ対象にしない。
- 問題のIDは既存conceptDefinitionsのフェーズ番号3・5・6から取得。問題文・正解・requiresは取り込まない。
- フェーズsummary.assessmentEvidenceのv1／v2／v3を読み、同じassessmentId・questionIdのattempts先頭がfalseなら優先する。最終試行が正解でも初回ミスである。証拠欠損・不正形式は初回ミス扱いせず、その完了フェーズの問題を通常候補とする。
- 初回ミスを優先し、次にcompletedAtが古い順。同順位はcourse／phase／assessment／questionの固定ID順。
- 本人が復習で正解してから30×24時間未満の同一問題を除外する。正解日時からちょうど30日経過した時点で再び候補にできる。問題の同一性は4つのIDの組で判定する。
- 不正解には追加の除外期間を設けない。ただし当日の行が固定されるため、再選出は翌日以降。
- 候補がないときはreview:nullで、空の行を作らない。null後の再取得は改めて候補を調べる。
- 同時選出は日次unique＋更新なしupsertで収束させ、PrismaのP2002競合時も当日行を再取得する。

## API

両エンドポイントとも既存のFirebase認証middlewareを必須とする。userIdや対象日をリクエストから受け取らない。

### GET /api/daily-review/today

選出と保存を行うため、取得時にもDailyReviewの作成が起こり得る。

```json
{
  "review": {
    "id": "復習行のID",
    "date": "2026-11-19",
    "courseId": "教材コースID",
    "phaseKey": "フェーズキー",
    "assessmentId": "評価セットID",
    "questionId": "問題ID",
    "selectedAt": "2026-11-19T00:00:00.000Z",
    "answeredAt": null,
    "correct": null
  }
}
```

候補なしは200で `{"review":null}`。回答後はansweredAtとcorrectを含む同じ行を返す。userId、問題文、選択肢、正解、評価証拠は返さない。

### POST /api/daily-review/today/answer

```json
{"reviewId":"取得した復習行のID","correct":false}
```

- フロントで判定したbooleanだけを受け取り、200で同じreview形式を返す。IDと正誤以外の追加キーは拒否。
- 今日の本人の行・reviewIdが一致するときだけ、answeredAt:nullを条件に原子的に初回回答を保存する。
- 同じ正誤の再送は成功し、元の回答日時を保持する。異なる正誤は409 `DAILY_REVIEW_ALREADY_ANSWERED`。
- 別ユーザー、前日のID、存在しないID、今日未選出なら404 `DAILY_REVIEW_NOT_FOUND`。日付変更後はGETで当日の問題を取り直す。
- 不正bodyは400 `INVALID_REVIEW_ANSWER`。未認証は既存middlewareに従って拒否し、controllerにも401の認証ガードを置く。

## 検証と限界

- backのtypecheck／lint／build／verify:static成功。`verify:daily-review` をstaticへ追加。
- Prisma Client生成／prisma validate成功。develop schemaからのオフラインmigrate diffはDailyReviewの新設と索引／外部キーのみ。手書きmigrationには回答2列のCHECKも追加した。
- migrationディレクトリからのdiffはshadow DBが必要なため実行不可。schema同士のオフラインdiffで構造を確認した。実DBへのSQL適用と制約・競合の実行検証は未実施。
- 初回ミス優先／古いフェーズ／同日固定／日本時間の境界／30日の境界／不正解翌日／候補なし／所有権／同時取得／回答競合／再送／HTTP入力検証をメモリアダプターで検証。v1／v2／v3の証拠形式を確認。
- アダプターは他モデルへのアクセスとフェーズへの書き込みを即失敗させる。回答前後のstatus・completedAt・summary内assessmentEvidenceのdeep equalityも確認した。ログには次を出力する（本番DBの監査ログではない）。

```json
{"result":"PASS","writes":["dailyReview.upsert","dailyReview.updateMany"],"forbiddenWrites":0,"phaseEvidenceAndProgressUnchanged":true}
```

- フィードバック生成・割当・既存学習保存サービス・問題・concepts.jsonは変更していない。フロント変更がないためUI撮影は対象外。

## DB適用

**適用が必要。今回はlocal／dev／productionのいずれにも未適用。** 追加migrationは `20261119090000_add_daily_reviews`。既存テーブルや既存学習記録の変更・データ補完はない。seed適用は不要。

運用者は対象環境を明示して接続先を確認し、バックアップ／復元手段と未適用migration一覧を確認してから、backで次を実行する。migration用にはdirect接続を使い、接続文字列は出力しない。

```sh
npx --no-install prisma migrate status
npx --no-install prisma migrate deploy
npx --no-install prisma generate
```

DB適用後にバックエンドをデプロイする。CDのコードデプロイだけではテーブルは作られない。実DB確認時は検証用ユーザーを使用し、取得前後・回答前後のPhaseLearningProgress／UnitLearningProgress／学習イベントの差分がないことと、復習行だけが増減することを確認する。初期状態からの実績・フィードバック・概念到達状態に変化がないことも確認する。
