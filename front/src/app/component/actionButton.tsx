"use client";

import { Button, CircularProgress } from "@mui/material";
import type { ButtonProps } from "@mui/material";

type ActionButtonProps = ButtonProps & {
  loading?: boolean;
  loadingLabel?: string;
};

export const ActionButton = ({
  children,
  disabled,
  loading = false,
  loadingLabel,
  startIcon,
  ...props
}: ActionButtonProps) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : startIcon}
    >
      {loading ? loadingLabel ?? children : children}
    </Button>
  );
};
