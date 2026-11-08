"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { revokeInviteCodeAction } from "@/app/actions/partner";
import { PillButton } from "@/components/ui/PillButton";

export function RevokeButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <PillButton
      className="min-h-9! px-4! py-1! text-sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await revokeInviteCodeAction(id);
          router.refresh();
        })
      }
    >
      {pending ? "Revoking…" : "Revoke"}
    </PillButton>
  );
}
