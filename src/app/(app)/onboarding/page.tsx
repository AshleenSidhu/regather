import { redirect } from "next/navigation";
import { requireMemberAnyStage } from "@/lib/auth";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Welcome · Regather" };

export default async function OnboardingPage() {
  const viewer = await requireMemberAnyStage();
  if (viewer.onboarded) redirect(viewer.circleId ? "/circle" : "/welcome");
  return <OnboardingWizard role={viewer.role} nickname={viewer.nickname} />;
}
