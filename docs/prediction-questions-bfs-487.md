# フェーズ2の予想問題（Issue #487）

- 目的: 説明を見ながら次の動きを予想し、その直後の再生で確かめる場面を追加する。
- 適用範囲: 共通ステッププレイヤー、幅優先探索のフェーズ2、教材版の生成。
- 状態: 実装・自動検証・実プレビューの2サイズ確認済み。DB適用不要。
- 最終確認日: 2026-11-20。
- 対象コミット: `d0d122c1`。起点: develop `aee42e44`。
- 正本: [Issue #487](https://github.com/BeppuKanato/engineer-quest/issues/487)、[教材指針](concept/learning-materials-guideline.md) §2-4、[プレイヤーUI定義](concept/learning-player-ui.md)。

## 実装と判断

`LearningStep.prediction`は設問・2〜4件の選択肢・正答IDを持つ。フェーズ2の先頭以外に限って定義できる。プレイヤーは対象ステップの図と説明を出す前に停止し、直前の図を維持する。正解でも誤答でも1回の選択で対象ステップを表示して自動再生へ戻り、短い正誤通知を出す。スキップも同じように再生を続ける。

| 対象ステップ | 直前の図から考える内容 |
| --- | --- |
| `dequeue-b` | キューの先頭のBを取り出す |
| `discover-e` | 未発見のEを末尾へ追加する |
| `skip-e` | キューにあるEを再追加しない |
| `skip-b-from-e` | 調べ終えたBを再追加しない |

予想中は通常の再生操作を止めるが、「予想を飛ばして続ける」を常に用意する。未回答の予想を通らず末尾へシークしてもフェーズを完了できる。回答済みの場面を見直しても再出題せず、「最初から再生」では回答状態も初期化する。任意位置へシークした場合も、予想付きなら必ずその直前の図を使う。

`player_prediction_view`／`player_prediction_answer`／`player_prediction_skip`は分析用のイベントのみ。assessmentEvidence、概念到達、完了条件、進捗保存APIへの入力は増やしていない。Issueの非採点の指定に従い、concepts.jsonの評価問題の対応は維持する。全150問の採点対象、BFSの20ステップのID・図・キャプションとフェーズ4の対応は不変。

教材版の生成に非採点の`executionPredictions`を加え、BFSの教材版だけを更新した。過去の全版を保持し、新版から予想情報を除いた採点教材が旧版と完全一致することを照合した。フィードバック生成・実験条件・採点処理は変更していない。

## 検証

- front: typecheck、build、verify:static、verify:prediction-playback、verify:learning-player、verify:bfs-execution、verify:bfs-check、verify:bfs-code-mapping、verify:bfs-trace、verify:bfs-unit、verify:feedback-materials成功。
- frontのlintはローカルに残る未追跡の`.next-migration`生成物を除外して成功（`node node_modules/eslint/bin/eslint.js . --ignore-pattern=.next-migration/**`）。既存のHook警告5件のみ。通常の`npm run lint`はこの生成物を拾って失敗する。build内のソースlintも成功。
- WindowsのBFSトレース検証は`PYTHON=D:\Python310\python.exe`、`PYTHONUTF8=1`、`PYTHONIOENCODING=utf-8`を指定した。既定のpython3エイリアスと文字コードによる実行失敗を避けた。
- back: typecheck、lint、build、verify:static成功。DB・外部APIへ接続しない既存検証で、教材版変更後も概念対応・証拠保存・フィードバック契約を確認。
- 純粋な状態遷移の検証では、正解・誤答・スキップすべてで4か所の停止と継続、回答前の図、二重回答の無視、逆送り・シーク・再生し直し、末尾に予想を置く教材、定義の不正値拒否を確認。予想なしでは全7単元で従来の再生遷移と一致する。
- 本番ビルドの実プレビューをChromeで操作。両サイズで自動停止、停止状態の継続、4問の正誤・スキップ、回答前の説明非表示、末尾・再生し直し、DFSの従来再生、横方向のはみ出しなし、選択肢・スキップが画面内に収まることを確認。ブラウザー例外なし。
- 単元プレビューでも導入→説明→予想1問をスキップ→残り3問未回答で末尾へシーク→確認問題へ進行できた。

## 画面証跡

CSS表示領域1093×614と2560×1440、倍率100%、デバイス倍率1、動きを減らす設定。固定応答への置換をせず、実際のNext.js本番プレビューで撮影した。

| 状態 | 1093×614 | 2560×1440 |
| --- | --- | --- |
| 先頭の取り出し | [画像](evidence/issue487/prediction-dequeue-b-1093x614.png) | [画像](evidence/issue487/prediction-dequeue-b-2560x1440.png) |
| 末尾への追加 | [画像](evidence/issue487/prediction-discover-e-1093x614.png) | [画像](evidence/issue487/prediction-discover-e-2560x1440.png) |
| キューにある隣 | [画像](evidence/issue487/prediction-skip-e-1093x614.png) | [画像](evidence/issue487/prediction-skip-e-2560x1440.png) |
| 処理済みの隣 | [画像](evidence/issue487/prediction-skip-b-from-e-1093x614.png) | [画像](evidence/issue487/prediction-skip-b-from-e-2560x1440.png) |
| 誤答後の動き・通知 | [画像](evidence/issue487/incorrect-revealed-1093x614.png) | [画像](evidence/issue487/incorrect-revealed-2560x1440.png) |

[単元内の予想（1093×614）](evidence/issue487/unit-prediction-1093x614.png)も確認した。

## 未実施・運用

Firebase認証・実DBを通した学習ログ保存と進捗保存のE2Eは未実施。保存処理は変更していない。DB migration・seedは不要で、実DBの操作は行っていない。ほかの6単元への予想の追加は後続Issueの範囲。Drive正本への追記は別途反映する。
