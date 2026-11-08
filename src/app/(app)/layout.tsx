import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/axolotl/Logo";
import { CrisisProvider } from "@/components/crisis/CrisisProvider";
import { SosButton } from "@/components/crisis/SosButton";
import { PageLoading } from "@/components/ui/PageLoading";
import { TabBar } from "@/components/ui/TabBar";
import { requireViewer } from "@/lib/auth";

// Everything under (app) is for signed-in people. The session read happens at request
// time, so it streams in behind a Suspense boundary.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <AppChrome>{children}</AppChrome>
    </Suspense>
  );
}

async function AppChrome({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const showTabs = viewer.kind === "member" && viewer.onboarded && viewer.circleId !== null;

  return (
    <CrisisProvider>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
        <header className="flex items-center justify-between py-3">
          <Link href="/circle" aria-label="Regather home" className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <Logo variant="mark" className="h-10 w-auto" />
          </Link>
          <SosButton />
        </header>
        <main className="flex flex-1 flex-col pb-24">{children}</main>
      </div>
      {showTabs && <TabBar />}
    </CrisisProvider>
  );
}
