"use client";

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
  MessageSquarePlus,
  Settings,
  LogOut,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUnreadMessages } from "@/lib/hooks/useUnreadMessages";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/portfolio", label: "Portfolio", icon: Award },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/notes", label: "Study Hub", icon: Bookmark },
  { href: "/tutor", label: "Nova", icon: MessageSquare },
];

interface SidebarNavProps {
  userEmail: string;
  userId: string;
}

export function SidebarNav({ userEmail }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnreadMessages();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");
  const messagesActive = pathname === "/messages" || pathname.startsWith("/messages/");

  const footerItem =
    "flex items-center gap-3 px-4 h-10 w-full rounded-lg text-sm font-medium transition-all";
  const footerInactive =
    "text-ink-secondary hover:bg-surface-alt hover:text-ink border border-transparent";
  const footerActive = "bg-surface-tint text-brand border border-brand/20";

  return (
    <aside
      className="hidden lg:flex lg:w-64 flex-col shrink-0 border-r border-border bg-surface h-full"
    >
      {/* Logo */}
      <div className="h-16 px-5 flex items-center">
        <Logo variant="dark" size="sm" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
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
            </Link>
          );
        })}
      </nav>

      {/* User footer — account + utility items (Settings, Feedback, Messages) */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <div className="px-4 py-2 mb-1 flex items-center justify-between">
          <p className="text-xs text-ink-muted truncate">{userEmail}</p>
          <ThemeToggle />
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(footerItem, settingsActive ? footerActive : footerInactive)}
        >
          <Settings className="w-4 h-4" />
          <span className="flex-1 text-left">Settings</span>
        </Link>

        {/* Feedback — opens the FeedbackWidget panel (it listens for this event) */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-feedback"))}
          className={cn(footerItem, footerInactive)}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="flex-1 text-left">Feedback</span>
        </button>

        {/* Messages */}
        <Link
          href="/messages"
          className={cn(footerItem, messagesActive ? footerActive : footerInactive)}
        >
          <MessagesSquare className="w-4 h-4" />
          <span className="flex-1 text-left">Messages</span>
          {unread > 0 && (
            <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 h-10 w-full rounded-lg text-sm font-medium text-ink-secondary hover:bg-error-bg hover:text-error transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="flex-1 text-left">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
