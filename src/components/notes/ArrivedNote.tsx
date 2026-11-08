"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { saveNoteAction } from "@/app/actions/social";
import { Sticker } from "@/components/ui/Icons";
import { NoteCard, PAPER, type NoteView } from "./NoteCard";

const OPENED_KEY = "rg-opened-notes";

function readOpened(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(OPENED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function rememberOpened(id: string) {
  try {
    const s = readOpened();
    s.add(id);
    localStorage.setItem(OPENED_KEY, JSON.stringify([...s].slice(-200)));
  } catch {
    /* fine: it just arrives wrapped again next time */
  }
}

/**
 * A note that arrived for you. It comes wrapped like a candy; tap to unwrap it,
 * then keep it and watch it float up into your comfort jar.
 */
export function ArrivedNote({ note, delayMs = 0 }: { note: NoteView; delayMs?: number }) {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [keeping, setKeeping] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- per-device memory, read after mount
    if (readOpened().has(note.id)) setOpened(true);
  }, [note.id]);

  function unwrap() {
    setOpened(true);
    rememberOpened(note.id);
  }

  function keep() {
    setKeeping(true);
    start(async () => {
      await Promise.all([saveNoteAction(note.id, true), new Promise((r) => setTimeout(r, 1200))]);
      router.refresh();
    });
  }

  const paper = PAPER[note.color] ?? PAPER.blush;

  if (!opened) {
    return (
      <button
        type="button"
        onClick={unwrap}
        className="enter lift group relative flex w-full items-center gap-4 rounded-[24px] border border-white/80 p-4 text-left text-ink shadow-soft"
        style={{ background: `linear-gradient(180deg,#fffdf9,${paper})`, "--delay": `${delayMs}ms` } as React.CSSProperties}
      >
        {/* a wrapped candy */}
        <svg viewBox="0 0 90 44" className="h-11 w-24 shrink-0 transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-105" aria-hidden="true">
          <path d="M20 22 L2 8 Q0 22 2 36 Z" fill={paper} stroke="#fff" strokeWidth="2" />
          <path d="M70 22 L88 8 Q90 22 88 36 Z" fill={paper} stroke="#fff" strokeWidth="2" />
          <rect x="18" y="6" width="54" height="32" rx="16" fill={paper} stroke="#fff" strokeWidth="2.5" />
          <path d="M28 12 Q45 30 62 12" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" />
        </svg>
        <span className="flex-1">
          <span className="block font-extrabold">{note.who.replace(/^From /, "")} sent you something</span>
          <span className="block text-sm font-semibold text-ink-soft">Tap to unwrap</span>
        </span>
        <Sticker kind={note.sticker} className="bob h-9 w-9" />
      </button>
    );
  }

  return (
    <div className={keeping ? "float-into-jar" : "unwrap"}>
      <NoteCard
        note={note}
        footer={
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={keep}
              disabled={pending || keeping}
              className="lift rounded-full bg-lotl px-5 py-2.5 text-sm font-extrabold text-ink disabled:opacity-60"
            >
              Keep in my jar
            </button>
          </div>
        }
      />
    </div>
  );
}
