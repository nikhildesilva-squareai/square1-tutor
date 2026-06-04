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
import { Logo } from "@/components/ui/logo";

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
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-border">
        <div className="px-4 py-2 mb-1">
          <p className="text-xs text-ink-muted truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 h-10 w-full rounded-lg text-xs text-ink-secondary hover:bg-error-bg hover:text-error transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
