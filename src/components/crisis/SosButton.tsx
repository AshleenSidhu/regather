"use client";

import { PillButton } from "@/components/ui/PillButton";
import { useCrisis } from "./CrisisProvider";

/** Always-visible help button. Calm lavender, never alarm red, one tap from every screen. */
export function SosButton() {
  const { open } = useCrisis();
  return (
    <PillButton variant="lilac" className="breathe-glow min-h-10! px-4! py-1.5! text-sm" onClick={open}>
      Get help now
    </PillButton>
  );
}
