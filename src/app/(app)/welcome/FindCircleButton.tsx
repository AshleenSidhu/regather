"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinCircleAction } from "@/app/actions/onboarding";
import { FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";

export function FindCircleButton() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="flex w-full flex-col gap-3">
      <FormError message={error} />
      <PillButton
        variant="ink"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await joinCircleAction();
            if (res.ok) router.refresh();
            else setError(res.error);
          })
        }
      >
        {pending ? "Finding your pond…" : "Find my pond"}
      </PillButton>
    </div>
  );
}
