import Link from "next/link";
import { redirect } from "next/navigation";
import { Lotl } from "@/components/lotl/Lotl";
import { Card } from "@/components/ui/Card";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your ponds · Regather" };

export default async function CircleHome() {
  const viewer = await requireMember();

  // Members have exactly one circle. Mentors may guide several.
  if (viewer.role !== "mentor") redirect(`/pond/${viewer.circleId}`);
  if (viewer.mentoredCircleIds.length === 1) redirect(`/pond/${viewer.mentoredCircleIds[0]}`);

  const supabase = await createClient();
  const { data: circles } = await supabase
    .from("circles")
    .select("id, name, kind")
    .eq("mentor_id", viewer.userId)
    .order("created_at");

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="font-display text-4xl font-semibold text-on-sky">Your ponds</h1>
      {!circles?.length ? (
        <Card tone="cream" className="text-center">
          <Lotl mood="sleep" title="" className="mx-auto h-28 w-auto" />
          <p className="mt-2 font-semibold">No ponds yet.</p>
          <p className="text-ink-soft">Your program will assign ponds to you.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {circles.map((c) => (
            <li key={c.id}>
              <Link href={`/pond/${c.id}`} className="lift block rounded-[28px]">
                <Card tone="lake">
                  <p className="text-xl font-bold">Pond {c.name}</p>
                  <p className="text-ink-soft capitalize">{c.kind.replace("_", " ")} pond</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
