# 問題一覧ドラフト v2（Course 1〜8）

このドキュメントは、`learningSeed.ts` に落とす前のロードマップ設計案です。

今回の修正版では、以前の `Lesson` 前提を外し、現在の画面設計に合わせて次の階層で整理します。

```text
Course
  ├ Main Mission
  │   ├ Section
  │   │   ├ Activity
  │   │   ├ Activity
  │   │   └ Activity
  │   └ Mission Check Section
  └ Challenge Mission
      ├ Section
      └ Mission Check Section
```

## 設計ルール

- `Main Mission`: 授業理解と単位取得に必要な本線。ここだけ進めればコースの最低ラインを達成できる。
- `Challenge Mission`: 任意の枝ミッション。進度が早い学生、興味がある学生向け。
- `Section`: 画面上のまとまり。学習単位ではなく、ロードマップ上の区切り。
- `Activity`: 進捗保存の最小単位。Tutorial / Choice / Match / Ordered Steps / Mission Check など。
- `Mission Check`: Mission の最後に置く確認問題群。基本は 2〜3 Activity。
- `easy / normal / hard`: 自由度ではなく、入力量・再現するコード量・組み合わせ量の違い。

## Course 全体方針

| Course | 目的 | Main | Challenge |
|---|---|---:|---:|
| Course 1 | Webアプリ全体像 | 7 | 3 |
| Course 2 | Flaskでページ表示 | 8 | 3 |
| Course 3 | HTML/CSSで画面作成 | 9 | 4 |
| Course 4 | PythonでWeb入力処理 | 8 | 3 |
| Course 5 | データ保存と一覧表示 | 8 | 4 |
| Course 6 | APIとAI | 7 | 3 |
| Course 7 | ユーザー機能 | 6 | 3 |
| Course 8 | 自分のアプリ企画 | 7 | 3 |

---

# Course 1: Webアプリの全体像を知る

## 目的

ブラウザ、サーバ、HTML/CSS、Python/Flask、DB、API がそれぞれ何を担当するかを知り、以降の学習が Web アプリ全体のどこに位置づくかを理解する。

## 対応する講義日

- 1日目
- 2日目のフロント/サーバ開発の話
- 5日目の API 導入

## Main Mission 1: Webページが表示される流れを知る

> 方針: 既存の `webFlowMission` と同じ内容にする。

目的: URL にアクセスしてから Web ページが表示されるまでの大きな流れをつかむ。

### Section 1: ブラウザの役割を知る

- Activity: Webページを見るとき、最初に動くのはブラウザ
- Activity: URLを入力したとき、ブラウザは何をする？
- Activity: ブラウザに近い役割はどれ？

### Section 2: サーバとHTMLの役割を知る

- Activity: サーバはページを返す係
- Activity: サーバの役割はどれ？
- Activity: HTMLは画面の中身になる
- Activity: ブラウザ・サーバ・HTMLを役割に分けよう

### Section 3: Webページ表示の流れを並べる

- Activity: Webページ表示は「お願い」と「返事」の流れ
- Activity: Webページ表示の順番を並べよう
- Activity: 誰が何をしている？

### Section 4: 表示されないときの確認場所を考える

- Activity: 表示されないときも、流れで考えればよい
- Activity: ページが表示されないとき、まず何を見る？
- Activity: HTMLが関係していそうなトラブルはどれ？

### Mission Check

- Mission Check: 役割を対応づけよう
- Mission Check: Webページ表示の流れを確認しよう
- Mission Check: 表示されないときの確認場所

### Mission Exam 案

- easy: ブラウザ、サーバ、HTML の役割を対応づける
- normal: 画面表示までの順番を並べ替える
- hard: 表示されない症状から確認場所を判断する

## Main Mission 2: フロントエンドとバックエンドを区別する

> 方針: 既存の `frontendBackendMission` と同じ内容にする。

目的: HTML/CSS が画面側、Python/Flask がサーバ側に近い役割であることを理解する。

### Section 1: まずは画面側と裏側に分けてみる

- Activity: Webアプリは「見える部分」と「裏側の部分」に分けられる
- Activity: 画面に近いものはどれ？
- Activity: 裏側の処理はどれ？

### Section 2: 技術名を役割に対応づける

- Activity: HTML/CSS と Python/Flask の担当を見てみる
- Activity: 技術名を担当に分けよう
- Activity: 画面の部品と処理を分けよう
- Activity: Flaskが担当しそうなことは？

### Section 3: フォーム送信でつながりを見る

- Activity: フロントエンドとバックエンドは通信でつながる
- Activity: 予約フォームの流れを並べよう
- Activity: フォーム送信の担当を分けよう

### Mission Check

- Mission Check: フロントエンドに近いものを選ぼう
- Mission Check: 技術と役割を対応づけよう
- Mission Check: フォーム送信の流れを確認しよう

### Mission Exam 案

- easy: 技術名をフロント/バックに分類する
- normal: フォーム送信の処理を担当ごとに分ける
- hard: DB 保存と画面表示を含む処理を分類する

## Main Mission 3: リクエストとレスポンスを知る

目的: Web アプリの通信を「お願い」と「返事」として理解する。

### Section 1: リクエストはサーバへのお願い

- Activity: URLアクセスはページをくださいというリクエスト
- Activity: フォーム送信も入力内容を送るリクエスト
- Activity: どれがリクエストに近いか選ぶ

### Section 2: レスポンスはサーバからの返事

- Activity: HTML、JSON、エラー画面もレスポンスになりうる
- Activity: 返ってくるものを分類する
- Activity: 成功時と失敗時の返事を見比べる

### Section 3: GET と POST の入口

- Activity: ページを見る GET とデータを送る POST の違いを知る
- Activity: 場面に合う通信を選ぶ
- Activity: フォーム送信の流れを並べる

### Mission Check

- Mission Check: リクエスト/レスポンスを対応づける
- Mission Check: フォーム送信の通信順を並べる
- Mission Check: GET/POST の使い分けを判断する

## Main Mission 4: localhost と開発環境を知る

目的: 自分の PC で動かして確認する開発用サーバを理解する。

### Section 1: localhost の意味

- Activity: `localhost` は自分の PC を指す名前だと知る
- Activity: `localhost:5000` のような URL の意味を見る
- Activity: URL の中のホスト名とポート番号を分ける

### Section 2: 開発環境と公開環境

- Activity: 自分だけが見る環境と他人も見る環境を比べる
- Activity: 講義ではまずローカルで確認する理由を選ぶ
- Activity: ローカルで動くが公開されていない状態を判断する

### Mission Check

- Mission Check: localhost の意味を選ぶ
- Mission Check: ローカル開発と公開環境を分類する
- Mission Check: PC、ブラウザ、開発サーバの関係を並べる

## Main Mission 5: HTML/CSS/Python/DB/API の位置づけを知る

目的: 今後出てくる技術が何のために必要かを先に見取り図として持つ。

### Section 1: HTML と CSS の位置づけ

- Activity: HTML は構造、CSS は見た目を担当することを知る
- Activity: 画面例から HTML と CSS の担当を分ける
- Activity: 表示内容と見た目の変更を分類する

### Section 2: Python と Flask の位置づけ

- Activity: Python は処理を書く言語として見る
- Activity: Flask は Web アプリを作る道具として見る
- Activity: Flask が HTML を返す例を見る

### Section 3: DB と API の位置づけ

- Activity: DB は保存、API は外部連携の入口として見る
- Activity: 予約アプリに必要な技術を選ぶ
- Activity: 小さなアプリを技術ごとに分解する

### Mission Check

- Mission Check: 技術名と役割を対応づける
- Mission Check: 小さなアプリに必要な技術を選ぶ
- Mission Check: アプリの処理を HTML/CSS/Python/DB/API に分解する

