/**
 * Attacker's-eye smoke test: talks to the Supabase API directly (no website), first with
 * only the publishable key (as if it leaked), then as ordinary signed-in users.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... node scripts/attack-smoke.mjs
 *
 * Needs the seed data (Sam = parent, Pip = youth). Every line should print "blocked".
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL_ || !KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const PASSWORD = "demo-password-123";

let bad = 0;
function report(name, blocked, detail = "") {
  if (!blocked) bad++;
  console.log(`  ${blocked ? "blocked" : "!! OPEN "}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function call(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: {
      apikey: KEY,
      authorization: `Bearer ${token ?? KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function signIn(email) {
  const { json } = await call("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password: PASSWORD } });
  if (!json.access_token) throw new Error(`could not sign in ${email}`);
  return { token: json.access_token, id: json.user.id };
}

const empty = (r) => r.status === 200 && Array.isArray(r.json) && r.json.length === 0;
const denied = (r) => r.status >= 400 || (r.json && r.json.code === "42501");

console.log("\nWith ONLY the publishable key (leaked key scenario)");
let r = await call("/auth/v1/signup", { method: "POST", body: { email: `attacker${Date.now()}@example.test`, password: "attackerpassword123" } });
report("create an account directly (skips the invite code)", denied(r), `${r.status} ${r.json.error_code ?? r.json.msg ?? ""}`);
for (const t of ["profiles", "profile_details", "messages", "circles", "circle_members", "flags", "invite_codes", "comfort_notes", "threads", "audit_log", "partners"]) {
  r = await call(`/rest/v1/${t}?select=*`);
  report(`read ${t}`, denied(r) || empty(r), `${r.status}`);
}
for (const [fn, body] of [
  ["send_message", { p_circle_id: "c0000000-0000-4000-8000-000000000001", p_thread_id: null, p_body: "hi" }],
  ["redeem_invite", { p_user_id: "00000000-0000-0000-0000-000000000000", p_code: "x", p_nickname: "Nope" }],
  ["rl_hit", { p_bucket: "x", p_max: 1, p_window_seconds: 1 }],
  ["create_invite_code", { p_role: "parent", p_age_band: "25_plus", p_max_uses: 1, p_ttl_days: 1, p_label: "x" }],
  ["join_best_circle", {}],
  ["add_ai_flag", { p_message_id: "00000000-0000-0000-0000-000000000000", p_severity: "high" }],
]) {
  r = await call(`/rest/v1/rpc/${fn}`, { method: "POST", body });
  report(`call ${fn}()`, denied(r), `${r.status}`);
}
r = await call("/storage/v1/object/public/doodles/anything.png");
report("read a doodle from the (private) bucket", r.status >= 400, `${r.status}`);

console.log("\nAs an ordinary signed-in parent (Sam)");
const sam = await signIn("sam@example.test");
const pip = await signIn("pip@example.test");
for (const col of ["role", "audience"]) {
  r = await call(`/rest/v1/profiles?id=eq.${sam.id}`, { method: "PATCH", token: sam.token, body: { [col]: col === "role" ? "mentor" : "minor" } });
  report(`change own ${col}`, denied(r), `${r.status}`);
}
for (const body of [{ trust_level: 3 }, { age_band: "13_15" }, { partner_id: "10000000-0000-4000-8000-00000000000b" }]) {
  r = await call(`/rest/v1/profile_details?user_id=eq.${sam.id}`, { method: "PATCH", token: sam.token, body });
  report(`change own ${Object.keys(body)[0]}`, denied(r), `${r.status}`);
}
r = await call("/rest/v1/messages", { method: "POST", token: sam.token, body: { circle_id: "c0000000-0000-4000-8000-000000000002", sender_id: sam.id, body: "hi teens" } });
report("insert a message directly (bypassing send_message)", denied(r), `${r.status}`);
r = await call("/rest/v1/circle_members", { method: "POST", token: sam.token, body: { circle_id: "c0000000-0000-4000-8000-000000000002", user_id: sam.id } });
report("add self to the youth circle", denied(r), `${r.status}`);
r = await call("/rest/v1/rpc/send_message", { method: "POST", token: sam.token, body: { p_circle_id: "c0000000-0000-4000-8000-000000000002", p_thread_id: null, p_body: "hello?" } });
report("parent posts into the youth circle", denied(r), `${r.status} ${r.json.message ?? ""}`);
r = await call(`/rest/v1/messages?circle_id=eq.c0000000-0000-4000-8000-000000000002`, { token: sam.token });
report("parent reads youth circle messages", empty(r), `${r.status}`);
r = await call(`/rest/v1/profiles?id=eq.${pip.id}`, { token: sam.token });
report("parent reads a youth profile", empty(r), `${r.status}`);
r = await call("/rest/v1/rpc/request_connection", { method: "POST", token: sam.token, body: { p_other: pip.id } });
report("parent asks a minor to chat", denied(r), `${r.status} ${r.json.message ?? ""}`);
r = await call("/rest/v1/rpc/send_note", { method: "POST", token: sam.token, body: { p_recipient: pip.id, p_sticker: "shell", p_color: "blush", p_body: "hi" } });
report("parent sends a note to a minor", denied(r), `${r.status} ${r.json.message ?? ""}`);
for (const t of ["flags", "audit_log", "invite_codes", "partners", "partner_staff"]) {
  r = await call(`/rest/v1/${t}?select=*`, { token: sam.token });
  report(`parent reads ${t}`, denied(r) || empty(r), `${r.status}`);
}
r = await call("/rest/v1/invite_codes?select=code_hash", { token: sam.token });
report("read invite code hashes", denied(r) || empty(r), `${r.status}`);
r = await call("/rest/v1/rpc/create_invite_code", { method: "POST", token: sam.token, body: { p_role: "youth", p_age_band: "13_15", p_max_uses: 1, p_ttl_days: 1, p_label: "x" } });
report("parent makes an invite code", denied(r), `${r.status}`);

console.log("\nAs a youth (Pip) trying to reach adults");
r = await call(`/rest/v1/messages?circle_id=eq.c0000000-0000-4000-8000-000000000001`, { token: pip.token });
report("youth reads the parent circle", empty(r), `${r.status}`);
r = await call(`/rest/v1/profiles?id=eq.${sam.id}`, { token: pip.token });
report("youth reads a parent profile", empty(r), `${r.status}`);
r = await call("/rest/v1/rpc/send_note", { method: "POST", token: pip.token, body: { p_recipient: sam.id, p_sticker: "shell", p_color: "blush", p_body: "hi" } });
report("youth sends a note to a parent", denied(r), `${r.status}`);

console.log(bad === 0 ? "\nAll attacks blocked." : `\n${bad} attack(s) got through!`);
process.exit(bad === 0 ? 0 : 1);
