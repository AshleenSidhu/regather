"use client";

import { useState } from "react";

type ChipProps = {
  label: string;
  defaultSelected?: boolean;
  onChange?: (selected: boolean) => void;
};

/** A tap-to-toggle tag, used for onboarding choices. */
export function Chip({ label, defaultSelected = false, onChange }: ChipProps) {
  const [selected, setSelected] = useState(defaultSelected);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        const next = !selected;
        setSelected(next);
        onChange?.(next);
      }}
      className={
        "min-h-11 rounded-full border px-5 py-2 text-base font-semibold transition duration-200 " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
        (selected
          ? "scale-[1.03] border-ink bg-ink text-white shadow-soft"
          : "border-white bg-white/80 text-ink hover:bg-white")
      }
    >
      {label}
    </button>
  );
}
