"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  BarChart3,
  Bookmark,
  Users,
  MessagesSquare,
  Sparkles,
  Briefcase,
  Inbox,
  Settings,
  MessageSquarePlus,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { COMMUNITY_ENABLED } from "@/lib/flags";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

// Mirrors the desktop sidebar: core learning, then a labelled "Connect" group.
const learnNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/notes", label: "Study Hub", icon: Bookmark },
];

const connectNav: { href: string; label: string; icon: LucideIcon }[] = [
  ...(COMMUNITY_ENABLED ? [{ href: "/community", label: "Community", icon: Users }] : []),
  { href: "/messages", label: "Messages", icon: MessagesSquare },
  { href: "/tutor", label: "Nova", icon: Sparkles },
];

const ROW =
  "h-10 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors w-full";
const ROW_INACTIVE =
  "text-ink-secondary hover:bg-surface-alt hover:text-ink border border-transparent";
const ROW_ACTIVE = "bg-surface-tint text-brand border border-brand/20";

interface MobileNavProps {
  userEmail: string;
  userName?: string;
  isManager?: boolean;
  isAdmin?: boolean;
}

export function MobileNav({ userEmail, userName, isManager = false, isAdmin = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnreadMessages();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const name = userName?.trim() || userEmail.split("@")[0];
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const NavRow = ({ href, label, icon: Icon, badge }: { href: string; label: string; icon: LucideIcon; badge?: number }) => (
    <Link href={href} className={cn(ROW, isActive(href) ? ROW_ACTIVE : ROW_INACTIVE)}>
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <>
      {/* Mobile/Tablet top bar (shown below lg) */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-surface shrink-0 z-30">
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
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="space-y-0.5">
            {learnNav.map((item) => <NavRow key={item.href} {...item} />)}
          </div>

          <div className="my-2 h-px bg-border mx-1" />

          <p className="px-3 pt-1 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-muted">Connect</p>
          <div className="space-y-0.5">
            {connectNav.map((item) => (
              <NavRow key={item.href} {...item} badge={item.href === "/messages" ? unread : undefined} />
            ))}
          </div>

          {isManager && (
            <>
              <p className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-muted">Your team</p>
              <NavRow href="/business/dashboard" label="Manager portal" icon={Briefcase} />
            </>
          )}

          {isAdmin && (
            <>
              <p className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-muted">Team</p>
              <NavRow href="/inbox" label="Support inbox" icon={Inbox} />
            </>
          )}
        </nav>

        {/* Account card */}
        <div className="px-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-soft p-2.5">
            <div className="w-9 h-9 rounded-full bg-surface-tint text-brand flex items-center justify-center text-[13px] font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink truncate">{name}</p>
              <p className="text-[11px] text-ink-muted truncate">{userEmail}</p>
            </div>
            <ThemeToggle className="w-8 h-8 shrink-0" />
          </div>
        </div>

        {/* Utility rows — same style as the nav */}
        <div className="px-3 py-2 space-y-0.5">
          <Link href="/settings" className={cn(ROW, isActive("/settings") ? ROW_ACTIVE : ROW_INACTIVE)}>
            <Settings className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1">Settings</span>
          </Link>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-feedback"))}
            className={cn(ROW, ROW_INACTIVE)}
          >
            <MessageSquarePlus className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1 text-left">Feedback</span>
          </button>
          <button
            onClick={handleSignOut}
            className={cn(ROW, "text-ink-secondary hover:bg-error-bg hover:text-error border border-transparent")}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1 text-left">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
