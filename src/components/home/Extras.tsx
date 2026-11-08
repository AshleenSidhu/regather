"use client";

import { useSearchParams } from "next/navigation";

/** The note shown after an account is deleted (/?goodbye=1). */
export function GoodbyeNote() {
  const params = useSearchParams();
  if (params.get("goodbye") !== "1") return null;
  return (
    <p role="status" className="ra-goodbye ra-glass">
      Your account and messages are deleted. A new code brings you back.
    </p>
  );
}
