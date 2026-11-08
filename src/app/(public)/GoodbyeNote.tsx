"use client";

import { useSearchParams } from "next/navigation";

export function GoodbyeNote() {
  const params = useSearchParams();
  if (params.get("goodbye") !== "1") return null;
  return (
    <p role="status" className="pop-in rounded-2xl bg-white/85 px-5 py-3 font-semibold shadow-soft">
      Take care. Your account and messages have been deleted. You&apos;re always welcome back with a new code.
    </p>
  );
}
