type Tone = "lake" | "mint" | "blush" | "lilac" | "cream";

// A whisper of colour at the bottom of the paper, so cards stay one family.
const TONES: Record<Tone, string> = {
  cream: "",
  lake: "bg-linear-to-b! from-[#fffdf9]! to-[#e4f2f9]!",
  mint: "bg-linear-to-b! from-[#fffdf9]! to-[#e5f5ea]!",
  blush: "bg-linear-to-b! from-[#fffdf9]! to-[#fde6e9]!",
  lilac: "bg-linear-to-b! from-[#fffdf9]! to-[#fff0d6]!",
};

type CardProps = {
  tone?: Tone;
  /** Centre the content inside a thin white circle. */
  ring?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Warm paper card. Linked cards get `.lift` from their link wrapper, not here. */
export function Card({ tone = "cream", ring = false, className = "", children }: CardProps) {
  return (
    <div className={`paper p-6 ${TONES[tone]} ${className}`}>
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
