"use client";

import confetti from "canvas-confetti";
import { type RefObject, useEffect } from "react";

const colors = ["#1976d2", "#38bdf8", "#facc15", "#22c55e", "#fb923c"];

export const MissionResultConfetti = ({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>;
}) => {
  useEffect(() => {
    const fire = () => {
      const rect = targetRef.current?.getBoundingClientRect();
      if (!rect) return;

      const origin = (x: number, y: number) => ({
        x: (rect.left + rect.width * x) / window.innerWidth,
        y: (rect.top + rect.height * y) / window.innerHeight,
      });

      confetti({
        particleCount: 95,
        angle: 58,
        spread: 76,
        startVelocity: 52,
        origin: origin(0.05, 0.38),
        colors,
        scalar: 1.25,
        ticks: 220,
      });
      confetti({
        particleCount: 95,
        angle: 122,
        spread: 76,
        startVelocity: 52,
        origin: origin(0.95, 0.38),
        colors,
        scalar: 1.25,
        ticks: 220,
      });
      confetti({
        particleCount: 44,
        angle: 90,
        spread: 115,
        startVelocity: 38,
        origin: origin(0.5, 0.42),
        colors,
        scalar: 1.1,
        ticks: 200,
      });
    };

    const firstTimer = window.setTimeout(fire, 220);
    const secondTimer = window.setTimeout(() => {
      const rect = targetRef.current?.getBoundingClientRect();
      if (!rect) return;

      confetti({
        particleCount: 70,
        spread: 120,
        startVelocity: 28,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height * 0.3) / window.innerHeight,
        },
        colors,
        scalar: 1,
        ticks: 180,
      });
    }, 680);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [targetRef]);

  return null;
};
