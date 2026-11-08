"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Lotl } from "@/components/lotl/Lotl";
import { Lotl3D } from "@/components/lotl3d/Lotl3D";
import { CalmIcon, CheckIcon, HelpIcon, MeIcon, PeopleIcon, PhoneIcon, PlayIcon, PondIcon } from "@/components/ui/Icons";
import { BreathePlayer } from "./BreathePlayer";

const FILTERS = ["All", "Ponds", "Night", "Calm", "Notes", "Privacy"] as const;
type Filter = (typeof FILTERS)[number];

type Card = {
  id: string;
  title: string;
  meta: string;
  more: string;
  tags: Filter[];
  bg: string;
  ink?: boolean;
  art: React.ReactNode;
};

const CARDS: Card[] = [
  {
    id: "pond",
    title: "Your small pond",
    meta: "5–8 families · 8 weeks",
    more: "Families like yours, and a mentor who's been there.",
    tags: ["Ponds"],
    bg: "linear-gradient(150deg, #6db8cf, #3f8fb0)",
    art: (
      <svg viewBox="0 0 200 176" aria-hidden="true">
        <ellipse cx="150" cy="150" rx="110" ry="34" fill="#fff" opacity="0.14" />
        <ellipse cx="150" cy="150" rx="70" ry="20" fill="none" stroke="#fff" strokeOpacity="0.4" className="ra-ripple" />
        <ellipse cx="120" cy="140" rx="26" ry="8" fill="#86cfa0" /><path d="M120 140 L146 136 L144 144Z" fill="#4f9fbd" />
        <ellipse cx="176" cy="160" rx="18" ry="6" fill="#86cfa0" />
        <g transform="translate(116 134) scale(1.4)"><path d="M0 0c-7 0-10-7-9-12 3 1 7 5 9 12Z" fill="#f7b3c4" /><path d="M0 0c7 0 10-7 9-12-3 1-7 5-9 12Z" fill="#f7b3c4" /><path d="M0 0c-3-6-3-12 0-17 3 5 3 11 0 17Z" fill="#fff" /></g>
      </svg>
    ),
  },
  {
    id: "awake",
    title: "Someone else is up",
    meta: "Any hour",
    more: "See who's awake. Say hi, or just know they're there.",
    tags: ["Night", "Ponds"],
    bg: "linear-gradient(160deg, #46559e, #6c5cb5)",
    art: (
      <svg viewBox="0 0 200 176" aria-hidden="true">
        {[[110, 70, "0s"], [150, 46, "1.2s"], [182, 80, "2.4s"]].map(([x, y, d], i) => (
          <g key={i}><circle cx={x} cy={y} r="18" fill="#ffd27a" opacity="0.18" /><circle className="ra-glow" style={{ animationDelay: d as string }} cx={x} cy={y} r="6" fill="#fff3c4" /></g>
        ))}
        <path d="M60 150 Q130 138 200 146 V176 H60Z" fill="#fff" opacity="0.1" />
      </svg>
    ),
  },
  {
    id: "breathe",
    title: "Breathe with Lotl",
    meta: "1 minute",
    more: "Try it just below.",
    tags: ["Calm"],
    bg: "linear-gradient(150deg, #f4a9bd, #d97f9c)",
    art: (
      <svg viewBox="0 0 200 176" aria-hidden="true">
        {[70, 52, 34].map((r, i) => (
          <circle key={r} cx="150" cy="110" r={r} fill="#fff" opacity={0.1 + i * 0.06} className="ra-breathe" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </svg>
    ),
  },
  {
    id: "notes",
    title: "Comfort notes",
    meta: "Kept in a jar",
    more: "Little notes for hard days.",
    tags: ["Notes"],
    bg: "linear-gradient(150deg, #ffe2c4, #f8c3a6)",
    ink: true,
    art: (
      <svg viewBox="0 0 200 176" aria-hidden="true">
        <rect x="96" y="60" width="64" height="44" rx="8" fill="#fde3e8" transform="rotate(-8 128 82)" />
        <rect x="118" y="96" width="60" height="42" rx="8" fill="#e2f4e7" transform="rotate(6 148 117)" />
        <path d="M168 40h22v8c10 4 14 14 14 24v60c0 8-6 14-14 14h-30" fill="#fff" opacity="0.55" />
      </svg>
    ),
  },
  {
    id: "weather",
    title: "Today's weather",
    meta: "One tap",
    more: "Stormy to rainbow. No words needed.",
    tags: ["Notes", "Calm"],
    bg: "linear-gradient(150deg, #d3ecf8, #a9d3ec)",
    ink: true,
    art: (
      <svg viewBox="0 0 200 176" aria-hidden="true">
        <circle cx="160" cy="70" r="24" fill="#ffd36e" />
        <path d="M118 128a16 16 0 0 1 2-32 22 22 0 0 1 42-4 17 17 0 0 1 2 36Z" fill="#fff" />
      </svg>
    ),
  },
  {
    id: "private",
    title: "Private by design",
    meta: "Your pond chat stays yours",
    more: "Your program never reads your pond chat.",
    tags: ["Privacy"],
    bg: "linear-gradient(150deg, #e2d8f8, #bfaeea)",
    ink: true,
    art: (
      <svg viewBox="0 0 200 176" aria-hidden="true">
        <path d="M150 40 L188 54 V92 C188 118 170 136 150 144 C130 136 112 118 112 92 V54Z" fill="#fff" opacity="0.6" />
        <path d="M134 92 L146 104 L168 80" fill="none" stroke="#7a68c4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const STEPS = [
  ["Get a code", "From your care team."],
  ["Answer 5 questions", "Skip any you like."],
  ["Meet your pond", "Right away."],
];

const PROMISES = [
  "Parents and teens never share a pond.",
  "Your program never reads your pond chat.",
  "Contact details stay hidden at first.",
];

const FAQ: [string, React.ReactNode][] = [
  ["Who can join?", "Families with a code from their care team."],
  ["Is this therapy?", "No. It's support from people who've been there."],
  ["Need help now?", <>Call or text <a href="tel:988">9-8-8</a>, any hour.</>],
];

const GREETINGS: [string, string, string][] = [
  ["dawn", "Good morning,", "you made it."],
  ["day", "Hello,", "welcome in."],
  ["golden", "Good evening,", "welcome in."],
  ["dusk", "Good evening,", "welcome in."],
  ["night", "Still up?", "You're not alone."],
];

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v8.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5V10" />
  </svg>
);

const TABS = [
  { id: "top", label: "Home", icon: <HomeIcon /> },
  { id: "explore", label: "Explore", icon: <PondIcon /> },
  { id: "breathe", label: "Breathe", icon: <CalmIcon /> },
  { id: "join", label: "Join", icon: <PeopleIcon /> },
];

// Where each card's arrow takes you.
const CARD_TO: Record<string, string> = { pond: "#join", awake: "#join", breathe: "#breathe", notes: "#join", weather: "#join", private: "#safe" };

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export function LandingApp({ goodbye }: { goodbye: React.ReactNode }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState("top");
  const help = useRef<HTMLDialogElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  // Highlight the tab for the screen you're looking at.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    TABS.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Each screen's pieces drift into place whenever the screen scrolls into view.
  useEffect(() => {
    const root = document.querySelector(".ra");
    root?.setAttribute("data-js", "");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.toggleAttribute("data-in", e.isIntersecting)),
      { threshold: 0.12 }, // start as soon as a screen begins to enter
    );
    document.querySelectorAll(".ra-screen").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // The hero's Lotl and pond drift up and soften as you scroll away from them.
  const { scrollY } = useScroll();
  const stageY = useTransform(scrollY, [0, 700], [0, -90]);
  const stageScale = useTransform(scrollY, [0, 700], [1, 0.86]);
  const stageFade = useTransform(scrollY, [0, 600], [1, 0.25]);

  const pick = (f: Filter) => {
    setFilter(f);
    rail.current?.scrollTo({ left: 0, behavior: "smooth" });
  };
  const shown = CARDS.filter((c) => filter === "All" || c.tags.includes(filter));

  return (
    <div className="ra">
      {/* opening splash: Lotl appears in the middle, then fades into the app (CSS only) */}
      <div className="ra-splash" aria-hidden="true">
        <span className="ra-splash-ring" />
        <Lotl mood="wave" title="" />
        <p>regather</p>
      </div>

      <div className="ra-app">
        {/* ---------- screen 1: hello ---------- */}
        <section id="top" className="ra-screen ra-hero" aria-labelledby="ra-title">
          <div className="ra-top">
            <Link href="/" className="ra-brand" aria-label="Regather home">
              <Lotl title="" />
              regather
            </Link>
            <button type="button" className="ra-iconbtn ra-glass" onClick={() => help.current?.showModal()} aria-label="Need help now?">
              <HelpIcon />
            </button>
          </div>

          <motion.div style={{ y: stageY, scale: stageScale, opacity: stageFade }}>
          <div className="ra-stage" aria-hidden="true">
            <div className="ra-halo" />
            <div className="ra-stage-pond">
              <svg viewBox="0 0 400 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ra-water" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: "var(--ra-water-top)" }} />
                    <stop offset="1" style={{ stopColor: "var(--ra-water-deep)" }} />
                  </linearGradient>
                </defs>
                <ellipse cx="200" cy="45" rx="198" ry="42" fill="url(#ra-water)" />
                <ellipse cx="200" cy="34" rx="150" ry="16" fill="#fff" opacity="0.2" />
                <ellipse className="ra-ripple" cx="200" cy="50" rx="120" ry="20" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
                <ellipse className="ra-ripple" style={{ "--d": "2.5s" } as React.CSSProperties} cx="200" cy="50" rx="120" ry="20" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
                <ellipse cx="66" cy="52" rx="26" ry="8" fill="#7cc795" />
                <ellipse cx="340" cy="58" rx="18" ry="6" fill="#7cc795" />
              </svg>
            </div>
            <div className="ra-stage-lotl">
              <Lotl3D follow title="" />
            </div>
          </div>
          </motion.div>

          {GREETINGS.map(([p, a, b]) => (
            <p key={p} className="ra-greet ra-hello ra-rise" data-p={p}>{a} <span>{b}</span></p>
          ))}
          {goodbye}

          <h1 id="ra-title" className="ra-title ra-rise" style={{ "--delay": "200ms" } as React.CSSProperties}>
            You don&apos;t have to do this alone.
          </h1>
          <p className="ra-lead ra-rise" style={{ "--delay": "300ms" } as React.CSSProperties}>
            Small, private groups for families after a youth mental health crisis.
          </p>
          <Link href="/join" className="ra-pill ra-rise" style={{ "--delay": "400ms" } as React.CSSProperties}>
            <PlayIcon /> Join with your code
          </Link>
        </section>

        {/* ---------- screen 2: what do you need today ---------- */}
        <section id="explore" className="ra-screen ra-sheet ra-sheet--first" aria-labelledby="ra-explore">
          <p className="ra-kicker" data-r style={{ "--i": 0 } as React.CSSProperties}>Explore</p>
          <h2 id="ra-explore" className="ra-h2" data-r style={{ "--i": 1 } as React.CSSProperties}>What do you <em>need today?</em></h2>
          <div className="ra-chips" role="group" aria-label="Filter" data-r style={{ "--i": 2 } as React.CSSProperties}>
            {FILTERS.map((f) => (
              <button key={f} type="button" className="ra-chip" aria-pressed={filter === f} onClick={() => pick(f)}>{f}</button>
            ))}
          </div>

          <div ref={rail} className="ra-rail" data-r style={{ "--i": 3 } as React.CSSProperties}>
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((c) => (
                <motion.article
                  key={c.id}
                  layout
                  className={`ra-card${c.ink ? " ra-card--ink" : ""}`}
                  style={{ background: c.bg }}
                  initial={{ opacity: 0, x: 30, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 160, damping: 22 }}
                >
                  <span className="ra-card-art">{c.art}</span>
                  <p className="ra-meta">{c.meta}</p>
                  <h3>{c.title}</h3>
                  <p className="ra-more">{c.more}</p>
                  <a className="ra-go" href={CARD_TO[c.id]} aria-label={`More about ${c.title}`}><ArrowIcon /></a>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
          <p className="ra-swipe" aria-hidden="true" data-r style={{ "--i": 4 } as React.CSSProperties}>Swipe for more</p>
        </section>

        {/* ---------- screen 3: breathe ---------- */}
        <section id="breathe" className="ra-screen ra-sheet" aria-label="Breathe with Lotl">
          <div data-r style={{ "--i": 0 } as React.CSSProperties}>
            <BreathePlayer />
          </div>
        </section>

        {/* ---------- screen 4: join ---------- */}
        <section id="join" className="ra-screen ra-sheet" aria-labelledby="ra-join">
          <p className="ra-kicker" data-r style={{ "--i": 0 } as React.CSSProperties}>How to join</p>
          <h2 id="ra-join" className="ra-h2" data-r style={{ "--i": 1 } as React.CSSProperties}>Into a pond in <em>three steps.</em></h2>
          <ol className="ra-steps">
            {STEPS.map(([t, b], i) => (
              <li key={t} data-r style={{ "--i": i + 2 } as React.CSSProperties}><b>{i + 1}</b><div><strong>{t}</strong><span>{b}</span></div></li>
            ))}
          </ol>
          <Link href="/join" className="ra-pill ra-pill--ink ra-cta" data-r style={{ "--i": 5 } as React.CSSProperties}><PlayIcon /> Join with your code</Link>
        </section>

        {/* ---------- screen 5: safe ---------- */}
        <section id="safe" className="ra-screen ra-sheet" aria-labelledby="ra-safe">
          <p className="ra-kicker" data-r style={{ "--i": 0 } as React.CSSProperties}>Privacy</p>
          <h2 id="ra-safe" className="ra-h2" data-r style={{ "--i": 1 } as React.CSSProperties}>Safe to <em>open up.</em></h2>
          <ul className="ra-promises" data-r style={{ "--i": 2 } as React.CSSProperties}>
            {PROMISES.map((p) => <li key={p}><CheckIcon />{p}</li>)}
          </ul>
          <div className="ra-faq" data-r style={{ "--i": 3 } as React.CSSProperties}>
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
          <Link href="/privacy" className="ra-link" data-r style={{ "--i": 4 } as React.CSSProperties}>Read the privacy notes</Link>
        </section>

        {/* ---------- screen 6: the end ---------- */}
        <section className="ra-screen ra-sheet ra-end" aria-label="Regather">
          <Wordmark />
          <p className="ra-end-line" data-r style={{ "--i": 1 } as React.CSSProperties}>Ready when you are.</p>
          <Link href="/login" className="ra-pill ra-signin" data-r style={{ "--i": 2 } as React.CSSProperties}>
            Sign in
          </Link>
          <p className="ra-foot" data-r style={{ "--i": 3 } as React.CSSProperties}>
            <Link href="/privacy">Privacy</Link> · © 2026 Regather
            <br />In crisis, call or text <a href="tel:988">9-8-8</a>, any hour.
          </p>
        </section>
      </div>

      {/* ---------- tab bar ---------- */}
      <nav className="ra-tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="ra-tab" aria-current={active === t.id}>
            <i>{t.icon}</i>{t.label}
          </a>
        ))}
        <Link href="/login" className="ra-tab"><i><MeIcon /></i>Sign in</Link>
      </nav>

      {/* ---------- help, one tap away ---------- */}
      <dialog ref={help} className="ra-help" aria-labelledby="ra-help-h" onClick={(e) => e.target === e.currentTarget && help.current?.close()}>
        <div className="ra-help-card">
          <div className="ra-grab" aria-hidden="true" />
          <h2 id="ra-help-h">Need to talk to someone now?</h2>
          <p>You don&apos;t need a code for this. Real people are there, any hour.</p>
          <a className="ra-help-row" href="tel:988"><i><PhoneIcon /></i><span>Call or text 9-8-8<small>Suicide Crisis Helpline, 24/7</small></span></a>
          <a className="ra-help-row" href="tel:4032664357"><i><PhoneIcon /></i><span>Distress Centre Calgary<small>403-266-4357, 24/7</small></span></a>
          <a className="ra-help-row" href="tel:911"><i><PhoneIcon /></i><span>Call 9-1-1<small>If someone is in danger right now</small></span></a>
          <button type="button" className="ra-help-close" onClick={() => help.current?.close()}>Close</button>
        </div>
      </dialog>
    </div>
  );
}

/** The closing wordmark: letters rise into place, with room below for the "g". */
function Wordmark() {
  return (
    <motion.p
      aria-hidden="true"
      className="ra-word"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {"regather".split("").map((l, i) => (
        <motion.span key={i} variants={{ hidden: { y: "35%", opacity: 0 }, show: { y: "0%", opacity: 1, transition: { type: "spring", stiffness: 110, damping: 15 } } }}>
          {l}
        </motion.span>
      ))}
    </motion.p>
  );
}
