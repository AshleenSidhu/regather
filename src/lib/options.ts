// Shared option lists. Values match the database enums; labels are what people see.
import type { Database } from "@/lib/database.types";

type Enums = Database["public"]["Enums"];

export type SituationTag = Enums["situation_tag"];
export type Stage = Enums["stage"];
export type TimeOfDay = Enums["time_of_day"];
export type ChildAgeBand = Enums["child_age_band"];
export type NoteSticker = Enums["note_sticker"];
export type AppRole = Enums["app_role"];
export type AgeBand = Enums["age_band"];

export const SITUATION_TAGS: { value: SituationTag; label: string }[] = [
  { value: "er_discharge", label: "Just left the ER" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Low mood" },
  { value: "self_harm", label: "Self-harm" },
  { value: "eating_concerns", label: "Eating concerns" },
  { value: "substance_use", label: "Substance use" },
  { value: "school_stress", label: "School stress" },
  { value: "bullying", label: "Bullying" },
  { value: "grief", label: "Grief or loss" },
  { value: "family_conflict", label: "Family conflict" },
];

export const STAGES: { value: Stage; label: string }[] = [
  { value: "just_after_crisis", label: "Just after a crisis" },
  { value: "newly_diagnosed", label: "Newly diagnosed" },
  { value: "long_term", label: "Long-term" },
];

export const TIMES_OF_DAY: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Mornings" },
  { value: "afternoon", label: "Afternoons" },
  { value: "evening", label: "Evenings" },
  { value: "night", label: "Late nights" },
];

export const CHILD_AGES: { value: ChildAgeBand; label: string }[] = [
  { value: "under_13", label: "Under 13" },
  { value: "13_15", label: "13 to 15" },
  { value: "16_17", label: "16 to 17" },
  { value: "18_plus", label: "18 or older" },
];

export const CITIES = [
  { value: "calgary", label: "Calgary" },
  { value: "edmonton", label: "Edmonton" },
  { value: "vancouver", label: "Vancouver" },
  { value: "victoria", label: "Victoria" },
  { value: "winnipeg", label: "Winnipeg" },
  { value: "toronto", label: "Toronto" },
  { value: "ottawa", label: "Ottawa" },
  { value: "montreal", label: "Montréal" },
  { value: "halifax", label: "Halifax" },
  { value: "other", label: "Somewhere else" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "pa", label: "ਪੰਜਾਬੀ" },
  { value: "zh", label: "中文" },
  { value: "tl", label: "Tagalog" },
  { value: "ar", label: "العربية" },
  { value: "other", label: "Other" },
] as const;

export const STICKERS: { value: NoteSticker; label: string; emoji: string }[] = [
  { value: "shell", label: "Shell", emoji: "🐚" },
  { value: "lily", label: "Lily", emoji: "🪷" },
  { value: "axolotl", label: "Axolotl", emoji: "🦎" },
];

export const NOTE_COLORS = [
  { value: "blush", label: "Blush", classes: "from-rose-50 to-blush" },
  { value: "lake", label: "Lake", classes: "from-sky-100 to-lake" },
  { value: "mint", label: "Mint", classes: "from-lime-50 to-mint" },
  { value: "lilac", label: "Lilac", classes: "from-violet-50 to-lilac" },
  { value: "peach", label: "Peach", classes: "from-orange-50 to-amber-100" },
] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
  youth: "Youth",
  parent: "Parent / caregiver",
  young_adult: "Young adult",
  mentor: "Mentor",
  partner: "Partner",
};

export const ROLE_BLURBS: Record<AppRole, string> = {
  youth: "13 to 17. A circle of other teens, with a trained young-adult mentor.",
  parent: "A circle of parents and caregivers who get it.",
  young_adult: "18 to 24. A circle of people your age.",
  mentor: "You guide a circle. Your partner set this up for you.",
  partner: "Partner staff.",
};

export const CRISIS_RESOURCES = [
  { name: "988 Suicide Crisis Helpline", detail: "Call or text, 24/7", tel: "988", display: "9-8-8" },
  { name: "Distress Centre Calgary", detail: "Call, 24/7", tel: "4032664357", display: "403-266-4357" },
  { name: "Emergency", detail: "If you are in danger right now", tel: "911", display: "9-1-1" },
] as const;

export function labelFor<T extends string>(
  list: readonly { value: T; label: string }[],
  value: T | null | undefined,
): string {
  return list.find((x) => x.value === value)?.label ?? "";
}
