"use client";

import { useEffect, useRef, useState } from "react";
import { Lotl3D } from "@/components/lotl3d/Lotl3D";
import { Lotl } from "@/components/lotl/Lotl";
import { PauseIcon, PlayIcon } from "@/components/ui/Icons";

const IN_MS = 4000;
const OUT_MS = 6000;
const CYCLE = IN_MS + OUT_MS;
const TOTAL = 6 * CYCLE; // one minute
const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

/**
 * A one-minute breathing player, like a meditation app's "now playing" screen:
 * 4 seconds in, 6 out. Lotl's gills glow and the rings swell with each breath.
 */
export function BreathePlayer() {
  const stage = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const level = useRef(0);
  const elapsed = useRef(0);
  const [running, setRunning] = useState(false);
  const [cue, setCue] = useState("Take a deep breath…");
  const [count, setCount] = useState("Press play.");
  const [time, setTime] = useState("0:00");

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current = Math.min(TOTAL, elapsed.current + (now - last));
      last = now;
      const total = elapsed.current;
      const t = total % CYCLE;
      const inhaling = t < IN_MS;
      level.current = inhaling ? ease(t / IN_MS) : 1 - ease((t - IN_MS) / OUT_MS);
      stage.current?.style.setProperty("--lvl", level.current.toFixed(3));
      bar.current?.style.setProperty("--p", `${((total / TOTAL) * 100).toFixed(2)}%`);
      if (total >= TOTAL) {
        setRunning(false);
        setCue("That was a whole minute.");
        setCount("Come back any time.");
        elapsed.current = 0;
        return;
      }
      const left = Math.ceil(inhaling ? (IN_MS - t) / 1000 : (CYCLE - t) / 1000);
      setCue(inhaling ? "Breathe in…" : "And out…");
      setCount([...Array(left)].map((_, i) => left - i).join("…") + "…");
      setTime(clock(total));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const restart = () => {
    elapsed.current = 0;
    bar.current?.style.setProperty("--p", "0%");
    setTime("0:00");
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    elapsed.current = 0;
    level.current = 0;
    stage.current?.style.setProperty("--lvl", "0");
    bar.current?.style.setProperty("--p", "0%");
    setTime("0:00");
    setCue("Take a deep breath…");
    setCount("Press play.");
  };

  return (
    <div className="ra-player">
      <div className="ra-player-top">
        <p>Breathe with Lotl</p>
        <span className="ra-chip-pill">1 min</span>
      </div>

      <div ref={stage} className="ra-player-stage" aria-hidden="true">
        <span className="ra-ring ra-ring--2" />
        <span className="ra-ring" />
        <div className="ra-player-lotl">
          <Lotl3D title="" glowRef={level} fallback={<Lotl className="lotl3d-svg" title="" glow="inherit" />} />
        </div>
      </div>

      <div aria-live="polite">
        <p className="ra-cue">{cue}</p>
        <p className="ra-count">{count}</p>
      </div>

      <div ref={bar} className="ra-progress" aria-hidden="true"><i /><b /></div>
      <div className="ra-times"><span>{time}</span><span>1:00</span></div>

      <div className="ra-tiles">
        <div className="ra-tile">Breathe in<small>4 seconds</small></div>
        <div className="ra-tile">Breathe out<small>6 seconds</small></div>
      </div>

      <div className="ra-controls">
        <button type="button" className="ra-iconbtn" onClick={restart} aria-label="Start again">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v4h4" />
          </svg>
        </button>
        <button type="button" className="ra-play" onClick={() => setRunning((r) => !r)} aria-label={running ? "Pause" : "Play"}>
          {running ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" className="ra-iconbtn" onClick={stop} aria-label="Stop">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2.5" /></svg>
        </button>
      </div>
    </div>
  );
}
