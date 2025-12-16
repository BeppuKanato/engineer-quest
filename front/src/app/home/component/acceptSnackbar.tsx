"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";

type MissionSnackbarProps = {
  message: string;
  duration?: number; // ミリ秒
  onClose?: () => void;
};

export const MissionSnackbar: React.FC<MissionSnackbarProps> = ({
  message,
  duration = 3000,
  onClose,
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
        >
          {message}
          <motion.div
            className="h-1 bg-white rounded-full w-full absolute bottom-0 left-0"
            initial={{ width: "100%" }}
            animate={{ width: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
