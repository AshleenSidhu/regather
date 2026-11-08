# Regather

Peer-support circles for youth and families, built with Next.js 16 and Supabase.
Partners (an ER peer program, a clinic) give families an invite code. Each family is matched
into a small circle with a trained mentor, and can chat any hour, with a crisis safety net.

> This app holds sensitive information about minors. Security lives in the **database** (row-level
> security + checked functions), not just the UI. Read [`docs/security.md`](docs/security.md).

## What's in here

| Folder | What |
|---|---|
| `src/app` | Pages. `(public)` landing/join/login/privacy, `(app)` members, `(partner)` dashboard, `actions/` server actions |
| `src/components` | Sky, axolotl, chat, notes, crisis card, UI kit |
| `src/lib` | Supabase clients, auth checks, validation (zod), rate limiting, optional Gemini check |
| `supabase/migrations` | The whole database: tables, security rules, functions |
| `supabase/tests/database` | Security tests that sign in as different people and confirm access is blocked |
| `scripts` | `seed.ts` (fake demo data), `e2e.mjs` (browser walkthrough), `attack-smoke.mjs` (API attack checks) |
| `docs` | Feature plan and security notes |

## Run it locally

You need **Node 20.19 or newer** (Node 22 recommended) and **Docker Desktop**.

```bash
npm install
npx supabase start          # local database + auth + realtime (first run downloads images)
npx supabase status         # shows the local URL and keys
```

Create a `.env.local` file in the project root (never commit it) with these variables. For a local database use the
values from `supabase status` (`API_URL`, `PUBLISHABLE_KEY`, `SECRET_KEY`); for the hosted project, ask a teammate for the keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=              # project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # public key (safe for the browser)
SUPABASE_SECRET_KEY=                   # SERVER ONLY, never prefix with NEXT_PUBLIC_
GEMINI_API_KEY=                        # optional; leave blank to disable the Gemini crisis check
RATE_LIMIT_SALT=                       # any long random string
```

Then:

```bash
npm run seed                # fake people, 4 circles, staff logins, fresh invite codes
npm run dev                 # http://localhost:3000
```

Fake logins (password for every one: `demo-password-123`):

| Who | Email |
|---|---|
| Moderator, partner A | `staff.a@example.test` |
| Moderator, partner B | `staff.b@example.test` |
| Parent | `sam@example.test` |
| Youth | `pip@example.test` |
| Mentor (parent circles) | `dana@example.test` |
| Mentor (youth circle) | `jules@example.test` |

To try the real flow, sign in as `staff.a@example.test`, make an invite code under **Invite codes**,
then open `/join` in a private window and use it.

## Tests

```bash
npm run db:test                                  # 200+ security checks in the database
node scripts/e2e.mjs                             # full demo story in real browsers (app on :3000)
node scripts/attack-smoke.mjs                    # API attacks with only the publishable key
npm run lint && npm run typecheck && npm run build
```

## Put it on your Supabase project (the hosted one)

1. `npx supabase login`, then `npx supabase link --project-ref <your-ref>`
2. `npx supabase db push` applies every migration (it will ask for your database password).
3. `npx supabase config push` applies `supabase/config.toml` auth settings (public sign-up **off**,
   minimum password length 10).
4. In the Supabase dashboard: **Realtime → Settings → turn OFF "Allow public access"**, and under
   **Authentication → Providers → Email** confirm sign-ups are disabled.
5. In **Settings → API Keys** copy the **secret** key into `.env.local` as `SUPABASE_SECRET_KEY`
   (and into your host's environment variables). It must never start with `NEXT_PUBLIC_`.
6. Optional: `npm run seed` loads the fake demo data. Only do this on a demo project.
7. Run the dashboard's **Security Advisor** and **Performance Advisor** and look at anything flagged.

## Deploy (Vercel)

Set these environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `RATE_LIMIT_SALT`, and optionally `GEMINI_API_KEY`. Use Node 22.

## Disclosures (put these on Devpost)

- **AI:** if `GEMINI_API_KEY` is set, the text of a message or note (only the text, never names,
  ids or profile data) may be sent to Google's Gemini API as a second crisis check. The keyword
  check always runs in our own database. Use a billing-enabled key, since free-tier inputs may be
  used by Google to improve its products.
- **No trackers:** no analytics, ads or third-party scripts. Fonts are self-hosted.
