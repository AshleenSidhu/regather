"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRealtimeTokenAction, sendMessageAction } from "@/app/actions/chat";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import { getRealtimeClient } from "@/lib/supabase/browser";

export type ChatMessage = {
  id: string;
  senderId: string;
  kind: "text" | "checkin";
  body: string;
  score: number | null;
  redacted: boolean;
  createdAt: string;
  pending?: boolean;
  failed?: boolean;
};

export type ChatPerson = { nickname: string; sticker: string; role: string };

type Props = {
  /** Exactly one of these is set. */
  circleId?: string;
  threadId?: string;
  meId: string;
  people: Record<string, ChatPerson>;
  initialMessages: ChatMessage[];
  allowCheckin?: boolean;
  checkedInRecently?: boolean;
  emptyText?: string;
};

const STICKER_EMOJI: Record<string, string> = { shell: "🐚", lily: "🪷", axolotl: "🦎" };
const SCORE_WORDS = ["", "rough", "hard", "okay-ish", "good", "great"];
const QUICK_REPLIES = ["I'm here", "Same", "Sending you a hug"];

type Row = {
  id: string;
  sender_id: string;
  kind: "text" | "checkin";
  body: string;
  checkin_score: number | null;
  redacted: boolean;
  created_at: string;
};

const fromRow = (r: Row): ChatMessage => ({
  id: r.id,
  senderId: r.sender_id,
  kind: r.kind,
  body: r.body,
  score: r.checkin_score,
  redacted: r.redacted,
  createdAt: r.created_at,
});

