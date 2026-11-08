import { CalmCorner } from "@/components/calm/CalmCorner";
import { requireMember } from "@/lib/auth";

export const metadata = { title: "Calm corner · Regather" };

export default async function CalmPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  await requireMember();
  const { start } = await searchParams;
  return <CalmCorner start={start === "breathe" || start === "ground" ? start : undefined} />;
}