## Main Mission 6: エラーが起きた場所を大まかに考える

目的: 画面が出ない、保存されない、見た目が変わらないときに、どこを確認するかを考えられるようにする。

### Section 1: 画面が表示されない

- Activity: URL、サーバ起動、HTML の候補を見る
- Activity: 症状から最初に確認する場所を選ぶ
- Activity: エラー画面と何も出ない状態を見比べる

### Section 2: 見た目が変わらない

- Activity: CSS の読み込み、class 名、保存忘れの例を見る
- Activity: CSS 側の問題を選ぶ
- Activity: HTML 側と CSS 側の疑いを分ける

### Section 3: 入力が反映されない

- Activity: フォーム、サーバ処理、テンプレート表示の候補を見る
- Activity: 入力値がどこで止まったかを推理する
- Activity: フロント/バック/DB のどこを疑うか選ぶ

### Mission Check

- Mission Check: 症状と確認場所を対応づける
- Mission Check: 画面表示の不具合を順番に確認する
- Mission Check: 複数の症状から疑う場所を分ける

## Main Mission 7: 最終制作で使う考え方を知る

目的: Web アプリを「画面」「入力」「処理」「保存」「外部連携」に分けて考える準備をする。

### Section 1: アプリを部品で見る

- Activity: 予約サイトを画面、入力、保存に分ける
- Activity: SNS や診断アプリも同じ観点で分ける
- Activity: アプリの構成要素を選ぶ

### Section 2: 作る前に考えること

- Activity: 誰が、いつ、何に困るかを考える
- Activity: 最小機能を選ぶ
- Activity: 後回しにしてよい機能を判断する

### Mission Check

- Mission Check: アプリの構成要素を選ぶ
- Mission Check: 予約アプリを画面/入力/保存に分解する
- Mission Check: 自分のアプリ案に必要な構成要素を選ぶ

## Challenge Mission 1-A: 通信の流れを図にする

解放条件: Main Mission 3 クリア後

目的: リクエスト、レスポンス、HTML、DB 保存を図として整理する。

### Section 1: 図で整理する

- Activity: 簡単な通信図を見る
- Activity: 矢印の向きを選ぶ
- Activity: フォーム送信の流れに DB を追加する

### Mission Check

- Mission Check: フォーム送信の図を完成させる
- Mission Check: DB 保存後に一覧表示する流れを完成させる

## Challenge Mission 1-B: エラー調査の順番を作る

解放条件: Main Mission 6 クリア後

目的: 不具合が起きたときの確認順を自分で組み立てる。

### Section 1: 確認順を考える

- Activity: よくあるエラー症状を見る
- Activity: 先に確認するものを選ぶ
- Activity: 画面、サーバ、DB をまたぐ問題を見る

### Mission Check

- Mission Check: 症状と確認場所を対応づける
- Mission Check: 確認順を並べ替える

## Challenge Mission 1-C: アプリの構成を推理する

解放条件: Main Mission 7 クリア後

目的: 身近な Web サービスを構成要素に分解する。

### Section 1: 既存サービスを観察する

- Activity: ログイン、検索、投稿、予約などの機能を見る
- Activity: それぞれに必要な画面/処理/保存を選ぶ
- Activity: API や AI が入る場所を推理する

### Mission Check

- Mission Check: 既存アプリを画面/入力/保存に分ける
- Mission Check: 発展機能がどこに入るか推理する

---

# Course 2: Flaskでページを表示する

## 目的

Flask プロジェクトの構成を理解し、Python 側の処理から HTML テンプレートを返してブラウザで確認できるようにする。

## 対応する講義日

- 1日目

## Main Mission 1: プロジェクトを開いて構成を見る

目的: VS Code でプロジェクト全体を開き、どのファイルが何に関係しているかをざっくり見る。

### Section 1: フォルダを開く意味を知る

- Activity: ファイル単体ではなくフォルダを開く理由を知る
- Activity: VS Code のファイルツリーを見る
- Activity: 画面に関係しそうなファイルを探す

### Section 2: Flask プロジェクトの主要ファイルを見る

- Activity: `app.py` を見つける
- Activity: `views.py` を見つける
- Activity: `templates/index.html` を見つける
- Activity: ファイル名と役割を対応づける

### Mission Check

- Mission Check: ファイル名と役割を対応づける
- Mission Check: 最小構成のフォルダ配置を選ぶ

## Main Mission 2: app.py の役割を知る

目的: Flask アプリの入口として `app.py` が何をしているかを理解する。

### Section 1: アプリの入口を見る

- Activity: `Flask(__name__)` の位置を見る
- Activity: アプリを作っている行を選ぶ
- Activity: `if __name__ == "__main__"` の役割をざっくり知る

### Section 2: Blueprint 登録を知る

- Activity: `register_blueprint` の例を見る
- Activity: ルート処理を別ファイルに分ける理由を知る
- Activity: アプリ作成と Blueprint 登録の行を分類する

### Mission Check

- Mission Check: `app.py` の役割を選ぶ
- Mission Check: アプリ作成と Blueprint 登録の行を穴埋めする
- Mission Check: 最小の `app.py` 断片を再現する

## Main Mission 3: views.py で URL と処理をつなぐ

目的: `@route` が URL と Python の関数をつなぐことを理解する。

### Section 1: route の意味

- Activity: `@route("/")` が URL と関数をつなぐことを知る
- Activity: `/` に対応する関数を選ぶ
- Activity: `/hello` のような別 URL を見る

### Section 2: 関数がレスポンスを返す

- Activity: `return` の役割を見る
- Activity: URL アクセスから関数実行までを並べる
- Activity: 関数名と URL の違いを確認する

### Mission Check

- Mission Check: URL と関数を対応づける
- Mission Check: route と関数の短いコードを完成させる
- Mission Check: `/hello` 用の処理断片を再現する

## Main Mission 4: render_template で HTML を返す

目的: Python 側の処理から HTML テンプレートをブラウザへ返す流れを理解する。

### Section 1: テンプレートを返す

- Activity: `render_template("index.html")` を見る
- Activity: 返される HTML ファイルを選ぶ
- Activity: 文字列を返す場合と HTML を返す場合を比べる

### Section 2: templates フォルダの役割

- Activity: Flask がテンプレートを探す場所を知る
- Activity: `index.html` の置き場所を選ぶ
- Activity: テンプレート名のミスで起きる問題を見る

### Mission Check

- Mission Check: `render_template` の役割を選ぶ
- Mission Check: `return render_template("index.html")` を完成させる
- Mission Check: route から template を返す処理を再現する

## Main Mission 5: サーバを起動してブラウザで確認する

目的: Flask サーバを起動し、ブラウザで `localhost` にアクセスして確認する流れを理解する。

### Section 1: 起動コマンドを知る

- Activity: Flask サーバを起動する流れを見る
- Activity: 起動中と停止中の違いを知る
- Activity: ターミナルに出る URL を確認する

### Section 2: ブラウザでアクセスする

- Activity: `localhost` の URL を見る
- Activity: 表示されたページと HTML の対応を見る
- Activity: ページが出ないときに確認する場所を選ぶ

### Section 3: サーバを止める

- Activity: Ctrl+C で停止することを知る
- Activity: 停止後にアクセスできなくなることを確認する

### Mission Check

- Mission Check: 起動、確認、停止の順番を選ぶ
- Mission Check: ブラウザで確認する URL を選ぶ
- Mission Check: 起動から確認までの手順を並べる

## Main Mission 6: HTML を編集して表示を変える

目的: `index.html` を編集し、保存と再読み込みで画面が変わることを理解する。

### Section 1: index.html を編集する

- Activity: 見出しの文章を変える
- Activity: 変更前後の画面を見比べる
- Activity: `h1` と `p` の表示例を見る

