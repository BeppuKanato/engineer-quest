"use client";

import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import { Box } from "@mui/material";
import { useState } from "react";

type ResponsiveSize = number | string | Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", number | string>>;

export const CreateThumbnail = ({
  src,
  alt,
  height = 180,
  onClick,
}: {
  src?: string | null;
  alt: string;
  height?: ResponsiveSize;
  onClick?: () => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(src) && !imageError;

  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) onClick();
      }}
      sx={{
        height,
        borderRadius: 2,
        bgcolor: "#eef6ff",
        border: "1px solid #dbeafe",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        cursor: onClick ? "zoom-in" : "default",
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={src ?? undefined}
          alt={alt}
          onError={() => setImageError(true)}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <CollectionsBookmarkIcon aria-label={`${alt}の代替アイコン`} sx={{ fontSize: 72, color: "#0b6bcb" }} />
      )}
    </Box>
  );
};
