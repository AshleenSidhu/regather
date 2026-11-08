"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { requestConnectionAction, requestMentorAction, respondConnectionAction } from "@/app/actions/social";
import { Modal } from "@/components/ui/Modal";
import { PeopleIcon, SproutIcon, Sticker } from "@/components/ui/Icons";
import { PillButton } from "@/components/ui/PillButton";
import { ROLE_LABELS, type AppRole } from "@/lib/options";

export type MemberRow = {
  id: string;
  nickname: string;
  role: AppRole;
  audience: "minor" | "adult";
  sticker: string;
};

type Props = {
  members: MemberRow[];
  meId: string;
  meRole: AppRole;
  meAudience: "minor" | "adult";
  /** other user id -> how we're connected */
  connections: Record<string, { status: "sent" | "received" | "accepted"; connectionId: string }>;
  mentorNickname: string | null;
  canAskMentor: boolean;
};

export function CircleTools({ members, meId, meRole, meAudience, connections, mentorNickname, canAskMentor }: Props) {
  const router = useRouter();
  const [showMembers, setShowMembers] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string; status?: string }>, okText: string) {
    setMessage(undefined);
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? okText : (res.error ?? "Something went wrong."));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="chip" onClick={() => setShowMembers(true)}>
          <PeopleIcon className="h-[18px] w-[18px]" /> Who&apos;s here
        </button>
        {canAskMentor && mentorNickname && (
          <button
            type="button"
            className="chip disabled:opacity-50"
            disabled={pending}
            onClick={() => run(() => requestMentorAction(), `Sent. ${mentorNickname} will see your request.`)}
          >
            <SproutIcon className="h-[18px] w-[18px]" /> Ask {mentorNickname} for a 1:1
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="paper pop-in px-4 py-2 text-sm font-semibold">
          {message}
        </p>
      )}

      <Modal open={showMembers} onClose={() => setShowMembers(false)} title="Who's here">
        <ul className="flex flex-col gap-2.5">
          {members.map((m) => {
            const conn = connections[m.id];
            const canChat =
              m.id !== meId && meRole !== "mentor" && m.role === meRole && m.audience === meAudience;
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0e4da] bg-white px-4 py-3">
                <span>
                  <span className="flex items-center gap-2 font-bold">
                    <Sticker kind={m.sticker} className="h-7 w-7" /> {m.nickname}
                    {m.id === meId ? " (you)" : ""}
                  </span>
                  <span className="block text-sm text-ink-soft">{ROLE_LABELS[m.role]}</span>
                </span>
                {canChat && !conn && (
                  <PillButton
                    className="min-h-11! px-4! py-1! text-sm"
                    disabled={pending}
                    onClick={() => run(() => requestConnectionAction(m.id), `Request sent to ${m.nickname}.`)}
                  >
                    Ask to chat
                  </PillButton>
                )}
                {canChat && conn?.status === "sent" && <span className="text-sm text-ink-soft">Request sent</span>}
                {canChat && conn?.status === "received" && (
                  <PillButton
                    variant="ink"
                    className="min-h-11! px-4! py-1! text-sm"
                    disabled={pending}
                    onClick={() => run(() => respondConnectionAction(conn.connectionId, true), `You can now chat with ${m.nickname}.`)}
                  >
                    Accept
                  </PillButton>
                )}
                {canChat && conn?.status === "accepted" && <span className="text-sm font-semibold">Connected ✓</span>}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">
          Private chats start only when both of you say yes, and only with people in the same kind of pond as you.
        </p>
        <PillButton className="mt-4 w-full" onClick={() => setShowMembers(false)}>
          Close
        </PillButton>
      </Modal>
    </div>
  );
}
