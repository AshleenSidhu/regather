import Link from "next/link";

type Variant = "white" | "lilac" | "ink" | "ghost";

const VARIANTS: Record<Variant, string> = {
  white: "bg-white/90 text-ink border-white",
  lilac: "bg-lilac text-ink border-white/70",
  ink: "bg-ink text-white border-white/80",
  ghost: "bg-transparent text-on-sky border-current shadow-none",
};

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-6 py-2.5 " +
  "text-base font-semibold shadow-soft backdrop-blur transition duration-200 " +
  "hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:scale-[0.98] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
  "disabled:opacity-60 disabled:pointer-events-none";

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

export function PillButton({
  variant = "white",
  className = "",
  children,
  ...props
}: ButtonProps | LinkProps) {
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
