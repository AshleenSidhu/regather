"use client";

import { HelpIcon } from "@/components/ui/Icons";
import { useCrisis } from "./CrisisProvider";

/** Help, one tap from every screen: a frosted pill with a soft glow, never alarm red. */
export function SosButton() {
  const { open } = useCrisis();
  return (
    <button
      type="button"
      onClick={open}
      className="chip breathe-glow min-h-12! px-5! text-[15px]"
    >
      <HelpIcon className="h-5 w-5 text-[#ffb3c4]" />
      Help
    </button>
  );
}
