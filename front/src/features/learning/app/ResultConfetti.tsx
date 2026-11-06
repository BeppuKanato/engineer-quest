"use client";

import confetti from "canvas-confetti";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { playerTokens } from "../player/player.tokens";

/**
 * リザルト画面の紙吹雪。マウント時に一度だけ、左右の下寄り2点から撃つ。
 * 報酬ダイアログ（zIndex 1300）より下に置き、再描画やダイアログ開閉で再発射しない。
 * 動きを減らす設定ではライブラリ側（disableForReducedMotion）でも止めるが、
 * ここでも useReducedMotion を見て発射自体を行わない。
 * 強さはフェーズ用のプリセット。単元最終リザルト用の一段強いプリセットは #150 で足す。
 */
export function ResultConfetti() {
  const reduced = useReducedMotion();
  const firedRef = useRef(false);
  useEffect(() => {
    if (reduced || firedRef.current) return;
    firedRef.current = true;
    const base: confetti.Options = {
      particleCount: 90,
      spread: 85,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 300,
      scalar: 1.1,
      zIndex: 1200,
      disableForReducedMotion: true,
      colors: [playerTokens.focus, playerTokens.states.queued.stroke, playerTokens.states.processing.stroke],
    };
    void confetti({ ...base, angle: 60, origin: { x: 0.12, y: 0.7 } });
    void confetti({ ...base, angle: 120, origin: { x: 0.88, y: 0.7 } });
  }, [reduced]);
  return null;
}
