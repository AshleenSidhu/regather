"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondConnectionAction, respondMentorAction } from "@/app/actions/social";
import { PillButton } from "@/components/ui/PillButton";

export function RequestActions({ id, kind }: { id: string; kind: "connection" | "mentor" }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function respond(accept: boolean) {
    setError(undefined);
    start(async () => {
      const res = kind === "connection" ? await respondConnectionAction(id, accept) : await respondMentorAction(id, accept);
      if (!res.ok) setError(res.error);
      else if (accept && res.threadId) router.push(`/chats/${res.threadId}`);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <PillButton variant="ink" className="min-h-9! px-4! py-1! text-sm" disabled={pending} onClick={() => respond(true)}>
          Accept
        </PillButton>
        <PillButton className="min-h-9! px-4! py-1! text-sm" disabled={pending} onClick={() => respond(false)}>
          Not now
        </PillButton>
      </div>
      {error && <p role="alert" className="text-xs font-semibold">{error}</p>}
    </div>
  );
}
