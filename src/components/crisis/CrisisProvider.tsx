"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { triggerSosAction } from "@/app/actions/chat";
import { requestMentorAction } from "@/app/actions/social";
import { Lotl } from "@/components/lotl/Lotl";
import { CalmIcon, PhoneIcon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { PillButton } from "@/components/ui/PillButton";
import { CRISIS_RESOURCES } from "@/lib/options";

type CrisisContextValue = { open: () => void };
const CrisisContext = createContext<CrisisContextValue | null>(null);

export function useCrisis() {
  const ctx = useContext(CrisisContext);
  if (!ctx) throw new Error("useCrisis must be used inside <CrisisProvider>");
  return ctx;
}

type Status = "idle" | "sending" | "sent" | "failed";

/** The calm help card. Warm, never alarming; one tap from every screen. */
export function CrisisProvider({ children, canAskMentor = false }: { children: React.ReactNode; canAskMentor?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sos, setSos] = useState<Status>("idle");
  const [mentor, setMentor] = useState<Status>("idle");
  const [mentorNote, setMentorNote] = useState<string>();

  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(() => ({ open }), [open]);

  async function letSomeoneKnow() {
    setSos("sending");
    const res = await triggerSosAction();
    setSos(res.ok ? "sent" : "failed");
  }

  async function askMentor() {
    setMentor("sending");
    const res = await requestMentorAction();
    setMentor(res.ok ? "sent" : "failed");
    setMentorNote(res.ok ? undefined : res.error);
  }

  return (
    <CrisisContext.Provider value={value}>
      {children}
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="You're not alone tonight."
        art={<Lotl mood="idle" className="h-20 w-auto" title="" glow={0.6} />}
      >
        <p className="mb-4 text-ink-soft">
          If you or someone you love feels unsafe right now, reach out. These lines are free,
          open all night, and a real person will answer.
        </p>
        <ul className="mb-4 flex flex-col gap-2.5">
          {CRISIS_RESOURCES.map((r, i) => (
            <li key={r.tel} className="enter" style={{ "--delay": `${120 + i * 90}ms` } as React.CSSProperties}>
              <a
                href={`tel:${r.tel}`}
                className="lift flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-[#f0e4da] bg-white px-4 py-3"
              >
                <span>
                  <span className="block font-bold">{r.name}</span>
                  <span className="block text-sm text-ink-soft">{r.detail}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-lantern-soft px-4 py-2 text-lg font-extrabold">
                  <PhoneIcon className="h-4 w-4" />
                  {r.display}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mb-4 flex flex-col gap-2.5 rounded-2xl bg-paper-2 p-4">
          {canAskMentor && (
            <div>
              {mentor === "sent" ? (
                <p className="font-semibold">Your mentor will see that you&apos;d like to talk.</p>
              ) : (
                <PillButton variant="white" className="w-full" onClick={askMentor} disabled={mentor === "sending"}>
                  {mentor === "sending" ? "Asking…" : "Ask my mentor to reach out"}
                </PillButton>
              )}
              {mentor === "failed" && <p className="mt-1.5 text-sm text-ink-soft">{mentorNote ?? "That didn't go through."} The numbers above still work.</p>}
            </div>
          )}
          {sos === "sent" ? (
            <p className="font-semibold">Thank you. Someone at your program has been told you could use support.</p>
          ) : (
            <PillButton variant="white" className="w-full" onClick={letSomeoneKnow} disabled={sos === "sending"}>
              {sos === "sending" ? "Letting them know…" : "Let someone at my program know"}
            </PillButton>
          )}
          {sos === "failed" && <p className="text-sm text-ink-soft">That didn&apos;t go through. The numbers above still work.</p>}
          <Link
            href="/calm?start=breathe"
            onClick={() => setIsOpen(false)}
            className="lift flex min-h-12 items-center justify-center gap-2 rounded-full px-4 font-bold text-ink hover:bg-white"
          >
            <CalmIcon className="h-5 w-5" /> Breathe with Lotl for a minute
          </Link>
        </div>

        <PillButton variant="ink" className="w-full" onClick={() => setIsOpen(false)}>
          I&apos;m safe right now
        </PillButton>
      </Modal>
    </CrisisContext.Provider>
  );
}
