"use client";

import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

export const CountUpExp = ({ exp }: { exp: number }) => {
  const [displayExp, setDisplayExp] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startTime = performance.now();
    const duration = 1100;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayExp(Math.round(exp * eased));

      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [exp]);

  return (
    <Typography
      sx={{
        mt: 0.5,
        fontSize: { xs: 58, md: 78 },
        fontWeight: 900,
        lineHeight: 1,
        color: "#fff",
        letterSpacing: 0,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      +{displayExp}
    </Typography>
  );
};
