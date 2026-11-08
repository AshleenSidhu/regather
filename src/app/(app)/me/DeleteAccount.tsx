"use client";

import { useActionState } from "react";
import { deleteAccountAction } from "@/app/actions/privacy";
import type { FormState } from "@/app/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";

export function DeleteAccount({ nickname }: { nickname: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccountAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-ink-soft">
        This permanently deletes your profile, messages, notes and connections. It can&apos;t be undone.
        (If a message was flagged for safety, a copy is kept for review with no link to you.)
      </p>
      <Field label={`Type your nickname (${nickname}) to confirm`} name="confirm" autoComplete="off" required />
      <FormError message={state.error} />
      <PillButton type="submit" variant="ink" disabled={pending} className="self-start">
        {pending ? "Deleting…" : "Delete everything"}
      </PillButton>
    </form>
  );
}
