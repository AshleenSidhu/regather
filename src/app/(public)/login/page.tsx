import Link from "next/link";
import { Logo } from "@/components/axolotl/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Regather" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-10">
      <div className="flex justify-center">
        <Logo variant="mark" className="h-20 w-auto" />
      </div>
      <h1 className="text-center text-3xl font-bold text-on-sky">Welcome back</h1>
      <LoginForm />
      <p className="text-center text-on-sky/85">
        New here?{" "}
        <Link href="/join" className="font-bold underline underline-offset-4">
          Join with a code
        </Link>
      </p>
    </div>
  );
}
