import Link from "next/link";
import { Lotl } from "@/components/lotl/Lotl";

/**
 * The sign-in and join screens, styled like the landing page app: the live sky up top
 * with Lotl and a two-tone greeting, and a cream sheet holding the form.
 */
export function AuthShell({
  hello,
  soft,
  lead,
  children,
  alt,
}: {
  hello: string;
  soft: string;
  lead?: string;
  children: React.ReactNode;
  alt: React.ReactNode;
}) {
  return (
    <div className="ra ra-auth">
      <div className="ra-app">
        <div className="ra-auth-top">
          <Link href="/" className="ra-iconbtn ra-glass" aria-label="Back to the start">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <Link href="/" className="ra-brand">regather</Link>
          <span className="ra-auth-spacer" aria-hidden="true" />
        </div>

        <div className="ra-auth-hero">
          <div className="ra-auth-lotl ra-rise" aria-hidden="true">
            <span className="ra-auth-ring" />
            <Lotl mood="wave" title="" />
          </div>
          <h1 className="ra-hello ra-rise" style={{ "--delay": "80ms" } as React.CSSProperties}>
            {hello} <span>{soft}</span>
          </h1>
          {lead && <p className="ra-auth-lead ra-rise" style={{ "--delay": "140ms" } as React.CSSProperties}>{lead}</p>}
        </div>

        <div className="ra-auth-sheet ra-rise" style={{ "--delay": "200ms" } as React.CSSProperties}>
          {children}
          <p className="ra-auth-alt">{alt}</p>
        </div>
      </div>
    </div>
  );
}

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string };

/** A large, soft text field for the auth screens. */
export function AuthField({ label, hint, id, className = "", ...props }: AuthFieldProps) {
  const inputId = id ?? `f-${props.name}`;
  return (
    <div className="ra-field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} aria-describedby={hint ? `${inputId}-hint` : undefined} className={className} {...props} />
      {hint && <p id={`${inputId}-hint`} className="ra-hint">{hint}</p>}
    </div>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="ra-error">{message}</p>;
}
