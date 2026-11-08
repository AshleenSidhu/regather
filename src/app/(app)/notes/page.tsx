import { Lotl } from "@/components/lotl/Lotl";
import { ArrivedNote } from "@/components/notes/ArrivedNote";
import { ComfortJar } from "@/components/notes/ComfortJar";
import { NoteCard, type NoteView } from "@/components/notes/NoteCard";
import { NoteComposer, type Recipient } from "@/components/notes/NoteComposer";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Comfort jar · Regather" };

export default async function NotesPage() {
  const viewer = await requireMember();
  const supabase = await createClient();

  const [{ data: received }, { data: sent }, { data: memberRows }] = await Promise.all([
    supabase
      .from("comfort_notes")
      .select("id, sender_id, sticker, color, body, saved_to_jar, created_at")
      .eq("recipient_id", viewer.userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("comfort_notes")
      .select("id, recipient_id, sticker, color, body, created_at")
      .eq("sender_id", viewer.userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("circle_members").select("profiles(id, nickname, audience, sticker)"),
  ]);

  const people = new Map<string, { nickname: string; sticker: string; audience: string }>();
  for (const row of memberRows ?? []) {
    const p = row.profiles as unknown as { id: string; nickname: string; audience: string; sticker: string } | null;
    if (p) people.set(p.id, p);
  }
  // Notes go only to people of the same audience (never adult <-> minor). The database enforces it too.
  const recipients: Recipient[] = [...people.entries()]
    .filter(([id, p]) => id !== viewer.userId && p.audience === viewer.audience)
    .map(([id, p]) => ({ id, nickname: p.nickname, sticker: p.sticker }));

  const nameOf = async (ids: string[]) => {
    const missing = ids.filter((id) => !people.has(id));
    if (!missing.length) return;
    const { data } = await supabase.from("profiles").select("id, nickname, sticker, audience").in("id", missing);
    for (const p of data ?? []) people.set(p.id, p);
  };
  await nameOf([...(received ?? []).map((n) => n.sender_id), ...(sent ?? []).map((n) => n.recipient_id)]);

  const all: (NoteView & { savedFlag: boolean })[] = (received ?? []).map((n) => ({
    id: n.id, body: n.body, sticker: n.sticker, color: n.color, createdAt: n.created_at,
    who: `From ${people.get(n.sender_id)?.nickname ?? "someone"}`, savedFlag: n.saved_to_jar,
  }));
  const kept = all.filter((n) => n.savedFlag);
  const arrived = all.filter((n) => !n.savedFlag);

  return (
    <div className="flex flex-col gap-6 pt-1">
      <div className="enter">
        <h1 className="font-display text-[40px] leading-tight">Your comfort <span className="tone">jar</span></h1>
        <p className="text-on-sky-soft">
          {kept.length
            ? `${kept.length} kind ${kept.length === 1 ? "note" : "notes"} kept. Tap the jar on a hard day.`
            : "Notes you keep will gather and glow in here."}
        </p>
      </div>

      <div className="enter" style={{ "--delay": "120ms" } as React.CSSProperties}>
        <ComfortJar notes={kept} />
      </div>

      {arrived.length > 0 && (
        <section aria-labelledby="arrived" className="flex flex-col gap-3">
          <h2 id="arrived" className="font-display text-[28px]">Arrived <span className="tone-soft">for you</span></h2>
          <ul className="flex flex-col gap-3">
            {arrived.map((n, i) => (
              <li key={n.id}>
                <ArrivedNote note={n} delayMs={i * 90} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {kept.length === 0 && arrived.length === 0 && (
        <div className="paper flex items-center gap-3 p-4">
          <Lotl mood="sleep" className="h-16 w-auto shrink-0" title="" />
          <p className="text-ink-soft">When someone sends you a note, Lotl will swim it right here.</p>
        </div>
      )}

      <NoteComposer recipients={recipients} />

      {sent && sent.length > 0 && (
        <details className="group">
          <summary className="chip min-h-12! w-full cursor-pointer list-none justify-between px-5!">
            Notes you sent ({sent.length})
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {sent.map((n) => (
              <li key={n.id}>
                <NoteCard
                  note={{
                    id: n.id, body: n.body, sticker: n.sticker, color: n.color, createdAt: n.created_at,
                    who: `To ${people.get(n.recipient_id)?.nickname ?? "someone"}`,
                  }}
                />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
