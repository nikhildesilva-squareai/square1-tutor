"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Award,
  BarChart3,
  MessageSquare,
  MessagesSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

const nav = [
  { href: "/dashboard", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/courses",   label: "Courses",     icon: BookOpen        },
  { href: "/projects",  label: "My Projects", icon: FolderKanban    },
  { href: "/portfolio", label: "Portfolio",   icon: Award           },
  { href: "/progress",  label: "Progress",    icon: BarChart3       },
  { href: "/tutor",     label: "Nova",        icon: MessageSquare   },
  { href: "/messages",  label: "Messages",    icon: MessagesSquare  },
];

interface MobileNavProps {
  userEmail: string;
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const unread   = useUnreadMessages();

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
      {/* Mobile/Tablet top bar (shown below lg) */}
      <div
        className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-surface shrink-0 z-30"
      >
        <Logo variant="dark" size="sm" />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-lg text-ink hover:bg-surface-alt transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 border-r border-border bg-surface z-50 flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <Logo variant="dark" size="sm" />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="p-2 rounded-lg text-ink hover:bg-surface-alt transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const showDot = href === "/messages" && unread > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "h-10 px-4 rounded-lg flex items-center gap-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-surface-tint text-brand border border-brand/20"
                    : "text-ink-secondary hover:bg-surface-alt hover:text-ink border border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{label}</span>
                {showDot && (
                  <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <div className="px-4 py-2 mb-1">
            <p className="text-xs text-ink-muted truncate">{userEmail}</p>
          </div>

          {/* Settings — kept low, next to Sign out */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-4 h-10 w-full rounded-lg text-xs font-medium transition-all",
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-surface-tint text-brand border border-brand/20"
                : "text-ink-secondary hover:bg-surface-alt hover:text-ink border border-transparent"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 h-10 w-full rounded-lg text-xs text-ink-secondary hover:bg-error-bg hover:text-error transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
