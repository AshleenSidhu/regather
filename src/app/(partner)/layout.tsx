import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/axolotl/Logo";
import { PageLoading } from "@/components/ui/PageLoading";
import { PillButton } from "@/components/ui/PillButton";
import { requirePartner } from "@/lib/auth";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <PartnerChrome>{children}</PartnerChrome>
    </Suspense>
  );
}

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/codes", label: "Invite codes" },
  { href: "/dashboard/flags", label: "Flags" },
  { href: "/dashboard/circles", label: "Ponds" },
];

async function PartnerChrome({ children }: { children: React.ReactNode }) {
  const partner = await requirePartner();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <Logo variant="mark" className="h-10 w-auto" />
          <div>
            <p className="text-lg font-bold leading-tight text-on-sky">{partner.partnerName}</p>
            <p className="text-sm text-on-sky-soft">Partner dashboard</p>
          </div>
        </div>
        <form action={logoutAction}>
          <PillButton type="submit" className="min-h-10! py-1.5! text-sm">
            Sign out
          </PillButton>
        </form>
      </header>
      <nav aria-label="Dashboard" className="mb-6 flex flex-wrap gap-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold shadow-soft transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
