"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRealtimeTokenAction, sendMessageAction } from "@/app/actions/chat";
import { useCrisis } from "@/components/crisis/CrisisProvider";
import { Lotl } from "@/components/lotl/Lotl";
import { PondScene } from "@/components/pond/PondScene";
import { DayWeatherIcon, SendIcon, Sticker, WEATHER_CHECKIN } from "@/components/ui/Icons";
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
  /** Pond week (1..8). When set, the living pond scene shows at the top. */
  week?: number;
};

const QUICK_REPLIES = ["I'm here", "Same", "Sending you a hug", "Thinking of you"];
const dayWord = (score: number | null) => WEATHER_CHECKIN.find((w) => w.score === score)?.word ?? "";

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
  week,
}: Props) {
  const { open: openCrisis } = useCrisis();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string>();
  const [awakeIds, setAwakeIds] = useState<string[]>([]);
  const [checkedIn, setCheckedIn] = useState(checkedInRecently);
  const [justCheckedIn, setJustCheckedIn] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  // Messages that were already here on load stay still; new ones float in.
  const [initialIds] = useState(() => new Set(initialMessages.map((m) => m.id)));

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
          setAwakeIds(Object.keys(channel?.presenceState() ?? {}));
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
    if (kind === "checkin") {
      setCheckedIn(true);
      setJustCheckedIn(score);
    }

    startTransition(async () => {
      const res = await sendMessageAction({
        circleId: circleId ?? null, threadId: threadId ?? null, body, kind, score,
      });

      if (!res.ok || !res.id) {
        setMessages((cur) => cur.filter((m) => m.id !== tempId));
        if (kind === "text") setDraft(body);
        if (kind === "checkin") {
          setCheckedIn(false);
          setJustCheckedIn(null);
        }
        setNotice(
          res.error === "rate_limited"
            ? "Let's slow down a little. You can send again in a few seconds."
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
      if (res.crisis) openCrisis();
    });
  }

  const othersAwake = awakeIds.filter((id) => id !== meId);
  const isPond = Boolean(circleId);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {isPond && week !== undefined && (
        <PondScene
          week={week}
          awake={othersAwake.map((id) => ({ id, name: people[id]?.nickname ?? "Someone" }))}
          className="h-32 shrink-0"
        />
      )}

      <p className="flex items-center gap-2 px-1 text-sm text-on-sky-soft" role="status">
        <span aria-hidden="true" className="awake-light inline-block h-2.5 w-2.5 rounded-full" />
        {othersAwake.length > 0
          ? `You're not alone right now. ${othersAwake.length} ${othersAwake.length === 1 ? "other person is" : "others are"} awake.`
          : "You're not alone. Others will see this when they wake."}
      </p>

      {allowCheckin && !checkedIn && (
        <section aria-labelledby="checkin-q" className="paper enter p-5">
          <h2 id="checkin-q" className="font-display text-[28px] leading-tight">How did today <span className="tone">feel?</span></h2>
          <p className="mb-4 text-sm text-on-sky-soft">Pick the weather. No need to explain.</p>
          <div className="flex justify-center gap-1.5" role="group" aria-label="Today's weather">
            {WEATHER_CHECKIN.map((w) => (
              <button
                key={w.score}
                type="button"
                onClick={() => send("", "checkin", w.score)}
                aria-label={w.label}
                className="group flex w-[19%] flex-col items-center gap-1.5 rounded-2xl py-1 transition-transform duration-300 active:scale-95"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 transition-transform duration-500 [transition-timing-function:var(--ease-spring)] group-hover:-translate-y-1"><DayWeatherIcon score={w.score} className="h-10 w-10" /></span>
                <span className="text-[12px] font-medium leading-tight text-on-sky-soft">{w.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {justCheckedIn !== null && (
        <div className="paper pop-in flex items-center gap-3 p-3 pr-4" role="status">
          <Lotl mood="happy" className="h-14 w-auto shrink-0" title="" />
          <p className="text-left font-semibold">
            Thanks for sharing your {dayWord(justCheckedIn)} day. Your pond can see it, gently.
          </p>
        </div>
      )}

      <ol aria-live="polite" aria-label="Messages" className="flex min-h-[34dvh] flex-1 flex-col gap-3 pb-2">
        {messages.length === 0 && (
          <li className="m-auto flex max-w-xs flex-col items-center gap-2 text-center">
            <Lotl mood="sleep" className="h-20 w-auto" title="" />
            <p className="glass rounded-2xl px-5 py-3">{emptyText}</p>
          </li>
        )}
        {messages.map((m, idx) => {
          const mine = m.senderId === meId;
          const who = people[m.senderId];
          const fresh = !initialIds.has(m.id);
          const prev = messages[idx - 1];
          const grouped = prev && prev.senderId === m.senderId && prev.kind === m.kind;

          if (m.kind === "checkin") {
            return (
              <li key={m.id} className={(fresh ? "pop-in " : "") + "flex justify-center"}>
                <p className="glass flex items-center gap-2 rounded-full py-1 pl-1.5 pr-4 text-sm font-semibold">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90">
                    <DayWeatherIcon score={m.score ?? 3} className="h-7 w-7" />
                  </span>
                  {mine ? "Your" : `${who?.nickname ?? "Someone"}'s`} day felt {dayWord(m.score)}
                </p>
              </li>
            );
          }

          return (
            <li key={m.id} className={(fresh ? "enter " : "") + "flex flex-col " + (mine ? "items-end" : "items-start") + (grouped ? " -mt-1.5" : "")} style={fresh ? ({ "--delay": "0ms", animationDuration: "0.5s" } as React.CSSProperties) : undefined}>
              {!mine && !grouped && (
                <span className="mb-1 ml-1 flex items-center gap-1.5 text-xs font-bold text-on-sky-soft">
                  <Sticker kind={who?.sticker ?? "axolotl"} className="h-5 w-5" />
                  {who?.nickname ?? "Someone"}
                  {who?.role === "mentor" && <span className="rounded-full bg-lily/80 px-2 py-px text-[10px] text-ink">mentor</span>}
                </span>
              )}
              <p
                className={
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-[22px] px-4 py-2.5 shadow-soft transition-opacity " +
                  (mine ? "rounded-br-md bg-[#fbd3dc] text-[#1b2142] " : "glass rounded-bl-md ") +
                  (m.pending ? "opacity-60" : "opacity-100")
                }
              >
                {/* Plain text only. React escapes it; there is no HTML rendering anywhere. */}
                {m.body}
              </p>
              {m.redacted && mine && (
                <span className="mx-2 mt-1 text-[11px] font-semibold text-on-sky-soft">Contact details are hidden for now, to keep everyone safe.</span>
              )}
              <time dateTime={m.createdAt} suppressHydrationWarning className="mx-2 mt-0.5 text-[11px] text-on-sky-soft">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </time>
            </li>
          );
        })}
        <div ref={endRef} className="scroll-mb-56" />
      </ol>

      <div className="sticky bottom-[6.4rem] z-10 -mx-1 flex flex-col gap-2 px-1 pb-1 pt-2">
        {notice && (
          <p role="alert" className="paper pop-in px-4 py-2 text-sm font-semibold">
            {notice}
          </p>
        )}

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]" aria-label="Easy replies">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="chip shrink-0"
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
          className="glass flex items-end gap-2 rounded-[28px] p-1.5"
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
            placeholder={isPond ? "Say something to your pond…" : "Write something…"}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-[20px] bg-transparent px-3 py-2.5 text-base text-white placeholder:text-white/55"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#1b2142] transition disabled:opacity-40"
            aria-label="Send"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
