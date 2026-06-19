# 問題一覧ドラフト

このドキュメントは、`learningSeed.ts` に落とす前のロードマップ設計案です。

現時点では、問題文・選択肢・`answerCode` を完全に書き切る段階ではなく、次のことを確認するためのドラフトとして扱います。

- Course を開いたときに、ロードマップとして十分な密度があるか
- Main Mission の本線だけで講義理解の最低ラインを進められるか
- Challenge Mission が任意の寄り道として自然な位置から生えているか
- Mission / Lesson / Activity / Mission Exam の粒度が薄すぎないか
- 初見で解けない確認テストになっていないか

## 前提

学習構造は次の階層で考えます。

```text
Course
  ├ Main Mission
  │   ├ Lesson
  │   │   ├ Activity
  │   │   ├ Activity
  │   │   └ Activity
  │   └ Mission Exam
  └ Challenge Mission
      ├ Lesson
      └ Mission Exam
```

設計上の扱い:

- `Main Mission`: コース完了に必要な本線。低モチベーションの学生でも詰まらず進める。
- `Challenge Mission`: 任意の枝ミッション。コース完了には不要。興味がある学生、進度が早い学生向け。
- `Create`: 別モード。通常コースの達成状況を「推奨条件」として表示する。
- `easy / normal / hard`: 自由度ではなく、再現するコード量・入力量・組み合わせ量の違い。

Activity 数は固定しません。

- 用語理解だけの Lesson: 1〜2 Activity
- 見比べや分類が必要な Lesson: 3〜4 Activity
- コードを書く前の Lesson: 4〜5 Activity
- 初心者がつまずきやすい Lesson: 5〜6 Activity

## Course 1: Webアプリの全体像を知る

目的:

ブラウザ、サーバ、HTML/CSS、Python/Flask、DB、API がそれぞれ何を担当するかを知り、以降の学習が Web アプリ全体のどこに位置づくかを理解する。

対応する講義日:

- 1日目
- 2日目のフロント/サーバ開発の話
- 5日目の API 導入

ロードマップ規模:

- Main Mission: 7
- Challenge Mission: 3

### Main Mission 1: Webページが表示される流れを知る

目的: URL にアクセスしてから画面が表示されるまでの大きな流れをつかむ。

Lessons:

- Lesson 1: ブラウザの役割
  - Activity: ブラウザは URL を指定してページを要求することを知る
  - Activity: 表示されている画面と HTML の関係を見る
- Lesson 2: サーバの役割
  - Activity: サーバはリクエストを受け取り、レスポンスを返すことを知る
  - Activity: ブラウザ、サーバ、HTML を並べ替える
  - Activity: 画面が出ないときにどこを疑うかを選ぶ

Mission Exam:

- easy: ブラウザ、サーバ、HTML の役割を対応づける
- normal: 画面表示までの順番を穴埋めで完成させる
- hard: フォーム送信を含む流れを文章で再現する

### Main Mission 2: フロントエンドとバックエンドを区別する

目的: HTML/CSS が画面側、Python/Flask がサーバ側に近い役割であることを理解する。

Lessons:

- Lesson 1: フロントエンドとは何か
  - Activity: 画面に直接見えるものを分類する
  - Activity: HTML/CSS/画像をフロントエンド側として整理する
- Lesson 2: バックエンドとは何か
  - Activity: 入力処理、保存、外部 API 呼び出しをバックエンド側として整理する
  - Activity: Flask が担当する処理を選ぶ
- Lesson 3: 両者がつながる場面
  - Activity: フォーム送信の図を見る
  - Activity: 入力、送信、処理、表示をフロント/バックに分類する

Mission Exam:

- easy: 技術名をフロント/バックに分類する
- normal: フォーム送信の処理を担当ごとに分ける
- hard: DB 保存と画面表示を含む処理を分類する

### Main Mission 3: リクエストとレスポンスを知る

目的: Web アプリの通信を「お願い」と「返事」として理解する。

Lessons:

- Lesson 1: リクエストとは何か
  - Activity: URL アクセス、フォーム送信をリクエストとして見る
  - Activity: 何をサーバへ送っているかを選ぶ
- Lesson 2: レスポンスとは何か
  - Activity: HTML、JSON、エラー画面をレスポンスとして見る
  - Activity: サーバから返るものを分類する
- Lesson 3: GET と POST の入口
  - Activity: ページを見る GET とデータを送る POST の違いをざっくり知る
  - Activity: 講義で扱うフォーム送信がどちらに近いか選ぶ

Mission Exam:

- easy: リクエスト/レスポンスを対応づける
- normal: フォーム送信の通信を並べ替える
- hard: GET/POST の使い分けを短い場面で判断する

### Main Mission 4: localhost と開発環境を知る

目的: 自分の PC で動かして確認する開発用サーバを理解する。

Lessons:

- Lesson 1: localhost の意味
  - Activity: `localhost` は自分の PC を指す名前だと知る
  - Activity: `localhost:5000` のような URL の意味を見る
- Lesson 2: 開発環境と公開環境
  - Activity: 自分だけが見る環境と他人も見る環境を比べる
  - Activity: 講義ではまずローカルで確認する理由を選ぶ

Mission Exam:

- easy: localhost の意味を選ぶ
- normal: ローカル開発と公開環境の違いを分類する
- hard: PC、ブラウザ、開発サーバの関係を並べる

### Main Mission 5: HTML/CSS/Python/DB/API の位置づけを知る

目的: 今後出てくる技術が何のために必要かを先に見取り図として持つ。

Lessons:

- Lesson 1: HTML と CSS の位置づけ
  - Activity: HTML は構造、CSS は見た目を担当することを知る
  - Activity: 画面例から HTML と CSS の担当を分ける
- Lesson 2: Python と Flask の位置づけ
  - Activity: Python は処理を書く言語、Flask は Web アプリを作る道具として見る
  - Activity: Flask が HTML を返す例を見る
- Lesson 3: DB と API の位置づけ
  - Activity: DB は保存、API は外部連携の入口として見る
  - Activity: 予約アプリに必要な技術を選ぶ

Mission Exam:

- easy: 技術名と役割を対応づける
- normal: 小さなアプリに必要な技術を選ぶ
- hard: アプリの処理を HTML/CSS/Python/DB/API に分解する

### Main Mission 6: エラーが起きた場所を大まかに考える

目的: 画面が出ない、保存されない、見た目が変わらないときに、どこを確認するかを考えられるようにする。

Lessons:

- Lesson 1: 画面が表示されない
  - Activity: URL、サーバ起動、HTML の候補を見る
  - Activity: 症状から最初に確認する場所を選ぶ
- Lesson 2: 見た目が変わらない
  - Activity: CSS の読み込み、class 名、保存忘れの例を見る
  - Activity: CSS 側の問題を選ぶ
- Lesson 3: 入力が反映されない
  - Activity: フォーム、サーバ処理、テンプレート表示の候補を見る
  - Activity: 入力値がどこで止まったかを推理する

Mission Exam:

- easy: 症状と確認場所を対応づける
- normal: 画面表示の不具合を順番に確認する
- hard: 複数の症状からフロント/バック/DB の疑いを分ける

### Main Mission 7: 最終制作で使う考え方を知る

目的: Web アプリを「画面」「入力」「処理」「保存」「外部連携」に分けて考える準備をする。

Lessons:

- Lesson 1: アプリを部品で見る
  - Activity: 予約サイトを画面、入力、保存に分ける
  - Activity: SNS や診断アプリも同じ観点で分ける
- Lesson 2: 作る前に考えること
  - Activity: 誰が、いつ、何に困るかを考える
  - Activity: 最小機能を選ぶ

Mission Exam:

- easy: アプリの構成要素を選ぶ
- normal: 予約アプリを画面/入力/保存に分解する
- hard: 自分のアプリ案に必要な構成要素を選ぶ

### Challenge Mission 1-A: 通信の流れを図にする

解放条件: Main Mission 3 クリア後

目的: リクエスト、レスポンス、HTML、DB 保存を図として整理する。

Lessons:

- Lesson 1: 図で整理する
  - Activity: 簡単な通信図を見る
  - Activity: 矢印の向きを選ぶ
  - Activity: フォーム送信の流れに DB を追加する

Mission Exam:

- easy: 矢印の向きを選ぶ
- normal: フォーム送信の図を完成させる
- hard: DB 保存後に一覧表示する流れを完成させる

### Challenge Mission 1-B: エラー調査の順番を作る

解放条件: Main Mission 6 クリア後

目的: 不具合が起きたときの確認順を自分で組み立てる。

Lessons:

- Lesson 1: 確認順を考える
  - Activity: よくあるエラー症状を見る
  - Activity: 先に確認するものを選ぶ

Mission Exam:

- easy: 症状と確認場所を対応づける
- normal: 確認順を並べ替える
- hard: 画面、サーバ、DB をまたぐ問題の調査順を作る

### Challenge Mission 1-C: アプリの構成を推理する

解放条件: Main Mission 7 クリア後

