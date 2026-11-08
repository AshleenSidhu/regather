import { notFound } from "next/navigation";
import { ChatRoom, type ChatMessage, type ChatPerson } from "@/components/chat/ChatRoom";
import { CircleTools, type MemberRow } from "@/components/chat/CircleTools";
import { SkyNudge } from "@/components/sky/SkyNudge";
import { requireMember } from "@/lib/auth";
import { nowMs } from "@/lib/time";
import type { AppRole } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/schemas";

export const metadata = { title: "Your pond · Regather" };

export default async function CircleChatPage({ params }: { params: Promise<{ circleId: string }> }) {
  const { circleId } = await params;
  if (!uuid.safeParse(circleId).success) notFound();
  const viewer = await requireMember();
  const supabase = await createClient();

  // RLS only returns circles you belong to (or mentor), so a guessed id is just a 404.
  const { data: circle } = await supabase
    .from("circles")
    .select("id, name, kind, mentor_id, cohort_start")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) notFound();

  const since = new Date(nowMs() - 20 * 3600 * 1000).toISOString();
  const [{ data: memberRows }, { data: mentorProfile }, { data: msgRows }, { count: recentCheckins }, { data: conns }] =
    await Promise.all([
      supabase
        .from("circle_members")
        .select("user_id, profiles(id, nickname, role, audience, sticker)")
        .eq("circle_id", circleId),
      circle.mentor_id
        ? supabase.from("profiles").select("id, nickname, role, audience, sticker").eq("id", circle.mentor_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("messages")
        .select("id, sender_id, kind, body, checkin_score, redacted, created_at")
        .eq("circle_id", circleId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circleId)
        .eq("sender_id", viewer.userId)
        .eq("kind", "checkin")
        .gte("created_at", since),
      supabase.from("connections").select("id, requester_id, addressee_id, status"),
    ]);

  const members: MemberRow[] = (memberRows ?? [])
    .map((r) => r.profiles as unknown as MemberRow | null)
    .filter((p): p is MemberRow => p !== null);

  const people: Record<string, ChatPerson> = {};
  for (const m of members) people[m.id] = { nickname: m.nickname, sticker: m.sticker, role: m.role };
  if (mentorProfile) people[mentorProfile.id] = { nickname: mentorProfile.nickname, sticker: mentorProfile.sticker, role: mentorProfile.role };

  const connections: Record<string, { status: "sent" | "received" | "accepted"; connectionId: string }> = {};
  for (const c of conns ?? []) {
    if (c.status === "declined") continue;
    const other = c.requester_id === viewer.userId ? c.addressee_id : c.requester_id;
    connections[other] = {
      connectionId: c.id,
      status: c.status === "accepted" ? "accepted" : c.requester_id === viewer.userId ? "sent" : "received",
    };
  }

  const initialMessages: ChatMessage[] = (msgRows ?? [])
    .map((r) => ({
      id: r.id, senderId: r.sender_id, kind: r.kind, body: r.body, score: r.checkin_score,
      redacted: r.redacted, createdAt: r.created_at,
    }))
    .reverse();

  const week = Math.min(8, Math.max(1, Math.floor((nowMs() - new Date(circle.cohort_start).getTime()) / (7 * 864e5)) + 1));
  const isMentor = viewer.role === "mentor";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="enter">
        <p className="font-display text-[34px] leading-tight">
          Hi, <span className="tone-soft">{viewer.nickname}.</span>
        </p>
        <p className="text-on-sky-soft">Your pond is here, any hour.</p>
      </div>

      <div className="enter flex flex-col gap-3 pt-2" style={{ "--delay": "100ms" } as React.CSSProperties}>
        <span className="chip self-start min-h-8! px-3! text-[13px]">Week {week} of 8</span>
        <h1 className="font-display text-[52px] leading-[0.98]">
          Pond <span className="tone">{circle.name}</span>
        </h1>
        {mentorProfile && <p className="text-on-sky-soft">Guided by {mentorProfile.nickname}, a mentor family who has been there.</p>}
      </div>

      <SkyNudge />

      <CircleTools
        members={members}
        meId={viewer.userId}
        meRole={viewer.role as AppRole}
        meAudience={viewer.audience}
        connections={connections}
        mentorNickname={mentorProfile?.nickname ?? null}
        canAskMentor={!isMentor && Boolean(mentorProfile)}
      />

      <ChatRoom
        circleId={circle.id}
        meId={viewer.userId}
        people={people}
        initialMessages={initialMessages}
        allowCheckin={!isMentor}
        checkedInRecently={(recentCheckins ?? 0) > 0}
        week={week}
      />
    </div>
  );
}
