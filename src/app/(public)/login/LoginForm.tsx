"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions/auth";
import { Card } from "@/components/ui/Card";
import { Field, FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <Card tone="cream">
      <form action={action} className="flex flex-col gap-4">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <FormError message={state.error} />
        <PillButton type="submit" variant="ink" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </PillButton>
      </form>
    </Card>
  );
}
