"use client";

import { useEffect, useRef } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";

/**
 * A full-screen moment (breathing, grounding): the tinted sky edge to edge, a close
 * control top left, the title in the middle. Covers the tab bar; Escape closes it.
 */
export function Player({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="player fixed inset-0 z-40 overflow-y-auto">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-center justify-between">
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Close ${title}`} className="round">
            <ChevronDownIcon className="h-6 w-6" />
          </button>
          <p className="font-medium">{title}</p>
          <span aria-hidden="true" className="w-12" />
        </div>
        {children}
      </div>
    </div>
  );
}
