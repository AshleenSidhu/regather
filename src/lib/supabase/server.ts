import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/lib/database.types";
import { AUTH_COOKIE_OPTIONS } from "./cookie-options";

// Session cookies are httpOnly (see cookie-options.ts). The browser only ever gets a
// short-lived access token on demand, for Realtime (see getRealtimeToken in actions/chat.ts).
export async function createClient() {
  // Everything that talks to Supabase as a signed-in user is per-request (the auth library
  // reads the clock to check token expiry), so say so explicitly. This keeps Cache
  // Components from flagging it as an unstable value during prerender.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component: cookies can't be written here.
            // The proxy refreshes sessions, so this is safe to ignore.
          }
        },
      },
    },
  );
}
