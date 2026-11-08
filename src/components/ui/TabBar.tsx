"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/circle", label: "Circle", icon: "◐" },
  { href: "/chats", label: "Chats", icon: "✉" },
  { href: "/notes", label: "Notes", icon: "❀" },
  { href: "/me", label: "Me", icon: "☺" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md justify-around gap-1 border-t border-white/70 bg-white/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl text-xs font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-ink " +
              (active ? "bg-lilac/70 text-ink" : "text-ink-soft hover:bg-white/70")
            }
          >
            <span aria-hidden="true" className={"text-lg leading-none transition " + (active ? "scale-110" : "")}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
