import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/home/AuthShell";
import { JoinForm } from "./JoinForm";
import "../landing.css";

export const metadata = { title: "Join with a code · Regather" };

export default function JoinPage() {
  return (
    <AuthShell
      hello="Welcome in,"
      soft="we're glad you're here."
      lead="Your code is your key. It came from the program that invited you."
      alt={<>Already have an account? <Link href="/login">Sign in</Link></>}
    >
      <Suspense>
        <JoinForm />
      </Suspense>
    </AuthShell>
  );
}
