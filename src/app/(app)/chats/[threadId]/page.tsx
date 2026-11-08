import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatRoom, type ChatMessage, type ChatPerson } from "@/components/chat/ChatRoom";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

export const metadata = { title: "Chat · Regather" };

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  if (!uuid.safeParse(threadId).success) notFound();
  const viewer = await requireMember();
  const supabase = await createClient();

  // RLS: only the two participants can see a thread.
  const { data: thread } = await supabase
    .from("threads")
    .select("id, kind, user_a, user_b")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) notFound();

  const otherId = thread.user_a === viewer.userId ? thread.user_b : thread.user_a;
  const [{ data: other }, { data: msgRows }] = await Promise.all([
    supabase.from("profiles").select("id, nickname, sticker, role").eq("id", otherId).maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, kind, body, checkin_score, redacted, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const people: Record<string, ChatPerson> = {
    [viewer.userId]: { nickname: viewer.nickname, sticker: viewer.sticker, role: viewer.role },
  };
  if (other) people[other.id] = { nickname: other.nickname, sticker: other.sticker, role: other.role };

  const initialMessages: ChatMessage[] = (msgRows ?? [])
    .map((r) => ({
      id: r.id, senderId: r.sender_id, kind: r.kind, body: r.body, score: r.checkin_score,
      redacted: r.redacted, createdAt: r.created_at,
    }))
    .reverse();

  const moderated = thread.kind === "mentor";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div>
        <Link href="/chats" className="text-sm font-semibold text-on-sky/80 underline underline-offset-4">
          ← All chats
        </Link>
        <h1 className="text-3xl font-bold text-on-sky">{other?.nickname ?? "Chat"}</h1>
      </div>
      <p className="rounded-2xl bg-white/80 px-4 py-2.5 text-sm text-ink-soft" role="note">
        {moderated
          ? "This is a mentor chat. A moderator at your program can review it to keep everyone safe."
          : "Private chats are checked for safety. Phone numbers and addresses are hidden for now."}
      </p>
      <ChatRoom
        threadId={thread.id}
        meId={viewer.userId}
        people={people}
        initialMessages={initialMessages}
        emptyText="Say hi whenever you're ready."
      />
    </div>
  );
}
