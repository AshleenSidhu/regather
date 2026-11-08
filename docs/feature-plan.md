# Feature plan

The core is small, consistent family circles with chat, built on one trust rule: **verified to us, pseudonymous to each other.** Partners vouch for every member, but peers only see a first name or nickname until they choose to share more.

## Core feature: circles and chat

A **circle** is 5–8 people in the same situation who stay together for an 8-week cohort, guided by one trained mentor family. It works like a recurring AA-style meeting that also lives in your pocket at 2 a.m.

**How a family moves through it:**

1. **Invited.** An ER peer worker, clinic or nonprofit gives the family an invite code or QR. The partner is vouching that this family is safe to connect.
2. **Sets up privately.** Each person picks a role (parent/caregiver, youth 13–17, young adult 18–24) and a nickname. They answer a few tags: what they're facing, child's age range, stage (just after a crisis, newly diagnosed, long-term), language, best times of day.
3. **Agrees to circle norms.** Share experience, not medical advice; what's said in the circle stays there; how to get help in a crisis.
4. **Gets matched.** Parents join parent circles; youth join youth circles with a trained young-adult mentor. Parents and teens never share a circle by default, so teens can speak freely.
5. **Talks any time.** The circle chat is open 24/7 with a daily check-in prompt ("How was today, 1–5?"). An "awake now" indicator shows who else is up late.
6. **Meets weekly.** One scheduled evening session per week, run by the mentor.
7. **Builds trust over time.** After a few weeks, members can mutually opt in to private chats (youth with youth, parent with parent), and later to a partner-approved in-person family meetup.
8. **Graduates.** At 8 weeks, each family chooses: continue with the same circle, join a new one, or move on and keep only the private connections they've made. Families who are doing well can train to become mentors themselves.

**Circle types:** parent circles, youth circles, sibling circles (later), and mentor-led "first 72 hours" circles for families just discharged from the ER.

## Hackathon MVP (must work by 11:30 a.m.)

Seven features, all demoable in one 3-minute story: a parent leaves the ER at night, joins with a code, finds their circle, and gets help when a message turns serious.

| Feature | What it does | How we build it |
| --- | --- | --- |
| Invite-code sign-up | Only people with a partner-issued code can join; code sets the partner and allowed roles | `invite_codes` table; check code on sign-up, then create the account with Supabase Auth |
| Role + tag onboarding | Picks role, nickname, situation tags, age range, stage, times of day | 3-screen form saving to `profiles` |
| Circle matching | Places the person in the best open circle of the same role | Score shared tags + stage + age band; join highest-scoring circle under 8 members, else create one |
| Circle chat | Real-time group chat with daily check-in prompt and "awake now" list | Supabase Realtime on `messages`; presence channel for who's online |
| Mentor request | Member asks the circle's mentor for a 1:1 chat | `mentor_requests` table; mentor accepts, opens a private thread a moderator can see |
| Crisis safety net | Always-visible SOS button; risky messages trigger a crisis card (9-8-8, Distress Centre Calgary, 911) and alert a moderator | Keyword list first; Gemini API classifier as a second check; write to `flags` |
| Partner/moderator dashboard | Create invite codes, see flagged messages, see circle activity | Admin pages behind a `role = partner` check |
| Private chats | Two members who both opt in can chat 1:1: youth with youth, parent with parent | Thread created only when both accept; same role and age band enforced by access rules; crisis check runs on every message |

Built-in safety rules for the demo: no DMs between minors and adults outside moderated mentor threads, and phone numbers or addresses are auto-hidden in chat until members reach a higher trust level.

## Look and feel

The style follows the Foundry pages you shared: soft blurred colour blobs, white pill buttons, rounded cards with a thin circle outline, a friendly rounded font, and lots of space. Onboarding opens with "I am a…" and three pills: **Youth**, **Parent / caregiver**, **Mentor**.

**Living sky background.** The background follows the real sky where the user lives, to bring the outside in for people who aren't opening their windows.

