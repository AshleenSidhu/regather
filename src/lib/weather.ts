import "server-only";
import { cacheLife } from "next/cache";
import { CITY_COORDS, calmWeatherFrom, type CalmWeather } from "@/lib/sky";

export type SkyReport = {
  weather: CalmWeather;
  tempC: number;
  /** Today's sunrise and sunset, epoch ms. */
  sunrise: number;
  sunset: number;
  city: string;
};

/**
 * The calm weather for a city, fetched by the SERVER from Open-Meteo (free, no key).
 * Only the city centre's coordinates are sent: never the person's device, IP or exact
 * location. Cached per city for about an hour, so many people share one request.
 */
export async function getSkyReport(city: string | null): Promise<SkyReport | null> {
  if (!city || !(city in CITY_COORDS)) return null;
  return fetchSkyReport(city);
}

async function fetchSkyReport(city: string): Promise<SkyReport | null> {
  "use cache";
  cacheLife("hours");

  const c = CITY_COORDS[city];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m&daily=sunrise,sunset` +
    `&timezone=UTC&timeformat=unixtime&forecast_days=1`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number };
      daily?: { sunrise?: number[]; sunset?: number[] };
    };
    const cur = j.current ?? {};
    const sunrise = j.daily?.sunrise?.[0];
    const sunset = j.daily?.sunset?.[0];
    if (typeof sunrise !== "number" || typeof sunset !== "number") return null;
    const tempC = cur.temperature_2m ?? 10;
    return {
      weather: calmWeatherFrom(cur.weather_code ?? 0, tempC, cur.wind_speed_10m ?? 0),
      tempC: Math.round(tempC),
      sunrise: sunrise * 1000,
      sunset: sunset * 1000,
      city: c.label,
    };
  } catch {
    return null; // the sky simply follows the clock instead
  }
}
