import { Axolotl } from "./Axolotl";

type LogoProps = {
  /** "full" = axolotl + wordmark, "mark" = axolotl only */
  variant?: "full" | "mark";
  className?: string;
  animated?: boolean;
};

function Sparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`sparkle absolute ${className}`}
      style={{ "--d": delay } as React.CSSProperties}
    >
      <path
        d="M12 1 L14.6 9.4 L23 12 L14.6 14.6 L12 23 L9.4 14.6 L1 12 L9.4 9.4Z"
        fill="#9fcdf2"
      />
    </svg>
  );
}

export function Logo({ variant = "full", className, animated = true }: LogoProps) {
  if (variant === "mark") {
    return (
      <Axolotl
        className={className}
        animated={animated}
        bubbles={false}
        title="Regather"
      />
    );
  }

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className ?? ""}`}
      role="img"
      aria-label="Regather"
    >
      <Sparkle className="left-[34%] top-0 h-4 w-4" delay="0s" />
      <Sparkle className="bottom-1 left-2 h-3.5 w-3.5" delay="1.2s" />
      <Axolotl
        className="h-24 w-auto sm:h-28"
        animated={animated}
        title=""
      />
      <span
        aria-hidden="true"
        className="select-none text-5xl font-extrabold tracking-tight text-on-sky sm:text-6xl"
      >
        regather
      </span>
      <Sparkle className="-right-3 top-1/3 h-5 w-5" delay="0.6s" />
    </div>
  );
}
