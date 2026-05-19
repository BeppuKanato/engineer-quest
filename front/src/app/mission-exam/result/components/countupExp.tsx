"use client";

import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

type CountUpExpProps = {
  exp: number;
  duration?: number;
};

export const CountUpExp = ({
  exp,
  duration = 950,
}: CountUpExpProps) => {
  const [displayExp, setDisplayExp] = useState(0);

  useEffect(() => {
    let animationFrameId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayExp(Math.round(exp * eased));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, exp]);

  return (
    <Typography
      sx={{
        fontSize: { xs: 54, md: 72 },
        fontWeight: 900,
        lineHeight: 1,
        mt: 0.7,
        letterSpacing: -2,
      }}
    >
      +{displayExp}
    </Typography>
  );
};