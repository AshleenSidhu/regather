"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { sendNoteAction } from "@/app/actions/social";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import { Lotl } from "@/components/lotl/Lotl";
import { Sticker } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import { NOTE_COLORS, STICKERS, type NoteSticker } from "@/lib/options";
import { PAPER } from "./NoteCard";

export type Recipient = { id: string; nickname: string; sticker: string };

const STARTERS = ["Thinking of you tonight.", "You're doing better than you think.", "I'm proud of you for showing up.", "Same here. You're not alone."];

/** Lotl swims across the screen carrying the note. */
function CarryAcross({ name, onDone }: { name: string; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3300);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div role="status" className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      <div className="carry-across">
        <Lotl mood="carry" className="h-32 w-auto drop-shadow-xl" title="" bubbles />
      </div>
      <p className="pop-in glass absolute bottom-[22vh] rounded-full px-5 py-2.5 font-bold">Lotl is carrying it to {name}…</p>
    </div>
  );
}

export function NoteComposer({ recipients }: { recipients: Recipient[] }) {
  const router = useRouter();
  const { open: openCrisis } = useCrisis();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState<string>("");
  const [sticker, setSticker] = useState<NoteSticker>("shell");
  const [color, setColor] = useState<string>("blush");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();
  const [carrying, setCarrying] = useState<string | null>(null);
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
      setBody("");
      setOpen(false);
      if (res.crisis) openCrisis();
      else setCarrying(name);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <PillButton variant="white" className="w-full" disabled={recipients.length === 0} onClick={() => setOpen(true)}>
        Send a little note
      </PillButton>
      {recipients.length === 0 && (
        <p className="text-center text-sm text-on-sky-soft">You can send notes once others join your pond.</p>
      )}
      {carrying && <CarryAcross name={carrying} onDone={() => setCarrying(null)} />}

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
                  className={"lift flex min-h-11 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-4 font-bold " + (to === r.id ? "border-ink bg-ink text-white" : "border-[#f0e4da] bg-white")}
                >
                  <Sticker kind={r.sticker} className="h-8 w-8" /> {r.nickname}
                </button>
              ))}
            </div>
          </fieldset>

          {/* live preview: the note itself is the editor */}
          <div className="relative rounded-[22px] border border-white p-4 pt-5 shadow-soft transition-colors duration-500" style={{ background: `linear-gradient(180deg,#fffdf9,${PAPER[color] ?? PAPER.blush})` }}>
            <span aria-hidden="true" key={sticker} className="pop-in absolute -right-2 -top-3 rotate-12">
              <Sticker kind={sticker} className="h-12 w-12 drop-shadow" />
            </span>
            <label htmlFor="note-body" className="sr-only">Your note</label>
            <textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Write a few kind words…"
              className="font-hand w-full resize-none bg-transparent pr-6 text-[1.7rem] leading-[1.15] placeholder:text-ink-soft/50"
            />
            <p className="text-right text-xs font-bold text-ink-soft">{body.length}/280</p>
          </div>

          {!body && (
            <div className="-mt-1 flex flex-wrap gap-2" aria-label="Ideas to start with">
              {STARTERS.map((s) => (
                <button key={s} type="button" onClick={() => setBody(s)} className="lift min-h-11 rounded-full bg-paper-2 px-3.5 text-sm font-semibold">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <fieldset className="flex items-center gap-1.5">
              <legend className="sr-only">Sticker</legend>
              {STICKERS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={sticker === s.value}
                  aria-label={s.label}
                  onClick={() => setSticker(s.value)}
                  className={"press grid h-12 w-12 place-items-center rounded-2xl border-2 " + (sticker === s.value ? "border-ink bg-white" : "border-transparent bg-paper-2")}
                >
                  <Sticker kind={s.value} className="h-9 w-9" />
                </button>
              ))}
            </fieldset>
            <fieldset className="flex items-center gap-1.5">
              <legend className="sr-only">Paper colour</legend>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={color === c.value}
                  aria-label={c.value === "lilac" ? "Lantern" : c.label}
                  onClick={() => setColor(c.value)}
                  className={"press h-11 w-11 rounded-full border-[3px] " + (color === c.value ? "border-ink" : "border-white")}
                  style={{ background: PAPER[c.value] }}
                />
              ))}
            </fieldset>
          </div>

          <FormError message={error} />
          <PillButton type="submit" variant="ink" className="w-full" disabled={pending || !to || !body.trim()}>
            {pending ? "Wrapping it up…" : "Send with Lotl"}
          </PillButton>
        </form>
      </Modal>
    </div>
  );
}
