"use client";

import { useState } from "react";
import { Lotl } from "@/components/lotl/Lotl";
import { useSky } from "@/components/sky/SkyProvider";
import { PillButton } from "@/components/ui/PillButton";
import { moonFraction, moonName, type CalmWeather, type Phase } from "@/lib/sky";

type Step = { n: number; sense: string; prompt: string; hint: string };

function skyHint(phase: Phase, weather: CalmWeather, moon: string): string {
  if (weather === "rain") return "If you can, watch one raindrop slide all the way down the window.";
  if (weather === "snow") return "Look outside and follow one snowflake all the way down.";
  if (weather === "frost") return "Look for the frost on the window, and the warm light behind you.";
  if (phase === "night" || phase === "dusk") return `Look outside for the moon. Tonight it's a ${moon}.`;
  if (phase === "golden") return "Find something the low, golden light is touching.";
  if (phase === "dawn") return "Look at the sky. Can you find a pink or orange edge?";
  return "Look outside and find one cloud, a tree, or a patch of sky.";
}

function steps(phase: Phase, weather: CalmWeather): Step[] {
  const moon = moonName(moonFraction(new Date()));
  return [
    { n: 5, sense: "see", prompt: "Name 5 things you can see.", hint: skyHint(phase, weather, moon) },
    { n: 4, sense: "touch", prompt: "Notice 4 things you can touch.", hint: "Your sleeve, the floor under your feet, something cool, something soft." },
    {
      n: 3, sense: "hear", prompt: "Listen for 3 things you can hear.",
      hint: weather === "rain" ? "The rain is a good one to start with." : phase === "night" ? "Even a quiet night has a hum. Listen for the smallest sound." : "Something near, something far, and your own breath.",
    },
    { n: 2, sense: "smell", prompt: "Find 2 things you can smell.", hint: "Your hands, a blanket, a cup, the air by a window." },
    { n: 1, sense: "taste", prompt: "Notice 1 thing you can taste.", hint: "Or take a slow sip of water and notice it." },
  ];
}

/** 5-4-3-2-1 grounding, guided by Lotl and tied to the real sky outside. */
export function Grounding({ onDone }: { onDone: () => void }) {
  const { phase, weather } = useSky();
  const list = steps(phase, weather);
  const [i, setI] = useState(0);
  const [noticed, setNoticed] = useState(0);
  const step = list[i];

  if (!step) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Lotl mood="happy" className="pop-in h-36 w-auto" title="Lotl, happy" />
        <h2 className="font-display text-[34px] leading-tight">You&apos;re here, <span className="tone">right now.</span></h2>
        <p className="max-w-xs text-on-sky-soft">Fifteen small things, noticed one at a time. That&apos;s you, coming back to the room.</p>
        <PillButton variant="white" onClick={onDone}>Done</PillButton>
      </div>
    );
  }

  function notice() {
    if (noticed + 1 >= step.n) {
      setI((x) => x + 1);
      setNoticed(0);
    } else {
      setNoticed((x) => x + 1);
    }
  }

  return (
    <div key={i} className="enter flex flex-1 flex-col items-center justify-center gap-5 text-center">
      <span className="font-display grid h-24 w-24 place-items-center rounded-full border border-white/25 bg-white/10 text-6xl">{step.n}</span>
      <div>
        <h2 className="font-display text-[32px] leading-tight">{step.prompt}</h2>
        <p className="mx-auto mt-2 max-w-xs text-on-sky-soft">{step.hint}</p>
      </div>
      <ol aria-label={`${noticed} of ${step.n} noticed`} className="flex gap-2.5">
        {Array.from({ length: step.n }, (_, k) => (
          <li
            key={k}
            className={"h-5 w-5 rounded-full border-2 border-white/70 transition-all duration-500 " + (k < noticed ? "awake-light scale-110 border-transparent" : "")}
          />
        ))}
      </ol>
      <PillButton variant="white" onClick={notice} className="min-w-60">
        I noticed one
      </PillButton>
      <Lotl className="h-20 w-auto" title="" bubbles />
    </div>
  );
}
