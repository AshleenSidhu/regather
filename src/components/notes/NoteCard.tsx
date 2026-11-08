import { NOTE_COLORS, STICKERS } from "@/lib/options";

export type NoteView = {
  id: string;
  body: string;
  sticker: string;
  color: string;
  createdAt: string;
  who: string;
  saved?: boolean;
};

/** A pastel candy-gram. The body is rendered as plain text only. */
export function NoteCard({ note, footer, delayMs = 0 }: { note: NoteView; footer?: React.ReactNode; delayMs?: number }) {
  const color = NOTE_COLORS.find((c) => c.value === note.color)?.classes ?? NOTE_COLORS[0].classes;
  const emoji = STICKERS.find((s) => s.value === note.sticker)?.emoji ?? "🐚";

  return (
    <article
      className={`fade-up flex flex-col gap-2 rounded-card bg-linear-to-b p-5 text-ink shadow-soft transition duration-300 hover:-translate-y-1 hover:rotate-[-0.6deg] hover:shadow-lift ${color}`}
      style={{ "--delay": `${delayMs}ms` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="text-3xl">{emoji}</span>
        <span className="text-xs font-semibold text-ink-soft">
          <time dateTime={note.createdAt} suppressHydrationWarning>
            {new Date(note.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
          </time>
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-lg leading-snug">{note.body}</p>
      <p className="text-sm font-semibold text-ink-soft">{note.who}</p>
      {footer}
    </article>
  );
}
