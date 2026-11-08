import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LiveRefresh } from "@/components/dashboard/LiveRefresh";
import { requirePartner } from "@/lib/auth";
import { nowMs } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview · Regather" };

export default async function DashboardHome() {
  const partner = await requirePartner();
  const supabase = await createClient();

  const [{ count: openFlags }, { data: activity }, { data: codes }, { data: recent }] = await Promise.all([
    supabase.from("flags").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.rpc("partner_circle_activity"),
    supabase.from("partner_codes").select("revoked_at, expires_at, uses, max_uses"),
    supabase
      .from("partner_flag_queue")
      .select("id, severity, context, created_at, status")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const now = nowMs();
  const activeCodes = (codes ?? []).filter(
    (c) => !c.revoked_at && new Date(c.expires_at).getTime() > now && c.uses < c.max_uses,
  ).length;
  const members = (activity ?? []).reduce((n, c) => n + c.members, 0);
  const messages = (activity ?? []).reduce((n, c) => n + c.messages_24h, 0);

  const stats = [
    { label: "Open flags", value: openFlags ?? 0, tone: "blush" as const, href: "/dashboard/flags" },
    { label: "Circles", value: activity?.length ?? 0, tone: "lake" as const, href: "/dashboard/circles" },
    { label: "Members", value: members, tone: "mint" as const, href: "/dashboard/circles" },
    { label: "Active codes", value: activeCodes, tone: "lilac" as const, href: "/dashboard/codes" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh partnerId={partner.partnerId} />
      <h1 className="text-3xl font-bold text-on-sky">Overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <Link key={s.label} href={s.href} className="fade-up rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" style={{ "--delay": `${i * 90}ms` } as React.CSSProperties}>
            <Card tone={s.tone} className="text-center">
              <p className="text-4xl font-extrabold">{s.value}</p>
              <p className="font-semibold text-ink-soft">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card tone="cream">
        <h2 className="mb-1 text-xl font-bold">Needs a look</h2>
        {recent?.length ? (
          <ul className="flex flex-col gap-2">
            {recent.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3">
                <span>
                  <strong className="capitalize">{f.severity}</strong> · {f.context === "sos" ? "asked for help" : `${f.context} message`}
                </span>
                <time dateTime={f.created_at ?? ""} suppressHydrationWarning className="text-sm text-ink-soft">
                  {f.created_at ? new Date(f.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">All clear. Nothing is waiting for review. 🌿</p>
        )}
        <Link href="/dashboard/flags" className="mt-3 inline-block font-semibold underline underline-offset-4">
          Open the flag queue
        </Link>
      </Card>

      <p className="text-sm text-on-sky/80">
        {messages} messages across your circles in the last 24 hours. You see activity counts only, never circle conversations.
      </p>
    </div>
  );
}
