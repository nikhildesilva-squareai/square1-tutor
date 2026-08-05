import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
import { CurriculumDeskClient } from "./CurriculumDeskClient";

// ═══════════════════════════════════════════════════════════════════════════════
// Curriculum review desk — the human gate on the currency agent.
//
// Same auth posture as /desk/newsroom: full session auth plus the admin
// allowlist, nothing read from the query string. Deliberately not under /admin,
// which is local-only in production, because this review has to happen live.
// ═══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

export default async function CurriculumDeskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-surface-soft">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/"><Logo variant="dark" size="sm" /></Link>
            <span className="text-xs font-bold text-ink-muted uppercase tracking-widest truncate">
              Curriculum desk
            </span>
          </div>
          {/* The two desks are reviewed in the same sitting, so each links to
              the other rather than making you go via the dashboard. */}
          <Link href="/desk/newsroom"
            className="shrink-0 text-sm font-semibold text-ink-muted hover:text-ink transition-colors">
            Newsroom desk →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <CurriculumDeskClient />
      </main>
    </div>
  );
}
