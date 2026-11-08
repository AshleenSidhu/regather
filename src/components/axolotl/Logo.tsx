import { Lotl } from "@/components/lotl/Lotl";

type LogoProps = {
  /** "full" = Lotl + wordmark, "mark" = Lotl only, "word" = small inline lockup for headers */
  variant?: "full" | "mark" | "word";
  className?: string;
};

export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return <Lotl className={className} title="Regather" />;
  }

  if (variant === "word") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
        <Lotl className="h-9 w-auto" title="" />
        <span className="font-display text-xl font-semibold tracking-tight text-on-sky">regather</span>
      </span>
    );
  }

  return (
    <div className={`relative inline-flex flex-col items-center ${className ?? ""}`} role="img" aria-label="Regather">
      <Lotl mood="wave" className="h-28 w-auto sm:h-32" title="" bubbles />
      <span aria-hidden="true" className="font-display -mt-1 select-none text-5xl font-semibold tracking-tight text-on-sky sm:text-6xl">
        regather
      </span>
    </div>
  );
}
