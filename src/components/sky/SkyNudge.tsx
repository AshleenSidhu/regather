"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { useSky } from "./SkyProvider";

const KEY = "rg-nudge-day";

/**
 * A gentle nudge to look outside, at most once a day, tied to the real sky in the
 * person's city: the sunset coming, snow falling, or a clear night. Easy to dismiss.
 */
export function SkyNudge() {
  const { report, phase, weather } = useSky();
  const [text, setText] = useState<string | null>(null);

  // Worked out after mount: it depends on the clock and on per-device "already shown today".
  useEffect(() => {
    let shownToday = false;
    try {
      shownToday = localStorage.getItem(KEY) === new Date().toDateString();
    } catch {
      /* storage blocked: still fine to show it */
    }
    if (shownToday || !report) return;

    const sunset = new Date(report.sunset);
    const today = new Date();
    sunset.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    const minsToSunset = (sunset.getTime() - today.getTime()) / 60000;
    const time = sunset.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    let next: string | null = null;
    if (weather === "snow") next = `It's snowing in ${report.city}. Maybe open the curtains for a minute?`;
    else if (minsToSunset > 0 && minsToSunset < 100) next = `The sun sets at ${time} today. Want to catch it?`;
    else if (phase === "night" && weather === "clear") next = "It's a clear night. The moon is out if you want a look.";
    if (!next) return;
    try {
      localStorage.setItem(KEY, new Date().toDateString()); // at most once a day
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from the clock + storage after mount
    setText(next);
  }, [report, phase, weather]);

  if (!text) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, new Date().toDateString());
    } catch {
      /* ignore */
    }
    setText(null);
  }

  return (
    <div className="glass pop-in flex items-center gap-3 rounded-[22px] py-2 pl-4 pr-1.5" role="note">
      <span aria-hidden="true" className="awake-light h-3 w-3 shrink-0 rounded-full" />
      <p className="flex-1 text-sm font-semibold">{text}</p>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="press grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-white/20">
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
