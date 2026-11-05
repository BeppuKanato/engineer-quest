# プレイヤー UI 定義への適合（Issue #83）

目的：PR #80 の暫定プレイヤーと `docs/concept/learning-player-ui.md`（正本）の差分を、共通プレイヤー側で解消する。
適用範囲：`front/src/features/learning/player/`（共通プレイヤーとそのトークン）。教材固有キャンバス内の遷移は各実装が既に定義範囲内（600ms 等）であり対象外。
最終確認日：2026-11-06

## 実施内容

| 定義（正本） | 従来 | 適合後 |
| --- | --- | --- |
| §4 遷移 500〜700ms | `playerTokens.transitionMs` = 300 | 600 に変更（シェルのグラフキャンバスとプレイヤーが参照） |
| §4 自動再生の下限 2.5 秒/ステップ（プレイヤー側で保証） | コンテンツの intervalMs と遷移時間だけで決定（仮教材 1600ms 等がそのまま通る） | `playerTokens.autoplayFloorMs` = 2500 を新設し、再生間隔 = max(コンテンツ intervalMs, 2500, 遷移+50)。BFS 本教材は 3500ms のため体感は不変 |
| §3 シークは全幅に伸ばさない。セグメント／ドット表示を基本とし、上限 約320px | 全幅の range スライダー | セグメント表示に置換（現在位置までを濃色で表示、クリックで該当ステップへ移動、幅は最大 320px）。タブストップは1つに保ち role="slider" と aria-valuenow/valuetext で読み上げにも対応。矢印キー / Home / End の操作は従来どおり |
| §3 再生ボタンは左端で最も大きく（目安 44px） | 全ボタン同サイズ | 再生／一時停止を 48px（アイコン 32px）、前へ／次へを 40px にし、左端の再生を最大にした |

## 対象外としたもの

- 占有率（§1）：プレイヤーはホスト側の寸法に従う。現在のホストは、単品の確認系プレビューが 84vw×84dvh（定義範囲内）、学習画面がアプリのヘッダー等を除く残り領域であり、プレイヤー側で変更すべき差分はなかった。
- 教材固有キャンバスの遷移（フェーズ2・3・6 の 0.6 秒、コード表示の 600ms 等）：既に定義範囲内。
- フェーズ7エディタ画面：#78 設計決定 10 により占有率定義の対象外（PR #115 で learning-player-ui.md に明記済み）。

## 検証

- front: lint / typecheck / build 成功
- verify 全件成功：learning-player、bfs-motivation / execution / check / code-mapping / code-check / consolidation / implementation / trace / free-execution / unit、learning-screens / learning-rewards
- スクリーンショットは取得していない（実行環境の制約）。確認は単品プレイヤー（/learning-preview）または各フェーズのプレビューで、セグメント表示の見た目とクリック移動、仮教材（step-demo）での自動再生間隔が 2.5 秒以上になることを目視してほしい。
