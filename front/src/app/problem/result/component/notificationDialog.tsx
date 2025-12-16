"use client";

import { ReactNode } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, Typography } from "@mui/material";

interface NotificationDialogProps {
  open: boolean;
  title: string;
  content: ReactNode;
  isLast?: boolean;
  onNext: () => void;
}

export function NotificationDialog({ open, title, content, isLast = false, onNext }: NotificationDialogProps) {
  return (
    <Dialog open={open} onClose={onNext} maxWidth="xs" fullWidth>
      <Card className="rounded-2xl shadow-lg p-4 bg-white">
        <DialogTitle>
          <Typography variant="h6" className="font-bold text-indigo-700">
            {title}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <div className="mt-2 text-gray-700">{content}</div>
        </DialogContent>
        <DialogActions className="justify-center mt-2">
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            className="rounded-xl px-6 py-2 font-semibold"
          >
            {isLast ? "🏠 ホームへ戻る" : "次へ"}
          </Button>
        </DialogActions>
      </Card>
    </Dialog>
  );
}
