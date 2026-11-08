"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser client used ONLY for Realtime. It never stores a session: the server hands
// over a short-lived access token (getRealtimeToken) and we pass it to Realtime, so the
// httpOnly session cookie stays out of reach of page scripts.
let client: SupabaseClient | null = null;

export function getRealtimeClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }
  return client;
}
