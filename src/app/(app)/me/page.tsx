import { logoutAction } from "@/app/actions/auth";
import { Lotl } from "@/components/lotl/Lotl";
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
      <div className="enter flex items-center gap-3">
        <Lotl mood="wave" className="h-20 w-auto" title="" />
        <div>
          <h1 className="font-display text-[40px] leading-tight">Hi, <span className="tone-soft">{viewer.nickname}</span></h1>
          <p className="text-on-sky-soft">{ROLE_LABELS[viewer.role]}</p>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your profile</h2>
          <p className="text-ink-soft">
            You&apos;re a <strong>{ROLE_LABELS[viewer.role]}</strong>. Your invite code set this, so it
            can&apos;t be changed here.
          </p>
        </div>
        <ProfileForm nickname={viewer.nickname} sticker={viewer.sticker} />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">Your data</h2>
        <p className="text-ink-soft">Download everything we hold about you, as a file.</p>
        {/* Plain link: a GET that returns your own data as a download. */}
        <a
          href="/me/export"
          className="lift inline-flex min-h-12 items-center justify-center self-start rounded-full border border-[#f0e4da] bg-white px-6 py-2.5 font-bold"
        >
          Download my data
        </a>
        <p className="text-sm text-ink-soft">
          <a href="/privacy" className="underline underline-offset-4">How we protect your privacy</a>
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">Delete my account</h2>
        <DeleteAccount nickname={viewer.nickname} />
      </Card>

      <form action={logoutAction}>
        <PillButton type="submit" className="w-full">Sign out</PillButton>
      </form>
    </div>
  );
}