### Section 2: 保存と再読み込み

- Activity: 保存しないと反映されないことを知る
- Activity: ブラウザの再読み込みをする場面を選ぶ
- Activity: 変更が反映されない原因を選ぶ

### Mission Check

- Mission Check: 表示文を変える HTML を完成させる
- Mission Check: 見出しと本文を含む HTML 断片を再現する
- Mission Check: Flask で表示するトップページの HTML を再現する

## Main Mission 7: テンプレートへ値を渡す

目的: Python 側で用意した値を HTML 側に表示する流れを理解する。

### Section 1: Python 側で値を用意する

- Activity: `message = "..."` のような値を見る
- Activity: 画面に出したい値をどこで用意するか選ぶ
- Activity: 複数の値を用意する例を見る

### Section 2: HTML 側で値を表示する

- Activity: `{{ message }}` の意味を知る
- Activity: 固定文字列とテンプレート変数を見比べる
- Activity: 変数名の対応を確認する

### Section 3: 値を変えて表示を確認する

- Activity: Python 側の値を変えると画面が変わる例を見る
- Activity: 表示されないときに変数名を確認する

### Mission Check

- Mission Check: `{{ message }}` を穴埋めする
- Mission Check: Python から渡した値を `h1` と `p` に表示する
- Mission Check: 複数の値をテンプレートに表示するコード断片を再現する

## Main Mission 8: Flask の最小ページを一通り説明する

目的: `app.py`、`views.py`、`index.html` のつながりを説明できるようにする。

### Section 1: ファイル間のつながりを復習する

- Activity: `app.py`、`views.py`、`index.html` のつながりを見る
- Activity: どのファイルを編集すると何が変わるか選ぶ
- Activity: URL、関数、template、表示の順番を並べる

### Section 2: 最初のページを説明する

- Activity: 自分の言葉に近い説明文を選ぶ
- Activity: Flask でページが出る流れを完成させる

### Mission Check

- Mission Check: 3ファイルの役割を対応づける
- Mission Check: Flask でページが出る流れを完成させる
- Mission Check: 最小 Flask ページのコード断片を再現する

## Challenge Mission 2-A: 2ページ構成にする

解放条件: Main Mission 4 クリア後

### Section 1: 別 URL を追加する

- Activity: `/about` の例を見る
- Activity: URL と関数を対応づける
- Activity: 2つの URL が別々の関数につながることを知る

### Section 2: 別テンプレートを返す

- Activity: `about.html` を返す処理を見る
- Activity: テンプレート名を穴埋めする

### Mission Check

- Mission Check: 2ページ構成の route を完成させる
- Mission Check: トップページと About ページの処理を再現する

## Challenge Mission 2-B: スマホから確認する考え方を知る

解放条件: Main Mission 5 クリア後

### Section 1: 同じネットワークから見る

- Activity: `0.0.0.0` や PC の IP の考え方を知る
- Activity: localhost との違いを選ぶ
- Activity: PC/スマホ/開発サーバの関係を並べる

### Mission Check

- Mission Check: localhost と IP アドレスの違いを選ぶ
- Mission Check: スマホ確認で必要な条件を選ぶ

## Challenge Mission 2-C: 共通レイアウトを考える

解放条件: Main Mission 8 クリア後

### Section 1: 複数ページで同じ部品を使う

- Activity: ヘッダーやナビゲーションの共通化例を見る
- Activity: 共通にしたい部品を選ぶ
- Activity: 2ページに同じナビを入れる HTML を見る

### Mission Check

- Mission Check: 共通化しやすい部品を選ぶ
- Mission Check: 共通レイアウトの考え方を説明順に並べる

---

# Course 3: HTML/CSSで画面を作る

## 目的

HTML で情報の構造を作り、CSS で見た目を整える。最終的に簡単なサービス風トップページを組めるようにする。

## 対応する講義日

- 1日目
- 4日目のフロント改善

## Main Mission 1: HTML の骨組みを知る

目的: HTML 文書の基本形と、画面に表示される場所・設定を書く場所を区別する。

### Section 1: HTML 文書の基本形

- Activity: `doctype`、`html`、`head`、`body` を見る
- Activity: 表示される場所と設定を書く場所を分ける
- Activity: 最小 HTML を穴埋めする

### Section 2: タイトルと本文

- Activity: `title` と `h1` の違いを見る
- Activity: 画面に表示されるタグを選ぶ
- Activity: ブラウザのタブ名と本文の違いを見る

### Mission Check

- Mission Check: `h1` と `p` を完成させる
- Mission Check: HTML の基本形を完成させる
- Mission Check: `meta charset` を含む HTML 文書を再現する

## Main Mission 2: 文章を構造化する

目的: 見出しと本文を使って、読みやすい情報構造を作れるようにする。

### Section 1: 見出しと本文

- Activity: `h1`、`h2`、`p` の表示例を見る
- Activity: 重要度に合うタグを選ぶ
- Activity: 見出しと本文の HTML を穴埋めする

### Section 2: 区切りとまとまり

- Activity: セクションごとに情報を分ける例を見る
- Activity: 読みやすい構成を選ぶ
- Activity: 紹介文を複数セクションに分ける

### Mission Check

- Mission Check: 見出しと本文を対応づける
- Mission Check: 講義紹介文の HTML を完成させる
- Mission Check: 複数セクションの文章構造を再現する

## Main Mission 3: リンクと画像を使う

目的: 別ページへの移動や画像表示を使って、Web ページらしい表現を作る。

### Section 1: リンクを作る

- Activity: `a` と `href` の役割を見る
- Activity: クリックできる文字を選ぶ
- Activity: リンクタグを穴埋めする

### Section 2: 画像を表示する

- Activity: `img` と `src` の役割を見る
- Activity: 画像が出ない原因を選ぶ
- Activity: `alt` の意味を知る

### Mission Check

- Mission Check: リンクタグを完成させる
- Mission Check: 画像つき紹介カードの HTML を再現する
- Mission Check: リンク、画像、説明文を含むブロックを再現する

## Main Mission 4: リストと表で情報を整理する

目的: 箇条書きや表を使って、複数の情報を見やすく整理する。

### Section 1: リストを使う

- Activity: `ul`、`ol`、`li` の違いを見る
- Activity: 箇条書きに向く情報を選ぶ
- Activity: リスト HTML を穴埋めする

### Section 2: 表を使う

- Activity: `table`、`tr`、`th`、`td` を見る
- Activity: 予約一覧に必要な列を選ぶ
- Activity: 簡単な表の HTML を完成させる

### Mission Check

- Mission Check: リストの HTML を完成させる
- Mission Check: 簡単な表の HTML を完成させる
- Mission Check: 予約一覧の表構造を再現する

## Main Mission 5: div と class で部品を作る

目的: 画面のまとまりに名前を付け、CSS を当てやすい構造を作る。

### Section 1: div でまとまりを作る

- Activity: カード UI の HTML 構造を見る
- Activity: どこからどこまでがカードか選ぶ
- Activity: まとまりを `div` で囲む

### Section 2: class で名前をつける

- Activity: `class="card"` の意味を知る
- Activity: class 名と CSS セレクタを対応づける
- Activity: `div class` を穴埋めする

### Mission Check

- Mission Check: `div class="card"` を完成させる
- Mission Check: カード風 HTML を再現する
- Mission Check: 複数カードの HTML 構造を再現する

## Main Mission 6: CSS を読み込む

目的: HTML と CSS を分け、CSS ファイルを HTML から読み込めるようにする。

### Section 1: CSS ファイルの役割

- Activity: HTML と CSS の分担を見る
- Activity: 見た目を変えるコードを選ぶ
- Activity: 同じ HTML でも CSS で見た目が変わる例を見る