目的: 身近な Web サービスを構成要素に分解する。

Lessons:

- Lesson 1: 既存サービスを観察する
  - Activity: ログイン、検索、投稿、予約などの機能を見る
  - Activity: それぞれに必要な画面/処理/保存を選ぶ

Mission Exam:

- easy: 機能と構成要素を対応づける
- normal: 既存アプリを画面/入力/保存に分ける
- hard: API や AI が入る場所を推理する

## Course 2: Flaskでページを表示する

目的:

Flask プロジェクトの構成を理解し、Python 側の処理から HTML テンプレートを返してブラウザで確認できるようにする。

対応する講義日:

- 1日目

ロードマップ規模:

- Main Mission: 8
- Challenge Mission: 3

### Main Mission 1: プロジェクトを開いて構成を見る

Lessons:

- Lesson 1: VS Code でフォルダを開く
  - Activity: フォルダを開く意味を知る
  - Activity: ファイルツリーを見る
- Lesson 2: 主要ファイルを探す
  - Activity: `app.py`、`views.py`、`templates/index.html` を探す
  - Activity: 画面に関係しそうなファイルを選ぶ

Mission Exam:

- easy: ファイル名と役割を対応づける
- normal: Flask プロジェクトの主要ファイルを分類する
- hard: 最小構成のフォルダ配置を再現する

### Main Mission 2: app.py の役割を知る

Lessons:

- Lesson 1: アプリの入口を見る
  - Activity: `Flask(__name__)` の位置を見る
  - Activity: アプリを作っている行を選ぶ
- Lesson 2: Blueprint 登録を知る
  - Activity: `register_blueprint` の例を見る
  - Activity: ルート処理を分ける理由を知る

Mission Exam:

- easy: `app.py` の役割を選ぶ
- normal: アプリ作成と Blueprint 登録の行を穴埋めする
- hard: 最小の `app.py` 断片を再現する

### Main Mission 3: views.py で URL と処理をつなぐ

Lessons:

- Lesson 1: route の意味
  - Activity: `@route("/")` が URL と関数をつなぐことを知る
  - Activity: `/` に対応する関数を選ぶ
- Lesson 2: 関数がレスポンスを返す
  - Activity: `return` の役割を見る
  - Activity: URL アクセスから関数実行までを並べる

Mission Exam:

- easy: URL と関数を対応づける
- normal: route と関数の短いコードを完成させる
- hard: `/hello` 用の処理断片を再現する

### Main Mission 4: render_template で HTML を返す

Lessons:

- Lesson 1: テンプレートを返す
  - Activity: `render_template("index.html")` を見る
  - Activity: 返される HTML ファイルを選ぶ
- Lesson 2: templates フォルダの役割
  - Activity: Flask がテンプレートを探す場所を知る
  - Activity: `index.html` の置き場所を選ぶ

Mission Exam:

- easy: `render_template` の役割を選ぶ
- normal: `return render_template("index.html")` を完成させる
- hard: route から template を返す処理を再現する

### Main Mission 5: サーバを起動してブラウザで確認する

Lessons:

- Lesson 1: 起動コマンドを知る
  - Activity: Flask サーバを起動する流れを見る
  - Activity: 起動中と停止中の違いを知る
- Lesson 2: ブラウザでアクセスする
  - Activity: `localhost` の URL を見る
  - Activity: 表示されたページと HTML の対応を見る
- Lesson 3: サーバを止める
  - Activity: Ctrl+C で停止することを知る

Mission Exam:

- easy: 起動、確認、停止の順番を選ぶ
- normal: ブラウザで確認する URL を選ぶ
- hard: 起動から確認までの手順を並べる

### Main Mission 6: HTML を編集して表示を変える

Lessons:

- Lesson 1: `index.html` を編集する
  - Activity: 見出しの文章を変える
  - Activity: 変更前後の画面を見比べる
- Lesson 2: 保存と再読み込み
  - Activity: 保存しないと反映されないことを知る
  - Activity: ブラウザの再読み込みをする場面を選ぶ

Mission Exam:

- easy: 表示文を変える HTML を完成させる
- normal: 見出しと本文を含む HTML 断片を再現する
- hard: Flask で表示するトップページの HTML を再現する

### Main Mission 7: テンプレートへ値を渡す

Lessons:

- Lesson 1: Python 側で値を用意する
  - Activity: `message = "..."` のような値を見る
  - Activity: 画面に出したい値をどこで用意するか選ぶ
- Lesson 2: HTML 側で値を表示する
  - Activity: `{{ message }}` の意味を知る
  - Activity: 固定文字列とテンプレート変数を見比べる
