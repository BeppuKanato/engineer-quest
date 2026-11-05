# Issue #74 BFS応用・総括の実装・検証記録

- 目的: 5問、初回結果によるタグ別診断、任意の基本例復習をレビューする。
- 適用範囲: フェーズ6の単品プレビューと共通assessmentの拡張。状態: 記録。最終確認日: 2026-11-05。
- 起点: `develop` `bb64e28`（PR #95 マージ済み）。
- 正本: [Issue #74](https://github.com/BeppuKanato/engineer-quest/issues/74)、[教材指針 §1・フェーズ6](concept/learning-materials-guideline.md)、[UI定義 §2.3](concept/learning-player-ui.md)、[要約](concept/learning-materials-v2.md)。
- データ・進行・復習先・操作手順の詳細: [フェーズ6 README](../front/src/features/learning/bfs/consolidation/README.md)。

## 実装と判断点

出発点Fで最後のノードをタップ、新しいG〜Lでキューの状態を選択、孤立Zと再発見Aの境界ケース、元コード全11行のParsonsを実装した。
図は既存のGraphDrawing／graphGeometryを使い、基準グラフは変更しない。コードは`bfsCode`（`bfs-distances-deque`、version 1）の本文・意味ID・インデントを直接参照し、契約を変更しない。PR #96のレビュー修正・新しい画像は末尾に記載する。
コンテンツと追加グラフはデータとして分離し、UIに正解・タグ・復習先を埋め込まない。

進行・試行記録は共通assessment。フェーズ6は初回正誤を保持し、誤答のままでも全問回答後に完了する。回答後はその場で再挑戦するか「次の問題へ」を選ぶ。最終問も「診断結果を見る」まで再挑戦できる。
この明示操作は任意再挑戦とソフトゲートを両立するためのUI上の判断で、正解を進行条件にしない。既存フェーズ3・5の全問正解条件は維持する。
診断は初回正解数と5タグの初回正誤を表示する。初回不正解タグだけに復習ボタンを付け、共通ダイアログでフェーズ4の基本例を再生する。復習先の条件を新しい出題グラフへ置き換えない。

**問2の食い違いはユーザー確認済み。** 指定の辺順では「Jを取り出した直後」はKのみであり、「Jの隣を調べ終えた直後」がK → Lになる。設問を後者へ修正し、正解・辺・選択肢を維持した。

## 確認方法

`front/`で`npm ci` → `npm run dev`。起動したマシンのブラウザで`http://localhost:3000/learning-preview/bfs-consolidation`を開く。ログイン・バックエンド・DB不要。
クラウド上のlocalhostは、手元のPCから直接開ける共有URLではない。

1. 1366×768または390×844で問1のノード選択、問2〜4のチップ、各問の常時操作指示を確認する。
2. 問1でBを選んでからAで再挑戦する。以降は誤答のまま進め、問5も提示順のまま回答して結果を開くと初回0/5のまま完了する。
3. 問5の行タップ、並べた行の取り消し、リセットを確認する。元コード順に再回答しても初回不正解が診断に残る。
4. 診断の不正解タグから復習を開き、次へ／再生で基本例の図＋コードの対象行を確認する。閉じてもスコアは変わらない。
5. 再読込後、A →「K → L」→「結果にも入らない」→「0のまま」→元の11行順で回答すると5/5になる。不正解タグの復習ボタンは表示しない。
6. Tab＋Enter／Spaceでの選択も確認する。結果には「フェーズ7：自力実装」の予告を表示し、フェーズ間接続は作らない。

## 検証結果

Node.js 20.20.2、既存verify内のPython 3、production buildのChromium。以下の10コマンドすべてexit 0。

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:learning-player
npm run verify:bfs-motivation
npm run verify:bfs-execution
npm run verify:bfs-check
npm run verify:bfs-code-mapping
npm run verify:bfs-code-check
npm run verify:bfs-consolidation
```

新verifyの独立BFS結果:

| 条件 | 距離 | 取り出し順・追加の確認 |
| --- | --- | --- |
| 基準グラフ・F開始 | F=0、D/E=1、B/C=2、A=3 | F,D,E,B,C,A |
| G〜L・G開始 | G=0、H/I=1、J/K=2、L=3 | G,H,I,J,K,L。J取り出し直後はK、隣を調べ終えた後はK,L |
| 基準グラフ＋Z・A開始 | A=0、B/C=1、D/E=2、F=3、Zなし | A,B,C,D,E,F。Zは距離辞書・キューに入らない |
| 基準グラフ・A開始 | A=0、B/C=1、D/E=2、F=3 | A,B,C,D,E,F。BからAを見つけてもA=0、Aの追加は初期化時の1回のみ |

Parsonsの指定された固定提示順・全11行の順列・正解順との相違・元のインデント、6/7ノードと7辺の共有描画、復習フレームの参照同一性、診断型の全問誤答・混在・全問正解・再挑戦後の初回保持を確認した。

1366×768・390×844のブラウザでは以下を確認した。

- 全問初回誤答→任意の再挑戦→0/5で完了、および再読込後の全問正解→5/5。
- 全5タグの初回結果・不正解タグの復習導線。復習は基本例A〜Fで、閉じても診断結果を維持。
- Parsonsの取り消し・リセット・二重クリックで行が重複しないこと、全11行での回答。
- 静止状態の選択可能な枠と常時操作指示、キーボード選択、再読込での初期化。
- ページ全体の横はみ出し・ブラウザ例外なし。長いコード行はコード列内だけ局所スクロール。
- 共通基盤の退行確認として、フェーズ5の誤答→復習→再挑戦→完了・キーボード・再読込を両幅で確認。フェーズ3もC→どれも入らないで完了。

既存のworkspace root・ESLint module type警告は残るが、全コマンドは成功。DB・外部認証を伴う検証は変更範囲外。

## 初回実装時の確認画像（PR #96のレビュー修正前）

| 画面 | 1366×768 | 390×844 |
| --- | --- | --- |
| 問1・F開始 | ![問1](figures/bfs-consolidation-74/1366-question1.png) | ![問1](figures/bfs-consolidation-74/390-question1.png) |
| 問2・修正した時点 | ![問2](figures/bfs-consolidation-74/1366-question2.png) | ![問2](figures/bfs-consolidation-74/390-question2.png) |
| 問3・孤立Z | ![問3](figures/bfs-consolidation-74/1366-question3.png) | ![問3](figures/bfs-consolidation-74/390-question3.png) |
| Parsons | ![行並び替え](figures/bfs-consolidation-74/1366-parsons.png) | ![行並び替え](figures/bfs-consolidation-74/390-parsons.png) |
| 初回0/5でも完了 | ![診断](figures/bfs-consolidation-74/1366-result0.png) | ![診断](figures/bfs-consolidation-74/390-result0.png) |
| 基本例の復習 | ![復習](figures/bfs-consolidation-74/1366-review.png) | ![復習](figures/bfs-consolidation-74/390-review.png) |

DB適用なし。migration・seed・アプリ組み込み・Mission/Activity・進捗／ログ保存・他フェーズの実装・フェーズ間接続は対象外。

## PR #96 レビュー修正

起点は`feat/bfs-consolidation-74`の`fb3eb84`。設問の文言・選択肢・正解・タグ・復習先、ソフトゲートと初回診断、コード契約、共通描画・色・リングは変更しない。

- 図の設問を84vw × 84dvh（最小高さ500px）のflex配置にし、キャプション・選択肢・フィードバックを除いた残りの高さを図へ割り当てる。高さの上限を撤去し、SVG内部の比率を維持した。
- Parsonsは1列構成にして全幅を使う。全行を選ぶと元の領域を閉じる。コードはフェーズ4と同じ等幅・16〜18px・行高1.8・左揃え、元のインデントを維持する。
- 行の追加・削除と並び替えは既存framer-motionのレイアウトアニメーション。↕ハンドルでマウス／タッチのドラッグ、↑↓ボタンでキーボードを含む移動、従来どおり行タップで戻す・リセットが可能。動きを減らす設定にも対応する。
- コンテンツの`interchangeableLineGroups`で初期化2行だけを順不同に指定。共通判定はParsonsだけを正規化して比較し、他の行は厳密に見る。距離代入→キュー追加は固定する。試行記録の回答順と初回結果はそのまま保持する。

追加verifyで初期化2行の交換が正解、距離代入／キュー追加の交換が不正解、他の隣接行交換も不正解、グループ未指定の完全一致と不正グループ拒否を確認した。lint・typecheck・buildと既存verify一式を含む上記10コマンドはすべてexit 0。

production buildのChromiumで1366×768・390×844を確認。1366px幅ではSVGの倍率がフェーズ3の1.060倍に対しフェーズ6は1.173倍で、ノード直径は約64px／70px。390px幅では両方0.519倍で同じ比率・大きさになる。
1366px幅のParsonsは選べる側・並べた側とも最長行を含む全文を横スクロールなしで表示し、選べる側が空になれば領域も消える。390px幅のコード列内の局所スクロールは維持する。
実際のマウスドラッグ／タッチイベントとキーボードのSpace／Enterで並び替え、初期化交換の正解・距離代入と追加の交換の不正解、取り消し・リセット、初回診断の維持を確認した。
動きを減らす設定でも全問誤答0/5・全問正解5/5・再挑戦後の初回結果保持・任意復習を確認し、既存フェーズ3・5の再挑戦と完了も再確認した。ページ全体の横はみ出し・ブラウザ例外はない。

確認URLは`http://localhost:3000/learning-preview/bfs-consolidation`。問1の図をフェーズ3の`/learning-preview/bfs-check`と同じ画面幅で比較し、問5で全行を並べて全文表示・空領域の消滅を確認する。初期化2行を↕でドラッグまたは↑↓で交換して回答すると正解、距離代入とキュー追加を交換すると不正解になる。再回答しても初回診断は変わらない。

以下は指定viewportで撮影した全ページ画像（縦に長いParsonsは縦スクロールを含む）。

| 画面 | 1366×768 | 390×844 |
| --- | --- | --- |
| 比較用フェーズ3 | ![フェーズ3](figures/bfs-consolidation-74/review96/1366-phase3.png) | ![フェーズ3](figures/bfs-consolidation-74/review96/390-phase3.png) |
| 大きくした設問の図 | ![フェーズ6](figures/bfs-consolidation-74/review96/1366-question1.png) | ![フェーズ6](figures/bfs-consolidation-74/review96/390-question1.png) |
| 選べる全11行 | ![提示](figures/bfs-consolidation-74/review96/1366-available.png) | ![提示](figures/bfs-consolidation-74/review96/390-available.png) |
| 全行の全文・元の領域なし | ![全行](figures/bfs-consolidation-74/review96/1366-parsons-all.png) | ![全行](figures/bfs-consolidation-74/review96/390-parsons-all.png) |
| ドラッグ中 | ![ドラッグ](figures/bfs-consolidation-74/review96/1366-parsons-drag.png) | タッチイベントで検証 |
| 代入と追加の交換は不正解 | ![不正解](figures/bfs-consolidation-74/review96/1366-parsons-invalid.png) | ![不正解](figures/bfs-consolidation-74/review96/390-parsons-invalid.png) |
