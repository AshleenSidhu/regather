import { logoutAction } from "@/app/actions/auth";
import { Card } from "@/components/ui/Card";
import { PillButton } from "@/components/ui/PillButton";
import { requireViewer } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/options";
import { DeleteAccount } from "./DeleteAccount";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Me · Regather" };

export default async function MePage() {
  const viewer = await requireViewer();
  if (viewer.kind !== "member") {
    return (
      <Card tone="cream" className="mt-4">
        <p>Partner accounts are managed from the dashboard.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="text-3xl font-bold text-on-sky">Me</h1>

      <Card tone="cream" className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">Your profile</h2>
          <p className="text-ink-soft">
            You&apos;re a <strong>{ROLE_LABELS[viewer.role]}</strong>. Your invite code set this, so it
            can&apos;t be changed here.
          </p>
        </div>
        <ProfileForm nickname={viewer.nickname} sticker={viewer.sticker} />
      </Card>

      <Card tone="lake" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Your data</h2>
        <p className="text-ink-soft">Download everything we hold about you, as a file.</p>
        {/* Plain link: a GET that returns your own data as a download. */}
        <a
          href="/me/export"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full border border-white bg-white/90 px-6 py-2.5 font-semibold shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Download my data
        </a>
        <p className="text-sm text-ink-soft">
          <a href="/privacy" className="underline underline-offset-4">How we protect your privacy</a>
        </p>
      </Card>

      <Card tone="blush" className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Delete my account</h2>
        <DeleteAccount nickname={viewer.nickname} />
      </Card>

      <form action={logoutAction}>
        <PillButton type="submit" className="w-full">Sign out</PillButton>
      </form>
    </div>
  );
}