| Time | Colours and scene |
| --- | --- |
| Dawn | Peach and pink glow, soft mist |
| Day | Light blue and fresh green, slow-moving clouds |
| Golden hour | Warm amber and honey light |
| Dusk | Lavender and rose, first star appears |
| Night | Deep navy, stars, the real moon phase |

**Weather, always the calm version.** We show the weather, but never in a stressful way.

| Real weather | What the user sees |
| --- | --- |
| Rain | Slow drops sliding down a window |
| Thunderstorm | Same soft rain; no lightning, thunder or dark clouds |
| Snow | Big, slow snowflakes |
| Extreme cold | Frost on the window edges with warm lamp light inside |
| Wildfire smoke or haze | Soft, golden, hazy light |
| Hail or wind | Gentle rain or swaying grass |

**Nudges to look outside** (opt-in, at most once a day): "The sun sets at 4:52 today. Want a reminder to catch it?" or "It's snowing where you are. Maybe open the curtains for a minute?" Optional nature sounds (rain, birds, lake water) are off by default.

**How we build it:** time of day from the device clock; weather, sunrise and sunset from the free Open-Meteo API using city-level location only (no GPS stored). Scenes are layered SVG and CSS gradients. Everything turns still for users with reduced motion turned on.

## Axolotl mascot

The logo is a soft, round, pink axolotl. It stands for resilience: axolotls can regrow limbs, parts of their heart, brain and spine. The message to users is "you may feel like you've lost parts of yourself, and you can grow back."

- **Habitat:** axolotls actually live in freshwater lakes and canals (Lake Xochimilco in Mexico City), not the ocean. A calm lake or pond world fits better and matches the lily-pad, nature feel.
- **Swimming animation:** it drifts across the home screen, blows a few bubbles, and rests on a lily pad at night.
- **Breathe with it:** a breathing exercise where its gills slowly glow in and out (4 seconds in, 6 out).
- **Gentle reactions:** a small wave when you open the app, a happy wiggle when someone sends you a note, a little celebration when your circle finishes a week.
- **Regrowth as a journey, not a streak:** over the 8 weeks, plants slowly grow in its pond as you show up. Nothing wilts or dies if you miss days, so no one feels guilty for having a hard week.
- **Careful with the message:** never show the axolotl hurt or missing a limb, and never frame regrowth as "you'll heal anyway." For users who self-harm, that could read as permission. Keep it about healing, growing and not being alone.
- **Name ideas:** Lotl, Regrow, Xochi, Little Lake.

## Comfort notes

Small, beautiful things people can send each other when words are hard. Youth can send to youth they're connected with, and to their own family. Parents can send to their teen and to other parents.

| Note type | What it is | Why it helps |
| --- | --- | --- |
| Candy gram | A short note on a pastel card with a sticker (shell, lily, little axolotl) | Low effort, feels like a small gift |
| Letter | Longer message on aesthetic stationery, sealed in an envelope that opens with an animation | Feels personal and worth keeping |
| Doodle | A drawing made on a simple in-app sketch pad | For days when typing feels like too much |
| Song share | A Spotify, Apple Music or YouTube link shown as a card with a short note: "this one got me through" | Music is how many teens say what they feel |
| Thinking of you | One tap, no words, sends a small glowing bubble | Works on the lowest-energy days |
| Open when… | Letters that unlock when the reader chooses: "open when you can't sleep," "open when you feel alone" | Comfort that's waiting for the hard moment |

More details:

- **Comfort jar:** every note received is saved in a jar on the user's pond screen to reread on hard days.
- **Say it in a letter:** gentle prompts that help a teen tell a parent something hard ("Something I wish you knew…"), and the other way around.
- **Unsent letters:** write a letter just for yourself, never sent.
- **Delivery:** the axolotl swims the envelope over, with a soft chime.
- **Safety:** every note and doodle passes the same crisis check as chat; recipients control who can send them notes; anything can be reported.

## Family space

Each linked family gets a private shared space, separate from their circles, where parents and kids can share comfort notes and stay connected at home. **Circles stay private; the family space is only what each person chooses to bring in.**

