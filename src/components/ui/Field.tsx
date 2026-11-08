type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

/** Labelled text input with a big tap target and a visible focus ring. */
export function Field({ label, hint, id, className = "", ...props }: FieldProps) {
  const inputId = id ?? `f-${props.name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-bold">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={`min-h-12 rounded-2xl border border-[#eadfd6] bg-white px-4 py-2 text-base text-ink transition placeholder:text-ink-soft/55 hover:border-[#dccbbd] focus-visible:border-transparent ${className}`}
        {...props}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="pop-in rounded-2xl bg-lotl-soft px-4 py-3 font-semibold text-ink">
      {message}
    </p>
  );
}
