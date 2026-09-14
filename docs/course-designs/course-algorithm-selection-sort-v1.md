# 選択ソート コース設計票

作成・調査日: 2026-09-08。コースID: `course-algorithm-selection-sort-v1`。

## 想定する学習者
大学生、Python経験半年〜2年を中心とし、経験年数による理解は仮定しない。授業・動画・見本の部分変更が主で、自力制作、選択ソートの知識、専門書・数式・英語変数名の読解を前提にしない。プログラミングとアルゴリズムに苦手意識があり、説明を見直しても未知語が重なると離脱し得る。授業の理解、実装への自信、完了の達成感を動機とする。

## 与える体験と学習価値
値を小さい順に並べる問題を、最小値候補の位置を覚える→最後に交換する→左の確定部分を伸ばす、というイメージで追える。コードを暗記するのでなく、画面の位置とPythonの変数を結びつけ、自分で関数を完成させる。前画面の具体値を記憶させず、各課題に入力・現在状態・求める操作を掲載する。

## 前提知識
変数、整数、リスト、添字、if、for、range、len、簡単な関数を一度学んだ経験。添字0始まり、rangeの終端を含まないことは具体値で再確認する。新しく学ぶものはmin_indexの初期化と更新、走査範囲、2要素の同時代入、外側と内側のループの役割。defはスターターで提供し、returnも統合前に説明する。

## 概念の依存順序
| Mission | 開始時にできること | 残る問い・学ぶ理由 | 完了時にできること | 次へ残す課題 |
| --- | --- | --- | --- | --- |
| 目的 | 数値の順序を読む | 全体をどう並べる？ | 小さい値を左から確定する目的を知る | 最小値の探し方 |
| 候補を探す | 最小値が必要と分かる | 一度に全体を見られないと？ | 見た範囲の最小候補を更新し、位置で記録する | 値を失わず移動する方法 |
| 交換 | 最小候補の位置を得る | 上書きだと元の値は？ | 全件を調べた後に2値を交換する | 残りを処理する方法 |
| 繰り返し | 左端1件を確定する | 右側はまだ未整列 | 確定部分を除き候補を毎回初期化し、最後まで繰り返す | コードの統合 |
| 統合 | すべての断片を理解 | 入れ子と交換の位置をどうまとめる？ | 既習コードを組み立て、別データで確認する | 自力実装 |
| Course Mission | 組み立て済みコードを理解 | 自分で再現できる？ | 仕様を満たす関数を実装・修正する | 発展は任意 |

順序はコード行順ではない。まず1周の処理を成立させてから外側のループを導入する。比較前の候補、比較結果による候補更新、交換は別ステップとし、探索途中で配列を書き換える誤解を防ぐ。

## 用語の導入順
小さい順→昇順・並べ替え→ソート→残りから最小を選ぶ方法→選択ソート。見た中で最小の値がある場所→最小値の候補→min_index。位置→添字（index、0始まり）。リスト→numbers、今回確定する位置→i、調べる位置→j、要素数→n。各英語名の使用時に日本語の役割を再掲する。

## Activityの依存関係と視線設計
IDは`selection-`を前置する。説明はTEXT、状態変化はARRAY_TRACE、位置指定はINDEX_SELECT、分岐はSINGLE_CHOICE、コード練習はCODE_FILL、対応説明はCODE_STATE_MAPPINGを使う。練習前は入力と現在状態のみ、正解・理由は回答後。図の主要対象は候補または今回の操作の一つ。補助情報は元リストと確定範囲。未導入コード・不要な凡例・結果の先出しを表示しない。

