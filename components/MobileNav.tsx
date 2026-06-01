"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses",   label: "Courses",    icon: BookOpen         },
  { href: "/projects",  label: "My Projects", icon: FolderKanban    },
  { href: "/tutor",     label: "AI Tutor",   icon: MessageSquare    },
  { href: "/settings",  label: "Settings",   icon: Settings         },
];

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* ── Mobile/Tablet top bar (shown below lg) ── */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-surface border-b border-border shrink-0 z-30">
        {/* Logo mark */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[var(--radius-md)] bg-brand flex items-center justify-center">
            <span className="text-xs font-bold text-white">S1</span>
          </div>
          <span className="text-sm font-bold text-ink">Square 1 AI</span>
        </div>
        {/* Hamburger button */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg text-ink-secondary hover:bg-surface-alt hover:text-ink transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in drawer ── */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-surface border-r border-border z-50 flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[var(--radius-md)] bg-brand flex items-center justify-center">
              <span className="text-xs font-bold text-white">S1</span>
            </div>
            <span className="text-sm font-bold text-ink">Square 1 AI</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="p-2 rounded-lg text-ink-secondary hover:bg-surface-alt hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                  isActive
                    ? "bg-surface-tint text-brand"
                    : "text-ink-secondary hover:bg-surface-alt hover:text-ink"
                )}
              >
                <Icon size={17} className={isActive ? "text-brand" : "text-ink-muted"} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-ink truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[var(--radius-md)] text-sm font-medium text-ink-secondary hover:bg-error-bg hover:text-error transition-colors"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
