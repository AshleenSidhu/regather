"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/privacy";
import { Field, FormError } from "@/components/ui/Field";
import { Sticker } from "@/components/ui/Icons";
import { PillButton } from "@/components/ui/PillButton";
import { STICKERS, type NoteSticker } from "@/lib/options";

export function ProfileForm({ nickname, sticker }: { nickname: string; sticker: NoteSticker }) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as { error?: string; saved?: boolean });
  const [chosen, setChosen] = useState<NoteSticker>(sticker);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nickname" name="nickname" defaultValue={nickname} required minLength={2} maxLength={24} />
      <fieldset>
        <legend className="mb-2 font-bold">Your sticker</legend>
        <div className="flex gap-2">
          {STICKERS.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={chosen === s.value}
              aria-label={s.label}
              onClick={() => setChosen(s.value)}
              className={"press grid h-14 w-14 place-items-center rounded-2xl border-2 " + (chosen === s.value ? "border-ink bg-white" : "border-transparent bg-paper-2")}
            >
              <Sticker kind={s.value} className="h-10 w-10" />
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
