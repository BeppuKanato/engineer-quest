# マスコット提示ガイドライン適用の実装報告（Issue #135）

- 目的: マスコット提示ガイドラインの指標を、現行のマスコット表示箇所へ適用した内容と検証結果を記録する。
- 適用範囲: ヘッダー、ホーム、ランディングページ、プロフィール、「作る」のヒント部品、画面遷移・処理中オーバーレイ。学習導線は対象外（マスコットを置かない決定を維持）。
- 正本: [マスコット提示ガイドライン](concept/mascot-presentation-guideline.md)
- 最終確認日: 2026-11-06

## 実装内容

- 共通表示コンポーネント `front/src/app/component/mascotFigure.tsx` を新設した。
  - サイズは S（38/48px）・M（72/80px）・L（150/160px）・XL（220/240px）の4段階に固定し、画面側で任意サイズを作れない形にした。
  - 接地処理は台座円（disc: 足元の淡色楕円）、足元影（shadow: 楕円のぼかし影）、額縁（frame: 入れ物に委ねる）の3種を props で選ぶ。
  - 全身表示は contain のみ。円形表示（presentation="circle"）は face 画像を使い、contain で収める。
  - 動きは待ち画面用の bounce / float のみを用意し、prefers-reduced-motion では止める。
- 各表示箇所を共通コンポーネントへ置き換えた。
  - ヘッダー: ユーザーアイコンを S の円形表示（face）に変更した。
  - ホーム: 主表示を L（disc）に変更し、cover を廃止した。学習ストリークの補助表示は S の円形表示（face）に変更した。
  - ランディングページ: 紹介表示を L（disc）にした。
  - プロフィール: 主表示を XL（disc）、設定行の相棒画像を S の円形表示（face）、選択ダイアログの候補と確定表示を L（disc）にした。SettingRow の画像は URL 文字列ではなく表示要素を受け取る形に変えた。
  - 「作る」のヒント部品: M（disc、cheer）にした。
  - 画面遷移・処理中オーバーレイ: M（shadow）にし、無限ループの動きはこの2箇所だけに残した。オーバーレイの表情の型から surprise / celebrate を除外し、未使用の表情を配線できない形にした。
- 静的検証 `front/scripts/verifyMascotPresentation.cjs`（`npm run verify:mascot-presentation`）を追加した。共通部品の段階・接地・face・contain の担保、表示箇所が共通部品経由であること、cover が残っていないこと、学習導線にマスコットが戻っていないことを確認する。

## 検証

- front: lint / typecheck / build 成功。
- front の既存 verify 全14種と追加した verify:mascot-presentation が成功。
- スクリーンショットは撮影環境がないため未実施。各画面の見た目確認はマージ後の実機確認に委ねる。
- DB 変更なし。migration / seed の適用は不要。
