"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { motion, Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

import type { OrderAnswer, ParsonsQuestion } from "../../assessment/assessment";
import { playerTokens } from "../../player/player.tokens";
import { AssessmentReviewButton } from "../../review/AssessmentReviewButton";
import { isParsonsOrderCorrect, parsonsKeepLineIds, parsonsMovableLineIds, parsonsMovableSegments, type ParsonsInterchangeableGroups } from "./parsonsOrderFeedback";

/** 並び替え対象のコード契約。行の意味IDと本文だけを使うため、単元を問わず使える。 */
export type ParsonsCode = { readonly lines: readonly { readonly id: string; readonly text: string }[] };

// 枠線はレイアウト上の高さを増やさないよう inset の boxShadow で描く（2px 相当）。
// これにより行の高さは操作ボタン（44px）ちょうどになり、行ピッチを詰められる。
// minHeight は固定行（ボタンを持たない行）でも同じピッチを保つための下限。
const rowLayout = {
  display: "flex", alignItems: "center", width: "max-content", minWidth: "100%", boxSizing: "border-box",
  borderRadius: 4, minHeight: 44,
} as const;
const rowStyle = {
  ...rowLayout,
  background: playerTokens.surface, boxShadow: `inset 0 0 0 2px ${playerTokens.focus}`,
} as const;
const visuallyHidden = {
  position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap",
} as const;
const controlStyle = { color: playerTokens.control, minWidth: 44, minHeight: 44, px: 0.5, cursor: "default" } as const;
const keepColors = { fill: "#dcfce7", mark: "#15803d" } as const;

// 高さが低い画面や文章が折り返す狭い画面では、設問と盤面を同じ領域で流す。
const compactViewport = "@media (max-height: 640px), (max-width: 799.95px)";
const narrowViewport = "@media (max-width: 799.95px)";
export const parsonsQuestionBodySx = {
  overflowY: "visible",
  [compactViewport]: { overflowY: "auto" },
} as const;

// ドラッグ用カーソルは OS 標準の手袋（grab）だと白系で明るい行の上でほぼ見えなくなる（Issue #327）。
// 濃色で描いた SVG カーソルをデータ URI で直接指定し、OS のカーソル配色に依存せず常に見えるようにする。
// 図形は上下の移動を示す両向き矢印。フォールバックとして標準の grab を後置する。
const dragCursorSvg = "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>"
  + "<path d='M16 2 L22 9 L18.5 9 L18.5 23 L22 23 L16 30 L10 23 L13.5 23 L13.5 9 L10 9 Z' fill='%23111827' stroke='%23ffffff' stroke-width='1.6'/></svg>";
export const parsonsDragCursor = `url("data:image/svg+xml,${dragCursorSvg}") 16 16, grab`;

type SortableLineProps = {
  id: string; text: string; index: number; count: number; duration: number; disabled?: boolean;
  /** undefined = 順序フィードバックを表示しない。true = 動かさなくてよい行。false = 印なし（幅だけ確保）。 */
  keep?: boolean;
  onMove: (offset: -1 | 1) => void;
};
function SortableLine({ id, text, index, count, duration, disabled = false, keep, onMove }: SortableLineProps) {
  const controls = useDragControls();
  return <Reorder.Item as="div" value={id} dragListener={false} dragControls={controls}
    data-parsons-line-id={id} data-parsons-keep={keep || undefined}
    style={{ ...rowStyle, position: "relative", cursor: parsonsDragCursor,
      ...(keep ? { background: keepColors.fill, boxShadow: `inset 0 0 0 2px ${keepColors.mark}` } : {}) }} transition={{ duration }}
    whileDrag={{ zIndex: 1 }}>
    <Button type="button" aria-label={`${text.trim()}をドラッグして並べ替え`} title="ドラッグして並べ替え" disabled={disabled}
      onPointerDown={event => { if (!disabled) controls.start(event); }} sx={{ ...controlStyle, cursor: parsonsDragCursor, touchAction: "none" }}>↕</Button>
    {keep !== undefined && <Box aria-hidden sx={{ width: 36, flexShrink: 0, display: "grid", placeItems: "center" }}>
      {keep && <CheckCircleIcon sx={{ fontSize: 24, color: keepColors.mark }} />}
    </Box>}
    <Box component="code" sx={{ flex: 1, whiteSpace: "pre", textAlign: "left", px: 1 }}>{text}</Box>
    <Button type="button" aria-label={`${text.trim()}を上へ`} disabled={disabled || index === 0} onClick={() => onMove(-1)} sx={controlStyle}>↑</Button>
    <Button type="button" aria-label={`${text.trim()}を下へ`} disabled={disabled || index === count - 1} onClick={() => onMove(1)} sx={controlStyle}>↓</Button>
    {keep && <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>この行は動かさなくて大丈夫です</Box>}
  </Reorder.Item>;
}

