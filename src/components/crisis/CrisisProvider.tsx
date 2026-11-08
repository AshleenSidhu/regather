"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { triggerSosAction } from "@/app/actions/chat";
import { CRISIS_RESOURCES } from "@/lib/options";
import { Modal } from "@/components/ui/Modal";
import { PillButton } from "@/components/ui/PillButton";

type CrisisContextValue = { open: () => void };
const CrisisContext = createContext<CrisisContextValue | null>(null);

export function useCrisis() {
  const ctx = useContext(CrisisContext);
  if (!ctx) throw new Error("useCrisis must be used inside <CrisisProvider>");
  return ctx;
}

type Sos = "idle" | "sending" | "sent" | "failed";

export function CrisisProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sos, setSos] = useState<Sos>("idle");

  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(() => ({ open }), [open]);

  async function letSomeoneKnow() {
    setSos("sending");
    const res = await triggerSosAction();
    setSos(res.ok ? "sent" : "failed");
  }

  return (
    <CrisisContext.Provider value={value}>
      {children}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="You're not alone.">
        <p className="mb-4 text-lg text-ink-soft">
          If you or someone you love is thinking about suicide, or feels unsafe right now,
          please reach out. These are free, and someone will pick up.
        </p>
        <ul className="mb-5 flex flex-col gap-3">
          {CRISIS_RESOURCES.map((r) => (
            <li key={r.tel}>
              <a
                href={`tel:${r.tel}`}
                className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span>
                  <span className="block font-bold">{r.name}</span>
                  <span className="block text-sm text-ink-soft">{r.detail}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-lilac px-4 py-2 text-lg font-extrabold">{r.display}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mb-5 rounded-2xl bg-white/70 p-4">
          {sos === "sent" ? (
            <p className="font-semibold">
              Thank you. Someone at your program has been told you could use support.
            </p>
          ) : (
            <>
              <p className="mb-3 text-ink-soft">
                Want someone at your program to check in with you too?
              </p>
              <PillButton variant="white" onClick={letSomeoneKnow} disabled={sos === "sending"}>
                {sos === "sending" ? "Sending…" : "Let someone at my program know"}
              </PillButton>
              {sos === "failed" && (
                <p className="mt-2 text-sm text-ink-soft">That didn&apos;t go through. The numbers above still work.</p>
              )}
            </>
          )}
        </div>

        <PillButton variant="ink" className="w-full" onClick={() => setIsOpen(false)}>
          I&apos;m safe right now
        </PillButton>
      </Modal>
    </CrisisContext.Provider>
  );
}
