import { Card } from "@/components/ui/Card";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Ponds · Regather" };

export default async function CirclesPage() {
  await requirePartner();
  const supabase = await createClient();
  const { data: circles } = await supabase.rpc("partner_circle_activity");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-4xl font-semibold text-on-sky">Ponds</h1>
      <p className="text-on-sky-soft">Counts only. Pond conversations are private to their members.</p>
      <Card tone="cream" className="overflow-x-auto p-0!">
        <table className="w-full min-w-[34rem] text-left">
          <caption className="sr-only">Pond activity</caption>
          <thead>
            <tr className="border-b border-ink/10 text-sm text-ink-soft">
              <th scope="col" className="px-5 py-3">Pond</th>
              <th scope="col" className="px-3 py-3">Type</th>
              <th scope="col" className="px-3 py-3">Members</th>
              <th scope="col" className="px-3 py-3">Messages (24h)</th>
              <th scope="col" className="px-3 py-3">Last activity</th>
              <th scope="col" className="px-5 py-3">Mentor</th>
            </tr>
          </thead>
          <tbody>
            {(circles ?? []).map((c) => (
              <tr key={c.circle_id} className="border-b border-ink/5 last:border-0">
                <th scope="row" className="px-5 py-3 font-bold">{c.circle_name}</th>
                <td className="px-3 py-3 capitalize">{c.kind.replace("_", " ")}</td>
                <td className="px-3 py-3">{c.members}</td>
                <td className="px-3 py-3">{c.messages_24h}</td>
                <td className="px-3 py-3 text-ink-soft">
                  <time dateTime={c.last_message_at ?? undefined} suppressHydrationWarning>
                    {c.last_message_at ? new Date(c.last_message_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "No messages yet"}
                  </time>
                </td>
                <td className="px-5 py-3">{c.mentor_nickname ?? "Not assigned"}</td>
              </tr>
            ))}
            {!circles?.length && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-soft">No ponds yet. They appear as families join.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
