/**
 * Demo seed: FAKE people only. 2 partners, 4 circles, mentors, members, messages,
 * and one moderator login per partner. Safe to re-run.
 *
 *   npm run seed            (reads .env.local; needs SUPABASE_SECRET_KEY)
 *
 * Every account uses a made-up @example.test address and the shared demo password
 * below. NEVER run this against a database holding real people's data.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* env vars may already be set */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishable || !secret) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY");
}

const PASSWORD = "demo-password-123";
const admin = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const PARTNER_A = "10000000-0000-4000-8000-00000000000a";
const PARTNER_B = "10000000-0000-4000-8000-00000000000b";
const WILLOW = "c0000000-0000-4000-8000-000000000001";
const LILY = "c0000000-0000-4000-8000-000000000002";
const REED = "c0000000-0000-4000-8000-000000000003";
const FERN = "c0000000-0000-4000-8000-000000000004";

type Role = Database["public"]["Enums"]["app_role"];
type Band = Database["public"]["Enums"]["age_band"];
type Tag = Database["public"]["Enums"]["situation_tag"];
type Stage = Database["public"]["Enums"]["stage"];
type Time = Database["public"]["Enums"]["time_of_day"];

type Person = {
  email: string;
  nickname: string;
  role: Role;
  band: Band;
  partner: string;
  circle?: string;
  tags?: Tag[];
  stage?: Stage;
  times?: Time[];
  sticker?: "shell" | "lily" | "axolotl";
};

const people: Person[] = [
  // mentors
  { email: "dana@example.test", nickname: "Dana", role: "mentor", band: "25_plus", partner: PARTNER_A, sticker: "lily" },
  { email: "jules@example.test", nickname: "Jules", role: "mentor", band: "18_24", partner: PARTNER_A, sticker: "axolotl" },
  { email: "mina@example.test", nickname: "Mina", role: "mentor", band: "25_plus", partner: PARTNER_B, sticker: "shell" },
  // Willow: parents, partner A
  { email: "sam@example.test", nickname: "Sam", role: "parent", band: "25_plus", partner: PARTNER_A, circle: WILLOW, tags: ["anxiety", "er_discharge"], stage: "just_after_crisis", times: ["night"], sticker: "axolotl" },
  { email: "robin@example.test", nickname: "Robin", role: "parent", band: "25_plus", partner: PARTNER_A, circle: WILLOW, tags: ["anxiety", "school_stress"], stage: "newly_diagnosed", times: ["night", "evening"], sticker: "lily" },
  { email: "avery@example.test", nickname: "Avery", role: "parent", band: "25_plus", partner: PARTNER_A, circle: WILLOW, tags: ["er_discharge", "family_conflict"], stage: "just_after_crisis", times: ["night"], sticker: "shell" },
  { email: "morgan@example.test", nickname: "Morgan", role: "parent", band: "25_plus", partner: PARTNER_A, circle: WILLOW, tags: ["anxiety"], stage: "just_after_crisis", times: ["evening"], sticker: "axolotl" },
  // Lily: youth, partner A
  { email: "pip@example.test", nickname: "Pip", role: "youth", band: "13_15", partner: PARTNER_A, circle: LILY, tags: ["anxiety", "school_stress"], stage: "newly_diagnosed", times: ["night"], sticker: "axolotl" },
  { email: "wren@example.test", nickname: "Wren", role: "youth", band: "13_15", partner: PARTNER_A, circle: LILY, tags: ["anxiety", "bullying"], stage: "newly_diagnosed", times: ["evening", "night"], sticker: "lily" },
  { email: "juniper@example.test", nickname: "Juniper", role: "youth", band: "16_17", partner: PARTNER_A, circle: LILY, tags: ["depression"], stage: "long_term", times: ["night"], sticker: "shell" },
  { email: "kit@example.test", nickname: "Kit", role: "youth", band: "13_15", partner: PARTNER_A, circle: LILY, tags: ["school_stress"], stage: "newly_diagnosed", times: ["afternoon"], sticker: "axolotl" },
  // Reed: parents, partner A, different situation
  { email: "taylor@example.test", nickname: "Taylor", role: "parent", band: "25_plus", partner: PARTNER_A, circle: REED, tags: ["depression", "grief"], stage: "long_term", times: ["evening"], sticker: "lily" },
  { email: "quinn@example.test", nickname: "Quinn", role: "parent", band: "25_plus", partner: PARTNER_A, circle: REED, tags: ["depression"], stage: "long_term", times: ["evening", "morning"], sticker: "shell" },
  // Fern: parents, partner B
  { email: "casey@example.test", nickname: "Casey", role: "parent", band: "25_plus", partner: PARTNER_B, circle: FERN, tags: ["eating_concerns"], stage: "newly_diagnosed", times: ["morning"], sticker: "lily" },
  { email: "jordan@example.test", nickname: "Jordan", role: "parent", band: "25_plus", partner: PARTNER_B, circle: FERN, tags: ["eating_concerns", "family_conflict"], stage: "newly_diagnosed", times: ["morning", "evening"], sticker: "axolotl" },
];

