"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { classifyCrisis } from "@/lib/safety/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { firstError, noteSchema, uuid } from "@/lib/validation/schemas";

export type SocialResult = {
  ok: boolean;
  error?: string;
  threadId?: string;
  crisis?: boolean;
  status?: string;
};

const GENERIC = "Something went wrong. Please try again.";
const RATE = "Slow down a little. Please try again in a bit.";

type Json = { ok?: boolean; error?: string; status?: string; thread_id?: string; crisis?: boolean } | null;

function toResult(data: unknown, error: unknown): SocialResult {
  const r = data as Json;
  if (error) return { ok: false, error: GENERIC };
  if (!r?.ok) return { ok: false, error: r?.error === "rate_limited" ? RATE : GENERIC };
  return { ok: true, status: r.status, threadId: r.thread_id, crisis: r.crisis };
}

export async function requestConnectionAction(otherId: string): Promise<SocialResult> {
  await requireMember();
  if (!uuid.safeParse(otherId).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_connection", { p_other: otherId });
  revalidatePath("/chats");
  return toResult(data, error);
}

export async function respondConnectionAction(id: string, accept: boolean): Promise<SocialResult> {
  await requireMember();
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_connection", { p_id: id, p_accept: accept });
  revalidatePath("/chats");
  return toResult(data, error);
}

export async function requestMentorAction(): Promise<SocialResult> {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_mentor");
  const r = data as Json;
  if (!error && r && !r.ok && r.error === "no_mentor") {
    return { ok: false, error: "This circle doesn't have a mentor yet." };
  }
  revalidatePath("/chats");
  return toResult(data, error);
}

export async function respondMentorAction(id: string, accept: boolean): Promise<SocialResult> {
  await requireMember();
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_mentor_request", { p_id: id, p_accept: accept });
  revalidatePath("/chats");
  return toResult(data, error);
}

export async function sendNoteAction(input: unknown): Promise<SocialResult> {
  await requireMember();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_note", {
    p_recipient: v.recipient,
    p_sticker: v.sticker,
    p_color: v.color,
    p_body: v.body,
  });
  const result = toResult(data, error);

  // Optional second opinion on the text only (no ids).
  if (result.ok && !result.crisis) {
    const noteId = (data as { id?: string } | null)?.id;
    const risk = await classifyCrisis(v.body);
    if (risk && noteId) {
      result.crisis = true;
      await createAdminClient().rpc("add_ai_note_flag", { p_note_id: noteId, p_severity: risk });
    }
  }

  revalidatePath("/notes");
  return result;
}

export async function saveNoteAction(id: string, saved: boolean): Promise<SocialResult> {
  await requireMember();
  if (!uuid.safeParse(id).success) return { ok: false, error: GENERIC };
  const supabase = await createClient();
  // RLS + column grant: only the recipient can change saved_to_jar, and nothing else.
  const { error } = await supabase.from("comfort_notes").update({ saved_to_jar: saved }).eq("id", id);
  revalidatePath("/notes");
  return error ? { ok: false, error: GENERIC } : { ok: true };
}
