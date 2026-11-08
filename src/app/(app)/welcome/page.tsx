import { redirect } from "next/navigation";
import { Axolotl } from "@/components/axolotl/Axolotl";
import { Card } from "@/components/ui/Card";
import { PillButton } from "@/components/ui/PillButton";
import { requireMemberAnyStage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FindCircleButton } from "./FindCircleButton";

export const metadata = { title: "Your circle · Regather" };

export default async function WelcomePage() {
  const viewer = await requireMemberAnyStage();
  if (!viewer.onboarded) redirect("/onboarding");

  if (!viewer.circleId) {
    return (
      <div className="flex flex-1 flex-col items-center gap-5 pt-10 text-center">
        <Axolotl className="h-32 w-auto" />
        <h1 className="text-3xl font-bold text-on-sky">Let&apos;s find your circle</h1>
        <p className="max-w-sm text-on-sky/85">You&apos;re all set up. One more tap and we&apos;ll place you.</p>
        <FindCircleButton />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: circle } = await supabase
    .from("circles")
    .select("id, name, mentor_id, cohort_start")
    .eq("id", viewer.circleId)
    .single();
  const [{ count }, { data: mentor }] = await Promise.all([
    supabase.from("circle_members").select("user_id", { count: "exact", head: true }).eq("circle_id", viewer.circleId),
    circle?.mentor_id
      ? supabase.from("profiles").select("nickname").eq("id", circle.mentor_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-5 pt-6 text-center">
      <div className="relative h-40 w-full overflow-hidden" aria-hidden="true">
        <div className="axo-swim absolute left-0 top-2 w-36" style={{ animationDuration: "9s", animationIterationCount: 1, animationFillMode: "forwards", animationTimingFunction: "ease-out" }}>
          <Axolotl />
        </div>
      </div>
      <p className="fade-up text-on-sky/85">You&apos;re in</p>
      <h1 className="fade-up text-4xl font-bold text-on-sky" style={{ "--delay": "150ms" } as React.CSSProperties}>
        Circle {circle?.name}
      </h1>
      <Card tone="cream" className="fade-up w-full text-left" >
        <ul className="flex flex-col gap-2">
          <li>👥 {count ?? 0} {count === 1 ? "person" : "people"} in your circle</li>
          <li>🌿 {mentor?.nickname ? `Guided by ${mentor.nickname}` : "A mentor will be assigned soon"}</li>
          <li>📅 Week 1 of 8</li>
        </ul>
      </Card>
      <PillButton href="/circle" variant="ink" className="pop-in w-full">
        Say hi
      </PillButton>
    </div>
  );
}