async function ensureUser(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (data.user) return data.user.id;
  if (!error) throw new Error(`No user returned for ${email}`);
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email === email);
  if (!existing) throw new Error(`Could not create or find ${email}: ${error.message}`);
  return existing.id;
}

function must<T>(res: { error: { message: string } | null; data?: T }, what: string) {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
}

async function main() {
  console.log("Seeding fake demo data…");

  must(await admin.from("partners").upsert([
    { id: PARTNER_A, name: "Calgary ER Peer Program (demo)", kind: "er" },
    { id: PARTNER_B, name: "Community Youth Clinic (demo)", kind: "clinic" },
  ]), "partners");

  // staff (moderators)
  const staff = [
    { email: "staff.a@example.test", partner: PARTNER_A },
    { email: "staff.b@example.test", partner: PARTNER_B },
  ];
  for (const s of staff) {
    const id = await ensureUser(s.email);
    must(await admin.from("partner_staff").upsert({ user_id: id, partner_id: s.partner, is_moderator: true }), "partner_staff");
  }

  // members + mentors
  const ids = new Map<string, string>();
  for (const p of people) {
    const id = await ensureUser(p.email);
    ids.set(p.email, id);
    must(await admin.from("profiles").upsert({
      id, nickname: p.nickname, role: p.role,
      audience: p.role === "youth" ? "minor" : "adult",
      sticker: p.sticker ?? "axolotl",
    }), `profile ${p.nickname}`);
    must(await admin.from("profile_details").upsert({
      user_id: id, partner_id: p.partner, age_band: p.band,
      trust_level: p.role === "mentor" ? 3 : 0,
      situation_tags: p.tags ?? [], stage: p.stage ?? null, times_of_day: p.times ?? [],
      city: "calgary", language: "en",
      norms_accepted_at: new Date().toISOString(), onboarded_at: new Date().toISOString(),
    }), `details ${p.nickname}`);
  }
  const idOf = (email: string) => ids.get(email)!;

  const circles: Database["public"]["Tables"]["circles"]["Insert"][] = [
    { id: WILLOW, partner_id: PARTNER_A, kind: "parent", audience: "adult", name: "Willow", tags: ["anxiety", "er_discharge"], stage: "just_after_crisis", age_band: "25_plus", times: ["night"], mentor_id: idOf("dana@example.test") },
    { id: LILY, partner_id: PARTNER_A, kind: "youth", audience: "minor", name: "Lily", tags: ["anxiety", "school_stress"], stage: "newly_diagnosed", age_band: "13_15", times: ["night"], mentor_id: idOf("jules@example.test") },
    { id: REED, partner_id: PARTNER_A, kind: "parent", audience: "adult", name: "Reed", tags: ["depression", "grief"], stage: "long_term", age_band: "25_plus", times: ["evening"], mentor_id: idOf("dana@example.test") },
    { id: FERN, partner_id: PARTNER_B, kind: "parent", audience: "adult", name: "Fern", tags: ["eating_concerns"], stage: "newly_diagnosed", age_band: "25_plus", times: ["morning"], mentor_id: idOf("mina@example.test") },
  ];
  must(await admin.from("circles").upsert(circles), "circles");

  must(await admin.from("circle_members").upsert(
    people.filter((p) => p.circle).map((p) => ({ circle_id: p.circle!, user_id: idOf(p.email) })),
  ), "circle_members");

  // gentle fake conversations, only if the circles are empty
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  const script: Record<string, [string, number, string, number | null][]> = {
    [WILLOW]: [
      ["dana@example.test", 30, "Welcome, everyone. This is a space to share what's real, at any hour. No advice required, just company.", null],
      ["robin@example.test", 26, "Hi. Third night in a row I'm up listening for her door. Anyone else?", null],
      ["avery@example.test", 25, "Yes. Same here. It does get a little quieter.", null],
      ["sam@example.test", 8, "We came home from the ER yesterday. I don't really know what I'm doing.", null],
      ["robin@example.test", 7, "You're doing it right now. You showed up. That counts.", null],
      ["morgan@example.test", 6, "I'm awake too. Sending you a hug.", null],
      ["sam@example.test", 2, "", 3],
      ["avery@example.test", 1, "", 4],
    ],
    [LILY]: [
      ["jules@example.test", 28, "Hey Lily circle. I'm Jules. I've been where some of you are. Say hi whenever you want.", null],
      ["pip@example.test", 20, "hey. school's been a lot this week", null],
      ["wren@example.test", 19, "same. group projects are the worst when your brain is loud", null],
      ["kit@example.test", 12, "i'm here too. just reading mostly", null],
      ["jules@example.test", 11, "Reading counts. Glad you're here, Kit.", null],
      ["pip@example.test", 3, "", 2],
    ],
    [REED]: [
      ["taylor@example.test", 40, "Long road for us. Seven months in. Some days are lighter than others.", null],
      ["quinn@example.test", 36, "Same. The lighter days feel worth holding onto.", null],
    ],
    [FERN]: [
      ["mina@example.test", 22, "Welcome to Fern. Mealtimes are hard for so many families. You're not alone in this.", null],
      ["casey@example.test", 14, "Thank you. Breakfast was a win today, a small one.", null],
      ["jordan@example.test", 13, "Small wins are the whole game. Congratulations!", null],
    ],
  };
  for (const [circleId, lines] of Object.entries(script)) {
    const { count } = await admin.from("messages").select("id", { count: "exact", head: true }).eq("circle_id", circleId);
    if ((count ?? 0) > 0) continue;
    must(await admin.from("messages").insert(
      lines.map(([email, h, body, score]) => ({
        circle_id: circleId, sender_id: idOf(email),
        kind: score ? ("checkin" as const) : ("text" as const),
        body: score ? String(score) : body,
        checkin_score: score, created_at: hoursAgo(h),
      })),
    ), `messages ${circleId}`);
  }

  // invite codes (made as the staff users, through the real function)
  console.log("\nFake logins (password for all: " + PASSWORD + ")");
  console.log("  Moderator, partner A: staff.a@example.test   Moderator, partner B: staff.b@example.test");
  console.log("  Parent: sam@example.test   Youth: pip@example.test   Mentor: dana@example.test (parent circles), jules@example.test (youth)");

  console.log("\nFresh invite codes (shown once):");
  for (const [label, email, role, band] of [
    ["Partner A, parent", "staff.a@example.test", "parent", "25_plus"],
    ["Partner A, youth", "staff.a@example.test", "youth", "13_15"],
    ["Partner B, parent", "staff.b@example.test", "parent", "25_plus"],
  ] as const) {
    const client = createClient<Database>(url!, publishable!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (signInError) throw new Error(`staff sign-in failed: ${signInError.message}`);
    const { data, error } = await client.rpc("create_invite_code", {
      p_role: role, p_age_band: band, p_max_uses: 5, p_ttl_days: 14, p_label: "demo",
    });
    const r = data as { ok?: boolean; code?: string } | null;
    if (error || !r?.ok) throw new Error(`code failed: ${error?.message ?? "not ok"}`);
    console.log(`  ${label}: ${r.code}`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
