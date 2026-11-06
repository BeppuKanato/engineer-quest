"use client";

import { Box, Button } from "@mui/material";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { useState } from "react";

import type { OrderAnswer, ParsonsQuestion } from "../../assessment/assessment";
import { playerTokens } from "../../player/player.tokens";

/** 並び替え対象のコード契約。行の意味IDと本文だけを使うため、単元を問わず使える。 */
export type ParsonsCode = { readonly lines: readonly { readonly id: string; readonly text: string }[] };

const rowStyle = {
  display: "flex", alignItems: "center", width: "max-content", minWidth: "100%", boxSizing: "border-box",
  background: playerTokens.surface, border: `2px solid ${playerTokens.focus}`, borderRadius: 4,
} as const;
const controlStyle = { color: playerTokens.control, minWidth: 44, minHeight: 44, px: 0.5 } as const;

type SortableLineProps = {
  id: string; text: string; index: number; count: number; duration: number; disabled?: boolean;
  onMove: (offset: -1 | 1) => void;
};
function SortableLine({ id, text, index, count, duration, disabled = false, onMove }: SortableLineProps) {
  const controls = useDragControls();
  return <Reorder.Item as="div" value={id} dragListener={false} dragControls={controls}
    data-parsons-line-id={id} style={{ ...rowStyle, position: "relative" }} transition={{ duration }}
    whileDrag={{ zIndex: 1 }}>
    <Button type="button" aria-label={`${text.trim()}をドラッグして並べ替え`} title="ドラッグして並べ替え" disabled={disabled}
      onPointerDown={event => { if (!disabled) controls.start(event); }} sx={{ ...controlStyle, cursor: "grab", touchAction: "none" }}>↕</Button>
    <Box component="code" sx={{ flex: 1, whiteSpace: "pre", textAlign: "left", px: 1 }}>{text}</Box>
    <Button type="button" aria-label={`${text.trim()}を上へ`} disabled={disabled || index === 0} onClick={() => onMove(-1)} sx={controlStyle}>↑</Button>
    <Button type="button" aria-label={`${text.trim()}を下へ`} disabled={disabled || index === count - 1} onClick={() => onMove(1)} sx={controlStyle}>↓</Button>
  </Reorder.Item>;
}

/** 下書きの並びだけを保持する。提出後の判定・試行記録は共通assessmentへ渡す。 */
export function ParsonsBoard({ question, code, onAnswer, disabled = false }: { question: ParsonsQuestion; code: ParsonsCode; onAnswer?: (answer: OrderAnswer) => void; disabled?: boolean }) {
  const [ordered, setOrdered] = useState<readonly string[]>(() => [...question.lineIds]);
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : 0.6;
  const text = (id: string) => code.lines.find(line => line.id === id)!.text;
  const move = (id: string, offset: -1 | 1) => setOrdered(current => {
    const index = current.indexOf(id), target = index + offset;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const isInitialOrder = ordered.every((id, index) => id === question.lineIds[index]);
  return <Box sx={{ minWidth: 0 }}>
    <Box sx={{ fontFamily: "monospace", fontSize: "clamp(16px, 1vw, 18px)", lineHeight: 1.8 }}>
      <Box sx={{ overflowX: "auto" }}>
        <Reorder.Group as="div" role="group" aria-label="コード行の並び替え" axis="y" values={[...ordered]} onReorder={disabled ? () => {} : setOrdered}
          style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {ordered.map((id, index) => <SortableLine key={id} id={id} text={text(id)} index={index} count={ordered.length} duration={duration} disabled={disabled}
            onMove={offset => move(id, offset)} />)}
        </Reorder.Group>
      </Box>
    </Box>
    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
      <Button onClick={() => setOrdered([...question.lineIds])} disabled={disabled || isInitialOrder} sx={{ color: playerTokens.control, minHeight: 44 }}>提示順に戻す</Button>
      {onAnswer && <Button variant="contained" disabled={disabled} onClick={() => onAnswer({ kind: "order", lineIds: ordered })}
        sx={{ minHeight: 48, px: 3, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
          "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>この順序で回答する</Button>}
    </Box>
  </Box>;
}
