# 導入での関連単元への言及（Issue #489）

- 目的: 関係の深い単元の存在を導入文で伝える。
- 適用範囲: BFS・DFS・棒倒し法・穴掘り法のフェーズ1の文章と教材版。
- 状態: 実装・自動検証・本番プレビュー2サイズ撮影済み。DB適用不要。
- 最終確認日: 2026-11-20。
- 対象コミット: `7a28c0de`。起点: develop `1b0a98a5`。
- 正本: [Issue #489](https://github.com/BeppuKanato/engineer-quest/issues/489)、[教材指針](concept/learning-materials-guideline.md)、[教材版の更新](feedback-grounded-inputs.md)。

## 変更

各単元の最終場面の既存キャプションに、関係の言及を1節だけ添えた。1場面1文を維持し、順番に学ぶことや履修済みであることを前提にしていない。UI部品・リンク・新しい場面は追加していない。

| 単元・場面 | 追加した関係 |
| --- | --- |
| BFS `name-and-exit` | 近い場所から順に調べる方法に対し、同じグラフで1本の道を奥へ進む深さ優先探索もある |
| DFS `name-and-exit` | 1本の道を奥へ進んで戻る方法に対し、同じグラフを近い順に調べる幅優先探索とは進み方が異なる |
| 棒倒し法 `complete-and-exit` | 迷路を作る別の方法には穴掘り法もある |
| 穴掘り法 `complete-and-exit` | 迷路を作る別の方法には棒倒し法もある |

二分探索・バブルソート・貪欲法には追加していない。相手のアルゴリズムの手順説明にも踏み込んでいない。

既存の教材版生成は導入キャプションを収録していなかったため、今回の4単元の`motivationSteps`（ステップID・キャプション）を生成対象に加えた。4単元の教材版を更新し、全過去版を保持した。他3単元の版は不変。生成アーカイブの大きな差分は4単元の新版を過去版とは別に保存するためで、採点教材の変更ではない。フィードバック生成の処理・入力項目は変更していない。

## 検証

- front: typecheck、build、verify:static、verify:learning-player、verify:feedback-materials、verify:bfs-motivation、verify:dfs-motivation、verify:wall-extension-motivation、verify:maze-digging-motivation成功。
- lintはローカルの未追跡生成物`.next-migration`を除外して成功（`node node_modules/eslint/bin/eslint.js . --ignore-pattern=.next-migration/**`）。build内のソースlintも成功。既存Hook警告5件のみ。
- back: typecheck、lint、build、verify:feedback-grounded-inputs、verify:feedback-concepts、verify:feedback-evidence-storage成功。実DBには接続していない。
- developとの機械照合で、対象4単元の最終キャプション各1件だけが変わり、ステップ数・ID・全スナップショット・間隔・用語表・出口が一致することを確認。
- 全過去教材版が完全一致し、新版から導入情報を除くと元の教材と完全一致することを確認。評価問題150件・正誤判定・concepts.jsonの対応と、完了条件・評価記録は変更していない。
- 本番ビルドの実プレビューをChromeで操作し、両サイズで追加文の全文と再生操作が収まり、横はみ出し・ブラウザー例外がないことを確認。

## 画面証跡

CSS表示領域1093×614／2560×1440、倍率100%、デバイス倍率1、動きを減らす設定。実際のNext.js本番プレビューで各導入の最終場面を撮影した。

| 単元 | 1093×614 | 2560×1440 |
| --- | --- | --- |
| BFS | [画像](evidence/issue489/bfs-intro-reference-1093x614.png) | [画像](evidence/issue489/bfs-intro-reference-2560x1440.png) |
| DFS | [画像](evidence/issue489/dfs-intro-reference-1093x614.png) | [画像](evidence/issue489/dfs-intro-reference-2560x1440.png) |
| 棒倒し法 | [画像](evidence/issue489/wall-extension-intro-reference-1093x614.png) | [画像](evidence/issue489/wall-extension-intro-reference-2560x1440.png) |
| 穴掘り法 | [画像](evidence/issue489/maze-digging-intro-reference-1093x614.png) | [画像](evidence/issue489/maze-digging-intro-reference-2560x1440.png) |

## 未実施・運用

Firebase認証・実DBを通す完了保存のE2Eは未実施。表示文章の変更で、保存処理は変更していない。DB migration・seedの変更・適用は不要であり、このIssueで実DB操作は行っていない。
