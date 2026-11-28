import { Box, Typography } from "@mui/material";

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