### Section 2: CSS を HTML に読み込む

- Activity: `link rel="stylesheet"` を見る
- Activity: CSS が効かない原因を選ぶ
- Activity: Flask の `static` フォルダとの関係を知る

### Mission Check

- Mission Check: CSS 読み込みタグを完成させる
- Mission Check: Flask の static CSS を読み込む HTML を再現する
- Mission Check: HTML と CSS ファイルの対応を再現する

## Main Mission 7: 色・文字・余白を変える

目的: CSS の基本プロパティで、カードや本文の見た目を整える。

### Section 1: 色と文字サイズ

- Activity: `color`、`background-color`、`font-size` を見る
- Activity: どのプロパティが何を変えるか選ぶ
- Activity: 見出しの色と大きさを変える

### Section 2: 余白と枠線

- Activity: `margin`、`padding`、`border` の違いを見る
- Activity: カード UI に必要な余白を選ぶ
- Activity: CSS を穴埋めする

### Mission Check

- Mission Check: 色を変える CSS を完成させる
- Mission Check: カードの余白と枠線を整える CSS を再現する
- Mission Check: 見出し、本文、カードの CSS をまとめて再現する

## Main Mission 8: レイアウトを整える

目的: 縦並び・横並びを理解し、Flexbox の入口を扱えるようにする。

### Section 1: 縦に並べる、横に並べる

- Activity: ブロックの並びを見る
- Activity: 横並びに向く場面を選ぶ
- Activity: 横並びにすると読みにくい場面も見る

### Section 2: Flexbox の入口

- Activity: `display: flex` の例を見る
- Activity: `gap`、`align-items` を見る
- Activity: 横並びカードの CSS を穴埋めする

### Mission Check

- Mission Check: 横並びにするプロパティを選ぶ
- Mission Check: カードを横に並べる CSS を完成させる
- Mission Check: ヘッダーとカード一覧のレイアウト CSS を再現する

## Main Mission 9: サービス風トップページを組む

目的: ヘッダー、メイン、カード、ボタンを組み合わせて、サービス風のトップページを作る。

### Section 1: ページの部品を決める

- Activity: ヘッダー、メイン、カード、ボタンを分ける
- Activity: どの部品が必要か選ぶ
- Activity: 画面の上から順に部品を並べる

### Section 2: HTML を組み立てる

- Activity: トップページの HTML 構造を見る
- Activity: 部品ごとの HTML を穴埋めする
- Activity: カード一覧の HTML を作る

### Section 3: CSS を当てる

- Activity: 完成例と CSS を見比べる
- Activity: 最低限の CSS を完成させる
- Activity: 見やすい余白と配置を選ぶ

### Mission Check

- Mission Check: 小さな紹介カードを完成させる
- Mission Check: ヘッダーとカードを含むトップページ HTML/CSS を再現する
- Mission Check: サービス風トップページの主要部分を再現する

## Challenge Mission 3-A: ナビゲーションを追加する

解放条件: Main Mission 3 クリア後

### Section 1: ナビリンクを作る

- Activity: ナビゲーションの役割を見る
- Activity: ナビリンクを1つ追加する
- Activity: 複数リンクのナビゲーションを再現する

### Mission Check

- Mission Check: ヘッダー内にロゴとナビを配置する

## Challenge Mission 3-B: スマホでも見やすい画面を考える

解放条件: Main Mission 8 クリア後

### Section 1: 画面幅で見え方を考える

- Activity: スマホで困るレイアウトを選ぶ
- Activity: 1列表示に向く CSS を選ぶ
- Activity: メディアクエリの考え方を穴埋めする

### Mission Check

- Mission Check: スマホ向けに直すべき場所を選ぶ

## Challenge Mission 3-C: 予約サイトのトップページを整える

解放条件: Main Mission 9 クリア後

### Section 1: 予約サイトらしい画面にする

- Activity: 予約ボタンの HTML を完成させる
- Activity: 予約サイト風カードを再現する
- Activity: トップページ全体の主要 HTML/CSS を再現する

### Mission Check

- Mission Check: 予約サイト風トップページを組み立てる

## Challenge Mission 3-D: 自分のテーマに置き換える

解放条件: Main Mission 9 クリア後

### Section 1: テーマを変えて表現する

- Activity: 表示文を自分のテーマへ変える
- Activity: カードの中身を別テーマに置き換える
- Activity: 色、文言、画像領域をテーマに合わせて調整する

### Mission Check

- Mission Check: テーマに合わせた変更箇所を選ぶ

---

# Course 4: PythonでWebの入力を扱う

## 目的

Web アプリで必要になる Python の最小知識を学び、フォーム入力をサーバ側で受け取って画面に反映できるようにする。

## 対応する講義日

- 2日目

## Main Mission 1: Webで使うPythonの範囲を知る

目的: Web アプリでは Python を「画面の裏側で処理するため」に使うことを理解する。

### Section 1: 変数と文字列を見る

- Activity: 変数に文字を入れる例を見る
- Activity: 変数名と表示内容を対応づける
- Activity: 文字列と数値の違いを選ぶ

### Section 2: WebアプリでのPythonの役割

- Activity: Python が HTML を直接飾るわけではないことを知る
- Activity: 入力を受け取る、判定する、保存する処理を見る
- Activity: 画面側と処理側を分類する

### Mission Check

- Mission Check: 変数と表示内容を対応づける
- Mission Check: WebアプリでPythonが担当する処理を選ぶ

## Main Mission 2: ifで処理を分ける

目的: 入力値や条件によって、表示するメッセージや処理を変える考え方を理解する。

### Section 1: 条件でメッセージを変える

- Activity: `if` の基本形を見る
- Activity: 条件に合うときだけ実行される行を選ぶ
- Activity: 条件に合うメッセージを選ぶ

### Section 2: Web入力と条件分岐

- Activity: 入力値によって表示が変わる例を見る
- Activity: 年齢、人数、空欄などの条件を見る
- Activity: 条件分岐の短いコードを完成させる

### Mission Check

- Mission Check: `if` の条件と結果を対応づける
- Mission Check: 入力値に応じて表示を変えるコードを完成させる

## Main Mission 3: list と dict でデータを扱う

目的: 複数のデータや1件分のデータを Python で表す方法を理解する。

### Section 1: list で複数データを持つ

- Activity: 複数の名前を list で持つ例を見る
- Activity: list に向くデータを選ぶ
- Activity: 何番目のデータかを読む

### Section 2: dict で1件分のデータを持つ

- Activity: 予約1件を dict で表す例を見る
- Activity: key と value を対応づける
- Activity: 予約データを dict として再現する

### Mission Check

- Mission Check: list と dict に向くデータを分ける
- Mission Check: 予約データの dict を完成させる

## Main Mission 4: form の基本を知る

目的: HTML のフォームが、ユーザー入力をサーバへ送る入口になることを理解する。

### Section 1: form の部品を見る

- Activity: `form`、`input`、`button` の役割を見る
- Activity: 入力欄と送信ボタンを見分ける
- Activity: フォーム HTML を穴埋めする

### Section 2: name 属性を知る

- Activity: `name` 属性がサーバへ送る名前になることを知る
- Activity: 表示ラベルと `name` の違いを見る
- Activity: 受け取り側と対応する `name` を選ぶ

### Mission Check

- Mission Check: 入力フォーム HTML を完成させる
- Mission Check: `name` 属性と受け取り側の名前を対応づける

## Main Mission 5: POSTで入力を送る

目的: フォーム入力をサーバへ送信するときの `method` と `action` の意味を理解する。

### Section 1: 送信先と method を見る

- Activity: `action` が送信先を表すことを知る
- Activity: `method="post"` の意味をざっくり知る
- Activity: 送信先 URL を選ぶ

