import Link from "next/link";
import { Axolotl } from "@/components/axolotl/Axolotl";
import { Card } from "@/components/ui/Card";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RequestActions } from "./RequestActions";

export const metadata = { title: "Chats · Regather" };

const EMOJI: Record<string, string> = { shell: "🐚", lily: "🪷", axolotl: "🦎" };

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
  const emoji = (id: string) => EMOJI[byId.get(id)?.sticker ?? ""] ?? "";

  const hasRequests = (incoming?.length ?? 0) + (mentorRequests?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="text-3xl font-bold text-on-sky">Chats</h1>

      {hasRequests && (
        <section aria-label="Requests" className="flex flex-col gap-3">
          <h2 className="font-bold text-on-sky">Waiting for you</h2>
          {incoming?.map((r) => (
            <Card key={r.id} tone="lilac" className="flex items-center justify-between gap-3 p-4!">
              <p className="font-semibold">{emoji(r.requester_id)} {name(r.requester_id)} would like to chat 1:1</p>
              <RequestActions id={r.id} kind="connection" />
            </Card>
          ))}
          {mentorRequests?.map((r) => (
            <Card key={r.id} tone="mint" className="flex items-center justify-between gap-3 p-4!">
              <p className="font-semibold">{emoji(r.requester_id)} {name(r.requester_id)} asked for a 1:1 with you</p>
              <RequestActions id={r.id} kind="mentor" />
            </Card>
          ))}
        </section>
      )}

      <section aria-label="Your chats" className="flex flex-col gap-3">
        {!threads?.length ? (
          <Card tone="cream" className="text-center">
            <Axolotl resting className="mx-auto h-28 w-auto" />
            <p className="mt-2 font-semibold">No private chats yet.</p>
            <p className="text-ink-soft">
              Tap &ldquo;Who&apos;s here&rdquo; in your circle to ask someone to chat. Both of you need to agree.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {threads.map((t) => {
              const other = t.user_a === viewer.userId ? t.user_b : t.user_a;
              return (
                <li key={t.id}>
                  <Link href={`/chats/${t.id}`} className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    <Card tone="cream" className="p-4!">
                      <p className="text-lg font-bold">{emoji(other)} {name(other)}</p>
                      <p className="text-sm text-ink-soft">{t.kind === "mentor" ? "Mentor chat · moderated" : "Private chat"}</p>
                    </Card>
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
