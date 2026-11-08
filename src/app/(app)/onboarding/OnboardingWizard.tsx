"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { Lotl } from "@/components/lotl/Lotl";
import { Matching } from "@/components/pond/Matching";
import { CheckIcon } from "@/components/ui/Icons";
import { FormError } from "@/components/ui/Field";
import { PillButton } from "@/components/ui/PillButton";
import {
  CHILD_AGES, CITIES, LANGUAGES, ROLE_BLURBS, ROLE_LABELS, SITUATION_TAGS, STAGES, TIMES_OF_DAY,
  type AppRole, type ChildAgeBand, type SituationTag, type Stage, type TimeOfDay,
} from "@/lib/options";

const ROLE_CARDS: AppRole[] = ["youth", "parent", "young_adult", "mentor"];

const PROMISES = [
  { title: "Share what you've lived, not medical advice.", body: "Say what has helped you, and let others do the same." },
  { title: "What's said in the pond stays in the pond.", body: "Everyone here is trusting everyone else." },
  { title: "If someone may be in danger, we help right away.", body: "We show them crisis lines, and someone at your program may check in." },
];

const STAGE_NOTES: Record<Stage, string> = {
  just_after_crisis: "The last few days or weeks",
  newly_diagnosed: "Still learning what this is",
  long_term: "It's been a while now",
};

type StepId = "role" | "tags" | "stage" | "age" | "times" | "place" | "promises";

function Choice({ label, selected, onClick, note }: { label: string; selected: boolean; onClick: () => void; note?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        "lift min-h-12 rounded-full border px-5 py-2 text-left text-base font-bold " +
        (selected ? "border-transparent bg-[#f7a8ba] text-[#1b2142]" : "border-white/15 bg-white/10 text-white hover:bg-white/16")
      }
    >
      <span className="flex items-center gap-2">
        {selected && <CheckIcon className="pop-in h-4 w-4" />}
        {label}
      </span>
      {note && <span className={"block text-sm font-medium " + (selected ? "text-[#1b2142]/70" : "text-white/65")}>{note}</span>}
    </button>
  );
}

