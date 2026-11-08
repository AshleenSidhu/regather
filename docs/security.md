# Security notes

## The rules the database enforces

Everything below is enforced in Postgres (row-level security, column grants, and
`SECURITY DEFINER` functions with a fixed `search_path`), so it holds even if someone skips the website
and talks to the API directly. `npm run db:test` (200+ checks) and `scripts/attack-smoke.mjs` prove it.

| Rule | How |
|---|---|
| Deny by default | RLS is on for every table; no table is granted to `anon`; every table has a policy |
| Role, age band, partner, trust level can't be changed by a user | Set only by `redeem_invite()` (service role) from the invite code. Users have a column grant on `nickname` and `sticker` only |
| Youth and adults never message or read each other | `audience` is set from the code. Matching, connections and notes all require the same audience; messages and notes have **no** direct write grant, only the checked functions |
| Members read only their circle | `can_access_circle()` (member or assigned mentor) in the RLS policy |
| Private chats need both sides to agree, same role and audience | `request_connection()` / `respond_connection()` create the thread only on acceptance |
| Partners see only their own codes, circles and flags | Every partner policy and function derives the partner from `partner_staff`, never from an argument |
| Partners never see chats unless flagged | They get activity **counts** only. Flag snapshots are the only text they see. Mentor threads are readable only through `moderator_read_thread()`, which writes to the audit log |
| Crisis flags unreadable by regular users | `flags` policy: moderators of that partner only |
| Client never picks its circle | `join_best_circle()` takes no arguments |
| Views respect RLS | Both views are `security_invoker` |
| Realtime | `postgres_changes` only on `messages` and `flags` (RLS-protected). Presence/broadcast use **private** channels, authorized by `topic_allowed()` |

## Invite codes

80 bits of randomness (`RGTH-XXXX-XXXX-XXXX-XXXX`), shown once, stored only as a SHA-256 hash, limited
uses (1 to 10), expire within 30 days, revocable. Redemption is rate-limited per visitor (5 per 10
minutes) and globally, counted before the code is checked, with identical error messages.

## Privacy

- Collected: nickname, role and age range (from the code), optional city from a list, onboarding tags,
  messages and notes. No real names, birthdays or exact locations.
- Phone numbers, emails, links and addresses are stripped from messages and notes server-side until a
  user reaches trust level 2.
- The session cookie is `httpOnly`. The browser gets only a short-lived access token for Realtime.
- Logs never contain message text (the Gemini helper never logs its input).
- Delete account removes the profile, memberships, messages, notes and connections (all cascade).
  **Decision to confirm with partners:** crisis-flag snapshots are kept, unlinked from the account,
  so a safety concern isn't erased. `/privacy` says so.
- Data export: Me → Download my data.

## Known limits (honest list)

- Realtime "Allow public access" must be switched **off** in the hosted dashboard (can't be set from code).
- The CSP allows `'unsafe-inline'` scripts because Next.js injects inline bootstrap scripts. Moving to
  nonces is a good next step.
- Trust level is fixed at 0 (mentors 3). There is no promotion flow yet, so contact-detail stripping
  applies to everyone but mentors.
- The keyword list is a starting point to review with clinical partners. It will miss paraphrases;
  the optional Gemini check adds coverage but is not a substitute for human moderation.
- Doodles: the private bucket and policies exist, but there is no drawing UI yet.
- A moderator reading a flagged snapshot is not audited (only status changes and mentor-thread reads are).
