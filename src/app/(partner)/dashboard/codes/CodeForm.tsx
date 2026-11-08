"use client";

import { useActionState, useState } from "react";
import { createInviteCodeAction, type CodeState } from "@/app/actions/partner";
import { Card } from "@/components/ui/Card";
import { Field, FormError } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PillButton } from "@/components/ui/PillButton";

const BANDS: Record<string, { value: string; label: string }[]> = {
  youth: [{ value: "13_15", label: "13 to 15" }, { value: "16_17", label: "16 to 17" }],
  young_adult: [{ value: "18_24", label: "18 to 24" }],
  parent: [{ value: "25_plus", label: "25 and over" }, { value: "18_24", label: "18 to 24" }],
  mentor: [{ value: "18_24", label: "18 to 24 (for youth circles)" }, { value: "25_plus", label: "25 and over" }],
};

const selectClass =
  "min-h-12 rounded-2xl border border-white bg-white px-3 text-base shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function CodeForm() {
  const [state, action, pending] = useActionState<CodeState, FormData>(createInviteCodeAction, {});
  const [role, setRole] = useState("parent");
  const [copied, setCopied] = useState(false);
  // The dialog stays closed until a code exists, and can be dismissed without losing the form.
  const [dismissedFor, setDismissedFor] = useState<string>();
  const showResult = Boolean(state.code) && dismissedFor !== state.code;

  return (
    <Card tone="lilac">
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 font-semibold">
          Who is this for?
          <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
            <option value="parent">Parent / caregiver</option>
            <option value="youth">Youth (13–17)</option>
            <option value="young_adult">Young adult (18–24)</option>
            <option value="mentor">Mentor</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Age range
          <select name="ageBand" key={role} className={selectClass}>
            {BANDS[role].map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Uses (1–10)
          <input name="maxUses" type="number" min={1} max={10} defaultValue={1} className={selectClass} />
        </label>
        <label className="flex flex-col gap-1.5 font-semibold">
          Expires in (days, 1–30)
          <input name="ttlDays" type="number" min={1} max={30} defaultValue={7} className={selectClass} />
        </label>
        <div className="sm:col-span-2">
          <Field label="Label (optional)" name="label" maxLength={40} hint="For your own tracking, like “ER discharge, Tuesday”. Please don't put names or health details here." />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-3">
          <FormError message={state.error} />
          <PillButton type="submit" variant="ink" disabled={pending} className="self-start">
            {pending ? "Making a code…" : "Make a code"}
          </PillButton>
        </div>
      </form>

      <Modal open={showResult} onClose={() => setDismissedFor(state.code)} title="Your new code">
        <p className="mb-3 text-ink-soft">Copy it now. For safety, it won&apos;t be shown again.</p>
        <p className="mb-3 break-all rounded-2xl bg-white p-4 text-center text-2xl font-extrabold tracking-wider shadow-soft" data-testid="new-code">
          {state.code}
        </p>
        {state.qrSvg && (
          // The QR is an <img> with a data URL, so it can never run scripts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(state.qrSvg)}`}
            alt="QR code that opens the join page with this code filled in"
            width={220}
            height={220}
            className="mx-auto mb-3 rounded-2xl bg-white p-2 shadow-soft"
          />
        )}
        <div className="flex gap-3">
          <PillButton
            className="flex-1"
            onClick={async () => {
              await navigator.clipboard.writeText(state.code ?? "");
              setCopied(true);
            }}
          >
            {copied ? "Copied ✓" : "Copy code"}
          </PillButton>
          <PillButton variant="ink" className="flex-1" onClick={() => { setCopied(false); setDismissedFor(state.code); }}>
            Done
          </PillButton>
        </div>
      </Modal>
    </Card>
  );
}