| Feature | What it does |
| --- | --- |
| Share to family | A "share with my family" button on any note, doodle or song a person wrote or received in their circle. Nothing moves over automatically. |
| Family comfort jar | One shared jar of every note family members send each other, to reread together |
| Family check-in | Each person picks how their day feels as weather (sunny, cloudy, rainy, a little rainbow), so feelings can be shared without words |
| Family letters | Parent-to-child and child-to-parent letters, with "Something I wish you knew…" and "Something I'm proud of you for…" prompts |
| Doodle wall | A shared board where anyone in the family can pin drawings |
| Family playlist | Songs family members add for each other, with a note on why |
| Little moments together | Small shared ideas tied to the living sky: "Sunset is at 4:52, want to watch it together?" or "First snow tonight, hot chocolate?" |
| Family pond | The family's axolotls share one pond that grows plants as they keep connecting, with nothing that wilts on hard weeks |

**Privacy and safety rules:**

- Parents can never read their teen's circle or private chats, and teens can't read their parent's. Only what someone shares lands in the family space.
- Family linking needs both people to accept, or is set up by the partner organization.
- A teen can quietly pause the family space at any time. Not every home is safe, and partners can turn off family linking for a youth.
- Family space messages still pass the crisis check.
- Siblings can join later as their own role.

**For the hackathon:** a light version is doable: link a parent and teen in the seed data, add the "share with my family" button, and show the family jar. It's a strong demo moment because no competitor does it.

## Small details that matter

- **No red badges or urgent alerts.** Notifications use soft colours and calm wording: "Maya sent you something" instead of "1 new message!"
- **Quiet hours** the user sets, with a pause button for the circle that doesn't make you leave it.
- **Read receipts off by default**, so no one feels ignored or pressured to reply.
- **"What I need" tags** on a message: *just listening*, *advice welcome*, *celebrate with me*.
- **Low-energy replies:** one-tap responses like "I'm here," "Same," "Sending you a hug."
- **Voice notes** for people who'd rather talk than type.
- **Content warnings** members can add before sharing something heavy, shown blurred until tapped.
- **"You're not alone right now":** a soft line showing how many circle members are awake, without names.
- **5-4-3-2-1 grounding** that ties into the living sky: "Name one thing you can see outside."
- **Gentle words throughout:** no "failed," "missed" or streak counts.
- **Hide-the-app mode:** a neutral app icon and name for youth who share a phone or don't want the app noticed.
- **Crisis help is one tap from every screen,** styled calmly so it doesn't feel alarming.

## Next (right after the hackathon)

| Area | Feature | Why it matters |
| --- | --- | --- |
| Continuity | **First 72 hours pathway**: welcome on night one, mentor check-in next morning, circle intro by day three | Covers the riskiest window after ER discharge |
| Continuity | **What's open now** directory: crisis lines, walk-in clinics, urgent care, filtered by time and location | Answers "where can I go right now?" at 11 p.m. |
| Family | **Linked family accounts**: parent and teen connected, but each keeps a private space the other can't read | Families join together without teens losing privacy |
| Trust | **Trust levels**: read-only → circle → 1:1 → in-person meetup, unlocked by time and mutual opt-in | The "control over when you're known" idea from the research |
| Trust | Report, block, mute; moderator review queue with audit log | Basic safety expected by partners |
| Circles | Weekly live voice/video session inside the circle | The AA-style meeting rhythm |
| Mentors | Mentor onboarding and training checklist, plus monthly mentor check-ins | Verified mentors, and protection from burnout |
| Self | Private journal and mood tracker, with the option to share one entry to the circle | Connection to yourself, not just others |
| Accessibility | Plain language, screen-reader labels, text size, dark mode, low-data mode | Clio accessibility sidepot |
| Privacy | Clear data page, export and delete account, chats never used to train AI | Trust and transparency for partners and families |

## Later (the full product)

