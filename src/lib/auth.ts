import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/options";

// Data access layer for identity. Every page, layout and server action that needs a user
// goes through here, so we never rely on the proxy alone. getUser() verifies the JWT with
// Supabase on every call (not just reading the cookie).

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export type PartnerViewer = {
  kind: "partner";
  userId: string;
  partnerId: string;
  partnerName: string;
  isModerator: boolean;
};

export type MemberViewer = {
  kind: "member";
  userId: string;
  nickname: string;
  role: AppRole;
  audience: "minor" | "adult";
  sticker: "shell" | "lily" | "axolotl";
  onboarded: boolean;
  /** The circle they belong to (or, for mentors, the first circle they mentor). */
  circleId: string | null;
  /** Mentors can guide several circles. */
  mentoredCircleIds: string[];
};

export type Viewer = PartnerViewer | MemberViewer;

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("partner_staff")
    .select("partner_id, is_moderator, partners(name)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff) {
    const partner = staff.partners as { name: string } | null;
    return {
      kind: "partner",
      userId: user.id,
      partnerId: staff.partner_id,
      partnerName: partner?.name ?? "Partner",
      isModerator: staff.is_moderator,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nickname, role, audience, sticker")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const [{ data: details }, { data: membership }, { data: mentored }] = await Promise.all([
    supabase.from("profile_details").select("onboarded_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("circle_members").select("circle_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("circles").select("id").eq("mentor_id", user.id).order("created_at"),
  ]);

  const mentoredCircleIds = (mentored ?? []).map((c) => c.id);
  return {
    kind: "member",
    userId: user.id,
    nickname: profile.nickname,
    role: profile.role,
    audience: profile.audience,
    sticker: profile.sticker,
    onboarded: Boolean(details?.onboarded_at) || profile.role === "mentor",
    circleId: membership?.circle_id ?? mentoredCircleIds[0] ?? null,
    mentoredCircleIds,
  };
});

/** Any signed-in user with a profile or partner role. Redirects to /login otherwise. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

/** A member who has finished onboarding and been placed in a circle (mentors are assigned). */
export async function requireMember(): Promise<MemberViewer> {
  const viewer = await requireViewer();
  if (viewer.kind === "partner") redirect("/dashboard");
  if (!viewer.onboarded) redirect("/onboarding");
  if (!viewer.circleId && viewer.role !== "mentor") redirect("/welcome");
  return viewer;
}

/** A member who may still be onboarding (used by the onboarding screens themselves). */
export async function requireMemberAnyStage(): Promise<MemberViewer> {
  const viewer = await requireViewer();
  if (viewer.kind === "partner") redirect("/dashboard");
  return viewer;
}

/** Partner staff only. Everyone else gets a 404 (we don't reveal the page exists). */
export async function requirePartner(): Promise<PartnerViewer> {
  const viewer = await getViewer();
  if (!viewer || viewer.kind !== "partner") notFound();
  return viewer;
}