- Lesson 3: 値を変えて表示を確認する
  - Activity: Python 側の値を変えると画面が変わる例を見る

Mission Exam:

- easy: `{{ message }}` を穴埋めする
- normal: Python から渡した値を `h1` と `p` に表示する
- hard: 複数の値をテンプレートに表示するコード断片を再現する

### Main Mission 8: Flask の最小ページを一通り説明する

Lessons:

- Lesson 1: ファイル間のつながりを復習する
  - Activity: `app.py`、`views.py`、`index.html` のつながりを見る
  - Activity: どのファイルを編集すると何が変わるか選ぶ
- Lesson 2: 最初のページを説明する
  - Activity: URL、関数、template、表示の順番を並べる
  - Activity: 自分の言葉に近い説明文を選ぶ

Mission Exam:

- easy: 3ファイルの役割を対応づける
- normal: Flask でページが出る流れを完成させる
- hard: 最小 Flask ページのコード断片を再現する

### Challenge Mission 2-A: 2ページ構成にする

解放条件: Main Mission 4 クリア後

Lessons:

- Lesson 1: 別 URL を追加する
  - Activity: `/about` の例を見る
  - Activity: URL と関数を対応づける
- Lesson 2: 別テンプレートを返す
  - Activity: `about.html` を返す処理を見る
  - Activity: テンプレート名を穴埋めする

Mission Exam:

- easy: `/about` 用のテンプレート名を選ぶ
- normal: 2ページ構成の route を完成させる
- hard: トップページと About ページの処理を再現する

### Challenge Mission 2-B: スマホから確認する考え方を知る

解放条件: Main Mission 5 クリア後

Lessons:

- Lesson 1: 同じネットワークから見る
  - Activity: `0.0.0.0` や PC の IP の考え方を知る
  - Activity: localhost との違いを選ぶ

Mission Exam:

- easy: localhost と IP アドレスの違いを選ぶ
- normal: スマホ確認で必要な条件を選ぶ
- hard: PC/スマホ/開発サーバの関係を並べる

### Challenge Mission 2-C: 共通レイアウトを考える

解放条件: Main Mission 8 クリア後

Lessons:

- Lesson 1: 複数ページで同じ部品を使う
  - Activity: ヘッダーやナビゲーションの共通化例を見る
  - Activity: 共通にしたい部品を選ぶ

Mission Exam:

- easy: 共通化しやすい部品を選ぶ
- normal: 2ページに同じナビを入れる HTML を再現する
- hard: 共通レイアウトの考え方を説明順に並べる

## Course 3: HTML/CSSで画面を作る

目的:

HTML で情報の構造を作り、CSS で見た目を整える。最終的に簡単なサービス風トップページを組めるようにする。

対応する講義日:

- 1日目
- 4日目のフロント改善

ロードマップ規模:

- Main Mission: 9
- Challenge Mission: 4

### Main Mission 1: HTML の骨組みを知る

Lessons:

- Lesson 1: HTML 文書の基本形
  - Activity: `doctype`、`html`、`head`、`body` を見る
  - Activity: 表示される場所と設定を書く場所を分ける
  - Activity: 最小 HTML を穴埋めする
- Lesson 2: タイトルと本文
  - Activity: `title` と `h1` の違いを見る
  - Activity: 画面に表示されるタグを選ぶ

Mission Exam:

- easy: `h1` と `p` を完成させる
- normal: HTML の基本形を完成させる
- hard: `meta charset` を含む HTML 文書を再現する

### Main Mission 2: 文章を構造化する

Lessons:

- Lesson 1: 見出しと本文
  - Activity: `h1`、`h2`、`p` の表示例を見る
  - Activity: 重要度に合うタグを選ぶ
  - Activity: 見出しと本文の HTML を穴埋めする
- Lesson 2: 区切りとまとまり
  - Activity: セクションごとに情報を分ける例を見る
  - Activity: 読みやすい構成を選ぶ

Mission Exam:

- easy: 見出しと本文を対応づける
- normal: 講義紹介文の HTML を完成させる
- hard: 複数セクションの文章構造を再現する

### Main Mission 3: リンクと画像を使う

Lessons:

- Lesson 1: リンクを作る
  - Activity: `a` と `href` の役割を見る
  - Activity: クリックできる文字を選ぶ
  - Activity: リンクタグを穴埋めする
- Lesson 2: 画像を表示する
  - Activity: `img` と `src` の役割を見る
  - Activity: 画像が出ない原因を選ぶ
  - Activity: `alt` の意味を知る

Mission Exam:

