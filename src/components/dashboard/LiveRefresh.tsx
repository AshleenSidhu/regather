"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRealtimeTokenAction } from "@/app/actions/chat";
import { getRealtimeClient } from "@/lib/supabase/browser";

/**
 * Re-fetches the page whenever a flag for this partner is created or updated.
 * Uses postgres_changes on `flags` (RLS: only moderators of the partner receive rows)
 * over a private channel that the database authorizes (partner:<id>).
 */
export function LiveRefresh({ partnerId }: { partnerId: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    const client = getRealtimeClient();

    async function start() {
      const { token } = await getRealtimeTokenAction();
      if (!token || cancelled) return;
      client.realtime.setAuth(token);
      channel = client
        .channel(`partner:${partnerId}`, { config: { private: true } })
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "flags", filter: `partner_id=eq.${partnerId}` },
          () => router.refresh(),
        )
        .subscribe();
      timer = setInterval(async () => {
        const next = await getRealtimeTokenAction();
        if (next.token) client.realtime.setAuth(next.token);
      }, 40 * 60 * 1000);
    }

    void start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (channel) void client.removeChannel(channel);
    };
  }, [partnerId, router]);

  return null;
}
