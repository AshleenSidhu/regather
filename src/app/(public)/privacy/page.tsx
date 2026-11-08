import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Privacy · Regather" };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-2 text-xl font-bold">{title}</h2>
    <div className="flex flex-col gap-2 text-ink-soft">{children}</div>
  </section>
);

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <div>
        <h1 className="text-3xl font-bold text-on-sky">How we protect your privacy</h1>
        <p className="mt-2 text-on-sky/85">
          Plain language, no tricks. Regather holds sensitive information, so we collect as little
          as we can.
        </p>
      </div>

      <Card tone="cream" className="flex flex-col gap-6">
        <Section title="What we keep">
          <p>A nickname, your role and age range (set from your invite code), an optional city from a list, the tags you chose, and your messages and notes. Your email is used only to sign in.</p>
        </Section>
        <Section title="What we never ask for">
          <p>No real names, birthdays, home addresses, GPS locations, or photos. We don&apos;t use ads, trackers or analytics.</p>
        </Section>
        <Section title="Who can see what">
          <p>Only members of a circle can read it, plus its mentor. Youth and adults are kept apart: teens and parents never share a circle, can&apos;t message each other, and can&apos;t send each other notes. Private chats start only when both people agree, and only between people of the same role and age group.</p>
          <p>Your program (the partner who gave you a code) can see how many people are in each circle and how active it is. They can&apos;t read your circle chats or private chats.</p>
        </Section>
        <Section title="Safety checks">
          <p>Every message and note is checked for words that suggest someone may be in danger. If one does, you immediately see numbers you can call (9-8-8, Distress Centre Calgary, 9-1-1), and a copy of that message goes to a moderator at your program so someone can check in. Messages are never silently removed. Phone numbers, emails, links and addresses are hidden from messages until you&apos;ve built up trust in the community.</p>
          <p>
            <strong>AI disclosure:</strong> if enabled, we may send the text of a message (only the text, never your name, account or any profile details) to Google&apos;s Gemini API as a second safety check. We use it only to spot possible crisis language.
          </p>
        </Section>
        <Section title="Your control">
          <p>You can download everything we hold about you, or delete your account, any time from the Me tab. Deleting removes your profile, messages, notes and connections. The one exception: if a message was flagged for safety, a copy is kept for review without any link back to you.</p>
        </Section>
        <Section title="Security">
          <p>Your sign-in is kept in a cookie that page scripts can&apos;t read. Every table is locked down by default and the rules are enforced in the database itself. Invite codes are long, random, single-use or limited, expire, and are stored only as a one-way hash.</p>
        </Section>
      </Card>

      <p className="text-center text-on-sky/85">
        <Link href="/" className="font-bold underline underline-offset-4">
          Back home
        </Link>
      </p>
    </div>
  );
}
