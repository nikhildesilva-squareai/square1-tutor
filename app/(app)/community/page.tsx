import { Suspense } from "react";
import { CommunityDiscoveryClient } from "@/components/CommunityDiscoveryClient";

export const metadata = {
  title: "Community · Square 1 AI",
  description: "Connect with other learners, start projects, and build together.",
};

export default function CommunityPage() {
  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black text-ink">Community</h1>
            <p className="text-sm text-ink-muted">Connect with peers, share ideas, and build together</p>
          </div>
        </div>
      </div>

      {/* Suspense boundary for the discovery client */}
      <Suspense fallback={<CommunityDiscoveryLoading />}>
        <CommunityDiscoveryClient />
      </Suspense>
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
