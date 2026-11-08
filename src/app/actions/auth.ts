"use server";

import { redirect } from "next/navigation";
import { allow, clientKey } from "@/lib/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { firstError, joinSchema, loginSchema } from "@/lib/validation/schemas";

export type FormState = { error?: string };

const INVALID_CODE = "That code didn't work. Check it, or ask whoever gave it to you.";
const TOO_MANY = "Too many tries. Please wait ten minutes and try again.";

// Accounts are created ONLY here, on the server, after the invite code checks out.
// Public sign-up is turned off in Supabase, so the publishable key alone can't make accounts.
export async function joinAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse({
    code: formData.get("code"),
    nickname: formData.get("nickname"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { code, nickname, email, password } = parsed.data;

  // Brute-force protection: per-visitor and global limits, counted BEFORE we check the code.
  const key = await clientKey();
  if (!(await allow(`join:${key}`, 5, 600)) || !(await allow("join:all", 200, 3600))) {
    return { error: TOO_MANY };
  }

  const admin = createAdminClient();

  const { data: redeemable } = await admin.rpc("invite_is_redeemable", { p_code: code });
  if (redeemable !== true) return { error: INVALID_CODE };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return { error: "We couldn't create that account. If you already have one, sign in instead." };
  }

  // Role, age band and partner are set here, from the code, by the database. Never from the client.
  const { data: redeemed } = await admin.rpc("redeem_invite", {
    p_user_id: created.user.id,
    p_code: code,
    p_nickname: nickname,
  });
  const result = redeemed as { ok?: boolean; error?: string } | null;
  if (!result?.ok) {
    await admin.auth.admin.deleteUser(created.user.id); // roll back, leave nothing behind
    return {
      error:
        result?.error === "invalid_nickname"
          ? "Please pick another nickname: 2 to 24 letters or numbers, no email or phone number."
          : INVALID_CODE,
    };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) redirect("/login");

  redirect("/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please enter your email and password." };

  const key = await clientKey();
  if (!(await allow(`login:${key}`, 10, 600))) return { error: TOO_MANY };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "That email and password didn't match." };

  redirect("/circle");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
