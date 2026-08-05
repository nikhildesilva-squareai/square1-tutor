import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { ensureCommunityProfile } from "@/lib/community/ensure-profile";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/MobileNav";
import { BottomNav } from "@/components/BottomNav";
import { QuickNotePanel } from "@/components/QuickNotePanel";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { CommunityOnboardingToast } from "@/components/CommunityOnboardingToast";
import { COMMUNITY_ENABLED } from "@/lib/flags";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// ─── The one public window into the app group ─────────────────────────────────
// The course catalogue is the strongest thing we have to be found for, and it
// was invisible: /courses and /courses/{slug} 307'd to /login, so no crawler or
// answer engine could see a single course. Both pages were ALREADY written to
// render without a session (`user ? … : null`, and every lesson resolves to
// "locked" when there is no student), so opening them needs no rewrite.
//
// The window is deliberately depth-limited to exactly two segments:
//
//   /courses                    → public   (catalogue)
//   /courses/data-science       → public   (course overview, lesson TITLES only)
//   /courses/data-science/plan  → GATED    (and everything else deeper)
//
// That precision is load-bearing. The deeper routes — assess, checkout, plan,
// reassess, report, schedule — include client components with NO server-side
// auth check of their own; they inherit this layout's gate and nothing else.
// A prefix match instead of a length check would expose all of them.
function isPublicCatalogue(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] === "courses" && segments.length <= 2;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    if (!isPublicCatalogue(pathname)) {
      redirect("/login");
    }
    // Signed-out catalogue browsing: plain public chrome, matching /roles and
    // /tools. No sidebar, no note panel, no community profile creation, and no
    // country onboarding gate — all of those assume a student exists.
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/"><Logo variant="dark" size="md" /></Link>
          <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900">
            Sign in
          </Link>
        </header>
        <main id="main" className="flex-1">{children}</main>
      </div>
    );
  }

  const email = session.user.email ?? "";
  const userId = session.user.id;
  // Team members (ADMIN_EMAILS) get a link to the production support inbox.
  const isAdmin = isAdminEmail(email);

  // Ensure community profile exists for this user
  await ensureCommunityProfile();

  // Onboarding gate: every student must record their country before using the
  // app. This one server-side choke point covers BOTH signup methods (email/OTP
  // and Google OAuth), so no country is ever missed. Fails open on a fetch error
  // (never lock a paying user out over a transient DB blip).
  let student: { id: string; name: string | null; country: string | null } | null = null;
  let fetchedOk = true;
  try {
    const { data, error } = await supabase
      .from("students").select("id, name, country").eq("user_id", userId).maybeSingle();
    if (error) fetchedOk = false;
    student = data;
  } catch {
    fetchedOk = false;
  }
  if (fetchedOk && (!student || !student.country)) {
    // Carry the intended destination through the country step, so a new signup
    // heading for their first lesson comes back to it instead of /dashboard.
    const path = (await headers()).get("x-pathname");
    redirect(path && path.startsWith("/") && !path.startsWith("//")
      ? `/welcome?next=${encodeURIComponent(path)}`
      : "/welcome");
  }

  // Team managers get a "Manager portal" nav entry — without it there is no
  // path back to /business/dashboard from inside the app.
  let isManager = false;
  const userName = student?.name ?? "";
  if (student) {
    try {
      const { data: mgr } = await createAdminClient()
        .from("org_members").select("id").eq("student_id", student.id).eq("role", "manager").maybeSingle();
      isManager = !!mgr;
    } catch {
      /* nav extra only — never block the app shell on this */
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-soft">
      {/* Desktop sidebar — hidden on mobile/tablet */}
      <SidebarNav userEmail={email} userName={userName} userId={userId} isManager={isManager} isAdmin={isAdmin} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile/tablet header + slide-over drawer (hidden on lg+) */}
        <MobileNav userEmail={email} userName={userName} isManager={isManager} isAdmin={isAdmin} />

        <main id="main" className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar — hidden on desktop */}
        <BottomNav />
      </div>

      {/* Floating quick-note panel — available everywhere */}
      <QuickNotePanel />

      {/* Persistent in-app feedback launcher (bottom-left) */}
      <FeedbackWidget />

      {/* Community onboarding toast — shows on first login (hidden while the
          Community section is disabled for launch) */}
      {COMMUNITY_ENABLED && <CommunityOnboardingToast />}
    </div>
  );
}
