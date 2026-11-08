import { LiveRefresh } from "@/components/dashboard/LiveRefresh";
import { requirePartner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FlagList, type FlagRow } from "./FlagList";

export const metadata = { title: "Flags · Regather" };

export default async function FlagsPage() {
  const partner = await requirePartner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_flag_queue")
    .select("id, created_at, severity, source, context, status, snapshot, review_note, sender_nickname")
    .order("created_at", { ascending: false })
    .limit(100);

  const flags: FlagRow[] = (data ?? []).map((f) => ({
    id: f.id!,
    createdAt: f.created_at!,
    severity: f.severity!,
    source: f.source!,
    context: f.context!,
    status: f.status!,
    snapshot: f.snapshot,
    reviewNote: f.review_note,
    sender: f.sender_nickname,
  }));

  return (
    <div className="flex flex-col gap-4">
      <LiveRefresh partnerId={partner.partnerId} />
      <h1 className="text-3xl font-bold text-on-sky">Flags</h1>
      <p className="text-on-sky/85">
        Messages and notes that may show someone is in danger, and help requests. People who triggered a flag
        have already been shown crisis numbers. This list updates live.
      </p>
      <FlagList flags={flags} canReview={partner.isModerator} />
    </div>
  );
}
