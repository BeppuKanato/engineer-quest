"use client";

import LockIcon from "@mui/icons-material/Lock";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box } from "@mui/material";
import { useState } from "react";

type TechBadgeIconProps = {
  name: string;
  iconUrl: string | null;
  isLocked?: boolean;
  size?: number;
  iconSize?: number;
};

export const TechBadgeIcon = ({
  name,
  iconUrl,
  isLocked = false,
  size = 56,
  iconSize = 34,
}: TechBadgeIconProps) => {
  const [hasImageError, setHasImageError] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  const canShowImage = Boolean(iconUrl) && !hasImageError && !isLocked;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        bgcolor: isLocked ? "#f1f5f9" : "#ffffff",
        border: "1px solid #e2e8f0",
        color: isLocked ? "#94a3b8" : "#0891b2",
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {isLocked ? (
        <LockIcon sx={{ fontSize: iconSize }} />
      ) : canShowImage ? (
        <Box
          component="img"
          src={iconUrl ?? undefined}
          alt={name}
          onError={() => setHasImageError(true)}
          sx={{ width: iconSize, height: iconSize, objectFit: "contain" }}
        />
      ) : initial === "?" ? (
        <WorkspacePremiumIcon sx={{ fontSize: iconSize }} />
      ) : (
        initial
      )}
    </Box>
  );
};
