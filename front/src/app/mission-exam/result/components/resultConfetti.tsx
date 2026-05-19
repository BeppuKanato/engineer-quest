"use client";

import { RefObject, useEffect } from "react";
import confetti from "canvas-confetti";

type ResultConfettiProps = {
  targetRef: RefObject<HTMLElement | null>;
  fireKey: number;
};

const colors = ["#1976D2", "#42A5F5", "#FFD54F", "#66BB6A", "#90CAF9"];

const getOriginFromPoint = (x: number, y: number) => ({
  x: x / window.innerWidth,
  y: y / window.innerHeight,
});

export const ResultConfetti = ({
  targetRef,
  fireKey,
}: ResultConfettiProps) => {
  useEffect(() => {
    if (fireKey === 0) return;

    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;

    const point = (xRate: number, yRate: number) => {
      const currentRect = targetRef.current?.getBoundingClientRect();
      if (!currentRect) return null;

      return getOriginFromPoint(
        currentRect.left + currentRect.width * xRate,
        currentRect.top + currentRect.height * yRate
      );
    };

    const leftLower = point(-0.12, 0.48);
    const rightLower = point(1.12, 0.48);
    const centerLower = point(0.5, 0.5);
    const leftMiddle = point(0.22, 0.38);
    const rightMiddle = point(0.78, 0.38);

    if (!leftLower || !rightLower || !centerLower || !leftMiddle || !rightMiddle) {
      return;
    }

    confetti({
      particleCount: 95,
      angle: 55,
      spread: 78,
      startVelocity: 52,
      origin: leftLower,
      colors,
      scalar: 1.35,
      ticks: 220,
    });

    confetti({
      particleCount: 95,
      angle: 125,
      spread: 78,
      startVelocity: 52,
      origin: rightLower,
      colors,
      scalar: 1.35,
      ticks: 220,
    });

    confetti({
      particleCount: 32,
      angle: 90,
      spread: 105,
      startVelocity: 42,
      origin: centerLower,
      colors,
      scalar: 1.2,
      ticks: 220,
    });

    const timers = [
      window.setTimeout(() => {
        confetti({
          particleCount: 55,
          angle: 75,
          spread: 88,
          startVelocity: 38,
          origin: leftMiddle,
          colors,
          scalar: 1.15,
          ticks: 200,
        });
      }, 180),

      window.setTimeout(() => {
        confetti({
          particleCount: 55,
          angle: 105,
          spread: 88,
          startVelocity: 38,
          origin: rightMiddle,
          colors,
          scalar: 1.15,
          ticks: 200,
        });
      }, 300),

      window.setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 90,
          spread: 125,
          startVelocity: 28,
          origin: centerLower,
          colors: ["#FFD54F", "#FFF59D", "#42A5F5"],
          scalar: 1.05,
          ticks: 180,
        });
      }, 520),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [targetRef, fireKey]);

  return null;
};