import { Suspense } from "react";
import { GoodbyeNote } from "@/components/home/Extras";
import { LandingApp } from "@/components/home/LandingApp";
import "./landing.css";

export const metadata = {
  title: "Regather: peer support for families after a youth mental health crisis",
  description:
    "A private group of 5 to 8 families going through the same thing, with a mentor family, for 8 weeks. Join with a code from your clinic, ER or program.",
};

// The landing page is built like a calm mobile app (components/home/LandingApp).
export default function Home() {
  return (
    <LandingApp
      goodbye={
        <Suspense>
          <GoodbyeNote />
        </Suspense>
      }
    />
  );
}