export function ChatRoom({
  circleId, threadId, meId, people, initialMessages,
  allowCheckin = false, checkedInRecently = false,
  emptyText = "It's quiet right now. Say hi, or just read for a while. That counts too.",
}: Props) {
  const { open: openCrisis } = useCrisis();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string>();
  const [awake, setAwake] = useState(0);
  const [checkedIn, setCheckedIn] = useState(checkedInRecently);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const targetId = (circleId ?? threadId)!;
  const topic = circleId ? `circle:${circleId}` : `thread:${threadId}`;
  const column = circleId ? "circle_id" : "thread_id";
  const me = people[meId];

  // Insert or replace by id, so a realtime copy and our own optimistic copy never double up.
  const upsert = useCallback((incoming: ChatMessage) => {
    setMessages((current) => {
      const idx = current.findIndex((m) => m.id === incoming.id);
      if (idx === -1) return [...current, incoming];
      const next = current.slice();
      next[idx] = incoming;
      return next;
    });
  }, []);

  // Realtime: private channel (authorized in the database), RLS-filtered inserts, presence.
  useEffect(() => {
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    const client = getRealtimeClient();

    async function start() {
      const { token } = await getRealtimeTokenAction();
      if (!token || cancelled) return;
      client.realtime.setAuth(token);

      channel = client
        .channel(topic, { config: { private: true, presence: { key: meId } } })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `${column}=eq.${targetId}` },
          (payload) => upsert(fromRow(payload.new as Row)),
        )
        .on("presence", { event: "sync" }, () => {
          setAwake(Object.keys(channel?.presenceState() ?? {}).length);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void channel?.track({ at: Date.now() });
        });

      // The access token lasts about an hour; refresh it quietly in the background.
      refreshTimer = setInterval(async () => {
        const next = await getRealtimeTokenAction();
        if (next.token) client.realtime.setAuth(next.token);
      }, 40 * 60 * 1000);
    }

    void start();
    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      if (channel) void client.removeChannel(channel);
    };
  }, [topic, column, targetId, meId, upsert]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages.length]);

  function send(text: string, kind: "text" | "checkin" = "text", score: number | null = null) {
    const body = kind === "checkin" ? String(score) : text.trim();
    if (!body) return;
    setNotice(undefined);

    const tempId = `tmp-${crypto.randomUUID()}`;
    upsert({
      id: tempId, senderId: meId, kind, body, score, redacted: false,
      createdAt: new Date().toISOString(), pending: true,
    });
    if (kind === "text") setDraft("");

    startTransition(async () => {
      const res = await sendMessageAction({
        circleId: circleId ?? null, threadId: threadId ?? null, body, kind, score,
      });

      if (!res.ok || !res.id) {
        setMessages((cur) => cur.filter((m) => m.id !== tempId));
        if (kind === "text") setDraft(body);
        setNotice(
          res.error === "rate_limited"
            ? "Slow down a little. You can send again in a few seconds."
            : "That didn't send. Please try again.",
        );
        return;
      }

      const realId = res.id;
      setMessages((cur) => {
        const real = cur.find((m) => m.id === realId);
        const without = cur.filter((m) => m.id !== tempId);
        if (real) return without; // the realtime copy already arrived
        const temp = cur.find((m) => m.id === tempId);
        if (!temp) return without;
        return [
          ...without,
          { ...temp, id: realId, pending: false, redacted: res.redacted === true, body: res.redacted ? "[contact details hidden for now]" : temp.body },
        ];
      });
      if (kind === "checkin") setCheckedIn(true);
      if (res.crisis) openCrisis();
    });
  }

  const others = Math.max(0, awake - 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="rounded-2xl bg-white/70 px-4 py-2 text-center text-sm text-ink-soft" role="status">
        {others > 0
          ? `You're not alone right now: ${others} ${others === 1 ? "other is" : "others are"} awake 🌙`
          : "You're not alone. Others will see this when they're up."}
      </p>

      {allowCheckin && !checkedIn && (
        <div className="rounded-card bg-linear-to-b from-white to-lilac/60 p-4 text-center shadow-soft">
          <p className="mb-2 font-bold">How was today?</p>
          <div className="flex justify-center gap-2" role="group" aria-label="Rate your day from 1 to 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => send("", "checkin", n)}
                aria-label={`${n} of 5, ${SCORE_WORDS[n]}`}
                className="grid h-12 w-12 place-items-center rounded-full border border-white bg-white/90 text-lg font-bold shadow-soft transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <ol
        aria-live="polite"
        aria-label="Messages"
        className="flex min-h-[40dvh] flex-1 flex-col gap-2.5 overflow-y-auto pb-2"
      >
        {messages.length === 0 && (
          <li className="m-auto max-w-xs rounded-2xl bg-white/70 px-5 py-4 text-center text-ink-soft">{emptyText}</li>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          const who = people[m.senderId];
          return (
            <li key={m.id} className={"flex flex-col " + (mine ? "items-end" : "items-start")}>
              {!mine && (
                <span className="mb-0.5 ml-3 text-xs font-semibold text-on-sky/80">
                  {STICKER_EMOJI[who?.sticker ?? ""] ?? ""} {who?.nickname ?? "Someone"}
                  {who?.role === "mentor" ? " · mentor" : ""}
                </span>
              )}
              {m.kind === "checkin" ? (
                <p className="rounded-full bg-lilac/80 px-4 py-1.5 text-sm font-semibold text-ink shadow-soft">
                  {mine ? "You" : (who?.nickname ?? "Someone")} checked in: {m.score} · {SCORE_WORDS[m.score ?? 0]}
                </p>
              ) : (
                <p
                  className={
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 shadow-soft transition-opacity " +
                    (mine ? "rounded-br-lg bg-ink text-white " : "rounded-bl-lg bg-white text-ink ") +
                    (m.pending ? "opacity-60" : "opacity-100")
                  }
                >
                  {/* Plain text only. React escapes it; there is no HTML rendering anywhere. */}
                  {m.body}
                </p>
              )}
              <time dateTime={m.createdAt} suppressHydrationWarning className="mx-3 mt-0.5 text-[11px] text-on-sky/60">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </time>
            </li>
          );
        })}
        <div ref={endRef} className="scroll-mb-52" />
      </ol>

      <div className="sticky bottom-[4.6rem] z-10 -mx-1 flex flex-col gap-2 px-1 pb-1 pt-2">
      {notice && (
        <p role="alert" className="rounded-2xl bg-white/85 px-4 py-2 text-sm font-semibold shadow-soft">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-2" aria-label="Quick replies">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            className="min-h-9 rounded-full border border-white bg-white/70 px-3.5 text-sm font-semibold transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-end gap-2"
      >
        <label htmlFor="chat-draft" className="sr-only">
          Write a message as {me?.nickname ?? "you"}
        </label>
        <textarea
          id="chat-draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write something…"
          className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border border-white bg-white/95 px-4 py-3 text-base shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-xl text-white shadow-soft transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 disabled:opacity-40"
          aria-label="Send"
        >
          ↑
        </button>
      </form>
      </div>
    </div>
  );
}
