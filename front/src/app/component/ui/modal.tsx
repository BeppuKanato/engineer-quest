import React from "react";
import ReactDOM from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
};

export const Modal = ({ open, onClose, className = "", children }: ModalProps) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      data-slot="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        data-slot="modal-content"
        className={`relative ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};