- easy: リンクタグを完成させる
- normal: 画像つき紹介カードの HTML を再現する
- hard: リンク、画像、説明文を含むブロックを再現する

### Main Mission 4: リストと表で情報を整理する

Lessons:

- Lesson 1: リストを使う
  - Activity: `ul`、`ol`、`li` の違いを見る
  - Activity: 箇条書きに向く情報を選ぶ
  - Activity: リスト HTML を穴埋めする
- Lesson 2: 表を使う
  - Activity: `table`、`tr`、`th`、`td` を見る
  - Activity: 予約一覧に必要な列を選ぶ

Mission Exam:

- easy: リストの HTML を完成させる
- normal: 簡単な表の HTML を完成させる
- hard: 予約一覧の表構造を再現する

### Main Mission 5: div と class で部品を作る

Lessons:

- Lesson 1: div でまとまりを作る
  - Activity: カード UI の HTML 構造を見る
  - Activity: どこからどこまでがカードか選ぶ
- Lesson 2: class で名前をつける
  - Activity: `class="card"` の意味を知る
  - Activity: class 名と CSS セレクタを対応づける
  - Activity: `div class` を穴埋めする

Mission Exam:

- easy: `div class="card"` を完成させる
- normal: カード風 HTML を再現する
- hard: 複数カードの HTML 構造を再現する

### Main Mission 6: CSS を読み込む

Lessons:

- Lesson 1: CSS ファイルの役割
  - Activity: HTML と CSS の分担を見る
  - Activity: 見た目を変えるコードを選ぶ
- Lesson 2: CSS を HTML に読み込む
  - Activity: `link rel="stylesheet"` を見る
  - Activity: CSS が効かない原因を選ぶ
  - Activity: `static` フォルダとの関係を知る

Mission Exam:

- easy: CSS 読み込みタグを完成させる
- normal: Flask の static CSS を読み込む HTML を再現する
- hard: HTML と CSS ファイルの対応を再現する

### Main Mission 7: 色・文字・余白を変える

Lessons:

- Lesson 1: 色と文字サイズ
  - Activity: `color`、`background-color`、`font-size` を見る
  - Activity: どのプロパティが何を変えるか選ぶ
- Lesson 2: 余白と枠線
  - Activity: `margin`、`padding`、`border` の違いを見る
  - Activity: カード UI に必要な余白を選ぶ
  - Activity: CSS を穴埋めする

Mission Exam:

- easy: 色を変える CSS を完成させる
- normal: カードの余白と枠線を整える CSS を再現する
- hard: 見出し、本文、カードの CSS をまとめて再現する

### Main Mission 8: レイアウトを整える

Lessons:

- Lesson 1: 縦に並べる、横に並べる
  - Activity: ブロックの並びを見る
  - Activity: 横並びに向く場面を選ぶ
- Lesson 2: Flexbox の入口
  - Activity: `display: flex` の例を見る
  - Activity: `gap`、`align-items` を見る
  - Activity: 横並びカードの CSS を穴埋めする

Mission Exam:

- easy: 横並びにするプロパティを選ぶ
- normal: カードを横に並べる CSS を完成させる
- hard: ヘッダーとカード一覧のレイアウト CSS を再現する

### Main Mission 9: サービス風トップページを組む

Lessons:

- Lesson 1: ページの部品を決める
  - Activity: ヘッダー、メイン、カード、ボタンを分ける
  - Activity: どの部品が必要か選ぶ
- Lesson 2: HTML を組み立てる
  - Activity: トップページの HTML 構造を見る
  - Activity: 部品ごとの HTML を穴埋めする
- Lesson 3: CSS を当てる
  - Activity: 完成例と CSS を見比べる
  - Activity: 最低限の CSS を完成させる

Mission Exam:

- easy: 小さな紹介カードを完成させる
- normal: ヘッダーとカードを含むトップページ HTML/CSS を再現する
- hard: サービス風トップページの主要部分を再現する

### Challenge Mission 3-A: ナビゲーションを追加する

解放条件: Main Mission 3 クリア後

Mission Exam:

- easy: ナビリンクを1つ追加する
- normal: 複数リンクのナビゲーションを再現する
- hard: ヘッダー内にロゴとナビを配置する

### Challenge Mission 3-B: スマホでも見やすい画面を考える

解放条件: Main Mission 8 クリア後

Mission Exam:

- easy: スマホで困るレイアウトを選ぶ
- normal: 1列表示に向く CSS を選ぶ
- hard: メディアクエリの考え方を穴埋めする

### Challenge Mission 3-C: 予約サイトのトップページを整える

