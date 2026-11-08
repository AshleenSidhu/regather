type Tone = "lake" | "mint" | "blush" | "lilac" | "cream";

// Full class strings so Tailwind can see them.
const TONES: Record<Tone, string> = {
  lake: "bg-linear-to-b from-sky-100 to-lake",
  mint: "bg-linear-to-b from-lime-50 to-mint",
  blush: "bg-linear-to-b from-rose-50 to-blush",
  lilac: "bg-linear-to-b from-violet-50 to-lilac",
  cream: "bg-linear-to-b from-white to-cream",
};

type CardProps = {
  tone?: Tone;
  /** Centre the content inside a thin white circle, like the Foundry service cards. */
  ring?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Card({ tone = "cream", ring = false, className = "", children }: CardProps) {
  return (
    <div
      className={`rounded-card p-6 text-ink shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift ${TONES[tone]} ${className}`}
    >
      {ring ? (
        <div className="mx-auto flex aspect-square w-full max-w-44 items-center justify-center rounded-full border-2 border-white p-5 text-center text-lg font-semibold leading-snug">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