| Activity ID末尾 | 既知の事実 → 問い → 根拠・結論 | 確認方法／主に見る対象 |
| --- | --- | --- |
| goal | 数値の列 → 何を作る？ → 値を残して昇順にする | 入出力例 |
| roadmap | 目的 → どう進む？ → 処理を段階的に学ぶ | 学習順 |
| python-ready | 目的 → 何を知っていればよい？ → 前提と到達コードの範囲 | 前提知識 |
| minimum-need | 左端を決めたい → 何を置く？ → 全体の最小値 | 4要素の現在値 |
| candidate-rule | 最小値が必要 → 一つずつなら？ → 見た範囲の最小を保持 | 候補位置 |
| candidate-trace | 更新規則 → 最後までなら？ → 3比較を省略せず追う | 比較→候補更新 |
| candidate-check | 規則 → 途中・同値では？ → 見た範囲だけで判断 | 位置選択2問 |
| candidate-code | 位置を記録 → Pythonでは？ → i・j・min_indexを対応 | コード役割カード |
| candidate-build | 条件・更新 → 値と位置を混同しない？ → 添字を記録 | 2ブロック |
| scan-code | 1比較 → 全件をどう見る？ → range(i+1,n) | jの移動 |
| scan-build | range → 開始位置が変わっても？ → 未確定先頭の右から末尾 | 2ブロック |
| candidate-transfer | 候補走査 → 最小が先頭なら？ → 更新なしでも正しい | 分岐選択 |
| swap-need | 最小位置判明 → 上書きでよい？ → 元の値を残す交換 | 元配列 |
| swap-trace | 交換規則 → どこが変わる？ → 2箇所だけ入れ替わる | 交換対象→結果 |
| swap-check | 交換 → 値を失わず置ける？ → 他の値を動かさない | 結果選択 |
| swap-code | 2値交換 → Pythonでは？ → 右辺2値を先に読む | 同時代入 |
| swap-build | 交換行 → 左右の順序は？ → 逆順の右辺 | 1ブロック |
| same-position | 最小が先頭 → 同じ位置の交換は？ → 値は変わらず確定 | 分岐選択 |
| remaining | 左端確定 → 残りは？ → 最小確定部分を除く | 次の範囲 |
| restart-check | 残りだけを走査 → 候補はどこから？ → 残り先頭へ戻す | 位置選択2問 |
| repeat-trace | 範囲と再初期化 → 全体は？ → 1周ずつ確定を伸ばす | 2周目以降の全比較 |
| outer-code | 確定を伸ばす → 何回？ → 最後の1件は残る最大値 | 外側range |
| outer-build | 外側と候補初期化 → 毎回の準備は？ → 外側内でmin_index=i | 2ブロック |
| boundary-return | n-1回 → 空・1件は？ → ループなし、入力を返す | returnの位置 |
| repeat-check | 全体反復 → 途中で返すと？ → 全周が必要 | 別配列の判断 |
| assemble | 既習断片 → 全体の順序は？ → 準備・探索・交換・返却 | 全コード穴埋め |
| indentation-check | 統合コード → 交換はどの中？ → 内側終了後・外側の中 | 誤りの選択 |
| transfer | 完成規則 → 同値・負数では？ → 同じ規則を適用 | 結果の転移課題 |
| implementation | 全断片既習 → 自力で？ → テストで修正 | Pythonエディター |

## コード学習対応表
| コード | 説明 | 対応 | 練習 | 統合 |
| --- | --- | --- | --- | --- |
| min_index = i | candidate-rule | candidate-code | scan-build / outer-build | assemble |
| if numbers[j] < numbers[min_index] / min_index = j | candidate-trace | candidate-code | candidate-build | assemble |
| n = len(numbers) / for j in range(i + 1, n) | candidate-trace | scan-code | scan-build | assemble |
| numbers[i], numbers[min_index] = numbers[min_index], numbers[i] | swap-need / swap-trace | swap-code | swap-build | assemble |
| for i in range(n - 1) | remaining / repeat-trace | outer-code | outer-build | assemble |
| return numbers | boundary-return | boundary-return | assemble | assemble |

## 想定する誤解とフィードバック
候補は値ではなく位置（candidate-code/build）。走査中は交換しない（candidate-trace/transfer）。小さい値を発見しても末尾まで見る（candidate-check）。同値では候補を保持（candidate-check）。最小値だけの上書きで元の値を失う（swap-need/check）。毎周min_indexを再初期化（restart-check/outer-build）。確定済み領域を走査しない（remaining）。交換は内側ループの後（indentation-check）。returnは全周後（boundary-return）。誤答1回目は着眼点、2回目以降は共通方針で具体化。復習先を本文またはヒントに明記。

