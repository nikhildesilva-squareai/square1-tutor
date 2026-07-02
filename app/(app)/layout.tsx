import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  // Ensure community profile exists for this user
  await ensureCommunityProfile();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      {/* Desktop sidebar — hidden on mobile/tablet */}
      <SidebarNav userEmail={email} userId={userId} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile/tablet header + slide-over drawer (hidden on lg+) */}
        <MobileNav userEmail={email} />

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
