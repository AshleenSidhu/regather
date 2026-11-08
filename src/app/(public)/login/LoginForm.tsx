"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/actions/auth";
import { AuthError, AuthField } from "@/components/home/AuthShell";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="ra-form">
      <AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      <AuthField label="Password" name="password" type="password" autoComplete="current-password" required />
      <AuthError message={state.error} />
      <button type="submit" className="ra-submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
