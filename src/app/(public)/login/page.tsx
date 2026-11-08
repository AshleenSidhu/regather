import Link from "next/link";
import { AuthShell } from "@/components/home/AuthShell";
import { LoginForm } from "./LoginForm";
import "../landing.css";

export const metadata = { title: "Sign in · Regather" };

export default function LoginPage() {
  return (
    <AuthShell
      hello="Welcome back,"
      soft="good to see you."
      lead="Your pond is right where you left it."
      alt={<>New here? <Link href="/join">Join with a code</Link></>}
    >
      <LoginForm />
    </AuthShell>
  );
}
