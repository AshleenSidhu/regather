"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewFlagAction } from "@/app/actions/partner";
import { Card } from "@/components/ui/Card";
import { PillButton } from "@/components/ui/PillButton";

export type FlagRow = {
  id: string;
  createdAt: string;
  severity: "medium" | "high";
  source: "keyword" | "ai" | "sos";
  context: string;
  status: "open" | "reviewing" | "resolved";
  snapshot: string | null;
  reviewNote: string | null;
  sender: string | null;
};

const CONTEXT_LABEL: Record<string, string> = {
  circle: "Circle message",
  private: "Private chat message",
  mentor: "Mentor chat message",
  note: "Candy-gram note",
  sos: "Asked for help",
};

function FlagItem({ flag, canReview }: { flag: FlagRow; canReview: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function review(status: FlagRow["status"]) {
    setError(undefined);
    start(async () => {
      const res = await reviewFlagAction({ id: flag.id, status, note });
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <Card tone={flag.status === "open" ? "blush" : "cream"} className="pop-in flex flex-col gap-3 p-5!">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">
          {CONTEXT_LABEL[flag.context] ?? flag.context}
          <span className="font-normal text-ink-soft"> · from {flag.sender ?? "a deleted account"}</span>
        </p>
        <div className="flex gap-2 text-sm font-semibold">
          <span className="rounded-full bg-white px-3 py-1 capitalize">{flag.severity}</span>
          <span className="rounded-full bg-white px-3 py-1">{flag.source === "ai" ? "AI check" : flag.source === "sos" ? "Help button" : "Keyword"}</span>
          <span className="rounded-full bg-lilac px-3 py-1 capitalize">{flag.status}</span>
        </div>
      </div>
      <time dateTime={flag.createdAt} suppressHydrationWarning className="text-sm text-ink-soft">
        {new Date(flag.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
      </time>

      {flag.snapshot ? (
        <div>
          <PillButton className="min-h-9! px-4! py-1! text-sm" onClick={() => setShow((s) => !s)} aria-expanded={show}>
            {show ? "Hide message" : "Show message"}
          </PillButton>
          {show && (
            <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl bg-white p-4">{flag.snapshot}</p>
          )}
        </div>
      ) : (
        <p className="text-ink-soft">No message text. This person tapped the help button.</p>
      )}

      {flag.reviewNote && <p className="text-sm text-ink-soft">Note: {flag.reviewNote}</p>}

      {canReview && flag.status !== "resolved" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" htmlFor={`note-${flag.id}`}>Note for the record (optional)</label>
          <input
            id={`note-${flag.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="e.g. Called the family, connected with the on-call counsellor"
            className="min-h-11 rounded-2xl border border-white bg-white px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
          <div className="flex gap-2">
            {flag.status === "open" && (
              <PillButton className="min-h-10! py-1.5! text-sm" disabled={pending} onClick={() => review("reviewing")}>
                I&apos;m on it
              </PillButton>
            )}
            <PillButton variant="ink" className="min-h-10! py-1.5! text-sm" disabled={pending} onClick={() => review("resolved")}>
              Mark resolved
            </PillButton>
          </div>
          {error && <p role="alert" className="text-sm font-semibold">{error}</p>}
        </div>
      )}
    </Card>
  );
}

export function FlagList({ flags, canReview }: { flags: FlagRow[]; canReview: boolean }) {
  const open = flags.filter((f) => f.status !== "resolved");
  const done = flags.filter((f) => f.status === "resolved");

  if (flags.length === 0) {
    return (
      <Card tone="mint" className="text-center">
        <p className="text-xl font-bold">All clear 🌿</p>
        <p className="text-ink-soft">Nothing has been flagged. New flags will appear here live.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {open.map((f) => <FlagItem key={f.id} flag={f} canReview={canReview} />)}
      {done.length > 0 && (
        <details className="rounded-card bg-white/60 p-4">
          <summary className="cursor-pointer font-bold">Resolved ({done.length})</summary>
          <div className="mt-3 flex flex-col gap-3">
            {done.map((f) => <FlagItem key={f.id} flag={f} canReview={false} />)}
          </div>
        </details>
      )}
    </div>
  );
}
