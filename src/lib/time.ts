import "server-only";

/**
 * The current time, for server pages that run once per request (never re-rendered).
 * Kept in one helper so the intent is explicit.
 */
export function nowMs(): number {
  return Date.now();
}
