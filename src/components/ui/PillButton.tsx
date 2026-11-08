import Link from "next/link";

type Variant = "white" | "lilac" | "ink" | "ghost" | "lotl" | "lantern";

const VARIANTS: Record<Variant, string> = {
  ink: "pb-ink bg-ink text-white border-white/30 hover:bg-[#2e3b63]",
  white: "bg-white text-[#1b2142] border-white",
  lotl: "bg-lotl text-[#1b2142] border-white/80 hover:bg-[#f7b2c1]",
  lantern: "bg-lantern-soft text-[#1b2142] border-white/80",
  lilac: "bg-lantern-soft text-[#1b2142] border-white/80", // legacy name: now the warm lantern tone
  ghost: "bg-transparent text-on-sky border-current shadow-none",
};

const BASE =
  "lift inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-6 py-2.5 " +
  "text-base font-bold shadow-soft backdrop-blur " +
  "disabled:opacity-55 disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type LinkProps = CommonProps & { href: string };

export function PillButton({ variant = "white", className = "", children, ...props }: ButtonProps | LinkProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;

  if (typeof props.href === "string") {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(props as Omit<ButtonProps, keyof CommonProps>)}>
      {children}
    </button>
  );
}
