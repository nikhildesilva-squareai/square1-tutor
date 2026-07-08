"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Discover", href: "/community" },
  { label: "Post", href: "/community/feed" },
  { label: "Messages", href: "/messages" },
];

/** Discover / Post / Messages pill tab bar shown across the community area. */
export function CommunityTabs() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex gap-1 rounded-full bg-surface-alt p-1">
      {TABS.map((t) => {
        const active =
          t.href === "/community" ? pathname === "/community" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              active
                ? "rounded-full bg-surface px-5 py-2 text-[15px] font-semibold text-brand shadow-[0_1px_2px_0_rgba(21,47,84,0.08)]"
                : "rounded-full px-5 py-2 text-[15px] font-medium text-ink-secondary transition-colors hover:text-ink"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
