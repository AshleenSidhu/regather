"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/privacy";
import { Field, FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import { STICKERS, type NoteSticker } from "@/lib/options";

export function ProfileForm({ nickname, sticker }: { nickname: string; sticker: NoteSticker }) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as { error?: string; saved?: boolean });
  const [chosen, setChosen] = useState<NoteSticker>(sticker);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nickname" name="nickname" defaultValue={nickname} required minLength={2} maxLength={24} />
      <fieldset>
        <legend className="mb-2 font-semibold">Your sticker</legend>
        <div className="flex gap-2">
          {STICKERS.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={chosen === s.value}
              aria-label={s.label}
              onClick={() => setChosen(s.value)}
              className={"grid h-12 w-12 place-items-center rounded-2xl border text-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " + (chosen === s.value ? "scale-110 border-ink bg-white shadow-soft" : "border-white bg-white/70")}
            >
              {s.emoji}
            </button>
          ))}
        </div>
        <input type="hidden" name="sticker" value={chosen} />
      </fieldset>
      <FormError message={state.error} />
      {state.saved && <p role="status" className="font-semibold">Saved ✓</p>}
      <PillButton type="submit" variant="ink" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save"}
      </PillButton>
    </form>
  );
}
