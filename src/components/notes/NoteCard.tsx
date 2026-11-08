import { Sticker } from "@/components/ui/Icons";

export type NoteView = {
  id: string;
  body: string;
  sticker: string;
  color: string;
  createdAt: string;
  who: string;
  saved?: boolean;
};

/** Paper colours for candy-grams (values match the database check constraint). */
export const PAPER: Record<string, string> = {
  blush: "#fde3e8",
  lake: "#dff0f8",
  mint: "#e2f4e7",
  lilac: "#fff0d6", // shown as warm lantern paper
  peach: "#ffe6d3",
};

/** A candy-gram on soft paper, written by hand. The body is plain text only. */
export function NoteCard({
  note,
  footer,
  className = "",
  style,
}: {
  note: NoteView;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const paper = PAPER[note.color] ?? PAPER.blush;
  return (
    <article
      className={`relative flex flex-col gap-2 rounded-[22px] border border-white/80 p-5 pt-6 text-ink shadow-soft ${className}`}
      style={{
        background: `linear-gradient(180deg, #fffdf9 0%, ${paper} 100%)`,
        ...style,
      }}
    >
      <span aria-hidden="true" className="absolute -right-2 -top-3 rotate-12">
        <Sticker kind={note.sticker} className="h-12 w-12 drop-shadow" />
      </span>
      <p className="font-hand whitespace-pre-wrap break-words pr-6 text-[1.7rem] leading-[1.15]">{note.body}</p>
      <div className="mt-1 flex items-center justify-between gap-3 text-sm font-bold text-ink-soft">
        <span>{note.who}</span>
        <time dateTime={note.createdAt} suppressHydrationWarning>
          {new Date(note.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </time>
      </div>
      {footer}
    </article>
  );
}
