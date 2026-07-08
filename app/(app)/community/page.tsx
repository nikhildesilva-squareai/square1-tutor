import { Suspense } from "react";
import { CommunityDiscoveryClient } from "@/components/CommunityDiscoveryClient";

export const metadata = {
  title: "Community · Square 1 AI",
  description: "Connect with other learners, start projects, and build together.",
};

export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityDiscoveryLoading />}>
      <CommunityDiscoveryClient />
    </Suspense>
  );
}

function CommunityDiscoveryLoading() {
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100%" }}>
      <div className="mx-auto w-full px-6 lg:px-10 pt-8 pb-24" style={{ maxWidth: 1296 }}>
        <div className="rounded-2xl mb-10 animate-pulse" style={{ height: 240, background: "#EEF2F7", border: "1px solid #E8EEF5" }} />
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl overflow-hidden" style={{ border: "1px solid #E8EEF5", background: "#FFF" }}>
              <div style={{ height: 132, background: "#EEF2F7" }} />
              <div className="p-6 space-y-3">
                <div className="h-4 rounded w-1/3" style={{ background: "#EEF2F7" }} />
                <div className="h-5 rounded w-3/4" style={{ background: "#EEF2F7" }} />
                <div className="h-10 rounded-lg" style={{ background: "#F1F5F9" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
