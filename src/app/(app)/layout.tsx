import Link from "next/link";
import { Suspense } from "react";
import { Lotl } from "@/components/lotl/Lotl";
import { CrisisProvider } from "@/components/crisis/CrisisProvider";
import { SosButton } from "@/components/crisis/SosButton";
import { SkyReportSync } from "@/components/sky/SkyProvider";
import { PageLoading } from "@/components/ui/PageLoading";
import { TabBar } from "@/components/ui/TabBar";
import { requireViewer } from "@/lib/auth";
import { getSkyReport } from "@/lib/weather";

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
  const isMember = viewer.kind === "member";
  const showTabs = isMember && viewer.onboarded && viewer.circleId !== null;
  const report = isMember ? await getSkyReport(viewer.city) : null;

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <div className="app-tint" aria-hidden="true" />
      <CrisisProvider canAskMentor={isMember && viewer.role !== "mentor" && viewer.circleId !== null}>
        <SkyReportSync report={report} />
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
          <header className="flex items-center justify-between pb-2 pt-4">
            <Link href="/pond" aria-label="Regather, your pond" className="press -ml-1 rounded-full p-1">
              <Lotl className="h-11 w-auto" title="" />
            </Link>
            <SosButton />
          </header>
          <main className="flex flex-1 flex-col pb-32">{children}</main>
        </div>
        {showTabs && <TabBar />}
      </CrisisProvider>
    </div>
  );
}