/**
 * フェード型の固定行。正解位置に置いたまま操作できないことを、薄い層背景・
 * 操作枠なし・鍵アイコンで示す（色だけに依存しないよう形の手掛かりを併用する）。
 * ドラッグボタンや↑↓ボタンは持たず、並び替えの対象にもならない。
 */
function FixedLine({ id, text, marksColumn }: { id: string; text: string; marksColumn: boolean }) {
  return <Box data-parsons-line-id={id} data-parsons-fixed="true"
    sx={{ ...rowLayout, position: "relative", background: playerTokens.layers.layer1, color: playerTokens.text, cursor: "default" }}>
    <Box aria-hidden sx={{ width: 44, flexShrink: 0, display: "grid", placeItems: "center" }}>
      <LockIcon sx={{ fontSize: 16, color: playerTokens.control }} />
    </Box>
    {marksColumn && <Box aria-hidden sx={{ width: 36, flexShrink: 0 }} />}
    <Box component="span" sx={visuallyHidden}>固定された行:</Box>
    <Box component="code" sx={{ flex: 1, whiteSpace: "pre", textAlign: "left", px: 1 }}>{text}</Box>
  </Box>;
}

/**
 * 回答後に「動かさなくてよい行」を示すための入力（Issue #327）。
 * active は「その問題に1回以上回答した」ことを呼び出し側が渡す。未指定なら従来表示のまま。
 * 判定は絶対位置ではなく相対順序（parsonsOrderFeedback）。間違っている行には印を付けない。
 * submittedLineIds は直近に提出した並び。印はこの並びへの判定として固定し、
 * ドラッグ中の並びでは更新しない（Issue #354）。ライブに更新すると、緑になる
 * 位置を探す操作になってしまい、回答の判定にならないため。
 */
export type ParsonsOrderFeedback = {
  readonly solutionLineIds: readonly string[];
  readonly interchangeableLineGroups?: ParsonsInterchangeableGroups;
  readonly active: boolean;
  readonly submittedLineIds?: readonly string[];
};

type ParsonsAttemptActions = {
  correct: boolean;
  message: string;
  advanceLabel: string;
  onReview: () => void;
  onAdvance: () => void;
};

/**
 * 下書きの並びだけを保持する。提出後の判定・試行記録は共通assessmentへ渡す。
 * scrollable のときは表示窓を固定高368px（下限276px）とし、ボタン行は盤面の下に置く。
 * 画面高640px以下または幅800px未満では窓の高さ制限を外し、盤面を設問と同じ中央領域に流す（Issue #352）。
 * fillAvailableSpace は親の残り高を盤面に使う。既存の固定窓は未指定時に維持する。
 * 行ピッチは 46px（行44px＋間隔2px）。行44pxは↑↓ボタンのタッチ標的44pxが下限であり、これ以上は詰められない。
 *
 * フェード型（2026-11-09 決定）: question.fixedLineIds の行は正解位置に固定表示し、
 * 残りの可動行だけを下書きとして保持する。可動行は固定行で区切られた範囲
 * （セグメント）の中だけで並び替えでき、固定行を越えた移動は受け付けない。
 * fixedLineIds 未指定なら全行が1つのセグメントになり、従来の全行並び替えと同じになる。
 */
