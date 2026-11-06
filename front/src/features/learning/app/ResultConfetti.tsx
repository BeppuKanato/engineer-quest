"use client";

import confetti from "canvas-confetti";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { playerTokens } from "../player/player.tokens";

/**
 * リザルト画面の紙吹雪。マウント時に一度だけ撃つ。
 * 報酬ダイアログ（zIndex 1300）より下に置き、再描画やダイアログ開閉で再発射しない。
 * 動きを減らす設定ではライブラリ側（disableForReducedMotion）でも止めるが、
 * ここでも useReducedMotion を見て発射自体を行わない。
 * プリセットは2段：phase = フェーズのリザルト用、final = 単元最終リザルト用に一段強い。
 */
export function ResultConfetti({ preset = "phase" }: { preset?: "phase" | "final" }) {
  const reduced = useReducedMotion();
  const firedRef = useRef(false);
  useEffect(() => {
    if (reduced || firedRef.current) return;
    firedRef.current = true;
    const common: confetti.Options = {
      gravity: 0.9,
      zIndex: 1200,
      disableForReducedMotion: true,
      colors: [playerTokens.focus, playerTokens.states.queued.stroke, playerTokens.states.processing.stroke],
    };
    if (preset === "final") {
      const base: confetti.Options = { ...common, particleCount: 110, spread: 90, startVelocity: 58, ticks: 320, scalar: 1.15 };
      void confetti({ ...base, angle: 60, origin: { x: 0.12, y: 0.7 } });
      void confetti({ ...base, angle: 90, origin: { x: 0.5, y: 0.6 } });
      void confetti({ ...base, angle: 120, origin: { x: 0.88, y: 0.7 } });
    } else {
      const base: confetti.Options = { ...common, particleCount: 90, spread: 85, startVelocity: 55, ticks: 300, scalar: 1.1 };
      void confetti({ ...base, angle: 60, origin: { x: 0.12, y: 0.7 } });
      void confetti({ ...base, angle: 120, origin: { x: 0.88, y: 0.7 } });
    }
  }, [reduced, preset]);
  return null;
}
