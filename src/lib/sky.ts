// Shared sky maths: time-of-day phase, the real moon phase, and the calm weather vocabulary.
// Pure functions only, safe on the server and in the browser.

export type Phase = "dawn" | "day" | "golden" | "dusk" | "night";

/** Weather, always shown in its calmest version. */
export type CalmWeather = "clear" | "cloudy" | "rain" | "snow" | "mist" | "frost" | "breeze";

export type SunTimes = { sunrise: number; sunset: number }; // epoch ms, for today

export const PHASES: { id: Phase; label: string }[] = [
  { id: "dawn", label: "Dawn" },
  { id: "day", label: "Day" },
  { id: "golden", label: "Golden hour" },
  { id: "dusk", label: "Dusk" },
  { id: "night", label: "Night" },
];

/** Fallback from the device clock alone (before we know the real sun times). */
export function phaseForHour(hour: number): Phase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "golden";
  if (hour >= 19 && hour < 21) return "dusk";
  return "night";
}

const MIN = 60 * 1000;

/** The real phase from today's sunrise and sunset in the person's city. */
export function phaseForSun(now: number, sun: SunTimes): Phase {
  const { sunrise, sunset } = sun;
  if (now >= sunrise - 50 * MIN && now < sunrise + 40 * MIN) return "dawn";
  if (now >= sunrise + 40 * MIN && now < sunset - 70 * MIN) return "day";
  if (now >= sunset - 70 * MIN && now < sunset - 5 * MIN) return "golden";
  if (now >= sunset - 5 * MIN && now < sunset + 55 * MIN) return "dusk";
  return "night";
}

/**
 * Fraction of the way through the lunar cycle: 0 = new, 0.5 = full.
 * Reference new moon: 2000-01-06 18:14 UTC; synodic month 29.530588853 days.
 */
export function moonFraction(date: Date): number {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - ref) / 86400000;
  const f = (days % synodic) / synodic;
  return f < 0 ? f + 1 : f;
}

export function moonName(f: number): string {
  if (f < 0.03 || f > 0.97) return "new moon";
  if (f < 0.22) return "waxing crescent";
  if (f < 0.28) return "first-quarter moon";
  if (f < 0.47) return "waxing gibbous";
  if (f < 0.53) return "full moon";
  if (f < 0.72) return "waning gibbous";
  if (f < 0.78) return "last-quarter moon";
  return "waning crescent";
}

/**
 * SVG path for the lit part of a moon of radius r centred on (cx, cy), as seen from
 * the northern hemisphere (waxing = lit on the right).
 */
export function moonLitPath(f: number, cx: number, cy: number, r: number): string {
  const k = Math.cos(2 * Math.PI * f); // 1 at new, -1 at full
  const waxing = f < 0.5;
  const rx = Math.max(0.01, r * Math.abs(k));
  const outerSweep = waxing ? 1 : 0;
  const termSweep = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  return `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outerSweep} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${termSweep} ${cx} ${cy - r} Z`;
}

/** WMO weather code (Open-Meteo) + temperature + wind -> the calm version we show. */
export function calmWeatherFrom(code: number, tempC: number, windKmh: number): CalmWeather {
  if (tempC <= -18) return "frost";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  // drizzle, rain, freezing rain, showers, thunderstorms and hail all become soft rain
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if (code === 45 || code === 48) return "mist";
  if (windKmh >= 40) return "breeze";
  if (code === 2 || code === 3) return "cloudy";
  return "clear";
}

export const WEATHER_WORDS: Record<CalmWeather, string> = {
  clear: "clear skies",
  cloudy: "soft clouds",
  rain: "gentle rain",
  snow: "slow snow",
  mist: "a soft haze",
  frost: "a frosty night",
  breeze: "a breeze",
};

/** City picklist (matches profile_details.city) -> coordinates of the city centre only. */
export const CITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  calgary: { lat: 51.05, lon: -114.07, label: "Calgary" },
  edmonton: { lat: 53.55, lon: -113.49, label: "Edmonton" },
  vancouver: { lat: 49.28, lon: -123.12, label: "Vancouver" },
  victoria: { lat: 48.43, lon: -123.37, label: "Victoria" },
  winnipeg: { lat: 49.9, lon: -97.14, label: "Winnipeg" },
  toronto: { lat: 43.65, lon: -79.38, label: "Toronto" },
  ottawa: { lat: 45.42, lon: -75.7, label: "Ottawa" },
  montreal: { lat: 45.5, lon: -73.57, label: "Montréal" },
  halifax: { lat: 44.65, lon: -63.57, label: "Halifax" },
};
