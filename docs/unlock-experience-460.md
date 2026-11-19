# 実績解除の共通演出と獲得音（C2）

- 目的: 学習側と「作る」側で、実績解除の見た目・動き・音を揃える。
- 適用範囲: フロントの解除表示・音の配線と、それに必要な共通依存の配置。判定・付与・seed・フィードバック生成は変更しない。
- 状態: 実装・自動検証・解除データを用いた表示確認済み。実DB・認証を含む E2E と実機での聴取は未実施。
- 最終確認日: 2026-11-19。
- 正本: [Issue #460](https://github.com/BeppuKanato/engineer-quest/issues/460)、[開発ガイド第10節](../AGENTS.md#10-ゲーミフィケーション強化プログラムの実施基準)、[フロントエンド構成](frontend-architecture.md)。
- 対象実装コミット: `9ada8801`。

## 実装

- `AchievementBand` / `NewAchievementZone` を `front/src/components/rewards/AchievementPresentation.tsx` に移動。既存のトロフィー・レアリティ色・ポップイン・間隔・計測イベントを保持する。
- 同じバッチの実績を一覧で提示するとき、既存 SoundContext の `play("achievementUnlocked")` を1回呼ぶ。提示したIDを ref で保持し、配列再作成・並び替え・設定変更・StrictMode の effect 再実行では鳴らし直さない。後から別の解除が到着した場合は新しいバッチとして1回鳴らす。
- 「作る」の提出完了内の実績 Alert を `AchievementBand` に置換。API境界で表示に必要な `id` / `title` / `description` / `rarity` だけを渡す。学習API固有のメタデータを捏造しない。提出IDをキーにし、別の提出の演出を分離する。
- 共通領域が features / app の内部へ依存しないよう、既存 SoundProvider・色／レアリティ定義・汎用の表示計測フックも共通配置へ移動。既存の音・コレクション色・学習計測の入口には互換再exportを残す。SoundProvider の設定・音源・音量・再生処理は移動のみ。
- `cardAcquired` の再生箇所が知識カードの賞賛ステージへの遷移だけであることを全ソース検索で確認し、その呼び出しを `achievementUnlocked` へ差し替えた。音源定義自体は保持。カード出現の見た目・進行・`cardFlip` は変更しない。
- DB migration / seed 適用は不要。

## 検証

- front `npm run typecheck`、`npm run build`、変更したTS/TSXの個別lint: 成功。build には既存の単元プレビュー5件の hooks 警告がある。
- front `npm run verify:learning-rewards`、`verify:learning-screens`、`verify:answer-feedback`、`verify:mascot-presentation`: 成功。
- front の7単元の `verify:*-unit`（bfs / dfs / wall-extension / bubble-sort / maze-digging / binary-search / greedy-coins）: 成功。
- front `node scripts/verifyUnlockExperience.cjs`: 成功。実コンポーネントの一覧effectをフックアダプターで検証し、学習の段階／単元／作る、複数件、再描画・StrictMode effect再実行、後着の解除を確認。実SoundProviderを Audio アダプターと組み合わせ、保存済み消音・音量係数・消音切替・音源パスも確認する。
- back `npm run verify:collections`: 成功。バックエンドの実装・seed変更はない。
- `git diff --check`: 成功。
- front 全体の `npm run lint`: 既存 `.next-migration` 生成物と対象外スクリプト等で失敗（130 errors / 4402 warnings）。今回変更したファイルにエラーはなく、対象外の修正は行っていない。

## 2サイズの表示証跡

実際の `UnitResultScreen` と作る実装ページに、Common / Rare / Epic 各1件の人工的な解除データを渡し、Chromium で撮影した。認証とサーバーデータは差し替え、静的描画のため動きを減らす設定の完成状態を確認している。音は自動検証の呼び出し検証であり、スクリーンショットによる音の確認ではない。

- 表示領域: 1093×614 / 2560×1440、deviceScaleFactor=1、ブラウザ倍率100%相当。
- [学習結果 1093×614](evidence/issue460/learning-1093x614.png) / [学習結果 2560×1440](evidence/issue460/learning-2560x1440.png)。小さい画面では解除表示と次ボタンがスクロール下部になるため全体を撮影した。
- [作る提出完了 1093×614](evidence/issue460/create-1093x614.png) / [作る提出完了 2560×1440](evidence/issue460/create-2560x1440.png)。小さい画面は縦積みの下部、大きい画面は右列の提出完了枠に表示。狭い枠では題名・説明が折り返される。
- いずれも実績3件の描画と、文書幅がviewport幅を超えないことを確認した。

実DBで新たに実績を解除する一連のE2E、通常モーションのブラウザ再生、実機での音の聴取は未実施。静的描画ではMonacoは初期の `Loading...` 表示であり、エディタやPython実行の動作確認を意味しない。
