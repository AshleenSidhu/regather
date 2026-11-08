"use server";

import { getUser, requireViewer } from "@/lib/auth";
import { classifyCrisis } from "@/lib/safety/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { messageSchema } from "@/lib/validation/schemas";
import type { Database } from "@/lib/database.types";

type SendArgs = Database["public"]["Functions"]["send_message"]["Args"];

export type SendResult = {
  ok: boolean;
  id?: string;
  /** True when the sender should see the crisis card (keyword or AI). The message is kept either way. */
  crisis?: boolean;
  redacted?: boolean;
  error?: "rate_limited" | "invalid" | "failed";
};

export async function sendMessageAction(input: unknown): Promise<SendResult> {
  await requireViewer();
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_message", {
    p_circle_id: v.circleId,
    p_thread_id: v.threadId,
    p_body: v.body,
    p_kind: v.kind,
    p_score: v.score,
  } as unknown as SendArgs);

  const result = data as {
    ok?: boolean;
    id?: string;
    crisis?: boolean;
    redacted?: boolean;
    error?: string;
  } | null;

  if (error || !result) return { ok: false, error: "failed" };
  if (!result.ok) {
    return { ok: false, error: result.error === "rate_limited" ? "rate_limited" : "invalid" };
  }

  let crisis = result.crisis === true;

  // Optional second opinion. Sends ONLY the message text (no ids, no profile data).
  if (!crisis && v.kind === "text" && result.id) {
    const risk = await classifyCrisis(v.body);
    if (risk) {
      crisis = true;
      await createAdminClient().rpc("add_ai_flag", { p_message_id: result.id, p_severity: risk });
    }
  }

  return { ok: true, id: result.id, crisis, redacted: result.redacted === true };
}

// The session cookie is httpOnly, so the browser can't read it. For Realtime it asks the
// server for the short-lived access token (about an hour) and passes it to the Realtime
// connection only. The refresh token never leaves the cookie.
export async function getRealtimeTokenAction(): Promise<{ token: string | null }> {
  const user = await getUser(); // verifies and refreshes the session
  if (!user) return { token: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return { token: data.session?.access_token ?? null };
}

// "I need help" button: lets partner moderators know someone asked for help. No message text.
export async function triggerSosAction(): Promise<{ ok: boolean }> {
  await requireViewer();
  const supabase = await createClient();
  const { error } = await supabase.rpc("trigger_sos");
  return { ok: !error };
}
