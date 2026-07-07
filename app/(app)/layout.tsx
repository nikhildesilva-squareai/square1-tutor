import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { ensureCommunityProfile } from "@/lib/community/ensure-profile";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/MobileNav";
import { BottomNav } from "@/components/BottomNav";
import { QuickNotePanel } from "@/components/QuickNotePanel";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { CommunityOnboardingToast } from "@/components/CommunityOnboardingToast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const email = session.user.email ?? "";
  const userId = session.user.id;
  // Team members (ADMIN_EMAILS) get a link to the production support inbox.
  const isAdmin = isAdminEmail(email);

  // Ensure community profile exists for this user
  await ensureCommunityProfile();

  // Team managers get a "Manager portal" nav entry — without it there is no
  // path back to /business/dashboard from inside the app.
  let isManager = false;
  try {
    const { data: student } = await supabase.from("students").select("id").eq("user_id", userId).maybeSingle();
    if (student) {
      const { data: mgr } = await createAdminClient()
        .from("org_members").select("id").eq("student_id", student.id).eq("role", "manager").maybeSingle();
      isManager = !!mgr;
    }
  } catch {
    /* nav extra only — never block the app shell on this */
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      {/* Desktop sidebar — hidden on mobile/tablet */}
      <SidebarNav userEmail={email} userId={userId} isManager={isManager} isAdmin={isAdmin} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile/tablet header + slide-over drawer (hidden on lg+) */}
        <MobileNav userEmail={email} isManager={isManager} isAdmin={isAdmin} />

        <main id="main" className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar — hidden on desktop */}
        <BottomNav />
      </div>

      {/* Floating quick-note panel — available everywhere */}
      <QuickNotePanel />

      {/* Persistent in-app feedback launcher (bottom-left) */}
      <FeedbackWidget />

      {/* Community onboarding toast — shows on first login */}
      <CommunityOnboardingToast />
    </div>
  );
}
