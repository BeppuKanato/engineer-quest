import { motion, AnimatePresence } from "framer-motion";
import React from "react";

type DialogBaseProps = {
  children: React.ReactNode;
  className?: string;
};

export const Dialog = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// パーツごとに分ける
export const DialogHeader: React.FC<DialogBaseProps> = ({
  children,
  className = "",
}) => (
  <div className={`text-lg font-semibold border-b pb-2 mb-4 ${className}`}>
    {children}
  </div>
);

export const DialogContent: React.FC<DialogBaseProps> = ({
  children,
  className = "",
}) => <div className={`mb-4 ${className}`}>{children}</div>;

export const DialogActions: React.FC<DialogBaseProps> = ({
  children,
  className = "",
}) => (
  <div className={`flex justify-end space-x-2 border-t pt-2 ${className}`}>
    {children}
  </div>
);

// DialogFooter コンポーネント追加
export const DialogFooter: React.FC<DialogBaseProps> = ({
  children,
  className = "",
}) => (
  <div className={`flex justify-end gap-2 border-t pt-2 ${className}`}>
    {children}
  </div>
);

