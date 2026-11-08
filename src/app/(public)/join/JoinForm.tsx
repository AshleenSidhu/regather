"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { joinAction, type FormState } from "@/app/actions/auth";
import { Card } from "@/components/ui/Card";
import { Field, FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";

export function JoinForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<FormState, FormData>(joinAction, {});

  return (
    <Card tone="cream">
      <form action={action} className="flex flex-col gap-4">
        <Field
          label="Invite code"
          name="code"
          defaultValue={params.get("code") ?? ""}
          placeholder="RGTH-XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          maxLength={40}
        />
        <Field
          label="Nickname"
          name="nickname"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={24}
          hint="This is the only name others will see. No real names needed."
        />
        <Field label="Email" name="email" type="email" autoComplete="email" required hint="Only used to sign in. It's never shown to anyone." />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          hint="At least 10 characters."
        />
        <FormError message={state.error} />
        <PillButton type="submit" variant="ink" disabled={pending} className="w-full">
          {pending ? "Checking your code…" : "Continue"}
        </PillButton>
      </form>
    </Card>
  );
}
