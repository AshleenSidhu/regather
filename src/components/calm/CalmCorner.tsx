"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Lotl } from "@/components/lotl/Lotl";
import { useSky } from "@/components/sky/SkyProvider";
import { PlayIcon } from "@/components/ui/Icons";
import { WEATHER_WORDS, moonFraction, moonName } from "@/lib/sky";
import { BreatheWithLotl } from "./BreatheWithLotl";
import { Grounding } from "./Grounding";
import { Player } from "./Player";

type Mode = "menu" | "breathe" | "ground";
type Filter = "all" | "breathe" | "ground" | "notes";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "breathe", label: "Breathe" },
  { id: "ground", label: "Ground" },
  { id: "notes", label: "Kind words" },
];

/** The calm corner: one quiet thing at a time, full screen. Nothing here is saved or shared. */
export function CalmCorner({ start }: { start?: "breathe" | "ground" }) {
  const [mode, setMode] = useState<Mode>(start ?? "menu");
  const [filter, setFilter] = useState<Filter>("all");
  const { phase, weather, report } = useSky();
  const close = useCallback(() => setMode("menu"), []);

  const evening = phase === "night" || phase === "dusk";
  const skyLine =
    phase === "night"
      ? `A ${moonName(moonFraction(new Date()))}${report ? ` over ${report.city}` : ""} tonight`
      : report
        ? `${report.city}: ${WEATHER_WORDS[weather]}, ${report.tempC}°`
        : null;
  const show = (f: Filter) => filter === "all" || filter === f;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="enter">
        {skyLine && <span className="chip mb-4 min-h-8! px-3! text-[13px]">{skyLine}</span>}
        <h1 className="font-display text-[40px] leading-[1.02]">
          What do you <span className="tone">need</span> {evening ? "tonight" : "today"}?
        </h1>
      </div>

      <div className="enter -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Show" style={{ "--delay": "80ms" } as React.CSSProperties}>
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="chip shrink-0" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {show("breathe") && (
          <button type="button" onClick={() => setMode("breathe")} className="scene-card enter text-left" style={{ "--delay": "140ms" } as React.CSSProperties}>
            <span className="scene-card__art" aria-hidden="true" style={{ background: "radial-gradient(80% 90% at 85% 60%, #ffb3c4 0%, rgb(255 179 196 / 0) 60%), linear-gradient(135deg, #c24e72, #e98a8f)" }}>
              <Lotl className="absolute -right-4 bottom-[-18px] h-40 w-auto opacity-95" title="" glow={0.7} />
            </span>
            <span>
              <span className="scene-card__title">Breathe with Lotl</span>
              <span className="meta">1 min · in for 4, out for 6</span>
            </span>
            <span className="round round--white" aria-hidden="true"><PlayIcon className="h-5 w-5 translate-x-px" /></span>
          </button>
        )}

        {show("ground") && (
          <button type="button" onClick={() => setMode("ground")} className="scene-card enter text-left" style={{ "--delay": "200ms" } as React.CSSProperties}>
            <span className="scene-card__art" aria-hidden="true" style={{ background: "linear-gradient(135deg, #2f7f95, #4fa3a8 55%, #8ccab0)" }}>
              <svg viewBox="0 0 320 170" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 h-full w-full">
                <path d="M120 120 Q200 100 320 112 V170 H120Z" fill="#1e5d74" opacity=".55" />
                <ellipse cx="250" cy="138" rx="34" ry="8" fill="#86cfa0" />
                <circle cx="268" cy="44" r="14" fill="#fff6dc" opacity=".9" />
                <g fill="none" stroke="#fff" strokeOpacity=".45"><ellipse cx="200" cy="150" rx="22" ry="4" /><ellipse cx="290" cy="158" rx="14" ry="3" /></g>
              </svg>
            </span>
            <span>
              <span className="scene-card__title">Come back to the room</span>
              <span className="meta">3 min · 5 things you see, 4 you can touch</span>
            </span>
            <span className="round round--white" aria-hidden="true"><PlayIcon className="h-5 w-5 translate-x-px" /></span>
          </button>
        )}

        {show("notes") && (
          <Link href="/notes" className="scene-card enter" style={{ "--delay": "260ms" } as React.CSSProperties}>
            <span className="scene-card__art" aria-hidden="true" style={{ background: "radial-gradient(70% 90% at 85% 55%, #ffe3a6, rgb(255 227 166 / 0) 65%), linear-gradient(135deg, #b3683a, #d99a5e)" }}>
              <svg viewBox="0 0 200 240" className="absolute -right-2 bottom-[-28px] h-44 w-auto opacity-90">
                <path d="M62 44H138V60C162 70 172 92 172 120V196C172 214 158 226 140 226H60C42 226 28 214 28 196V120C28 92 38 70 62 60Z" fill="#fff" fillOpacity=".35" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
                <rect x="58" y="170" width="30" height="20" rx="4" fill="#fde3e8" /><rect x="96" y="180" width="30" height="20" rx="4" fill="#e2f4e7" /><rect x="120" y="156" width="30" height="20" rx="4" fill="#fff0d6" />
                <rect x="54" y="24" width="92" height="24" rx="8" fill="#f3cfaa" />
              </svg>
            </span>
            <span>
              <span className="scene-card__title">Reread your jar</span>
              <span className="meta">The kind notes you kept</span>
            </span>
            <span className="round round--white" aria-hidden="true"><PlayIcon className="h-5 w-5 translate-x-px" /></span>
          </Link>
        )}
      </div>

      <p className="text-sm text-on-sky-soft">Nothing in the calm corner is saved or shared with anyone.</p>

      {mode === "breathe" && (
        <Player title="Breathe with Lotl" onClose={close}>
          <BreatheWithLotl onDone={close} />
        </Player>
      )}
      {mode === "ground" && (
        <Player title="Come back to the room" onClose={close}>
          <Grounding onDone={close} />
        </Player>
      )}
    </div>
  );
}