- **Sibling circles** for brothers and sisters of a youth in crisis, who are often overlooked.
- **Partner-approved in-person meetups** at safe public venues, like a family picnic or coffee night.
- **On-call mentor rota** so a trained mentor is always reachable overnight for a "talk now" request.
- **Warm referral back to care**: a member can tap "connect me to my clinic" and the partner gets a request.
- **Discharge handoff with the ER**: the hospital peer worker enrolls the family before they leave, with consent.
- **Mentor-to-mentor circles** so volunteers have their own support.
- **Multilingual circles** and auto-translation for newcomer families.
- **Shared resource library** curated by partners: guides, videos, local programs, written by families for families.
- **Wins wall** in each circle to celebrate milestones.
- **Impact reporting** for partners: anonymized engagement and a short loneliness check-in at join and at 8 weeks, to show outcomes to funders.
- **Campus edition** for the UXDC version: wellness centres issue codes to students after a crisis visit.

## How we build it

**Stack:** Next.js (React + TypeScript) on Vercel, with Supabase for the database, sign-in, real-time chat and access rules. One codebase, free tiers, and real-time chat works without writing our own server. Optional: the Gemini API for crisis detection, which also makes us eligible for the MLH Gemini category.

**Data model:**

| Table | Key fields |
| --- | --- |
| `partners` | name, type (ER, clinic, nonprofit, campus) |
| `invite_codes` | code, partner, allowed roles, uses left, expiry |
| `profiles` | user, nickname, role, age band, tags, stage, times of day, trust level, family id |
| `circles` | type (parent, youth), tags, mentor, member count, cohort start |
| `circle_members` | circle, user, joined date |
| `messages` | circle or thread, sender, text, created at |
| `mentor_requests` | requester, mentor, status |
| `flags` | message, reason (keyword or AI), severity, reviewed by |
| connections | two users, status (requested, accepted), for private chats |
| comfort\_notes | sender, recipient, type (candy gram, letter, doodle, song, open-when), content or image, unlock condition, saved to jar |
| families | members, linked by (partner or mutual accept), paused by, pond progress |
| family\_items | family, shared by, type (note, doodle, song, check-in, letter), source note if shared from a circle |

**Access rules (Row Level Security):** members read only their own circles; youth and adult profiles can't open threads with each other unless it's a moderated mentor thread; partners see only their own codes, circles and flags.

**Matching:** for each open circle of the same role, score = 3 × shared situation tags + 2 if same stage + 1 if same age band + 1 if overlapping times of day. Join the top score if under 8 members; otherwise start a new circle.

**Crisis detection:** every new message passes a fast keyword check first. If it matches, or the Gemini classifier rates it high risk, the sender immediately sees the crisis card, the message is flagged, and the moderator view updates live. The message is never silently deleted. We disclose all AI use on Devpost.

## Build plan to the deadline

Build in this order so there's always something demoable. If time runs short, cut from the bottom.

- [ ] **Setup:** repo, Next.js + Supabase project, tables, seed data (2 partners, 4 circles, fake members and messages).
- [ ] **Sign-up path:** invite code → role and tags → matched to a circle.
- [ ] **Circle chat:** real-time messages, daily check-in prompt, "awake now" list.
- [ ] **Crisis safety net:** SOS button, keyword check, crisis card, flag record.
- [ ] **Partner dashboard:** create codes, live flag list.
- [ ] **Mentor request** and private mentor thread.
- [ ] **Polish:** living sky by time of day (weather if time allows), axolotl logo with a simple swim animation, candy-gram notes, mobile layout, accessibility labels, privacy page, Gemini classifier.
- [ ] **Ship:** record the 2–5 min demo, write the Devpost with AI disclosure, push GitHub, submit by 11:30 a.m.

Split for a team of 3–4: one person on database and matching, one on chat and crisis flow, one on onboarding UI and dashboard, one on research, pitch and the UXDC deck.

## Open questions to validate

- Would parents rather be matched by diagnosis, by situation ("just left the ER"), or by child's age?
- Should teens be able to see that their parent is in a circle, and vice versa?
- What hours do families most need someone: late evening, overnight, or weekends?
- How long should a circle last before it renews or graduates?
- Would partners (ER peer program, CMHA Calgary) issue codes, and what would they need to see to trust us?
- Who pays for moderation long term: partners, grants or health system contracts?
- If a teen's message is flagged as a crisis, should their parent be told? This likely depends on the teen's age and the partner's own protocol, so ask partners.
