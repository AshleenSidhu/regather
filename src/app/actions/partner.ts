"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError, inviteSchema, reviewSchema } from "@/lib/validation/schemas";
import type { Database } from "@/lib/database.types";

export type CodeState = {
  error?: string;
  /** Shown to the partner exactly once. Only a hash is stored. */
  code?: string;
  link?: string;
  qrSvg?: string;
  expiresAt?: string;
};

const GENERIC = "Something went wrong. Please try again.";

export async function createInviteCodeAction(_prev: CodeState, formData: FormData): Promise<CodeState> {
  await requirePartner();
  const parsed = inviteSchema.safeParse({
    role: formData.get("role"),
    ageBand: formData.get("ageBand"),
    maxUses: formData.get("maxUses"),
    ttlDays: formData.get("ttlDays"),
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invite_code", {
    p_role: v.role,
    p_age_band: v.ageBand,
    p_max_uses: v.maxUses,
    p_ttl_days: v.ttlDays,
    p_label: v.label ?? "",
  } as Database["public"]["Functions"]["create_invite_code"]["Args"]);

  const r = data as { ok?: boolean; error?: string; code?: string; expires_at?: string } | null;
  if (error || !r?.ok || !r.code) {
    return {
      error:
        r?.error === "invalid"
          ? "That role and age band don't go together. A youth code needs 13-17, a young adult 18-24."
          : r?.error === "rate_limited"
            ? "You've made a lot of codes in a short time. Please wait a bit."
            : GENERIC,
    };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const link = `${proto}://${host}/join?code=${encodeURIComponent(r.code)}`;
  const qrSvg = await QRCode.toString(link, { type: "svg", margin: 1, width: 220, color: { dark: "#2f4569", light: "#ffffff" } });

  revalidatePath("/dashboard/codes");
  return { code: r.code, link, qrSvg, expiresAt: r.expires_at };
}

export async function revokeInviteCodeAction(id: string): Promise<{ ok: boolean }> {
  await requirePartner();
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_invite_code", { p_id: id });
  revalidatePath("/dashboard/codes");
  return { ok: !error };
}

export async function reviewFlagAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  await requirePartner();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_flag", {
    p_id: parsed.data.id,
    p_status: parsed.data.status,
    p_note: parsed.data.note ?? "",
  });
  revalidatePath("/dashboard/flags");
  return error ? { ok: false, error: GENERIC } : { ok: true };
}