function toggle<T>(list: T[], item: T, max: number): T[] {
  if (list.includes(item)) return list.filter((x) => x !== item);
  return list.length >= max ? list : [...list, item];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function OnboardingWizard({ role, nickname }: { role: AppRole; nickname: string }) {
  const router = useRouter();
  const steps: StepId[] = ["role", "tags", "stage", ...(role === "parent" ? (["age"] as const) : []), "times", "place", "promises"];
  const [i, setI] = useState(0);
  const step = steps[i];

  const [tags, setTags] = useState<SituationTag[]>([]);
  const [stage, setStage] = useState<Stage | null>(null);
  const [childAge, setChildAge] = useState<ChildAgeBand | null>(null);
  const [language, setLanguage] = useState("en");
  const [times, setTimes] = useState<TimeOfDay[]>([]);
  const [city, setCity] = useState("");
  const [agreed, setAgreed] = useState<boolean[]>(PROMISES.map(() => false));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const next = () => setI((n) => Math.min(steps.length - 1, n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  function submit() {
    setError(undefined);
    startTransition(async () => {
      // Let the matching moment breathe for a beat, even when the server is quick.
      const [res] = await Promise.all([
        completeOnboardingAction({
          tags, stage, childAge: role === "parent" ? childAge : null, language, times,
          city: city || null, norms: true,
        }),
        wait(2600),
      ]);
      if (res.ok) router.replace("/welcome");
      else setError(res.error ?? "Something went wrong. Please try again.");
    });
  }

  const nav = ({ nextLabel = "Next", canNext = true, onNext = next }: { nextLabel?: string; canNext?: boolean; onNext?: () => void } = {}) => (
    <div className="mt-auto flex gap-3 pt-4">
      {i > 0 && <PillButton onClick={back} disabled={pending}>Back</PillButton>}
      <PillButton variant="ink" className="flex-1" disabled={!canNext || pending} onClick={onNext}>
        {nextLabel}
      </PillButton>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2">
      {pending && <Matching />}

      {/* progress: little bubbles that fill as you go */}
      <ol aria-label={`Step ${i + 1} of ${steps.length}`} className="flex justify-center gap-2">
        {steps.map((s, n) => (
          <li
            key={s}
            aria-current={n === i ? "step" : undefined}
            className={
              "h-3 rounded-full border border-white/70 transition-all duration-500 " +
              (n === i ? "w-9 bg-white" : n < i ? "w-3 bg-white/70" : "w-3 bg-white/20")
            }
          />
        ))}
      </ol>

      <section key={step} className="enter flex flex-1 flex-col gap-5">
        {step === "role" && (
          <>
            <div className="text-center">
              <Lotl mood="wave" className="mx-auto h-24 w-auto" title="" />
              <p className="mt-1 text-on-sky-soft">Hi {nickname}. I&apos;m Lotl.</p>
              <h1 className="font-display text-[44px] leading-tight">I am <span className="tone">a…</span></h1>
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {ROLE_CARDS.map((r) => {
                const mine = r === role;
                return (
                  <li key={r}>
                    <div
                      aria-current={mine ? "true" : undefined}
                      className={
                        "flex h-full flex-col gap-1 rounded-[24px] border p-4 transition " +
                        (mine ? "paper border-ink! ring-2 ring-ink" : "border-white/20 bg-white/10 text-on-sky opacity-60")
                      }
                    >
                      <span className="flex items-center justify-between font-extrabold">
                        {ROLE_LABELS[r]}
                        {mine && <CheckIcon className="h-5 w-5" />}
                      </span>
                      <span className={"text-sm " + (mine ? "text-ink-soft" : "")}>{ROLE_BLURBS[r]}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-center text-sm text-on-sky-soft">
              Your invite code chose this. If it isn&apos;t right, ask the person who gave it to you.
            </p>
            {nav({ nextLabel: "That's me" })}
          </>
        )}

        {step === "tags" && (
          <>
            <Heading title="What are you facing?" sub="Pick up to 5, or skip. It helps us find people who get it." />
            <div className="flex flex-wrap gap-2.5">
              {SITUATION_TAGS.map((t) => (
                <Choice key={t.value} label={t.label} selected={tags.includes(t.value)} onClick={() => setTags((c) => toggle(c, t.value, 5))} />
              ))}
            </div>
            {nav({ nextLabel: tags.length ? "Next" : "Skip for now" })}
          </>
        )}

        {step === "stage" && (
          <>
            <Heading title="Where are things right now?" sub="There's no wrong answer." />
            <div className="flex flex-col gap-3">
              {STAGES.map((s) => (
                <Choice key={s.value} label={s.label} note={STAGE_NOTES[s.value]} selected={stage === s.value} onClick={() => setStage(stage === s.value ? null : s.value)} />
              ))}
            </div>
            {nav({ nextLabel: stage ? "Next" : "Skip for now" })}
          </>
        )}

        {step === "age" && (
          <>
            <Heading title="How old is your child?" sub="So you're with parents of kids around the same age." />
            <div className="grid grid-cols-2 gap-3">
              {CHILD_AGES.map((a) => (
                <Choice key={a.value} label={a.label} selected={childAge === a.value} onClick={() => setChildAge(childAge === a.value ? null : a.value)} />
              ))}
            </div>
            {nav({ nextLabel: childAge ? "Next" : "Skip for now" })}
          </>
        )}

        {step === "times" && (
          <>
            <Heading title="When are you usually up?" sub="We'll look for people who are awake when you are." />
            <div className="grid grid-cols-2 gap-3">
              {TIMES_OF_DAY.map((t) => (
                <Choice key={t.value} label={t.label} selected={times.includes(t.value)} onClick={() => setTimes((c) => toggle(c, t.value, 4))} />
              ))}
            </div>
            {nav({ nextLabel: times.length ? "Next" : "Skip for now" })}
          </>
        )}

        {step === "place" && (
          <>
            <Heading title="Where's home?" sub="Your sky will follow your city's real sunrise, sunset and weather. Only the city, never an address." />
            <div className="paper flex flex-col gap-4 p-5">
              <label className="flex flex-col gap-1.5 font-bold">
                City
                <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfd6] bg-white px-3 font-semibold">
                  <option value="">Prefer not to say</option>
                  {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 font-bold">
                Language
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="min-h-12 rounded-2xl border border-[#eadfd6] bg-white px-3 font-semibold">
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </label>
            </div>
            {nav()}
          </>
        )}

        {step === "promises" && (
          <>
            <Heading title="Our pond promises" sub="Tap each one to agree. They keep everyone safe." />
            <ul className="flex flex-col gap-3">
              {PROMISES.map((n, k) => (
                <li key={n.title}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={agreed[k]}
                    onClick={() => setAgreed((a) => a.map((v, j) => (j === k ? !v : v)))}
                    className={"lift paper flex w-full items-start gap-3 p-5 text-left " + (agreed[k] ? "ring-2 ring-lily-deep" : "")}
                  >
                    <span aria-hidden="true" className={"mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition " + (agreed[k] ? "border-lily-deep bg-lily text-ink" : "border-ink/25")}>
                      {agreed[k] && <CheckIcon className="pop-in h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block font-extrabold">{n.title}</span>
                      <span className="block text-ink-soft">{n.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <FormError message={error} />
            {nav({ nextLabel: "Find my pond", canNext: agreed.every(Boolean), onNext: submit })}
          </>
        )}
      </section>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-semibold text-on-sky sm:text-4xl">{title}</h1>
      <p className="mt-2 text-on-sky-soft">{sub}</p>
    </div>
  );
}
