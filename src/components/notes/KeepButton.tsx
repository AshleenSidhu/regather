"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveNoteAction } from "@/app/actions/social";

export function KeepButton({ id, saved }: { id: string; saved: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={saved}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await saveNoteAction(id, !saved);
          router.refresh();
        })
      }
      className="self-start rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-soft transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-95 disabled:opacity-60"
    >
      {saved ? "♥ Kept in your jar" : "♡ Keep in my jar"}
    </button>
  );
}
