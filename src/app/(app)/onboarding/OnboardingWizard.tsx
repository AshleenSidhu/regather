"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { Card } from "@/components/ui/Card";
import { FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import {
  CHILD_AGES, CITIES, LANGUAGES, ROLE_BLURBS, ROLE_LABELS, SITUATION_TAGS, STAGES, TIMES_OF_DAY,
  type AppRole, type ChildAgeBand, type SituationTag, type Stage, type TimeOfDay,
} from "@/lib/options";

const ROLE_PILLS: AppRole[] = ["youth", "young_adult", "parent", "mentor"];

const NORMS = [
  { title: "Share your experience, not medical advice.", body: "Say what has helped you, and let others do the same." },
  { title: "What's said in the circle stays in the circle.", body: "Everyone here is trusting everyone else." },
  { title: "If someone may be in danger, we help right away.", body: "We show them crisis numbers, and a moderator at your program may check in." },
];

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        "min-h-11 rounded-full border px-5 py-2 text-base font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
        (selected ? "scale-[1.03] border-ink bg-ink text-white shadow-soft" : "border-white bg-white/80 text-ink hover:bg-white")
      }
    >
      {label}
    </button>
  );
}

function toggle<T>(list: T[], item: T, max: number): T[] {
  if (list.includes(item)) return list.filter((x) => x !== item);
  return list.length >= max ? list : [...list, item];
}

export function OnboardingWizard({ role, nickname }: { role: AppRole; nickname: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<SituationTag[]>([]);
  const [stage, setStage] = useState<Stage | null>(null);
  const [childAge, setChildAge] = useState<ChildAgeBand | null>(null);
  const [language, setLanguage] = useState("en");
  const [times, setTimes] = useState<TimeOfDay[]>([]);
  const [city, setCity] = useState("");
  const [agreed, setAgreed] = useState<boolean[]>(NORMS.map(() => false));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const allAgreed = agreed.every(Boolean);

  function submit() {
    setError(undefined);
    startTransition(async () => {
      const res = await completeOnboardingAction({
        tags, stage, childAge: role === "parent" ? childAge : null, language, times,
        city: city || null, norms: true,
      });
      if (res.ok) router.replace("/welcome");
      else setError(res.error ?? "Something went wrong. Please try again.");
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2">
      <ol aria-label="Progress" className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            aria-current={i === step ? "step" : undefined}
            className={"h-2.5 rounded-full transition-all duration-500 " + (i === step ? "w-8 bg-ink" : i < step ? "w-2.5 bg-ink/60" : "w-2.5 bg-white/80")}
          />
        ))}
      </ol>

      {step === 0 && (
        <section className="fade-up flex flex-col items-center gap-5 text-center">
          <p className="text-on-sky/85">Hi {nickname}.</p>
          <h1 className="text-3xl font-bold text-on-sky">I am a…</h1>
          <div className="flex flex-wrap justify-center gap-3">
            {ROLE_PILLS.map((r) => (
              <button
                key={r}
                type="button"
                disabled={r !== role}
                aria-pressed={r === role}
                className={
                  "min-h-12 rounded-full border px-6 py-2.5 text-base font-semibold shadow-soft transition " +
                  (r === role ? "scale-105 border-ink bg-ink text-white" : "border-white bg-white/50 text-ink-soft opacity-60")
                }
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
          <Card tone="cream" className="w-full">
            <p className="font-semibold">{ROLE_LABELS[role]}</p>
            <p className="text-ink-soft">{ROLE_BLURBS[role]}</p>
            <p className="mt-3 text-sm text-ink-soft">
              Your invite code set this. If it isn&apos;t right, ask the person who gave it to you.
            </p>
          </Card>
          <PillButton variant="ink" className="w-full" onClick={() => setStep(1)}>
            That&apos;s me
          </PillButton>
        </section>
      )}

      {step === 1 && (
        <section className="fade-up flex flex-col gap-5">
          <h1 className="text-center text-3xl font-bold text-on-sky">A little about your situation</h1>
          <p className="text-center text-on-sky/85">This helps us find the right circle. Skip anything you like.</p>
          <Card tone="cream" className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 font-bold">What are you facing? <span className="font-normal text-ink-soft">(up to 5)</span></legend>
              <div className="flex flex-wrap gap-2.5">
                {SITUATION_TAGS.map((t) => (
                  <Choice key={t.value} label={t.label} selected={tags.includes(t.value)} onClick={() => setTags((c) => toggle(c, t.value, 5))} />
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 font-bold">Where are things right now?</legend>
              <div className="flex flex-wrap gap-2.5">
                {STAGES.map((s) => (
                  <Choice key={s.value} label={s.label} selected={stage === s.value} onClick={() => setStage(stage === s.value ? null : s.value)} />
                ))}
              </div>
            </fieldset>
            {role === "parent" && (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 font-bold">Your child&apos;s age</legend>
                <div className="flex flex-wrap gap-2.5">
                  {CHILD_AGES.map((a) => (
                    <Choice key={a.value} label={a.label} selected={childAge === a.value} onClick={() => setChildAge(childAge === a.value ? null : a.value)} />
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 font-bold">When are you usually up?</legend>
              <div className="flex flex-wrap gap-2.5">
                {TIMES_OF_DAY.map((t) => (
                  <Choice key={t.value} label={t.label} selected={times.includes(t.value)} onClick={() => setTimes((c) => toggle(c, t.value, 4))} />
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 font-bold">
                Language
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="min-h-12 rounded-2xl border border-white bg-white px-3 font-normal">
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 font-bold">
                City <span className="sr-only">(optional)</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-12 rounded-2xl border border-white bg-white px-3 font-normal">
                  <option value="">Prefer not to say</option>
                  {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
            </div>
          </Card>
          <div className="flex gap-3">
            <PillButton onClick={() => setStep(0)}>Back</PillButton>
            <PillButton variant="ink" className="flex-1" onClick={() => setStep(2)}>Next</PillButton>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="fade-up flex flex-col gap-5">
          <h1 className="text-center text-3xl font-bold text-on-sky">Our circle norms</h1>
          <p className="text-center text-on-sky/85">Tap each one to agree. They keep the circle safe.</p>
          <ul className="flex flex-col gap-3">
            {NORMS.map((n, i) => (
              <li key={n.title}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={agreed[i]}
                  onClick={() => setAgreed((a) => a.map((v, j) => (j === i ? !v : v)))}
                  className={
                    "flex w-full items-start gap-3 rounded-card border p-5 text-left shadow-soft transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
                    (agreed[i] ? "border-ink bg-white" : "border-white bg-white/70 hover:bg-white/90")
                  }
                >
                  <span aria-hidden="true" className={"mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition " + (agreed[i] ? "border-ink bg-ink text-white" : "border-ink/30")}>
                    {agreed[i] ? "✓" : ""}
                  </span>
                  <span>
                    <span className="block font-bold">{n.title}</span>
                    <span className="block text-ink-soft">{n.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <FormError message={error} />
          <div className="flex gap-3">
            <PillButton onClick={() => setStep(1)} disabled={pending}>Back</PillButton>
            <PillButton variant="ink" className="flex-1" disabled={!allAgreed || pending} onClick={submit}>
              {pending ? "Finding your circle…" : "Find my circle"}
            </PillButton>
          </div>
        </section>
      )}
    </div>
  );
}
