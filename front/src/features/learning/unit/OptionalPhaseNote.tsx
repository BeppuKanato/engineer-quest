import { Box, Button, Typography } from "@mui/material";

import { playerTokens } from "../player/player.tokens";
import type { UnitOptionalPhase } from "./unit.types";

/**
 * 「任意」を表す破線の小チップ。波マップの任意ノード（破線の輪）と同じ形で、
 * 任意フェーズであることを表示面をまたいで同じ見た目で伝える。
 */
export function OptionalPhaseChip({ muted = false }: { muted?: boolean }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex", alignItems: "center", flexShrink: 0,
        fontSize: 12, fontWeight: 800, lineHeight: 1.6, px: 0.75,
        borderRadius: 999, bgcolor: "#fff",
        border: `1.5px dashed ${muted ? "#cbd5e1" : playerTokens.focus}`,
        color: muted ? "#94a3b8" : playerTokens.focus,
      }}
    >
      任意
    </Box>
  );
}

/**
 * プレイヤー上部の流れ（必須フェーズのチップ列）に出す任意フェーズの要素。
 * 必須チップと同格に見えないよう、破線の輪郭＋「任意」チップで一段落とし、
 * 押すと中身へ直接移動できるボタンにする（2026-11-28、Kanato の再指示で
 * 当初の「流れには同格ノードを足さない」から改定）。進捗の数え方には含めない。
 * 出すかどうか・並べる位置はカタログ（アンカー）と単元定義の宣言で決まり、
 * この部品は見た目と押下の受け口だけを持つ。
 */
export function OptionalPhaseFlowButton({ phase, disabled = false, active = false, onOpen }: {
  phase: UnitOptionalPhase;
  disabled?: boolean;
  /** その任意フェーズの中身が開いている間 */
  active?: boolean;
  onOpen: () => void;
}) {
  return (
    <Button disabled={disabled} onClick={onOpen}
      aria-label={`${phase.name}（任意フェーズ）を開く`}
      sx={{
        minHeight: 34, px: 1.25, whiteSpace: "nowrap", borderRadius: 999, flexShrink: 0,
        display: "inline-flex", alignItems: "center", gap: 0.75,
        fontSize: 14, fontWeight: 700, textTransform: "none",
        color: playerTokens.focus, bgcolor: active ? playerTokens.layers.layer0 : "#fff",
        border: `2px dashed ${playerTokens.focus}`,
        "&:hover": { bgcolor: playerTokens.layers.layer0 },
        "&.Mui-disabled": { color: "#94a3b8", borderColor: "#cbd5e1", bgcolor: "#fff" },
      }}>
      <OptionalPhaseChip muted={disabled} />
      {phase.name}
    </Button>
  );
}

/**
 * 任意フェーズであることの注記。対象の名前・ぶら下がる位置（アンカー）・
 * 学習段階の進捗に数えないことを、その場で分かる形で出す。
 * 橋渡しダイアログとフィードバックの推薦候補で共有する。
 */
export function OptionalPhaseNote({ phase }: { phase: UnitOptionalPhase }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
      <OptionalPhaseChip />
      <Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>
        {phase.name}は、段階{phase.anchorPhase}のあとにある任意フェーズです。学習段階の進捗には数えません。
      </Typography>
    </Box>
  );
}
