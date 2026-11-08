"use server";

import { revalidatePath } from "next/cache";
import { requireMemberAnyStage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstError, onboardingSchema } from "@/lib/validation/schemas";
import type { Database } from "@/lib/database.types";

type Args = Database["public"]["Functions"]["complete_onboarding"]["Args"];

export type CircleSummary = {
  id: string;
  name: string;
  kind: string;
  member_count: number;
  mentor_nickname: string | null;
};

export type OnboardingResult = { ok: boolean; error?: string; circle?: CircleSummary };

const GENERIC = "Something went wrong. Please try again.";

async function placeInCircle(): Promise<OnboardingResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_best_circle");
  const result = data as { ok?: boolean; circle?: CircleSummary } | null;
  if (error || !result?.ok || !result.circle) return { ok: false, error: GENERIC };
  revalidatePath("/", "layout");
  return { ok: true, circle: result.circle };
}

// Saves the tags, then matches the person into a circle. The client never chooses a circle.
export async function completeOnboardingAction(input: unknown): Promise<OnboardingResult> {
  await requireMemberAnyStage();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_onboarding", {
    p_tags: v.tags,
    p_stage: v.stage,
    p_child_age: v.childAge,
    p_language: v.language,
    p_times: v.times,
    p_city: v.city,
    p_norms: v.norms,
  } as unknown as Args);
  const saved = data as { ok?: boolean; error?: string } | null;
  // "already_onboarded" is fine: they may be retrying the matching step.
  if (error || (!saved?.ok && saved?.error !== "already_onboarded")) {
    return { ok: false, error: GENERIC };
  }

  return placeInCircle();
}

// Retry matching for someone who finished onboarding but isn't in a circle yet.
export async function joinCircleAction(): Promise<OnboardingResult> {
  await requireMemberAnyStage();
  return placeInCircle();
}
