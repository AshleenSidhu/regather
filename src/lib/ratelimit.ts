import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** A salted hash of the caller's IP. We never store the raw address. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT ?? ""}|${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Fixed-window rate limit, backed by the database (so it works across serverless
 * instances). Returns true if the attempt is allowed. Fails CLOSED on any error.
 */
export async function allow(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("rl_hit", {
    p_bucket: bucket,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) return false;
  return data === true;
}
