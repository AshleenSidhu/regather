import Link from "next/link";
import { redirect } from "next/navigation";
import { Axolotl } from "@/components/axolotl/Axolotl";
import { Card } from "@/components/ui/Card";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your circle · Regather" };

export default async function CircleHome() {
  const viewer = await requireMember();

  // Members have exactly one circle. Mentors may guide several.
  if (viewer.role !== "mentor") redirect(`/circle/${viewer.circleId}`);
  if (viewer.mentoredCircleIds.length === 1) redirect(`/circle/${viewer.mentoredCircleIds[0]}`);

  const supabase = await createClient();
  const { data: circles } = await supabase
    .from("circles")
    .select("id, name, kind")
    .eq("mentor_id", viewer.userId)
    .order("created_at");

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="text-3xl font-bold text-on-sky">Your circles</h1>
      {!circles?.length ? (
        <Card tone="cream" className="text-center">
          <Axolotl resting className="mx-auto h-28 w-auto" />
          <p className="mt-2 font-semibold">No circles yet.</p>
          <p className="text-ink-soft">Your program will assign circles to you.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {circles.map((c) => (
            <li key={c.id}>
              <Link href={`/circle/${c.id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink rounded-card">
                <Card tone="lake">
                  <p className="text-xl font-bold">Circle {c.name}</p>
                  <p className="text-ink-soft capitalize">{c.kind.replace("_", " ")} circle</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