解放条件: Main Mission 9 クリア後

Mission Exam:

- easy: 予約ボタンの HTML を完成させる
- normal: 予約サイト風カードを再現する
- hard: トップページ全体の主要 HTML/CSS を再現する

### Challenge Mission 3-D: 自分のテーマに置き換える

解放条件: Main Mission 9 クリア後

Mission Exam:

- easy: 表示文を自分のテーマへ変える
- normal: カードの中身を別テーマに置き換える
- hard: 色、文言、画像領域をテーマに合わせて調整する

## Course 4: PythonでWebの入力を扱う

目的:

Web アプリで必要になる Python の最小知識を学び、フォーム入力をサーバ側で受け取って画面に反映できるようにする。

対応する講義日:

- 2日目

ロードマップ規模:

- Main Mission: 8
- Challenge Mission: 3

Main Mission:

1. Webで使うPythonの範囲を知る
   - Lesson: 変数、文字列、数値
   - Lesson: Webアプリでは処理のために Python を使う
   - Exam: 変数と表示内容を対応づける
2. ifで処理を分ける
   - Lesson: 条件でメッセージを変える
   - Lesson: 入力値によって表示が変わる例を見る
   - Exam: 条件分岐の短いコードを完成させる
3. list と dict でデータを扱う
   - Lesson: 複数データを list で持つ
   - Lesson: 1件のデータを dict で持つ
   - Exam: 予約データを dict として再現する
4. form の基本を知る
   - Lesson: `form`、`input`、`button` の役割
   - Lesson: `name` 属性がサーバへ送る名前になる
   - Exam: 入力フォーム HTML を完成させる
5. POSTで入力を送る
   - Lesson: 送信先と method を見る
   - Lesson: 入力からサーバへ届く流れを見る
   - Exam: form の `method` と `action` を穴埋めする
6. Flaskで入力を受け取る
   - Lesson: `request.form` の入口
   - Lesson: name と受け取り側の対応
   - Exam: 入力値を受け取る Python 断片を再現する
7. 入力結果を画面に返す
   - Lesson: 受け取った値を template に渡す
   - Lesson: 結果画面で表示する
   - Exam: 入力値を画面に表示するコードを完成させる
8. 小さな診断アプリを作る
   - Lesson: 入力、条件分岐、結果表示を組み合わせる
   - Lesson: 最小機能として何を作るか決める
   - Exam: 診断フォームと結果表示の主要部分を再現する

Challenge Mission:

- Challenge 4-A: 入力チェックを追加する
  - 解放条件: Main Mission 6 クリア後
  - Exam: 空欄のときにメッセージを出す処理を再現する
- Challenge 4-B: 複数項目のフォームを作る
  - 解放条件: Main Mission 7 クリア後
  - Exam: 名前と日付を受け取るフォームを再現する
- Challenge 4-C: 結果メッセージを複数パターンにする
  - 解放条件: Main Mission 8 クリア後
  - Exam: 条件に応じて結果を変える処理を再現する

## Course 5: データを保存して使う

目的:

DB を使ってフォーム入力を保存し、保存したデータを一覧表示する Web アプリの基本を理解する。

対応する講義日:

- 3日目

ロードマップ規模:

- Main Mission: 8
- Challenge Mission: 4

Main Mission:

1. DBが必要な理由を知る
   - Lesson: 画面を閉じても残したいデータ
   - Lesson: メモ、予約、出欠などの例
   - Exam: DBが必要な場面を選ぶ
2. テーブル・行・列を知る
   - Lesson: 予約表を例に用語を知る
   - Lesson: 1件の予約と1列の意味を分ける
   - Exam: 予約テーブルの行と列を読み取る
3. 保存する項目を決める
   - Lesson: 予約アプリに必要な項目
   - Lesson: 保存しなくてよい情報を選ぶ
   - Exam: フォーム項目とDB項目を対応づける
4. モデルの考え方を知る
   - Lesson: アプリ内のデータの形を決める
   - Lesson: name/date/people などの項目を見る
   - Exam: 予約モデルの項目を完成させる
5. 入力データを保存する
   - Lesson: form から受け取る
   - Lesson: DB へ登録する流れを見る
   - Exam: 保存処理の順番を並べる
6. 保存したデータを取り出す
   - Lesson: 全件取得の考え方
   - Lesson: 取得結果を template に渡す
   - Exam: 取得から表示までの流れを完成させる
7. 一覧画面を作る
   - Lesson: table 表示
   - Lesson: card 表示
   - Lesson: 予約一覧に向く表示を選ぶ
   - Exam: 予約一覧 HTML を再現する
