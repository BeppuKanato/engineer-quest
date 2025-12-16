"use client";

import { IconButton, Typography } from "@mui/material";
import { ArrowLeft } from "lucide-react";

type BackHeaderProps = {
  title: string;
  onClick: () => void;
};

export const BackHeader = ({ title, onClick }: BackHeaderProps) => {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 sticky top-0 z-40 w-full shadow-sm flex items-center justify-start gap-3">
      <IconButton
        size="medium"
        onClick={onClick}
        className="bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <ArrowLeft className="text-indigo-600" />
      </IconButton>

      <Typography variant="h6" className="font-bold text-gray-900">
        {title}
      </Typography>
    </header>
  );
};
