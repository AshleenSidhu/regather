"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendNoteAction } from "@/app/actions/social";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import { Modal } from "@/components/ui/Modal";
import { FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import { NOTE_COLORS, STICKERS, type NoteSticker } from "@/lib/options";

export type Recipient = { id: string; nickname: string; sticker: string };

export function NoteComposer({ recipients }: { recipients: Recipient[] }) {
  const router = useRouter();
  const { open: openCrisis } = useCrisis();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState<string>("");
  const [sticker, setSticker] = useState<NoteSticker>("shell");
  const [color, setColor] = useState<string>("blush");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string>();
  const [pending, start] = useTransition();

  function send() {
    setError(undefined);
    start(async () => {
      const res = await sendNoteAction({ recipient: to, sticker, color, body });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const name = recipients.find((r) => r.id === to)?.nickname ?? "them";
      setSent(`Sent. It's swimming over to ${name}.`);
      setBody("");
      setOpen(false);
      router.refresh();
      if (res.crisis) openCrisis();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <PillButton variant="ink" disabled={recipients.length === 0} onClick={() => { setSent(undefined); setOpen(true); }}>
        ❀ Send a candy-gram
      </PillButton>
      {recipients.length === 0 && (
        <p className="text-sm text-on-sky/80">You can send notes once there are other people in your circle.</p>
      )}
      {sent && <p role="status" className="pop-in rounded-2xl bg-white/85 px-4 py-2 text-sm font-semibold shadow-soft">{sent}</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="A little note">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex flex-col gap-4"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">Who is it for?</legend>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={to === r.id}
                  onClick={() => setTo(r.id)}
                  className={"min-h-10 rounded-full border px-4 py-1.5 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " + (to === r.id ? "border-ink bg-ink text-white" : "border-white bg-white hover:bg-white/80")}
                >
                  {STICKERS.find((s) => s.value === r.sticker)?.emoji} {r.nickname}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">Sticker</legend>
            <div className="flex gap-2">
              {STICKERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={sticker === s.value}
                  aria-label={s.label}
                  onClick={() => setSticker(s.value)}
                  className={"grid h-12 w-12 place-items-center rounded-2xl border text-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " + (sticker === s.value ? "scale-110 border-ink bg-white shadow-soft" : "border-white bg-white/70")}
                >
                  {s.emoji}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">Card colour</legend>
            <div className="flex gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={color === c.value}
                  aria-label={c.label}
                  onClick={() => setColor(c.value)}
                  className={`h-10 w-10 rounded-full border-2 bg-linear-to-b transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${c.classes} ` + (color === c.value ? "scale-110 border-ink" : "border-white")}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="note-body" className="font-bold">Your note</label>
            <textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Thinking of you. You're doing better than you think."
              className="resize-none rounded-2xl border border-white bg-white px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
            <p className="text-right text-xs text-ink-soft">{body.length}/280</p>
          </div>

          <FormError message={error} />
          <div className="flex gap-3">
            <PillButton onClick={() => setOpen(false)} disabled={pending}>Cancel</PillButton>
            <PillButton type="submit" variant="ink" className="flex-1" disabled={pending || !to || !body.trim()}>
              {pending ? "Sending…" : "Send"}
            </PillButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
