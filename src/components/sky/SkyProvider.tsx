"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Sky } from "./Sky";

export type Phase = "dawn" | "day" | "golden" | "dusk" | "night";

export const PHASES: { id: Phase; label: string }[] = [
  { id: "dawn", label: "Dawn" },
  { id: "day", label: "Day" },
  { id: "golden", label: "Golden hour" },
  { id: "dusk", label: "Dusk" },
  { id: "night", label: "Night" },
];

// Time of day comes from the device clock only. No location, no network.
export function phaseForHour(hour: number): Phase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "golden";
  if (hour >= 19 && hour < 21) return "dusk";
  return "night";
}

/**
 * Runs in <head> before first paint (see layout.tsx), so someone opening the app at 2 a.m.
 * never sees a flash of daytime sky. Keep in sync with phaseForHour above.
 */
export const PHASE_BOOT_SCRIPT = `(function(){try{var h=new Date().getHours();var p=h>=5&&h<7?"dawn":h>=7&&h<17?"day":h>=17&&h<19?"golden":h>=19&&h<21?"dusk":"night";document.documentElement.dataset.phase=p}catch(e){}})()`;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60 * 1000);
  return () => clearInterval(id);
}
const getClockPhase = (): Phase => phaseForHour(new Date().getHours());
const getServerPhase = (): Phase => "day";

type SkyContextValue = {
  phase: Phase;
  /** null means "follow the real clock" */
  override: Phase | null;
  setOverride: (phase: Phase | null) => void;
};

const SkyContext = createContext<SkyContextValue | null>(null);

export function useSky() {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error("useSky must be used inside <SkyProvider>");
  return ctx;
}

export function SkyProvider({ children }: { children: React.ReactNode }) {
  const clockPhase = useSyncExternalStore(subscribe, getClockPhase, getServerPhase);
  const [override, setOverride] = useState<Phase | null>(null);
  const phase = override ?? clockPhase;

  // Write the sky to <html>. Reads the clock directly (not the hydration snapshot) so it
  // never overwrites the correct phase that the boot script already set.
  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.phase = override ?? phaseForHour(new Date().getHours());
    };
    apply();
    if (override) return;
    const id = setInterval(apply, 60 * 1000);
    return () => clearInterval(id);
  }, [override]);

  const value = useMemo(() => ({ phase, override, setOverride }), [phase, override]);

  return (
    <SkyContext.Provider value={value}>
      <Sky />
      {children}
    </SkyContext.Provider>
  );
}
