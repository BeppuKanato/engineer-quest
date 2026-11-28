import type { UnitOptionalPhase } from "./unit.types";

/**
 * 任意フェーズのカタログ（2026-11-28、汎用化）。
 * 以前は単元画面の波マップ部品の中に 1.5 / 6.5 の名前・位置・文言が
 * 直書きされていた。任意フェーズは単元ごとに変わらない種類の定義なので、
 * 定義側のカタログとしてここに置き、表示側（単元画面の波マップ／
 * プレイヤー上部／フィードバックの推薦）はすべてここを読む。
 * 新しい任意フェーズはここに1エントリ足すだけで全表示面に載る。
 * 1.5 / 6.5 専用の分岐を表示側に書かない。
 *
 * 中身の用意状況（2026-11-28 時点）:
 * - 実装の橋渡し（6.5）: フェーズ7の画面内ダイアログとして BFS・DFS・
 *   二分探索にのみある。他単元のフェーズ7にはまだ無い。
 *
 * 1.5「予測・実験」は 2026-11-28 の Kanato の決定で、任意フェーズとしての
 * 概念自体を廃止した。予測は独立フェーズに切り出さず、フェーズ2内の
 * 予測パートとして全単元に実装する方針に変わったため、カタログにも
 * 載せない（波マップ・流れ・推薦のどこにも 1.5 は出ない）。
 */
export const unitOptionalPhases: readonly UnitOptionalPhase[] = [
  { id: "optional-bridge", name: "実装の橋渡し", anchorPhase: 6, side: "below", timing: "段階6のあと", icon: "bridge", availability: "mission" },
];

/** 実装の橋渡し（6.5）のカタログ ID。フェーズ7の橋渡しダイアログが、自分の所在を汎用仕組みへ名乗るために使う。 */
export const bridgeOptionalPhaseId = "optional-bridge";

/** 推薦リンク等の対象キーから任意フェーズを引く。必須フェーズのキーでは undefined。 */
export const findOptionalPhase = (id: string | null | undefined): UnitOptionalPhase | undefined =>
  id ? unitOptionalPhases.find(phase => phase.id === id) : undefined;
