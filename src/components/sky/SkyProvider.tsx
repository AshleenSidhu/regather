"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { phaseForHour, phaseForSun, type CalmWeather, type Phase, type SunTimes } from "@/lib/sky";
import { Sky } from "./Sky";

export type { Phase } from "@/lib/sky";

export type ClientSkyReport = {
  weather: CalmWeather;
  tempC: number;
  sunrise: number;
  sunset: number;
  city: string;
};

const STORE_KEY = "rg-sky";

/**
 * Runs in <head> before first paint, so someone opening the app at 2 a.m. never sees a flash
 * of daytime sky. Uses the last known sun times for their city (moved to today), else the clock.
 * Keep in sync with phaseForSun / phaseForHour in lib/sky.ts.
 */
export const PHASE_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,n=Date.now(),h=new Date().getHours(),p=h>=5&&h<7?"dawn":h>=7&&h<17?"day":h>=17&&h<19?"golden":h>=19&&h<21?"dusk":"night",w="clear";var s=JSON.parse(localStorage.getItem("${STORE_KEY}")||"null");if(s&&s.sunrise){var t=function(x){var a=new Date(x),b=new Date();b.setHours(a.getHours(),a.getMinutes(),0,0);return b.getTime()};var r=t(s.sunrise),u=t(s.sunset),M=60000;p=n>=r-50*M&&n<r+40*M?"dawn":n>=r+40*M&&n<u-70*M?"day":n>=u-70*M&&n<u-5*M?"golden":n>=u-5*M&&n<u+55*M?"dusk":"night";if(n-s.at<6*3600000)w=s.weather||"clear"}d.dataset.phase=p;d.dataset.weather=w}catch(e){}})()`;

// Move stored sun times onto today's date (they shift by only a few minutes a day).
function sunToday(sun: SunTimes): SunTimes {
  const move = (ms: number) => {
    const a = new Date(ms);
    const b = new Date();
    b.setHours(a.getHours(), a.getMinutes(), 0, 0);
    return b.getTime();
  };
  return { sunrise: move(sun.sunrise), sunset: move(sun.sunset) };
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60 * 1000);
  return () => clearInterval(id);
}
// A minute-resolution clock, so the snapshot is stable between ticks.
const getMinute = () => Math.floor(Date.now() / 60000);
const getServerMinute = () => 0;

type SkyContextValue = {
  phase: Phase;
  weather: CalmWeather;
  report: ClientSkyReport | null;
  setReport: (r: ClientSkyReport | null) => void;
};

const SkyContext = createContext<SkyContextValue | null>(null);

export function useSky() {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error("useSky must be used inside <SkyProvider>");
  return ctx;
}

export function SkyProvider({ children }: { children: React.ReactNode }) {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const [report, setReportState] = useState<ClientSkyReport | null>(null);

  const phase: Phase = useMemo(() => {
    if (minute === 0) return "night"; // server render; the boot script already set the real one
    const now = minute * 60000;
    return report ? phaseForSun(now, sunToday(report)) : phaseForHour(new Date(now).getHours());
  }, [minute, report]);
  const weather: CalmWeather = report?.weather ?? "clear";

  const setReport = useCallback((r: ClientSkyReport | null) => {
    setReportState(r);
    if (!r) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ sunrise: r.sunrise, sunset: r.sunset, weather: r.weather, at: Date.now() }));
    } catch {
      /* private mode: the sky just follows the clock next time */
    }
  }, []);

  useEffect(() => {
    if (minute === 0) return;
    const el = document.documentElement;
    el.dataset.phase = phase;
    // Before a report arrives, keep whatever the boot script found.
    if (report) el.dataset.weather = weather;
  }, [phase, weather, report, minute]);

  const value = useMemo(() => ({ phase, weather, report, setReport }), [phase, weather, report, setReport]);

  return (
    <SkyContext.Provider value={value}>
      <Sky />
      {children}
    </SkyContext.Provider>
  );
}

/** Drop this anywhere with the server's report to switch the sky to the real sun and weather. */
export function SkyReportSync({ report }: { report: ClientSkyReport | null }) {
  const { setReport } = useSky();
  useEffect(() => {
    setReport(report);
  }, [report, setReport]);
  return null;
}