## このコースで扱わないこと
安定性の形式的証明、他のソートの実装、高速化、比較関数、オブジェクト、再帰。計算量は本設計票で技術的に確認し、学習者には数式の暗記を求めない。バブルソート受講は不要。

## 成功条件
未見データで候補と次の変化を予測、交換後も値を保存、確定範囲と未確定範囲を区別、各行の役割を説明、既習コードだけで関数を完成する。作成者の操作レビューと実際の初学者による評価は区別する。本作業では初学者本人の参加は確保されておらず、詰まらないことを実証したとはしない。

## スターターコード
```python
def selection_sort(numbers):
    # 小さい順に並べ替えて返してください
    pass
```
引数は整数リスト。入力自体を変更してよい。戻り値は全要素を小さい順に含むリスト。重複を消さない。sorted / sortなど完成済みの並べ替えは使わない。

## 正解コード
```python
def selection_sort(numbers):
    n = len(numbers)
    for i in range(n - 1):
        min_index = i
        for j in range(i + 1, n):
            if numbers[j] < numbers[min_index]:
                min_index = j
        numbers[i], numbers[min_index] = numbers[min_index], numbers[i]
    return numbers
```
比較回数はn(n-1)/2、時間O(n²)、追加領域O(1)。同じ位置との交換も含めmax(0,n-1)回。各走査で候補は見た範囲の最小、交換後の左部分は最小から順に確定している。これを繰り返すと全体が昇順になる。

## 生成テスト
実装前に{-1,0,1}の長さ0〜7の全3,280リストをPythonで実行しsortedと一致。教材の必須7例は通常、最小末尾・逆順、既整列、同値重複、負数、空、1件。候補の再初期化忘れ、早いreturn、値上書き、走査終端ミスが検出されることを追加確認する。

## 外部教材調査
確認日はいずれも2026-09-08。文章・問題・図は転載しない。

| 資料 | 対象・説明順・具体例・練習 | 採用・変更・不採用 |
| --- | --- | --- |
| [Princeton Algorithms 4e §2.1](https://algs4.cs.princeton.edu/21elementary/)（正確性） | Java経験者。整列の契約→最小を選び先頭と交換→実装→比較回数、文字列のトレース練習 | 最小を左から確定する規則と計算量を採用。Comparableや数学的定義の先行は不採用。候補を探す過程を追加する |
| [Runestone 6.8](https://runestone.academy/ns/books/published/pythonds/SortSearch/TheSelectionSort.html)（初学者説明） | Python・バブルソート既習。交換回数の改善→最大を末尾へ→段階図→実行可能コード→3周後の選択問題 | 1周後と複数周後を分けて練習する構造を採用。最大を右へ置く方向、バブルソート前提、大きい配列は不採用。4要素で候補更新を細分化 |
| [Stanford CS106B Lecture 11 pp.21–25](https://web.stanford.edu/class/archive/cs/cs106b/cs106b.1176/lectures/11-Sorting/11-Sorting.pdf)（初学者説明） | C++入門後。並べ替えの意味→最小を未整列左端へ→添字つき配列の変化→交換不要例→性能 | 元配列の位置を保った交換前後の表示、交換不要例を採用。10要素の一括表示と未導入の計算量を早期に出す構成は不採用。先に比較と候補保持を練習する |

共通の骨格は未確定の最小（最大）を見つけて端へ置く反復。本コースは最小値を探すための記憶と、その記憶を用いて値を移動する操作を分離する。これを混ぜると「小さい値を見つける度に交換」という誤解が残るため、交換のMissionを走査の後に置く。

## レビュー記録
実画面の操作、問題、修正、再確認は別紙 `course-algorithm-selection-sort-v1-review.md` に記録する。
