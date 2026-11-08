"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { moonFraction, moonLitPath } from "@/lib/sky";

// Pure markup for the living sky. Which layers show is decided in CSS from
// <html data-phase> and <html data-weather>, set by SkyProvider.

// Deterministic "random" so server and client markup always match.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const r1 = rng(7);
const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: `${(r1() * 100).toFixed(1)}%`,
  top: `${(r1() * 64).toFixed(1)}%`,
  size: 1.5 + Math.round(r1() * 2.5),
  delay: `${(r1() * 5).toFixed(1)}s`,
  first: i === 0,
}));

const r2 = rng(11);
const FIREFLIES = Array.from({ length: 9 }, () => ({
  left: `${(5 + r2() * 90).toFixed(1)}%`,
  top: `${(55 + r2() * 40).toFixed(1)}%`,
  d: `${(r2() * 6).toFixed(1)}s`,
  dur: `${(11 + r2() * 9).toFixed(1)}s`,
}));

const r3 = rng(23);
const DROPS = Array.from({ length: 22 }, () => ({
  left: `${(r3() * 100).toFixed(1)}%`,
  d: `${(r3() * 12).toFixed(1)}s`,
  dur: `${(7 + r3() * 7).toFixed(1)}s`,
  scale: 0.7 + r3() * 0.9,
}));

const r4 = rng(31);
const FLAKES = Array.from({ length: 34 }, () => ({
  left: `${(r4() * 100).toFixed(1)}%`,
  d: `${(-r4() * 18).toFixed(1)}s`,
  dur: `${(13 + r4() * 10).toFixed(1)}s`,
  s: `${(5 + r4() * 8).toFixed(0)}px`,
  rest: `${(r4() * 90).toFixed(0)}%`,
}));

const r5 = rng(41);
const BLADES = Array.from({ length: 40 }, (_, i) => ({
  x: i * 26 + r5() * 12,
  h: 30 + r5() * 45,
  d: `${(r5() * 3).toFixed(1)}s`,
}));

// The moon's phase changes slowly; recompute once an hour.
function subscribeHour(cb: () => void) {
  const id = setInterval(cb, 3600 * 1000);
  return () => clearInterval(id);
}
const getHourKey = () => Math.floor(Date.now() / 3600000);

function Moon() {
  const hourKey = useSyncExternalStore(subscribeHour, getHourKey, () => 0);
  // Server render shows a gentle crescent; the client swaps in tonight's real phase.
  const f = hourKey === 0 ? 0.2 : moonFraction(new Date(hourKey * 3600000));
  return (
    <svg className="sky-moon" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="moon-lit" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fffdf3" />
          <stop offset="1" stopColor="#f6e9c4" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="#ffffff" opacity="0.08" />
      <path d={moonLitPath(f, 32, 32, 26)} fill="url(#moon-lit)" />
      <circle cx="40" cy="26" r="3" fill="#e9dcb4" opacity="0.35" />
      <circle cx="35" cy="40" r="2" fill="#e9dcb4" opacity="0.3" />
    </svg>
  );
}

// Slide the sky's colour blobs a little as the page scrolls (parallax). One passive
// listener writing a CSS variable; no React re-renders.
function useSkyScroll(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ref.current?.style.setProperty("--sky-scroll", String(Math.round(window.scrollY))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ref]);
}

export function Sky() {
  const root = useRef<HTMLDivElement>(null);
  useSkyScroll(root);
  return (
    <div ref={root} className="sky-root" aria-hidden="true">
      <div className="sky-grad sky-grad-dawn" />
      <div className="sky-grad sky-grad-day" />
      <div className="sky-grad sky-grad-golden" />
      <div className="sky-grad sky-grad-dusk" />
      <div className="sky-grad sky-grad-night" />

      <div className="sky-sun" />
      <div className="sky-drift">
        <div className="sky-blob sky-blob-1" />
        <div className="sky-blob sky-blob-2" />
        <div className="sky-blob sky-blob-3" />
        <div className="sky-blob sky-blob-4" />
      </div>

      <div className="sky-cloud sky-cloud-1" />
      <div className="sky-cloud sky-cloud-2" />
      <div className="sky-cloud sky-cloud-3" />

      <div className="sky-stars">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={`sky-star${s.first ? " sky-star-first" : ""}`}
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}
        <span className="sky-shooting" />
      </div>
      <Moon />

      <div className="sky-fireflies">
        {FIREFLIES.map((f, i) => (
          <span
            key={i}
            className="firefly"
            style={{ left: f.left, top: f.top, "--d": f.d, "--dur": f.dur } as React.CSSProperties}
          />
        ))}
      </div>

      {/* calm weather layers */}
      <div className="wx wx-rain">
        {DROPS.map((d, i) => (
          <span
            key={i}
            className="raindrop"
            style={{ left: d.left, scale: d.scale, "--d": d.d, "--dur": d.dur } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="wx wx-snow">
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="snowflake"
            style={{ left: f.left, "--d": f.d, "--dur": f.dur, "--s": f.s, "--rest-top": f.rest } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="wx wx-frost" />
      <div className="wx wx-mist" />
      <svg className="wx wx-breeze" viewBox="0 0 1040 80" preserveAspectRatio="xMidYMax slice" style={{ top: "auto", height: 80 }}>
        {BLADES.map((b, i) => (
          <path
            key={i}
            className="grass-blade"
            style={{ "--d": b.d } as React.CSSProperties}
            d={`M${b.x} 80 Q${b.x + 4} ${80 - b.h / 2} ${b.x + 8} ${80 - b.h} Q${b.x + 6} ${80 - b.h / 2} ${b.x + 10} 80Z`}
            fill={i % 3 ? "#7fbf8f" : "#9fd3a5"}
            opacity="0.7"
          />
        ))}
      </svg>
    </div>
  );
}