8. 予約サイトの基本形を説明する
   - Lesson: 入力、保存、一覧の流れを復習する
   - Lesson: どこで DB を使っているか整理する
   - Exam: 予約サイトの処理を画面/サーバ/DBに分解する

Challenge Mission:

- Challenge 5-A: 予約を削除する
  - 解放条件: Main Mission 7 クリア後
  - Exam: 削除対象の ID を送る考え方を完成させる
- Challenge 5-B: 予約を更新する
  - 解放条件: Main Mission 7 クリア後
  - Exam: 編集フォームと更新処理の流れを並べる
- Challenge 5-C: 条件で絞り込む
  - 解放条件: Main Mission 6 クリア後
  - Exam: 日付や名前で絞り込む条件を選ぶ
- Challenge 5-D: DB設計を少し改善する
  - 解放条件: Main Mission 8 クリア後
  - Exam: 予約アプリに必要な列と不要な列を判断する

## Course 6: APIとAIを使う

目的:

外部サービスと連携する考え方を学び、API・JSON・AI を Web アプリの機能として使う流れを理解する。

対応する講義日:

- 5日目

ロードマップ規模:

- Main Mission: 7
- Challenge Mission: 3

Main Mission:

1. APIとは何かを知る
   - Lesson: 外部サービスへ処理を依頼する入口
   - Lesson: アプリ、サーバ、外部APIの位置関係
   - Exam: APIが必要な場面を選ぶ
2. リクエストとレスポンスを復習する
   - Lesson: 送るデータと返るデータ
   - Lesson: 成功時と失敗時の違い
   - Exam: API通信の順番を並べる
3. JSONを読む
   - Lesson: key と value
   - Lesson: 画面に表示したい値を選ぶ
   - Exam: JSON から値を読み取る
4. APIの結果を画面に表示する
   - Lesson: 返ってきた値を HTML に入れる
   - Lesson: 読み込み中や失敗時の表示を知る
   - Exam: API結果表示の HTML を再現する
5. AIに送る情報を考える
   - Lesson: ユーザー入力と指示文
   - Lesson: AIに渡してよい情報、渡さない情報
   - Exam: AIに送る情報を選ぶ
6. AIの返答を画面に表示する
   - Lesson: 質問、送信、返答表示
   - Lesson: 返答を見やすく表示する
   - Exam: AI返答表示の主要 HTML を再現する
7. APIキーと安全性を知る
   - Lesson: APIキーをフロントに置かない理由
   - Lesson: サーバ側で扱う理由
   - Exam: 安全なAPI利用の流れを選ぶ

Challenge Mission:

- Challenge 6-A: プロンプトで結果を変える
  - 解放条件: Main Mission 6 クリア後
  - Exam: 目的に合う指示文を選ぶ
- Challenge 6-B: API失敗時の表示を考える
  - 解放条件: Main Mission 4 クリア後
  - Exam: 失敗時メッセージを表示する UI を再現する
- Challenge 6-C: AIを使うアプリ案を考える
  - 解放条件: Main Mission 7 クリア後
  - Exam: AIが価値を出しやすい場面を選ぶ

## Course 7: ユーザー機能を作る

目的:

ログインが必要な理由、ライブラリを使う理由、ユーザーごとにデータを分ける考え方を理解する。

対応する講義日:

- 4日目

ロードマップ規模:

- Main Mission: 6
- Challenge Mission: 3

Main Mission:

1. ログインが必要な理由を知る
   - Lesson: 全員の予約が混ざる問題を見る
   - Lesson: 自分の情報だけ見たい場面を選ぶ
   - Exam: ログインが必要な画面を選ぶ
2. 認証と認可をざっくり区別する
   - Lesson: 誰かを確認する
   - Lesson: 何をしてよいか確認する
   - Exam: 認証/認可を分類する
3. ライブラリを使う理由を知る
   - Lesson: ログイン機能を全部自作しない理由
   - Lesson: `pip install` の役割
   - Exam: ライブラリを使う場面を選ぶ
4. ログイン画面の部品を知る
   - Lesson: メール、パスワード、送信ボタン
   - Lesson: エラー表示
   - Exam: ログインフォーム HTML を再現する
5. ログイン状態で表示を変える
   - Lesson: ログイン前後の画面を比べる
   - Lesson: ユーザー名を表示する
   - Exam: ログイン後表示の HTML を再現する
6. ユーザーごとにデータを分ける
   - Lesson: データに user_id を持たせる
   - Lesson: 自分のデータだけ取得する
   - Exam: ユーザー別データ表示の流れを完成させる

