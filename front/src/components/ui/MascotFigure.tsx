"use client";

import { Avatar, Box, keyframes, type SxProps, type Theme } from "@mui/material";

import { getMascotImagePath, type MascotId, type MascotState } from "@/config/mascots";

export type MascotFigureSize = "S" | "M" | "L" | "XL";
export type MascotGrounding = "disc" | "shadow" | "frame";
export type MascotMotion = "none" | "bounce" | "float";

export const mascotFigureSizes: Record<MascotFigureSize, SxProps<Theme>> = {
  S: { width: { xs: 38, md: 48 }, height: { xs: 38, md: 48 } },
  M: { width: { xs: 72, sm: 80 }, height: { xs: 72, sm: 80 } },
  L: { width: { xs: 150, md: 160 }, height: { xs: 150, md: 160 } },
  XL: { width: { xs: 220, md: 240 }, height: { xs: 220, md: 240 } },
};

const mascotBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const mascotFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.03); }
`;

type MascotFigureProps = {
  mascotId: MascotId | string | null | undefined;
  alt: string;
  state?: MascotState;
  size?: MascotFigureSize;
  grounding?: MascotGrounding;
  presentation?: "full" | "circle";
  motion?: MascotMotion;
  sx?: SxProps<Theme>;
};

export const MascotFigure = ({
  mascotId,
  alt,
  state = "normal",
  size = "M",
  grounding = "disc",
  presentation = "full",
  motion = "none",
  sx,
}: MascotFigureProps) => {
  const sizeSx = mascotFigureSizes[size];

  if (presentation === "circle") {
    return (
      <Avatar
        alt={alt}
        src={getMascotImagePath(mascotId, "face")}
        data-mascot-figure="true"
        data-mascot-size={size}
        data-mascot-grounding="frame"
        data-mascot-presentation="circle"
        sx={[
          {
            ...sizeSx,
            flexShrink: 0,
            bgcolor: "#eaf2ff",
            border: "1px solid #bfdbfe",
            "& img": { objectFit: "contain" },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  }

  const animation =
    motion === "bounce"
      ? `${mascotBounce} 1200ms ease-in-out infinite`
      : motion === "float"
        ? `${mascotFloat} 1300ms ease-in-out infinite`
        : undefined;

  return (
    <Box
      data-mascot-figure="true"
      data-mascot-size={size}
      data-mascot-grounding={grounding}
      data-mascot-presentation="full"
      sx={[
        {
          ...sizeSx,
          position: "relative",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          isolation: "isolate",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {grounding === "disc" && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "3%",
            right: "3%",
            bottom: "1%",
            height: "27%",
            borderRadius: "50%",
            bgcolor: "#eaf2ff",
            border: "1px solid #dbeafe",
            zIndex: 0,
          }}
        />
      )}
      {grounding === "shadow" && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "19%",
            right: "19%",
            bottom: "3%",
            height: "8%",
            borderRadius: "50%",
            bgcolor: "rgba(15, 23, 42, 0.16)",
            filter: "blur(3px)",
            zIndex: 0,
          }}
        />
      )}
      <Box
        component="img"
        src={getMascotImagePath(mascotId, state)}
        alt={alt}
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
          animation,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      />
    </Box>
  );
};
