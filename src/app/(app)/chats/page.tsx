import Link from "next/link";
import { Lotl } from "@/components/lotl/Lotl";
import { Sticker } from "@/components/ui/Icons";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RequestActions } from "./RequestActions";

export const metadata = { title: "Chats · Regather" };

type Who = { id: string; nickname: string; sticker: string } | null;

export default async function ChatsPage() {
  const viewer = await requireMember();
  const supabase = await createClient();

  const [{ data: threads }, { data: incoming }, { data: mentorRequests }] = await Promise.all([
    supabase.from("threads").select("id, kind, user_a, user_b, created_at").order("created_at", { ascending: false }),
    supabase.from("connections").select("id, requester_id").eq("addressee_id", viewer.userId).eq("status", "requested"),
    supabase.from("mentor_requests").select("id, requester_id").eq("mentor_id", viewer.userId).eq("status", "requested"),
  ]);

  // Look up nicknames for everyone involved in one query (RLS only returns people we may see).
  const ids = new Set<string>();
  for (const t of threads ?? []) ids.add(t.user_a === viewer.userId ? t.user_b : t.user_a);
  for (const r of incoming ?? []) ids.add(r.requester_id);
  for (const r of mentorRequests ?? []) ids.add(r.requester_id);
  const { data: profs } = ids.size
    ? await supabase.from("profiles").select("id, nickname, sticker").in("id", [...ids])
    : { data: [] as NonNullable<Who>[] };
  const byId = new Map((profs ?? []).map((p) => [p.id, p]));
  const name = (id: string) => byId.get(id)?.nickname ?? "Someone";
  const sticker = (id: string) => <Sticker kind={byId.get(id)?.sticker ?? "axolotl"} className="h-10 w-10 shrink-0" />;

  const hasRequests = (incoming?.length ?? 0) + (mentorRequests?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="enter">
        <h1 className="font-display text-[40px] leading-tight">Your <span className="tone">chats</span></h1>
        <p className="text-on-sky-soft">One-to-one, only when you both say yes.</p>
      </div>

      {hasRequests && (
        <section aria-label="Requests" className="flex flex-col gap-3">
          <h2 className="font-display text-[26px]">Waiting <span className="tone-soft">for you</span></h2>
          {incoming?.map((r) => (
            <div key={r.id} className="paper enter flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="flex items-center gap-2 font-bold">{sticker(r.requester_id)} {name(r.requester_id)} would like to chat 1:1</p>
              <RequestActions id={r.id} kind="connection" />
            </div>
          ))}
          {mentorRequests?.map((r) => (
            <div key={r.id} className="paper enter flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="flex items-center gap-2 font-bold">{sticker(r.requester_id)} {name(r.requester_id)} asked to talk with you</p>
              <RequestActions id={r.id} kind="mentor" />
            </div>
          ))}
        </section>
      )}

      <section aria-label="Your chats" className="flex flex-col gap-3">
        {!threads?.length ? (
          <div className="paper p-6 text-center">
            <Lotl mood="sleep" className="mx-auto h-24 w-auto" title="" />
            <p className="mt-2 font-extrabold">No private chats yet.</p>
            <p className="text-ink-soft">
              Tap &ldquo;Who&apos;s here&rdquo; in your pond to ask someone to chat. You both need to say yes.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {threads.map((t) => {
              const other = t.user_a === viewer.userId ? t.user_b : t.user_a;
              return (
                <li key={t.id}>
                  <Link href={`/chats/${t.id}`} className="lift paper flex items-center gap-3 p-4">
                    {sticker(other)}
                    <span>
                      <span className="block text-lg font-extrabold">{name(other)}</span>
                      <span className="block text-sm text-ink-soft">{t.kind === "mentor" ? "Mentor chat · a moderator can see it" : "Private chat"}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
