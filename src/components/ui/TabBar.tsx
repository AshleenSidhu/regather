"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalmIcon, ChatsIcon, JarIcon, MeIcon, PondIcon } from "./Icons";

const TABS = [
  { href: "/pond", label: "Pond", Icon: PondIcon },
  { href: "/notes", label: "Jar", Icon: JarIcon },
  { href: "/calm", label: "Calm", Icon: CalmIcon },
  { href: "/chats", label: "Chats", Icon: ChatsIcon },
  { href: "/me", label: "Me", Icon: MeIcon },
];

/** The floating tab bar. The tab you're on sits in a white circle. No badges, no counts. */
export function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="tabbar">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}>
              <span className="tab-ico">
                <Icon className="h-[22px] w-[22px]" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
