"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

export interface Sentence {
  sentence: string;
  speaker: {
    name: string;
    imagePath: string;
  };
}

interface SentenceDialogProps {
  open: boolean;
  onClose: () => void;
  sentences: Sentence[];
  onGoHome: () => void;
}

export function SentenceDialog({
  open,
  onClose,
  sentences
}: SentenceDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === sentences.length - 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className:
          "rounded-2xl shadow-lg overflow-hidden bg-white", // Tailwindで補強
      }}
    >
        <DialogTitle className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 shadow-sm flex items-center justify-center text-2xl">
            {sentences[currentIndex].speaker.imagePath}
        </div>
        <span className="font-semibold text-gray-800">
            {sentences[currentIndex].speaker.name}
        </span>
        </DialogTitle>

      {/* Message */}
      <DialogContent className="px-6 py-6 bg-gray-50 text-base">
        <p className="bg-white p-4 rounded-xl shadow-md border border-gray-100 break-words leading-relaxed">
          {sentences[currentIndex].sentence}
        </p>

        {/* Progress */}
        <div className="flex items-center gap-1 mt-4">
          {sentences.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                idx <= currentIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </DialogContent>

      {/* Footer */}
      <DialogActions className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
        {!isLast ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="rounded-lg shadow"
          >
            次へ
          </Button>
        ) : (
          <></>
        )}
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => {
            onClose();
            setCurrentIndex(0);
          }}
          className="rounded-lg"
        >
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}
