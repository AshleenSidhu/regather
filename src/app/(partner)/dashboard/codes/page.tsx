import { Card } from "@/components/ui/Card";
import { requirePartner } from "@/lib/auth";
import { nowMs } from "@/lib/time";
import { ROLE_LABELS, type AppRole } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import { CodeForm } from "./CodeForm";
import { RevokeButton } from "./RevokeButton";

export const metadata = { title: "Invite codes · Regather" };

export default async function CodesPage() {
  await requirePartner();
  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("partner_codes")
    .select("id, role, age_band, label, max_uses, uses, expires_at, revoked_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const now = nowMs();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl font-semibold text-on-sky">Invite codes</h1>
      <p className="text-on-sky-soft">
        Each code sets one role and age band, expires, and can be used a limited number of times. A code is shown once, when you make it.
      </p>

      <CodeForm />

      <Card tone="cream" className="overflow-x-auto p-0!">
        <table className="w-full min-w-[36rem] text-left">
          <caption className="sr-only">Your invite codes</caption>
          <thead>
            <tr className="border-b border-ink/10 text-sm text-ink-soft">
              <th scope="col" className="px-5 py-3">For</th>
              <th scope="col" className="px-3 py-3">Label</th>
              <th scope="col" className="px-3 py-3">Used</th>
              <th scope="col" className="px-3 py-3">Expires</th>
              <th scope="col" className="px-3 py-3">Status</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {(codes ?? []).map((c) => {
              const expired = new Date(c.expires_at).getTime() <= now;
              const used = c.uses >= c.max_uses;
              const status = c.revoked_at ? "Revoked" : expired ? "Expired" : used ? "Used up" : "Active";
              return (
                <tr key={c.id} className="border-b border-ink/5 last:border-0">
                  <th scope="row" className="px-5 py-3 font-bold">
                    {ROLE_LABELS[c.role as AppRole]} <span className="font-normal text-ink-soft">({c.age_band.replace("_", "–").replace("25–plus", "25+")})</span>
                  </th>
                  <td className="px-3 py-3 text-ink-soft">{c.label ?? "—"}</td>
                  <td className="px-3 py-3">{c.uses}/{c.max_uses}</td>
                  <td className="px-3 py-3 text-ink-soft">
                    <time dateTime={c.expires_at} suppressHydrationWarning>
                      {new Date(c.expires_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </time>
                  </td>
                  <td className="px-3 py-3">
                    <span className={"rounded-full px-3 py-1 text-sm font-semibold " + (status === "Active" ? "bg-mint" : "bg-white")}>{status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">{status === "Active" && <RevokeButton id={c.id} />}</td>
                </tr>
              );
            })}
            {!codes?.length && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-ink-soft">No codes yet. Make your first one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
