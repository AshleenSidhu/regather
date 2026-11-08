import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/axolotl/Logo";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Join with a code · Regather" };

export default function JoinPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-10">
      <div className="flex justify-center">
        <Logo variant="mark" className="h-20 w-auto" />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-on-sky">Join with your code</h1>
        <p className="mt-2 text-on-sky/85">
          The program that invited you gave you a code. It lets us know you&apos;re vouched for,
          and it sets up the right circle for you.
        </p>
      </div>
      <Suspense>
        <JoinForm />
      </Suspense>
      <p className="text-center text-on-sky/85">
        Already have an account?{" "}
        <Link href="/login" className="font-bold underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
