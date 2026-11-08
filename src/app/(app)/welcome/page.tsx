import { redirect } from "next/navigation";
import { Lotl3D } from "@/components/lotl3d/Lotl3D";
import { Celebrate } from "@/components/pond/Celebrate";
import { PondScene } from "@/components/pond/PondScene";
import { PeopleIcon, SproutIcon } from "@/components/ui/Icons";
import { PillButton } from "@/components/ui/PillButton";
import { requireMemberAnyStage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FindCircleButton } from "./FindCircleButton";

export const metadata = { title: "Your pond · Regather" };

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

export default async function WelcomePage() {
  const viewer = await requireMemberAnyStage();
  if (!viewer.onboarded) redirect("/onboarding");

  if (!viewer.circleId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Lotl3D className="h-40 w-40" title="" />
        <h1 className="font-display text-4xl font-semibold text-on-sky">Let&apos;s find your pond</h1>
        <p className="max-w-sm text-on-sky-soft">You&apos;re all set up. One more tap and Lotl will take you there.</p>
        <FindCircleButton />
      </div>
    );
  }

  const supabase = await createClient();
  const { data: pond } = await supabase
    .from("circles")
    .select("id, name, mentor_id, cohort_start")
    .eq("id", viewer.circleId)
    .single();
  const [{ count }, { data: mentor }] = await Promise.all([
    supabase.from("circle_members").select("user_id", { count: "exact", head: true }).eq("circle_id", viewer.circleId),
    pond?.mentor_id
      ? supabase.from("profiles").select("nickname").eq("id", pond.mentor_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const others = Math.max(0, (count ?? 1) - 1);

  return (
    <div className="flex flex-1 flex-col items-center gap-5 pt-4 text-center">
      <div className="relative">
        <Celebrate />
        <Lotl3D mood="happy" className="pop-in h-44 w-44" title="Lotl, celebrating" />
      </div>
      <p className="enter font-bold text-on-sky-soft">You&apos;re in.</p>
      <h1 className="enter font-display -mt-3 text-5xl font-semibold text-on-sky" style={delay(150)}>
        Pond <span className="tone">{pond?.name}</span>
      </h1>

      <PondScene week={1} className="enter h-36 w-full" />

      <ul className="enter paper flex w-full flex-col gap-3 p-5 text-left" style={delay(300)}>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lotl-soft"><PeopleIcon className="h-5 w-5" /></span>
          {others === 0 ? "You're the first one here. Others will join soon." : `${others} ${others === 1 ? "other family is" : "other families are"} here with you`}
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e5f5ea]"><SproutIcon className="h-5 w-5" /></span>
          {mentor?.nickname ? `Guided by ${mentor.nickname}, a mentor who's been there` : "A mentor family will join you soon"}
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lantern-soft font-display font-semibold">8</span>
          Eight weeks together. Your pond grows as you show up for each other.
        </li>
      </ul>
      <PillButton href="/pond" variant="white" className="enter w-full">
        Say hi to your pond
      </PillButton>
    </div>
  );
}
