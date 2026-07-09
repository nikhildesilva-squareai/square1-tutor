"use client";

// Dev-only preview of the community discovery hero. 404 in production.
import { notFound } from "next/navigation";
import { CommunityDiscoveryClient } from "@/components/CommunityDiscoveryClient";

export default function CommunityHeroPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-surface-soft px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <CommunityDiscoveryClient />
      </div>
    </div>
  );
}
