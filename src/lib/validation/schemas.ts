import { z } from "zod";

// Server-side input validation. Every server action parses its input with one of these
// before touching the database. The database enforces the same rules again (CHECKs).

// Same shape as the profiles.nickname CHECK: letters/digits/space . _ -, 2-24 chars,
// no '@', no run of 5+ digits (so nobody can paste an email or phone number as a name).
export const nickname = z
  .string()
  .trim()
  .regex(/^[\p{L}\p{N} ._-]{2,24}$/u, "Use 2 to 24 letters, numbers, spaces, dots or dashes.")
  .refine((v) => !v.includes("@") && !/\d{5,}/.test(v), "Please don't use an email or phone number.");

export const uuid = z.uuid();

export const joinSchema = z.object({
  code: z.string().trim().min(8).max(40),
  nickname,
  email: z.email().max(254),
  password: z.string().min(10, "At least 10 characters.").max(72),
});

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

const situationTag = z.enum([
  "er_discharge", "anxiety", "depression", "self_harm", "eating_concerns",
  "substance_use", "school_stress", "bullying", "grief", "family_conflict",
]);
const timeOfDay = z.enum(["morning", "afternoon", "evening", "night"]);

export const onboardingSchema = z.object({
  tags: z.array(situationTag).max(5),
  stage: z.enum(["just_after_crisis", "newly_diagnosed", "long_term"]).nullable(),
  childAge: z.enum(["under_13", "13_15", "16_17", "18_plus"]).nullable(),
  language: z.enum(["en", "fr", "es", "pa", "zh", "tl", "ar", "other"]),
  times: z.array(timeOfDay).max(4),
  city: z
    .enum([
      "calgary", "edmonton", "vancouver", "victoria", "winnipeg",
      "toronto", "ottawa", "montreal", "halifax", "other",
    ])
    .nullable(),
  norms: z.literal(true, "Please agree to the circle norms to continue."),
});

export const messageSchema = z
  .object({
    circleId: uuid.nullable(),
    threadId: uuid.nullable(),
    body: z.string().max(2000),
    kind: z.enum(["text", "checkin"]),
    score: z.number().int().min(1).max(5).nullable(),
  })
  .refine((v) => (v.circleId === null) !== (v.threadId === null), "Pick one place to send to.");

export const noteSchema = z.object({
  recipient: uuid,
  sticker: z.enum(["shell", "lily", "axolotl"]),
  color: z.enum(["blush", "lake", "mint", "lilac", "peach"]),
  body: z.string().trim().min(1, "Write something first.").max(280, "Keep it under 280 characters."),
});

export const inviteSchema = z.object({
  role: z.enum(["parent", "youth", "young_adult", "mentor"]),
  ageBand: z.enum(["13_15", "16_17", "18_24", "25_plus"]),
  maxUses: z.coerce.number().int().min(1).max(10),
  ttlDays: z.coerce.number().int().min(1).max(30),
  label: z.string().trim().max(40).optional(),
});

export const reviewSchema = z.object({
  id: uuid,
  status: z.enum(["open", "reviewing", "resolved"]),
  note: z.string().trim().max(500).optional(),
});

export const profileSchema = z.object({
  nickname,
  sticker: z.enum(["shell", "lily", "axolotl"]),
});

export const deleteSchema = z.object({
  confirm: z.string().trim().min(1),
});

/** First human-readable message from a zod error. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "That doesn't look right. Please check and try again.";
}