### Section 2: 入力からサーバへ届く流れ

- Activity: 入力、送信、サーバ受け取りの順番を見る
- Activity: form の `method` と `action` を穴埋めする
- Activity: GET と POST の違いを復習する

### Mission Check

- Mission Check: form の `method` と `action` を穴埋めする
- Mission Check: 入力送信の流れを並べる

## Main Mission 6: Flaskで入力を受け取る

目的: Flask の `request.form` でフォーム入力を受け取る流れを理解する。

### Section 1: request.form の入口

- Activity: `request.form` の例を見る
- Activity: `request.form["name"]` が何を読むか選ぶ
- Activity: `name` 属性と受け取り側の対応を見る

### Section 2: 受け取った値を処理する

- Activity: 入力値を変数に入れる例を見る
- Activity: 空欄の可能性を考える
- Activity: 入力値を受け取る Python 断片を再現する

### Mission Check

- Mission Check: `request.form` の読み取りを完成させる
- Mission Check: name と受け取り側の対応を選ぶ

## Main Mission 7: 入力結果を画面に返す

目的: 受け取った値をテンプレートへ渡し、結果画面に表示する流れを理解する。

### Section 1: 受け取った値を template に渡す

- Activity: `render_template` に値を渡す例を見る
- Activity: Python側の変数名とHTML側の変数名を対応づける
- Activity: 値を渡すコードを穴埋めする

### Section 2: 結果画面で表示する

- Activity: `{{ name }}` で入力値を表示する例を見る
- Activity: 結果ページの見出しと本文を作る
- Activity: 入力から表示までの流れを並べる

### Mission Check

- Mission Check: 入力値を画面に表示するコードを完成させる
- Mission Check: フォーム、受け取り、表示の3点を対応づける

## Main Mission 8: 小さな診断アプリを作る

目的: 入力、条件分岐、結果表示を組み合わせて、最小のWebアプリ機能を作る。

### Section 1: 診断アプリの構造を見る

- Activity: 入力、判定、結果表示の3部品を見る
- Activity: 最小機能として何を作るか決める
- Activity: 診断アプリに必要なフォーム項目を選ぶ

### Section 2: 条件分岐と結果表示を組み合わせる

- Activity: 入力値によって結果文を変える例を見る
- Activity: 条件に合う結果メッセージを選ぶ
- Activity: 診断フォームと結果表示の主要部分を再現する

### Mission Check

- Mission Check: 診断フォームと結果表示の流れを完成させる
- Mission Check: 入力、条件分岐、結果表示を組み合わせる

## Challenge Mission 4-A: 入力チェックを追加する

解放条件: Main Mission 6 クリア後

### Section 1: 空欄をチェックする

- Activity: 空欄のまま送られた例を見る
- Activity: 空欄のときにメッセージを出す処理を見る
- Activity: 入力チェックの条件を選ぶ

### Mission Check

- Mission Check: 空欄のときにメッセージを出す処理を再現する

## Challenge Mission 4-B: 複数項目のフォームを作る

解放条件: Main Mission 7 クリア後

### Section 1: 名前と日付を受け取る

- Activity: 複数の `input` を持つフォームを見る
- Activity: `name` 属性を項目ごとに分ける
- Activity: 受け取り側のコードを対応づける

### Mission Check

- Mission Check: 名前と日付を受け取るフォームを再現する

## Challenge Mission 4-C: 結果メッセージを複数パターンにする

解放条件: Main Mission 8 クリア後

### Section 1: 条件を増やす

- Activity: 2パターンの結果を3パターンに増やす
- Activity: 条件の順番を考える
- Activity: ユーザーに伝わる結果文を選ぶ

### Mission Check

- Mission Check: 条件に応じて結果を変える処理を再現する

---

# Course 5: データを保存して使う

## 目的

DB を使ってフォーム入力を保存し、保存したデータを一覧表示する Web アプリの基本を理解する。

## 対応する講義日

- 3日目

## Main Mission 1: DBが必要な理由を知る

目的: 画面を閉じても残したいデータには DB が必要になることを理解する。

### Section 1: 残したいデータを見る

- Activity: メモ、予約、出欠などの例を見る
- Activity: 画面を閉じても残したい情報を選ぶ
- Activity: 一時的な表示と保存データを分ける

### Section 2: DBを使う場面を選ぶ

- Activity: DB が必要な場面を選ぶ
- Activity: DB がなくてもよい場面を選ぶ
- Activity: 予約アプリで残すべき情報を見る

### Mission Check

- Mission Check: DBが必要な場面を選ぶ
- Mission Check: 保存すべき情報と保存しなくてよい情報を分ける

## Main Mission 2: テーブル・行・列を知る

目的: DB の基本用語を予約表のイメージで理解する。

### Section 1: 予約表で用語を見る

- Activity: テーブル、行、列を予約表で見る
- Activity: 1件の予約と1列の意味を分ける
- Activity: 行と列を対応づける

### Section 2: データの読み取り

- Activity: 予約テーブルから1件分を読む
- Activity: 列名と値を対応づける
- Activity: どの列が何を表すか選ぶ

### Mission Check

- Mission Check: 予約テーブルの行と列を読み取る
- Mission Check: テーブル・行・列を対応づける

## Main Mission 3: 保存する項目を決める

目的: フォーム項目と DB に保存する項目を対応づける。

### Section 1: 予約アプリに必要な項目

- Activity: 予約に必要な項目を選ぶ
- Activity: 名前、日付、人数などを整理する
- Activity: 保存しなくてよい情報を選ぶ

### Section 2: フォーム項目とDB項目

- Activity: フォームの `name` と DB の列を対応づける
- Activity: 表示用の文言と保存データを分ける
- Activity: フォーム項目とDB項目を対応づける

### Mission Check

- Mission Check: フォーム項目とDB項目を対応づける
- Mission Check: 予約アプリに必要な項目を選ぶ

## Main Mission 4: モデルの考え方を知る

目的: アプリ内で扱うデータの形を決める考え方を理解する。

### Section 1: データの形を決める

- Activity: 予約モデルの項目を見る
- Activity: `name`、`date`、`people` などの項目を分類する
- Activity: 1件の予約データを読む

### Section 2: モデルとテーブルの関係

- Activity: モデルがテーブルの設計に近いことを知る
- Activity: 予約モデルの項目を完成させる
- Activity: 不要な項目を判断する

### Mission Check

- Mission Check: 予約モデルの項目を完成させる
- Mission Check: モデルとテーブルの関係を選ぶ

## Main Mission 5: 入力データを保存する

目的: フォームから受け取った値を DB に登録する流れを理解する。

### Section 1: form から受け取る

- Activity: 入力値を受け取る処理を復習する
- Activity: 受け取った値を保存データにする流れを見る
- Activity: name と列名の対応を確認する

### Section 2: DBへ登録する

- Activity: DBへ登録する処理の位置を見る
- Activity: 保存処理の順番を並べる
- Activity: 保存後に一覧へ移動する流れを見る

### Mission Check

- Mission Check: 保存処理の順番を並べる
- Mission Check: 入力からDB登録までの流れを完成させる

## Main Mission 6: 保存したデータを取り出す

目的: DB から保存済みデータを取り出し、テンプレートへ渡す流れを理解する。

### Section 1: 全件取得の考え方

- Activity: 保存された予約を全部取り出す例を見る
- Activity: 取得結果が複数件になることを知る
- Activity: 取り出したデータを変数に入れる

### Section 2: template に渡す

- Activity: 取得結果を template に渡す例を見る
- Activity: 画面側で使う変数名を確認する
- Activity: 取得から表示までの流れを完成させる

### Mission Check

