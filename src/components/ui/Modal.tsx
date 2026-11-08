"use client";

import { useEffect, useId, useRef } from "react";
import { CloseIcon } from "./Icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional art above the title (Lotl, a jar...). */
  art?: React.ReactNode;
};

// Built on the native <dialog>: focus is trapped, Escape closes it, the page behind is
// inert. On phones it slides up from the bottom as a sheet; on wider screens it floats.
export function Modal({ open, onClose, title, children, art }: ModalProps) {
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
      className="sheet paper mx-auto mb-0 mt-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-b-none border-0 p-0 text-ink sm:m-auto sm:rounded-b-[28px]"
    >
      <div className="relative px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="press absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        {art && <div className="mb-1 flex justify-center">{art}</div>}
        <h2 id={titleId} className="font-display mb-3 pr-10 text-2xl font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
