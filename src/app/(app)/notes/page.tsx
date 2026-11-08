import { Axolotl } from "@/components/axolotl/Axolotl";
import { Card } from "@/components/ui/Card";
import { KeepButton } from "@/components/notes/KeepButton";
import { NoteCard, type NoteView } from "@/components/notes/NoteCard";
import { NoteComposer, type Recipient } from "@/components/notes/NoteComposer";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notes · Regather" };

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

  const jar: (NoteView & { savedFlag: boolean })[] = (received ?? []).map((n) => ({
    id: n.id, body: n.body, sticker: n.sticker, color: n.color, createdAt: n.created_at,
    who: `From ${people.get(n.sender_id)?.nickname ?? "someone"}`, savedFlag: n.saved_to_jar,
  }));

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div>
        <h1 className="text-3xl font-bold text-on-sky">Notes</h1>
        <p className="text-on-sky/85">Small things for when words are hard.</p>
      </div>

      <NoteComposer recipients={recipients} />

      <section aria-label="Your comfort jar" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-on-sky">Your comfort jar</h2>
        {jar.length === 0 ? (
          <Card tone="cream" className="text-center">
            <Axolotl resting className="mx-auto h-28 w-auto" />
            <p className="mt-2 font-semibold">Nothing here yet.</p>
            <p className="text-ink-soft">When someone sends you a note, it&apos;ll swim in here.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {jar.map((n, i) => (
              <li key={n.id}>
                <NoteCard note={n} delayMs={i * 80} footer={<KeepButton id={n.id} saved={n.savedFlag} />} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {sent && sent.length > 0 && (
        <section aria-label="Notes you sent" className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-on-sky">Sent by you</h2>
          <ul className="flex flex-col gap-3">
            {sent.map((n, i) => (
              <li key={n.id}>
                <NoteCard
                  delayMs={i * 60}
                  note={{
                    id: n.id, body: n.body, sticker: n.sticker, color: n.color, createdAt: n.created_at,
                    who: `To ${people.get(n.recipient_id)?.nickname ?? "someone"}`,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