- Mission Check: 取得から表示までの流れを完成させる
- Mission Check: DBから取り出したデータの使い方を選ぶ

## Main Mission 7: 一覧画面を作る

目的: 保存したデータを table や card で見やすく一覧表示する。

### Section 1: table 表示

- Activity: 予約一覧を表で表示する例を見る
- Activity: `tr`、`th`、`td` を復習する
- Activity: 予約一覧に必要な列を選ぶ

### Section 2: card 表示

- Activity: 予約1件をカードで表示する例を見る
- Activity: table と card の向き不向きを選ぶ
- Activity: 一覧表示の HTML を再現する

### Mission Check

- Mission Check: 予約一覧 HTML を再現する
- Mission Check: table 表示と card 表示の使い分けを選ぶ

## Main Mission 8: 予約サイトの基本形を説明する

目的: 入力、保存、一覧の流れを画面/サーバ/DBに分解して説明できるようにする。

### Section 1: 入力、保存、一覧を復習する

- Activity: 入力フォームから保存までの流れを見る
- Activity: 保存後に一覧へ出る流れを見る
- Activity: どこで DB を使っているか整理する

### Section 2: 画面/サーバ/DBに分ける

- Activity: 予約サイトの処理を役割ごとに分ける
- Activity: 画面側、サーバ側、DB側を分類する
- Activity: 最小の予約サイトに必要な機能を選ぶ

### Mission Check

- Mission Check: 予約サイトの処理を画面/サーバ/DBに分解する
- Mission Check: 入力、保存、一覧の全体順を並べる

## Challenge Mission 5-A: 予約を削除する

解放条件: Main Mission 7 クリア後

### Section 1: 削除対象を指定する

- Activity: 予約ごとの ID を見る
- Activity: 削除ボタンから ID を送る考え方を知る
- Activity: 削除対象の ID を選ぶ

### Mission Check

- Mission Check: 削除対象の ID を送る考え方を完成させる

## Challenge Mission 5-B: 予約を更新する

解放条件: Main Mission 7 クリア後

### Section 1: 編集フォームを使う

- Activity: 既存データをフォームに表示する例を見る
- Activity: 編集後に更新処理へ送る流れを見る
- Activity: 更新対象の ID を扱う理由を知る

### Mission Check

- Mission Check: 編集フォームと更新処理の流れを並べる

## Challenge Mission 5-C: 条件で絞り込む

解放条件: Main Mission 6 クリア後

### Section 1: 検索条件を考える

- Activity: 日付や名前で絞り込む例を見る
- Activity: 条件に合う予約だけ表示する考え方を知る
- Activity: 絞り込み条件を選ぶ

### Mission Check

- Mission Check: 日付や名前で絞り込む条件を選ぶ

## Challenge Mission 5-D: DB設計を少し改善する

解放条件: Main Mission 8 クリア後

### Section 1: 列を見直す

- Activity: 必要な列と不要な列を判断する
- Activity: 1つの列に複数情報を入れない理由を見る
- Activity: 予約アプリの列を改善する

### Mission Check

- Mission Check: 予約アプリに必要な列と不要な列を判断する

---

# Course 6: APIとAIを使う

## 目的

外部サービスと連携する考え方を学び、API・JSON・AI を Web アプリの機能として使う流れを理解する。

## 対応する講義日

- 5日目

## Main Mission 1: APIとは何かを知る

目的: API を外部サービスへ処理を依頼する入口として理解する。

### Section 1: 外部サービスへ依頼する

- Activity: 天気、地図、AI などの外部サービス例を見る
- Activity: API が必要な場面を選ぶ
- Activity: 自分のアプリだけではできない処理を分類する

### Section 2: アプリ、サーバ、外部APIの位置関係

- Activity: アプリ、サーバ、外部APIの図を見る
- Activity: どこからどこへ依頼しているか選ぶ
- Activity: API の返答が画面に出る流れを見る

### Mission Check

- Mission Check: APIが必要な場面を選ぶ
- Mission Check: アプリ、サーバ、外部APIを対応づける

## Main Mission 2: リクエストとレスポンスを復習する

目的: API 通信もリクエストとレスポンスの流れで理解する。

### Section 1: 送るデータと返るデータ

- Activity: APIへ送る情報を見る
- Activity: APIから返る情報を見る
- Activity: 送るデータと返るデータを分類する

### Section 2: 成功時と失敗時の違い

- Activity: 成功時のレスポンスを見る
- Activity: 失敗時のレスポンスを見る
- Activity: API通信の順番を並べる

### Mission Check

- Mission Check: API通信の順番を並べる
- Mission Check: 成功時と失敗時の違いを選ぶ

## Main Mission 3: JSONを読む

目的: API の返答としてよく使われる JSON から必要な値を読み取る。

### Section 1: key と value

- Activity: JSON の `key` と `value` を見る
- Activity: key に対応する value を選ぶ
- Activity: 辞書型との似ている点を見る

### Section 2: 表示したい値を選ぶ

- Activity: JSON からタイトルや説明文を読み取る
- Activity: 画面に表示したい値を選ぶ
- Activity: 入れ子になった JSON の入口を見る

### Mission Check

- Mission Check: JSON から値を読み取る
- Mission Check: 表示に使う値を選ぶ

## Main Mission 4: APIの結果を画面に表示する

目的: API から返ってきた値を HTML に入れて表示する流れを理解する。

### Section 1: 結果を HTML に入れる

- Activity: API結果を変数として template に渡す例を見る
- Activity: 表示したい値を HTML 側で使う
- Activity: API結果表示の HTML を再現する

### Section 2: 読み込み中や失敗時の表示

- Activity: 読み込み中メッセージを見る
- Activity: 失敗時メッセージを見る
- Activity: ユーザーに伝わる表示を選ぶ

### Mission Check

- Mission Check: API結果表示の HTML を再現する
- Mission Check: 読み込み中/失敗時の表示を選ぶ

## Main Mission 5: AIに送る情報を考える

目的: AI に渡す入力や指示文を考え、不要な情報を送らない判断をする。

### Section 1: ユーザー入力と指示文

- Activity: ユーザーの質問とAIへの指示文を分ける
- Activity: 目的に合う指示文を選ぶ
- Activity: 曖昧な入力を補う文を見る

### Section 2: 送ってよい情報、送らない情報

- Activity: 個人情報や秘密情報を送らない理由を見る
- Activity: AIに渡してよい情報を選ぶ
- Activity: 必要最小限の情報にする考え方を知る

### Mission Check

- Mission Check: AIに送る情報を選ぶ
- Mission Check: 目的に合う指示文を選ぶ

## Main Mission 6: AIの返答を画面に表示する

目的: 質問、送信、返答表示の流れを Web アプリ機能として理解する。

### Section 1: 質問と送信

- Activity: AI質問フォームを見る
- Activity: 入力からサーバ送信までを並べる
- Activity: 質問文を受け取る処理を見る

### Section 2: 返答表示

- Activity: AIの返答を見やすく表示する例を見る
- Activity: 結果カードを作る
- Activity: AI返答表示の主要 HTML を再現する

### Mission Check

- Mission Check: AI返答表示の主要 HTML を再現する
- Mission Check: 質問、送信、返答表示の流れを完成させる

## Main Mission 7: APIキーと安全性を知る

目的: APIキーをフロントに置かず、サーバ側で扱う理由を理解する。

### Section 1: APIキーとは何か

- Activity: APIキーが外部サービスを使うための鍵に近いことを知る
- Activity: 見せてはいけない情報を選ぶ
- Activity: APIキーが漏れると困る理由を見る

### Section 2: サーバ側で扱う理由

- Activity: フロントに置く危険性を見る
- Activity: サーバ側でAPIを呼ぶ流れを見る
- Activity: 安全なAPI利用の流れを選ぶ

