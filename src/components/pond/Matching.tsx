"use client";

import { useEffect, useState } from "react";
import { Lotl } from "@/components/lotl/Lotl";

const LINES = [
  "Looking for families who get it…",
  "Checking who's up when you are…",
  "Finding a calm spot on the water…",
];

const LIGHTS = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2;
  return { x: Math.cos(a) * 120, y: Math.sin(a) * 80, d: i * 0.25 };
});

/** Full-screen moment while matching runs: lights drift in and gather into a pond. */
export function Matching() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % LINES.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-40 grid place-items-center bg-[#121a3a]/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative grid h-64 w-72 place-items-center">
          {/* the pond forming */}
          <svg viewBox="0 0 280 120" className="absolute bottom-2 w-full" aria-hidden="true">
            <ellipse className="grow-in" cx="140" cy="70" rx="130" ry="40" fill="#2f6f8c" opacity="0.85" />
            {[0, 1.2, 2.4].map((d) => (
              <ellipse key={d} className="ripple-ring" style={{ "--d": `${d}s` } as React.CSSProperties} cx="140" cy="70" rx="60" ry="18" fill="none" stroke="#fff" strokeOpacity="0.5" />
            ))}
          </svg>
          {LIGHTS.map((l, i) => (
            <span
              key={i}
              className="awake-light absolute h-4 w-4 rounded-full"
              style={{
                animation: `gather 2.6s var(--ease-settle) ${l.d}s both, glow-pulse 3s ease-in-out ${l.d}s infinite`,
                "--fx": `${l.x}px`,
                "--fy": `${l.y}px`,
                "--tx": `${Math.cos(i) * 34}px`,
                "--ty": `${Math.sin(i) * 14 - 20}px`,
              } as React.CSSProperties}
            />
          ))}
          <Lotl mood="happy" className="relative z-10 h-32 w-auto" title="" bubbles />
        </div>
        <p key={line} className="enter font-display text-2xl font-semibold text-white">{LINES[line]}</p>
      </div>
    </div>
  );
}
