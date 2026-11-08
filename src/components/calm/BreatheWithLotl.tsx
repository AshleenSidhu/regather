"use client";

import { useEffect, useRef, useState } from "react";
import { Lotl } from "@/components/lotl/Lotl";
import { Lotl3D } from "@/components/lotl3d/Lotl3D";
import { PauseIcon, PlayIcon, RestartIcon, StopIcon } from "@/components/ui/Icons";
import { PillButton } from "@/components/ui/PillButton";

const IN_MS = 4000;
const OUT_MS = 6000;
const CYCLE = IN_MS + OUT_MS;
const ROUNDS = 6; // one minute
const TOTAL = ROUNDS * CYCLE;

const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Breathe with Lotl, as a full-screen player: 4 seconds in, 6 out, for one minute.
 * Lotl's gills glow brighter as you breathe in and soften as you breathe out.
 */
export function BreatheWithLotl({ onDone }: { onDone: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [count, setCount] = useState(4);
  const [left, setLeft] = useState(TOTAL);
  const [finished, setFinished] = useState(false);
  const elapsed = useRef(0);
  const levelRef = useRef(0); // 0..1, read by the 3D Lotl every frame

  useEffect(() => {
    if (!running || finished) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const total = elapsed.current;
      if (total >= TOTAL) {
        setFinished(true);
        return;
      }
      const t = total % CYCLE;
      const inhaling = t < IN_MS;
      const level = inhaling ? ease(t / IN_MS) : 1 - ease((t - IN_MS) / OUT_MS);
      levelRef.current = level;
      stage.current?.style.setProperty("--glow", level.toFixed(3));
      setPhase(inhaling ? "in" : "out");
      setCount(Math.ceil(inhaling ? (IN_MS - t) / 1000 : (CYCLE - t) / 1000));
      setLeft(TOTAL - total);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, finished]);

  function restart() {
    elapsed.current = 0;
    setLeft(TOTAL);
    setFinished(false);
    setRunning(true);
  }

  if (finished) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Lotl3D mood="happy" className="pop-in h-56 w-56" title="Lotl, glowing softly" fallback={<Lotl mood="happy" className="h-40 w-auto" title="" glow={1} />} />
        <h2 className="font-display text-[34px] leading-tight">
          That was a <span className="tone">whole minute.</span>
        </h2>
        <p className="max-w-xs text-on-sky-soft">Your breathing slowed down with Lotl&apos;s. You can come back any time.</p>
        <div className="mt-2 flex gap-3">
          <button type="button" className="chip min-h-12! px-5!" onClick={restart}>Once more</button>
          <PillButton variant="white" onClick={onDone}>I feel a bit calmer</PillButton>
        </div>
      </div>
    );
  }

  // "4…3…2…": the count so far, the way you'd say it out loud
  const start = phase === "in" ? 4 : 6;
  const said = Array.from({ length: start - count + 1 }, (_, i) => start - i).join("…") + "…";
  const done = 1 - left / TOTAL;

  return (
    <div className="flex flex-1 flex-col">
      <div ref={stage} className="relative mx-auto mt-4 grid aspect-square w-full max-w-[340px] place-items-center" style={{ "--glow": 0 } as React.CSSProperties}>
        <span
          aria-hidden="true"
          className="absolute inset-4 rounded-full"
          style={{ background: "radial-gradient(circle, rgb(255 190 205 / 0.5), transparent 68%)", opacity: "calc(0.3 + var(--glow) * 0.7)", transform: "scale(calc(0.8 + var(--glow) * 0.2))" }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-white/25"
          style={{ transform: "scale(calc(0.66 + var(--glow) * 0.34))", opacity: "calc(0.3 + var(--glow) * 0.7)" }}
        />
        <Lotl3D
          className="relative h-full w-full"
          title="Lotl, breathing with you"
          glowRef={levelRef}
          fallback={<Lotl className="mx-auto h-48 w-auto" title="" glow="inherit" />}
        />
      </div>

      <div className="mt-auto flex flex-col gap-5 pt-6">
        <span className="chip self-start min-h-8! px-3! text-[13px]">One minute · in for 4, out for 6</span>
        <div aria-live="polite">
          <p className="font-display text-[34px] leading-tight">{phase === "in" ? "Breathe in…" : "And slowly out…"}</p>
          <p className="mt-1 text-lg text-on-sky-soft" aria-hidden="true">{said}</p>
        </div>

        <div>
          <div className="mb-2 flex justify-end text-sm tabular-nums text-on-sky-soft">{clock(left)}</div>
          <div className="progress" role="progressbar" aria-label="Time left" aria-valuemin={0} aria-valuemax={60} aria-valuenow={Math.round(done * 60)}>
            <i style={{ width: `${done * 100}%` }} />
            <b style={{ left: `${done * 100}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 pt-2">
          <button type="button" onClick={restart} aria-label="Start again" className="round h-14! w-14!">
            <RestartIcon className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => setRunning((r) => !r)} aria-label={running ? "Pause" : "Keep going"} className="round round--white round--xl">
            {running ? <PauseIcon className="h-9 w-9" /> : <PlayIcon className="h-9 w-9" />}
          </button>
          <button type="button" onClick={onDone} aria-label="Stop" className="round h-14! w-14!">
            <StopIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
