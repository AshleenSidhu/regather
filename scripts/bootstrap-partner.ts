/**
 * Creates ONE real partner organisation and ONE moderator login. No fake data.
 *
 *   BOOT_EMAIL=you@example.com BOOT_PASSWORD='at-least-10-chars' \
 *   BOOT_PARTNER_NAME='My Org' BOOT_PARTNER_KIND=nonprofit \
 *   npm run bootstrap
 *
 * BOOT_PARTNER_KIND is one of: er, clinic, nonprofit, campus (default nonprofit).
 * Reads .env.local (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY).
 * Safe to re-run: reuses the user and partner if they already exist.
 */
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* env vars may already be set */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.BOOT_EMAIL;
const password = process.env.BOOT_PASSWORD;
const partnerName = process.env.BOOT_PARTNER_NAME;
const kind = process.env.BOOT_PARTNER_KIND ?? "nonprofit";

if (!url || !secret) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
if (!email || !password || !partnerName) throw new Error("Set BOOT_EMAIL, BOOT_PASSWORD and BOOT_PARTNER_NAME");
if (password.length < 10) throw new Error("BOOT_PASSWORD must be at least 10 characters");
if (!["er", "clinic", "nonprofit", "campus"].includes(kind)) throw new Error("BOOT_PARTNER_KIND must be er, clinic, nonprofit or campus");

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  // partner (reuse if same name exists)
  const found = await admin.from("partners").select("id").eq("name", partnerName!).maybeSingle();
  if (found.error) throw new Error(`partners lookup: ${found.error.message}`);
  let partnerId = found.data?.id as string | undefined;
  if (!partnerId) {
    const ins = await admin.from("partners").insert({ name: partnerName!, kind }).select("id").single();
    if (ins.error) throw new Error(`partners insert: ${ins.error.message}`);
    partnerId = ins.data.id;
  }

  // user (reuse if exists)
  let userId: string | undefined;
  const created = await admin.auth.admin.createUser({ email: email!, password: password!, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const list = await admin.auth.admin.listUsers({ perPage: 1000 });
    userId = list.data?.users.find((u) => u.email === email)?.id;
    if (!userId) throw new Error(`Could not create or find ${email}: ${created.error?.message}`);
    console.log("User already existed; password was NOT changed.");
  }

  const staff = await admin.from("partner_staff").upsert({ user_id: userId, partner_id: partnerId, is_moderator: true });
  if (staff.error) throw new Error(`partner_staff: ${staff.error.message}`);

  console.log(`Done. Partner "${partnerName}" (${kind}) with moderator ${email}.`);
  console.log("Sign in at /login, then open the dashboard and use Invite codes.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
