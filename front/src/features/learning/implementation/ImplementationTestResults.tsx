import { useState, type ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import { playerTokens } from "../player/player.tokens";

export type ImplementationTestStatusKey = "passed" | "failed" | "unexecuted";

export type ImplementationTestRow = {
  readonly id: string;
  readonly label: string;
  readonly statusKey: ImplementationTestStatusKey;
  readonly statusIcon: string;
  readonly statusLabel: string;
  /** 表示テストの入力・期待・実際の図。一覧の下の図のまとまりに描く。判定テストには付けない。 */
  readonly details?: ReactNode;
};

/**
 * フェーズ7（自分で実装）のテストタブの共通表示（#325）。
 * 主構造は「✓/×/○ + テスト名 + 状態」の一覧とし、表示テストの図は一覧の下へ分離する。
 * 行の印はテキストに一本化する（描画チェックは完了画面専用）。通過した表示テストの図は
 * 既定で閉じ、未通過・未実行の図は開いておく。開閉は学習者が切り替えられる。
 * 結果データや採点の進み方（1件ずつの出現・音・全通過時の紙吹雪）は呼び出し側の責務で、
 * ここは提示だけを担う。
 */
export function ImplementationTestResults({ diagnostics, listLabel, rows }: {
  diagnostics?: ReactNode;
  listLabel: string;
  rows: readonly ImplementationTestRow[];
}) {
  const reducedMotion = useReducedMotion();
  const figureRows = rows.filter(row => row.details !== undefined);
  return <Box sx={{ color: playerTokens.text }}>
    {diagnostics}
    <Box component="ul" aria-label={listLabel} sx={{ listStyle: "none", p: 0, m: 0 }}>
      {rows.map(row => <Box component="li" key={row.id} data-test-id={row.id} sx={{ mb: 1 }}>
        <Typography component="p" sx={{ fontWeight: 700 }}>
          <Box component={motion.span} key={row.statusKey} data-test-status={row.statusKey}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}
            sx={{ display: "inline-block", color: row.statusKey === "passed" ? playerTokens.focus : playerTokens.text }}>
            <span aria-hidden="true">{row.statusIcon} </span>
          </Box>
          {row.label}：{row.statusLabel}
        </Typography>
      </Box>)}
    </Box>
    {figureRows.length > 0 && <Box sx={{ mt: 3 }}>
      {figureRows.map(row => <TestFigures key={row.id} label={row.label} statusKey={row.statusKey}>{row.details}</TestFigures>)}
    </Box>}
  </Box>;
}

function TestFigures({ label, statusKey, children }: { label: string; statusKey: ImplementationTestStatusKey; children: ReactNode }) {
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? statusKey !== "passed";
  return <Box sx={{ mb: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography component="p" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Button size="small" aria-expanded={open} onClick={() => setToggled(!open)}>{open ? "図を閉じる" : "図を開く"}</Button>
    </Box>
    {open && <Box sx={{ mt: 0.5 }}>{children}</Box>}
  </Box>;
}
