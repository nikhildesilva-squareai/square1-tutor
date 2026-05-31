"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/tutor", label: "AI Tutor", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarNavProps {
  userEmail: string;
  userId: string;
}

export function SidebarNav({ userEmail }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex lg:w-60 flex-col shrink-0 bg-surface border-r border-border h-full">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-md)] bg-brand flex items-center justify-center">
            <span className="text-xs font-bold text-white">S1</span>
          </div>
          <span className="text-sm font-bold text-ink">Square 1 AI</span>
        </div>
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
  );
}
