import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { ReviewDeskClient } from "./ReviewDeskClient";

// ═══════════════════════════════════════════════════════════════════════════════
// The newsroom review desk — where the daily human gate happens.
//
// Deliberately NOT under /admin: that panel is local-only in production, but
// this review has to happen in production every morning. The gate here is full
// session auth (getUser + isAdminEmail) — nothing comes from the query string,
// which is the pattern the pre-launch audit flagged and killed.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

export default async function NewsroomDeskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-surface-soft">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><Logo variant="dark" size="sm" /></Link>
            <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">Newsroom desk</span>
          </div>
          <Link href="/newsroom" className="text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
            View public newsroom →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ReviewDeskClient reviewerEmail={user.email ?? ""} />
      </main>
    </div>
  );
}
