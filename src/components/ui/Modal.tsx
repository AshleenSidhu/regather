"use client";

import { useEffect, useId, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

// Built on the native <dialog>: focus is trapped, Escape closes it, and the page behind
// is inert, with no extra libraries.
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the dim backdrop
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-card border-0 bg-cream p-0 text-ink shadow-lift backdrop:bg-ink/30 backdrop:backdrop-blur-sm open:animate-[pop-in_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
    >
      <div className="p-6">
        <h2 id={titleId} className="mb-3 text-2xl font-bold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
