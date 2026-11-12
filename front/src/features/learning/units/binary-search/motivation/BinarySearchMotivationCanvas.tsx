"use client";

import Box from "@mui/material/Box";
import { motion, useReducedMotion } from "framer-motion";

import { PhaseNextButton } from "../../../app/PhaseNextButton";
import { ArrayDrawing } from "../../../player/ArrayDrawing";
import type { ArrayBarsCanvasState } from "../../../player/arrayBars.types";
import { GraphViewport } from "../../../player/GraphDrawing";
import { playerTokens } from "../../../player/player.tokens";
import type { BinarySearchMotivationCanvasState, BinarySearchMotivationVisual } from "./motivation.types";

type GuessVisual = Extract<BinarySearchMotivationVisual, { kind: "guess" }>;
type HalvingVisual = Extract<BinarySearchMotivationVisual, { kind: "halving" }>;

/**
 * フェーズ1の見た目を描く。配列の場面は共通配列基盤へ委譲し、
 * 数当てゲームの帯と半分の件数列は導入専用の図としてここで描く（色は playerTokens のみ）。
 * 出口ボタンは BFS・バブルソート フェーズ1と同じ仕組みで重ねる。
 * 単品プレビューでは onExit が無く、ボタンは無効表示になる。
 */

// 数当ての帯: 候補全体を 600×450 の中央に1行のセル列で並べる。
const guessStrip = { x: 30, y: 196, cellWidth: 5.4, height: 58 } as const;
// 答えの吹き出し: 聞いた数の真上に置き、帯・聞いた数のラベルとは重ねない。
const replyBubble = { y: 106, width: 184, height: 44, tailHeight: 14 } as const;
// 半分の件数列: 最大件数の幅を 460 とし、件数に比例する棒を縦に並べる。
const halvingRows = { x: 40, top: 52, rowHeight: 44, barHeight: 26, maxBarWidth: 460 } as const;

function GuessStrip({ visual }: { visual: GuessVisual }) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const { low, high, asked, remaining } = visual;
  const total = high - low + 1;
  const isDropped = (n: number) => remaining !== null && n !== asked && (n < remaining[0] || n > remaining[1]);
  // 答えは残った範囲から一意に決まる関係（〜より大きい／小さい）であり、具体的な答えの数は明かさない。
  const reply = remaining !== null && asked !== null
    ? (remaining[0] > asked ? `${asked}より大きい` : `${asked}より小さい`)
    : null;
  const askedCenterX = asked !== null ? guessStrip.x + (asked - low + 0.5) * guessStrip.cellWidth : 0;
  const toneFor = (n: number) =>
    n === asked ? playerTokens.states.processing :
    isDropped(n) ? playerTokens.states.completed :
    playerTokens.states.idle;
  return (
    <GraphViewport label={`${low}から${high}の数の候補の帯`}>
      {Array.from({ length: total }, (_, index) => low + index).map((n) => {
        const tone = toneFor(n);
        return (
          <motion.rect key={n} data-guess-cell={n}
            data-guess-asked={n === asked || undefined}
            data-guess-dropped={isDropped(n) || undefined}
            x={guessStrip.x + (n - low) * guessStrip.cellWidth} y={guessStrip.y}
            width={guessStrip.cellWidth} height={guessStrip.height} strokeWidth={0.5}
            initial={false} animate={{ fill: tone.fill, stroke: tone.stroke }}
            transition={transition} />
        );
      })}
      <text x={guessStrip.x} y={guessStrip.y + guessStrip.height + 36} fontSize={20} fontWeight={700} fill={playerTokens.text}>{low}</text>
      <text x={guessStrip.x + total * guessStrip.cellWidth} y={guessStrip.y + guessStrip.height + 36} textAnchor="end" fontSize={20} fontWeight={700} fill={playerTokens.text}>{high}</text>
      {reply !== null && (
        <g data-guess-reply={reply}>
          <polygon points={`${askedCenterX - 9},${replyBubble.y + replyBubble.height - 2} ${askedCenterX + 9},${replyBubble.y + replyBubble.height - 2} ${askedCenterX},${replyBubble.y + replyBubble.height + replyBubble.tailHeight}`}
            fill={playerTokens.surface} stroke={playerTokens.text} strokeWidth={2} />
          <rect x={askedCenterX - replyBubble.width / 2} y={replyBubble.y} width={replyBubble.width} height={replyBubble.height} rx={14}
            fill={playerTokens.surface} stroke={playerTokens.text} strokeWidth={2} />
          <text x={askedCenterX} y={replyBubble.y + replyBubble.height / 2 + 8}
            textAnchor="middle" fontSize={22} fontWeight={700} fill={playerTokens.text}>{reply}</text>
        </g>
      )}
      {asked !== null && (
        <text data-guess-asked-label x={guessStrip.x + (asked - low + 0.5) * guessStrip.cellWidth} y={guessStrip.y - 16}
          textAnchor="middle" fontSize={24} fontWeight={700} fill={playerTokens.text}>{asked}</text>
      )}
    </GraphViewport>
  );
}

function HalvingRows({ visual }: { visual: HalvingVisual }) {
  const { counts } = visual;
  return (
    <GraphViewport label="候補の数が半分ずつ減っていく様子">
      {counts.map((count, index) => {
        const y = halvingRows.top + index * halvingRows.rowHeight;
        const width = Math.max((count / counts[0]) * halvingRows.maxBarWidth, 6);
        return (
          <g key={index}>
            <rect data-halving-bar={count} x={halvingRows.x} y={y} width={width} height={halvingRows.barHeight}
              fill={playerTokens.states.idle.fill} stroke={playerTokens.states.idle.stroke} strokeWidth={2} />
            <text x={halvingRows.x + width + 14} y={y + halvingRows.barHeight / 2 + 7}
              fontSize={20} fontWeight={700} fill={playerTokens.text}>{count} 個</text>
          </g>
        );
      })}
    </GraphViewport>
  );
}

function toArrayBars(canvas: BinarySearchMotivationCanvasState): ArrayBarsCanvasState {
  const { visual } = canvas.state;
  if (visual.kind !== "array") throw new Error("Not an array scene");
  return {
    data: { kind: "array-bars" },
    // フェーズ1では比べるペアも確定範囲もない。全マス未処理のまま、探す値だけを強調する。
    state: { values: visual.values, comparing: null, fixedFrom: visual.values.length },
    highlights: canvas.highlights,
  };
}

export function BinarySearchMotivationCanvas({ canvas, onExit }: {
  canvas: BinarySearchMotivationCanvasState;
  onExit?: () => void;
}) {
  const reduced = useReducedMotion();
  const transition = { duration: reduced ? 0 : playerTokens.transitionMs / 1000, ease: "easeInOut" } as const;
  const { visual, exit } = canvas.state;
  return (
    <Box sx={{ height: "100%", minHeight: 220, position: "relative" }}>
      {visual.kind === "array" && <ArrayDrawing canvas={toArrayBars(canvas)} label={`${visual.values.length}つの並んだ数字`} />}
      {visual.kind === "guess" && <GuessStrip visual={visual} />}
      {visual.kind === "halving" && <HalvingRows visual={visual} />}
      {exit && (
        <Box component={motion.div} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={transition}
          sx={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)" }}>
          <PhaseNextButton label={exit.label} disabled={!onExit} onClick={onExit ?? (() => {})} />
        </Box>
      )}
    </Box>
  );
}
