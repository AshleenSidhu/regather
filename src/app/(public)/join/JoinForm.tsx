"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { joinAction, type FormState } from "@/app/actions/auth";
import { AuthError, AuthField } from "@/components/home/AuthShell";

export function JoinForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<FormState, FormData>(joinAction, {});

  return (
    <form action={action} className="ra-form">
      {/* the invite, styled like a little ticket */}
      <div className="ra-ticket">
        <AuthField
          label="Your invite code"
          name="code"
          defaultValue={params.get("code") ?? ""}
          placeholder="RGTH-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          maxLength={40}
          className="ra-mono"
        />
      </div>
      <AuthField
        label="A nickname"
        name="nickname"
        autoComplete="nickname"
        required
        minLength={2}
        maxLength={24}
        hint="The only name others see. No real names needed."
      />
      <AuthField label="Email" name="email" type="email" autoComplete="email" required hint="Only for signing in. Never shown." />
      <AuthField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="At least 10 characters."
      />
      <AuthError message={state.error} />
      <button type="submit" className="ra-submit" disabled={pending}>
        {pending ? "Checking your code…" : "Step inside"}
      </button>
    </form>
  );
}
