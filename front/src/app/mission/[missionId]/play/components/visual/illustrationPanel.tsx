"use client";

import { Box } from "@mui/material";
import Image from "next/image";

import type { IllustrationPanelVisual } from "./type";

type IllustrationPanelProps = {
  visual: IllustrationPanelVisual;
};

export const IllustrationPanel = ({ visual }: IllustrationPanelProps) => {
  const width = visual.image.width ?? 960;
  const height = visual.image.height ?? 540;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: `${width} / ${height}`,
        maxHeight: 440,
        overflow: "hidden",
        border: "1px solid #dbe3ef",
        borderRadius: 2,
        bgcolor: "#f8fafc",
        backgroundImage:
          "linear-gradient(135deg, rgba(239, 246, 255, 0.7), rgba(240, 253, 244, 0.45))",
      }}
    >
      <Image
        fill
        src={visual.image.src}
        alt={visual.image.alt}
        sizes="(max-width: 1200px) 45vw, 560px"
        style={{ objectFit: "contain" }}
      />
    </Box>
  );
};
