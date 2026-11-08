import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Server-only client using the SECRET key. It bypasses RLS, so it is used for exactly
// three things: creating/deleting auth users, calling service-role-only functions
// (redeem_invite, rl_hit, add_ai_flag), and signing storage URLs. The `server-only`
// import makes the build fail if this file is ever pulled into browser code.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY is not set");
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
