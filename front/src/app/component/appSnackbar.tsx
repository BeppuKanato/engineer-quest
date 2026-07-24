"use client";

import { Alert, Snackbar } from "@mui/material";
import type { AlertColor } from "@mui/material";

type AppSnackbarProps = {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
};

export const AppSnackbar = ({
  open,
  message,
  severity = "success",
  onClose,
}: AppSnackbarProps) => (
  <Snackbar open={open} autoHideDuration={2200} onClose={onClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
    <Alert onClose={onClose} severity={severity} variant="filled" sx={{ fontWeight: 800 }}>
      {message}
    </Alert>
  </Snackbar>
);