Challenge Mission:

- Challenge 7-A: ログアウト導線を作る
  - 解放条件: Main Mission 5 クリア後
  - Exam: ログアウトボタンの配置を再現する
- Challenge 7-B: 自分の予約だけ表示する
  - 解放条件: Main Mission 6 クリア後
  - Exam: user_id で絞り込む考え方を選ぶ
- Challenge 7-C: エラーメッセージを改善する
  - 解放条件: Main Mission 4 クリア後
  - Exam: ユーザーに伝わるエラー文を選ぶ

## Course 8: 自分のアプリを企画する

目的:

まだアプリ案がない学生でも、身近な困りごとや興味からアプリ案を出し、画面・入力・処理・保存・外部連携のタスクへ分解できるようにする。

対応する講義日:

- 6日目
- 7日目
- 最終課題準備

ロードマップ規模:

- Main Mission: 7
- Challenge Mission: 3

Main Mission:

1. 身近な困りごとを集める
   - Lesson: 学生生活、授業、部活、アルバイトの場面を見る
   - Lesson: アプリ化しやすい困りごとを選ぶ
   - Exam: 困りごとをユーザーと場面に分ける
2. 誰のためのアプリか考える
   - Lesson: ユーザー、場面、目的を分ける
   - Lesson: 自分用と他人用の違いを見る
   - Exam: 誰がいつ使うかを整理する
3. 最小機能を決める
   - Lesson: 最初から全部作らない理由
   - Lesson: 最初に作るべき1機能を選ぶ
   - Exam: 大きすぎる案を小さくする
4. 画面を洗い出す
   - Lesson: トップ、入力、一覧、詳細などを考える
   - Lesson: 予約アプリを例に画面を分ける
   - Exam: アプリ案に必要な画面を選ぶ
5. 入力と保存データを決める
   - Lesson: フォーム項目と DB 項目を対応づける
   - Lesson: 保存しない情報を判断する
   - Exam: 入力項目と保存項目を整理する
6. 処理と外部連携を考える
   - Lesson: 条件分岐、検索、通知、AI/API の候補を見る
   - Lesson: 最初の制作に入れるか後回しにするか選ぶ
   - Exam: 必須機能と発展機能を分ける
7. 制作タスクへ分解する
   - Lesson: フロント、バック、DB、AI/API に分ける
   - Lesson: チーム制作で役割を分ける
   - Exam: アプリ案を制作タスクに分解する

Challenge Mission:

- Challenge 8-A: 似たアプリを観察する
  - 解放条件: Main Mission 2 クリア後
  - Exam: 既存アプリから参考になる機能を選ぶ
- Challenge 8-B: チーム制作の役割分担を考える
  - 解放条件: Main Mission 7 クリア後
  - Exam: UI担当、サーバ担当、DB担当の作業を分類する
- Challenge 8-C: AI/APIを使う発展案を考える
  - 解放条件: Main Mission 6 クリア後
  - Exam: AI/API を入れる価値がある場面を選ぶ

## Createモードへの接続案

Create は通常コース内の枝ではなく、別モードとして扱う。

表示例:

- 「この制作におすすめの学習」
- 「まだ未クリアだが挑戦できます」
- 「先にやると作りやすい Mission」

### フロント特化 Create

例:

- 自己紹介ページ
- 作品紹介ページ
- サークル紹介ページ
- 予約サイトのトップページ改善

推奨:

- Course 2: Flaskでページを表示する
- Course 3: HTML/CSSで画面を作る

### バックエンド特化 Create

例:

- メモアプリ
- 持ち物リスト
- 出欠管理
- 予約管理

推奨:

- Course 4: PythonでWebの入力を扱う
- Course 5: データを保存して使う

### フルスタック Create

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

### AI/API 特化 Create

例:

- AI質問箱
- 文章要約
- 診断アプリ
- 予約内容へのおすすめコメント生成

推奨:

- Course 4: PythonでWebの入力を扱う
- Course 6: APIとAIを使う
- Course 8: 自分のアプリを企画する

## 次に確認したいこと

この draft は、seedData 直前仕様ではなくロードマップ案です。

次に確認する観点:

- 1コースあたりの Main Mission 数は多すぎないか、少なすぎないか
- Challenge の本数と解放位置は自然か
- Course 6 と Course 7 の順番は、講義日順に合わせるか、学習しやすさを優先するか
- Course 8 は通常コースとして出すか、Create 前の特別コースとして出すか
- seedData 化する前に、各 Mission の Activity 文言と Exam の `answerCode` をどこまで具体化するか