export function ParsonsBoard({ question, code, onAnswer, disabled = false, scrollable = false, fillAvailableSpace = false, orderFeedback, instruction, attemptActions }: {
  question: ParsonsQuestion; code: ParsonsCode; onAnswer?: (answer: OrderAnswer) => void; disabled?: boolean;
  fillAvailableSpace?: boolean;
  scrollable?: boolean; orderFeedback?: ParsonsOrderFeedback; instruction?: string; attemptActions?: ParsonsAttemptActions;
}) {
  const solutionLineIds = question.correctAnswer.lineIds;
  const fixedLineIds = question.fixedLineIds ?? [];
  const fixedSet = new Set(fixedLineIds);
  const segments = parsonsMovableSegments(solutionLineIds, fixedLineIds);
  const segmentOffsets: number[] = [];
  segments.reduce((sum, segment) => { segmentOffsets.push(sum); return sum + segment.length; }, 0);
  const initialMovable = parsonsMovableLineIds(question.lineIds, fixedLineIds);
  const [movable, setMovable] = useState<readonly string[]>(initialMovable);
  const [hintOpen, setHintOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : 0.6;
  const text = (id: string) => code.lines.find(line => line.id === id)!.text;
  // 可動行の並びから、固定行を正解位置へ戻した全体の並びを組み立てる。
  const fullOrderOf = (movableOrder: readonly string[]) => {
    let cursor = 0;
    return solutionLineIds.map(id => fixedSet.has(id) ? id : movableOrder[cursor++]);
  };
  const ordered = fullOrderOf(movable);
  // ↑↓移動は同じセグメントの中でだけ受け付ける（固定行は越えられない）。
  const move = (id: string, offset: -1 | 1) => setMovable(current => {
    const index = current.indexOf(id);
    if (index < 0) return current;
    const segmentIndex = segments.findIndex((segment, i) => index >= segmentOffsets[i] && index < segmentOffsets[i] + segment.length);
    if (segmentIndex < 0) return current;
    const target = index + offset;
    if (target < segmentOffsets[segmentIndex] || target >= segmentOffsets[segmentIndex] + segments[segmentIndex].length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const reorderSegment = (segmentIndex: number) => (nextValues: readonly string[]) => setMovable(current => {
    const next = [...current];
    next.splice(segmentOffsets[segmentIndex], nextValues.length, ...nextValues);
    return next;
  });
  const isInitialOrder = movable.every((id, index) => id === initialMovable[index]);
  const resetOrder = () => setMovable(initialMovable);
  const answerLabel = orderFeedback?.active ? "この順序で再回答する" : "この順序で回答する";
  // 順序フィードバックは「提出した回答」への判定として固定する（Issue #354）。
  // 印は提出時の並びからだけ計算し、ドラッグで並び替えても変わらない。
  // 次の回答を提出した時点でだけ判定し直す。提出した並びが正解なら印は出さない。
  // フェード型では固定行を除いた可動行だけを判定する。固定行は常に正解位置に
  // あるため、印の対象にもならない。
  const submittedLineIds = orderFeedback?.submittedLineIds;
  const submittedMovable = submittedLineIds ? parsonsMovableLineIds(submittedLineIds, fixedLineIds) : undefined;
  const movableSolution = parsonsMovableLineIds(solutionLineIds, fixedLineIds);
  const keepIds = orderFeedback && submittedMovable && !isParsonsOrderCorrect(submittedMovable, movableSolution, orderFeedback.interchangeableLineGroups)
    ? parsonsKeepLineIds(submittedMovable, movableSolution, orderFeedback.interchangeableLineGroups)
    : null;
  const showOrderFeedback = keepIds !== null && keepIds.size > 0;
  // 描画行: 正解順に走査し、固定行はその位置へ、可動行はセグメント単位でグループにする。
  const renderRows: ({ type: "fixed"; id: string } | { type: "segment"; index: number })[] = [];
  {
    let segmentIndex = 0;
    let inSegment = false;
    for (const id of solutionLineIds) {
      if (fixedSet.has(id)) { renderRows.push({ type: "fixed", id }); inSegment = false; }
      else if (!inSegment) { renderRows.push({ type: "segment", index: segmentIndex++ }); inSegment = true; }
    }
  }
  return <Box sx={{ minWidth: 0, ...(fillAvailableSpace ? { flex: 1 } : {}), ...(scrollable ? { minHeight: 0, display: "flex", flexDirection: "column", [compactViewport]: { flexShrink: 0 } } : {}) }}>
    {(instruction || showOrderFeedback || attemptActions) && <Box sx={{ minHeight: 40, mb: 1, px: 0.5, flexShrink: 0,
      display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 1 }}>
      <Box role="status" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 1 }}>
        {attemptActions
          ? <Typography component="span" sx={{ fontWeight: 700 }}>{attemptActions.correct ? "正解" : "不正解"}</Typography>
          : instruction && <Typography component="span" sx={{ fontWeight: 700 }}>{instruction}</Typography>}
        {showOrderFeedback && <Typography component="span" data-parsons-order-legend sx={{ fontSize: 14 }}>✓ は移動不要</Typography>}
      </Box>
      {attemptActions && <Button onClick={() => setHintOpen(true)} aria-label={attemptActions.correct ? "解説を見る" : "ヒントを見る"}
        sx={{ minHeight: 40, color: playerTokens.focus }}>
        {attemptActions.correct ? "解説" : "ヒント"}
      </Button>}
    </Box>}
    <Box component={motion.div} layoutScroll sx={{ overflowX: "auto", fontFamily: "monospace", fontSize: "clamp(16px, 1vw, 18px)", lineHeight: 1.5,
      display: "flex", flexDirection: "column", gap: 2,
      ...(scrollable ? { height: 368, minHeight: 276, flexShrink: 0, overflowY: "auto", overscrollBehaviorY: "contain",
        [compactViewport]: { height: "auto", maxHeight: "none", flexShrink: 0, overflowY: "hidden" } } : {}),
      ...(scrollable && fillAvailableSpace ? { flex: "0 1 auto", height: "auto", minHeight: 0, flexShrink: 1,
        [compactViewport]: { flex: "0 0 auto", height: "auto", minHeight: "max-content", overflowY: "visible" } } : {}) }}>
      {renderRows.map(row => row.type === "fixed"
        ? <FixedLine key={row.id} id={row.id} text={text(row.id)} marksColumn={orderFeedback !== undefined} />
        : <Reorder.Group key={`segment-${row.index}`} as="div" role="group" aria-label="コード行の並び替え" axis="y"
            values={movable.slice(segmentOffsets[row.index], segmentOffsets[row.index] + segments[row.index].length)}
            onReorder={disabled ? () => {} : reorderSegment(row.index)}
            style={{ display: "flex", flexDirection: "column", gap: 2, ...(fillAvailableSpace ? { flexShrink: 0 } : {}) }}>
            {movable.slice(segmentOffsets[row.index], segmentOffsets[row.index] + segments[row.index].length).map((id, index, segmentValues) => <SortableLine key={id} id={id} text={text(id)} index={index} count={segmentValues.length} duration={duration} disabled={disabled}
              keep={orderFeedback ? keepIds?.has(id) ?? false : undefined}
              onMove={offset => move(id, offset)} />)}
          </Reorder.Group>)}
    </Box>
    <Box sx={{ mt: 1, flexShrink: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1,
      ...(scrollable ? { minHeight: 56, alignItems: "center", [narrowViewport]: { minHeight: 48 },
        [compactViewport]: { position: "sticky", bottom: 0, zIndex: 2, bgcolor: playerTokens.background } } : {}) }}>
      <Button onClick={resetOrder} disabled={disabled || isInitialOrder} sx={{ color: playerTokens.control, minHeight: 44,
        ...(scrollable ? { [narrowViewport]: { display: "none" } } : {}) }}>提示順に戻す</Button>
      {onAnswer && <Button variant="contained" disabled={disabled} onClick={() => onAnswer({ kind: "order", lineIds: ordered })}
        aria-label={answerLabel} sx={{ minHeight: 48, px: 3, [narrowViewport]: { px: 1.5 }, fontSize: 16, fontWeight: 700, bgcolor: playerTokens.focus, color: playerTokens.surface,
          "&:hover": { bgcolor: playerTokens.states.processing.stroke } }}>
        {scrollable ? <>
          <Box component="span" sx={{ [narrowViewport]: { display: "none" } }}>{answerLabel}</Box>
          <Box component="span" sx={{ display: "none", [narrowViewport]: { display: "inline" } }}>{orderFeedback?.active ? "再回答する" : "回答する"}</Box>
        </> : answerLabel}
      </Button>}
      {attemptActions && <>
        {!attemptActions.correct && <Box sx={{ display: "flex", [narrowViewport]: { display: "none" } }}>
          <AssessmentReviewButton label="基本例を見る" variant="outlined" onClick={attemptActions.onReview} />
        </Box>}
        <Button variant={attemptActions.correct ? "contained" : "outlined"} onClick={attemptActions.onAdvance}
          sx={{ minHeight: 48, px: 3, [narrowViewport]: { px: 1.5 }, fontSize: 16, fontWeight: 700, ...(attemptActions.correct
            ? { bgcolor: playerTokens.focus, color: playerTokens.surface, "&:hover": { bgcolor: playerTokens.states.processing.stroke } }
            : { borderColor: playerTokens.focus, color: playerTokens.focus }) }}>{attemptActions.advanceLabel}</Button>
      </>}
      {scrollable && <>
        <IconButton aria-label="並べ替えのその他の操作" aria-haspopup="menu" aria-expanded={Boolean(menuAnchor)}
          aria-controls={menuAnchor ? menuId : undefined} onClick={event => setMenuAnchor(event.currentTarget)}
          sx={{ display: "none", [narrowViewport]: { display: "inline-flex" }, width: 48, minHeight: 48, color: playerTokens.control }}>
          <MoreHorizIcon />
        </IconButton>
        <Menu id={menuId} anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          <MenuItem disabled={disabled || isInitialOrder} onClick={() => { resetOrder(); setMenuAnchor(null); }}>提示順に戻す</MenuItem>
          {attemptActions && !attemptActions.correct && <MenuItem onClick={() => { setMenuAnchor(null); attemptActions.onReview(); }}>
            基本例を見る
          </MenuItem>}
        </Menu>
      </>}
    </Box>
    {attemptActions && <Dialog open={hintOpen} onClose={() => setHintOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>直前の回答</DialogTitle>
      <DialogContent>
        <Typography>{attemptActions.message}</Typography>
        {!attemptActions.correct && <Typography sx={{ mt: 1 }}>結果には初回の回答を使います。</Typography>}
      </DialogContent>
      <DialogActions><Button onClick={() => setHintOpen(false)}>閉じる</Button></DialogActions>
    </Dialog>}
  </Box>;
}
