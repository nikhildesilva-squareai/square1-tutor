import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CommunityDiscoveryClient } from "@/components/CommunityDiscoveryClient";

export const metadata = {
  title: "Community · Square 1 AI",
  description: "Connect with other learners, start projects, and build together.",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Navigation */}
      <div className="border-b border-border">
        <div className="px-4 sm:px-6 py-4 max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Discover communities</h1>
            <p className="text-sm text-ink-muted">Time table or create your own</p>
          </div>

          {/* User Profile Section */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-ink text-sm">{user.email?.split("@")[0]}</p>
                <p className="text-xs text-ink-muted">{user.email}</p>
              </div>
              <button className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-ink-muted text-sm">
                Profile
              </button>
              <button className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-ink-muted text-sm">
                Payment
              </button>
              <button className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-ink-muted text-sm">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full">
        <Suspense fallback={<CommunityDiscoveryLoading />}>
          <CommunityDiscoveryClient />
        </Suspense>
      </div>
    </div>
  );
}

function CommunityDiscoveryLoading() {
  return (
    <div className="space-y-6">
      {/* Search skeleton */}
      <div className="h-10 rounded-lg bg-surface-alt animate-pulse" />

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-surface border border-border space-y-3">
            <div className="h-6 rounded bg-surface-alt animate-pulse" />
            <div className="h-4 rounded bg-surface-alt animate-pulse w-3/4" />
            <div className="h-4 rounded bg-surface-alt animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
