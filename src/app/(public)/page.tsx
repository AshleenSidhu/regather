import { Suspense } from "react";
import { Axolotl } from "@/components/axolotl/Axolotl";
import { Logo } from "@/components/axolotl/Logo";
import { Card } from "@/components/ui/Card";
import { PillButton } from "@/components/ui/PillButton";
import { GoodbyeNote } from "./GoodbyeNote";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

export default function Landing() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-10 px-5 pb-16 pt-10 text-center">
      <Suspense>
        <GoodbyeNote />
      </Suspense>

      <div className="fade-up" style={delay(0)}>
        <Logo />
      </div>

      <h1 className="fade-up max-w-xl text-3xl font-bold leading-tight text-on-sky sm:text-4xl" style={delay(120)}>
        Families who get it, any hour.
      </h1>
      <p className="fade-up max-w-lg text-lg text-on-sky/85" style={delay(220)}>
        Small, private circles of people in the same situation, guided by a trained mentor.
        Joined by invitation from a program that vouches for you.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <div className="pop-in" style={delay(360)}>
          <PillButton href="/join" variant="ink">
            I have a code
          </PillButton>
        </div>
        <div className="pop-in" style={delay(460)}>
          <PillButton href="/login">Sign in</PillButton>
        </div>
      </div>

      <div className="relative -mx-5 h-28 w-screen max-w-full overflow-hidden" aria-hidden="true">
        <div className="axo-swim absolute left-0 top-1 w-32">
          <Axolotl />
        </div>
      </div>

      <section aria-label="What Regather offers" className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["lake", "A small circle of 5 to 8"],
            ["mint", "Chat any hour"],
            ["blush", "A mentor beside you"],
            ["lilac", "Help one tap away"],
          ] as const
        ).map(([tone, text], i) => (
          <div key={text} className="fade-up" style={delay(560 + i * 110)}>
            <Card tone={tone} ring>
              {text}
            </Card>
          </div>
        ))}
      </section>

      <footer className="mt-4 max-w-md text-on-sky/85">
        <p>
          In crisis right now? Call or text{" "}
          <a href="tel:988" className="font-bold underline underline-offset-4">
            9-8-8
          </a>
          , any time. If someone is in danger, call{" "}
          <a href="tel:911" className="font-bold underline underline-offset-4">
            9-1-1
          </a>
          .
        </p>
        <p className="mt-3 text-sm">
          <a href="/privacy" className="underline underline-offset-4">
            How we protect your privacy
          </a>
        </p>
      </footer>
    </div>
  );
}
