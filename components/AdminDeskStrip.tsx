import Link from "next/link";
import { Newspaper, BookOpenCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

// ═══════════════════════════════════════════════════════════════════════════════
// Admin-only strip on the dashboard: the two review queues, with live counts.
//
// Renders NOTHING for a normal learner — the check is on the session user, not
// on a prop or a query string, so it cannot be spoofed into appearing. Counts
// are read with the service role only after that check passes, because neither
// table has a public read policy.
//
// It exists because both queues are worthless if nobody remembers to look at
// them. The dashboard is the page the owner already opens; a number sitting on
// it is the difference between a daily habit and an agent quietly filling a
// table nobody reads.
// ═══════════════════════════════════════════════════════════════════════════════

export async function AdminDeskStrip() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;

  const admin = createAdminClient();
  const [drafts, findings] = await Promise.all([
    admin.from("news_articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
    admin.from("curriculum_findings").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const draftCount = drafts.count ?? 0;
  const findingCount = findings.count ?? 0;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5">
      <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        Review queues
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <DeskLink
          href="/desk/newsroom"
          icon={<Newspaper className="h-4 w-4" aria-hidden />}
          label="Newsroom"
          count={draftCount}
          noun="story"
        />
        <DeskLink
          href="/desk/curriculum"
          icon={<BookOpenCheck className="h-4 w-4" aria-hidden />}
          label="Curriculum currency"
          count={findingCount}
          noun="finding"
        />
      </div>
    </div>
  );
}

function DeskLink({ href, icon, label, count, noun }: {
  href: string; icon: React.ReactNode; label: string; count: number; noun: string;
}) {
  const waiting = count > 0;
  return (
    <Link href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition-colors hover:border-brand/40 hover:bg-brand/[0.04]">
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${waiting ? "bg-brand/10 text-brand" : "bg-slate-200/70 text-slate-500"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-slate-900 leading-tight">{label}</span>
        <span className="block text-[12px] text-slate-500 leading-tight mt-0.5">
          {waiting
            ? `${count} ${noun}${count === 1 ? "" : "s"} waiting`
            : "Nothing waiting"}
        </span>
      </span>
      {waiting && (
        <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-black tabular-nums text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