### Mission Check

- Mission Check: 安全なAPI利用の流れを選ぶ
- Mission Check: APIキーを置く場所を判断する

## Challenge Mission 6-A: プロンプトで結果を変える

解放条件: Main Mission 6 クリア後

### Section 1: 指示文を比べる

- Activity: ざっくりした指示と具体的な指示を比べる
- Activity: 目的に合う指示文を選ぶ
- Activity: 返答形式を指定する例を見る

### Mission Check

- Mission Check: 目的に合う指示文を選ぶ

## Challenge Mission 6-B: API失敗時の表示を考える

解放条件: Main Mission 4 クリア後

### Section 1: 失敗時のUI

- Activity: 通信失敗、入力不足、API制限の例を見る
- Activity: ユーザーに伝わる失敗メッセージを選ぶ
- Activity: 再試行ボタンを置く場面を考える

### Mission Check

- Mission Check: 失敗時メッセージを表示する UI を再現する

## Challenge Mission 6-C: AIを使うアプリ案を考える

解放条件: Main Mission 7 クリア後

### Section 1: AIが価値を出しやすい場面

- Activity: 要約、提案、分類、会話の例を見る
- Activity: AIを入れる価値がある場面を選ぶ
- Activity: AIなしでもよい場面を判断する

### Mission Check

- Mission Check: AI/API を入れる価値がある場面を選ぶ

---

# Course 7: ユーザー機能を作る

## 目的

ログインが必要な理由、ライブラリを使う理由、ユーザーごとにデータを分ける考え方を理解する。

## 対応する講義日

- 4日目

## Main Mission 1: ログインが必要な理由を知る

目的: ユーザーごとにデータを分けるためにログインが必要になることを理解する。

### Section 1: 全員のデータが混ざる問題

- Activity: 全員の予約が同じ一覧に出る問題を見る
- Activity: 自分の情報だけ見たい場面を選ぶ
- Activity: ログインが必要な画面を選ぶ

### Section 2: ユーザーを区別する意味

- Activity: 誰のデータかを持つ必要があることを知る
- Activity: ログイン前後で見える画面を比べる
- Activity: 自分用のデータと共有データを分ける

### Mission Check

- Mission Check: ログインが必要な画面を選ぶ
- Mission Check: ユーザーごとに分けるべきデータを判断する

## Main Mission 2: 認証と認可をざっくり区別する

目的: 「誰かを確認する」と「何をしてよいか確認する」を区別する。

### Section 1: 認証とは何か

- Activity: メールとパスワードで本人を確認する例を見る
- Activity: 認証に近い場面を選ぶ
- Activity: ログイン処理の位置づけを知る

### Section 2: 認可とは何か

- Activity: 管理者だけができる操作を見る
- Activity: 認可に近い場面を選ぶ
- Activity: 認証/認可を分類する

### Mission Check

- Mission Check: 認証/認可を分類する
- Mission Check: 場面に合う考え方を選ぶ

## Main Mission 3: ライブラリを使う理由を知る

目的: ログイン機能を全部自作せず、ライブラリを使う理由を理解する。

### Section 1: 全部自作しない理由

- Activity: パスワード管理の難しさを見る
- Activity: ログイン機能で注意が必要な点を選ぶ
- Activity: ライブラリを使う場面を選ぶ

### Section 2: pip install の役割

- Activity: `pip install` が道具を追加する操作だと知る
- Activity: ライブラリと自分のコードの関係を見る
- Activity: 追加したライブラリを使う流れを見る

### Mission Check

- Mission Check: ライブラリを使う場面を選ぶ
- Mission Check: `pip install` の役割を選ぶ

## Main Mission 4: ログイン画面の部品を知る

目的: ログインフォームに必要な入力欄、送信ボタン、エラー表示を理解する。

### Section 1: ログインフォームの部品

- Activity: メール、パスワード、送信ボタンを見る
- Activity: ログインフォーム HTML を穴埋めする
- Activity: 入力項目と `name` 属性を対応づける

### Section 2: エラー表示

- Activity: ログイン失敗時の表示を見る
- Activity: ユーザーに伝わるエラー文を選ぶ
- Activity: パスワードを直接表示しない理由を知る

### Mission Check

- Mission Check: ログインフォーム HTML を再現する
- Mission Check: エラー表示に必要な部品を選ぶ

## Main Mission 5: ログイン状態で表示を変える

目的: ログイン前後で表示内容や導線を変える考え方を理解する。

### Section 1: ログイン前後の画面を比べる

- Activity: ログイン前のボタンとログイン後の表示を見る
- Activity: ユーザー名を表示する例を見る
- Activity: 表示を変える条件を選ぶ

### Section 2: ナビゲーションを変える

- Activity: ログイン時だけ見せるメニューを見る
- Activity: ログアウトボタンの位置を考える
- Activity: ログイン後表示の HTML を再現する

### Mission Check

- Mission Check: ログイン後表示の HTML を再現する
- Mission Check: ログイン前後で変えるべき表示を選ぶ

## Main Mission 6: ユーザーごとにデータを分ける

目的: データに `user_id` を持たせ、自分のデータだけ取得する考え方を理解する。

### Section 1: データに user_id を持たせる

- Activity: 予約データに `user_id` がある例を見る
- Activity: 誰のデータかを判断する
- Activity: user_id が必要な理由を選ぶ

### Section 2: 自分のデータだけ取得する

- Activity: user_id で絞り込む考え方を見る
- Activity: 全件表示と自分だけ表示を比べる
- Activity: ユーザー別データ表示の流れを完成させる

### Mission Check

- Mission Check: ユーザー別データ表示の流れを完成させる
- Mission Check: user_id で分ける理由を選ぶ

## Challenge Mission 7-A: ログアウト導線を作る

解放条件: Main Mission 5 クリア後

### Section 1: ログアウトボタンを置く

- Activity: ログアウトボタンの配置を見る
- Activity: ログイン中だけ表示する導線を選ぶ
- Activity: ログアウト後に戻る画面を考える

### Mission Check

- Mission Check: ログアウトボタンの配置を再現する

## Challenge Mission 7-B: 自分の予約だけ表示する

解放条件: Main Mission 6 クリア後

### Section 1: user_id で絞り込む

- Activity: 全員の予約一覧と自分の予約一覧を比べる
- Activity: user_id で絞り込む条件を見る
- Activity: どのデータが表示されるか判断する

### Mission Check

- Mission Check: user_id で絞り込む考え方を選ぶ

## Challenge Mission 7-C: エラーメッセージを改善する

解放条件: Main Mission 4 クリア後

### Section 1: 伝わるエラー文を選ぶ

- Activity: 技術者向けのエラーとユーザー向けのエラーを比べる
- Activity: ユーザーに伝わるエラー文を選ぶ
- Activity: 詳細を出しすぎない理由を知る

### Mission Check

- Mission Check: ユーザーに伝わるエラー文を選ぶ

---

# Course 8: 自分のアプリを企画する

## 目的

まだアプリ案がない学生でも、身近な困りごとや興味からアプリ案を出し、画面・入力・処理・保存・外部連携のタスクへ分解できるようにする。

## 対応する講義日

- 6日目
- 7日目
- 最終課題準備

## Main Mission 1: 身近な困りごとを集める

目的: 学生生活や日常から、アプリ化しやすい困りごとを見つける。

### Section 1: 場面から考える

- Activity: 学生生活、授業、部活、アルバイトの場面を見る
- Activity: 困りごとを1つ選ぶ
- Activity: アプリ化しやすい困りごとを判断する

### Section 2: 困りごとを具体化する

- Activity: 誰が困っているかを考える
- Activity: いつ困るかを考える
- Activity: 困りごとをユーザーと場面に分ける

### Mission Check

