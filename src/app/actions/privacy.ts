"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteSchema, firstError, profileSchema } from "@/lib/validation/schemas";
import type { FormState } from "./auth";

export async function updateProfileAction(_prev: FormState & { saved?: boolean }, formData: FormData) {
  const viewer = await requireViewer();
  if (viewer.kind !== "member") return { error: "Not available." };
  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
    sticker: formData.get("sticker"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  // Only nickname and sticker are writable (column grant + RLS). Role and age band never are.
  const { error } = await supabase
    .from("profiles")
    .update({ nickname: parsed.data.nickname, sticker: parsed.data.sticker })
    .eq("id", viewer.userId);
  if (error) return { error: "That nickname isn't allowed. Try another." };
  revalidatePath("/", "layout");
  return { saved: true };
}

// Deletes the account and everything tied to it: profile, memberships, messages, notes,
// connections (all cascade from auth.users). Crisis-flag snapshots are kept, unlinked
// from the account, for safety review; /privacy says so.
export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  if (viewer.kind !== "member") return { error: "Partner accounts are managed by Regather." };

  const parsed = deleteSchema.safeParse({ confirm: formData.get("confirm") });
  if (!parsed.success || parsed.data.confirm.toLowerCase() !== viewer.nickname.toLowerCase()) {
    return { error: "Type your nickname exactly to confirm." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(viewer.userId);
  if (error) return { error: "We couldn't delete the account. Please try again." };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?goodbye=1");
}
