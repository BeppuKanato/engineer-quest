"use client";

import { Box, Button, Typography } from "@mui/material";
import { AnimatePresence, LayoutGroup, motion, Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

import type { OrderAnswer, ParsonsQuestion } from "../../assessment/assessment";
import { playerTokens } from "../../player/player.tokens";
import { bfsCode } from "../code-mapping/bfsCode";

const codeButtonStyle = {
  minHeight: 44, flex: 1, justifyContent: "flex-start", textAlign: "left", textTransform: "none", whiteSpace: "pre",
  fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit", letterSpacing: "normal", fontWeight: 400,
  color: playerTokens.text, px: 1,
  "&:hover": { bgcolor: playerTokens.layers.layer0 },
  "&:focus-visible": { outline: `3px solid ${playerTokens.control}`, outlineOffset: -3 },
} as const;
const rowStyle = {
  display: "flex", alignItems: "center", width: "max-content", minWidth: "100%", boxSizing: "border-box",
  background: playerTokens.surface, border: `2px solid ${playerTokens.focus}`, borderRadius: 4,
} as const;
const controlStyle = { color: playerTokens.control, minWidth: 44, minHeight: 44, px: 0.5 } as const;

type OrderedLineProps = {
  id: string; text: string; index: number; count: number; duration: number;
  onRemove: () => void; onMove: (offset: -1 | 1) => void;
};
function OrderedLine({ id, text, index, count, duration, onRemove, onMove }: OrderedLineProps) {
  const controls = useDragControls();
  return <Reorder.Item as="div" value={id} layoutId={id} dragListener={false} dragControls={controls}
    data-parsons-row-id={id} style={{ ...rowStyle, position: "relative" }} transition={{ duration }}
    exit={{ opacity: 0 }} whileDrag={{ zIndex: 1 }}>
    <Button type="button" aria-label={`${text.trim()}をドラッグして並べ替え`} title="ドラッグして並べ替え"
      onPointerDown={event => controls.start(event)} sx={{ ...controlStyle, cursor: "grab", touchAction: "none" }}>↕</Button>
    <Button disableRipple type="button" data-parsons-line-id={id} aria-label={`戻す：${text.trim()}`} onClick={onRemove} sx={codeButtonStyle}>
      <Box component="code">{text}</Box>
    </Button>
    <Button type="button" aria-label={`${text.trim()}を上へ`} disabled={index === 0} onClick={() => onMove(-1)} sx={controlStyle}>↑</Button>
    <Button type="button" aria-label={`${text.trim()}を下へ`} disabled={index === count - 1} onClick={() => onMove(1)} sx={controlStyle}>↓</Button>
  </Reorder.Item>;
}

/** 下書きだけを保持する。提出後の判定・試行記録は共通assessmentへ渡す。 */
export function ParsonsBoard({ question, code, onAnswer }: { question: ParsonsQuestion; code: typeof bfsCode; onAnswer: (answer: OrderAnswer) => void }) {
  const [ordered, setOrdered] = useState<string[]>([]);
  const groupId = useId();
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : 0.6;
  const text = (id: string) => code.lines.find(line => line.id === id)!.text;
  const remaining = question.lineIds.filter(id => !ordered.includes(id));
  const move = (id: string, offset: -1 | 1) => setOrdered(current => {
    const index = current.indexOf(id), target = index + offset;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  return <Box sx={{ minWidth: 0 }}>
    <Typography component="p" sx={{ textAlign: "center", mb: 1 }}>並べた行は↕でドラッグ、または↑↓ボタンで移動できます。</Typography>
    <LayoutGroup id={groupId}>
      <Box sx={{ fontFamily: "monospace", fontSize: "clamp(16px, 1vw, 18px)", lineHeight: 1.8 }}>
        <AnimatePresence initial={false}>
          {remaining.length > 0 && <motion.div key="available" layout transition={{ duration }} exit={{ opacity: 0 }}>
            <Typography component="p" sx={{ mb: 1 }}>選べるコード行</Typography>
            <Box role="group" aria-label="選べるコード行" sx={{ overflowX: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
              <AnimatePresence initial={false}>
                {remaining.map(id => <motion.div key={id} layout layoutId={id} transition={{ duration }} exit={{ opacity: 0 }} style={rowStyle}>
                  <Button disableRipple type="button" data-parsons-line-id={id} aria-label={`追加：${text(id).trim()}`}
                    onClick={() => setOrdered(current => current.includes(id) ? current : [...current, id])} sx={codeButtonStyle}>
                    <Box component="code">{text(id)}</Box>
                  </Button>
                </motion.div>)}
              </AnimatePresence>
            </Box>
          </motion.div>}
        </AnimatePresence>
        <motion.div layout transition={{ duration }}>
          <Typography component="p" sx={{ mt: remaining.length ? 2 : 0, mb: 1 }}>並べたコード行</Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Reorder.Group as="div" role="group" aria-label="並べたコード行" axis="y" values={ordered} onReorder={setOrdered}
              style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <AnimatePresence initial={false}>
                {ordered.map((id, index) => <OrderedLine key={id} id={id} text={text(id)} index={index} count={ordered.length} duration={duration}
                  onRemove={() => setOrdered(current => current.filter(line => line !== id))} onMove={offset => move(id, offset)} />)}
              </AnimatePresence>
            </Reorder.Group>
            {ordered.length === 0 && <Typography component="p">選んだ行がここに並びます。</Typography>}
          </Box>
        </motion.div>
      </Box>
    </LayoutGroup>
    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
      <Button onClick={() => setOrdered([])} disabled={!ordered.length} sx={{ color: playerTokens.control, minHeight: 44 }}>並びをリセット</Button>
      <Button variant="outlined" disabled={ordered.length !== question.lineIds.length} onClick={() => onAnswer({ kind: "order", lineIds: ordered })}
        sx={{ color: playerTokens.text, borderColor: playerTokens.control, minHeight: 44 }}>この順序で回答する</Button>
    </Box>
  </Box>;
}
