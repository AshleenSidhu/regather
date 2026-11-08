"use client";

import { useEffect, useRef, useState } from "react";
import { Lotl } from "@/components/lotl/Lotl";
import { CloseIcon, Sticker } from "@/components/ui/Icons";
import { NoteCard, PAPER, type NoteView } from "./NoteCard";

// Where the little folded notes sit inside the jar (x, y, rotation).
const SPOTS: [number, number, number][] = [
  [72, 198, -12], [104, 202, 8], [134, 196, -4], [88, 178, 14], [120, 176, -10],
  [66, 162, 6], [146, 166, 12], [100, 154, -6], [78, 138, -14], [128, 140, 4],
  [112, 120, 10], [86, 112, -4], [140, 116, -12], [100, 96, 6],
];

function FoldedNote({ x, y, r, color, i }: { x: number; y: number; r: number; color: string; i: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="jar-note" style={{ "--r": `${r}deg`, "--d": `${(i % 5) * 0.7}s`, "--dur": `${5 + (i % 4)}s`, "--x": `${(i % 3) - 1}px` } as React.CSSProperties}>
        <rect x="-13" y="-9" width="26" height="18" rx="4" fill={color} stroke="#fff" strokeWidth="1.5" />
        <path d="M-13 -7 L0 2 L13 -7" fill="none" stroke="#fff" strokeWidth="1.3" strokeOpacity="0.9" />
      </g>
    </g>
  );
}

/** The comfort jar. Kept notes gather and glow; on hard days, tap it to reread one. */
export function ComfortJar({ notes }: { notes: NoteView[] }) {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<NoteView | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = notes.length;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (reading) setReading(null);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, reading]);

  return (
    <>
      <button
        type="button"
        onClick={() => count > 0 && setOpen(true)}
        disabled={count === 0}
        aria-label={count ? `Open your comfort jar. ${count} ${count === 1 ? "note" : "notes"} kept.` : "Your comfort jar is empty for now"}
        className="group relative mx-auto block w-52 disabled:cursor-default"
      >
        <svg viewBox="0 0 200 240" className="w-full overflow-visible transition-transform duration-700 [transition-timing-function:var(--ease-spring)] group-enabled:group-hover:-translate-y-1 group-enabled:group-hover:rotate-[-2deg]" aria-hidden="true">
          <defs>
            <radialGradient id="jar-glow" cx="0.5" cy="0.65" r="0.6">
              <stop offset="0" stopColor="#ffe3a0" stopOpacity={count ? 0.85 : 0.25} />
              <stop offset="1" stopColor="#ffe3a0" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="jar-glass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="150" rx="95" ry="90" fill="url(#jar-glow)" className={count ? "glow-pulse" : undefined} />
          {/* glass */}
          <path d="M62 44 H138 V60 C162 70 172 92 172 120 V196 C172 214 158 226 140 226 H60 C42 226 28 214 28 196 V120 C28 92 38 70 62 60 Z" fill="url(#jar-glass)" stroke="#fff" strokeOpacity="0.85" strokeWidth="3" />
          {/* notes inside */}
          {notes.slice(0, SPOTS.length).map((n, i) => (
            <FoldedNote key={n.id} i={i} x={SPOTS[i][0]} y={SPOTS[i][1]} r={SPOTS[i][2]} color={PAPER[n.color] ?? PAPER.blush} />
          ))}
          {/* shine */}
          <path d="M44 112 C44 96 50 84 60 76" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="5" strokeLinecap="round" />
          <path d="M42 130 V168" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" />
          {/* lid with a ribbon */}
          <rect x="54" y="24" width="92" height="24" rx="8" fill="#e8b98f" />
          <rect x="54" y="24" width="92" height="8" rx="4" fill="#f3cfaa" />
          <path d="M100 48 c-14 -2 -20 10 -10 14 c6 2 10 -6 10 -14 c0 8 4 16 10 14 c10 -4 4 -16 -10 -14Z" fill="#f5a3b5" />
        </svg>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Your comfort jar" className="fixed inset-0 z-50 overflow-y-auto bg-[#121a3a]/75 backdrop-blur-md">
          <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-10 pt-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-2xl font-semibold text-white">Pick one to reread</p>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close the jar" className="press grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {reading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 py-8">
                <NoteCard note={reading} className="unwrap w-full" />
                <button type="button" onClick={() => setReading(null)} className="lift rounded-full bg-white/90 px-6 py-3 font-bold text-ink">
                  Put it back
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 py-6">
                {notes.map((n, i) => (
                  <li key={n.id} className="swirl" style={{ "--d": `${i * 0.06}s`, "--r": `${((i * 47) % 9) - 4}deg` } as React.CSSProperties}>
                    <button
                      type="button"
                      onClick={() => setReading(n)}
                      className="drift lift relative flex aspect-[4/3] w-full flex-col items-start justify-between rounded-[18px] border border-white/80 p-3 text-left text-ink"
                      style={{ background: `linear-gradient(180deg,#fffdf9,${PAPER[n.color] ?? PAPER.blush})`, "--d": `${i * 0.4}s` } as React.CSSProperties}
                    >
                      <Sticker kind={n.sticker} className="h-8 w-8" />
                      <span className="font-hand line-clamp-2 text-xl leading-tight">{n.body}</span>
                      <span className="text-xs font-bold text-ink-soft">{n.who}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex justify-center">
              <Lotl mood={reading ? "happy" : "idle"} className="h-16 w-auto" title="" bubbles />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