- Mission Check: 困りごとをユーザーと場面に分ける
- Mission Check: アプリ化しやすい困りごとを選ぶ

## Main Mission 2: 誰のためのアプリか考える

目的: ユーザー、場面、目的を分け、アプリの対象を明確にする。

### Section 1: ユーザーを決める

- Activity: 自分用と他人用の違いを見る
- Activity: 使う人を具体化する
- Activity: ユーザー像に合う機能を選ぶ

### Section 2: 場面と目的を整理する

- Activity: いつ使うかを考える
- Activity: 何を解決したいかを選ぶ
- Activity: 誰がいつ使うかを整理する

### Mission Check

- Mission Check: 誰がいつ使うかを整理する
- Mission Check: ユーザー、場面、目的を対応づける

## Main Mission 3: 最小機能を決める

目的: 最初から全部作らず、最初に作るべき1機能を選べるようにする。

### Section 1: 大きすぎる案を小さくする

- Activity: 機能が多すぎるアプリ案を見る
- Activity: 最初に作るべき1機能を選ぶ
- Activity: 後回しにする機能を選ぶ

### Section 2: 最小機能を文章にする

- Activity: 「誰が何をできる」形で書く
- Activity: 最小機能の説明文を選ぶ
- Activity: 大きすぎる案を小さくする

### Mission Check

- Mission Check: 大きすぎる案を小さくする
- Mission Check: 最初に作るべき1機能を選ぶ

## Main Mission 4: 画面を洗い出す

目的: アプリに必要な画面を、トップ・入力・一覧・詳細などに分けて考える。

### Section 1: 画面の種類を知る

- Activity: トップ、入力、一覧、詳細の例を見る
- Activity: 予約アプリを例に画面を分ける
- Activity: 自分の案に必要な画面を選ぶ

### Section 2: 画面同士のつながり

- Activity: トップから入力画面への流れを見る
- Activity: 入力後に一覧へ戻る流れを見る
- Activity: 画面遷移の順番を並べる

### Mission Check

- Mission Check: アプリ案に必要な画面を選ぶ
- Mission Check: 画面同士のつながりを並べる

## Main Mission 5: 入力と保存データを決める

目的: フォーム項目と DB 項目を対応づけ、保存すべき情報を判断する。

### Section 1: 入力項目を決める

- Activity: フォーム項目の例を見る
- Activity: ユーザーが入力する情報を選ぶ
- Activity: 入力しなくてもよい情報を判断する

### Section 2: 保存データを決める

- Activity: 入力項目と DB 項目を対応づける
- Activity: 保存しない情報を判断する
- Activity: 入力項目と保存項目を整理する

### Mission Check

- Mission Check: 入力項目と保存項目を整理する
- Mission Check: 保存しなくてよい情報を選ぶ

## Main Mission 6: 処理と外部連携を考える

目的: 条件分岐、検索、通知、AI/API を必須機能と発展機能に分ける。

### Section 1: アプリ内の処理を考える

- Activity: 条件分岐、検索、並び替えの例を見る
- Activity: 最初の制作に必要な処理を選ぶ
- Activity: 後回しにできる処理を選ぶ

### Section 2: 外部連携を考える

- Activity: API や AI を入れる候補を見る
- Activity: 最初の制作に入れるか後回しにするか選ぶ
- Activity: 必須機能と発展機能を分ける

### Mission Check

- Mission Check: 必須機能と発展機能を分ける
- Mission Check: AI/API を入れる価値がある場面を選ぶ

## Main Mission 7: 制作タスクへ分解する

目的: アプリ案をフロント、バック、DB、AI/API の作業に分解できるようにする。

### Section 1: 作業領域に分ける

- Activity: フロント、バック、DB、AI/API に分ける
- Activity: 画面作成、入力処理、保存処理を分類する
- Activity: 作業担当を考える

### Section 2: 実装順を考える

- Activity: 画面だけ先に作る流れを見る
- Activity: 入力、保存、一覧の順に作る流れを見る
- Activity: アプリ案を制作タスクに分解する

### Mission Check

- Mission Check: アプリ案を制作タスクに分解する
- Mission Check: 実装順として自然な並びを選ぶ

## Challenge Mission 8-A: 似たアプリを観察する

解放条件: Main Mission 2 クリア後

### Section 1: 既存アプリから学ぶ

- Activity: 似たアプリの画面や機能を見る
- Activity: 参考になる機能を選ぶ
- Activity: そのまま真似しない部分を考える

### Mission Check

- Mission Check: 既存アプリから参考になる機能を選ぶ

## Challenge Mission 8-B: チーム制作の役割分担を考える

解放条件: Main Mission 7 クリア後

### Section 1: 担当を分ける

- Activity: UI担当、サーバ担当、DB担当の作業を見る
- Activity: 役割ごとの作業を分類する
- Activity: 進捗共有に必要な情報を選ぶ

### Mission Check

- Mission Check: UI担当、サーバ担当、DB担当の作業を分類する

## Challenge Mission 8-C: AI/APIを使う発展案を考える

解放条件: Main Mission 6 クリア後

### Section 1: 発展機能として考える

- Activity: AI/API を使う発展例を見る
- Activity: 価値が出る場面を選ぶ
- Activity: 最初から入れない方がよい場面を判断する

### Mission Check

- Mission Check: AI/API を入れる価値がある場面を選ぶ

---

# Createモードへの接続案

Create は通常コース内の枝ではなく、別モードとして扱う。

## 表示例

- 「この制作におすすめの学習」
- 「まだ未クリアだが挑戦できます」
- 「先にやると作りやすい Mission」

## フロント特化 Create

例:

- 自己紹介ページ
- 作品紹介ページ
- サークル紹介ページ
- 予約サイトのトップページ改善

推奨:

- Course 2: Flaskでページを表示する
- Course 3: HTML/CSSで画面を作る

## バックエンド特化 Create

例:

- メモアプリ
- 持ち物リスト
- 出欠管理
- 予約管理

推奨:

- Course 4: PythonでWebの入力を扱う
- Course 5: データを保存して使う

## フルスタック Create

例:

- 予約アプリ
- 質問投稿アプリ
- 簡易タスク管理
- サークル内連絡アプリ

推奨:

- Course 2: Flaskでページを表示する
- Course 3: HTML/CSSで画面を作る
- Course 4: PythonでWebの入力を扱う
- Course 5: データを保存して使う

## AI/API 特化 Create

例:

- AI質問箱
- 文章要約
- 診断アプリ
- 予約内容へのおすすめコメント生成

推奨:

- Course 4: PythonでWebの入力を扱う
- Course 6: APIとAIを使う
- Course 8: 自分のアプリを企画する

---

# 次に seedData 化するときの方針

## 優先順位

1. Course 1 Mission 1 / Mission 2 は既存 seed をそのまま採用する。
2. Course 1 Mission 3 以降を、同じ helper 関数構成で seed 化する。
3. Main Mission を先に seed 化し、Challenge Mission は後から足す。
4. Mission Check は各 Mission 最低 2問、できれば 3問にする。
5. `learnedItems` は Mission ごとに 3〜5個にする。

## Activity 数の目安

| Mission 種類 | Activity 目安 |
|---|---:|
| 用語理解中心 | 8〜10 |
| 分類・対応づけ中心 | 10〜12 |
| コード断片あり | 12〜15 |
| Challenge | 4〜8 |

## ログ分析のために意識すること

- Tutorial だけでなく、Choice / Match / Ordered Steps を混ぜる。
- 各 Course に「分類」「順序」「コード断片」の問題を最低1つずつ入れる。
- Challenge への挑戦有無が取れるよう、解放条件を Main Mission に紐づける。
- 最後の Course 8 は、Create モードへの誘導ログとして使える。
