"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";

export const ImagePreviewDialog = ({
  open,
  title,
  src,
  onClose,
}: {
  open: boolean;
  title: string;
  src?: string | null;
  onClose: () => void;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle sx={{ fontWeight: 900, pr: 6 }}>
      {title}
      <IconButton aria-label="閉じる" onClick={onClose} sx={{ position: "absolute", right: 12, top: 10 }}>
        <CloseRoundedIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid #dbe3ef",
          bgcolor: "#f8fbff",
          overflow: "hidden",
        }}
      >
        {src ? (
          <Box component="img" src={src} alt={title} sx={{ display: "block", width: "100%", height: "auto" }} />
        ) : (
          <Box sx={{ py: 12, textAlign: "center", color: "text.secondary" }}>画像はまだ設定されていません</Box>
        )}
      </Box>
    </DialogContent>
  </Dialog>
);
