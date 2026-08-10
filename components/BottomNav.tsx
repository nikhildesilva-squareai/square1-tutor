"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Sparkles,
  Ellipsis,
  Bookmark,
  BarChart3,
  Target,
  Award,
  LifeBuoy,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

// Rebuilt 2026-08-10 (UX review N2/N5): icons come from lucide (same set as
// the sidebar — one visual language), Nova gets a first-class tab, and "More"
// is an actual menu sheet instead of a hard link to Settings. A student
// tapping More looking for Study Hub or Career now finds it.

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tutor", label: "Nova", icon: Sparkles },
];

const moreItems: { href: string; label: string; icon: LucideIcon; sub: string }[] = [
  { href: "/notes", label: "Study Hub", icon: Bookmark, sub: "Notes, flashcards & review" },
  { href: "/progress", label: "Progress", icon: BarChart3, sub: "Streaks, mastery & milestones" },
  { href: "/portfolio", label: "Portfolio", icon: Award, sub: "Your public proof of work" },
  { href: "/career", label: "Career", icon: Target, sub: "Job targets & gap maps" },
  { href: "/messages", label: "Support", icon: LifeBuoy, sub: "Talk to the Square 1 team" },
  { href: "/settings", label: "Settings", icon: Settings, sub: "Account & preferences" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Route changes close the sheet — navigating from it must never leave a
  // stale overlay behind the new page.
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = moreItems.some((i) => isActive(i.href));

  return (
    <>
      {/* More sheet — bottom sheet above the tab bar */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-label="More menu">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-16 mb-[env(safe-area-inset-bottom)] rounded-t-2xl border-t border-border bg-surface p-3 pb-4 shadow-[0_-18px_40px_-20px_rgba(15,23,42,0.35)] animate-fade-in-up">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">More</span>
              <div className="flex items-center gap-1">
                <ThemeToggle className="h-8 w-8" />
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map(({ href, label, icon: Icon, sub }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-xl border p-3 transition-colors",
                    isActive(href)
                      ? "border-brand/25 bg-surface-tint text-brand"
                      : "border-border bg-surface-soft text-ink hover:bg-surface-alt",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{label}</span>
                    <span className="block truncate text-[10.5px] text-ink-muted">{sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16 items-center justify-around px-2">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(href) && !moreOpen;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
                  active ? "text-brand" : "text-ink-muted",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[10px] font-semibold", active ? "text-brand" : "text-ink-muted")}>
                  {label}
                </span>
                {active && <div className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className={cn(
              "relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
              moreOpen || moreActive ? "text-brand" : "text-ink-muted",
            )}
          >
            <Ellipsis className="h-5 w-5" strokeWidth={moreOpen || moreActive ? 2.5 : 2} />
            <span className={cn("text-[10px] font-semibold", moreOpen || moreActive ? "text-brand" : "text-ink-muted")}>
              More
            </span>
            {(moreOpen || moreActive) && <div className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
          </button>
        </div>
      </nav>
    </>
  );
}
