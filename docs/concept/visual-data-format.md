# Visualデータ形式

## 目的

Activityの説明を文章だけに依存させず、学習内容に適した図解を表示する。
VisualはPrismaの`MissionActivity.content`内にJSONとして保存し、フロントの共通Rendererで表示する。

## 格納形式

```ts
type MissionVisualContent = {
  version: 1;
  placement: "full" | "aside";
  data: MissionVisual;
};
```

- `version`: データ形式を将来変更するためのバージョン
- `placement: full`: 本文の下に横幅を使って表示
- `placement: aside`: 本文とVisualを左右に配置
- `data.type`: Rendererが表示コンポーネントを選ぶ判別値

Activityでは`content.visual`へ格納する。

## Visual Type

| type | 用途 |
| --- | --- |
| `FLOW_DIAGRAM` | ブラウザ、サーバ、DBなどの処理や通信の流れ |
| `COMPARE_PANEL` | フロントエンドとバックエンドなどの比較 |
| `ILLUSTRATION_PANEL` | イラストや補足画像を使った概念説明 |
| `CODE_EXPLAIN` | コードと行単位の意味の対応 |
| `CODE_PREVIEW` | コードと画面表示の対応 |
| `FILE_TREE_MAP` | フォルダ・ファイル構成と役割 |
| `BEFORE_AFTER` | CSS適用前後などの変化の比較 |

## 設計原則

- Visual内に任意HTMLを保存しない
- ノード間の接続は配列順ではなく`id`で表す
- 色はHEX値ではなく用途を表す`tone`で指定する
- 画像には必ず`alt`を持たせる
- 座標やピクセル値をseedへ持たせず、レイアウトはRendererが決定する
- 文章だけで理解できる情報を残し、Visualを理解の補助として扱う

## FlowDiagram例

```ts
{
  version: 1,
  placement: "aside",
  data: {
    type: "FLOW_DIAGRAM",
    caption: "ブラウザのお願いに、サーバが返事をします。",
    nodes: [
      { id: "browser", label: "ブラウザ", icon: "browser", tone: "blue" },
      { id: "server", label: "サーバ", icon: "server", tone: "gray" }
    ],
    edges: [
      {
        id: "browser-server",
        from: "browser",
        to: "server",
        label: "リクエスト（お願い）",
        reverseLabel: "レスポンス（返事）",
        bidirectional: true
      }
    ]
  }
}
```
